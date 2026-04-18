use std::path::Path;

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
    todo!()
}

/// Splits `args` string into tokens and prepends `exe_path`.
/// Returns a single-element vec when `args` is None or blank.
pub fn build_command(exe_path: &str, args: Option<&str>) -> Vec<String> {
    todo!()
}

// ── Launch ───────────────────────────────────────────────────────────────────

/// Spawns the process described by `app`. Returns the PID on success.
pub fn launch(app: &ManagedApp) -> Result<u32, LaunchError> {
    todo!()
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

    // ── Manual integration tests (require real executables) ──────────────────
    //
    // Run with:
    //   cargo test --manifest-path src-tauri/Cargo.toml -- --ignored --nocapture

    #[test]
    #[ignore]
    fn manual_should_launch_notepad_and_return_pid() {
        let mut app = ManagedApp::new("p1", "Notepad", "C:/Windows/System32/notepad.exe");
        app.start_minimized = true;

        let result = launch(&app);
        assert!(result.is_ok(), "launch failed: {:?}", result);

        let pid = result.unwrap();
        assert!(pid > 0);
        println!("[launcher integration] notepad PID: {pid}");

        // Give it a moment then kill it
        std::thread::sleep(std::time::Duration::from_secs(2));
        crate::process_killer::force_kill(pid);
    }
}
