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

/// Kills all processes matching `exe_path`, plus their entire child process trees.
pub fn kill_tree_by_exe_path(exe_path: &str, grace_secs: f64) {
    for pid in find_pids_by_exe_path(exe_path) {
        kill_tree(pid, grace_secs);
    }
}

/// Kills all processes matching `name` (case-insensitive).
pub fn kill_by_name(name: &str, grace_secs: f64) {
    for pid in find_pids_by_name(name) {
        graceful_kill(pid, grace_secs);
    }
}

/// Kills a process and all its descendants using `taskkill /F /T`.
/// Falls back to a plain force kill if taskkill fails.
pub fn kill_tree(pid: u32, grace_secs: f64) {
    if needs_graceful_close(grace_secs) {
        send_wm_close(pid);
        if wait_for_exit(pid, std::time::Duration::from_secs_f64(grace_secs)) {
            return;
        }
    }
    let _ = std::process::Command::new("taskkill")
        .args(["/F", "/T", "/PID", &pid.to_string()])
        .output();
}

// ── Pure helpers (fully testable) ────────────────────────────────────────────

const STILL_ACTIVE: u32 = 259;

/// Returns true if a process with the given PID is currently running.
pub fn is_pid_alive(pid: u32) -> bool {
    use windows::Win32::Foundation::CloseHandle;
    use windows::Win32::System::Threading::{OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION};

    let handle = unsafe {
        match OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) {
            Ok(h) => h,
            Err(_) => return false,
        }
    };

    use windows::Win32::System::Threading::GetExitCodeProcess;
    let mut exit_code: u32 = 0;
    let still_active =
        unsafe { GetExitCodeProcess(handle, &mut exit_code).is_ok() && exit_code == STILL_ACTIVE };
    unsafe {
        let _ = CloseHandle(handle);
    }
    still_active
}

/// Returns true when a graceful WM_CLOSE should be attempted before force-killing.
pub fn needs_graceful_close(grace_secs: f64) -> bool {
    grace_secs > 0.0
}

// ── Win32 helpers ─────────────────────────────────────────────────────────────

/// Enumerates all top-level windows and posts WM_CLOSE to those owned by `pid`.
/// Uses PostMessageW (async) so each app processes the close in its own event loop,
/// avoiding race conditions when multiple windows receive WM_CLOSE simultaneously.
pub fn send_wm_close(pid: u32) {
    use windows::Win32::Foundation::{BOOL, HWND, LPARAM};
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetWindowThreadProcessId, PostMessageW, WM_CLOSE,
    };

    unsafe extern "system" fn enum_cb(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let target_pid = lparam.0 as u32;
        let mut window_pid: u32 = 0;
        unsafe { GetWindowThreadProcessId(hwnd, Some(&mut window_pid)) };
        if window_pid == target_pid {
            unsafe {
                let _ = PostMessageW(hwnd, WM_CLOSE, None, None);
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
    use windows::Win32::System::Threading::{
        OpenProcess, WaitForSingleObject, PROCESS_SYNCHRONIZE,
    };

    let handle = unsafe {
        match OpenProcess(PROCESS_SYNCHRONIZE, false, pid) {
            Ok(h) => h,
            Err(_) => return true, // process already gone
        }
    };

    let ms = grace.as_millis().min(u32::MAX as u128) as u32;
    let result = unsafe { WaitForSingleObject(handle, ms) };
    unsafe {
        let _ = CloseHandle(handle);
    }

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

/// Returns true if the given PID owns any visible top-level window.
pub fn has_visible_windows(pid: u32) -> bool {
    use windows::Win32::Foundation::{BOOL, HWND, LPARAM};
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetWindowThreadProcessId, IsWindowVisible,
    };

    struct Context {
        target_pid: u32,
        found: bool,
    }

    let mut ctx = Context {
        target_pid: pid,
        found: false,
    };

    unsafe extern "system" fn enum_cb(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let ctx = &mut *(lparam.0 as *mut Context);
        let mut window_pid: u32 = 0;
        unsafe { GetWindowThreadProcessId(hwnd, Some(&mut window_pid)) };
        if window_pid == ctx.target_pid && unsafe { IsWindowVisible(hwnd).as_bool() } {
            ctx.found = true;
            return BOOL(0); // stop enumeration
        }
        BOOL(1)
    }

    unsafe {
        let _ = EnumWindows(Some(enum_cb), LPARAM(&mut ctx as *mut _ as isize));
    }

    ctx.found
}

/// Graceful shutdown: WM_CLOSE → grace period → force kill.
/// When `grace_secs` is 0, skips straight to force kill.
pub fn graceful_kill(pid: u32, grace_secs: f64) {
    if !needs_graceful_close(grace_secs) {
        force_kill(pid);
        return;
    }

    // If the process has no visible windows it is likely already minimised
    // to the system tray. Sending WM_CLOSE in that state just gives the app
    // a chance to show a tray notification instead of exiting. Force-kill
    // immediately in that case.
    if !has_visible_windows(pid) {
        #[cfg(debug_assertions)]
        println!("[process_killer] pid={pid} has no visible windows — skipping WM_CLOSE, force killing");
        force_kill(pid);
        return;
    }

    send_wm_close(pid);

    // Fast-fail: some apps intercept WM_CLOSE and minimise to tray. If the
    // window disappears but the process is still alive, force-kill immediately.
    std::thread::sleep(Duration::from_millis(100));
    if is_pid_alive(pid) && !has_visible_windows(pid) {
        #[cfg(debug_assertions)]
        println!("[process_killer] pid={pid} alive but no visible windows after WM_CLOSE — force killing");
        force_kill(pid);
        return;
    }

    let grace = Duration::from_secs_f64(grace_secs);
    if !wait_for_exit(pid, grace) {
        force_kill(pid);
    }
}
