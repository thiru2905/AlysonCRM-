# Alyson Desktop Agent bootstrap (Windows PowerShell)
$ErrorActionPreference = "Stop"
$DesktopDir = Join-Path $PSScriptRoot "..\..\desktop"
Set-Location $DesktopDir

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "ERROR: Node.js is required. Install from https://nodejs.org" -ForegroundColor Red
  Read-Host "Press Enter to exit"
  exit 1
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies..."
  npm install
}

if (-not (Test-Path "dist\server\index.js")) {
  Write-Host "Building desktop agent..."
  npm run build
}

Write-Host ""
Write-Host "Alyson Desktop Agent -> http://127.0.0.1:8787" -ForegroundColor Green
Write-Host "Return to Alyson CRM and click Connect Device." -ForegroundColor Cyan
Write-Host ""
npm run start
