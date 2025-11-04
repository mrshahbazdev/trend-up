# TrendUpCoin Backend

A production-ready, modular backend API for the TrendUpCoin crypto social platform.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with wallet integration
- 👥 **User Management** - Complete user profiles and social features
- 📱 **Social Features** - Posts, comments, reactions, and feeds
- 🗳️ **Voting System** - General, Democratic, and HODL voting mechanisms
- 📺 **Live Streaming** - Video, audio, and podcast streaming capabilities
- 💬 **Real-time Chat** - WebSocket-based messaging system
- 📊 **Crypto Integration** - Market data and blockchain interactions
- 🔔 **Notifications** - Real-time notifications system
- 📁 **File Management** - Secure file upload and storage

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Real-time**: Socket.io
- **Authentication**: JWT + Web3 wallet verification
- **File Storage**: AWS S3 / Cloudinary
- **Blockchain**: Web3.js / Ethers.js
- **Testing**: Jest + Supertest
- **Logging**: Winston
- **Documentation**: JSDoc

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB 6+
- Redis 6+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd trendupcoin/backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp env.example .env
# Edit .env with your configuration
```

4. Start the development server
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Environment Variables

Copy `env.example` to `.env` and configure:

- Database connection strings
- JWT secrets
- Blockchain configuration
- External API keys
- File storage credentials

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── core/            # Core utilities and error handling
│   ├── modules/         # Feature modules (auth, users, posts, etc.)
│   ├── shared/          # Shared models, services, repositories
│   ├── database/        # Database migrations and seeders
│   ├── tests/           # Test files
│   ├── app.js           # Express app configuration
│   └── server.js        # Server startup
├── docs/                # Documentation
├── scripts/             # Utility scripts
└── docker/              # Docker configuration
```

## API Documentation

The API follows RESTful conventions with the following base structure:

- `GET /api/v1/health` - Health check
- `POST /api/v1/auth/*` - Authentication endpoints
- `GET /api/v1/users/*` - User management
- `GET /api/v1/posts/*` - Social posts
- `GET /api/v1/votes/*` - Voting system
- `GET /api/v1/streams/*` - Live streaming
- `GET /api/v1/chat/*` - Chat system

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## Development

### Code Style

The project uses ESLint and Prettier for code formatting:

```bash
# Check code style
npm run lint

# Fix code style issues
npm run lint:fix

# Format code
npm run format
```

### Database

```bash
# Seed the database
npm run seed

# Run migrations
npm run migrate
```

## Deployment

### Docker

```bash
# Build Docker image
npm run docker:build

# Run with Docker Compose
npm run docker:run
```

### Production

1. Set `NODE_ENV=production`
2. Configure production database and Redis
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Set up monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details
