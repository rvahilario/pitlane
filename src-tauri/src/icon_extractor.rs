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
#[path = "icon_extractor_test.rs"]
mod tests;

