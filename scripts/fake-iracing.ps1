# Starts a dummy process named iRacingUI.exe to simulate iRacing being online.
# Run this script, wait for Pitlane to launch your apps, then close this window to simulate iRacing exit.

$fake = "$env:TEMP\iRacingUI.exe"

# Copy cmd.exe as iRacingUI.exe so it has the right process name
Copy-Item "$env:SystemRoot\System32\cmd.exe" $fake -Force

Write-Host "iRacing (fake) starting..." -ForegroundColor Cyan
Write-Host "Close this window to simulate iRacing exit." -ForegroundColor Yellow

$proc = Start-Process $fake -ArgumentList "/K echo [fake iRacing] Running. Close this window to stop." -PassThru

$proc.WaitForExit()

Write-Host "iRacing (fake) stopped." -ForegroundColor Red
Remove-Item $fake -ErrorAction SilentlyContinue
