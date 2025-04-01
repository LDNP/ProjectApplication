#!/usr/bin/env bash

# Update packages and install Node.js & npm
sudo apt update && sudo apt install -y nodejs npm

# Install PM2 if not already installed
sudo npm install -g pm2

# Navigate to the project directory
cd ~/ProjectApplication || exit 1

# Stop the current running application (if running)
pm2 stop project_app || true

# Install backend dependencies
npm install

# Build the frontend (only if needed)
npm run build

# Restart the app with PM2 using server.js
pm2 start server.js --name project_app

# Save the PM2 process list so it starts on reboot
pm2 save

# Set PM2 to restart on reboot
pm2 startup
