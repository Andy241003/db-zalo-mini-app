# Run both backend and frontend in new PowerShell windows
# Usage: Right-click -> Run with PowerShell, or from PowerShell: .\run_all.ps1

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "fe"

# Backend command (adjust path to python executable if needed)
$backendCmd = "cd '$backendDir'; .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --chdir '$backendDir'"
# Frontend command
$frontendCmd = "cd '$frontendDir'; npm run dev"

Write-Host "Starting backend in a new PowerShell window..."
Start-Process powershell -ArgumentList @('-NoExit','-Command',$backendCmd)
Start-Sleep -Seconds 1
Write-Host "Starting frontend in a new PowerShell window..."
Start-Process powershell -ArgumentList @('-NoExit','-Command',$frontendCmd)

Write-Host "Both processes started. Check the new windows for logs."