#!/usr/bin/env python3
"""
Sentinel AI Surveillance Platform — Root Runner
================================================
Automatically detects the project's virtual environment and launches
the Sentinel AI backend server on http://localhost:8001.

Usage:
    python run.py
"""

import os
import sys
import subprocess

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
VENV_PYTHON_WIN = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
VENV_PYTHON_UNIX = os.path.join(BACKEND_DIR, "venv", "bin", "python")

# Choose venv executable depending on OS
venv_python = VENV_PYTHON_WIN if os.name == "nt" else VENV_PYTHON_UNIX

# 1. If we are NOT currently running with the venv Python, re-launch with it
if os.path.exists(venv_python) and os.path.abspath(sys.executable).lower() != os.path.abspath(venv_python).lower():
    print(f">> Re-launching with project virtual environment: {venv_python}")
    cmd = [venv_python, os.path.abspath(__file__)] + sys.argv[1:]
    sys.exit(subprocess.call(cmd))

# 2. Add backend directory to sys.path so all imports work seamlessly
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Switch CWD to backend so sqlite and relative paths resolve properly
os.chdir(BACKEND_DIR)

if __name__ == "__main__":
    import uvicorn
    from app.core.config import settings

    print("=" * 60)
    print("  [SENTINEL AI SURVEILLANCE PLATFORM -- LOCAL RUNNER]")
    print("=" * 60)
    print(f"  * Backend API:     http://localhost:{settings.PORT}")
    print(f"  * Interactive Docs: http://localhost:{settings.PORT}/docs")
    print(f"  * HLS Camera Grid:  All 30 Gujarat Police CCTV Feeds")
    print("=" * 60)

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
        workers=1
    )
