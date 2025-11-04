# GitHub Actions Deployment Setup

## Required GitHub Secrets

Go to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

Add these 3 secrets:

### 1. EC2_HOST
```
Value: 13.236.12.241
```

### 2. EC2_USER
```
Value: ubuntu
```

### 3. EC2_SSH_KEY
```
Value: (paste entire content of your trendup-key.pem file)
```

**To get the key content:**
```bash
# On Windows
type C:\path\to\trendup-key.pem

# Copy everything including:
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

## How It Works

**Automatic Deployment:**
- Every push to `main` branch triggers deployment
- Builds frontend with production env vars
- Deploys to EC2 automatically
- Restarts PM2 processes

**Manual Deployment:**
- Go to Actions tab in GitHub
- Click "Deploy to EC2" workflow
- Click "Run workflow" button

## Deployment Flow

1. ✅ Checkout code
2. ✅ Build frontend (with DISABLE_WEB3=false)
3. ✅ SSH to EC2 and pull latest code
4. ✅ Install backend dependencies
5. ✅ Restart backend with PM2
6. ✅ Transfer frontend dist folder
7. ✅ Restart frontend with PM2
8. ✅ Save PM2 configuration

## Manual Deployment (Alternative)

If you prefer manual deployment, use the scripts:

**Windows:**
```powershell
.\deploy.ps1
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

Both scripts need SSH_KEY path updated in the file.

