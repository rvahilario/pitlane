mod commands;
pub mod config;
pub mod controller;
pub mod icon_extractor;
pub mod launcher;
pub mod models;
pub mod monitor;
pub mod process_killer;
pub mod watchdog;

use commands::{ConfigState, ControllerState, IconCacheState};
use std::sync::{Arc, Mutex};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

pub const EVENT_IRACING_STATUS: &str = "iracing-status";
pub const EVENT_LOG_ENTRY: &str = "log-entry";
pub const STATUS_ONLINE: &str = "online";
pub const STATUS_OFFLINE: &str = "offline";
pub const TRAY_ID: &str = "main";
pub const MENU_ITEM_SHOW: &str = "show";
pub const MENU_ITEM_QUIT: &str = "quit";
const WINDOW_MAIN: &str = "main";

fn show_window(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window(WINDOW_MAIN) {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config = config::load_config();
    let trigger = config.settings.default_trigger.clone();
    let poll_interval = config.settings.poll_interval_secs;
    let autostart = config.settings.autostart;
    let config_arc = Arc::new(Mutex::new(config));
    let icon_cache = icon_extractor::new_cache();

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(window) = app.get_webview_window(WINDOW_MAIN) {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .manage(ConfigState(Arc::clone(&config_arc)))
        .manage(IconCacheState(icon_cache))
        .setup(move |app| {
            // ── Tray icon ────────────────────────────────────────────────────
            let show = MenuItem::with_id(app, MENU_ITEM_SHOW, "Show Pitlane", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, MENU_ITEM_QUIT, "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            TrayIconBuilder::with_id(TRAY_ID)
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(false)
                .tooltip("Pitlane")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    MENU_ITEM_SHOW => show_window(app),
                    MENU_ITEM_QUIT => app.exit(0),
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
            let handle_log = app.handle().clone();
            let ctrl = controller::Controller::start(
                Arc::clone(&config_arc),
                trigger,
                poll_interval,
                move |online| {
                    let status = if online {
                        STATUS_ONLINE
                    } else {
                        STATUS_OFFLINE
                    };
                    let _ = handle.emit(EVENT_IRACING_STATUS, status);
                },
                move |entry| {
                    let _ = handle_log.emit(EVENT_LOG_ENTRY, &entry);
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
                if window.label() == WINDOW_MAIN {
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
            commands::update_app,
            commands::delete_app,
            commands::get_iracing_status,
            commands::get_app_statuses,
            commands::force_launch_app,
            commands::force_kill_app,
            commands::get_log,
            commands::get_auto_stop,
            commands::set_auto_stop,
            commands::set_tray_labels,
            commands::get_autostart_enabled,
            commands::extract_icon,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
