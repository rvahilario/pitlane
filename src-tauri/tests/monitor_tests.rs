use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Duration;

use pitlane_lib::models::TriggerMode;
use pitlane_lib::monitor::{process_name_for, Monitor, MonitorEvent, MonitorLogic};

// ── MonitorLogic: initial state ──────────────────────────────────────────────

#[test]
fn should_start_in_offline_state() {
    let logic = MonitorLogic::new(TriggerMode::Ui);
    assert!(!logic.is_online());
}

// ── MonitorLogic: process name resolution ────────────────────────────────────

#[test]
fn should_use_iracing_ui_process_name_for_ui_trigger() {
    let logic = MonitorLogic::new(TriggerMode::Ui);
    assert_eq!(logic.trigger_process_name(), "iRacingUI.exe");
}

#[test]
fn should_use_iracing_sim_process_name_for_race_trigger() {
    let logic = MonitorLogic::new(TriggerMode::Race);
    assert_eq!(logic.trigger_process_name(), "iRacingSim64DX11.exe");
}

// ── MonitorLogic: offline → online ───────────────────────────────────────────

#[test]
fn should_emit_started_when_process_appears() {
    let mut logic = MonitorLogic::new(TriggerMode::Ui);
    let event = logic.tick(true);
    assert_eq!(event, Some(MonitorEvent::Started));
    assert!(logic.is_online());
}

#[test]
fn should_emit_no_event_while_staying_offline() {
    let mut logic = MonitorLogic::new(TriggerMode::Ui);
    assert_eq!(logic.tick(false), None);
    assert_eq!(logic.tick(false), None);
}

// ── MonitorLogic: online → offline ───────────────────────────────────────────

#[test]
fn should_emit_stopped_when_process_disappears() {
    let mut logic = MonitorLogic::new(TriggerMode::Ui);
    logic.tick(true); // → online
    let event = logic.tick(false);
    assert_eq!(event, Some(MonitorEvent::Stopped));
    assert!(!logic.is_online());
}

#[test]
fn should_emit_no_event_while_staying_online() {
    let mut logic = MonitorLogic::new(TriggerMode::Ui);
    logic.tick(true); // → online
    assert_eq!(logic.tick(true), None);
    assert_eq!(logic.tick(true), None);
}

// ── MonitorLogic: rapid transitions ─────────────────────────────────────────

#[test]
fn should_emit_started_and_stopped_on_rapid_transitions() {
    let mut logic = MonitorLogic::new(TriggerMode::Race);
    assert_eq!(logic.tick(true), Some(MonitorEvent::Started));
    assert_eq!(logic.tick(false), Some(MonitorEvent::Stopped));
    assert_eq!(logic.tick(true), Some(MonitorEvent::Started));
    assert_eq!(logic.tick(false), Some(MonitorEvent::Stopped));
}

#[test]
fn should_not_emit_duplicate_started_on_consecutive_running_ticks() {
    let mut logic = MonitorLogic::new(TriggerMode::Ui);
    let first = logic.tick(true);
    let second = logic.tick(true);
    let third = logic.tick(true);
    assert_eq!(first, Some(MonitorEvent::Started));
    assert_eq!(second, None);
    assert_eq!(third, None);
}

// ── process_name_for (free function) ─────────────────────────────────────────

#[test]
fn should_resolve_ui_process_name() {
    assert_eq!(process_name_for(&TriggerMode::Ui), "iRacingUI.exe");
}

#[test]
fn should_resolve_race_process_name() {
    assert_eq!(process_name_for(&TriggerMode::Race), "iRacingSim64DX11.exe");
}

// ── Monitor thread ───────────────────────────────────────────────────────────

#[test]
fn should_start_and_stop_monitor_thread_without_panicking() {
    let counter = Arc::new(AtomicUsize::new(0));
    let counter_clone = Arc::clone(&counter);

    let mut monitor = Monitor::start(TriggerMode::Ui, 0.05, move |_event| {
        counter_clone.fetch_add(1, Ordering::SeqCst);
    });

    std::thread::sleep(Duration::from_millis(150));
    monitor.stop();
    // thread stopped cleanly — no panic, no deadlock
}

#[test]
fn should_not_panic_when_stop_called_twice() {
    let mut monitor = Monitor::start(TriggerMode::Ui, 0.05, |_| {});
    monitor.stop();
    monitor.stop(); // second call must be a no-op
}

// ── Manual integration test (requires iRacing running) ──────────────────────
//
// Run with:
//   cargo test --manifest-path src-tauri/Cargo.toml -- --ignored --nocapture
//
// Start iRacing UI before running, then close it during the 15s window to
// observe both Started and Stopped events.

#[test]
#[ignore]
fn manual_should_detect_real_iracing_process() {
    use std::sync::mpsc;

    let (tx, rx) = mpsc::channel::<MonitorEvent>();

    println!("\n[monitor integration] Watching for iRacingUI.exe...");
    println!("[monitor integration] Open iRacing UI, then close it. Test ends on Stopped.\n");

    let mut monitor = Monitor::start(TriggerMode::Ui, 1.0, move |event| {
        match &event {
            MonitorEvent::Started => println!("[monitor integration] ✓ Started"),
            MonitorEvent::Stopped => println!("[monitor integration] ✓ Stopped"),
        }
        let _ = tx.send(event);
    });

    loop {
        match rx.recv_timeout(Duration::from_secs(20)) {
            Ok(MonitorEvent::Stopped) => break,
            Ok(MonitorEvent::Started) => continue,
            Err(_) => {
                println!("[monitor integration] Timeout — no events in 20s.");
                break;
            }
        }
    }

    monitor.stop();
    println!("[monitor integration] Done.");
}
