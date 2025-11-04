/**
 * Redis Monitoring Service
 * Performance metrics, health checks, and monitoring
 */

const redisService = require('../services/redis.service');
const { logger } = require('../utils/logger');

class RedisMonitoring {
  constructor() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      operations: 0,
      errors: 0,
      startTime: new Date()
    };
    
    this.alerts = [];
    this.thresholds = {
      responseTime: 100, // ms
      errorRate: 0.05,   // 5%
      memoryUsage: 0.8,  // 80%
      connectionPool: 0.9 // 90%
    };
  }

  /**
   * Initialize monitoring
   */
  async initialize() {
    try {
      await redisService.initialize();
      this.startMetricsCollection();
      logger.info('[RedisMonitoring] Initialized successfully');
    } catch (error) {
      logger.error('[RedisMonitoring] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    // Collect metrics every 30 seconds
    this.metricsInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        logger.error('[RedisMonitoring] Metrics collection error:', error);
      }
    }, 30000);

    // Health check every 60 seconds
    this.healthInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('[RedisMonitoring] Health check error:', error);
      }
    }, 60000);
  }

  /**
   * Stop metrics collection
   */
  stopMetricsCollection() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }
  }

  /**
   * Collect performance metrics
   */
  async collectMetrics() {
    try {
      const client = redisService.getClient();
      
      // Get Redis info
      const info = await client.info();
      const memoryInfo = await this.parseInfoSection(info, 'memory');
      const statsInfo = await this.parseInfoSection(info, 'stats');
      const clientsInfo = await this.parseInfoSection(info, 'clients');
      
      // Calculate cache hit rate
      const hits = parseInt(statsInfo.keyspace_hits || '0');
      const misses = parseInt(statsInfo.keyspace_misses || '0');
      const totalRequests = hits + misses;
      const hitRate = totalRequests > 0 ? hits / totalRequests : 0;
      
      // Memory usage
      const usedMemory = parseInt(memoryInfo.used_memory || '0');
      const maxMemory = parseInt(memoryInfo.maxmemory || '0');
      const memoryUsage = maxMemory > 0 ? usedMemory / maxMemory : 0;
      
      // Connection info
      const connectedClients = parseInt(clientsInfo.connected_clients || '0');
      const maxClients = parseInt(clientsInfo.maxclients || '0');
      const connectionUsage = maxClients > 0 ? connectedClients / maxClients : 0;
      
      // Update metrics
      this.metrics = {
        ...this.metrics,
        hitRate,
        memoryUsage,
        connectionUsage,
        connectedClients,
        usedMemory,
        totalRequests,
        lastUpdated: new Date()
      };
      
      // Check thresholds
      await this.checkThresholds();
      
    } catch (error) {
      logger.error('[RedisMonitoring] Collect metrics error:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Parse Redis info section
   */
  parseInfoSection(info, section) {
    const lines = info.split('\r\n');
    const sectionData = {};
    let inSection = false;
    
    for (const line of lines) {
      if (line === `# ${section}`) {
        inSection = true;
        continue;
      }
      
      if (inSection) {
        if (line.startsWith('#')) {
          break; // Next section
        }
        
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          sectionData[key] = value;
        }
      }
    }
    
    return sectionData;
  }

  /**
   * Check performance thresholds
   */
  async checkThresholds() {
    const alerts = [];
    
    // Check response time
    const healthCheck = await redisService.healthCheck();
    if (healthCheck.responseTime > this.thresholds.responseTime) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `Redis response time is ${healthCheck.responseTime}ms (threshold: ${this.thresholds.responseTime}ms)`,
        timestamp: new Date()
      });
    }
    
    // Check memory usage
    if (this.metrics.memoryUsage > this.thresholds.memoryUsage) {
      alerts.push({
        type: 'memory',
        severity: 'critical',
        message: `Redis memory usage is ${(this.metrics.memoryUsage * 100).toFixed(1)}% (threshold: ${(this.thresholds.memoryUsage * 100)}%)`,
        timestamp: new Date()
      });
    }
    
    // Check connection usage
    if (this.metrics.connectionUsage > this.thresholds.connectionPool) {
      alerts.push({
        type: 'connections',
        severity: 'warning',
        message: `Redis connection usage is ${(this.metrics.connectionUsage * 100).toFixed(1)}% (threshold: ${(this.thresholds.connectionPool * 100)}%)`,
        timestamp: new Date()
      });
    }
    
    // Check cache hit rate
    if (this.metrics.hitRate < 0.8 && this.metrics.totalRequests > 100) {
      alerts.push({
        type: 'cache',
        severity: 'warning',
        message: `Redis cache hit rate is ${(this.metrics.hitRate * 100).toFixed(1)}% (threshold: 80%)`,
        timestamp: new Date()
      });
    }
    
    // Add new alerts
    this.alerts.push(...alerts);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    // Log critical alerts
    alerts.filter(alert => alert.severity === 'critical').forEach(alert => {
      logger.error(`[RedisMonitoring] CRITICAL ALERT: ${alert.message}`);
    });
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    try {
      const healthCheck = await redisService.healthCheck();
      
      if (healthCheck.status !== 'healthy') {
        this.alerts.push({
          type: 'health',
          severity: 'critical',
          message: `Redis health check failed: ${healthCheck.error}`,
          timestamp: new Date()
        });
      }
      
      return healthCheck;
    } catch (error) {
      this.alerts.push({
        type: 'health',
        severity: 'critical',
        message: `Redis health check error: ${error.message}`,
        timestamp: new Date()
      });
      
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate() {
    return {
      hitRate: this.metrics.hitRate,
      hits: this.metrics.totalRequests - this.metrics.cacheMisses,
      misses: this.metrics.cacheMisses,
      totalRequests: this.metrics.totalRequests
    };
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    return {
      usedMemory: this.metrics.usedMemory,
      memoryUsage: this.metrics.memoryUsage,
      maxMemory: this.metrics.maxMemory || 'unlimited'
    };
  }

  /**
   * Get connection stats
   */
  getConnectionStats() {
    return {
      connectedClients: this.metrics.connectedClients,
      connectionUsage: this.metrics.connectionUsage,
      maxClients: this.metrics.maxClients || 'unlimited'
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const uptime = Date.now() - this.metrics.startTime.getTime();
    const errorRate = this.metrics.operations > 0 ? this.metrics.errors / this.metrics.operations : 0;
    
    return {
      uptime,
      operations: this.metrics.operations,
      errors: this.metrics.errors,
      errorRate,
      cacheHitRate: this.metrics.hitRate,
      memoryUsage: this.metrics.memoryUsage,
      connectionUsage: this.metrics.connectionUsage,
      lastUpdated: this.metrics.lastUpdated
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    return {
      performance: this.getPerformanceMetrics(),
      cache: this.getCacheHitRate(),
      memory: this.getMemoryUsage(),
      connections: this.getConnectionStats(),
      alerts: this.getRecentAlerts(10)
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit = 50) {
    return this.alerts
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity) {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Clear alerts
   */
  clearAlerts() {
    this.alerts = [];
    logger.info('[RedisMonitoring] Cleared all alerts');
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('[RedisMonitoring] Updated thresholds:', this.thresholds);
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    try {
      const healthCheck = await redisService.healthCheck();
      const metrics = this.getAllMetrics();
      const criticalAlerts = this.getAlertsBySeverity('critical');
      
      return {
        status: healthCheck.status === 'healthy' && criticalAlerts.length === 0 ? 'healthy' : 'unhealthy',
        redis: healthCheck,
        metrics,
        criticalAlerts: criticalAlerts.length,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('[RedisMonitoring] Get health status error:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport() {
    try {
      const metrics = this.getAllMetrics();
      const healthStatus = await this.getHealthStatus();
      
      const report = {
        summary: {
          status: healthStatus.status,
          uptime: metrics.performance.uptime,
          cacheHitRate: `${(metrics.performance.cacheHitRate * 100).toFixed(1)}%`,
          memoryUsage: `${(metrics.performance.memoryUsage * 100).toFixed(1)}%`,
          errorRate: `${(metrics.performance.errorRate * 100).toFixed(2)}%`
        },
        details: metrics,
        recommendations: this.generateRecommendations(metrics),
        timestamp: new Date()
      };
      
      return report;
    } catch (error) {
      logger.error('[RedisMonitoring] Generate performance report error:', error);
      return {
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate recommendations based on metrics
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    // Cache hit rate recommendations
    if (metrics.performance.cacheHitRate < 0.8) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        message: 'Consider increasing cache TTL or implementing more aggressive caching strategies'
      });
    }
    
    // Memory usage recommendations
    if (metrics.performance.memoryUsage > 0.7) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'Consider increasing Redis memory limit or implementing data eviction policies'
      });
    }
    
    // Error rate recommendations
    if (metrics.performance.errorRate > 0.01) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: 'High error rate detected. Check Redis logs and connection stability'
      });
    }
    
    // Connection usage recommendations
    if (metrics.connections.connectionUsage > 0.8) {
      recommendations.push({
        type: 'connections',
        priority: 'medium',
        message: 'Consider increasing max connections or optimizing connection pooling'
      });
    }
    
    return recommendations;
  }

  /**
   * Close monitoring
   */
  async close() {
    try {
      this.stopMetricsCollection();
      await redisService.close();
      logger.info('[RedisMonitoring] Closed successfully');
    } catch (error) {
      logger.error('[RedisMonitoring] Close error:', error);
    }
  }
}

// Create singleton instance
const redisMonitoring = new RedisMonitoring();

module.exports = redisMonitoring;
