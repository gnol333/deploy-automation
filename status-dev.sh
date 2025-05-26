#!/bin/bash

# Deployment Automation Tool - Development Server Status Checker
# This script checks the status of the detached Next.js development server

echo "📊 Checking Deployment Automation Tool development server status..."
echo ""

# Check if PID file exists
if [ -f "logs/dev-server.pid" ]; then
    DEV_PID=$(cat logs/dev-server.pid)
    echo "📋 PID file found: $DEV_PID"
    
    # Check if the process is running
    if ps -p $DEV_PID > /dev/null; then
        echo "✅ Development server is running (PID: $DEV_PID)"
        
        # Check if port 3020 is actually being used
        PORT_PID=$(lsof -ti:3020)
        if [ "$PORT_PID" = "$DEV_PID" ]; then
            echo "🌐 Server is listening on port 3020"
            echo "🔗 URL: http://localhost:3020"
        else
            echo "⚠️  Warning: PID doesn't match port 3020 usage"
        fi
    else
        echo "❌ Process with PID $DEV_PID is not running"
        echo "🧹 Cleaning up stale PID file..."
        rm -f logs/dev-server.pid
    fi
else
    echo "📋 No PID file found"
fi

# Check what's running on port 3020
PORT_PID=$(lsof -ti:3020)
if [ ! -z "$PORT_PID" ]; then
    echo ""
    echo "🔍 Port 3020 status:"
    echo "   Process ID: $PORT_PID"
    
    # Get process details
    PROCESS_INFO=$(ps -p $PORT_PID -o pid,ppid,command --no-headers 2>/dev/null)
    if [ ! -z "$PROCESS_INFO" ]; then
        echo "   Process: $PROCESS_INFO"
    fi
else
    echo ""
    echo "🔍 Port 3020: Available (no process running)"
fi

# Check if log file exists and show recent entries
if [ -f "logs/dev-server.log" ]; then
    echo ""
    echo "📁 Recent log entries (last 5 lines):"
    echo "----------------------------------------"
    tail -5 logs/dev-server.log
    echo "----------------------------------------"
    echo "💡 To view full logs: tail -f logs/dev-server.log"
else
    echo ""
    echo "📁 No log file found"
fi

echo ""
echo "🛠️  Available commands:"
echo "   ./start-dev.sh  - Start development server"
echo "   ./stop-dev.sh   - Stop development server"
echo "   ./status-dev.sh - Check server status" 