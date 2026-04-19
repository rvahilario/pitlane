use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

use serde::Serialize;

use crate::models::{AppConfig, ManagedApp, TriggerMode};
use crate::monitor::{Monitor, MonitorEvent};
use crate::watchdog::{Watchdog, WatchdogEvent};
use crate::{launcher, process_killer};

const DEFAULT_GRACE_SECS: f64 = 5.0;

// ── App state ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AppState {
    Idle,
    Running { pid: u32, restart_count: u32 },
    Crashed,
}

#[derive(Debug, Clone, Serialize)]
pub struct AppStatus {
    pub app_id: String,
    pub name: String,
    pub state: AppState,
}

// ── Pure state machine ────────────────────────────────────────────────────────

pub struct ControllerLogic {
    states: HashMap<String, AppState>,
}

impl ControllerLogic {
    pub fn new() -> Self {
        Self { states: HashMap::new() }
    }

    pub fn on_app_launched(&mut self, app_id: &str, pid: u32) {
        self.states.insert(app_id.to_string(), AppState::Running { pid, restart_count: 0 });
    }

    pub fn on_app_stopped(&mut self, app_id: &str) {
        self.states.insert(app_id.to_string(), AppState::Idle);
    }

    pub fn on_app_restarted(&mut self, app_id: &str, new_pid: u32, attempt: u32) {
        self.states.insert(app_id.to_string(), AppState::Running { pid: new_pid, restart_count: attempt });
    }

    pub fn on_app_gave_up(&mut self, app_id: &str) {
        self.states.insert(app_id.to_string(), AppState::Crashed);
    }

    pub fn app_state(&self, app_id: &str) -> AppState {
        self.states.get(app_id).cloned().unwrap_or(AppState::Idle)
    }

    pub fn running_apps(&self) -> Vec<(String, u32)> {
        self.states
            .iter()
            .filter_map(|(id, state)| {
                if let AppState::Running { pid, .. } = state {
                    Some((id.clone(), *pid))
                } else {
                    None
                }
            })
            .collect()
    }

    /// IDs of apps that were launched but are now in Crashed state
    /// (e.g. Squirrel stub exited, real process running under a different PID).
    pub fn crashed_app_ids(&self) -> Vec<String> {
        self.states
            .iter()
            .filter_map(|(id, state)| {
                if *state == AppState::Crashed { Some(id.clone()) } else { None }
            })
            .collect()
    }
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

/// Returns enabled apps from the slice — those to launch on iRacing start.
pub fn apps_to_launch(apps: &[ManagedApp]) -> Vec<&ManagedApp> {
    apps.iter().filter(|a| a.enabled).collect()
}

// ── Controller ────────────────────────────────────────────────────────────────

pub struct Controller {
    logic: Arc<Mutex<ControllerLogic>>,
    watchdog: Arc<Watchdog>,
    config: Arc<Mutex<AppConfig>>,
    iracing_online: Arc<std::sync::atomic::AtomicBool>,
    _monitor: std::sync::OnceLock<Monitor>,
}

impl Controller {
    /// Starts the controller: wires Monitor → launch/kill, Watchdog → state updates.
    /// `on_status(true)` is called when iRacing starts; `on_status(false)` when it stops.
    /// Returns an `Arc<Controller>` ready to be stored as Tauri state.
    pub fn start(
        config: Arc<Mutex<AppConfig>>,
        trigger: TriggerMode,
        poll_interval: f64,
        on_status: impl Fn(bool) + Send + 'static,
    ) -> Arc<Self> {
        let iracing_online = Arc::new(AtomicBool::new(false));
        let (watchdog, watchdog_rx) = Watchdog::new();
        let ctrl = Arc::new(Self {
            logic: Arc::new(Mutex::new(ControllerLogic::new())),
            watchdog: Arc::new(watchdog),
            config,
            iracing_online: Arc::clone(&iracing_online),
            _monitor: std::sync::OnceLock::new(),
        });

        // Thread: consume watchdog events and update logic state
        let ctrl_wd = Arc::clone(&ctrl);
        thread::spawn(move || {
            for event in watchdog_rx {
                match event {
                    WatchdogEvent::Restarted { app_id, new_pid, attempt } => {
                        ctrl_wd.logic.lock().unwrap().on_app_restarted(&app_id, new_pid, attempt);
                    }
                    WatchdogEvent::GaveUp { app_id } | WatchdogEvent::RestartFailed { app_id } => {
                        ctrl_wd.logic.lock().unwrap().on_app_gave_up(&app_id);
                    }
                }
            }
        });

        // Monitor callback — spawns threads so the monitor is never blocked
        let ctrl_mon = Arc::clone(&ctrl);
        let monitor = Monitor::start(trigger, poll_interval, move |event| {
            match event {
                MonitorEvent::Started => {
                    iracing_online.store(true, Ordering::Relaxed);
                    on_status(true);
                    let c = Arc::clone(&ctrl_mon);
                    thread::spawn(move || c.launch_active_apps());
                }
                MonitorEvent::Stopped => {
                    iracing_online.store(false, Ordering::Relaxed);
                    on_status(false);
                    let c = Arc::clone(&ctrl_mon);
                    thread::spawn(move || c.kill_all_running());
                }
            }
        });
        // Keep the monitor alive for the lifetime of the controller
        let _ = ctrl._monitor.set(monitor);

        ctrl
    }

    pub fn is_iracing_online(&self) -> bool {
        self.iracing_online.load(Ordering::Relaxed)
    }

    // ── iRacing lifecycle ─────────────────────────────────────────────────────

    pub(crate) fn launch_active_apps(&self) {
        let apps: Vec<ManagedApp> = {
            let config = self.config.lock().unwrap();
            let profile_id = &config.active_profile_id.clone();
            let all = apps_to_launch(&config.apps);
            println!("[controller] iRacing started — active_profile={profile_id}, enabled_apps={}", all.len());
            let filtered: Vec<ManagedApp> = all
                .into_iter()
                .filter(|a| &a.profile_id == profile_id)
                .cloned()
                .collect();
            println!("[controller] apps to launch for profile: {}", filtered.iter().map(|a| a.name.as_str()).collect::<Vec<_>>().join(", "));
            filtered
        };

        if apps.is_empty() {
            println!("[controller] no apps to launch (list empty or all already running)");
        }

        for app in apps {
            // Skip if already running (e.g. manual launch before iRacing started)
            if matches!(
                self.logic.lock().unwrap().app_state(&app.id),
                AppState::Running { .. }
            ) {
                println!("[controller] skipping '{}' — already running", app.name);
                continue;
            }

            println!("[controller] spawning launch thread for '{}'", app.name);
            let logic = Arc::clone(&self.logic);
            let watchdog = Arc::clone(&self.watchdog);

            thread::spawn(move || {
                if app.startup_delay_secs > 0.0 {
                    println!("[controller] '{}' delay={:.1}s", app.name, app.startup_delay_secs);
                    thread::sleep(Duration::from_secs_f64(app.startup_delay_secs));
                }
                println!("[controller] launching '{}' at '{}'", app.name, app.exe_path);
                match launcher::launch(&app) {
                    Ok(stub_pid) => {
                        println!("[controller] '{}' stub_pid={stub_pid}", app.name);
                        let pid = launcher::resolve_real_pid(stub_pid, &app);
                        println!("[controller] '{}' resolved pid={pid}", app.name);
                        watchdog.watch(app.clone(), pid);
                        logic.lock().unwrap().on_app_launched(&app.id, pid);
                    }
                    Err(e) => eprintln!("[controller] FAILED to launch '{}': {e}", app.name),
                }
            });
        }
    }

    pub(crate) fn kill_all_running(&self) {
        // Log all app states at kill time to diagnose tracking issues
        {
            let logic = self.logic.lock().unwrap();
            let config = self.config.lock().unwrap();
            for app in &config.apps {
                if app.profile_id == config.active_profile_id {
                    println!("[controller] kill_all_running state: '{}' = {:?}", app.name, logic.app_state(&app.id));
                }
            }
        }

        let ids_to_kill: Vec<String> = {
            let logic = self.logic.lock().unwrap();
            let mut ids: Vec<String> = logic.running_apps().into_iter().map(|(id, _)| id).collect();
            // Also kill Crashed apps — the stub may have exited (e.g. Squirrel) while the
            // real process is still running under a different PID.
            ids.extend(logic.crashed_app_ids());
            ids
        };

        for app_id in ids_to_kill {
            self.watchdog.unwatch(&app_id);

            // Re-resolve at kill time: apps may have relaunched under a new PID since launch
            if let Some(app) = self.config.lock().unwrap().apps.iter().find(|a| a.id == app_id).cloned() {
                let grace = if app.force_kill_on_stop { 0.0 } else { DEFAULT_GRACE_SECS };
                println!("[controller] killing '{}' grace={grace}s tree={}", app.name, app.kill_process_tree);
                if let Some(ref name) = app.track_process_name {
                    process_killer::kill_by_name(name, grace);
                } else if app.kill_process_tree {
                    process_killer::kill_tree_by_exe_path(&app.exe_path, grace);
                } else {
                    process_killer::kill_by_exe_path(&app.exe_path, grace);
                }
            }

            self.logic.lock().unwrap().on_app_stopped(&app_id);
        }
    }

    // ── Public API (for Tauri commands) ───────────────────────────────────────

    /// Current status of all apps in the active profile.
    pub fn app_statuses(&self) -> Vec<AppStatus> {
        let config = self.config.lock().unwrap();
        let logic = self.logic.lock().unwrap();
        config
            .apps
            .iter()
            .filter(|a| a.profile_id == config.active_profile_id)
            .map(|a| AppStatus {
                app_id: a.id.clone(),
                name: a.name.clone(),
                state: logic.app_state(&a.id),
            })
            .collect()
    }

    /// Manually launches an app regardless of iRacing state.
    pub fn force_launch(&self, app_id: &str) -> Result<(), String> {
        let app = {
            let config = self.config.lock().unwrap();
            config.apps.iter().find(|a| a.id == app_id).cloned()
        };
        let app = app.ok_or_else(|| format!("App not found: {app_id}"))?;

        if matches!(self.logic.lock().unwrap().app_state(app_id), AppState::Running { .. }) {
            return Ok(());
        }

        let stub_pid = launcher::launch(&app).map_err(|e| e.to_string())?;
        let pid = launcher::resolve_real_pid(stub_pid, &app);
        self.watchdog.watch(app.clone(), pid);
        self.logic.lock().unwrap().on_app_launched(app_id, pid);
        Ok(())
    }

    /// Manually kills an app and stops watching it.
    pub fn force_kill(&self, app_id: &str) {
        if !matches!(self.logic.lock().unwrap().app_state(app_id), AppState::Running { .. }) {
            return;
        }
        self.watchdog.unwatch(app_id);

        if let Some(app) = self.config.lock().unwrap().apps.iter().find(|a| a.id == app_id).cloned() {
            if let Some(ref name) = app.track_process_name {
                process_killer::kill_by_name(name, DEFAULT_GRACE_SECS);
            } else {
                process_killer::kill_by_exe_path(&app.exe_path, DEFAULT_GRACE_SECS);
            }
        }

        self.logic.lock().unwrap().on_app_stopped(app_id);
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::ManagedApp;

    // ── apps_to_launch ────────────────────────────────────────────────────────

    #[test]
    fn should_return_only_enabled_apps() {
        let mut a = ManagedApp::new("p1", "SimHub", "SimHub.exe");
        let mut b = ManagedApp::new("p1", "CrewChief", "CrewChief.exe");
        let c = ManagedApp::new("p1", "VoiceAttack", "VoiceAttack.exe");
        a.enabled = false;
        b.enabled = true;
        // c.enabled is true by default

        let apps = [a, b, c];
        let result = apps_to_launch(&apps);
        assert_eq!(result.len(), 2);
        assert!(result.iter().all(|a| a.enabled));
    }

    #[test]
    fn should_return_empty_when_all_apps_disabled() {
        let mut a = ManagedApp::new("p1", "SimHub", "SimHub.exe");
        a.enabled = false;
        assert!(apps_to_launch(&[a]).is_empty());
    }

    #[test]
    fn should_return_empty_for_empty_input() {
        assert!(apps_to_launch(&[]).is_empty());
    }

    #[test]
    fn should_return_all_when_all_enabled() {
        let apps = vec![
            ManagedApp::new("p1", "SimHub", "SimHub.exe"),
            ManagedApp::new("p1", "CrewChief", "CrewChief.exe"),
        ];
        assert_eq!(apps_to_launch(&apps).len(), 2);
    }

    // ── ControllerLogic: default state ────────────────────────────────────────

    #[test]
    fn should_default_to_idle_for_unknown_app() {
        let logic = ControllerLogic::new();
        assert_eq!(logic.app_state("ghost"), AppState::Idle);
    }

    // ── ControllerLogic: launch ───────────────────────────────────────────────

    #[test]
    fn should_transition_to_running_on_launch() {
        let mut logic = ControllerLogic::new();
        logic.on_app_launched("app1", 1234);
        assert_eq!(logic.app_state("app1"), AppState::Running { pid: 1234, restart_count: 0 });
    }

    #[test]
    fn should_have_zero_restart_count_after_initial_launch() {
        let mut logic = ControllerLogic::new();
        logic.on_app_launched("app1", 1234);
        assert_eq!(logic.app_state("app1"), AppState::Running { pid: 1234, restart_count: 0 });
    }

    // ── ControllerLogic: stop ─────────────────────────────────────────────────

    #[test]
    fn should_transition_to_idle_on_stop() {
        let mut logic = ControllerLogic::new();
        logic.on_app_launched("app1", 1234);
        logic.on_app_stopped("app1");
        assert_eq!(logic.app_state("app1"), AppState::Idle);
    }

    #[test]
    fn should_stay_idle_when_stopping_a_not_running_app() {
        let mut logic = ControllerLogic::new();
        logic.on_app_stopped("app1");
        assert_eq!(logic.app_state("app1"), AppState::Idle);
    }

    // ── ControllerLogic: restart ──────────────────────────────────────────────

    #[test]
    fn should_update_pid_and_count_on_restart() {
        let mut logic = ControllerLogic::new();
        logic.on_app_launched("app1", 1000);
        logic.on_app_restarted("app1", 2000, 1);
        assert_eq!(logic.app_state("app1"), AppState::Running { pid: 2000, restart_count: 1 });
    }

    #[test]
    fn should_accumulate_restart_count_across_multiple_restarts() {
        let mut logic = ControllerLogic::new();
        logic.on_app_launched("app1", 1000);
        logic.on_app_restarted("app1", 2000, 1);
        logic.on_app_restarted("app1", 3000, 2);
        assert_eq!(logic.app_state("app1"), AppState::Running { pid: 3000, restart_count: 2 });
    }

    // ── ControllerLogic: gave up ──────────────────────────────────────────────

    #[test]
    fn should_transition_to_crashed_on_gave_up() {
        let mut logic = ControllerLogic::new();
        logic.on_app_launched("app1", 1234);
        logic.on_app_gave_up("app1");
        assert_eq!(logic.app_state("app1"), AppState::Crashed);
    }

    #[test]
    fn should_recover_from_crashed_to_running_on_relaunch() {
        let mut logic = ControllerLogic::new();
        logic.on_app_gave_up("app1");
        logic.on_app_launched("app1", 5678);
        assert_eq!(logic.app_state("app1"), AppState::Running { pid: 5678, restart_count: 0 });
    }

    // ── ControllerLogic: running_apps ─────────────────────────────────────────

    #[test]
    fn should_return_only_running_app_pids() {
        let mut logic = ControllerLogic::new();
        logic.on_app_launched("app1", 100);
        logic.on_app_launched("app2", 200);
        logic.on_app_stopped("app1");

        let running = logic.running_apps();
        assert_eq!(running.len(), 1);
        assert_eq!(running[0], ("app2".to_string(), 200));
    }

    #[test]
    fn should_return_empty_running_apps_when_none_active() {
        let logic = ControllerLogic::new();
        assert!(logic.running_apps().is_empty());
    }

    // ── ControllerLogic: state isolation ──────────────────────────────────────

    #[test]
    fn should_track_multiple_apps_independently() {
        let mut logic = ControllerLogic::new();
        logic.on_app_launched("simhub", 100);
        logic.on_app_launched("crewchief", 200);
        logic.on_app_stopped("simhub");

        assert_eq!(logic.app_state("simhub"), AppState::Idle);
        assert_eq!(logic.app_state("crewchief"), AppState::Running { pid: 200, restart_count: 0 });
    }

    // ── E2E integration tests ─────────────────────────────────────────────────
    //
    // Require fixture binaries to be built first:
    //   cargo build --bins --manifest-path src-tauri/Cargo.toml
    //
    // Run with:
    //   cargo test --manifest-path src-tauri/Cargo.toml -- --ignored --nocapture

    fn fixture(name: &str) -> String {
        let dir = env!("CARGO_MANIFEST_DIR");
        format!("{dir}\\target\\debug\\{name}.exe")
    }

    fn make_controller(app: ManagedApp) -> Arc<Controller> {
        use std::sync::{Arc, Mutex};
        let mut config = AppConfig::default();
        let profile_id = config.active_profile_id.clone();
        let mut app = app;
        app.profile_id = profile_id;
        config.apps.push(app);
        Controller::start(Arc::new(Mutex::new(config)), TriggerMode::Ui, 1.0, |_| {})
    }

    #[test]
    #[ignore]
    fn manual_e2e_should_launch_and_kill_dummy_app() {
        let app = ManagedApp::new("p1", "Dummy", fixture("fixture-dummy"));
        let app_id = app.id.clone();
        let ctrl = make_controller(app);

        ctrl.launch_active_apps();
        // resolve_real_pid sleeps 500ms inside the spawned thread; give it margin
        std::thread::sleep(std::time::Duration::from_millis(1500));

        let state = ctrl.logic.lock().unwrap().app_state(&app_id);
        let pid = match state {
            AppState::Running { pid, .. } => { println!("[e2e] launched pid={pid}"); pid }
            other => panic!("[e2e] expected Running, got {other:?}"),
        };

        assert!(process_killer::is_pid_alive(pid), "dummy should be alive");

        ctrl.kill_all_running();
        std::thread::sleep(std::time::Duration::from_millis(500));

        assert!(!process_killer::is_pid_alive(pid), "dummy should be dead after kill");
        assert_eq!(ctrl.logic.lock().unwrap().app_state(&app_id), AppState::Idle);
        println!("[e2e] ✓ launch and kill");
    }

    #[test]
    #[ignore]
    fn manual_e2e_should_skip_already_running_app_on_iracing_start() {
        let app = ManagedApp::new("p1", "Dummy", fixture("fixture-dummy"));
        let app_id = app.id.clone();
        let ctrl = make_controller(app);

        // Simulate user manually launching the app before iRacing starts
        ctrl.force_launch(&app_id).expect("force_launch failed");
        std::thread::sleep(std::time::Duration::from_millis(800));

        let pid_before = match ctrl.logic.lock().unwrap().app_state(&app_id) {
            AppState::Running { pid, .. } => { println!("[e2e] manual launch pid={pid}"); pid }
            other => panic!("[e2e] expected Running after force_launch, got {other:?}"),
        };

        // iRacing starts — should NOT re-launch an already running app
        ctrl.launch_active_apps();
        std::thread::sleep(std::time::Duration::from_millis(800));

        let pid_after = match ctrl.logic.lock().unwrap().app_state(&app_id) {
            AppState::Running { pid, .. } => pid,
            other => panic!("[e2e] expected still Running after launch_active_apps, got {other:?}"),
        };

        assert_eq!(pid_before, pid_after, "PID must not change — app was already running");
        println!("[e2e] ✓ already-running app not re-launched (pid unchanged: {pid_before})");

        ctrl.kill_all_running();
        std::thread::sleep(std::time::Duration::from_millis(500));
        assert!(!process_killer::is_pid_alive(pid_before), "dummy should be dead");
        println!("[e2e] ✓ killed");
    }

    #[test]
    #[ignore]
    fn manual_e2e_should_restart_crashing_app_then_give_up() {
        let mut app = ManagedApp::new("p1", "Crash", fixture("fixture-crash"));
        app.restart_on_crash = true;
        app.max_restart_attempts = 2;
        let app_id = app.id.clone();
        let ctrl = make_controller(app);

        ctrl.launch_active_apps();

        // Watchdog polls every 2s; with 2 restart attempts we need ~3 cycles
        // Wait long enough for all retries to exhaust
        let wait = std::time::Duration::from_secs(10);
        println!("[e2e] waiting {wait:?} for watchdog to exhaust restarts…");
        std::thread::sleep(wait);

        let state = ctrl.logic.lock().unwrap().app_state(&app_id);
        assert_eq!(state, AppState::Crashed, "app should be Crashed after max attempts");
        println!("[e2e] ✓ app reached Crashed state after {attempts} failed restarts",
            attempts = 2);
    }

    #[test]
    #[ignore]
    fn manual_e2e_should_resolve_real_pid_from_stub_launcher() {
        // fixture-stub spawns fixture-dummy then exits immediately.
        // track_process_name tells the controller to find the real process by name.
        let mut app = ManagedApp::new("p1", "Stub", fixture("fixture-stub"));
        app.track_process_name = Some("fixture-dummy.exe".into());
        let app_id = app.id.clone();
        let ctrl = make_controller(app);

        ctrl.launch_active_apps();
        // Give stub time to spawn child and resolve_real_pid to find it
        std::thread::sleep(std::time::Duration::from_millis(1500));

        let pid = match ctrl.logic.lock().unwrap().app_state(&app_id) {
            AppState::Running { pid, .. } => { println!("[e2e] resolved child pid={pid}"); pid }
            other => panic!("[e2e] expected Running with child pid, got {other:?}"),
        };

        // The tracked PID must be fixture-dummy (alive), not fixture-stub (dead)
        assert!(process_killer::is_pid_alive(pid), "resolved pid should be alive (fixture-dummy)");
        assert!(!process_killer::find_pids_by_name("fixture-stub").contains(&pid),
            "tracked pid must not be the stub");

        ctrl.kill_all_running();
        std::thread::sleep(std::time::Duration::from_millis(500));
        assert!(!process_killer::is_pid_alive(pid), "fixture-dummy should be dead after kill");
        println!("[e2e] ✓ stub pid resolved to child, child killed");
    }
}
