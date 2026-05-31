use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::Serialize;

use crate::models::{AppConfig, ManagedApp, TriggerMode};
use crate::monitor::{Monitor, MonitorEvent};
use crate::watchdog::{Watchdog, WatchdogEvent};
use crate::{launcher, process_killer};

// ── Log ───────────────────────────────────────────────────────────────────────

const MAX_LOG_ENTRIES: usize = 200;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum LogKind {
    Launch,
    Stop,
    IracingStart,
    IracingStop,
}

#[derive(Debug, Clone, Serialize)]
pub struct LogEntry {
    pub seq: u64,
    pub timestamp_ms: u64,
    pub kind: LogKind,
    pub app: Option<String>,
    pub msg: String,
}

pub struct LogSink {
    log: Mutex<Vec<LogEntry>>,
    seq: AtomicU64,
    on_entry: Box<dyn Fn(LogEntry) + Send + Sync>,
}

impl LogSink {
    fn push(&self, kind: LogKind, app: Option<String>, msg: String) {
        let s = self.seq.fetch_add(1, Ordering::Relaxed);
        let ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;
        let entry = LogEntry {
            seq: s,
            timestamp_ms: ts,
            kind,
            app,
            msg,
        };
        let mut log = self.log.lock().unwrap();
        log.push(entry.clone());
        if log.len() > MAX_LOG_ENTRIES {
            let excess = log.len() - MAX_LOG_ENTRIES;
            log.drain(..excess);
        }
        drop(log);
        (self.on_entry)(entry);
    }

    pub fn entries(&self) -> Vec<LogEntry> {
        self.log.lock().unwrap().clone()
    }
}

const DEFAULT_GRACE_SECS: f64 = 2.0;

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
        Self {
            states: HashMap::new(),
        }
    }

    pub fn on_app_launched(&mut self, app_id: &str, pid: u32) {
        self.states.insert(
            app_id.to_string(),
            AppState::Running {
                pid,
                restart_count: 0,
            },
        );
    }

    pub fn on_app_stopped(&mut self, app_id: &str) {
        self.states.insert(app_id.to_string(), AppState::Idle);
    }

    pub fn on_app_restarted(&mut self, app_id: &str, new_pid: u32, attempt: u32) {
        self.states.insert(
            app_id.to_string(),
            AppState::Running {
                pid: new_pid,
                restart_count: attempt,
            },
        );
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
                if *state == AppState::Crashed {
                    Some(id.clone())
                } else {
                    None
                }
            })
            .collect()
    }
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

/// Returns enabled apps from the slice — those to launch on iRacing start.
pub fn apps_to_launch(apps: &[ManagedApp]) -> Vec<&ManagedApp> {
    apps.iter().filter(|a| a.enabled).collect()
}

/// Dispatches to the right kill strategy based on the app's configuration.
fn kill_app(app: &ManagedApp, grace_secs: f64) {
    if let Some(ref name) = app.track_process_name {
        process_killer::kill_by_name(name, grace_secs);
    } else if app.kill_process_tree {
        process_killer::kill_tree_by_exe_path(&app.exe_path, grace_secs);
    } else {
        process_killer::kill_by_exe_path(&app.exe_path, grace_secs);
    }
}

// ── Controller ────────────────────────────────────────────────────────────────

pub struct Controller {
    logic: Arc<Mutex<ControllerLogic>>,
    watchdog: Arc<Watchdog>,
    config: Arc<Mutex<AppConfig>>,
    iracing_online: Arc<AtomicBool>,
    auto_stop: Arc<AtomicBool>,
    sink: Arc<LogSink>,
    _monitor: std::sync::OnceLock<Monitor>,
}

impl Controller {
    /// Starts the controller: wires Monitor → launch/kill, Watchdog → state updates.
    /// `on_status(true)` is called when iRacing starts; `on_status(false)` when it stops.
    /// Returns an `Arc<Controller>` ready to be stored as Tauri state.
    pub fn get_log(&self) -> Vec<LogEntry> {
        self.sink.entries()
    }

    pub fn get_auto_stop(&self) -> bool {
        self.auto_stop.load(Ordering::Relaxed)
    }

    pub fn set_auto_stop(&self, enabled: bool) {
        self.auto_stop.store(enabled, Ordering::Relaxed);
    }

    pub fn start(
        config: Arc<Mutex<AppConfig>>,
        trigger: TriggerMode,
        poll_interval: f64,
        on_status: impl Fn(bool) + Send + 'static,
        on_log: impl Fn(LogEntry) + Send + Sync + 'static,
    ) -> Arc<Self> {
        let iracing_online = Arc::new(AtomicBool::new(false));
        let auto_stop = Arc::new(AtomicBool::new(true));
        let (watchdog, watchdog_rx) = Watchdog::new();
        let sink = Arc::new(LogSink {
            log: Mutex::new(Vec::new()),
            seq: AtomicU64::new(0),
            on_entry: Box::new(on_log),
        });
        let ctrl = Arc::new(Self {
            logic: Arc::new(Mutex::new(ControllerLogic::new())),
            watchdog: Arc::new(watchdog),
            config,
            iracing_online: Arc::clone(&iracing_online),
            auto_stop: Arc::clone(&auto_stop),
            sink,
            _monitor: std::sync::OnceLock::new(),
        });

        // Thread: consume watchdog events and update logic state
        let ctrl_wd = Arc::clone(&ctrl);
        thread::spawn(move || {
            for event in watchdog_rx {
                match event {
                    WatchdogEvent::Restarted {
                        app_id,
                        new_pid,
                        attempt,
                    } => {
                        ctrl_wd
                            .logic
                            .lock()
                            .unwrap()
                            .on_app_restarted(&app_id, new_pid, attempt);
                    }
                    WatchdogEvent::GaveUp { app_id } | WatchdogEvent::RestartFailed { app_id } => {
                        ctrl_wd.logic.lock().unwrap().on_app_gave_up(&app_id);
                    }
                }
            }
        });

        // Monitor callback — spawns threads so the monitor is never blocked
        let ctrl_mon = Arc::clone(&ctrl);
        let monitor = Monitor::start(trigger, poll_interval, move |event| match event {
            MonitorEvent::Started => {
                iracing_online.store(true, Ordering::Relaxed);
                on_status(true);
                let c = Arc::clone(&ctrl_mon);
                c.sink
                    .push(LogKind::IracingStart, None, "iRacing detected".into());
                thread::spawn(move || c.launch_active_apps());
            }
            MonitorEvent::Stopped => {
                iracing_online.store(false, Ordering::Relaxed);
                on_status(false);
                let c = Arc::clone(&ctrl_mon);
                c.sink
                    .push(LogKind::IracingStop, None, "iRacing closed".into());
                if auto_stop.load(Ordering::Relaxed) {
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

    /// Returns the current state of a single app.
    pub fn app_state(&self, app_id: &str) -> AppState {
        self.logic.lock().unwrap().app_state(app_id)
    }

    // ── iRacing lifecycle ─────────────────────────────────────────────────────

    pub fn launch_active_apps(&self) {
        let apps: Vec<ManagedApp> = {
            let config = self.config.lock().unwrap();
            let profile_id = &config.active_profile_id.clone();
            let all = apps_to_launch(&config.apps);
            #[cfg(debug_assertions)]
            println!(
                "[controller] iRacing started — profile={profile_id} apps={}",
                all.len()
            );
            all.into_iter()
                .filter(|a| &a.profile_id == profile_id)
                .cloned()
                .collect()
        };

        for app in apps {
            if matches!(
                self.logic.lock().unwrap().app_state(&app.id),
                AppState::Running { .. }
            ) {
                #[cfg(debug_assertions)]
                println!("[controller] skipping '{}' — already running", app.name);
                continue;
            }

            let logic = Arc::clone(&self.logic);
            let watchdog = Arc::clone(&self.watchdog);
            let sink = Arc::clone(&self.sink);

            thread::spawn(move || {
                if app.startup_delay_secs > 0.0 {
                    thread::sleep(Duration::from_secs_f64(app.startup_delay_secs));
                }
                #[cfg(debug_assertions)]
                println!("[controller] launching '{}'", app.name);
                match launcher::launch(&app) {
                    Ok(stub_pid) => {
                        let pid = launcher::resolve_real_pid(stub_pid, &app);
                        #[cfg(debug_assertions)]
                        println!("[controller] '{}' pid={pid}", app.name);
                        watchdog.watch(app.clone(), pid);
                        logic.lock().unwrap().on_app_launched(&app.id, pid);
                        sink.push(
                            LogKind::Launch,
                            Some(app.name.clone()),
                            format!("pid {pid}"),
                        );
                    }
                    Err(e) => {
                        #[cfg(debug_assertions)]
                        eprintln!("[controller] FAILED to launch '{}': {e}", app.name);
                        sink.push(
                            LogKind::Launch,
                            Some(app.name.clone()),
                            format!("FAILED: {e}"),
                        );
                    }
                }
            });
        }
    }

    pub fn kill_all_running(&self) {
        let ids_to_kill: Vec<String> = {
            let logic = self.logic.lock().unwrap();
            let config = self.config.lock().unwrap();
            let should_stop = |id: &str| -> bool {
                config
                    .apps
                    .iter()
                    .find(|a| a.id == id)
                    .map(|a| a.stop_with_iracing)
                    .unwrap_or(true)
            };
            let mut ids: Vec<String> = logic
                .running_apps()
                .into_iter()
                .map(|(id, _)| id)
                .filter(|id| should_stop(id))
                .collect();
            // Also kill Crashed apps — stub may have exited (Squirrel) while real process runs.
            ids.extend(
                logic
                    .crashed_app_ids()
                    .into_iter()
                    .filter(|id| should_stop(id)),
            );
            ids
        };

        let handles: Vec<_> = ids_to_kill
            .iter()
            .filter_map(|app_id| {
                self.watchdog.unwatch(app_id);

                let app = self
                    .config
                    .lock()
                    .unwrap()
                    .apps
                    .iter()
                    .find(|a| a.id == *app_id)
                    .cloned()?;
                let sink = Arc::clone(&self.sink);

                Some(thread::spawn(move || {
                    let grace = if app.force_kill_on_stop { 0.0 } else { DEFAULT_GRACE_SECS };
                    kill_app(&app, grace);
                    sink.push(LogKind::Stop, Some(app.name.clone()), String::new());
                }))
            })
            .collect();

        for h in handles {
            let _ = h.join();
        }

        for app_id in &ids_to_kill {
            self.logic.lock().unwrap().on_app_stopped(app_id);
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

        if matches!(
            self.logic.lock().unwrap().app_state(app_id),
            AppState::Running { .. }
        ) {
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
        if !matches!(
            self.logic.lock().unwrap().app_state(app_id),
            AppState::Running { .. }
        ) {
            return;
        }
        self.watchdog.unwatch(app_id);

        if let Some(app) = self
            .config
            .lock()
            .unwrap()
            .apps
            .iter()
            .find(|a| a.id == app_id)
            .cloned()
        {
            kill_app(&app, DEFAULT_GRACE_SECS);
            self.sink
                .push(LogKind::Stop, Some(app.name.clone()), String::new());
        }

        self.logic.lock().unwrap().on_app_stopped(app_id);
    }
}

#[cfg(test)]
#[path = "controller_test.rs"]
mod tests;

