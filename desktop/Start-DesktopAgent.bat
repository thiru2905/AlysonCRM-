@echo off
title Alyson Desktop Agent
cd /d "%~dp0"
echo.
echo  Alyson Desktop Agent -> http://127.0.0.1:8787
echo  Folder: %CD%
echo.

where node >nul 2>&1 || (
  echo ERROR: Node.js is required. Install from https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
)

if not exist "dist\server\index.js" (
  echo Building...
  call npm run build
)

echo.
echo  Keep this window open. In CRM click Connect Device.
echo  Press Ctrl+C to stop.
echo.
call npm run start
pause
