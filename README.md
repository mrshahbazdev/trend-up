# TrendUp - Web3 Social Platform

A decentralized social platform with blockchain voting, token integration, and community governance.

## Features

- 🗳️ **Democratic Voting** - On-chain proposal creation and voting
- 🏦 **HODL Voting** - Community-driven token protection
- 💬 **Social Features** - Posts, chat, live streaming
- 👤 **User Profiles** - Avatar, cover images, bio
- 🔐 **Multi-Auth** - Email, wallet (MetaMask), Google (coming soon)
- ☁️ **Cloud Storage** - AWS S3 for user uploads
- 🎨 **Dark/Light Mode** - Full theme support

## Tech Stack

### Frontend
- React 19
- Material-UI
- Wagmi (Web3)
- Redux Toolkit + RTK Query
- Zustand
- Vite

### Backend
- Node.js + Express
- MongoDB (Atlas)
- Redis
- JWT Authentication
- AWS S3
- Socket.io

### Blockchain
- Ethereum Mainnet
- TrendUp Token (TUP): `0x52c06a62d9495bee1dadf2ba0f5c0588a4f3c14c`

## Quick Start

### Development

```bash
# Backend
cd backend
npm install
cp env.example .env  # Configure your .env
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

**Mock Mode (No Wallet Needed):**
```env
# frontend/.env
VITE_DISABLE_WEB3=true
```

### Production Build

```bash
cd frontend
npm run build
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.

**Quick Deploy:**
```powershell
.\deploy.ps1  # Windows
```

## Documentation

- [AUTH-SYSTEM-COMPLETE.md](AUTH-SYSTEM-COMPLETE.md) - Authentication system
- [VOTING-WEB3-SETUP.md](VOTING-WEB3-SETUP.md) - Voting & Web3 integration
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide

## Environment Variables

### Frontend
```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WEB3_PROJECT_ID=your-reown-project-id
VITE_DISABLE_WEB3=true  # false for production
```

### Backend
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/trendupcoin
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=trendup-uploads
# See backend/env.example for all variables
```

## Project Structure

```
trendup-new/
├── frontend/          # React frontend
├── backend/           # Express backend
├── .github/           # GitHub Actions
├── deploy.ps1         # Deployment script
└── docker-compose.*   # Docker configuration
```

## License

MIT

