use std::collections::HashMap;
use std::sync::{Arc, Mutex};

pub type IconCache = Arc<Mutex<HashMap<String, Option<String>>>>;

pub fn new_cache() -> IconCache {
    Arc::new(Mutex::new(HashMap::new()))
}

/// Extracts the associated icon from an exe via PowerShell, returns base64 PNG.
/// Caches result (including None on failure) to avoid re-running PowerShell.
pub fn extract(exe_path: &str, cache: &IconCache) -> Option<String> {
    {
        let lock = cache.lock().unwrap();
        if let Some(cached) = lock.get(exe_path) {
            return cached.clone();
        }
    }

    let result = run_powershell(exe_path);
    cache.lock().unwrap().insert(exe_path.to_string(), result.clone());
    result
}

fn run_powershell(exe_path: &str) -> Option<String> {
    let escaped = exe_path.replace('\'', "''");
    let script = format!(
        "try {{ \
         Add-Type -AssemblyName System.Drawing; \
         $p = '{escaped}'; \
         if (-not (Test-Path $p)) {{ exit 1 }}; \
         $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($p); \
         if ($null -eq $icon) {{ exit 2 }}; \
         $bmp = $icon.ToBitmap(); \
         $ms = New-Object System.IO.MemoryStream; \
         $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); \
         [Convert]::ToBase64String($ms.ToArray()) \
         }} catch {{ Write-Error $_.Exception.Message; exit 99 }}"
    );

    let output = std::process::Command::new("powershell.exe")
        .args(["-NonInteractive", "-NoProfile", "-Command", &script])
        .output();

    match output {
        Err(e) => {
            eprintln!("[icon_extractor] failed to spawn powershell: {e}");
            None
        }
        Ok(o) => {
            if !o.status.success() {
                let stderr = String::from_utf8_lossy(&o.stderr);
                eprintln!("[icon_extractor] powershell exit {:?} for {exe_path:?}: {stderr}", o.status.code());
                return None;
            }
            let s = String::from_utf8_lossy(&o.stdout).trim().to_string();
            if s.is_empty() { None } else { Some(s) }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cache_hit_returns_stored_value_without_powershell() {
        let cache = new_cache();
        cache.lock().unwrap().insert("fake.exe".to_string(), Some("base64data".to_string()));
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
        // Second call must not spawn a new PowerShell — returns from cache
        let result = extract("C:\\does\\not\\exist\\fake.exe", &cache);
        assert!(result.is_none());
    }
}
