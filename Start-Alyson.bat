@echo off
title Alyson CRM+ Full Stack
echo.
echo  Starting Alyson CRM+ (3 services)
echo  --------------------------------
echo  1. CRM           http://localhost:3000
echo  2. Desktop Agent http://127.0.0.1:8787
echo  3. Browser MCP   http://127.0.0.1:8820
echo.
echo  Keep all 3 windows open. Press Ctrl+C in each to stop.
echo.

set "ROOT=%~dp0"
set "CRM=%ROOT%"
set "DESKTOP=%ROOT%desktop"
set "BROWSER=%ROOT%browser_agent\browser_agent"

where node >nul 2>&1 || (
  echo ERROR: Install Node.js from https://nodejs.org
  pause
  exit /b 1
)

start "Alyson CRM" cmd /k "cd /d "%CRM%" && npm run dev"
timeout /t 3 /nobreak >nul
start "Alyson Desktop Agent" cmd /k "cd /d "%DESKTOP%" && npm run dev"
timeout /t 2 /nobreak >nul
start "Alyson Browser MCP" cmd /k "cd /d "%BROWSER%" && npm run dev:server"

echo.
echo  Three terminal windows opened.
echo  Open http://localhost:3000 and click Connect Device.
echo.
pause
