@echo off
REM Static fallback — prefer downloading from CRM: http://localhost:3000/api/agent/installer/windows.bat
title Alyson Desktop Agent
echo.
echo  Download the installer from Alyson CRM while the dev server is running.
echo  That version includes the correct project path for your machine.
echo.
echo  Or set ALYSON_DESKTOP_DIR to your desktop folder, e.g.:
echo    set ALYSON_DESKTOP_DIR=d:\agentic\thiru\alyson-recruiter\alysonCRM+\desktop
echo.

if defined ALYSON_DESKTOP_DIR (
  set "DESKTOP_DIR=%ALYSON_DESKTOP_DIR%"
) else (
  set "DESKTOP_DIR=%~dp0..\..\desktop"
)

cd /d "%DESKTOP_DIR%" || (
  echo ERROR: Could not find desktop folder at %DESKTOP_DIR%
  echo Open http://localhost:3000 and click Download Agent from the install popup.
  pause
  exit /b 1
)

where node >nul 2>&1 || (
  echo ERROR: Node.js is required. Install from https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules\" call npm install
if not exist "dist\server\index.js" call npm run build
echo.
echo  Desktop agent running on http://127.0.0.1:8787
call npm run start
