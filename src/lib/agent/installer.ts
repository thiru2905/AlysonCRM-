import path from "node:path";
import { fileURLToPath } from "node:url";

function getDesktopDir(): string {
  const env = process.env.ALYSON_DESKTOP_DIR?.trim();
  if (env) return path.resolve(env);
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../.."
  );
  return path.join(root, "desktop");
}

function getCrmUrl(): string {
  return process.env.ALYSON_CRM_URL?.trim() ?? "http://127.0.0.1:3000";
}

export function generateWindowsBat(): string {
  const desktopDir = getDesktopDir().replace(/\\/g, "/");
  const crmUrl = getCrmUrl();
  return `@echo off
title Alyson Desktop Agent
echo.
echo  Alyson Desktop Agent - starting local runtime on http://127.0.0.1:8787
echo  CRM: ${crmUrl}
echo.

set "DESKTOP_DIR=${desktopDir}"
cd /d "%DESKTOP_DIR%" || (
  echo ERROR: Could not find desktop folder at %DESKTOP_DIR%
  echo.
  echo If you moved the project, set ALYSON_DESKTOP_DIR and re-download from CRM.
  pause
  exit /b 1
)

where node >nul 2>&1 || (
  echo ERROR: Node.js is required. Install from https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules\\" (
  echo Installing desktop agent dependencies...
  call npm install
)

if not exist "dist\\server\\index.js" (
  echo Building desktop agent...
  call npm run build
)

echo.
echo  Desktop agent running. Return to Alyson CRM and click Connect Device.
echo  Press Ctrl+C to stop.
echo.
call npm run start
`;
}

export function generateWindowsPs1(): string {
  const desktopDir = getDesktopDir();
  const crmUrl = getCrmUrl();
  return `# Alyson Desktop Agent bootstrap
$ErrorActionPreference = "Stop"
$DesktopDir = "${desktopDir.replace(/\\/g, "\\\\")}"
Set-Location $DesktopDir

Write-Host ""
Write-Host "Alyson Desktop Agent -> http://127.0.0.1:8787" -ForegroundColor Green
Write-Host "CRM: ${crmUrl}" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "ERROR: Node.js is required." -ForegroundColor Red
  Read-Host "Press Enter to exit"
  exit 1
}

if (-not (Test-Path "node_modules")) { npm install }
if (-not (Test-Path "dist\\server\\index.js")) { npm run build }

npm run start
`;
}

export function getDesktopDevCommand(): string {
  const desktopDir = getDesktopDir().replace(/\\/g, "/");
  // CMD needs "cd /d" to switch drives (e.g. C: -> D:)
  return `cd /d "${desktopDir}" && npm run start`;
}
