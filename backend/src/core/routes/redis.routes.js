/**
 * Redis Routes
 * Health checks, monitoring, and management endpoints
 */

const express = require('express');
const router = express.Router();
const redisService = require('../services/redis.service');
const queueService = require('../services/queue.service');
const redisMonitoring = require('../monitoring/redis.monitoring');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const { logger } = require('../utils/logger');

/**
 * GET /health
 * Redis health check
 */
router.get('/health', async (req, res) => {
  try {
    const healthCheck = await redisService.healthCheck();
    
    if (healthCheck.status === 'healthy') {
      sendSuccessResponse(res, healthCheck, 'Redis is healthy');
    } else {
      sendErrorResponse(res, 'Redis is unhealthy', 503, healthCheck);
    }
  } catch (error) {
    logger.error('[RedisRoutes] Health check error:', error);
    sendErrorResponse(res, 'Health check failed', 500, { error: error.message });
  }
});

/**
 * GET /metrics
 * Get Redis performance metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await redisMonitoring.getAllMetrics();
    sendSuccessResponse(res, metrics, 'Redis metrics retrieved successfully');
  } catch (error) {
    logger.error('[RedisRoutes] Get metrics error:', error);
    sendErrorResponse(res, 'Failed to get metrics', 500, { error: error.message });
  }
});

/**
 * GET /performance-report
 * Generate comprehensive performance report
 */
router.get('/performance-report', async (req, res) => {
  try {
    const report = await redisMonitoring.generatePerformanceReport();
    sendSuccessResponse(res, report, 'Performance report generated successfully');
  } catch (error) {
    logger.error('[RedisRoutes] Generate performance report error:', error);
    sendErrorResponse(res, 'Failed to generate performance report', 500, { error: error.message });
  }
});

/**
 * GET /cache-stats
 * Get cache statistics
 */
router.get('/cache-stats', async (req, res) => {
  try {
    const cacheStats = redisMonitoring.getCacheHitRate();
    const memoryStats = redisMonitoring.getMemoryUsage();
    
    const stats = {
      cache: cacheStats,
      memory: memoryStats,
      timestamp: new Date()
    };
    
    sendSuccessResponse(res, stats, 'Cache statistics retrieved successfully');
  } catch (error) {
    logger.error('[RedisRoutes] Get cache stats error:', error);
    sendErrorResponse(res, 'Failed to get cache statistics', 500, { error: error.message });
  }
});

/**
 * GET /alerts
 * Get recent alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const severity = req.query.severity;
    
    let alerts;
    if (severity) {
      alerts = redisMonitoring.getAlertsBySeverity(severity);
    } else {
      alerts = redisMonitoring.getRecentAlerts(limit);
    }
    
    sendSuccessResponse(res, { alerts }, 'Alerts retrieved successfully');
  } catch (error) {
    logger.error('[RedisRoutes] Get alerts error:', error);
    sendErrorResponse(res, 'Failed to get alerts', 500, { error: error.message });
  }
});

/**
 * DELETE /alerts
 * Clear all alerts
 */
router.delete('/alerts', async (req, res) => {
  try {
    redisMonitoring.clearAlerts();
    sendSuccessResponse(res, {}, 'All alerts cleared successfully');
  } catch (error) {
    logger.error('[RedisRoutes] Clear alerts error:', error);
    sendErrorResponse(res, 'Failed to clear alerts', 500, { error: error.message });
  }
});

/**
 * GET /queues
 * Get queue statistics
 */
router.get('/queues', async (req, res) => {
  try {
    const queueStats = await queueService.getAllQueueStats();
    sendSuccessResponse(res, queueStats, 'Queue statistics retrieved successfully');
  } catch (error) {
    logger.error('[RedisRoutes] Get queue stats error:', error);
    sendErrorResponse(res, 'Failed to get queue statistics', 500, { error: error.message });
  }
});

/**
 * GET /queues/:queueName
 * Get specific queue statistics
 */
router.get('/queues/:queueName', async (req, res) => {
  try {
    const { queueName } = req.params;
    const queueStats = await queueService.getQueueStats(queueName);
    
    if (!queueStats) {
      return sendErrorResponse(res, 'Queue not found', 404);
    }
    
    sendSuccessResponse(res, queueStats, 'Queue statistics retrieved successfully');
  } catch (error) {
    logger.error('[RedisRoutes] Get queue stats error:', error);
    sendErrorResponse(res, 'Failed to get queue statistics', 500, { error: error.message });
  }
});

/**
 * DELETE /queues/:queueName
 * Clear specific queue
 */
router.delete('/queues/:queueName', async (req, res) => {
  try {
    const { queueName } = req.params;
    const cleared = await queueService.clearQueue(queueName);
    
    if (cleared) {
      sendSuccessResponse(res, {}, `Queue ${queueName} cleared successfully`);
    } else {
      sendErrorResponse(res, 'Failed to clear queue', 500);
    }
  } catch (error) {
    logger.error('[RedisRoutes] Clear queue error:', error);
    sendErrorResponse(res, 'Failed to clear queue', 500, { error: error.message });
  }
});

/**
 * GET /failed-jobs
 * Get failed jobs
 */
router.get('/failed-jobs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const failedJobs = await queueService.getFailedJobs(limit);
    
    sendSuccessResponse(res, { failedJobs }, 'Failed jobs retrieved successfully');
  } catch (error) {
    logger.error('[RedisRoutes] Get failed jobs error:', error);
    sendErrorResponse(res, 'Failed to get failed jobs', 500, { error: error.message });
  }
});

/**
 * POST /failed-jobs/:jobId/retry
 * Retry failed job
 */
router.post('/failed-jobs/:jobId/retry', async (req, res) => {
  try {
    const { jobId } = req.params;
    const retried = await queueService.retryFailedJob(jobId);
    
    if (retried) {
      sendSuccessResponse(res, {}, `Job ${jobId} retried successfully`);
    } else {
      sendErrorResponse(res, 'Failed to retry job', 500);
    }
  } catch (error) {
    logger.error('[RedisRoutes] Retry failed job error:', error);
    sendErrorResponse(res, 'Failed to retry job', 500, { error: error.message });
  }
});

/**
 * POST /cache/invalidate
 * Invalidate cache by pattern
 */
router.post('/cache/invalidate', async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (!pattern) {
      return sendErrorResponse(res, 'Pattern is required', 400);
    }
    
    const invalidatedCount = await redisService.invalidatePattern(pattern);
    sendSuccessResponse(res, { invalidatedCount }, `Invalidated ${invalidatedCount} cache entries`);
  } catch (error) {
    logger.error('[RedisRoutes] Invalidate cache error:', error);
    sendErrorResponse(res, 'Failed to invalidate cache', 500, { error: error.message });
  }
});

/**
 * GET /info
 * Get Redis server information
 */
router.get('/info', async (req, res) => {
  try {
    const info = await redisService.getInfo();
    sendSuccessResponse(res, { info }, 'Redis info retrieved successfully');
  } catch (error) {
    logger.error('[RedisRoutes] Get Redis info error:', error);
    sendErrorResponse(res, 'Failed to get Redis info', 500, { error: error.message });
  }
});

/**
 * POST /test-cache
 * Test cache operations
 */
router.post('/test-cache', async (req, res) => {
  try {
    const testKey = 'test:cache:operation';
    const testData = {
      message: 'Redis cache test',
      timestamp: new Date().toISOString(),
      random: Math.random()
    };
    
    // Test cache set
    const cached = await redisService.cache(testKey, testData, 60);
    
    // Test cache get
    const retrieved = await redisService.getCached(testKey);
    
    // Test cache exists
    const exists = await redisService.exists(testKey);
    
    // Test cache invalidate
    const invalidated = await redisService.invalidate(testKey);
    
    const result = {
      cached,
      retrieved,
      exists,
      invalidated,
      dataMatch: JSON.stringify(testData) === JSON.stringify(retrieved)
    };
    
    sendSuccessResponse(res, result, 'Cache test completed successfully');
  } catch (error) {
    logger.error('[RedisRoutes] Test cache error:', error);
    sendErrorResponse(res, 'Cache test failed', 500, { error: error.message });
  }
});

/**
 * POST /test-queue
 * Test queue operations
 */
router.post('/test-queue', async (req, res) => {
  try {
    const testQueue = 'karma:earn'; // Use an existing queue
    const testJob = {
      message: 'Redis queue test',
      timestamp: new Date().toISOString(),
      random: Math.random()
    };
    
    // Test enqueue
    const jobId = await queueService.addJob(testQueue, testJob);
    
    // Test queue length
    const queueStats = await queueService.getQueueStats(testQueue);
    
    // Test dequeue (non-blocking)
    const client = redisService.getClient();
    const queueKey = redisService.getKey(`queue:${testQueue}`);
    const jobData = await client.rpop(queueKey);
    
    const result = {
      jobId,
      queueLength: queueStats?.length || 0,
      jobData: jobData ? JSON.parse(jobData) : null,
      testCompleted: true
    };
    
    sendSuccessResponse(res, result, 'Queue test completed successfully');
  } catch (error) {
    logger.error('[RedisRoutes] Test queue error:', error);
    sendErrorResponse(res, 'Queue test failed', 500, { error: error.message });
  }
});

module.exports = router;
