#!/bin/bash

# Deployment Automation Tool - Development Server Stopper
# This script stops the detached Next.js development server

echo "🛑 Stopping Deployment Automation Tool development server..."

# Check if PID file exists
if [ ! -f "logs/dev-server.pid" ]; then
    echo "❌ No PID file found. Server might not be running or wasn't started with start-dev.sh"
    
    # Try to find and kill any process on port 3020
    PID=$(lsof -ti:3020)
    if [ ! -z "$PID" ]; then
        echo "🔍 Found process on port 3020 (PID: $PID). Killing it..."
        kill -9 $PID
        echo "✅ Process killed successfully!"
    else
        echo "ℹ️  No process found running on port 3020"
    fi
    exit 0
fi

# Read the PID from file
DEV_PID=$(cat logs/dev-server.pid)

# Check if the process is still running
if ps -p $DEV_PID > /dev/null; then
    echo "🔍 Found development server process (PID: $DEV_PID)"
    echo "🛑 Stopping the server..."
    
    # Try graceful shutdown first
    kill $DEV_PID
    sleep 3
    
    # Check if it's still running
    if ps -p $DEV_PID > /dev/null; then
        echo "⚠️  Graceful shutdown failed. Force killing..."
        kill -9 $DEV_PID
        sleep 1
    fi
    
    # Verify it's stopped
    if ps -p $DEV_PID > /dev/null; then
        echo "❌ Failed to stop the server"
        exit 1
    else
        echo "✅ Development server stopped successfully!"
    fi
else
    echo "ℹ️  Process with PID $DEV_PID is not running"
fi

# Clean up PID file
rm -f logs/dev-server.pid

# Also kill any remaining processes on port 3020
PID=$(lsof -ti:3020)
if [ ! -z "$PID" ]; then
    echo "🧹 Cleaning up remaining process on port 3020..."
    kill -9 $PID
fi

echo "🎉 All done! Port 3020 is now free." 