# Quick Deploy Script - Updates only changed files
# Faster than full deployment

param(
    [string]$SSHKey = "C:\path\to\trendup-key.pem",  # UPDATE THIS
    [string]$EC2IP = "13.236.12.241"
)

Write-Host "⚡ Quick Deploy to EC2" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

# Check what changed
Write-Host ""
Write-Host "📋 Checking changes..." -ForegroundColor Yellow
git status --short

$changes = git status --short
if (-not $changes) {
    Write-Host "✅ No changes to deploy" -ForegroundColor Green
    exit 0
}

# Ask what to deploy
Write-Host ""
Write-Host "What do you want to deploy?" -ForegroundColor Yellow
Write-Host "1. Backend only" -ForegroundColor White
Write-Host "2. Frontend only" -ForegroundColor White
Write-Host "3. Both (full deploy)" -ForegroundColor White
$choice = Read-Host "Choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔧 Deploying Backend..." -ForegroundColor Yellow
        
        # Commit and push
        $msg = Read-Host "Commit message"
        git add backend/
        git commit -m "Backend: $msg"
        git push origin main
        
        # Deploy to EC2
        ssh -i $SSHKey ubuntu@$EC2IP @'
cd /home/ubuntu/trendup-new
git pull
cd backend
npm install --production
pm2 restart trendup-backend
pm2 logs trendup-backend --lines 20
'@
        
        Write-Host "✅ Backend deployed!" -ForegroundColor Green
    }
    
    "2" {
        Write-Host ""
        Write-Host "🎨 Deploying Frontend..." -ForegroundColor Yellow
        
        # Build
        Set-Location frontend
        npm run build
        Set-Location ..
        
        # Transfer
        scp -i $SSHKey -r frontend/dist/* ubuntu@$EC2IP`:/home/ubuntu/trendup-new/frontend/dist/
        
        # Restart
        ssh -i $SSHKey ubuntu@$EC2IP "pm2 restart trendup-frontend"
        
        Write-Host "✅ Frontend deployed!" -ForegroundColor Green
    }
    
    "3" {
        Write-Host ""
        Write-Host "🚀 Full Deployment..." -ForegroundColor Yellow
        & "$PSScriptRoot\deploy.ps1"
    }
}

Write-Host ""
Write-Host "🌐 App: http://$EC2IP:3000" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

