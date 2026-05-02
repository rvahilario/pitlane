use serde::Deserialize;
use std::sync::{Arc, Mutex};
use tauri::menu::{Menu, MenuItem};
use tauri::{AppHandle, State};
use tauri_plugin_autostart::ManagerExt;

use crate::config::save_config;
use crate::controller::{AppStatus, Controller, LogEntry};
use crate::models::{AppConfig, ManagedApp, Profile, Settings};
use crate::monitor::{PROCESS_IRACING_SIM, PROCESS_IRACING_UI};
use crate::{MENU_ITEM_QUIT, MENU_ITEM_SHOW, TRAY_ID};
use sysinfo::{ProcessesToUpdate, System};

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
pub fn get_iracing_exe_path() -> Option<String> {
    let mut sys = System::new();
    sys.refresh_processes(ProcessesToUpdate::All, true);

    sys.processes().values().find_map(|process| {
        let name = process.name().to_string_lossy();
        let bare_name = name.trim_end_matches(".exe");
        let is_iracing = name.eq_ignore_ascii_case(PROCESS_IRACING_UI)
            || name.eq_ignore_ascii_case(PROCESS_IRACING_SIM)
            || bare_name.eq_ignore_ascii_case("iRacingUI")
            || bare_name.eq_ignore_ascii_case("iRacingSim64DX11");

        if is_iracing {
            process.exe().map(|path| path.to_string_lossy().into_owned())
        } else {
            None
        }
    })
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
#[path = "commands_test.rs"]
mod tests;
