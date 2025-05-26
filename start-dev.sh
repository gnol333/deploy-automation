#!/bin/bash

# Deployment Automation Tool - Development Server Starter
# This script starts the Next.js development server in detached mode

echo "🚀 Starting Deployment Automation Tool in development mode..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Make sure you're in the project directory."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Kill any existing dev server on port 3020
echo "🔍 Checking for existing processes on port 3020..."
PID=$(lsof -ti:3020)
if [ ! -z "$PID" ]; then
    echo "🛑 Killing existing process on port 3020 (PID: $PID)"
    kill -9 $PID
    sleep 2
fi

# Start the development server in detached mode
echo "🌟 Starting development server in background..."
nohup npm run dev -- --port 3020 > logs/dev-server.log 2>&1 &
DEV_PID=$!

# Save the PID for later reference
echo $DEV_PID > logs/dev-server.pid

echo "✅ Development server started successfully!"
echo "📋 Process ID: $DEV_PID"
echo "📁 Logs: logs/dev-server.log"
echo "🌐 URL: http://localhost:3020"
echo ""
echo "To stop the server, run: ./stop-dev.sh"
echo "To view logs, run: tail -f logs/dev-server.log"

# Wait a moment and check if the server started successfully
sleep 3
if ps -p $DEV_PID > /dev/null; then
    echo "🎉 Server is running in the background!"
else
    echo "❌ Failed to start the server. Check logs/dev-server.log for details."
    exit 1
fi 