use std::fs;
use std::path::{Path, PathBuf};

use crate::models::AppConfig;

pub const APP_NAME: &str = "Pitlane";
const CONFIG_FILENAME: &str = "config.json";
const CONFIG_BACKUP_EXT: &str = "json.bak";
const CONFIG_TMP_EXT: &str = "json.tmp";

pub fn config_path() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(APP_NAME)
        .join(CONFIG_FILENAME)
}

pub fn load_from(path: &Path) -> AppConfig {
    if !path.exists() {
        return AppConfig::default();
    }

    let data = match fs::read_to_string(path) {
        Ok(d) => d,
        Err(_) => return AppConfig::default(),
    };

    serde_json::from_str(&data).unwrap_or_else(|_| {
        let backup = path.with_extension(CONFIG_BACKUP_EXT);
        let _ = fs::copy(path, &backup);
        AppConfig::default()
    })
}

pub fn save_to(path: &Path, config: &AppConfig) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let data = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;

    let tmp = path.with_extension(CONFIG_TMP_EXT);
    fs::write(&tmp, &data).map_err(|e| e.to_string())?;
    fs::rename(&tmp, path).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn load_config() -> AppConfig {
    load_from(&config_path())
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    save_to(&config_path(), config)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn tmp_path() -> PathBuf {
        env::temp_dir().join(format!("pitlane_test_{}.json", uuid::Uuid::new_v4()))
    }

    #[test]
    fn should_return_default_when_file_does_not_exist() {
        let path = tmp_path();
        let config = load_from(&path);
        assert_eq!(config.profiles.len(), 1);
        assert_eq!(config.profiles[0].name, "Default");
    }

    #[test]
    fn should_save_and_load_config_roundtrip() {
        let path = tmp_path();
        let mut config = AppConfig::default();
        config.settings.poll_interval_secs = 2.5;

        save_to(&path, &config).unwrap();
        let loaded = load_from(&path);

        assert_eq!(loaded.active_profile_id, config.active_profile_id);
        assert_eq!(loaded.settings.poll_interval_secs, 2.5);

        let _ = fs::remove_file(&path);
    }

    #[test]
    fn should_write_via_tmp_then_rename() {
        let path = tmp_path();
        let config = AppConfig::default();

        save_to(&path, &config).unwrap();

        assert!(path.exists());
        assert!(!path.with_extension("json.tmp").exists());

        let _ = fs::remove_file(&path);
    }

    #[test]
    fn should_return_default_and_create_backup_on_corrupted_json() {
        let path = tmp_path();
        fs::write(&path, b"{{not valid json}}").unwrap();

        let config = load_from(&path);

        assert_eq!(config.profiles[0].name, "Default");
        assert!(path.with_extension("json.bak").exists());

        let _ = fs::remove_file(&path);
        let _ = fs::remove_file(path.with_extension("json.bak"));
    }

    #[test]
    fn should_return_default_on_read_error() {
        // A directory path exists but read_to_string on it returns an error,
        // exercising the Err branch inside load_from.
        let dir = env::temp_dir().join(format!("pitlane_dir_{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&dir).unwrap();

        let config = load_from(&dir);
        assert_eq!(config.profiles[0].name, "Default");

        let _ = fs::remove_dir(&dir);
    }
}
