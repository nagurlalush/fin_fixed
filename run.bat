@echo off
title CreatorVerse AI - Web Server Launcher
echo ============================================================
echo   Starting CreatorVerse AI Full-Stack Server
echo ============================================================
echo.

REM Verify Python is available
set PYTHON_CMD=python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if %errorlevel% equ 0 (
        set PYTHON_CMD=py
    ) else (
        echo [ERROR] Python is not installed or not in your system PATH.
        echo Please install Python from https://www.python.org/
        pause
        exit /b 1
    )
)

REM Verify Flask is installed, if not auto-install
%PYTHON_CMD% -c "import flask" >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Required packages not found. Auto-installing dependencies...
    %PYTHON_CMD% -m pip install -r requirements.txt
    if %errorlevel% neq 0 (
        %PYTHON_CMD% -m pip install --user -r requirements.txt
    )
)

REM Initialize database if not yet created
if not exist "creatorverse.db" (
    echo [*] Database not detected. Initializing database and demo records...
    %PYTHON_CMD% seed.py
)

echo [*] Launching CreatorVerse AI on http://127.0.0.1:5000 ...
echo [*] Press Ctrl+C at any time in this window to stop the server.
echo.

REM Stop any OLD server still running on port 5000 (it would keep serving old files)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 " ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

REM Launch default web browser after 2 seconds in the background
start "" cmd /c "timeout /t 2 >nul & start http://127.0.0.1:5000"

REM Run Flask application
%PYTHON_CMD% app.py

pause
