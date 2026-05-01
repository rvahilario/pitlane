use super::*;

fn make_logic_with(states: Vec<(&str, AppState)>) -> ControllerLogic {
    let mut logic = ControllerLogic::new();
    for (id, state) in states {
        logic.states.insert(id.to_string(), state);
    }
    logic
}

#[test]
fn running_apps_returns_only_running() {
    let logic = make_logic_with(vec![
        (
            "a",
            AppState::Running {
                pid: 1,
                restart_count: 0,
            },
        ),
        ("b", AppState::Idle),
        ("c", AppState::Crashed),
    ]);
    let running: Vec<_> = logic
        .running_apps()
        .iter()
        .map(|(id, _)| id.clone())
        .collect();
    assert_eq!(running, vec!["a"]);
}

#[test]
fn crashed_app_ids_returns_only_crashed() {
    let logic = make_logic_with(vec![
        (
            "a",
            AppState::Running {
                pid: 1,
                restart_count: 0,
            },
        ),
        ("b", AppState::Crashed),
        ("c", AppState::Idle),
    ]);
    assert_eq!(logic.crashed_app_ids(), vec!["b"]);
}

#[test]
fn app_state_returns_idle_for_unknown() {
    let logic = ControllerLogic::new();
    assert_eq!(logic.app_state("nonexistent"), AppState::Idle);
}

#[test]
fn on_app_launched_sets_running_state() {
    let mut logic = ControllerLogic::new();
    logic.on_app_launched("a", 42);
    assert_eq!(
        logic.app_state("a"),
        AppState::Running {
            pid: 42,
            restart_count: 0
        }
    );
}

#[test]
fn on_app_stopped_sets_idle() {
    let mut logic = ControllerLogic::new();
    logic.on_app_launched("a", 1);
    logic.on_app_stopped("a");
    assert_eq!(logic.app_state("a"), AppState::Idle);
}

#[test]
fn on_app_gave_up_sets_crashed() {
    let mut logic = ControllerLogic::new();
    logic.on_app_launched("a", 1);
    logic.on_app_gave_up("a");
    assert_eq!(logic.app_state("a"), AppState::Crashed);
}

// ── stop_with_iracing filter ──────────────────────────────────────────────────

fn make_app_with_stop(id: &str, stop_with_iracing: bool) -> crate::models::ManagedApp {
    let mut app = crate::models::ManagedApp::new("p1", id, format!("{id}.exe"));
    app.id = id.to_string();
    app.stop_with_iracing = stop_with_iracing;
    app
}

fn config_with_apps(apps: Vec<crate::models::ManagedApp>) -> crate::models::AppConfig {
    let mut config = crate::models::AppConfig::default();
    config.apps = apps;
    config
}

#[test]
fn kill_ids_excludes_running_apps_with_stop_with_iracing_false() {
    let app_stop = make_app_with_stop("app_stop", true);
    let app_keep = make_app_with_stop("app_keep", false);
    let config = config_with_apps(vec![app_stop.clone(), app_keep.clone()]);

    let mut logic = ControllerLogic::new();
    logic.on_app_launched("app_stop", 1);
    logic.on_app_launched("app_keep", 2);

    let should_stop = |id: &str| -> bool {
        config
            .apps
            .iter()
            .find(|a| a.id == id)
            .map(|a| a.stop_with_iracing)
            .unwrap_or(true)
    };
    let ids: Vec<String> = logic
        .running_apps()
        .into_iter()
        .map(|(id, _)| id)
        .filter(|id| should_stop(id))
        .collect();

    assert!(ids.contains(&"app_stop".to_string()));
    assert!(!ids.contains(&"app_keep".to_string()));
}

#[test]
fn kill_ids_excludes_crashed_apps_with_stop_with_iracing_false() {
    let app_stop = make_app_with_stop("app_stop", true);
    let app_keep = make_app_with_stop("app_keep", false);
    let config = config_with_apps(vec![app_stop.clone(), app_keep.clone()]);

    let mut logic = ControllerLogic::new();
    logic.on_app_gave_up("app_stop");
    logic.on_app_gave_up("app_keep");

    let should_stop = |id: &str| -> bool {
        config
            .apps
            .iter()
            .find(|a| a.id == id)
            .map(|a| a.stop_with_iracing)
            .unwrap_or(true)
    };
    let ids: Vec<String> = logic
        .crashed_app_ids()
        .into_iter()
        .filter(|id| should_stop(id))
        .collect();

    assert!(ids.contains(&"app_stop".to_string()));
    assert!(!ids.contains(&"app_keep".to_string()));
}

#[test]
fn unknown_app_id_defaults_to_stop() {
    let config = config_with_apps(vec![]);
    let mut logic = ControllerLogic::new();
    logic.on_app_launched("ghost_id", 99);

    let should_stop = |id: &str| -> bool {
        config
            .apps
            .iter()
            .find(|a| a.id == id)
            .map(|a| a.stop_with_iracing)
            .unwrap_or(true)
    };
    let ids: Vec<String> = logic
        .running_apps()
        .into_iter()
        .map(|(id, _)| id)
        .filter(|id| should_stop(id))
        .collect();

    assert!(ids.contains(&"ghost_id".to_string()));
}
