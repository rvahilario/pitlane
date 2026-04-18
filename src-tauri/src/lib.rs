mod commands;
mod config;
mod controller;
mod launcher;
mod models;
mod monitor;
mod process_killer;
mod watchdog;

use commands::{ConfigState, ControllerState};
use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager};

pub const EVENT_IRACING_STATUS: &str = "iracing-status";
pub const STATUS_ONLINE: &str = "online";
pub const STATUS_OFFLINE: &str = "offline";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config = config::load_config();
    let trigger = config.settings.default_trigger.clone();
    let poll_interval = config.settings.poll_interval_secs;
    let config_arc = Arc::new(Mutex::new(config));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(ConfigState(Arc::clone(&config_arc)))
        .setup(move |app| {
            let handle = app.handle().clone();
            let ctrl = controller::Controller::start(
                Arc::clone(&config_arc),
                trigger,
                poll_interval,
                move |online| {
                    let status = if online { STATUS_ONLINE } else { STATUS_OFFLINE };
                    let _ = handle.emit(EVENT_IRACING_STATUS, status);
                },
            );
            app.manage(ControllerState(ctrl));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_profiles,
            commands::get_apps,
            commands::get_settings,
            commands::get_active_profile_id,
            commands::save_settings,
            commands::add_app,
            commands::get_app_statuses,
            commands::force_launch_app,
            commands::force_kill_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
