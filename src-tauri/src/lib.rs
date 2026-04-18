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
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};

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
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // Second instance tried to open — bring existing window to front
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .manage(ConfigState(Arc::clone(&config_arc)))
        .setup(move |app| {
            // ── Tray icon ────────────────────────────────────────────────────
            let show = MenuItem::with_id(app, "show", "Show Pitlane", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Pitlane")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    // Double-click or left-click → show window
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            // ── Controller ───────────────────────────────────────────────────
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

            // Show the window on first launch
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            // Close button → hide to tray instead of quitting
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
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
