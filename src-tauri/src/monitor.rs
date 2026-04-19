use std::io::Write;
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::Duration;

use sysinfo::System;

use crate::config::APP_NAME;
use crate::models::TriggerMode;

const MIN_POLL_INTERVAL_SECS: f64 = 0.25;
const LOG_SAMPLE_EVERY_TICKS: u32 = 10;
const MONITOR_THREAD_NAME: &str = "iracing-monitor";
const DEBUG_LOG_FILENAME: &str = "debug.log";

// ── Process names ────────────────────────────────────────────────────────────

pub const PROCESS_IRACING_UI: &str = "iRacingUI.exe";
pub const PROCESS_IRACING_SIM: &str = "iRacingSim64DX11.exe";

pub fn process_name_for(trigger: &TriggerMode) -> &'static str {
    match trigger {
        TriggerMode::Ui   => PROCESS_IRACING_UI,
        TriggerMode::Race => PROCESS_IRACING_SIM,
    }
}

// ── Events ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq)]
pub enum MonitorEvent {
    Started,
    Stopped,
}

// ── Pure state machine (fully testable without threads) ──────────────────────

pub struct MonitorLogic {
    online: bool,
    trigger: TriggerMode,
}

impl MonitorLogic {
    pub fn new(trigger: TriggerMode) -> Self {
        Self { online: false, trigger }
    }

    /// Feed the current observation; returns an event only on state transitions.
    pub fn tick(&mut self, is_running: bool) -> Option<MonitorEvent> {
        match (self.online, is_running) {
            (false, true)  => { self.online = true;  Some(MonitorEvent::Started) }
            (true,  false) => { self.online = false; Some(MonitorEvent::Stopped) }
            _              => None,
        }
    }

    pub fn is_online(&self) -> bool {
        self.online
    }

    pub fn trigger_process_name(&self) -> &'static str {
        process_name_for(&self.trigger)
    }
}

// ── Thread wrapper ───────────────────────────────────────────────────────────

pub struct Monitor {
    handle: Option<JoinHandle<()>>,
    stop_flag: Arc<Mutex<bool>>,
}

impl Monitor {
    /// Spawns the polling thread. `on_event` is called on every state transition.
    pub fn start<F>(trigger: TriggerMode, poll_interval_secs: f64, on_event: F) -> Self
    where
        F: Fn(MonitorEvent) + Send + 'static,
    {
        let stop_flag = Arc::new(Mutex::new(false));
        let stop_clone = Arc::clone(&stop_flag);

        let log_path = dirs::data_local_dir()
            .unwrap_or_else(|| std::env::temp_dir())
            .join(APP_NAME)
            .join(DEBUG_LOG_FILENAME);
        let handle = thread::Builder::new()
            .name(MONITOR_THREAD_NAME.into())
            .spawn(move || {
                let mut logic = MonitorLogic::new(trigger);
                let mut sys = System::new();
                let interval = Duration::from_secs_f64(poll_interval_secs.max(MIN_POLL_INTERVAL_SECS));
                let mut tick_count = 0u32;

                loop {
                    if *stop_clone.lock().unwrap() {
                        break;
                    }

                    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
                    let target = logic.trigger_process_name();
                    // target may be "iRacingUI.exe"; sysinfo on Windows may omit the extension
                    let target_bare = target.trim_end_matches(".exe");
                    let running = sys.processes().values().any(|p| {
                        let name = p.name().to_string_lossy();
                        name.eq_ignore_ascii_case(target) || name.eq_ignore_ascii_case(target_bare)
                    });

                    // On first tick and every N ticks, log a sample of process names to file
                    if tick_count % LOG_SAMPLE_EVERY_TICKS == 0 {
                        if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(&log_path) {
                            let sample: Vec<String> = sys.processes().values()
                                .map(|p| p.name().to_string_lossy().into_owned())
                                .filter(|n| n.to_lowercase().contains("iracing") || n.to_lowercase().contains("pitlane"))
                                .collect();
                            let _ = writeln!(f, "[monitor tick={tick_count}] target={target} running={running} iracing_procs={sample:?}");
                        }
                    }
                    tick_count += 1;

                    if let Some(event) = logic.tick(running) {
                        if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(&log_path) {
                            let _ = writeln!(f, "[monitor] EVENT={event:?} target={target}");
                        }
                        on_event(event);
                    }

                    thread::sleep(interval);
                }
            })
            .expect("failed to spawn monitor thread");

        Self { handle: Some(handle), stop_flag }
    }

    /// Signals the thread to stop and waits for it to finish (max 3 s).
    pub fn stop(&mut self) {
        *self.stop_flag.lock().unwrap() = true;
        if let Some(handle) = self.handle.take() {
            let _ = handle.join();
        }
    }
}

impl Drop for Monitor {
    fn drop(&mut self) {
        self.stop();
    }
}

