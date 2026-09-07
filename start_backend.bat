@echo off
title Sentinel AI Backend
cd /d "%~dp0"
echo Starting Sentinel AI Backend on http://localhost:8001...
.\backend\venv\Scripts\python.exe run.py
pause
