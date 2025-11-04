# TrendUp Deployment Guide

## Deployment Options

### Option 1: GitHub Actions (Recommended - Automated)

**Setup Once:**
1. Add GitHub Secrets (see `.github/DEPLOYMENT-SETUP.md`)
2. Push to main branch
3. Deployment happens automatically!

**Trigger Deployment:**
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Deployment runs automatically in GitHub Actions.

---

### Option 2: PowerShell Script (Windows)

**One-time setup:**
1. Edit `deploy.ps1`
2. Update `$SSH_KEY` path to your key location
3. Save file

**Deploy:**
```powershell
.\deploy.ps1
```

**Quick Updates:**
```powershell
# For faster deploys of specific parts
.\quick-deploy.ps1

# Then choose:
# 1 = Backend only
# 2 = Frontend only  
# 3 = Full deploy
```

---

### Option 3: Bash Script (Linux/Mac)

**One-time setup:**
1. Edit `deploy.sh`
2. Update `SSH_KEY` variable
3. Make executable: `chmod +x deploy.sh`

**Deploy:**
```bash
./deploy.sh
```

---

### Option 4: Manual Deployment

**Build locally:**
```bash
cd frontend
npm run build
```

**Transfer to EC2:**
```bash
scp -i trendup-key.pem -r dist/* ubuntu@13.236.12.241:/home/ubuntu/trendup-new/frontend/dist/
```

**On EC2:**
```bash
cd /home/ubuntu/trendup-new
git pull
cd backend && npm install --production
pm2 restart all
```

---

## Environment Configuration

### Local Development
```env
# frontend/.env
VITE_API_URL=http://localhost:3001/api/v1
VITE_DISABLE_WEB3=true  # Mock mode for faster dev
```

### Production (EC2)
```env
# frontend/.env.production (for build)
VITE_API_URL=http://13.236.12.241:3001/api/v1
VITE_DISABLE_WEB3=false  # Real Web3

# backend/.env (on EC2)
NODE_ENV=production
PORT=3001
MONGODB_URI=your-atlas-connection
# ... (see backend/env.example)
```

---

## Deployment Checklist

**Before Deployment:**
- [ ] Code tested locally
- [ ] All tests passing
- [ ] Frontend builds without errors
- [ ] Backend .env configured on EC2
- [ ] MongoDB Atlas connected
- [ ] S3 credentials in backend .env

**After Deployment:**
- [ ] Check PM2 status: `ssh ubuntu@IP 'pm2 status'`
- [ ] View logs: `ssh ubuntu@IP 'pm2 logs'`
- [ ] Test frontend: `http://13.236.12.241:3000`
- [ ] Test backend health: `http://13.236.12.241:3001/health`
- [ ] Test voting features
- [ ] Check MongoDB for new records

---

## Troubleshooting

**Backend won't start:**
```bash
ssh ubuntu@13.236.12.241
pm2 logs trendup-backend --lines 50
# Check for .env errors or MongoDB connection issues
```

**Frontend not loading:**
```bash
pm2 logs trendup-frontend --lines 20
# Check if dist folder exists
ls -la /home/ubuntu/trendup-new/frontend/dist
```

**Database issues:**
- Check MongoDB Atlas IP whitelist
- Verify connection string in backend/.env
- Check backend logs for connection errors

---

## Quick Commands

```bash
# View all logs
pm2 logs

# Restart all services
pm2 restart all

# Check status
pm2 status

# Monitor in real-time
pm2 monit

# Stop all
pm2 stop all

# View backend logs only
pm2 logs trendup-backend --lines 100
```

