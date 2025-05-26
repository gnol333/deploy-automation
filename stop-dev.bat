@echo off
REM Deployment Automation Tool - Development Server Stopper (Windows)
REM This script stops the detached Next.js development server

echo 🛑 Stopping Deployment Automation Tool development server...

REM Check if PID file exists
if not exist "logs\dev-server.pid" (
    echo ❌ No PID file found. Server might not be running or wasn't started with start-dev.bat
    
    REM Try to find and kill any process on port 3020
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3020') do (
        echo 🔍 Found process on port 3020 (PID: %%a). Killing it...
        taskkill /F /PID %%a >nul 2>&1
        if not errorlevel 1 (
            echo ✅ Process killed successfully!
        )
    )
    goto :end
)

REM Read the PID from file
set /p DEV_PID=<logs\dev-server.pid

REM Check if the process is still running
tasklist /FI "PID eq %DEV_PID%" 2>nul | find /I "%DEV_PID%" >nul
if not errorlevel 1 (
    echo 🔍 Found development server process (PID: %DEV_PID%)
    echo 🛑 Stopping the server...
    
    REM Try graceful shutdown first
    taskkill /PID %DEV_PID% >nul 2>&1
    timeout /t 3 /nobreak >nul
    
    REM Check if it's still running
    tasklist /FI "PID eq %DEV_PID%" 2>nul | find /I "%DEV_PID%" >nul
    if not errorlevel 1 (
        echo ⚠️  Graceful shutdown failed. Force killing...
        taskkill /F /PID %DEV_PID% >nul 2>&1
        timeout /t 1 /nobreak >nul
    )
    
    REM Verify it's stopped
    tasklist /FI "PID eq %DEV_PID%" 2>nul | find /I "%DEV_PID%" >nul
    if errorlevel 1 (
        echo ✅ Development server stopped successfully!
    ) else (
        echo ❌ Failed to stop the server
        pause
        exit /b 1
    )
) else (
    echo ℹ️  Process with PID %DEV_PID% is not running
)

REM Clean up PID file
if exist "logs\dev-server.pid" del "logs\dev-server.pid"

REM Also kill any remaining processes on port 3020
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3020') do (
    echo 🧹 Cleaning up remaining process on port 3020...
    taskkill /F /PID %%a >nul 2>&1
)

:end
echo 🎉 All done! Port 3020 is now free.
pause 