const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/trendupcoin',
    testUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/trendupcoin_test',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || null,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    // Enhanced Redis configuration
    keyPrefix: 'trendup:',
    ttl: {
      posts: 3600,        // 1 hour
      users: 1800,        // 30 minutes
      feeds: 300,         // 5 minutes
      trending: 900,      // 15 minutes
      karma: 600,         // 10 minutes
      sessions: 86400,    // 24 hours
      temporary: 60       // 1 minute
    },
    // Connection pool settings
    maxConnections: 10,
    minConnections: 2,
    // Queue settings
    queueSettings: {
      defaultTTL: 3600,   // 1 hour
      maxRetries: 3,
      retryDelay: 5000    // 5 seconds
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRE || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  },

  // Blockchain Configuration
  blockchain: {
    network: process.env.BLOCKCHAIN_NETWORK || 'mainnet',
    infuraProjectId: process.env.INFURA_PROJECT_ID,
    alchemyApiKey: process.env.ALCHEMY_API_KEY,
    contracts: {
      token: process.env.TOKEN_CONTRACT_ADDRESS,
      presale: process.env.PRESALE_CONTRACT_ADDRESS,
      usdt: process.env.USDT_CONTRACT_ADDRESS
    }
  },

  // External APIs
  apis: {
    coingecko: {
      apiKey: process.env.COINGECKO_API_KEY,
      baseUrl: 'https://api.coingecko.com/api/v3'
    },
    cryptoNews: {
      apiKey: process.env.CRYPTO_NEWS_API_KEY,
      baseUrl: 'https://cryptonews-api.com/api/v1'
    }
  },

  // File Upload Configuration
  upload: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET
    },
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    allowedAudioTypes: ['audio/mp3', 'audio/wav', 'audio/ogg']
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user:  process.env.GOOGLE_EMAIL || process.env.SMTP_USER,
        pass: process.env.GOOGLE_PASSWORD || process.env.SMTP_PASS
      }
    },
    from: {
      email: process.env.FROM_EMAIL || 'noreply@trendupcoin.com',
      name: process.env.FROM_NAME || 'TrendUpCoin'
    },
 
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_FILE_MAX_FILES || '14d'
  },

  // CORS
  cors: {
    origin: true,
    credentials: true
  },

  // Socket.io
  socket: {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true
    }
  }
};

module.exports = config;
