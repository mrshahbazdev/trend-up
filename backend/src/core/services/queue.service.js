/**
 * Queue Management Service
 * Background job processing with Redis queues
 */

const redisService = require('./redis.service');
const { logger } = require('../utils/logger');

class QueueService {
  constructor() {
    this.queues = {
      // High priority queues
      'karma:earn': { 
        priority: 'high', 
        concurrency: 5, 
        maxRetries: 3,
        retryDelay: 5000,
        description: 'Karma earning processing'
      },
      'karma:deduct': { 
        priority: 'high', 
        concurrency: 5, 
        maxRetries: 3,
        retryDelay: 5000,
        description: 'Karma deduction processing'
      },
      'notification:send': { 
        priority: 'high', 
        concurrency: 10, 
        maxRetries: 2,
        retryDelay: 3000,
        description: 'Notification delivery'
      },
      
      // Medium priority queues
      'feed:personalize': { 
        priority: 'medium', 
        concurrency: 3, 
        maxRetries: 2,
        retryDelay: 10000,
        description: 'Feed personalization'
      },
      'media:process': { 
        priority: 'medium', 
        concurrency: 2, 
        maxRetries: 3,
        retryDelay: 15000,
        description: 'Media processing'
      },
      'prediction:resolve': { 
        priority: 'medium', 
        concurrency: 2, 
        maxRetries: 2,
        retryDelay: 10000,
        description: 'Prediction resolution'
      },
      
      // Low priority queues
      'feed:trending': { 
        priority: 'low', 
        concurrency: 1, 
        maxRetries: 1,
        retryDelay: 30000,
        description: 'Trending calculation'
      },
      'poll:expire': { 
        priority: 'low', 
        concurrency: 1, 
        maxRetries: 1,
        retryDelay: 60000,
        description: 'Poll expiration'
      },
      'cleanup:old-data': { 
        priority: 'low', 
        concurrency: 1, 
        maxRetries: 1,
        retryDelay: 300000,
        description: 'Data cleanup'
      }
    };

    this.workers = new Map();
    this.isRunning = false;
    this.stats = {
      processed: 0,
      failed: 0,
      retries: 0,
      startTime: null
    };
  }

  /**
   * Initialize queue service
   */
  async initialize() {
    try {
      await redisService.initialize();
      this.stats.startTime = new Date();
      logger.info('[QueueService] Initialized successfully');
    } catch (error) {
      logger.error('[QueueService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Add job to queue
   */
  async addJob(queue, job, options = {}) {
    try {
      if (!this.queues[queue]) {
        throw new Error(`Queue '${queue}' not defined`);
      }

      const jobData = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        queue,
        data: job,
        options: {
          priority: options.priority || this.queues[queue].priority,
          delay: options.delay || 0,
          maxRetries: options.maxRetries || this.queues[queue].maxRetries,
          ...options
        },
        createdAt: new Date().toISOString(),
        attempts: 0
      };

      const jobId = await redisService.enqueue(queue, jobData, jobData.options.priority);
      
      logger.debug(`[QueueService] Added job ${jobId} to queue ${queue}`);
      return jobId;
    } catch (error) {
      logger.error(`[QueueService] Add job error for queue ${queue}:`, error);
      throw error;
    }
  }

  /**
   * Process job from queue
   */
  async processJob(queue, jobData, processor) {
    try {
      logger.debug(`[QueueService] Processing job ${jobData.id} from queue ${queue}`);
      
      // Execute the processor function
      const result = await processor(jobData.data);
      
      this.stats.processed++;
      logger.debug(`[QueueService] Successfully processed job ${jobData.id}`);
      
      return result;
    } catch (error) {
      logger.error(`[QueueService] Job processing error for job ${jobData.id}:`, error);
      
      // Handle retries
      await this.handleJobFailure(queue, jobData, error);
      throw error;
    }
  }

  /**
   * Handle job failure and retries
   */
  async handleJobFailure(queue, jobData, error) {
    try {
      const queueConfig = this.queues[queue];
      jobData.attempts++;
      
      if (jobData.attempts < jobData.options.maxRetries) {
        // Retry the job
        jobData.lastError = error.message;
        jobData.nextRetryAt = new Date(Date.now() + queueConfig.retryDelay);
        
        await redisService.enqueue(queue, jobData, 'low'); // Retry with low priority
        this.stats.retries++;
        
        logger.warn(`[QueueService] Job ${jobData.id} failed, retrying (attempt ${jobData.attempts}/${jobData.options.maxRetries})`);
      } else {
        // Move to failed queue
        await this.moveToFailedQueue(queue, jobData, error);
        this.stats.failed++;
        
        logger.error(`[QueueService] Job ${jobData.id} failed permanently after ${jobData.attempts} attempts`);
      }
    } catch (retryError) {
      logger.error(`[QueueService] Error handling job failure for job ${jobData.id}:`, retryError);
    }
  }

  /**
   * Move job to failed queue
   */
  async moveToFailedQueue(queue, jobData, error) {
    try {
      const failedJob = {
        ...jobData,
        failedAt: new Date().toISOString(),
        finalError: error.message,
        stack: error.stack
      };
      
      await redisService.enqueue('failed', failedJob, 'low');
      logger.debug(`[QueueService] Moved job ${jobData.id} to failed queue`);
    } catch (moveError) {
      logger.error(`[QueueService] Error moving job to failed queue:`, moveError);
    }
  }

  /**
   * Start worker for specific queue
   */
  async startWorker(queue, processor) {
    try {
      if (!this.queues[queue]) {
        throw new Error(`Queue '${queue}' not defined`);
      }

      if (this.workers.has(queue)) {
        logger.warn(`[QueueService] Worker for queue ${queue} already running`);
        return;
      }

      const queueConfig = this.queues[queue];
      let isProcessing = false;

      const worker = async () => {
        while (this.isRunning && this.workers.has(queue)) {
          try {
            if (isProcessing) {
              await new Promise(resolve => setTimeout(resolve, 100));
              continue;
            }

            isProcessing = true;
            const jobData = await redisService.dequeue(queue, 5); // 5 second timeout

            if (jobData) {
              await this.processJob(queue, jobData, processor);
            }
          } catch (error) {
            logger.error(`[QueueService] Worker error for queue ${queue}:`, error);
          } finally {
            isProcessing = false;
          }
        }
      };

      this.workers.set(queue, worker);
      worker(); // Start the worker
      
      logger.info(`[QueueService] Started worker for queue ${queue} (concurrency: ${queueConfig.concurrency})`);
    } catch (error) {
      logger.error(`[QueueService] Start worker error for queue ${queue}:`, error);
      throw error;
    }
  }

  /**
   * Stop worker for specific queue
   */
  async stopWorker(queue) {
    try {
      if (this.workers.has(queue)) {
        this.workers.delete(queue);
        logger.info(`[QueueService] Stopped worker for queue ${queue}`);
      }
    } catch (error) {
      logger.error(`[QueueService] Stop worker error for queue ${queue}:`, error);
    }
  }

  /**
   * Start all workers
   */
  async startAllWorkers(processors = {}) {
    try {
      this.isRunning = true;
      
      for (const [queueName, queueConfig] of Object.entries(this.queues)) {
        if (processors[queueName]) {
          await this.startWorker(queueName, processors[queueName]);
        }
      }
      
      logger.info(`[QueueService] Started all workers (${this.workers.size} workers)`);
    } catch (error) {
      logger.error('[QueueService] Start all workers error:', error);
      throw error;
    }
  }

  /**
   * Stop all workers
   */
  async stopAllWorkers() {
    try {
      this.isRunning = false;
      this.workers.clear();
      logger.info('[QueueService] Stopped all workers');
    } catch (error) {
      logger.error('[QueueService] Stop all workers error:', error);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queue) {
    try {
      const length = await redisService.getQueueLength(queue);
      const queueConfig = this.queues[queue];
      
      return {
        queue,
        length,
        config: queueConfig,
        workerRunning: this.workers.has(queue)
      };
    } catch (error) {
      logger.error(`[QueueService] Get queue stats error for queue ${queue}:`, error);
      return null;
    }
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats() {
    try {
      const stats = {};
      
      for (const queueName of Object.keys(this.queues)) {
        stats[queueName] = await this.getQueueStats(queueName);
      }
      
      return {
        queues: stats,
        global: {
          ...this.stats,
          uptime: this.stats.startTime ? Date.now() - this.stats.startTime.getTime() : 0,
          activeWorkers: this.workers.size
        }
      };
    } catch (error) {
      logger.error('[QueueService] Get all queue stats error:', error);
      return null;
    }
  }

  /**
   * Clear queue
   */
  async clearQueue(queue) {
    try {
      const queueKey = redisService.getKey(`queue:${queue}`);
      const client = redisService.getClient();
      await client.del(queueKey);
      
      logger.info(`[QueueService] Cleared queue ${queue}`);
      return true;
    } catch (error) {
      logger.error(`[QueueService] Clear queue error for queue ${queue}:`, error);
      return false;
    }
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(limit = 100) {
    try {
      const failedJobs = await redisService.getListRange('failed', 0, limit - 1);
      return failedJobs.map(job => JSON.parse(job));
    } catch (error) {
      logger.error('[QueueService] Get failed jobs error:', error);
      return [];
    }
  }

  /**
   * Retry failed job
   */
  async retryFailedJob(jobId) {
    try {
      const failedJobs = await this.getFailedJobs(1000);
      const job = failedJobs.find(j => j.id === jobId);
      
      if (!job) {
        throw new Error(`Failed job ${jobId} not found`);
      }
      
      // Reset attempts and add back to original queue
      job.attempts = 0;
      delete job.failedAt;
      delete job.finalError;
      delete job.stack;
      
      await this.addJob(job.queue, job.data, job.options);
      
      // Remove from failed queue
      const client = redisService.getClient();
      const failedQueueKey = redisService.getKey('queue:failed');
      await client.lrem(failedQueueKey, 1, JSON.stringify(job));
      
      logger.info(`[QueueService] Retried failed job ${jobId}`);
      return true;
    } catch (error) {
      logger.error(`[QueueService] Retry failed job error for job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const redisHealth = await redisService.healthCheck();
      const queueStats = await this.getAllQueueStats();
      
      return {
        status: redisHealth.status === 'healthy' && this.isRunning ? 'healthy' : 'unhealthy',
        redis: redisHealth,
        queues: queueStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('[QueueService] Health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
const queueService = new QueueService();

module.exports = queueService;
