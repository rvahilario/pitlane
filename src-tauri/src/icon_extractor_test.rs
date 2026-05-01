use super::*;

#[test]
fn cache_hit_returns_stored_value_without_powershell() {
    let cache = new_cache();
    cache
        .lock()
        .unwrap()
        .insert("fake.exe".to_string(), Some("base64data".to_string()));
    assert_eq!(extract("fake.exe", &cache), Some("base64data".to_string()));
}

#[test]
fn cache_hit_returns_stored_none_without_powershell() {
    let cache = new_cache();
    cache.lock().unwrap().insert("fake.exe".to_string(), None);
    assert_eq!(extract("fake.exe", &cache), None);
}

#[test]
fn nonexistent_path_returns_none_and_caches_it() {
    let cache = new_cache();
    let result = extract("C:\\does\\not\\exist\\fake.exe", &cache);
    assert!(result.is_none());
    let lock = cache.lock().unwrap();
    assert!(lock.contains_key("C:\\does\\not\\exist\\fake.exe"));
}

#[test]
fn second_call_to_missing_path_hits_cache() {
    let cache = new_cache();
    extract("C:\\does\\not\\exist\\fake.exe", &cache);
    let result = extract("C:\\does\\not\\exist\\fake.exe", &cache);
    assert!(result.is_none());
}
