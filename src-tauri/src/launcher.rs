use std::path::Path;
use std::time::Duration;

use crate::models::ManagedApp;

// ── Errors ───────────────────────────────────────────────────────────────────

#[derive(Debug, PartialEq)]
pub enum LaunchError {
    ExeNotFound(String),
    SpawnFailed(String),
}

impl std::fmt::Display for LaunchError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LaunchError::ExeNotFound(p) => write!(f, "Executable not found: {p}"),
            LaunchError::SpawnFailed(e) => write!(f, "Spawn failed: {e}"),
        }
    }
}

// ── Pure helpers (fully testable) ────────────────────────────────────────────

/// Returns the working directory to use when launching an app.
/// Falls back to the parent directory of `exe_path` when not specified.
pub fn resolve_working_dir<'a>(exe_path: &'a str, working_dir: Option<&'a str>) -> &'a str {
    if let Some(dir) = working_dir {
        if !dir.trim().is_empty() {
            return dir;
        }
    }
    Path::new(exe_path)
        .parent()
        .and_then(|p| p.to_str())
        .filter(|s| !s.is_empty())
        .unwrap_or(".")
}

/// Splits `args` string into tokens and prepends `exe_path`.
/// Returns a single-element vec when `args` is None or blank.
pub fn build_command(exe_path: &str, args: Option<&str>) -> Vec<String> {
    let mut cmd = vec![exe_path.to_string()];
    if let Some(a) = args {
        let trimmed = a.trim();
        if !trimmed.is_empty() {
            cmd.extend(split_args(trimmed));
        }
    }
    cmd
}

fn split_args(args: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;

    for ch in args.chars() {
        match ch {
            '"' => in_quotes = !in_quotes,
            ' ' if !in_quotes => {
                if !current.is_empty() {
                    tokens.push(current.clone());
                    current.clear();
                }
            }
            _ => current.push(ch),
        }
    }
    if !current.is_empty() {
        tokens.push(current);
    }
    tokens
}

// ── Launch ───────────────────────────────────────────────────────────────────

/// Spawns the process described by `app`. Returns the PID on success.
pub fn launch(app: &ManagedApp) -> Result<u32, LaunchError> {
    use std::os::windows::process::CommandExt;
    use std::process::{Command, Stdio};

    if !Path::new(&app.exe_path).exists() {
        return Err(LaunchError::ExeNotFound(app.exe_path.clone()));
    }

    let cmd = build_command(&app.exe_path, app.args.as_deref());
    let cwd = resolve_working_dir(&app.exe_path, app.working_dir.as_deref());

    // CREATE_NEW_PROCESS_GROUP — child doesn't inherit Ctrl+C from parent
    const CREATE_NEW_PROCESS_GROUP: u32 = 0x0000_0200;

    let mut command = Command::new(&cmd[0]);
    command
        .args(&cmd[1..])
        .current_dir(cwd)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .stdin(Stdio::null())
        .creation_flags(CREATE_NEW_PROCESS_GROUP);

    if app.start_minimized {
        return spawn_minimized(cmd, cwd);
    }

    command
        .spawn()
        .map(|c| c.id())
        .map_err(|e| LaunchError::SpawnFailed(e.to_string()))
}

fn spawn_minimized(cmd: Vec<String>, cwd: &str) -> Result<u32, LaunchError> {
    use std::ffi::OsStr;
    use std::mem;
    use std::os::windows::ffi::OsStrExt;

    // Raw STARTUPINFOW layout — avoids the CreateProcessW import issue
    // with the `windows` crate feature split in 0.58.
    #[repr(C)]
    #[allow(non_snake_case)]
    struct STARTUPINFOW {
        cb: u32, lpReserved: *mut u16, lpDesktop: *mut u16, lpTitle: *mut u16,
        dwX: u32, dwY: u32, dwXSize: u32, dwYSize: u32,
        dwXCountChars: u32, dwYCountChars: u32, dwFillAttribute: u32,
        dwFlags: u32, wShowWindow: u16, cbReserved2: u16,
        lpReserved2: *mut u8, hStdInput: isize, hStdOutput: isize, hStdError: isize,
    }
    #[repr(C)]
    #[allow(non_snake_case)]
    struct PROCESS_INFORMATION {
        hProcess: isize, hThread: isize, dwProcessId: u32, dwThreadId: u32,
    }

    const STARTF_USESHOWWINDOW: u32 = 0x0000_0001;
    const SW_SHOWMINNOACTIVE: u16 = 7;
    const CREATE_NEW_PROCESS_GROUP: u32 = 0x0000_0200;

    extern "system" {
        fn CreateProcessW(
            lpApplicationName: *const u16,
            lpCommandLine: *mut u16,
            lpProcessAttributes: *const u8,
            lpThreadAttributes: *const u8,
            bInheritHandles: i32,
            dwCreationFlags: u32,
            lpEnvironment: *const u8,
            lpCurrentDirectory: *const u16,
            lpStartupInfo: *const STARTUPINFOW,
            lpProcessInformation: *mut PROCESS_INFORMATION,
        ) -> i32;
        fn CloseHandle(hObject: isize) -> i32;
    }

    let mut cmdline: Vec<u16> = OsStr::new(&cmd.join(" "))
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    let cwd_wide: Vec<u16> = OsStr::new(cwd)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    let mut si: STARTUPINFOW = unsafe { mem::zeroed() };
    si.cb = mem::size_of::<STARTUPINFOW>() as u32;
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_SHOWMINNOACTIVE;

    let mut pi: PROCESS_INFORMATION = unsafe { mem::zeroed() };

    let ok = unsafe {
        CreateProcessW(
            std::ptr::null(),
            cmdline.as_mut_ptr(),
            std::ptr::null(),
            std::ptr::null(),
            0,
            CREATE_NEW_PROCESS_GROUP,
            std::ptr::null(),
            cwd_wide.as_ptr(),
            &si,
            &mut pi,
        )
    };

    if ok == 0 {
        return Err(LaunchError::SpawnFailed("CreateProcessW failed".into()));
    }

    let pid = pi.dwProcessId;
    unsafe {
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    }
    Ok(pid)
}

// ── Stub launcher / child process resolution ─────────────────────────────────

/// Pure resolution logic — takes closures so it can be unit tested without sysinfo.
///
/// After spawning a stub launcher (e.g. Squirrel, UWP shims), the stub may exit
/// immediately and hand off to a child with a different PID. This function:
/// 1. Returns `stub_pid` if it is still alive (normal app, no handoff).
/// 2. Searches by `track_process_name` if configured.
/// 3. Falls back to searching by `exe_path` (Squirrel subdir matching).
/// 4. Returns `stub_pid` as last resort (controller will handle the dead PID).
pub fn resolve_real_pid_impl(
    stub_pid: u32,
    track_name: Option<&str>,
    exe_path: &str,
    is_alive: impl Fn(u32) -> bool,
    find_by_name: impl Fn(&str) -> Vec<u32>,
    find_by_exe_path: impl Fn(&str) -> Vec<u32>,
) -> u32 {
    if is_alive(stub_pid) {
        return stub_pid;
    }

    if let Some(name) = track_name {
        if let Some(&pid) = find_by_name(name).first() {
            return pid;
        }
    }

    if let Some(&pid) = find_by_exe_path(exe_path).first() {
        return pid;
    }

    stub_pid
}

/// Resolves the real PID after spawning — waits briefly then delegates to
/// `resolve_real_pid_impl` with real sysinfo lookups.
pub fn resolve_real_pid(stub_pid: u32, app: &ManagedApp) -> u32 {
    std::thread::sleep(Duration::from_millis(500));
    resolve_real_pid_impl(
        stub_pid,
        app.track_process_name.as_deref(),
        &app.exe_path,
        crate::process_killer::is_pid_alive,
        |name| crate::process_killer::find_pids_by_name(name),
        |path| crate::process_killer::find_pids_by_exe_path(path),
    )
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::ManagedApp;

    // ── resolve_working_dir ──────────────────────────────────────────────────

    #[test]
    fn should_use_provided_working_dir_when_specified() {
        let result = resolve_working_dir("C:/apps/SimHub/SimHub.exe", Some("C:/custom"));
        assert_eq!(result, "C:/custom");
    }

    #[test]
    fn should_use_exe_parent_dir_when_working_dir_is_none() {
        let result = resolve_working_dir("C:/apps/SimHub/SimHub.exe", None);
        assert_eq!(result, "C:/apps/SimHub");
    }

    #[test]
    fn should_use_exe_parent_dir_when_working_dir_is_blank() {
        let result = resolve_working_dir("C:/apps/SimHub/SimHub.exe", Some("  "));
        assert_eq!(result, "C:/apps/SimHub");
    }

    #[test]
    fn should_use_exe_dir_when_exe_has_no_parent() {
        let result = resolve_working_dir("SimHub.exe", None);
        assert_eq!(result, ".");
    }

    // ── build_command ────────────────────────────────────────────────────────

    #[test]
    fn should_return_only_exe_when_args_is_none() {
        let cmd = build_command("C:/apps/SimHub.exe", None);
        assert_eq!(cmd, vec!["C:/apps/SimHub.exe"]);
    }

    #[test]
    fn should_return_only_exe_when_args_is_blank() {
        let cmd = build_command("C:/apps/SimHub.exe", Some("  "));
        assert_eq!(cmd, vec!["C:/apps/SimHub.exe"]);
    }

    #[test]
    fn should_split_args_and_prepend_exe() {
        let cmd = build_command("C:/apps/app.exe", Some("--flag value"));
        assert_eq!(cmd, vec!["C:/apps/app.exe", "--flag", "value"]);
    }

    #[test]
    fn should_preserve_quoted_args_as_single_token() {
        let cmd = build_command("C:/apps/app.exe", Some(r#"--name "My Profile""#));
        assert_eq!(cmd, vec!["C:/apps/app.exe", "--name", "My Profile"]);
    }

    // ── launch ───────────────────────────────────────────────────────────────

    #[test]
    fn should_return_exe_not_found_when_path_does_not_exist() {
        let app = ManagedApp::new("p1", "Ghost App", "C:/nonexistent/ghost.exe");
        let result = launch(&app);
        assert_eq!(result, Err(LaunchError::ExeNotFound("C:/nonexistent/ghost.exe".into())));
    }

    // ── resolve_real_pid_impl ────────────────────────────────────────────────

    #[test]
    fn should_return_stub_pid_when_process_is_still_alive() {
        let pid = resolve_real_pid_impl(
            1234,
            None,
            "C:/app/app.exe",
            |_| true,   // stub is alive
            |_| vec![],
            |_| vec![],
        );
        assert_eq!(pid, 1234);
    }

    #[test]
    fn should_find_by_track_name_when_stub_dies() {
        let pid = resolve_real_pid_impl(
            1234,
            Some("RealApp.exe"),
            "C:/app/launcher.exe",
            |_| false,          // stub died
            |_| vec![5678],     // found by name
            |_| vec![],
        );
        assert_eq!(pid, 5678);
    }

    #[test]
    fn should_prefer_track_name_over_exe_path_search() {
        let pid = resolve_real_pid_impl(
            1234,
            Some("RealApp.exe"),
            "C:/app/launcher.exe",
            |_| false,
            |_| vec![5678],  // track name result
            |_| vec![9999],  // exe path result — should be ignored
        );
        assert_eq!(pid, 5678);
    }

    #[test]
    fn should_find_by_exe_path_when_stub_dies_and_no_track_name() {
        let pid = resolve_real_pid_impl(
            1234,
            None,
            "C:/Kapps/Kapps.exe",
            |_| false,
            |_| vec![],
            |_| vec![5678],  // found via Squirrel subdir matching
        );
        assert_eq!(pid, 5678);
    }

    #[test]
    fn should_return_stub_pid_as_fallback_when_nothing_found() {
        let pid = resolve_real_pid_impl(
            1234,
            Some("Ghost.exe"),
            "C:/app/launcher.exe",
            |_| false,
            |_| vec![],  // not found by name
            |_| vec![],  // not found by path
        );
        assert_eq!(pid, 1234);
    }

    // ── Manual integration tests (require real executables) ──────────────────
    //
    // Run with:
    //   cargo test --manifest-path src-tauri/Cargo.toml -- --ignored --nocapture

    #[test]
    #[ignore]
    fn manual_should_launch_winver_and_return_pid() {
        // winver.exe is a true Win32 app (not MSIX) — TerminateProcess works reliably
        let mut app = ManagedApp::new("p1", "WinVer", "C:/Windows/System32/winver.exe");
        app.start_minimized = true;

        let result = launch(&app);
        assert!(result.is_ok(), "launch failed: {:?}", result);

        let stub_pid = result.unwrap();
        assert!(stub_pid > 0);
        println!("[launcher integration] PID: {stub_pid}");

        let real_pid = resolve_real_pid(stub_pid, &app);
        println!("[launcher integration] resolved PID: {real_pid}");

        std::thread::sleep(std::time::Duration::from_secs(1));
        crate::process_killer::force_kill(real_pid);

        std::thread::sleep(std::time::Duration::from_secs(1));
        assert!(!crate::process_killer::is_pid_alive(real_pid), "process should be dead");
        println!("[launcher integration] ✓ process killed");
    }

}
