@echo off
setlocal enabledelayedexpansion
REM Deployment Automation Tool - Development Server Status Checker (Windows)
REM This script checks the status of the detached Next.js development server

echo 📊 Checking Deployment Automation Tool development server status...
echo.

REM Check if PID file exists
if exist "logs\dev-server.pid" (
    set /p DEV_PID=<logs\dev-server.pid
    echo 📋 PID file found: !DEV_PID!
    
    REM Check if the process is running
    tasklist /FI "PID eq !DEV_PID!" 2>nul | find /I "!DEV_PID!" >nul
    if not errorlevel 1 (
        echo ✅ Development server is running (PID: !DEV_PID!)
        
        REM Check if port 3020 is actually being used
        for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3020') do (
            if "%%a"=="!DEV_PID!" (
                echo 🌐 Server is listening on port 3020
                echo 🔗 URL: http://localhost:3020
            ) else (
                echo ⚠️  Warning: PID doesn't match port 3020 usage
            )
        )
    ) else (
        echo ❌ Process with PID !DEV_PID! is not running
        echo 🧹 Cleaning up stale PID file...
        del "logs\dev-server.pid"
    )
) else (
    echo 📋 No PID file found
)

REM Check what's running on port 3020
echo.
echo 🔍 Port 3020 status:
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3020') do (
    echo    Process ID: %%a
    
    REM Get process details
    for /f "tokens=1" %%b in ('tasklist /FI "PID eq %%a" /FO CSV /NH') do (
        echo    Process: %%b
    )
    goto :port_found
)
echo    Port 3020: Available (no process running)
:port_found

REM Check if log file exists and show recent entries
if exist "logs\dev-server.log" (
    echo.
    echo 📁 Recent log entries (last 5 lines):
    echo ----------------------------------------
    
    REM PowerShell command to get last 5 lines (Windows equivalent of tail)
    powershell -Command "Get-Content 'logs\dev-server.log' | Select-Object -Last 5"
    
    echo ----------------------------------------
    echo 💡 To view full logs: type logs\dev-server.log
) else (
    echo.
    echo 📁 No log file found
)

echo.
echo 🛠️  Available commands:
echo    start-dev.bat  - Start development server
echo    stop-dev.bat   - Stop development server
echo    status-dev.bat - Check server status

pause 