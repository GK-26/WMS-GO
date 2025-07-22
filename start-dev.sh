#!/bin/bash

# WMS Development Startup Script
# This script splits the terminal and runs both backend and frontend

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "tmux is not installed. Please install it first:"
    echo "Ubuntu/Debian: sudo apt-get install tmux"
    echo "macOS: brew install tmux"
    echo "Arch: sudo pacman -S tmux"
    exit 1
fi

# Session name
SESSION_NAME="wms-dev"

# Kill existing session if it exists
tmux kill-session -t $SESSION_NAME 2>/dev/null

# Create new session
tmux new-session -d -s $SESSION_NAME

# Rename the first window
tmux rename-window -t $SESSION_NAME:0 "WMS Development"

# Split window vertically (left-right)
tmux split-window -h -t $SESSION_NAME:0

# Set up backend in left pane (using air for hot reload)
tmux send-keys -t $SESSION_NAME:0.0 "cd wms-backend" C-m
tmux send-keys -t $SESSION_NAME:0.0 "echo 'Starting WMS Backend with Air (hot reload)...'" C-m
tmux send-keys -t $SESSION_NAME:0.0 "export PATH=\$PATH:\$(go env GOPATH)/bin" C-m
tmux send-keys -t $SESSION_NAME:0.0 "air" C-m

# Set up frontend in right pane
tmux send-keys -t $SESSION_NAME:0.1 "cd wms-frontend" C-m
tmux send-keys -t $SESSION_NAME:0.1 "echo 'Starting WMS Frontend...'" C-m
tmux send-keys -t $SESSION_NAME:0.1 "npm start" C-m

# Add labels to panes
tmux select-pane -t $SESSION_NAME:0.0 -T "Backend (Go + Air)"
tmux select-pane -t $SESSION_NAME:0.1 -T "Frontend (React)"

# Focus on the backend pane initially
tmux select-pane -t $SESSION_NAME:0.0

# Attach to session
tmux attach-session -t $SESSION_NAME

echo "Development environment stopped."
echo "Backend was running on: http://localhost:8080"
echo "Frontend was running on: http://localhost:3000"