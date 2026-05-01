use pitlane_lib::process_killer::{
    exe_path_matches, force_kill, graceful_kill, is_pid_alive, needs_graceful_close,
};
use std::time::Duration;

// ── exe_path_matches (Squirrel support) ─────────────────────────────────────

#[test]
fn should_match_exact_exe_path() {
    assert!(exe_path_matches(
        "C:/apps/SimHub/SimHub.exe",
        "C:/apps/SimHub/SimHub.exe"
    ));
}

#[test]
fn should_match_case_insensitively() {
    assert!(exe_path_matches(
        "C:/apps/simhub/simhub.exe",
        "C:/apps/SimHub/SimHub.exe"
    ));
}

#[test]
fn should_match_squirrel_versioned_subdir() {
    // Kapps installer places real binary in a versioned subdirectory
    assert!(exe_path_matches(
        "C:/Kapps/app-1.24.35/Kapps.exe",
        "C:/Kapps/Kapps.exe"
    ));
}

#[test]
fn should_not_match_different_filename() {
    assert!(!exe_path_matches(
        "C:/apps/OtherApp.exe",
        "C:/apps/SimHub.exe"
    ));
}

#[test]
fn should_not_match_same_filename_outside_parent_dir() {
    // Same filename but completely different directory tree
    assert!(!exe_path_matches(
        "C:/other/Kapps/Kapps.exe",
        "C:/apps/Kapps/Kapps.exe"
    ));
}

#[test]
fn should_match_backslash_and_forward_slash_interchangeably() {
    assert!(exe_path_matches(
        r"C:\Kapps\app-1.24.35\Kapps.exe",
        "C:/Kapps/Kapps.exe"
    ));
}

// ── needs_graceful_close ─────────────────────────────────────────────────────

#[test]
fn should_require_graceful_close_when_grace_is_positive() {
    assert!(needs_graceful_close(5.0));
    assert!(needs_graceful_close(0.1));
}

#[test]
fn should_skip_graceful_close_when_grace_is_zero() {
    assert!(!needs_graceful_close(0.0));
}

#[test]
fn should_skip_graceful_close_when_grace_is_negative() {
    assert!(!needs_graceful_close(-1.0));
}

// ── force_kill ───────────────────────────────────────────────────────────────

#[test]
fn should_not_panic_when_force_killing_nonexistent_pid() {
    // PID 0 and very large PIDs are never valid on Windows
    force_kill(0);
    force_kill(u32::MAX);
}

// ── graceful_kill ────────────────────────────────────────────────────────────

#[test]
fn should_not_panic_when_graceful_killing_nonexistent_pid() {
    graceful_kill(0, 0.0);
    graceful_kill(u32::MAX, 5.0);
}

// ── Manual integration tests (require a real spawned process) ────────────────
//
// Run with:
//   cargo test --manifest-path src-tauri/Cargo.toml -- --ignored --nocapture

fn winver_path() -> String {
    let root = std::env::var("SystemRoot").unwrap_or_else(|_| "C:\\Windows".to_string());
    format!("{root}\\System32\\winver.exe")
}

#[test]
#[ignore]
fn manual_should_gracefully_kill_winver() {
    use std::process::Command;

    let path = winver_path();
    let child = Command::new(&path).spawn().expect("failed to spawn winver");
    let pid = child.id();
    println!("[killer integration] spawned winver PID: {pid}");

    std::thread::sleep(Duration::from_secs(1));

    graceful_kill(pid, 3.0);
    std::thread::sleep(Duration::from_millis(500));

    assert!(
        !is_pid_alive(pid),
        "winver should be dead after graceful_kill"
    );
    println!("[killer integration] ✓ process killed");
}

#[test]
#[ignore]
fn manual_should_force_kill_winver() {
    use std::process::Command;

    let path = winver_path();
    let child = Command::new(&path).spawn().expect("failed to spawn winver");
    let pid = child.id();
    println!("[killer integration] spawned winver PID: {pid}");

    std::thread::sleep(Duration::from_secs(1));
    force_kill(pid);
    std::thread::sleep(Duration::from_millis(200));

    assert!(!is_pid_alive(pid), "winver should be dead after force_kill");
    println!("[killer integration] ✓ process killed");
}
