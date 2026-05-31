use pitlane_lib::launcher::{
    build_command, launch, launch_with_deps, resolve_real_pid, resolve_real_pid_impl,
    resolve_working_dir, LaunchError,
};
use pitlane_lib::models::ManagedApp;

// ── resolve_working_dir ──────────────────────────────────────────────────────

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

// ── build_command ────────────────────────────────────────────────────────────

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

// ── launch ───────────────────────────────────────────────────────────────────

#[test]
fn should_return_exe_not_found_when_path_does_not_exist() {
    let app = ManagedApp::new("p1", "Ghost App", "C:/nonexistent/ghost.exe");
    let result = launch(&app);
    assert_eq!(
        result,
        Err(LaunchError::ExeNotFound("C:/nonexistent/ghost.exe".into()))
    );
}

// ── launch_with_deps (injected spawner / elevator) ───────────────────────────

fn dummy_exe_path() -> (std::path::PathBuf, ManagedApp) {
    let tmp = std::env::temp_dir().join("pitlane_dummy_app.exe");
    std::fs::write(&tmp, b"").unwrap();
    let path = tmp.to_string_lossy().to_string();
    let app = ManagedApp::new("p1", "App", &path);
    (tmp, app)
}

#[test]
fn should_return_pid_when_spawn_succeeds() {
    let (_tmp, app) = dummy_exe_path();
    let result = launch_with_deps(
        &app,
        |_cmd| Ok(1234),
        |_exe, _args, _cwd| panic!("elevator should not be called"),
    );
    assert_eq!(result, Ok(1234));
}

#[test]
fn should_return_spawn_failed_when_spawn_fails_with_generic_error() {
    let (_tmp, app) = dummy_exe_path();
    let result = launch_with_deps(
        &app,
        |_cmd| Err(std::io::Error::new(std::io::ErrorKind::PermissionDenied, "access denied")),
        |_exe, _args, _cwd| panic!("elevator should not be called"),
    );
    assert_eq!(
        result,
        Err(LaunchError::SpawnFailed("access denied".into()))
    );
}

#[test]
fn should_attempt_elevation_when_spawn_fails_with_error_740() {
    let (_tmp, app) = dummy_exe_path();
    let result = launch_with_deps(
        &app,
        |_cmd| Err(std::io::Error::from_raw_os_error(740)),
        |_exe, _args, _cwd| Ok(5678),
    );
    assert_eq!(result, Ok(5678));
}

#[test]
fn should_return_spawn_failed_when_elevation_fails() {
    let (_tmp, app) = dummy_exe_path();
    let result = launch_with_deps(
        &app,
        |_cmd| Err(std::io::Error::from_raw_os_error(740)),
        |_exe, _args, _cwd| Err("user cancelled UAC".into()),
    );
    assert_eq!(
        result,
        Err(LaunchError::SpawnFailed("user cancelled UAC".into()))
    );
}

#[test]
fn should_forward_exe_args_and_cwd_to_elevator() {
    let (tmp, mut app) = dummy_exe_path();
    app.args = Some("--fullscreen".into());
    app.working_dir = Some("C:/custom".into());

    let captured = std::sync::Arc::new(std::sync::Mutex::new(None));
    let captured_clone = std::sync::Arc::clone(&captured);

    let result = launch_with_deps(
        &app,
        |_cmd| Err(std::io::Error::from_raw_os_error(740)),
        move |exe, args, cwd| {
            *captured_clone.lock().unwrap() = Some((
                exe.to_string(),
                args.to_vec(),
                cwd.to_string(),
            ));
            Ok(9999)
        },
    );

    assert_eq!(result, Ok(9999));
    let data = captured.lock().unwrap().take().unwrap();
    assert_eq!(data.0, tmp.to_string_lossy().to_string());
    assert_eq!(data.1, vec!["--fullscreen"]);
    assert_eq!(data.2, "C:/custom");
}

// ── resolve_real_pid_impl ────────────────────────────────────────────────────

#[test]
fn should_return_stub_pid_when_process_is_still_alive() {
    let pid = resolve_real_pid_impl(
        1234,
        None,
        "C:/app/app.exe",
        |_| true, // stub is alive
        |_| vec![],
        |_| vec![],
    );
    assert_eq!(pid, 1234);
}

#[test]
fn should_prefer_real_pid_when_stub_is_alive_but_handoff_detected() {
    // Squirrel scenario: stub is alive temporarily, but exe_path search
    // finds the real process in a versioned subdirectory.
    let pid = resolve_real_pid_impl(
        1234,
        None,
        "C:/Kapps/Kapps.exe",
        |_| true,       // stub is alive
        |_| vec![],     // no track name
        |_| vec![5678], // real process found via Squirrel subdir
    );
    assert_eq!(pid, 5678, "should return real PID, not the temporary stub");
}

#[test]
fn should_find_by_track_name_when_stub_dies() {
    let pid = resolve_real_pid_impl(
        1234,
        Some("RealApp.exe"),
        "C:/app/launcher.exe",
        |_| false,      // stub died
        |_| vec![5678], // found by name
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
        |_| vec![5678], // track name result
        |_| vec![9999], // exe path result — should be ignored
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
        |_| vec![5678], // found via Squirrel subdir matching
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
        |_| vec![], // not found by name
        |_| vec![], // not found by path
    );
    assert_eq!(pid, 1234);
}

// ── Manual integration tests (require real executables) ──────────────────────
//
// Run with:
//   cargo test --manifest-path src-tauri/Cargo.toml -- --ignored --nocapture

#[test]
#[ignore]
fn manual_should_launch_winver_and_return_pid() {
    let windir = std::env::var("SystemRoot").unwrap_or_else(|_| "C:\\Windows".to_string());
    let winver = format!("{windir}\\System32\\winver.exe");
    // winver.exe is a true Win32 app (not MSIX) — TerminateProcess works reliably
    let app = ManagedApp::new("p1", "WinVer", winver);
    let result = launch(&app);
    assert!(result.is_ok(), "launch failed: {:?}", result);

    let stub_pid = result.unwrap();
    assert!(stub_pid > 0);
    println!("[launcher integration] PID: {stub_pid}");

    let real_pid = resolve_real_pid(stub_pid, &app);
    println!("[launcher integration] resolved PID: {real_pid}");

    std::thread::sleep(std::time::Duration::from_secs(1));
    pitlane_lib::process_killer::force_kill(real_pid);

    std::thread::sleep(std::time::Duration::from_secs(1));
    assert!(
        !pitlane_lib::process_killer::is_pid_alive(real_pid),
        "process should be dead"
    );
    println!("[launcher integration] ✓ process killed");
}
