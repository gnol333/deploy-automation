@echo off
REM Deployment Automation Tool - Development Server Starter (Windows)
REM This script starts the Next.js development server in detached mode

echo 🚀 Starting Deployment Automation Tool in development mode...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json not found. Make sure you're in the project directory.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Kill any existing dev server on port 3020
echo 🔍 Checking for existing processes on port 3020...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3020') do (
    echo 🛑 Killing existing process on port 3020 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

REM Start the development server in detached mode
echo 🌟 Starting development server in background...
start /B npm run dev -- --port 3020 > logs\dev-server.log 2>&1

REM Wait a moment for the server to start
timeout /t 3 /nobreak >nul

REM Find the new process ID
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3020') do (
    echo %%a > logs\dev-server.pid
    set DEV_PID=%%a
)

if defined DEV_PID (
    echo ✅ Development server started successfully!
    echo 📋 Process ID: %DEV_PID%
    echo 📁 Logs: logs\dev-server.log
    echo 🌐 URL: http://localhost:3020
    echo.
    echo To stop the server, run: stop-dev.bat
    echo To view logs, run: type logs\dev-server.log
    echo 🎉 Server is running in the background!
) else (
    echo ❌ Failed to start the server. Check logs\dev-server.log for details.
    pause
    exit /b 1
)

pause 