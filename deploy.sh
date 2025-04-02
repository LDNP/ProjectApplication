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

# Create certs directory and save certificates from environment variables
mkdir -p certs
echo "$PRIVATE_KEY" > certs/privatekey.pem 
echo "$SERVER" > certs/server.crt 

# Build the frontend (only if needed)
NODE_OPTIONS=--openssl-legacy-provider npm run build

# Start the application with PM2
pm2 start server.js --name project_app

# Save the PM2 process list so it starts on reboot
pm2 save
