@echo off
echo.
echo  ========================================
echo   DzResearch Connect - Backend API
echo  ========================================
echo.
echo  API:  http://localhost:8000
echo  Docs: http://localhost:8000/docs
echo.

:: Always run from the project root (where this file lives)
cd /d "%~dp0"

:: Check if uvicorn is available
uvicorn --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: uvicorn not found!
    echo.
    echo  Fix: open a terminal in this folder and run:
    echo    pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

echo  Starting backend... ^(first start takes ~20 seconds to load AI model^)
echo  Press Ctrl+C to stop.
echo.

uvicorn app.main:app --reload --port 8000 --host 127.0.0.1

echo.
echo  Backend stopped.
pause
