use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use crate::models::ManagedApp;

const POLL_INTERVAL_MS: u64 = 2000;

// ── Events ────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq)]
pub enum WatchdogEvent {
    /// Process crashed and was successfully restarted.
    Restarted { app_id: String, new_pid: u32, attempt: u32 },
    /// Process crashed and all restart attempts were exhausted (or restart disabled).
    GaveUp { app_id: String },
    /// Relaunch after crash failed (exe not found, spawn error, etc.).
    RestartFailed { app_id: String },
}

// ── Pure tick logic ───────────────────────────────────────────────────────────

#[derive(Debug, PartialEq)]
pub enum TickAction {
    /// Process alive — nothing to do.
    Continue,
    /// Intentional stop was requested — remove entry without restarting.
    Stopped,
    /// Process died and should be relaunched.
    Restart,
    /// Process died and no more restarts allowed.
    GiveUp,
}

/// Pure tick decision. Testable without real processes or threads.
pub fn tick(
    pid: u32,
    restart_on_crash: bool,
    max_restart_attempts: u32,
    restart_count: u32,
    stopping: bool,
    is_alive: impl Fn(u32) -> bool,
) -> TickAction {
    if stopping {
        return TickAction::Stopped;
    }
    if is_alive(pid) {
        return TickAction::Continue;
    }
    if !restart_on_crash || restart_count >= max_restart_attempts {
        return TickAction::GiveUp;
    }
    TickAction::Restart
}

// ── Internal entry ────────────────────────────────────────────────────────────

#[derive(Clone)]
struct Entry {
    app: ManagedApp,
    pid: u32,
    restart_count: u32,
    stopping: bool,
}

// ── Watchdog ──────────────────────────────────────────────────────────────────

type EntryMap = Arc<Mutex<HashMap<String, Entry>>>;

pub struct Watchdog {
    entries: EntryMap,
}

impl Watchdog {
    /// Creates a new Watchdog and spawns the background polling thread.
    /// Returns `(Watchdog, Receiver<WatchdogEvent>)`.
    pub fn new() -> (Self, std::sync::mpsc::Receiver<WatchdogEvent>) {
        let (tx, rx) = std::sync::mpsc::channel();
        let entries: EntryMap = Arc::new(Mutex::new(HashMap::new()));
        let entries_bg = Arc::clone(&entries);

        thread::spawn(move || {
            loop {
                thread::sleep(Duration::from_millis(POLL_INTERVAL_MS));

                let ids: Vec<String> = entries_bg
                    .lock()
                    .unwrap()
                    .keys()
                    .cloned()
                    .collect();

                for id in ids {
                    let entry = match entries_bg.lock().unwrap().get(&id).cloned() {
                        Some(e) => e,
                        None => continue,
                    };

                    let action = tick(
                        entry.pid,
                        entry.app.restart_on_crash,
                        entry.app.max_restart_attempts,
                        entry.restart_count,
                        entry.stopping,
                        crate::process_killer::is_pid_alive,
                    );

                    match action {
                        TickAction::Continue => {}
                        TickAction::Stopped => {
                            entries_bg.lock().unwrap().remove(&id);
                        }
                        TickAction::GiveUp => {
                            entries_bg.lock().unwrap().remove(&id);
                            let _ = tx.send(WatchdogEvent::GaveUp { app_id: id });
                        }
                        TickAction::Restart => {
                            match crate::launcher::launch(&entry.app) {
                                Ok(stub_pid) => {
                                    let real_pid =
                                        crate::launcher::resolve_real_pid(stub_pid, &entry.app);
                                    let attempt = entry.restart_count + 1;
                                    let mut map = entries_bg.lock().unwrap();
                                    if let Some(e) = map.get_mut(&id) {
                                        e.pid = real_pid;
                                        e.restart_count = attempt;
                                    }
                                    let _ = tx.send(WatchdogEvent::Restarted {
                                        app_id: id,
                                        new_pid: real_pid,
                                        attempt,
                                    });
                                }
                                Err(_) => {
                                    entries_bg.lock().unwrap().remove(&id);
                                    let _ = tx.send(WatchdogEvent::RestartFailed { app_id: id });
                                }
                            }
                        }
                    }
                }
            }
        });

        (Self { entries }, rx)
    }

    /// Start watching a process. Replaces any existing entry for the same app id.
    pub fn watch(&self, app: ManagedApp, pid: u32) {
        self.entries.lock().unwrap().insert(
            app.id.clone(),
            Entry { app, pid, restart_count: 0, stopping: false },
        );
    }

    /// Signal an intentional stop — the watchdog will remove the entry on the
    /// next tick without emitting a GaveUp event.
    pub fn unwatch(&self, app_id: &str) {
        let mut map = self.entries.lock().unwrap();
        if let Some(e) = map.get_mut(app_id) {
            e.stopping = true;
        }
    }

    /// Returns the current tracked PID for an app, or None if not watched.
    pub fn current_pid(&self, app_id: &str) -> Option<u32> {
        self.entries.lock().unwrap().get(app_id).map(|e| e.pid)
    }

    /// Returns the current restart count for an app.
    pub fn restart_count(&self, app_id: &str) -> Option<u32> {
        self.entries.lock().unwrap().get(app_id).map(|e| e.restart_count)
    }

    /// Returns true if the app is currently being watched.
    pub fn is_watching(&self, app_id: &str) -> bool {
        self.entries.lock().unwrap().contains_key(app_id)
    }

    /// Returns true if an intentional stop was requested but the watchdog
    /// thread hasn't processed it yet.
    pub fn is_stopping(&self, app_id: &str) -> bool {
        self.entries.lock().unwrap().get(app_id).map_or(false, |e| e.stopping)
    }
}

