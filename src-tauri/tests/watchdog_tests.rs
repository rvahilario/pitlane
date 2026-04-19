use pitlane_lib::models::ManagedApp;
use pitlane_lib::watchdog::{tick, TickAction, Watchdog};

// ── tick: process alive ──────────────────────────────────────────────────────

#[test]
fn should_continue_when_process_is_alive() {
    let action = tick(1234, true, 3, 0, false, |_| true);
    assert_eq!(action, TickAction::Continue);
}

#[test]
fn should_continue_when_alive_even_if_restarts_exhausted() {
    let action = tick(1234, true, 3, 3, false, |_| true);
    assert_eq!(action, TickAction::Continue);
}

// ── tick: intentional stop ───────────────────────────────────────────────────

#[test]
fn should_stop_when_stopping_flag_is_set_and_process_alive() {
    let action = tick(1234, true, 3, 0, true, |_| true);
    assert_eq!(action, TickAction::Stopped);
}

#[test]
fn should_stop_when_stopping_flag_is_set_and_process_dead() {
    let action = tick(1234, true, 3, 0, true, |_| false);
    assert_eq!(action, TickAction::Stopped);
}

// ── tick: crash, restart disabled ───────────────────────────────────────────

#[test]
fn should_give_up_when_process_dead_and_restart_disabled() {
    let action = tick(1234, false, 3, 0, false, |_| false);
    assert_eq!(action, TickAction::GiveUp);
}

// ── tick: crash, restart enabled ────────────────────────────────────────────

#[test]
fn should_restart_when_process_dead_and_attempts_remaining() {
    let action = tick(1234, true, 3, 0, false, |_| false);
    assert_eq!(action, TickAction::Restart);
}

#[test]
fn should_restart_when_restart_count_is_below_max() {
    let action = tick(1234, true, 3, 2, false, |_| false);
    assert_eq!(action, TickAction::Restart);
}

// ── tick: crash, attempts exhausted ─────────────────────────────────────────

#[test]
fn should_give_up_when_restart_count_equals_max() {
    let action = tick(1234, true, 3, 3, false, |_| false);
    assert_eq!(action, TickAction::GiveUp);
}

#[test]
fn should_give_up_when_restart_count_exceeds_max() {
    let action = tick(1234, true, 3, 99, false, |_| false);
    assert_eq!(action, TickAction::GiveUp);
}

#[test]
fn should_give_up_immediately_when_max_attempts_is_zero() {
    let action = tick(1234, true, 0, 0, false, |_| false);
    assert_eq!(action, TickAction::GiveUp);
}

// ── Watchdog struct ──────────────────────────────────────────────────────────

#[test]
fn should_track_pid_after_watch() {
    let (wd, _rx) = Watchdog::new();
    let app = ManagedApp::new("p1", "SimHub", "C:/SimHub.exe");
    let app_id = app.id.clone();
    wd.watch(app, 1234);
    assert_eq!(wd.current_pid(&app_id), Some(1234));
}

#[test]
fn should_return_none_for_untracked_app() {
    let (wd, _rx) = Watchdog::new();
    assert_eq!(wd.current_pid("nonexistent"), None);
}

#[test]
fn should_report_watching_true_after_watch() {
    let (wd, _rx) = Watchdog::new();
    let app = ManagedApp::new("p1", "SimHub", "C:/SimHub.exe");
    let app_id = app.id.clone();
    wd.watch(app, 1234);
    assert!(wd.is_watching(&app_id));
}

#[test]
fn should_report_watching_false_for_untracked_app() {
    let (wd, _rx) = Watchdog::new();
    assert!(!wd.is_watching("nonexistent"));
}

#[test]
fn should_have_zero_restart_count_on_new_watch() {
    let (wd, _rx) = Watchdog::new();
    let app = ManagedApp::new("p1", "SimHub", "C:/SimHub.exe");
    let app_id = app.id.clone();
    wd.watch(app, 1234);
    assert_eq!(wd.restart_count(&app_id), Some(0));
}

#[test]
fn should_replace_entry_when_watching_same_app_id_twice() {
    let (wd, _rx) = Watchdog::new();
    let app1 = ManagedApp::new("p1", "SimHub", "C:/SimHub.exe");
    let app_id = app1.id.clone();
    let mut app2 = app1.clone();
    app2.exe_path = "C:/SimHub2.exe".into();

    wd.watch(app1, 1000);
    wd.watch(app2, 2000);

    assert_eq!(wd.current_pid(&app_id), Some(2000));
    assert_eq!(wd.restart_count(&app_id), Some(0));
}

#[test]
fn should_set_stopping_flag_on_unwatch() {
    let (wd, _rx) = Watchdog::new();
    let app = ManagedApp::new("p1", "SimHub", "C:/SimHub.exe");
    let app_id = app.id.clone();
    wd.watch(app, 1234);
    wd.unwatch(&app_id);
    assert!(wd.is_stopping(&app_id));
}

#[test]
fn should_ignore_unwatch_for_unknown_app() {
    let (wd, _rx) = Watchdog::new();
    wd.unwatch("ghost"); // must not panic
}
