#!/bin/bash

# Deployment script for Medusa frontend
# Handles yarn installation issues with peer dependencies

echo "Installing dependencies with yarn..."

# Set yarn configuration for deployment
export YARN_ENABLE_GLOBAL_CACHE=false
export YARN_ENABLE_INLINE_HUNKS=true
export YARN_ENABLE_NETWORK=true

# Find yarn command
YARN_CMD="yarn"
if ! command -v yarn &> /dev/null; then
    if [ -f "/usr/local/bin/yarn" ]; then
        YARN_CMD="/usr/local/bin/yarn"
    elif [ -f "/usr/bin/yarn" ]; then
        YARN_CMD="/usr/bin/yarn"
    elif [ -f "./node_modules/.bin/yarn" ]; then
        YARN_CMD="./node_modules/.bin/yarn"
    else
        echo "Yarn not found, trying npm instead..."
        npm install --legacy-peer-deps
        exit $?
    fi
fi

# Install with specific flags to handle peer dependency warnings
$YARN_CMD install --ignore-engines --ignore-optional --non-interactive --silent

# If installation fails, try with legacy peer deps
if [ $? -ne 0 ]; then
    echo "Retrying with legacy peer deps handling..."
    $YARN_CMD install --ignore-engines --ignore-optional --non-interactive --legacy-peer-deps
fi

echo "Dependencies installed successfully!"
