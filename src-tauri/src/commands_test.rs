use super::*;
use crate::models::ManagedApp;

// ── autostart_changed ─────────────────────────────────────────────────────────

#[test]
fn autostart_changed_returns_none_when_unchanged() {
    let s = Settings::default();
    assert_eq!(autostart_changed(&s, &s.clone()), None);
}

#[test]
fn autostart_changed_returns_none_when_both_true() {
    let s = Settings {
        autostart: true,
        ..Settings::default()
    };
    assert_eq!(autostart_changed(&s, &s.clone()), None);
}

#[test]
fn autostart_changed_returns_some_true_when_enabled() {
    let old = Settings {
        autostart: false,
        ..Settings::default()
    };
    let new = Settings {
        autostart: true,
        ..Settings::default()
    };
    assert_eq!(autostart_changed(&old, &new), Some(true));
}

#[test]
fn autostart_changed_returns_some_false_when_disabled() {
    let old = Settings {
        autostart: true,
        ..Settings::default()
    };
    let new = Settings {
        autostart: false,
        ..Settings::default()
    };
    assert_eq!(autostart_changed(&old, &new), Some(false));
}

/// cargo test -p pitlane -- autostart_registry --ignored --nocapture
#[test]
#[ignore]
fn autostart_registry_key_is_created_and_removed() {
    println!("Run the app, toggle autostart in Settings, and verify the registry key.");
}

fn config_with_two_profiles() -> AppConfig {
    let mut config = AppConfig::default();
    let profile_a_id = config.profiles[0].id.clone();

    let profile_b = crate::models::Profile::new("B");
    let profile_b_id = profile_b.id.clone();
    config.profiles.push(profile_b);

    config
        .apps
        .push(ManagedApp::new(&profile_a_id, "SimHub", "SimHub.exe"));
    config
        .apps
        .push(ManagedApp::new(&profile_a_id, "CrewChief", "CrewChief.exe"));
    config.apps.push(ManagedApp::new(
        &profile_b_id,
        "VoiceAttack",
        "VoiceAttack.exe",
    ));

    config.active_profile_id = profile_a_id;
    config
}

#[test]
fn should_return_only_apps_for_active_profile() {
    let config = config_with_two_profiles();
    let apps = apps_for_active_profile(&config);
    assert_eq!(apps.len(), 2);
    assert!(apps
        .iter()
        .all(|a| a.profile_id == config.active_profile_id));
}

#[test]
fn should_return_empty_when_active_profile_has_no_apps() {
    let mut config = config_with_two_profiles();
    let profile_b_id = config.profiles[1].id.clone();
    config.active_profile_id = profile_b_id.clone();
    config.apps.retain(|a| a.profile_id != profile_b_id);

    let apps = apps_for_active_profile(&config);
    assert!(apps.is_empty());
}

#[test]
fn should_not_leak_apps_from_other_profiles() {
    let config = config_with_two_profiles();
    let apps = apps_for_active_profile(&config);
    assert!(!apps.iter().any(|a| a.name == "VoiceAttack"));
}

fn new_app(name: &str, exe_path: &str) -> NewApp {
    NewApp {
        name: name.into(),
        exe_path: exe_path.into(),
        args: None,
        working_dir: None,
        enabled: None,
        start_minimized: None,
        restart_on_crash: None,
        max_restart_attempts: None,
        startup_delay_secs: None,
        track_process_name: None,
        force_kill_on_stop: None,
        kill_process_tree: None,
        stop_with_iracing: None,
    }
}

fn add_app_to(config: &mut AppConfig, input: NewApp) -> ManagedApp {
    let managed = input.into_managed(&config.active_profile_id.clone());
    config.apps.push(managed.clone());
    managed
}

#[test]
fn should_add_app_to_active_profile() {
    let mut config = AppConfig::default();
    let added = add_app_to(&mut config, new_app("SimHub", "SimHub.exe"));
    assert_eq!(added.profile_id, config.active_profile_id);
    assert_eq!(config.apps.len(), 1);
}

#[test]
fn should_use_defaults_when_optional_fields_are_omitted() {
    let mut config = AppConfig::default();
    let added = add_app_to(&mut config, new_app("SimHub", "SimHub.exe"));
    assert!(added.enabled);
    assert!(!added.restart_on_crash);
    assert_eq!(added.max_restart_attempts, 3);
    assert_eq!(added.startup_delay_secs, 0.0);
}

#[test]
fn should_apply_optional_overrides_when_provided() {
    let mut config = AppConfig::default();
    let input = NewApp {
        name: "CrewChief".into(),
        exe_path: "CrewChief.exe".into(),
        args: Some("--flag".into()),
        working_dir: Some("C:\\CC".into()),
        enabled: Some(false),
        start_minimized: Some(false),
        restart_on_crash: Some(true),
        max_restart_attempts: Some(5),
        startup_delay_secs: Some(2.5),
        track_process_name: Some("CrewChiefV4.exe".into()),
        force_kill_on_stop: None,
        kill_process_tree: None,
        stop_with_iracing: None,
    };
    let added = add_app_to(&mut config, input);
    assert_eq!(added.args, Some("--flag".into()));
    assert!(!added.enabled);
    assert!(added.restart_on_crash);
    assert_eq!(added.max_restart_attempts, 5);
    assert_eq!(added.startup_delay_secs, 2.5);
    assert_eq!(added.track_process_name, Some("CrewChiefV4.exe".into()));
}

#[test]
fn should_treat_empty_string_as_none_for_nullable_fields() {
    let mut config = AppConfig::default();
    let input = NewApp {
        name: "SimHub".into(),
        exe_path: "SimHub.exe".into(),
        args: Some("".into()),
        working_dir: Some("   ".into()),
        track_process_name: Some("".into()),
        ..new_app("SimHub", "SimHub.exe")
    };
    let added = add_app_to(&mut config, input);
    assert!(added.args.is_none());
    assert!(added.working_dir.is_none());
    assert!(added.track_process_name.is_none());
}

fn update_app_in(
    config: &mut AppConfig,
    app_id: &str,
    update: UpdateApp,
) -> Result<ManagedApp, String> {
    let app = config
        .apps
        .iter_mut()
        .find(|a| a.id == app_id)
        .ok_or_else(|| format!("App not found: {app_id}"))?;
    update.apply_to(app);
    Ok(app.clone())
}

#[test]
fn should_update_app_name_and_exe() {
    let mut config = AppConfig::default();
    let added = add_app_to(&mut config, new_app("SimHub", "SimHub.exe"));
    let update = UpdateApp {
        name: Some("SimHub 2".into()),
        exe_path: Some("SimHub2.exe".into()),
        args: None,
        working_dir: None,
        enabled: None,
        start_minimized: None,
        restart_on_crash: None,
        max_restart_attempts: None,
        startup_delay_secs: None,
        track_process_name: None,
        force_kill_on_stop: None,
        kill_process_tree: None,
        stop_with_iracing: None,
    };
    let updated = update_app_in(&mut config, &added.id, update).unwrap();
    assert_eq!(updated.name, "SimHub 2");
    assert_eq!(updated.exe_path, "SimHub2.exe");
}

#[test]
fn should_clear_nullable_field_with_empty_string_on_update() {
    let mut config = AppConfig::default();
    let mut app = ManagedApp::new(&config.active_profile_id, "SimHub", "SimHub.exe");
    app.args = Some("--flag".into());
    let id = app.id.clone();
    config.apps.push(app);
    let update = UpdateApp {
        args: Some("".into()),
        name: None,
        exe_path: None,
        working_dir: None,
        enabled: None,
        start_minimized: None,
        restart_on_crash: None,
        max_restart_attempts: None,
        startup_delay_secs: None,
        track_process_name: None,
        force_kill_on_stop: None,
        kill_process_tree: None,
        stop_with_iracing: None,
    };
    let updated = update_app_in(&mut config, &id, update).unwrap();
    assert!(updated.args.is_none());
}

#[test]
fn should_delete_app_by_id() {
    let mut config = AppConfig::default();
    let a = add_app_to(&mut config, new_app("SimHub", "SimHub.exe"));
    add_app_to(&mut config, new_app("CrewChief", "CrewChief.exe"));
    assert_eq!(config.apps.len(), 2);
    config.apps.retain(|app| app.id != a.id);
    assert_eq!(config.apps.len(), 1);
    assert_eq!(config.apps[0].name, "CrewChief");
}

#[test]
fn should_return_error_when_updating_nonexistent_app() {
    let mut config = AppConfig::default();
    let update = UpdateApp {
        name: Some("X".into()),
        exe_path: None,
        args: None,
        working_dir: None,
        enabled: None,
        start_minimized: None,
        restart_on_crash: None,
        max_restart_attempts: None,
        startup_delay_secs: None,
        track_process_name: None,
        force_kill_on_stop: None,
        kill_process_tree: None,
        stop_with_iracing: None,
    };
    let result = update_app_in(&mut config, "nonexistent-id", update);
    assert!(result.is_err());
}

#[test]
fn new_app_defaults_stop_with_iracing_to_true_when_omitted() {
    let mut config = AppConfig::default();
    let added = add_app_to(&mut config, new_app("SimHub", "SimHub.exe"));
    assert!(added.stop_with_iracing);
}

#[test]
fn new_app_respects_stop_with_iracing_false() {
    let mut config = AppConfig::default();
    let input = NewApp {
        stop_with_iracing: Some(false),
        ..new_app("SimHub", "SimHub.exe")
    };
    let added = add_app_to(&mut config, input);
    assert!(!added.stop_with_iracing);
}

#[test]
fn update_app_sets_stop_with_iracing_false() {
    let mut config = AppConfig::default();
    let added = add_app_to(&mut config, new_app("SimHub", "SimHub.exe"));
    assert!(added.stop_with_iracing);
    let update = UpdateApp {
        stop_with_iracing: Some(false),
        name: None,
        exe_path: None,
        args: None,
        working_dir: None,
        enabled: None,
        start_minimized: None,
        restart_on_crash: None,
        max_restart_attempts: None,
        startup_delay_secs: None,
        track_process_name: None,
        force_kill_on_stop: None,
        kill_process_tree: None,
    };
    let updated = update_app_in(&mut config, &added.id, update).unwrap();
    assert!(!updated.stop_with_iracing);
}

#[test]
fn update_app_re_enables_stop_with_iracing() {
    let mut config = AppConfig::default();
    let input = NewApp {
        stop_with_iracing: Some(false),
        ..new_app("SimHub", "SimHub.exe")
    };
    let added = add_app_to(&mut config, input);
    assert!(!added.stop_with_iracing);
    let update = UpdateApp {
        stop_with_iracing: Some(true),
        name: None,
        exe_path: None,
        args: None,
        working_dir: None,
        enabled: None,
        start_minimized: None,
        restart_on_crash: None,
        max_restart_attempts: None,
        startup_delay_secs: None,
        track_process_name: None,
        force_kill_on_stop: None,
        kill_process_tree: None,
    };
    let updated = update_app_in(&mut config, &added.id, update).unwrap();
    assert!(updated.stop_with_iracing);
}
