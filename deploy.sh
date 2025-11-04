#!/bin/bash
# TrendUp Deployment Pipeline
# Run this script to deploy to EC2

set -e  # Exit on error

echo "🚀 TrendUp Deployment Pipeline"
echo "=============================="

# Configuration
EC2_IP="13.236.12.241"
EC2_USER="ubuntu"
SSH_KEY="path/to/trendup-key.pem"  # UPDATE THIS
BRANCH="main"

echo ""
echo "📋 Deployment Configuration:"
echo "   EC2 IP: $EC2_IP"
echo "   Branch: $BRANCH"
echo ""

# Step 1: Build Frontend Locally
echo "📦 Step 1: Building frontend..."
cd frontend
npm run build
cd ..

# Step 2: Commit and Push
echo ""
echo "📤 Step 2: Pushing to GitHub..."
git add .
git status
read -p "Commit message: " COMMIT_MSG
git commit -m "$COMMIT_MSG"
git push origin $BRANCH

# Step 3: Deploy to EC2
echo ""
echo "🚀 Step 3: Deploying to EC2..."

ssh -i "$SSH_KEY" $EC2_USER@$EC2_IP << 'ENDSSH'
  cd /home/ubuntu/trendup-new
  
  echo "📥 Pulling latest code..."
  git pull origin main
  
  echo "📦 Installing backend dependencies..."
  cd backend
  npm install --production
  
  echo "🔄 Restarting backend..."
  pm2 restart trendup-backend || pm2 start src/server.js --name trendup-backend
  
  echo "✅ Deployment complete!"
  pm2 status
ENDSSH

# Step 4: Transfer Frontend Dist
echo ""
echo "📁 Step 4: Transferring frontend build..."
scp -i "$SSH_KEY" -r frontend/dist/* $EC2_USER@$EC2_IP:/home/ubuntu/trendup-new/frontend/dist/

# Step 5: Restart Frontend on EC2
echo ""
echo "🔄 Step 5: Restarting frontend..."
ssh -i "$SSH_KEY" $EC2_USER@$EC2_IP << 'ENDSSH'
  pm2 restart trendup-frontend || pm2 start serve --name trendup-frontend -- /home/ubuntu/trendup-new/frontend/dist -l 3000
  pm2 save
ENDSSH

echo ""
echo "=============================="
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Your app is live at:"
echo "   Frontend: http://$EC2_IP:3000"
echo "   Backend:  http://$EC2_IP:3001"
echo ""
echo "📊 Check status:"
echo "   ssh -i $SSH_KEY $EC2_USER@$EC2_IP 'pm2 status'"
echo "=============================="

