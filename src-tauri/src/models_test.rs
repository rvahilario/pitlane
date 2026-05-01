use super::*;

#[test]
fn should_round_trip_app_config() {
    let config = AppConfig::default();
    let json = serde_json::to_string(&config).unwrap();
    let restored: AppConfig = serde_json::from_str(&json).unwrap();
    assert_eq!(config.active_profile_id, restored.active_profile_id);
    assert_eq!(config.profiles.len(), restored.profiles.len());
    assert_eq!(config.profiles[0].name, restored.profiles[0].name);
}

#[test]
fn should_set_active_profile_id_to_default_profile() {
    let config = AppConfig::default();
    assert_eq!(config.active_profile_id, config.profiles[0].id);
}

#[test]
fn should_have_correct_managed_app_defaults() {
    let app = ManagedApp::new("p1", "SimHub", "C:/SimHub.exe");
    assert!(app.enabled);
    assert!(!app.start_minimized);
    assert!(!app.restart_on_crash);
    assert_eq!(app.max_restart_attempts, 3);
    assert_eq!(app.startup_delay_secs, 0.0);
    assert!(app.args.is_none());
    assert!(app.working_dir.is_none());
    assert!(app.track_process_name.is_none());
}

#[test]
fn should_deserialize_track_process_name_as_none_when_missing() {
    let json = r#"{
        "id": "abc", "profile_id": "p1",
        "name": "Kapps", "exe_path": "C:/Kapps/Kapps.exe"
    }"#;
    let app: ManagedApp = serde_json::from_str(json).unwrap();
    assert!(app.track_process_name.is_none());
}

#[test]
fn should_round_trip_track_process_name() {
    let mut app = ManagedApp::new("p1", "Kapps", "C:/Kapps/Kapps.exe");
    app.track_process_name = Some("Kapps.exe".into());
    let json = serde_json::to_string(&app).unwrap();
    let restored: ManagedApp = serde_json::from_str(&json).unwrap();
    assert_eq!(restored.track_process_name, Some("Kapps.exe".into()));
}

#[test]
fn should_generate_unique_ids_for_managed_apps() {
    let a = ManagedApp::new("p1", "A", "a.exe");
    let b = ManagedApp::new("p1", "B", "b.exe");
    assert_ne!(a.id, b.id);
}

#[test]
fn should_generate_unique_ids_for_profiles() {
    let a = Profile::new("A");
    let b = Profile::new("B");
    assert_ne!(a.id, b.id);
}

#[test]
fn should_have_correct_profile_defaults() {
    let p = Profile::new("Racing");
    assert_eq!(p.name, "Racing");
    assert!(p.enabled);
    assert!(p.color.is_none());
    assert!(p.trigger_mode.is_none());
}

#[test]
fn should_have_correct_settings_defaults() {
    let s = Settings::default();
    assert_eq!(s.poll_interval_secs, 1.0);
    assert_eq!(s.default_trigger, TriggerMode::Ui);
    assert!(s.notifications_enabled);
    assert!(!s.autostart);
}

#[test]
fn should_deserialize_trigger_mode_variants() {
    let ui: TriggerMode = serde_json::from_str(r#""ui""#).unwrap();
    assert_eq!(ui, TriggerMode::Ui);

    let race: TriggerMode = serde_json::from_str(r#""race""#).unwrap();
    assert_eq!(race, TriggerMode::Race);
}

#[test]
fn should_serialize_trigger_mode_variants() {
    assert_eq!(serde_json::to_string(&TriggerMode::Ui).unwrap(), r#""ui""#);
    assert_eq!(
        serde_json::to_string(&TriggerMode::Race).unwrap(),
        r#""race""#
    );
}

#[test]
fn should_apply_serde_defaults_for_missing_optional_fields() {
    let json = r#"{
        "id": "abc",
        "profile_id": "p1",
        "name": "SimHub",
        "exe_path": "SimHub.exe"
    }"#;
    let app: ManagedApp = serde_json::from_str(json).unwrap();
    assert!(app.enabled);
    assert!(!app.start_minimized);
    assert!(!app.restart_on_crash);
    assert_eq!(app.max_restart_attempts, 3);
    assert_eq!(app.startup_delay_secs, 0.0);
}

#[test]
fn should_default_stop_with_iracing_to_true() {
    let app = ManagedApp::new("p1", "SimHub", "SimHub.exe");
    assert!(app.stop_with_iracing);
}

#[test]
fn should_deserialize_stop_with_iracing_as_true_when_missing() {
    let json = r#"{
        "id": "abc", "profile_id": "p1",
        "name": "SimHub", "exe_path": "SimHub.exe"
    }"#;
    let app: ManagedApp = serde_json::from_str(json).unwrap();
    assert!(app.stop_with_iracing);
}

#[test]
fn should_round_trip_stop_with_iracing_false() {
    let mut app = ManagedApp::new("p1", "SimHub", "SimHub.exe");
    app.stop_with_iracing = false;
    let json = serde_json::to_string(&app).unwrap();
    let restored: ManagedApp = serde_json::from_str(&json).unwrap();
    assert!(!restored.stop_with_iracing);
}
