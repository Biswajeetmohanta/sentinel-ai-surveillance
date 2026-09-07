@echo off
title Sentinel AI Surveillance Platform
color 0B

echo ================================================================
echo           SENTINEL AI SURVEILLANCE PLATFORM -- LOCAL SETUP
echo ================================================================
echo.

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

echo [*] Starting Sentinel AI Backend Server (FastAPI + YOLO + ANPR)...
start "Sentinel AI Backend (Port 8001)" cmd /k "cd /d "%ROOT_DIR%" && .\backend\venv\Scripts\python.exe run.py"

timeout /t 3 /nobreak >nul

echo [*] Starting Sentinel AI Frontend Dashboard (Vite + React)...
start "Sentinel AI Frontend (Port 5173)" cmd /k "cd /d "%ROOT_DIR%\frontend" && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo ================================================================
echo   [OK] Sentinel AI is running locally!
echo.
echo   * Web Dashboard:   http://localhost:5173
echo   * Backend API:     http://localhost:8001
echo   * Swagger Docs:    http://localhost:8001/docs
echo   * Camera Network:  30 Live Gujarat Police CCTV Feeds
echo ================================================================
echo.
echo Opening dashboard in your default browser...
start http://localhost:5173

pause
