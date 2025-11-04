# TrendUp Deployment Pipeline for Windows
# Run this script to deploy to EC2

$ErrorActionPreference = "Stop"

Write-Host "🚀 TrendUp Deployment Pipeline" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Configuration
$EC2_IP = "13.236.12.241"
$EC2_USER = "ubuntu"
$SSH_KEY = "C:\path\to\trendup-key.pem"  # UPDATE THIS PATH
$BRANCH = "main"

Write-Host ""
Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "   EC2 IP: $EC2_IP" -ForegroundColor Gray
Write-Host "   Branch: $BRANCH" -ForegroundColor Gray
Write-Host ""

# Step 1: Build Frontend Locally
Write-Host "📦 Step 1: Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Step 2: Commit and Push
Write-Host ""
Write-Host "📤 Step 2: Pushing to GitHub..." -ForegroundColor Yellow
git add .
git status
$COMMIT_MSG = Read-Host "Commit message"
git commit -m $COMMIT_MSG
git push origin $BRANCH

# Step 3: Deploy Backend to EC2
Write-Host ""
Write-Host "🚀 Step 3: Deploying backend to EC2..." -ForegroundColor Yellow

$deployScript = @'
cd /home/ubuntu/trendup-new
echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing backend dependencies..."
cd backend
npm install --production

echo "🔄 Restarting backend..."
pm2 restart trendup-backend || pm2 start src/server.js --name trendup-backend
pm2 save

echo "✅ Backend deployed!"
pm2 status
'@

ssh -i $SSH_KEY "$EC2_USER@$EC2_IP" $deployScript

# Step 4: Transfer Frontend Dist
Write-Host ""
Write-Host "📁 Step 4: Transferring frontend build..." -ForegroundColor Yellow
scp -i $SSH_KEY -r frontend/dist/* "$EC2_USER@$EC2_IP`:/home/ubuntu/trendup-new/frontend/dist/"

# Step 5: Restart Frontend
Write-Host ""
Write-Host "🔄 Step 5: Restarting frontend..." -ForegroundColor Yellow

$frontendScript = @'
cd /home/ubuntu/trendup-new/frontend
pm2 restart trendup-frontend || pm2 start serve --name trendup-frontend -- dist -l 3000
pm2 save
'@

ssh -i $SSH_KEY "$EC2_USER@$EC2_IP" $frontendScript

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your app is live at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://$EC2_IP:3000" -ForegroundColor White
Write-Host "   Backend:  http://$EC2_IP:3001" -ForegroundColor White
Write-Host ""
Write-Host "📊 Check status:" -ForegroundColor Yellow
Write-Host "   ssh -i $SSH_KEY $EC2_USER@$EC2_IP 'pm2 status'" -ForegroundColor Gray
Write-Host "==============================" -ForegroundColor Cyan

