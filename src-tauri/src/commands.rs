use std::sync::Mutex;
use serde::Deserialize;
use tauri::State;

use crate::config::save_config;
use crate::models::{AppConfig, ManagedApp, Profile, Settings};

#[derive(Debug, Deserialize)]
pub struct NewApp {
    pub name: String,
    pub exe_path: String,
    pub args: Option<String>,
    pub working_dir: Option<String>,
    pub enabled: Option<bool>,
    pub start_minimized: Option<bool>,
    pub restart_on_crash: Option<bool>,
    pub max_restart_attempts: Option<u32>,
    pub startup_delay_secs: Option<f64>,
    pub track_process_name: Option<String>,
}

pub struct ConfigState(pub Mutex<AppConfig>);

pub fn apps_for_active_profile(config: &AppConfig) -> Vec<ManagedApp> {
    config
        .apps
        .iter()
        .filter(|a| a.profile_id == config.active_profile_id)
        .cloned()
        .collect()
}

#[tauri::command]
pub fn get_profiles(state: State<ConfigState>) -> Vec<Profile> {
    state.0.lock().unwrap().profiles.clone()
}

#[tauri::command]
pub fn get_apps(state: State<ConfigState>) -> Vec<ManagedApp> {
    apps_for_active_profile(&state.0.lock().unwrap())
}

#[tauri::command]
pub fn get_settings(state: State<ConfigState>) -> Settings {
    state.0.lock().unwrap().settings.clone()
}

#[tauri::command]
pub fn get_active_profile_id(state: State<ConfigState>) -> String {
    state.0.lock().unwrap().active_profile_id.clone()
}

#[tauri::command]
pub fn save_settings(state: State<ConfigState>, settings: Settings) -> Result<(), String> {
    let mut config = state.0.lock().unwrap();
    config.settings = settings;
    save_config(&config)
}

#[tauri::command]
pub fn add_app(state: State<ConfigState>, app: NewApp) -> Result<ManagedApp, String> {
    let mut config = state.0.lock().unwrap();
    let mut managed = ManagedApp::new(&config.active_profile_id, app.name, app.exe_path);
    if let Some(v) = app.args             { managed.args = Some(v); }
    if let Some(v) = app.working_dir      { managed.working_dir = Some(v); }
    if let Some(v) = app.enabled          { managed.enabled = v; }
    if let Some(v) = app.start_minimized  { managed.start_minimized = v; }
    if let Some(v) = app.restart_on_crash { managed.restart_on_crash = v; }
    if let Some(v) = app.max_restart_attempts { managed.max_restart_attempts = v; }
    if let Some(v) = app.startup_delay_secs   { managed.startup_delay_secs = v; }
    if let Some(v) = app.track_process_name   { managed.track_process_name = Some(v); }
    config.apps.push(managed.clone());
    save_config(&config)?;
    Ok(managed)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::ManagedApp;

    fn config_with_two_profiles() -> AppConfig {
        let mut config = AppConfig::default();
        let profile_a_id = config.profiles[0].id.clone();

        let profile_b = crate::models::Profile::new("B");
        let profile_b_id = profile_b.id.clone();
        config.profiles.push(profile_b);

        config.apps.push(ManagedApp::new(&profile_a_id, "SimHub", "SimHub.exe"));
        config.apps.push(ManagedApp::new(&profile_a_id, "CrewChief", "CrewChief.exe"));
        config.apps.push(ManagedApp::new(&profile_b_id, "VoiceAttack", "VoiceAttack.exe"));

        config.active_profile_id = profile_a_id;
        config
    }

    #[test]
    fn should_return_only_apps_for_active_profile() {
        let config = config_with_two_profiles();
        let apps = apps_for_active_profile(&config);
        assert_eq!(apps.len(), 2);
        assert!(apps.iter().all(|a| a.profile_id == config.active_profile_id));
    }

    #[test]
    fn should_return_empty_when_active_profile_has_no_apps() {
        let mut config = config_with_two_profiles();
        let profile_b_id = config.profiles[1].id.clone();
        config.active_profile_id = profile_b_id.clone();

        // Switch active to B then remove its app
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
        }
    }

    fn add_app_to(config: &mut AppConfig, input: NewApp) -> ManagedApp {
        let mut managed = ManagedApp::new(&config.active_profile_id, input.name, input.exe_path);
        if let Some(v) = input.args             { managed.args = Some(v); }
        if let Some(v) = input.working_dir      { managed.working_dir = Some(v); }
        if let Some(v) = input.enabled          { managed.enabled = v; }
        if let Some(v) = input.start_minimized  { managed.start_minimized = v; }
        if let Some(v) = input.restart_on_crash { managed.restart_on_crash = v; }
        if let Some(v) = input.max_restart_attempts { managed.max_restart_attempts = v; }
        if let Some(v) = input.startup_delay_secs   { managed.startup_delay_secs = v; }
        if let Some(v) = input.track_process_name   { managed.track_process_name = Some(v); }
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
        assert!(added.start_minimized);
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
        };
        let added = add_app_to(&mut config, input);
        assert_eq!(added.args, Some("--flag".into()));
        assert!(!added.enabled);
        assert!(added.restart_on_crash);
        assert_eq!(added.max_restart_attempts, 5);
        assert_eq!(added.startup_delay_secs, 2.5);
        assert_eq!(added.track_process_name, Some("CrewChiefV4.exe".into()));
    }
}
