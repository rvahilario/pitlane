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
    let dir = env::temp_dir().join(format!("pitlane_dir_{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&dir).unwrap();

    let config = load_from(&dir);
    assert_eq!(config.profiles[0].name, "Default");

    let _ = fs::remove_dir(&dir);
}
