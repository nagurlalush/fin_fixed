@echo off
title CreatorVerse AI - Installer and Environment Setup
echo ============================================================
echo   CreatorVerse AI - Automatic Environment Setup
echo ============================================================
echo.

REM Detect Python executable (python or py)
set PYTHON_CMD=python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if %errorlevel% equ 0 (
        set PYTHON_CMD=py
    ) else (
        echo [ERROR] Python is not found on your system PATH!
        echo Please install Python 3.10+ from https://www.python.org/
        echo Make sure to check "Add Python to PATH" during installation.
        pause
        exit /b 1
    )
)

echo [*] Python verified successfully.
echo [*] Installing required Python packages via pip module...
%PYTHON_CMD% -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [*] Retrying with --user flag...
    %PYTHON_CMD% -m pip install --user -r requirements.txt
)
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies from requirements.txt.
    pause
    exit /b 1
)

echo [*] Initializing SQLite database and seeding demo data...
python seed.py
if %errorlevel% neq 0 (
    echo [ERROR] Database initialization failed.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Setup Complete! You can now start the server with run.bat
echo ============================================================
echo.
pause
