use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "snake_case")]
pub enum TriggerMode {
    #[default]
    Ui,
    Race,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManagedApp {
    pub id: String,
    pub profile_id: String,
    pub name: String,
    pub exe_path: String,
    #[serde(default)]
    pub args: Option<String>,
    #[serde(default)]
    pub working_dir: Option<String>,
    #[serde(default = "default_true")]
    pub enabled: bool,
    // TODO: re-enable start_minimized in UI once spawn_minimized() bug is fixed
    #[serde(default)]
    pub start_minimized: bool,
    #[serde(default)]
    pub restart_on_crash: bool,
    #[serde(default = "default_max_restarts")]
    pub max_restart_attempts: u32,
    #[serde(default)]
    pub startup_delay_secs: f64,
    /// For launcher-style apps (e.g. Squirrel updaters) that spawn a child
    /// process with a different name/path — set this to the real process name
    /// so the controller can find and kill it on iRacing exit.
    #[serde(default)]
    pub track_process_name: Option<String>,
    /// Skip WM_CLOSE and go straight to TerminateProcess on stop.
    /// Use for apps with broken shutdown handlers (e.g. OBS 32.x crashes on WM_CLOSE).
    #[serde(default)]
    pub force_kill_on_stop: bool,
    /// Also kill all child processes spawned by this app on stop.
    /// Use for apps that spawn helper processes (e.g. G Hub spawns multiple lghub.exe).
    #[serde(default)]
    pub kill_process_tree: bool,
    /// Stop this app when iRacing closes. When false, the app keeps running after iRacing exits.
    #[serde(default = "default_true")]
    pub stop_with_iracing: bool,
}

impl ManagedApp {
    pub fn new(profile_id: impl Into<String>, name: impl Into<String>, exe_path: impl Into<String>) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            profile_id: profile_id.into(),
            name: name.into(),
            exe_path: exe_path.into(),
            args: None,
            working_dir: None,
            enabled: true,
            start_minimized: false,
            restart_on_crash: false,
            max_restart_attempts: 3,
            startup_delay_secs: 0.0,
            track_process_name: None,
            force_kill_on_stop: false,
            kill_process_tree: false,
            stop_with_iracing: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    pub id: String,
    pub name: String,
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub trigger_mode: Option<TriggerMode>,
}

impl Profile {
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name: name.into(),
            enabled: true,
            color: None,
            trigger_mode: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    #[serde(default = "default_poll_interval")]
    pub poll_interval_secs: f64,
    #[serde(default)]
    pub default_trigger: TriggerMode,
    #[serde(default = "default_true")]
    pub notifications_enabled: bool,
    #[serde(default)]
    pub autostart: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            poll_interval_secs: 1.0,
            default_trigger: TriggerMode::Ui,
            notifications_enabled: true,
            autostart: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub active_profile_id: String,
    pub profiles: Vec<Profile>,
    pub apps: Vec<ManagedApp>,
    #[serde(default)]
    pub settings: Settings,
}

impl Default for AppConfig {
    fn default() -> Self {
        let default_profile = Profile::new("Default");
        let profile_id = default_profile.id.clone();
        Self {
            active_profile_id: profile_id,
            profiles: vec![default_profile],
            apps: vec![],
            settings: Settings::default(),
        }
    }
}

fn default_true() -> bool {
    true
}
fn default_max_restarts() -> u32 {
    3
}
fn default_poll_interval() -> f64 {
    1.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn should_round_trip_app_config() {
        let config = AppConfig::default();
        let json = serde_json::to_string(&config).unwrap();
        let restored: AppConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(config.active_profile_id, restored.active_profile_id);
        assert_eq!(config.profiles.len(), restored.profiles.len());
        assert_eq!(config.profiles[0].name, restored.profiles[0].name);
    }

    #[test]
    fn should_set_active_profile_id_to_default_profile() {
        let config = AppConfig::default();
        assert_eq!(config.active_profile_id, config.profiles[0].id);
    }

    #[test]
    fn should_have_correct_managed_app_defaults() {
        let app = ManagedApp::new("p1", "SimHub", "C:/SimHub.exe");
        assert!(app.enabled);
        assert!(!app.start_minimized);
        assert!(!app.restart_on_crash);
        assert_eq!(app.max_restart_attempts, 3);
        assert_eq!(app.startup_delay_secs, 0.0);
        assert!(app.args.is_none());
        assert!(app.working_dir.is_none());
        assert!(app.track_process_name.is_none());
    }

    #[test]
    fn should_deserialize_track_process_name_as_none_when_missing() {
        let json = r#"{
            "id": "abc", "profile_id": "p1",
            "name": "Kapps", "exe_path": "C:/Kapps/Kapps.exe"
        }"#;
        let app: ManagedApp = serde_json::from_str(json).unwrap();
        assert!(app.track_process_name.is_none());
    }

    #[test]
    fn should_round_trip_track_process_name() {
        let mut app = ManagedApp::new("p1", "Kapps", "C:/Kapps/Kapps.exe");
        app.track_process_name = Some("Kapps.exe".into());
        let json = serde_json::to_string(&app).unwrap();
        let restored: ManagedApp = serde_json::from_str(&json).unwrap();
        assert_eq!(restored.track_process_name, Some("Kapps.exe".into()));
    }

    #[test]
    fn should_generate_unique_ids_for_managed_apps() {
        let a = ManagedApp::new("p1", "A", "a.exe");
        let b = ManagedApp::new("p1", "B", "b.exe");
        assert_ne!(a.id, b.id);
    }

    #[test]
    fn should_generate_unique_ids_for_profiles() {
        let a = Profile::new("A");
        let b = Profile::new("B");
        assert_ne!(a.id, b.id);
    }

    #[test]
    fn should_have_correct_profile_defaults() {
        let p = Profile::new("Racing");
        assert_eq!(p.name, "Racing");
        assert!(p.enabled);
        assert!(p.color.is_none());
        assert!(p.trigger_mode.is_none());
    }

    #[test]
    fn should_have_correct_settings_defaults() {
        let s = Settings::default();
        assert_eq!(s.poll_interval_secs, 1.0);
        assert_eq!(s.default_trigger, TriggerMode::Ui);
        assert!(s.notifications_enabled);
        assert!(!s.autostart);
    }

    #[test]
    fn should_deserialize_trigger_mode_variants() {
        let ui: TriggerMode = serde_json::from_str(r#""ui""#).unwrap();
        assert_eq!(ui, TriggerMode::Ui);

        let race: TriggerMode = serde_json::from_str(r#""race""#).unwrap();
        assert_eq!(race, TriggerMode::Race);
    }

    #[test]
    fn should_serialize_trigger_mode_variants() {
        assert_eq!(serde_json::to_string(&TriggerMode::Ui).unwrap(), r#""ui""#);
        assert_eq!(serde_json::to_string(&TriggerMode::Race).unwrap(), r#""race""#);
    }

    #[test]
    fn should_apply_serde_defaults_for_missing_optional_fields() {
        // Simulates loading a config written by an older version without new fields
        let json = r#"{
            "id": "abc",
            "profile_id": "p1",
            "name": "SimHub",
            "exe_path": "SimHub.exe"
        }"#;
        let app: ManagedApp = serde_json::from_str(json).unwrap();
        assert!(app.enabled);
        assert!(!app.start_minimized);
        assert!(!app.restart_on_crash);
        assert_eq!(app.max_restart_attempts, 3);
        assert_eq!(app.startup_delay_secs, 0.0);
    }

    #[test]
    fn should_default_stop_with_iracing_to_true() {
        let app = ManagedApp::new("p1", "SimHub", "SimHub.exe");
        assert!(app.stop_with_iracing);
    }

    #[test]
    fn should_deserialize_stop_with_iracing_as_true_when_missing() {
        // Backward compat: configs saved before this field existed must default to true
        let json = r#"{
            "id": "abc", "profile_id": "p1",
            "name": "SimHub", "exe_path": "SimHub.exe"
        }"#;
        let app: ManagedApp = serde_json::from_str(json).unwrap();
        assert!(app.stop_with_iracing);
    }

    #[test]
    fn should_round_trip_stop_with_iracing_false() {
        let mut app = ManagedApp::new("p1", "SimHub", "SimHub.exe");
        app.stop_with_iracing = false;
        let json = serde_json::to_string(&app).unwrap();
        let restored: ManagedApp = serde_json::from_str(&json).unwrap();
        assert!(!restored.stop_with_iracing);
    }
}
