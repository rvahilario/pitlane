# Build a production installer locally.
# Output: src-tauri/target/release/bundle/nsis/   (NSIS .exe)
#         src-tauri/target/release/bundle/msi/    (MSI)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Building Pitlane release..." -ForegroundColor Cyan
npm run tauri build

$nsis = Get-ChildItem "src-tauri/target/release/bundle/nsis" -Filter "*.exe" -ErrorAction SilentlyContinue
$msi  = Get-ChildItem "src-tauri/target/release/bundle/msi"  -Filter "*.msi" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Artifacts:" -ForegroundColor Green
if ($nsis) { $nsis | ForEach-Object { Write-Host "  NSIS  $_" } }
if ($msi)  { $msi  | ForEach-Object { Write-Host "  MSI   $_" } }
