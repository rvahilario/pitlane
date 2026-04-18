mod commands;
mod config;
mod models;

use commands::ConfigState;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config = config::load_config();

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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
