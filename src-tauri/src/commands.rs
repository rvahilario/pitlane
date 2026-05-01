use serde::Deserialize;
use std::sync::{Arc, Mutex};
use tauri::menu::{Menu, MenuItem};
use tauri::{AppHandle, State};
use tauri_plugin_autostart::ManagerExt;

use crate::config::save_config;
use crate::controller::{AppStatus, Controller, LogEntry};
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
    pub force_kill_on_stop: Option<bool>,
    pub kill_process_tree: Option<bool>,
    pub stop_with_iracing: Option<bool>,
}

impl NewApp {
    pub fn into_managed(self, profile_id: &str) -> ManagedApp {
        let mut managed = ManagedApp::new(profile_id, self.name, self.exe_path);
        if let Some(v) = self.args {
            managed.args = non_empty(v);
        }
        if let Some(v) = self.working_dir {
            managed.working_dir = non_empty(v);
        }
        if let Some(v) = self.enabled {
            managed.enabled = v;
        }
        if let Some(v) = self.start_minimized {
            managed.start_minimized = v;
        }
        if let Some(v) = self.restart_on_crash {
            managed.restart_on_crash = v;
        }
        if let Some(v) = self.max_restart_attempts {
            managed.max_restart_attempts = v;
        }
        if let Some(v) = self.startup_delay_secs {
            managed.startup_delay_secs = v;
        }
        if let Some(v) = self.track_process_name {
            managed.track_process_name = non_empty(v);
        }
        if let Some(v) = self.force_kill_on_stop {
            managed.force_kill_on_stop = v;
        }
        if let Some(v) = self.kill_process_tree {
            managed.kill_process_tree = v;
        }
        if let Some(v) = self.stop_with_iracing {
            managed.stop_with_iracing = v;
        }
        managed
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateApp {
    pub name: Option<String>,
    pub exe_path: Option<String>,
    pub args: Option<String>,
    pub working_dir: Option<String>,
    pub enabled: Option<bool>,
    pub start_minimized: Option<bool>,
    pub restart_on_crash: Option<bool>,
    pub max_restart_attempts: Option<u32>,
    pub startup_delay_secs: Option<f64>,
    pub track_process_name: Option<String>,
    pub force_kill_on_stop: Option<bool>,
    pub kill_process_tree: Option<bool>,
    pub stop_with_iracing: Option<bool>,
}

impl UpdateApp {
    pub fn apply_to(self, app: &mut ManagedApp) {
        if let Some(v) = self.name {
            app.name = v;
        }
        if let Some(v) = self.exe_path {
            app.exe_path = v;
        }
        if let Some(v) = self.args {
            app.args = non_empty(v);
        }
        if let Some(v) = self.working_dir {
            app.working_dir = non_empty(v);
        }
        if let Some(v) = self.enabled {
            app.enabled = v;
        }
        if let Some(v) = self.start_minimized {
            app.start_minimized = v;
        }
        if let Some(v) = self.restart_on_crash {
            app.restart_on_crash = v;
        }
        if let Some(v) = self.max_restart_attempts {
            app.max_restart_attempts = v;
        }
        if let Some(v) = self.startup_delay_secs {
            app.startup_delay_secs = v;
        }
        if let Some(v) = self.track_process_name {
            app.track_process_name = non_empty(v);
        }
        if let Some(v) = self.force_kill_on_stop {
            app.force_kill_on_stop = v;
        }
        if let Some(v) = self.kill_process_tree {
            app.kill_process_tree = v;
        }
        if let Some(v) = self.stop_with_iracing {
            app.stop_with_iracing = v;
        }
    }
}

fn non_empty(s: String) -> Option<String> {
    if s.trim().is_empty() {
        None
    } else {
        Some(s)
    }
}

pub struct ConfigState(pub Arc<Mutex<AppConfig>>);
pub struct ControllerState(pub Arc<Controller>);
pub struct IconCacheState(pub crate::icon_extractor::IconCache);

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
pub fn save_settings(
    app: AppHandle,
    state: State<ConfigState>,
    settings: Settings,
) -> Result<(), String> {
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
pub fn set_tray_labels(
    app: AppHandle,
    show_label: String,
    quit_label: String,
) -> Result<(), String> {
    let tray = app.tray_by_id(TRAY_ID).ok_or("tray not found")?;
    let show = MenuItem::with_id(&app, MENU_ITEM_SHOW, show_label, true, None::<&str>)
        .map_err(|e| e.to_string())?;
    let quit = MenuItem::with_id(&app, MENU_ITEM_QUIT, quit_label, true, None::<&str>)
        .map_err(|e| e.to_string())?;
    let menu = Menu::with_items(&app, &[&show, &quit]).map_err(|e| e.to_string())?;
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
pub fn get_log(state: State<ControllerState>) -> Vec<LogEntry> {
    state.0.get_log()
}

#[tauri::command]
pub fn get_auto_stop(state: State<ControllerState>) -> bool {
    state.0.get_auto_stop()
}

#[tauri::command]
pub fn set_auto_stop(state: State<ControllerState>, enabled: bool) {
    state.0.set_auto_stop(enabled);
}

#[tauri::command]
pub fn add_app(state: State<ConfigState>, app: NewApp) -> Result<ManagedApp, String> {
    let mut config = state.0.lock().unwrap();
    let managed = app.into_managed(&config.active_profile_id.clone());
    config.apps.push(managed.clone());
    save_config(&config)?;
    Ok(managed)
}

#[tauri::command]
pub fn update_app(
    state: State<ConfigState>,
    app_id: String,
    update: UpdateApp,
) -> Result<ManagedApp, String> {
    let mut config = state.0.lock().unwrap();
    let app = config
        .apps
        .iter_mut()
        .find(|a| a.id == app_id)
        .ok_or_else(|| format!("App not found: {app_id}"))?;
    update.apply_to(app);
    let updated = app.clone();
    save_config(&config)?;
    Ok(updated)
}

#[tauri::command]
pub fn extract_icon(state: State<IconCacheState>, exe_path: String) -> Option<String> {
    crate::icon_extractor::extract(&exe_path, &state.0)
}

#[tauri::command]
pub fn delete_app(state: State<ConfigState>, app_id: String) -> Result<(), String> {
    let mut config = state.0.lock().unwrap();
    let before = config.apps.len();
    config.apps.retain(|a| a.id != app_id);
    if config.apps.len() == before {
        return Err(format!("App not found: {app_id}"));
    }
    save_config(&config)
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
}
