const mongoose = require('mongoose');
const config = require('./index');
const { logger } = require('../core/utils/logger');

const connectDatabase = async () => {
  try {
    const mongoUri = config.server.env === 'test' ? config.database.testUri : config.database.uri;
    
    console.log(`[INFO] ==========================================`);
    console.log(`[INFO] MongoDB Connection Attempt`);
    console.log(`[INFO] ==========================================`);
    console.log(`[INFO] Environment: ${config.server.env}`);
    console.log(`[INFO] URI: ${mongoUri}`);
    console.log(`[INFO] Options:`, JSON.stringify(config.database.options, null, 2));
    console.log(`[INFO] Starting connection...`);
    
    const startTime = Date.now();
    
    // Add timeout to connection
    const connectionPromise = mongoose.connect(mongoUri, config.database.options);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('MongoDB connection timeout after 30 seconds')), 30000);
    });
    
    const conn = await Promise.race([connectionPromise, timeoutPromise]);
    const connectionTime = Date.now() - startTime;
    
    console.log(`[INFO] ==========================================`);
    console.log(`[INFO] MongoDB Connected Successfully!`);
    console.log(`[INFO] ==========================================`);
    console.log(`[INFO] Connection Time: ${connectionTime}ms`);
    console.log(`[INFO] Host: ${conn.connection.host}`);
    console.log(`[INFO] Port: ${conn.connection.port}`);
    console.log(`[INFO] Database: ${conn.connection.name}`);
    console.log(`[INFO] Ready State: ${conn.connection.readyState}`);
    console.log(`[INFO] Connection ID: ${conn.connection.id}`);
    console.log(`[INFO] ==========================================`);
    
    logger.info(`MongoDB Connected: ${conn.connection.host} in ${connectionTime}ms`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('[ERROR] MongoDB connection error:', err.message);
      logger.error('MongoDB connection error:', {
        error: err.message,
        stack: err.stack,
        name: err.name
      });
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[WARN] MongoDB disconnected');
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[INFO] MongoDB reconnected');
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('[INFO] Closing MongoDB connection...');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('[ERROR] ==========================================');
    console.error('[ERROR] MongoDB Connection Failed!');
    console.error('[ERROR] ==========================================');
    console.error('[ERROR] Error Message:', error.message);
    console.error('[ERROR] Error Name:', error.name);
    console.error('[ERROR] Error Code:', error.code);
    console.error('[ERROR] URI Attempted:', config.database.uri);
    console.error('[ERROR] Environment:', config.server.env);
    console.error('[ERROR] Full Error Object:', JSON.stringify(error, null, 2));
    console.error('[ERROR] ==========================================');
    
    logger.error('Database connection failed:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      uri: config.database.uri,
      environment: config.server.env
    });
    
    // Don't exit here, let the server handle it
    throw error;
  }
};

const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting database:', {
      error: error.message,
      stack: error.stack
    });
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase
};
