@echo off
title CreatorVerse AI - Giri Automated Test Suite
echo ============================================================
echo   Running Complete CreatorVerse AI Test Suite (test_giri)
echo ============================================================
echo.

set PYTHON_CMD=python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if %errorlevel% equ 0 set PYTHON_CMD=py
)

%PYTHON_CMD% test_giri.py

echo.
echo ============================================================
echo   Test Execution Complete. See TEST_GIRI_VERIFICATION.txt
echo ============================================================
pause
