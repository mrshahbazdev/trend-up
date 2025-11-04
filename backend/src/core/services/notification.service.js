/**
 * Notification Service
 * Real-time notifications with Redis Pub/Sub
 */

const socketService = require('./socket.service');
const redisService = require('./redis.service');
const { logger } = require('../utils/logger');

class NotificationService {
  constructor() {
    this.notificationTypes = {
      // Post notifications
      POST_LIKED: 'post_liked',
      POST_COMMENTED: 'post_commented',
      POST_SHARED: 'post_shared',
      
      // Comment notifications
      COMMENT_LIKED: 'comment_liked',
      COMMENT_REPLIED: 'comment_replied',
      
      // Reaction notifications
      REACTION_ADDED: 'reaction_added',
      
      // Follow notifications
      USER_FOLLOWED: 'user_followed',
      USER_UNFOLLOWED: 'user_unfollowed',
      
      // Karma notifications
      KARMA_EARNED: 'karma_earned',
      LEVEL_UP: 'level_up',
      BADGE_EARNED: 'badge_earned',
      
      // Poll notifications
      POLL_VOTED: 'poll_voted',
      POLL_EXPIRED: 'poll_expired',
      
      // Prediction notifications
      PREDICTION_STAKED: 'prediction_staked',
      PREDICTION_RESOLVED: 'prediction_resolved',
      
      // System notifications
      SYSTEM_ANNOUNCEMENT: 'system_announcement',
      MAINTENANCE_NOTICE: 'maintenance_notice'
    };

    this.priorityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      URGENT: 'urgent'
    };
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    try {
      // Don't initialize Redis here - it's already initialized in server.js
      // Just verify Redis is available
      const client = redisService.getClient();
      if (!client) {
        throw new Error('Redis client not available. Make sure Redis is initialized first.');
      }
      logger.info('[NotificationService] Initialized successfully');
    } catch (error) {
      logger.error('[NotificationService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(userId, notification) {
    try {
      const notificationData = {
        id: this.generateNotificationId(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        priority: notification.priority || this.priorityLevels.MEDIUM,
        read: false,
        createdAt: new Date().toISOString(),
        expiresAt: notification.expiresAt || null
      };

      // Store notification in Redis
      await this.storeNotification(userId, notificationData);

      // Send real-time notification
      await socketService.emitToUser(userId, socketService.eventTypes.NOTIFICATION_RECEIVED, notificationData);

      // Log notification
      logger.debug(`[NotificationService] Notification sent to user ${userId}: ${notificationData.type}`);

      return notificationData;
    } catch (error) {
      logger.error(`[NotificationService] Error sending notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendBulkNotification(userIds, notification) {
    try {
      const results = [];
      
      for (const userId of userIds) {
        try {
          const result = await this.sendNotification(userId, notification);
          results.push({ userId, success: true, notification: result });
        } catch (error) {
          results.push({ userId, success: false, error: error.message });
        }
      }

      logger.debug(`[NotificationService] Bulk notification sent to ${userIds.length} users`);
      return results;
    } catch (error) {
      logger.error('[NotificationService] Error sending bulk notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to all online users
   */
  async sendBroadcastNotification(notification) {
    try {
      // Get all connected users
      const connectedUsers = Array.from(socketService.connectedUsers.keys());
      
      if (connectedUsers.length === 0) {
        logger.warn('[NotificationService] No connected users for broadcast');
        return [];
      }

      // Send to all connected users
      const results = await this.sendBulkNotification(connectedUsers, notification);

      // Also emit to general room for any missed connections
      await socketService.emitToRoom('general', socketService.eventTypes.NOTIFICATION_RECEIVED, {
        ...notification,
        id: this.generateNotificationId(),
        broadcast: true,
        createdAt: new Date().toISOString()
      });

      logger.info(`[NotificationService] Broadcast notification sent to ${connectedUsers.length} users`);
      return results;
    } catch (error) {
      logger.error('[NotificationService] Error sending broadcast notification:', error);
      throw error;
    }
  }

  /**
   * Store notification in Redis
   */
  async storeNotification(userId, notification) {
    try {
      const key = `notifications:${userId}`;
      
      // Add to user's notification list
      await redisService.addToList(key, JSON.stringify(notification));
      
      // Set expiration for notification list (30 days)
      await redisService.setExpire(key, 30 * 24 * 60 * 60);
      
      // Store individual notification
      const notificationKey = `notification:${notification.id}`;
      await redisService.cache(notificationKey, notification, 30 * 24 * 60 * 60);
      
      // Update user's unread count
      await this.incrementUnreadCount(userId);
      
      logger.debug(`[NotificationService] Notification stored for user ${userId}`);
    } catch (error) {
      logger.error(`[NotificationService] Error storing notification for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, unreadOnly = false } = options;
      const key = `notifications:${userId}`;
      
      // Get notifications from Redis list
      const notifications = await redisService.getListRange(key, offset, offset + limit - 1);
      
      // Parse notifications
      const parsedNotifications = notifications.map(notification => JSON.parse(notification));
      
      // Filter unread only if requested
      const filteredNotifications = unreadOnly 
        ? parsedNotifications.filter(n => !n.read)
        : parsedNotifications;
      
      // Get unread count
      const unreadCount = await this.getUnreadCount(userId);
      
      return {
        notifications: filteredNotifications,
        unreadCount,
        total: parsedNotifications.length
      };
    } catch (error) {
      logger.error(`[NotificationService] Error getting notifications for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(userId, notificationId) {
    try {
      const notificationKey = `notification:${notificationId}`;
      const notification = await redisService.getCached(notificationKey);
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      // Update notification
      notification.read = true;
      notification.readAt = new Date().toISOString();
      
      // Update in Redis
      await redisService.cache(notificationKey, notification, 30 * 24 * 60 * 60);
      
      // Update in user's notification list
      const userKey = `notifications:${userId}`;
      const userNotifications = await redisService.getListRange(userKey);
      
      const updatedNotifications = userNotifications.map(n => {
        const parsed = JSON.parse(n);
        if (parsed.id === notificationId) {
          return JSON.stringify(notification);
        }
        return n;
      });
      
      // Replace the list
      await redisService.invalidate(userKey);
      if (updatedNotifications.length > 0) {
        await redisService.addToList(userKey, ...updatedNotifications);
        await redisService.setExpire(userKey, 30 * 24 * 60 * 60);
      }
      
      // Decrement unread count
      await this.decrementUnreadCount(userId);
      
      logger.debug(`[NotificationService] Notification ${notificationId} marked as read for user ${userId}`);
      return notification;
    } catch (error) {
      logger.error(`[NotificationService] Error marking notification as read:`, error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(userId) {
    try {
      const key = `notifications:${userId}`;
      const notifications = await redisService.getListRange(key);
      
      const updatedNotifications = notifications.map(n => {
        const parsed = JSON.parse(n);
        if (!parsed.read) {
          parsed.read = true;
          parsed.readAt = new Date().toISOString();
        }
        return JSON.stringify(parsed);
      });
      
      // Replace the list
      await redisService.invalidate(key);
      if (updatedNotifications.length > 0) {
        await redisService.addToList(key, ...updatedNotifications);
        await redisService.setExpire(key, 30 * 24 * 60 * 60);
      }
      
      // Reset unread count
      await this.resetUnreadCount(userId);
      
      logger.debug(`[NotificationService] All notifications marked as read for user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`[NotificationService] Error marking all notifications as read:`, error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(userId, notificationId) {
    try {
      const userKey = `notifications:${userId}`;
      const notifications = await redisService.getListRange(userKey);
      
      const filteredNotifications = notifications.filter(n => {
        const parsed = JSON.parse(n);
        return parsed.id !== notificationId;
      });
      
      // Replace the list
      await redisService.invalidate(userKey);
      if (filteredNotifications.length > 0) {
        await redisService.addToList(userKey, ...filteredNotifications);
        await redisService.setExpire(userKey, 30 * 24 * 60 * 60);
      }
      
      // Delete individual notification
      const notificationKey = `notification:${notificationId}`;
      await redisService.invalidate(notificationKey);
      
      logger.debug(`[NotificationService] Notification ${notificationId} deleted for user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`[NotificationService] Error deleting notification:`, error);
      throw error;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    try {
      const count = await redisService.getCached(`unread:${userId}`);
      return count ? parseInt(count) : 0;
    } catch (error) {
      logger.error(`[NotificationService] Error getting unread count for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Increment unread count
   */
  async incrementUnreadCount(userId) {
    try {
      const count = await redisService.increment(`unread:${userId}`);
      await redisService.setExpire(`unread:${userId}`, 30 * 24 * 60 * 60);
      return count;
    } catch (error) {
      logger.error(`[NotificationService] Error incrementing unread count for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Decrement unread count
   */
  async decrementUnreadCount(userId) {
    try {
      const count = await redisService.decrement(`unread:${userId}`);
      if (count < 0) {
        await redisService.invalidate(`unread:${userId}`);
        return 0;
      }
      return count;
    } catch (error) {
      logger.error(`[NotificationService] Error decrementing unread count for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Reset unread count
   */
  async resetUnreadCount(userId) {
    try {
      await redisService.invalidate(`unread:${userId}`);
      return 0;
    } catch (error) {
      logger.error(`[NotificationService] Error resetting unread count for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Generate notification ID
   */
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create notification templates
   */
  createNotificationTemplates() {
    return {
      postLiked: (liker, post) => ({
        type: this.notificationTypes.POST_LIKED,
        title: 'Post Liked',
        message: `${liker.username} liked your post`,
        data: {
          likerId: liker._id,
          likerUsername: liker.username,
          likerAvatar: liker.avatar,
          postId: post._id,
          postContent: post.content.substring(0, 100)
        },
        priority: this.priorityLevels.LOW
      }),

      postCommented: (commenter, post, comment) => ({
        type: this.notificationTypes.POST_COMMENTED,
        title: 'New Comment',
        message: `${commenter.username} commented on your post`,
        data: {
          commenterId: commenter._id,
          commenterUsername: commenter.username,
          commenterAvatar: commenter.avatar,
          postId: post._id,
          commentId: comment._id,
          commentContent: comment.content.substring(0, 100)
        },
        priority: this.priorityLevels.MEDIUM
      }),

      userFollowed: (follower) => ({
        type: this.notificationTypes.USER_FOLLOWED,
        title: 'New Follower',
        message: `${follower.username} started following you`,
        data: {
          followerId: follower._id,
          followerUsername: follower.username,
          followerAvatar: follower.avatar
        },
        priority: this.priorityLevels.MEDIUM
      }),

      karmaEarned: (amount, reason) => ({
        type: this.notificationTypes.KARMA_EARNED,
        title: 'Karma Earned',
        message: `You earned ${amount} karma for ${reason}`,
        data: {
          amount,
          reason
        },
        priority: this.priorityLevels.LOW
      }),

      levelUp: (newLevel) => ({
        type: this.notificationTypes.LEVEL_UP,
        title: 'Level Up!',
        message: `Congratulations! You've reached ${newLevel} level`,
        data: {
          newLevel
        },
        priority: this.priorityLevels.HIGH
      }),

      badgeEarned: (badge) => ({
        type: this.notificationTypes.BADGE_EARNED,
        title: 'Badge Earned',
        message: `You earned the "${badge.name}" badge`,
        data: {
          badgeId: badge._id,
          badgeName: badge.name,
          badgeDescription: badge.description,
          badgeIcon: badge.icon
        },
        priority: this.priorityLevels.HIGH
      }),

      predictionResolved: (prediction, isWinner, karmaChange) => ({
        type: this.notificationTypes.PREDICTION_RESOLVED,
        title: 'Prediction Resolved',
        message: isWinner 
          ? `Your prediction was correct! You earned ${karmaChange} karma`
          : `Your prediction was incorrect. You lost ${Math.abs(karmaChange)} karma`,
        data: {
          predictionId: prediction._id,
          isWinner,
          karmaChange,
          outcome: prediction.outcome
        },
        priority: this.priorityLevels.MEDIUM
      })
    };
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats() {
    try {
      const stats = {
        totalNotifications: 0,
        unreadNotifications: 0,
        connectedUsers: socketService.getConnectedUsersCount(),
        notificationTypes: Object.keys(this.notificationTypes).length
      };

      // This would require scanning all notification keys
      // For now, return basic stats
      return stats;
    } catch (error) {
      logger.error('[NotificationService] Error getting notification stats:', error);
      return null;
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
