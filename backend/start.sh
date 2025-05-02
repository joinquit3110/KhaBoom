#!/bin/bash
# Startup script for Render.com deployment

# Print versions and environment info
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Environment: $NODE_ENV"

# Create indexes in MongoDB if connection string is available
if [ -n "$MONGODB_URI" ]; then
  echo "Setting up MongoDB indexes..."
  node create-indexes.js
else
  echo "No MongoDB URI provided, skipping index creation"
fi

# Start the application
echo "Starting application..."
npm start
