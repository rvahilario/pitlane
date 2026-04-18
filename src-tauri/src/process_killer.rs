use std::path::Path;
use std::time::Duration;

use sysinfo::{ProcessesToUpdate, System};

// ── Pure helpers (fully testable) ────────────────────────────────────────────

// ── Squirrel / auto-updater matching ─────────────────────────────────────────

/// Returns true if `process_exe` should be considered a match for `target_exe`.
///
/// Two cases:
/// 1. Exact match (case-insensitive, normalized separators).
/// 2. Same filename AND `process_exe` is inside a subdirectory of `target_exe`'s
///    parent — handles Squirrel apps where the real binary lives in a versioned
///    subdirectory (e.g. `app-1.24.35\Kapps.exe` vs configured `kapps\Kapps.exe`).
pub fn exe_path_matches(process_exe: &str, target_exe: &str) -> bool {
    let normalize = |s: &str| s.replace('\\', "/").to_lowercase();
    let proc = normalize(process_exe);
    let target = normalize(target_exe);

    if proc == target {
        return true;
    }

    let proc_name = Path::new(process_exe)
        .file_name()
        .and_then(|n| n.to_str())
        .map(|s| s.to_lowercase())
        .unwrap_or_default();
    let target_name = Path::new(target_exe)
        .file_name()
        .and_then(|n| n.to_str())
        .map(|s| s.to_lowercase())
        .unwrap_or_default();

    if proc_name != target_name || proc_name.is_empty() {
        return false;
    }

    // Check that process_exe is under target_exe's parent directory
    let target_parent = normalize(
        Path::new(target_exe)
            .parent()
            .and_then(|p| p.to_str())
            .unwrap_or(""),
    );

    !target_parent.is_empty() && proc.starts_with(&format!("{target_parent}/"))
}

/// Finds all PIDs whose exe path matches `target_exe` (including Squirrel subdirs).
pub fn find_pids_by_exe_path(target_exe: &str) -> Vec<u32> {
    let mut sys = System::new();
    sys.refresh_processes(ProcessesToUpdate::All, true);
    sys.processes()
        .values()
        .filter_map(|p| {
            let exe = p.exe()?.to_string_lossy().into_owned();
            if exe_path_matches(&exe, target_exe) {
                Some(p.pid().as_u32())
            } else {
                None
            }
        })
        .collect()
}

/// Finds all PIDs whose process name matches `name` (case-insensitive).
pub fn find_pids_by_name(name: &str) -> Vec<u32> {
    let target = name.trim().to_lowercase();
    let mut sys = System::new();
    sys.refresh_processes(ProcessesToUpdate::All, true);
    sys.processes()
        .values()
        .filter(|p| p.name().to_string_lossy().to_lowercase() == target)
        .map(|p| p.pid().as_u32())
        .collect()
}

/// Kills all processes matching `exe_path` (with Squirrel support).
pub fn kill_by_exe_path(exe_path: &str, grace_secs: f64) {
    for pid in find_pids_by_exe_path(exe_path) {
        graceful_kill(pid, grace_secs);
    }
}

/// Kills all processes matching `name` (case-insensitive).
pub fn kill_by_name(name: &str, grace_secs: f64) {
    for pid in find_pids_by_name(name) {
        graceful_kill(pid, grace_secs);
    }
}

// ── Pure helpers (fully testable) ────────────────────────────────────────────

/// Returns true when a graceful WM_CLOSE should be attempted before force-killing.
pub fn needs_graceful_close(grace_secs: f64) -> bool {
    grace_secs > 0.0
}

// ── Win32 helpers ─────────────────────────────────────────────────────────────

/// Enumerates all top-level windows and sends WM_CLOSE to those owned by `pid`.
pub fn send_wm_close(pid: u32) {
    use windows::Win32::Foundation::{HWND, LPARAM, BOOL};
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetWindowThreadProcessId, SendMessageTimeoutW,
        SMTO_ABORTIFHUNG, WM_CLOSE,
    };

    unsafe extern "system" fn enum_cb(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let target_pid = lparam.0 as u32;
        let mut window_pid: u32 = 0;
        unsafe { GetWindowThreadProcessId(hwnd, Some(&mut window_pid)) };
        if window_pid == target_pid {
            unsafe {
                let _ = SendMessageTimeoutW(
                    hwnd,
                    WM_CLOSE,
                    None,
                    None,
                    SMTO_ABORTIFHUNG,
                    2000,
                    None,
                );
            }
        }
        BOOL(1)
    }

    unsafe {
        let _ = EnumWindows(Some(enum_cb), LPARAM(pid as isize));
    }
}

/// Waits up to `grace` for the process to exit on its own. Returns true if it exited.
pub fn wait_for_exit(pid: u32, grace: Duration) -> bool {
    use windows::Win32::Foundation::{CloseHandle, WAIT_OBJECT_0};
    use windows::Win32::System::Threading::{OpenProcess, WaitForSingleObject, PROCESS_SYNCHRONIZE};

    let handle = unsafe {
        match OpenProcess(PROCESS_SYNCHRONIZE, false, pid) {
            Ok(h) => h,
            Err(_) => return true, // process already gone
        }
    };

    let ms = grace.as_millis().min(u32::MAX as u128) as u32;
    let result = unsafe { WaitForSingleObject(handle, ms) };
    unsafe { let _ = CloseHandle(handle); }

    result == WAIT_OBJECT_0
}

/// Immediately terminates the process via `TerminateProcess`. No-op if PID is gone.
pub fn force_kill(pid: u32) {
    use windows::Win32::Foundation::CloseHandle;
    use windows::Win32::System::Threading::{OpenProcess, TerminateProcess, PROCESS_TERMINATE};

    let handle = unsafe {
        match OpenProcess(PROCESS_TERMINATE, false, pid) {
            Ok(h) => h,
            Err(_) => return,
        }
    };

    unsafe {
        let _ = TerminateProcess(handle, 1);
        let _ = CloseHandle(handle);
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

/// Graceful shutdown: WM_CLOSE → grace period → force kill.
/// When `grace_secs` is 0, skips straight to force kill.
pub fn graceful_kill(pid: u32, grace_secs: f64) {
    if !needs_graceful_close(grace_secs) {
        force_kill(pid);
        return;
    }

    send_wm_close(pid);

    let grace = Duration::from_secs_f64(grace_secs);
    if !wait_for_exit(pid, grace) {
        force_kill(pid);
    }
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    // ── exe_path_matches (Squirrel support) ─────────────────────────────────

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

    // ── needs_graceful_close ─────────────────────────────────────────────────

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

    // ── force_kill ───────────────────────────────────────────────────────────

    #[test]
    fn should_not_panic_when_force_killing_nonexistent_pid() {
        // PID 0 and very large PIDs are never valid on Windows
        force_kill(0);
        force_kill(u32::MAX);
    }

    // ── graceful_kill ────────────────────────────────────────────────────────

    #[test]
    fn should_not_panic_when_graceful_killing_nonexistent_pid() {
        graceful_kill(0, 0.0);
        graceful_kill(u32::MAX, 5.0);
    }

    // ── Manual integration tests (require a real spawned process) ────────────
    //
    // Run with:
    //   cargo test --manifest-path src-tauri/Cargo.toml -- --ignored --nocapture

    #[test]
    #[ignore]
    fn manual_should_gracefully_kill_notepad() {
        use std::process::Command;

        let child = Command::new("C:/Windows/System32/notepad.exe")
            .spawn()
            .expect("failed to spawn notepad");
        let pid = child.id();
        println!("[killer integration] spawned notepad PID: {pid}");

        std::thread::sleep(Duration::from_secs(1));

        graceful_kill(pid, 3.0);
        std::thread::sleep(Duration::from_millis(500));

        // Verify process is gone
        let alive = wait_for_exit(pid, Duration::from_millis(100));
        println!("[killer integration] process exited: {}", !alive);
    }

    #[test]
    #[ignore]
    fn manual_should_force_kill_notepad() {
        use std::process::Command;

        let child = Command::new("C:/Windows/System32/notepad.exe")
            .spawn()
            .expect("failed to spawn notepad");
        let pid = child.id();
        println!("[killer integration] spawned notepad PID: {pid}");

        std::thread::sleep(Duration::from_secs(1));
        force_kill(pid);
        println!("[killer integration] force_kill sent");
    }
}
