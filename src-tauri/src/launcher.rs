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

    // TODO: spawn_minimized() is disabled — causes issues with some apps.
    // Re-enable when fixed: if app.start_minimized { return spawn_minimized(cmd, cwd); }

    command
        .spawn()
        .map(|c| c.id())
        .map_err(|e| LaunchError::SpawnFailed(e.to_string()))
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

