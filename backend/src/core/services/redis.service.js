/**
 * Redis Service Layer
 * Centralized Redis operations for caching, queues, and pub/sub
 */

const { getRedisClient } = require('../../config/redis');
const { logger } = require('../utils/logger');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.keyPrefix = 'trendup:';
    
    // Default TTL values (in seconds)
    this.defaultTTL = {
      posts: 3600,        // 1 hour
      users: 1800,        // 30 minutes
      feeds: 300,         // 5 minutes
      trending: 900,      // 15 minutes
      karma: 600,         // 10 minutes
      sessions: 86400,    // 24 hours
      temporary: 60       // 1 minute
    };
  }

  /**
   * Initialize Redis client
   */
  async initialize() {
    try {
      // Import and connect Redis first
      const { connectRedis } = require('../../config/redis');
      await connectRedis();
      
      this.client = getRedisClient();
      this.isConnected = true;
      logger.info('[RedisService] Initialized successfully');
    } catch (error) {
      logger.error('[RedisService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get Redis client
   */
  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not initialized or not connected');
    }
    return this.client;
  }

  /**
   * Generate prefixed key
   */
  getKey(key) {
    return `${this.keyPrefix}${key}`;
  }

  // ==================== CACHING METHODS ====================

  /**
   * Cache data with TTL
   */
  async cache(key, data, ttl = null) {
    try {
      const prefixedKey = this.getKey(key);
      const serializedData = JSON.stringify(data);
      
      if (ttl) {
        await this.client.setex(prefixedKey, ttl, serializedData);
      } else {
        await this.client.set(prefixedKey, serializedData);
      }
      
      logger.debug(`[RedisService] Cached key: ${prefixedKey}`);
      return true;
    } catch (error) {
      logger.error(`[RedisService] Cache error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cached data
   */
  async getCached(key) {
    try {
      const prefixedKey = this.getKey(key);
      const data = await this.client.get(prefixedKey);
      
      if (data) {
        logger.debug(`[RedisService] Cache hit for key: ${prefixedKey}`);
        return JSON.parse(data);
      }
      
      logger.debug(`[RedisService] Cache miss for key: ${prefixedKey}`);
      return null;
    } catch (error) {
      logger.error(`[RedisService] Get cached error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete cached data
   */
  async invalidate(key) {
    try {
      const prefixedKey = this.getKey(key);
      const result = await this.client.del(prefixedKey);
      
      logger.debug(`[RedisService] Invalidated key: ${prefixedKey}`);
      return result > 0;
    } catch (error) {
      logger.error(`[RedisService] Invalidate error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate multiple keys by pattern
   */
  async invalidatePattern(pattern) {
    try {
      const prefixedPattern = this.getKey(pattern);
      const keys = await this.client.keys(prefixedPattern);
      
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.debug(`[RedisService] Invalidated ${keys.length} keys matching pattern: ${prefixedPattern}`);
      }
      
      return keys.length;
    } catch (error) {
      logger.error(`[RedisService] Invalidate pattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      const prefixedKey = this.getKey(key);
      const result = await this.client.exists(prefixedKey);
      return result === 1;
    } catch (error) {
      logger.error(`[RedisService] Exists check error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration for key
   */
  async setExpire(key, ttl) {
    try {
      const prefixedKey = this.getKey(key);
      const result = await this.client.expire(prefixedKey, ttl);
      return result === 1;
    } catch (error) {
      logger.error(`[RedisService] Set expire error for key ${key}:`, error);
      return false;
    }
  }

  // ==================== DATA STRUCTURE METHODS ====================

  /**
   * Increment counter
   */
  async increment(key, amount = 1) {
    try {
      const prefixedKey = this.getKey(key);
      const result = await this.client.incrby(prefixedKey, amount);
      return result;
    } catch (error) {
      logger.error(`[RedisService] Increment error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Decrement counter
   */
  async decrement(key, amount = 1) {
    try {
      const prefixedKey = this.getKey(key);
      const result = await this.client.decrby(prefixedKey, amount);
      return result;
    } catch (error) {
      logger.error(`[RedisService] Decrement error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Add to set
   */
  async addToSet(key, ...members) {
    try {
      const prefixedKey = this.getKey(key);
      const result = await this.client.sadd(prefixedKey, ...members);
      return result;
    } catch (error) {
      logger.error(`[RedisService] Add to set error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get set members
   */
  async getSetMembers(key) {
    try {
      const prefixedKey = this.getKey(key);
      const members = await this.client.smembers(prefixedKey);
      return members;
    } catch (error) {
      logger.error(`[RedisService] Get set members error for key ${key}:`, error);
      return [];
    }
  }

  /**
   * Remove from set
   */
  async removeFromSet(key, ...members) {
    try {
      const prefixedKey = this.getKey(key);
      const result = await this.client.srem(prefixedKey, ...members);
      return result;
    } catch (error) {
      logger.error(`[RedisService] Remove from set error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Add to list (left push)
   */
  async addToList(key, ...values) {
    try {
      const prefixedKey = this.getKey(key);
      const result = await this.client.lpush(prefixedKey, ...values);
      return result;
    } catch (error) {
      logger.error(`[RedisService] Add to list error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get list range
   */
  async getListRange(key, start = 0, end = -1) {
    try {
      const prefixedKey = this.getKey(key);
      const values = await this.client.lrange(prefixedKey, start, end);
      return values;
    } catch (error) {
      logger.error(`[RedisService] Get list range error for key ${key}:`, error);
      return [];
    }
  }

  /**
   * Get and set value atomically
   */
  async getSet(key, value) {
    try {
      const prefixedKey = this.getKey(key);
      const serializedValue = JSON.stringify(value);
      const result = await this.client.getset(prefixedKey, serializedValue);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      logger.error(`[RedisService] Get set error for key ${key}:`, error);
      return null;
    }
  }

  // ==================== QUEUE METHODS ====================

  /**
   * Add job to queue
   */
  async enqueue(queue, job, priority = 'normal') {
    try {
      const queueKey = this.getKey(`queue:${queue}`);
      const jobData = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        data: job,
        priority,
        createdAt: new Date().toISOString(),
        attempts: 0,
        maxAttempts: 3
      };
      
      const serializedJob = JSON.stringify(jobData);
      await this.client.lpush(queueKey, serializedJob);
      
      logger.debug(`[RedisService] Enqueued job to ${queue}: ${jobData.id}`);
      return jobData.id;
    } catch (error) {
      logger.error(`[RedisService] Enqueue error for queue ${queue}:`, error);
      return null;
    }
  }

  /**
   * Get job from queue (blocking)
   */
  async dequeue(queue, timeout = 5) {
    try {
      const queueKey = this.getKey(`queue:${queue}`);
      const result = await this.client.brpop(queueKey, timeout);
      
      if (result && result.length > 1) {
        const jobData = JSON.parse(result[1]);
        logger.debug(`[RedisService] Dequeued job from ${queue}: ${jobData.id}`);
        return jobData;
      }
      
      return null;
    } catch (error) {
      logger.error(`[RedisService] Dequeue error for queue ${queue}:`, error);
      return null;
    }
  }

  /**
   * Get queue length
   */
  async getQueueLength(queue) {
    try {
      const queueKey = this.getKey(`queue:${queue}`);
      const length = await this.client.llen(queueKey);
      return length;
    } catch (error) {
      logger.error(`[RedisService] Get queue length error for queue ${queue}:`, error);
      return 0;
    }
  }

  // ==================== PUB/SUB METHODS ====================

  /**
   * Publish message to channel
   */
  async publish(channel, message) {
    try {
      const channelKey = this.getKey(`channel:${channel}`);
      const serializedMessage = JSON.stringify({
        timestamp: new Date().toISOString(),
        data: message
      });
      
      const subscribers = await this.client.publish(channelKey, serializedMessage);
      logger.debug(`[RedisService] Published to channel ${channel}, ${subscribers} subscribers`);
      return subscribers;
    } catch (error) {
      logger.error(`[RedisService] Publish error for channel ${channel}:`, error);
      return 0;
    }
  }

  /**
   * Subscribe to channel
   */
  async subscribe(channel, handler) {
    try {
      const channelKey = this.getKey(`channel:${channel}`);
      const subscriber = this.client.duplicate();
      
      await subscriber.subscribe(channelKey);
      
      subscriber.on('message', (receivedChannel, message) => {
        try {
          const parsedMessage = JSON.parse(message);
          handler(parsedMessage.data, parsedMessage.timestamp);
        } catch (error) {
          logger.error(`[RedisService] Message handler error for channel ${channel}:`, error);
        }
      });
      
      logger.debug(`[RedisService] Subscribed to channel ${channel}`);
      return subscriber;
    } catch (error) {
      logger.error(`[RedisService] Subscribe error for channel ${channel}:`, error);
      return null;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get Redis info
   */
  async getInfo() {
    try {
      const info = await this.client.info();
      return info;
    } catch (error) {
      logger.error('[RedisService] Get info error:', error);
      return null;
    }
  }

  /**
   * Get memory usage
   */
  async getMemoryUsage() {
    try {
      const info = await this.client.info('memory');
      const lines = info.split('\r\n');
      const memoryInfo = {};
      
      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          memoryInfo[key] = value;
        }
      });
      
      return memoryInfo;
    } catch (error) {
      logger.error('[RedisService] Get memory usage error:', error);
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      await this.client.ping();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('[RedisService] Health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Close connection
   */
  async close() {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        logger.info('[RedisService] Connection closed');
      }
    } catch (error) {
      logger.error('[RedisService] Close error:', error);
    }
  }
}

// Create singleton instance
const redisService = new RedisService();

module.exports = redisService;
