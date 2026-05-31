use pitlane_lib::process_killer::{
    exe_path_matches, force_kill, graceful_kill, has_visible_windows, is_pid_alive,
    needs_graceful_close, ProcessJob,
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

// ── has_visible_windows ──────────────────────────────────────────────────────

#[test]
fn should_return_false_for_nonexistent_pid() {
    assert!(!has_visible_windows(0));
    assert!(!has_visible_windows(u32::MAX));
}

#[test]
fn should_return_false_for_process_without_windows() {
    // Spawn a windowless console fixture
    let child = std::process::Command::new("cmd")
        .args(["/C", "timeout /t 3 > nul"])
        .spawn()
        .expect("failed to spawn cmd");
    let pid = child.id();

    std::thread::sleep(Duration::from_millis(100));
    assert!(!has_visible_windows(pid), "cmd should have no visible windows");

    force_kill(pid);
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


// ── ProcessJob ───────────────────────────────────────────────────────────────

#[test]
fn should_create_job_object() {
    let job = ProcessJob::new();
    assert!(job.is_ok(), "ProcessJob::new should succeed");
}

#[test]
fn should_not_panic_when_assigning_nonexistent_pid() {
    let job = ProcessJob::new().unwrap();
    // PID 0 and u32::MAX are never valid
    assert!(job.assign(0).is_err());
    assert!(job.assign(u32::MAX).is_err());
}

fn fixture_path(name: &str) -> String {
    let dir = env!("CARGO_MANIFEST_DIR");
    format!("{dir}\\target\\debug\\{name}.exe")
}

#[test]
#[ignore]
fn manual_should_kill_assigned_process_when_job_dropped() {
    use std::process::Command;
    use std::time::Duration;

    let path = fixture_path("fixture-dummy");
    let child = Command::new(&path).spawn().expect("failed to spawn fixture-dummy");
    let pid = child.id();
    println!("[job integration] spawned dummy PID: {pid}");

    std::thread::sleep(Duration::from_millis(200));

    let job = ProcessJob::new().expect("failed to create job");
    job.assign(pid).expect("failed to assign process to job");
    println!("[job integration] assigned PID {pid} to job");

    // Drop the job — this should terminate the process
    drop(job);
    println!("[job integration] dropped job handle");

    std::thread::sleep(Duration::from_millis(500));

    assert!(!is_pid_alive(pid), "dummy should be dead after job handle closed");
    println!("[job integration] ✓ process killed by job close");
}

#[test]
#[ignore]
fn manual_should_kill_child_processes_inherited_from_job() {
    use std::process::Command;
    use std::time::Duration;

    // fixture-stub spawns fixture-dummy as a child
    let stub_path = fixture_path("fixture-stub");
    let child = Command::new(&stub_path).spawn().expect("failed to spawn fixture-stub");
    let stub_pid = child.id();
    println!("[job integration] spawned stub PID: {stub_pid}");

    // Give fixture-stub time to spawn fixture-dummy
    std::thread::sleep(Duration::from_millis(500));

    let job = ProcessJob::new().expect("failed to create job");
    job.assign(stub_pid).expect("failed to assign stub to job");
    println!("[job integration] assigned stub PID {stub_pid} to job");

    // Find the child PID spawned by stub
    let child_pid = pitlane_lib::process_killer::find_pids_by_name("fixture-dummy.exe")
        .into_iter()
        .find(|&p| p != stub_pid);

    if let Some(cp) = child_pid {
        println!("[job integration] found child PID: {cp}");
    }

    drop(job);
    println!("[job integration] dropped job handle");

    std::thread::sleep(Duration::from_millis(500));

    assert!(!is_pid_alive(stub_pid), "stub should be dead after job close");
    if let Some(cp) = child_pid {
        assert!(
            !is_pid_alive(cp),
            "child dummy should also be dead after job close"
        );
    }
    println!("[job integration] ✓ stub and child killed by job close");
}
