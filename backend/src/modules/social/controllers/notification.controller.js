const notificationService = require('../../../core/services/notification.service');
const { logger } = require('../../../core/utils/logger');
const { ResponseHandler } = require('../../../core/utils/response');

class NotificationController {
  /**
   * Get user's notifications
   */
  async getNotifications(req, res, next) {
    try {
      const userId = req.user._id;
      const { limit = 50, offset = 0, unreadOnly = false } = req.query;

      const result = await notificationService.getUserNotifications(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        unreadOnly: unreadOnly === 'true'
      });

      return ResponseHandler.success(res, {
        ...result,
        message: 'Notifications retrieved successfully'
      });
    } catch (error) {
      logger.error('[ERROR] Failed to get notifications:', error);
      next(error);
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user._id;
      const count = await notificationService.getUnreadCount(userId);

      return ResponseHandler.success(res, {
        unreadCount: count,
        message: 'Unread count retrieved successfully'
      });
    } catch (error) {
      logger.error('[ERROR] Failed to get unread count:', error);
      next(error);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req, res, next) {
    try {
      const userId = req.user._id;
      const { notificationId } = req.params;

      const notification = await notificationService.markNotificationAsRead(userId, notificationId);

      return ResponseHandler.success(res, {
        notification,
        message: 'Notification marked as read'
      });
    } catch (error) {
      logger.error('[ERROR] Failed to mark notification as read:', error);
      next(error);
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user._id;
      await notificationService.markAllNotificationsAsRead(userId);

      return ResponseHandler.success(res, {
        message: 'All notifications marked as read'
      });
    } catch (error) {
      logger.error('[ERROR] Failed to mark all as read:', error);
      next(error);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(req, res, next) {
    try {
      const userId = req.user._id;
      const { notificationId } = req.params;

      await notificationService.deleteNotification(userId, notificationId);

      return ResponseHandler.success(res, {
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      logger.error('[ERROR] Failed to delete notification:', error);
      next(error);
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(req, res, next) {
    try {
      const stats = await notificationService.getNotificationStats();

      return ResponseHandler.success(res, {
        stats,
        message: 'Notification statistics retrieved successfully'
      });
    } catch (error) {
      logger.error('[ERROR] Failed to get notification stats:', error);
      next(error);
    }
  }
}

module.exports = new NotificationController();

