# Starts Pitlane with WebView2 remote debugging enabled on port 9222.
# Run this BEFORE `npm run test:e2e` when you want to keep the app alive between runs.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/start-e2e.ps1
#   ! powershell -ExecutionPolicy Bypass -File scripts/start-e2e.ps1

$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-port=9222"

$binary = "src-tauri\target\debug\pitlane.exe"
if (-not (Test-Path $binary)) {
    Write-Host "Binary not found. Building..." -ForegroundColor Yellow
    cargo build --manifest-path src-tauri/Cargo.toml
}

Write-Host "Starting Pitlane with CDP on port 9222..." -ForegroundColor Cyan
& $binary
