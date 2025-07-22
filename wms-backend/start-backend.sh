#!/bin/bash

# WMS Backend Startup Script with Air (Hot Reload)

echo "Starting WMS Backend with Air (hot reload)..."

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# Add air to PATH
export PATH=$PATH:$(go env GOPATH)/bin

# Check if air is available
if ! command -v air &> /dev/null; then
    echo "Air is not installed. Installing..."
    curl -sSfL https://raw.githubusercontent.com/cosmtrek/air/master/install.sh | sh -s -- -b $(go env GOPATH)/bin
    export PATH=$PATH:$(go env GOPATH)/bin
fi

# Run air for hot reload
air 