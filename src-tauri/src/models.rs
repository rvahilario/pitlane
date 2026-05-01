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
    pub fn new(
        profile_id: impl Into<String>,
        name: impl Into<String>,
        exe_path: impl Into<String>,
    ) -> Self {
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
#[path = "models_test.rs"]
mod tests;

