use std::path::Path;
use std::time::Duration;

use crate::models::ManagedApp;

const PID_RESOLVE_DELAY_MS: u64 = 500;

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

#[cfg(windows)]
fn launch_elevated(exe_path: &str, args: &[String], cwd: &str) -> Result<u32, String> {
    use windows::Win32::Foundation::CloseHandle;
    use windows::Win32::System::Threading::GetProcessId;
    use windows::Win32::UI::Shell::{
        ShellExecuteExW, SHELLEXECUTEINFOW, SEE_MASK_NOCLOSEPROCESS,
    };
    use windows::Win32::UI::WindowsAndMessaging::SW_SHOWDEFAULT;

    let verb: Vec<u16> = "runas\0".encode_utf16().collect();
    let file: Vec<u16> = exe_path.encode_utf16().chain(std::iter::once(0)).collect();
    let parameters: Vec<u16> = args.join(" ").encode_utf16().chain(std::iter::once(0)).collect();
    let directory: Vec<u16> = cwd.encode_utf16().chain(std::iter::once(0)).collect();

    let mut sei = SHELLEXECUTEINFOW {
        cbSize: std::mem::size_of::<SHELLEXECUTEINFOW>() as u32,
        fMask: SEE_MASK_NOCLOSEPROCESS,
        hwnd: windows::Win32::Foundation::HWND(std::ptr::null_mut()),
        lpVerb: windows::core::PCWSTR(verb.as_ptr()),
        lpFile: windows::core::PCWSTR(file.as_ptr()),
        lpParameters: windows::core::PCWSTR(parameters.as_ptr()),
        lpDirectory: windows::core::PCWSTR(directory.as_ptr()),
        nShow: SW_SHOWDEFAULT.0,
        hInstApp: windows::Win32::Foundation::HINSTANCE(std::ptr::null_mut()),
        lpIDList: std::ptr::null_mut(),
        lpClass: windows::core::PCWSTR(std::ptr::null()),
        hkeyClass: windows::Win32::System::Registry::HKEY(std::ptr::null_mut()),
        dwHotKey: 0,
        Anonymous: windows::Win32::UI::Shell::SHELLEXECUTEINFOW_0 {
            hMonitor: windows::Win32::Foundation::HANDLE(std::ptr::null_mut()),
        },
        hProcess: windows::Win32::Foundation::HANDLE(std::ptr::null_mut()),
    };

    unsafe {
        ShellExecuteExW(&mut sei).map_err(|e| e.to_string())?;
        if sei.hProcess.is_invalid() || sei.hProcess.0.is_null() {
            return Err("ShellExecuteExW did not return a process handle".into());
        }
        let pid = GetProcessId(sei.hProcess);
        let _ = CloseHandle(sei.hProcess);
        Ok(pid)
    }
}

/// Internal launch with injectable spawner and elevator for testability.
pub fn launch_with_deps(
    app: &ManagedApp,
    mut spawn: impl FnMut(&mut std::process::Command) -> Result<u32, std::io::Error>,
    mut elevate: impl FnMut(&str, &[String], &str) -> Result<u32, String>,
) -> Result<u32, LaunchError> {
    #[cfg(windows)]
    use std::os::windows::process::CommandExt;
    use std::process::{Command, Stdio};

    if !Path::new(&app.exe_path).exists() {
        return Err(LaunchError::ExeNotFound(app.exe_path.clone()));
    }

    let cmd = build_command(&app.exe_path, app.args.as_deref());
    let cwd = resolve_working_dir(&app.exe_path, app.working_dir.as_deref());

    #[cfg(debug_assertions)]
    println!(
        "[launcher] exe_path={} | cwd={} | args={:?}",
        app.exe_path, cwd, cmd
    );

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

    // TODO: spawn_minimized() is disabled — causes issues with some apps.
    // Re-enable when fixed: if app.start_minimized { return spawn_minimized(cmd, cwd); }

    match spawn(&mut command) {
        Ok(pid) => {
            #[cfg(debug_assertions)]
            println!("[launcher] spawn OK — stub_pid={pid}");
            Ok(pid)
        }
        Err(e) => {
            #[cfg(debug_assertions)]
            eprintln!("[launcher] spawn FAILED — {e}");
            if e.raw_os_error() == Some(740) {
                #[cfg(debug_assertions)]
                println!("[launcher] attempting elevated launch (runas)…");
                let pid = elevate(&cmd[0], &cmd[1..], cwd)
                    .map_err(LaunchError::SpawnFailed)?;
                #[cfg(debug_assertions)]
                println!("[launcher] elevated launch OK — pid={pid}");
                Ok(pid)
            } else {
                Err(LaunchError::SpawnFailed(e.to_string()))
            }
        }
    }
}

/// Spawns the process described by `app`. Returns the PID on success.
pub fn launch(app: &ManagedApp) -> Result<u32, LaunchError> {
    launch_with_deps(
        app,
        |cmd| cmd.spawn().map(|c| c.id()),
        |exe, args, cwd| launch_elevated(exe, args, cwd),
    )
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
        #[cfg(debug_assertions)]
        println!("[launcher] resolve: stub_pid={stub_pid} still alive");
        return stub_pid;
    }

    if let Some(name) = track_name {
        let pids = find_by_name(name);
        if let Some(&pid) = pids.first() {
            #[cfg(debug_assertions)]
            println!("[launcher] resolve: found by track_name='{name}' pid={pid}");
            return pid;
        }
    }

    let pids = find_by_exe_path(exe_path);
    if let Some(&pid) = pids.first() {
        #[cfg(debug_assertions)]
        println!("[launcher] resolve: found by exe_path='{exe_path}' pid={pid}");
        return pid;
    }

    #[cfg(debug_assertions)]
    println!("[launcher] resolve: fallback to stub_pid={stub_pid} (dead)");
    stub_pid
}

/// Resolves the real PID after spawning — waits briefly then delegates to
/// `resolve_real_pid_impl` with real sysinfo lookups.
pub fn resolve_real_pid(stub_pid: u32, app: &ManagedApp) -> u32 {
    std::thread::sleep(Duration::from_millis(PID_RESOLVE_DELAY_MS));
    resolve_real_pid_impl(
        stub_pid,
        app.track_process_name.as_deref(),
        &app.exe_path,
        crate::process_killer::is_pid_alive,
        |name| crate::process_killer::find_pids_by_name(name),
        |path| crate::process_killer::find_pids_by_exe_path(path),
    )
}
