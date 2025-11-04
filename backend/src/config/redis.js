const Redis = require('ioredis');
const config = require('./index');
const { logger } = require('../core/utils/logger');

let redisClient;

const connectRedis = async () => {
  try {
    console.log(`[INFO] ==========================================`);
    console.log(`[INFO] Redis Connection Attempt`);
    console.log(`[INFO] ==========================================`);
    console.log(`[INFO] URL: ${config.redis.url}`);
    console.log(`[INFO] Password: ${config.redis.password ? 'Set' : 'Not set'}`);
    console.log(`[INFO] Options:`, JSON.stringify({
      retryDelayOnFailover: config.redis.retryDelayOnFailover,
      enableReadyCheck: config.redis.enableReadyCheck,
      maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000
    }, null, 2));
    console.log(`[INFO] Starting connection...`);
    
    const startTime = Date.now();
    redisClient = new Redis(config.redis.url, {
      password: config.redis.password,
      retryDelayOnFailover: config.redis.retryDelayOnFailover,
      enableReadyCheck: config.redis.enableReadyCheck,
      maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000
    });

    redisClient.on('connect', () => {
      console.log('[INFO] Redis client connecting...');
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      const connectionTime = Date.now() - startTime;
      console.log(`[INFO] ==========================================`);
      console.log(`[INFO] Redis Connected Successfully!`);
      console.log(`[INFO] ==========================================`);
      console.log(`[INFO] Connection Time: ${connectionTime}ms`);
      console.log(`[INFO] Status: Ready`);
      console.log(`[INFO] ==========================================`);
      logger.info(`Redis client ready in ${connectionTime}ms`);
    });

    redisClient.on('error', (err) => {
      console.error('[ERROR] Redis client error:', err.message);
      logger.error('Redis client error:', {
        error: err.message,
        stack: err.stack,
        name: err.name
      });
    });

    redisClient.on('close', () => {
      console.warn('[WARN] Redis client connection closed');
      logger.warn('Redis client connection closed');
    });

    redisClient.on('reconnecting', () => {
      console.log('[INFO] Redis client reconnecting...');
      logger.info('Redis client reconnecting...');
    });

    await redisClient.connect();
    
  } catch (error) {
    console.error('[ERROR] ==========================================');
    console.error('[ERROR] Redis Connection Failed!');
    console.error('[ERROR] ==========================================');
    console.error('[ERROR] Error Message:', error.message);
    console.error('[ERROR] Error Name:', error.name);
    console.error('[ERROR] Error Code:', error.code);
    console.error('[ERROR] URL Attempted:', config.redis.url);
    console.error('[ERROR] Full Error Object:', JSON.stringify(error, null, 2));
    console.error('[ERROR] ==========================================');
    
    logger.error('Redis connection failed:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      url: config.redis.url
    });
    
    // Don't exit here, let the server handle it
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

const disconnectRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis client disconnected');
    }
  } catch (error) {
    logger.error('Error disconnecting Redis:', {
      error: error.message,
      stack: error.stack
    });
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  disconnectRedis
};
