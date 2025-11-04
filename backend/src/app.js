const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const config = require('./config');
const { logger } = require('./core/utils/logger');
const ErrorHandler = require('./core/errors/ErrorHandler');
const { liveRoutes } = require('./modules/live/routes');
const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// 🛑 FIX: Use a CORS policy that allows your frontend
app.use(cors({
  origin: ['http://localhost:5173', 'https://trend-up-coin.netlify.app'], // Aapka frontend URL
  credentials: true
}));
// app.use(cors(config.cors)); // Replaced this line

app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving removed - using S3 for file storage
// Images are now served directly from S3 bucket with public-read ACL

// Health check endpoint
app.get('/healths', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env,
    version: process.env.npm_package_version || '1.0.0'
  });
});
app.use('/api/v1/live', liveRoutes);
// API routes
const { authRoutes } = require('./modules/auth');
app.use('/api/v1/auth', authRoutes);

const userRoutes = require('./modules/user/routes/user.routes');
app.use('/api/v1/users', userRoutes);

const { votingRoutes } = require('./modules/voting');
app.use('/api/v1/voting', votingRoutes);

const { postRoutes, karmaRoutes, badgeRoutes, followRoutes, commentRoutes, categoryRoutes, hashtagRoutes, topicRoutes, feedRoutes, mediaRoutes, pollRoutes, predictionRoutes, moderationRoutes, notificationRoutes } = require('./modules/social');
app.use('/api/v1/social/posts', postRoutes);
app.use('/api/v1/social/karma', karmaRoutes);
app.use('/api/v1/social/badges', badgeRoutes);
app.use('/api/v1/social/follow', followRoutes);
app.use('/api/v1/social/comments', commentRoutes);
app.use('/api/v1/social/categories', categoryRoutes);
app.use('/api/v1/social/hashtags', hashtagRoutes);
app.use('/api/v1/social/topics', topicRoutes);
app.use('/api/v1/social/feed', feedRoutes);
app.use('/api/v1/social/media', mediaRoutes);
app.use('/api/v1/social/polls', pollRoutes);
app.use('/api/v1/social/predictions', predictionRoutes);
app.use('/api/v1/social/moderation', moderationRoutes);
app.use('/api/v1/social/notifications', notificationRoutes);

// Redis infrastructure routes
const redisRoutes = require('./core/routes/redis.routes');
app.use('/api/v1/redis', redisRoutes);

// Real-time routes (simple version for Phase 10)
const realtimeRoutes = require('./core/routes/realtime.routes.simple');
app.use('/api/v1/realtime', realtimeRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: {
      code: 'ROUTE_NOT_FOUND',
      timestamp: new Date().toISOString()
    }
  });
});

// Global error handler
app.use(ErrorHandler.handle);

module.exports = app;
