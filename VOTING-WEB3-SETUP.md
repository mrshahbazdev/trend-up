# TrendUp Voting & Web3 Integration

Complete implementation of blockchain voting system with mock mode for testing.

## Smart Contract

**TrendUp Token Contract (Mainnet):**
- Address: `0x52c06a62d9495bee1dadf2ba0f5c0588a4f3c14c`
- Network: Ethereum Mainnet
- Features: ERC20 Token + Democratic Voting + HODL Voting

## Features Implemented

### Voting System
- ✅ Democratic Voting (Create proposals, Vote Yes/No, View results)
- ✅ HODL Voting (Vote for sale restrictions)
- ✅ Vote Cooldown System (Prevents spam voting)
- ✅ Real-time Vote Results
- ✅ Vote History Tracking

### Token Features
- ✅ Balance Display
- ✅ Token Info Widget
- ✅ Sale Restriction Status
- ✅ HODL Activation Tracking

### Backend Integration
- ✅ Vote Storage in MongoDB
- ✅ Vote Records with Blockchain Hashes
- ✅ User Voting History
- ✅ HODL Vote Statistics
- ✅ 7 API Endpoints

## Mock Mode (DISABLE_WEB3)

**Purpose:** Test voting UI and APIs without connecting to blockchain

**Enable Mock Mode:**
```env
# In .env or .env.development
VITE_DISABLE_WEB3=true
```

**Features:**
- No wallet connection required
- Simulated transactions (2s delay)
- Mock voting data (3 sample proposals)
- All UI features testable
- Backend API integration testable

**Disable for Production:**
```env
# In .env.production
VITE_DISABLE_WEB3=false
```

## API Endpoints

```
POST   /api/v1/voting/democratic/create    - Create democratic vote
POST   /api/v1/voting/democratic/vote      - Vote on proposal
GET    /api/v1/voting/democratic/:id       - Get vote details
GET    /api/v1/voting/democratic           - List all votes
POST   /api/v1/voting/hodl                 - Record HODL vote
GET    /api/v1/voting/hodl/stats           - HODL statistics
GET    /api/v1/voting/user/history/:addr   - User voting history
```

## Smart Contract Functions

### Voting Functions (Implemented)
- `voteForHODL()` - Vote for HODL mode
- `createDemocraticVote(title)` - Create proposal
- `voteOnDemocraticVote(id, yes)` - Vote on proposal
- `getDemocraticVotesLength()` - Get vote count
- `democraticVotes(id)` - Get vote data
- `getDemocraticVoteResult(id)` - Get results
- `votersToVoteExpiry(address)` - Check cooldown

### Token Functions (Implemented)
- `balanceOf(address)` - Get token balance
- `hodlActivationTimestamp()` - HODL activation time
- `isSaleRestricted()` - Check restrictions

## File Structure

```
frontend/src/
├── connectivityAssets/
│   ├── hooks.js              # All Web3 hooks
│   ├── tokenAbi.json         # Contract ABI
│   └── environment.js        # Contract address
├── pages/Vote/
│   ├── Vote.jsx              # Main voting page
│   ├── DemocraticVoting/
│   │   ├── DemocraticVoting.jsx    # Create proposals
│   │   ├── DemocraticVotesList.jsx # List all votes
│   │   └── VoteOnProposal.jsx      # Vote submission
│   └── Hodl/
│       └── HodlVoting.jsx    # HODL voting
├── components/common/
│   ├── MockModeIndicator.jsx # Demo mode warning
│   └── TokenInfoWidget.jsx   # Balance widget
├── constants/
│   └── index.js              # DISABLE_WEB3 & mock data
└── context/
    └── GenrelContext.jsx     # Web3 wallet context

backend/src/modules/voting/
├── models/
│   ├── DemocraticVote.model.js
│   ├── VoteRecord.model.js
│   └── HodlVote.model.js
├── controllers/
│   └── voting.controller.js
├── services/
│   └── voting.service.js
├── routes/
│   └── voting.routes.js
└── validators/
    └── voting.validators.js
```

## Testing

**Mock Mode Testing:**
```bash
# Set in .env
VITE_DISABLE_WEB3=true

# Run frontend
npm run dev

# Test all voting features without wallet
```

**Real Web3 Testing:**
```bash
# Set in .env
VITE_DISABLE_WEB3=false

# Connect MetaMask
# Use Ethereum Mainnet
# Ensure you have TUP tokens for voting
```

## Environment Variables

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WEB3_PROJECT_ID=a65bc026af82f217afeb8f7543a83113
VITE_DISABLE_WEB3=true  # Set to false for production
```

**Backend (.env):**
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://your-domain
CORS_ORIGIN=http://your-domain
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=trendup-uploads
```

## Deployment

**Production Build:**
```bash
# Build frontend with Web3 enabled
cd frontend
VITE_DISABLE_WEB3=false npm run build
```

**On EC2:**
```bash
# Backend
cd backend
npm install
pm2 start src/server.js --name trendup-backend

# Frontend
cd ../frontend
# Transfer dist folder from local build
pm2 start serve --name trendup-frontend -- dist -l 3000
```

## Notes

- All voting transactions require gas fees (ETH)
- Vote cooldown period prevents spam
- Democratic votes expire after set time
- HODL voting activates sale restrictions
- Backend stores all votes for analytics

