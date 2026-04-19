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
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

pub const EVENT_IRACING_STATUS: &str = "iracing-status";

fn show_window(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
}
pub const STATUS_ONLINE: &str = "online";
pub const STATUS_OFFLINE: &str = "offline";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config = config::load_config();
    let trigger = config.settings.default_trigger.clone();
    let poll_interval = config.settings.poll_interval_secs;
    let autostart = config.settings.autostart;
    let config_arc = Arc::new(Mutex::new(config));

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
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

            TrayIconBuilder::with_id("main")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(false)
                .tooltip("Pitlane")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_window(tray.app_handle());
                    }
                })
                .build(app)?;

            // ── Autostart sync ───────────────────────────────────────────────
            // Sync registry to match config (handles installs/reinstalls)
            if autostart {
                let _ = app.autolaunch().enable();
            } else {
                let _ = app.autolaunch().disable();
            }

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
            show_window(app.handle());

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
            commands::set_tray_labels,
            commands::get_autostart_enabled,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
