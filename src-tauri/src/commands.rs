use std::sync::Mutex;
use tauri::State;

use crate::config::save_config;
use crate::models::{AppConfig, ManagedApp, Profile, Settings};

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
}
