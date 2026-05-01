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
#[path = "config_test.rs"]
mod tests;

