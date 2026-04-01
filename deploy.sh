#!/bin/bash

# TechLife Service - Automated Deployment Script
# This script pulls from Git, installs dependencies, builds, and restarts the app.

echo "🚀 Starting TechLife Service deployment..."

# 1. Update from repository
echo "⏬ Pulling latest changes from Git..."
git pull origin main

# 2. Install dependencies
echo "📦 Installing npm dependencies..."
npm install --production

# 3. Build the Next.js application
echo "🏗️ Building the optimized project..."
npm run build

# 4. Restart the application process
# Note: This assumes you are using PM2 with the name 'techlife'
echo "♻️ Restarting app process with PM2..."
pm2 restart techlife || pm2 start npm --name "techlife" -- start

echo "✅ Deployment complete! TechLife Service is now live."
