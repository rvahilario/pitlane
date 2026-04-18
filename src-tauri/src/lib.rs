mod commands;
mod config;
mod models;
mod monitor;

use commands::ConfigState;
use monitor::{Monitor, MonitorEvent};
use std::sync::Mutex;
use tauri::Emitter;

pub const EVENT_IRACING_STATUS: &str = "iracing-status";
pub const STATUS_ONLINE: &str = "online";
pub const STATUS_OFFLINE: &str = "offline";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config = config::load_config();
    let trigger = config.settings.default_trigger.clone();
    let poll_interval = config.settings.poll_interval_secs;

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(ConfigState(Mutex::new(config)))
        .invoke_handler(tauri::generate_handler![
            commands::get_profiles,
            commands::get_apps,
            commands::get_settings,
            commands::get_active_profile_id,
            commands::save_settings,
            commands::add_app,
        ])
        .setup(move |app| {
            let handle = app.handle().clone();

            Monitor::start(trigger, poll_interval, move |event| {
                let status = match event {
                    MonitorEvent::Started => STATUS_ONLINE,
                    MonitorEvent::Stopped => STATUS_OFFLINE,
                };
                let _ = handle.emit(EVENT_IRACING_STATUS, status);
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
