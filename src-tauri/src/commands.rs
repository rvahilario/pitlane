use std::sync::{Arc, Mutex};
use serde::Deserialize;
use tauri::{AppHandle, State};
use tauri::menu::{Menu, MenuItem};
use tauri_plugin_autostart::ManagerExt;

use crate::config::save_config;
use crate::controller::{AppStatus, Controller};
use crate::models::{AppConfig, ManagedApp, Profile, Settings};
use crate::{MENU_ITEM_QUIT, MENU_ITEM_SHOW, TRAY_ID};

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

impl NewApp {
    pub fn into_managed(self, profile_id: &str) -> ManagedApp {
        let mut managed = ManagedApp::new(profile_id, self.name, self.exe_path);
        if let Some(v) = self.args                 { managed.args = Some(v); }
        if let Some(v) = self.working_dir          { managed.working_dir = Some(v); }
        if let Some(v) = self.enabled              { managed.enabled = v; }
        if let Some(v) = self.start_minimized      { managed.start_minimized = v; }
        if let Some(v) = self.restart_on_crash     { managed.restart_on_crash = v; }
        if let Some(v) = self.max_restart_attempts { managed.max_restart_attempts = v; }
        if let Some(v) = self.startup_delay_secs   { managed.startup_delay_secs = v; }
        if let Some(v) = self.track_process_name   { managed.track_process_name = Some(v); }
        managed
    }
}

pub struct ConfigState(pub Arc<Mutex<AppConfig>>);
pub struct ControllerState(pub Arc<Controller>);

pub fn autostart_changed(old: &Settings, new: &Settings) -> Option<bool> {
    if old.autostart != new.autostart {
        Some(new.autostart)
    } else {
        None
    }
}

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
pub fn save_settings(app: AppHandle, state: State<ConfigState>, settings: Settings) -> Result<(), String> {
    let mut config = state.0.lock().unwrap();
    if let Some(enabled) = autostart_changed(&config.settings, &settings) {
        if enabled {
            app.autolaunch().enable().map_err(|e| e.to_string())?;
        } else {
            app.autolaunch().disable().map_err(|e| e.to_string())?;
        }
    }
    config.settings = settings;
    save_config(&config)
}

#[tauri::command]
pub fn get_autostart_enabled(app: AppHandle) -> Result<bool, String> {
    app.autolaunch().is_enabled().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_tray_labels(app: AppHandle, show_label: String, quit_label: String) -> Result<(), String> {
    let tray = app.tray_by_id(TRAY_ID).ok_or("tray not found")?;
    let show = MenuItem::with_id(&app, MENU_ITEM_SHOW, show_label, true, None::<&str>)
        .map_err(|e| e.to_string())?;
    let quit = MenuItem::with_id(&app, MENU_ITEM_QUIT, quit_label, true, None::<&str>)
        .map_err(|e| e.to_string())?;
    let menu = Menu::with_items(&app, &[&show, &quit])
        .map_err(|e| e.to_string())?;
    tray.set_menu(Some(menu)).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_iracing_status(state: State<ControllerState>) -> bool {
    state.0.is_iracing_online()
}

#[tauri::command]
pub fn get_app_statuses(state: State<ControllerState>) -> Vec<AppStatus> {
    state.0.app_statuses()
}

#[tauri::command]
pub fn force_launch_app(state: State<ControllerState>, app_id: String) -> Result<(), String> {
    state.0.force_launch(&app_id)
}

#[tauri::command]
pub fn force_kill_app(state: State<ControllerState>, app_id: String) {
    state.0.force_kill(&app_id);
}

#[tauri::command]
pub fn add_app(state: State<ConfigState>, app: NewApp) -> Result<ManagedApp, String> {
    let mut config = state.0.lock().unwrap();
    let managed = app.into_managed(&config.active_profile_id.clone());
    config.apps.push(managed.clone());
    save_config(&config)?;
    Ok(managed)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::ManagedApp;

    // ── autostart_changed ─────────────────────────────────────────────────────

    #[test]
    fn autostart_changed_returns_none_when_unchanged() {
        let s = Settings::default(); // autostart: false
        assert_eq!(autostart_changed(&s, &s.clone()), None);
    }

    #[test]
    fn autostart_changed_returns_none_when_both_true() {
        let s = Settings { autostart: true, ..Settings::default() };
        assert_eq!(autostart_changed(&s, &s.clone()), None);
    }

    #[test]
    fn autostart_changed_returns_some_true_when_enabled() {
        let old = Settings { autostart: false, ..Settings::default() };
        let new = Settings { autostart: true, ..Settings::default() };
        assert_eq!(autostart_changed(&old, &new), Some(true));
    }

    #[test]
    fn autostart_changed_returns_some_false_when_disabled() {
        let old = Settings { autostart: true, ..Settings::default() };
        let new = Settings { autostart: false, ..Settings::default() };
        assert_eq!(autostart_changed(&old, &new), Some(false));
    }

    // ── manual integration test (needs Windows registry) ─────────────────────

    /// cargo test -p pitlane -- autostart_registry --ignored --nocapture
    #[test]
    #[ignore]
    fn autostart_registry_key_is_created_and_removed() {
        // This test requires a running Tauri app with the autostart plugin — not
        // callable in unit-test context. Verify manually via regedit:
        //   HKCU\Software\Microsoft\Windows\CurrentVersion\Run\pitlane
        // Enable: save_settings with autostart=true → key should appear.
        // Disable: save_settings with autostart=false → key should disappear.
        println!("Run the app, toggle autostart in Settings, and verify the registry key.");
    }

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
