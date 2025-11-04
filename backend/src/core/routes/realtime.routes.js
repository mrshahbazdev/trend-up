/**
 * Real-time Routes
 * WebSocket and real-time event endpoints
 */

const express = require('express');
const router = express.Router();
// const socketService = require('../services/socket.service'); // Temporarily disabled
const realtimeService = require('../services/realtime.service.simple');
const notificationService = require('../services/notification.service.simple');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const { logger } = require('../utils/logger');

/**
 * GET /status
 * Get real-time service status
 */
router.get('/status', async (req, res) => {
  try {
    const stats = socketService.getServerStats();
    const notificationStats = await notificationService.getNotificationStats();
    
    const status = {
      socket: {
        initialized: stats.isInitialized,
        connectedUsers: stats.connectedUsers,
        totalRooms: stats.totalRooms,
        eventTypes: stats.eventTypes
      },
      notifications: notificationStats,
      timestamp: new Date().toISOString()
    };
    
    sendSuccessResponse(res, status, 'Real-time service status retrieved successfully');
  } catch (error) {
    logger.error('[RealtimeRoutes] Get status error:', error);
    sendErrorResponse(res, 'Failed to get real-time service status', 500, { error: error.message });
  }
});

/**
 * GET /connected-users
 * Get list of connected users
 */
router.get('/connected-users', async (req, res) => {
  try {
    const connectedUsers = Array.from(socketService.connectedUsers.keys());
    const userRooms = {};
    
    // Get rooms for each connected user
    for (const userId of connectedUsers) {
      userRooms[userId] = socketService.getUserRooms(userId);
    }
    
    const result = {
      connectedUsers,
      userCount: connectedUsers.length,
      userRooms,
      timestamp: new Date().toISOString()
    };
    
    sendSuccessResponse(res, result, 'Connected users retrieved successfully');
  } catch (error) {
    logger.error('[RealtimeRoutes] Get connected users error:', error);
    sendErrorResponse(res, 'Failed to get connected users', 500, { error: error.message });
  }
});

/**
 * GET /rooms
 * Get all active rooms
 */
router.get('/rooms', async (req, res) => {
  try {
    const rooms = Array.from(socketService.roomUsers.keys());
    const roomStats = {};
    
    // Get user count for each room
    for (const room of rooms) {
      roomStats[room] = socketService.getRoomUsersCount(room);
    }
    
    const result = {
      rooms,
      roomCount: rooms.length,
      roomStats,
      timestamp: new Date().toISOString()
    };
    
    sendSuccessResponse(res, result, 'Active rooms retrieved successfully');
  } catch (error) {
    logger.error('[RealtimeRoutes] Get rooms error:', error);
    sendErrorResponse(res, 'Failed to get active rooms', 500, { error: error.message });
  }
});

/**
 * POST /emit-event
 * Emit a real-time event
 */
router.post('/emit-event', async (req, res) => {
  try {
    const { eventType, data, target, options = {} } = req.body;
    
    if (!eventType || !data) {
      return sendErrorResponse(res, 'Event type and data are required', 400);
    }
    
    let result = null;
    
    switch (target?.type) {
      case 'user':
        result = await socketService.emitToUser(target.userId, eventType, data);
        break;
      case 'room':
        result = await socketService.emitToRoom(target.room, eventType, data);
        break;
      case 'followers':
        result = await socketService.emitToFollowers(target.userId, eventType, data);
        break;
      case 'all':
        result = await socketService.emitToAll(eventType, data);
        break;
      default:
        return sendErrorResponse(res, 'Invalid target type', 400);
    }
    
    if (result) {
      sendSuccessResponse(res, { 
        eventType, 
        target, 
        emitted: true,
        timestamp: new Date().toISOString()
      }, 'Event emitted successfully');
    } else {
      sendErrorResponse(res, 'Failed to emit event', 500);
    }
  } catch (error) {
    logger.error('[RealtimeRoutes] Emit event error:', error);
    sendErrorResponse(res, 'Failed to emit event', 500, { error: error.message });
  }
});

/**
 * POST /test-event
 * Test real-time event system
 */
router.post('/test-event', async (req, res) => {
  try {
    const { eventType = 'test:event', targetUserId } = req.body;
    
    const testData = {
      message: 'This is a test real-time event',
      timestamp: new Date().toISOString(),
      random: Math.random()
    };
    
    let result = false;
    
    if (targetUserId) {
      // Send to specific user
      result = await socketService.emitToUser(targetUserId, eventType, testData);
    } else {
      // Send to all connected users
      result = await socketService.emitToAll(eventType, testData);
    }
    
    sendSuccessResponse(res, {
      eventType,
      targetUserId: targetUserId || 'all',
      emitted: result,
      data: testData,
      timestamp: new Date().toISOString()
    }, 'Test event sent successfully');
  } catch (error) {
    logger.error('[RealtimeRoutes] Test event error:', error);
    sendErrorResponse(res, 'Failed to send test event', 500, { error: error.message });
  }
});

/**
 * POST /simulate-post-created
 * Simulate a post creation event
 */
router.post('/simulate-post-created', async (req, res) => {
  try {
    const { authorId, postId, content } = req.body;
    
    const mockData = {
      post: {
        _id: postId || 'mock-post-id',
        content: content || 'This is a mock post for testing real-time events',
        category: 'general',
        hashtags: ['test', 'realtime'],
        createdAt: new Date()
      },
      author: {
        _id: authorId || 'mock-author-id',
        username: 'testuser',
        avatar: 'https://example.com/avatar.jpg'
      }
    };
    
    await realtimeService.emitEvent('post:created', mockData);
    
    sendSuccessResponse(res, {
      event: 'post:created',
      data: mockData,
      timestamp: new Date().toISOString()
    }, 'Post creation event simulated successfully');
  } catch (error) {
    logger.error('[RealtimeRoutes] Simulate post created error:', error);
    sendErrorResponse(res, 'Failed to simulate post creation event', 500, { error: error.message });
  }
});

/**
 * POST /simulate-comment-created
 * Simulate a comment creation event
 */
router.post('/simulate-comment-created', async (req, res) => {
  try {
    const { authorId, postId, commentId, content } = req.body;
    
    const mockData = {
      comment: {
        _id: commentId || 'mock-comment-id',
        content: content || 'This is a mock comment for testing real-time events',
        postId: postId || 'mock-post-id',
        createdAt: new Date()
      },
      post: {
        _id: postId || 'mock-post-id',
        userId: 'mock-post-author-id'
      },
      author: {
        _id: authorId || 'mock-author-id',
        username: 'testuser',
        avatar: 'https://example.com/avatar.jpg'
      }
    };
    
    await realtimeService.emitEvent('comment:created', mockData);
    
    sendSuccessResponse(res, {
      event: 'comment:created',
      data: mockData,
      timestamp: new Date().toISOString()
    }, 'Comment creation event simulated successfully');
  } catch (error) {
    logger.error('[RealtimeRoutes] Simulate comment created error:', error);
    sendErrorResponse(res, 'Failed to simulate comment creation event', 500, { error: error.message });
  }
});

/**
 * POST /simulate-karma-earned
 * Simulate a karma earned event
 */
router.post('/simulate-karma-earned', async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    
    const mockData = {
      user: {
        _id: userId || 'mock-user-id',
        username: 'testuser'
      },
      amount: amount || 10,
      reason: reason || 'Test karma earning',
      totalKarma: 1000
    };
    
    await realtimeService.emitEvent('karma:earned', mockData);
    
    sendSuccessResponse(res, {
      event: 'karma:earned',
      data: mockData,
      timestamp: new Date().toISOString()
    }, 'Karma earned event simulated successfully');
  } catch (error) {
    logger.error('[RealtimeRoutes] Simulate karma earned error:', error);
    sendErrorResponse(res, 'Failed to simulate karma earned event', 500, { error: error.message });
  }
});

/**
 * POST /send-notification
 * Send a test notification
 */
router.post('/send-notification', async (req, res) => {
  try {
    const { userId, type, title, message, data } = req.body;
    
    if (!userId || !type || !title || !message) {
      return sendErrorResponse(res, 'userId, type, title, and message are required', 400);
    }
    
    const notification = {
      type,
      title,
      message,
      data: data || {},
      priority: 'medium'
    };
    
    const result = await notificationService.sendNotification(userId, notification);
    
    sendSuccessResponse(res, {
      notification: result,
      timestamp: new Date().toISOString()
    }, 'Notification sent successfully');
  } catch (error) {
    logger.error('[RealtimeRoutes] Send notification error:', error);
    sendErrorResponse(res, 'Failed to send notification', 500, { error: error.message });
  }
});

/**
 * GET /notifications/:userId
 * Get user's notifications
 */
router.get('/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    
    const result = await notificationService.getUserNotifications(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true'
    });
    
    sendSuccessResponse(res, result, 'User notifications retrieved successfully');
  } catch (error) {
    logger.error('[RealtimeRoutes] Get notifications error:', error);
    sendErrorResponse(res, 'Failed to get user notifications', 500, { error: error.message });
  }
});

/**
 * PUT /notifications/:userId/:notificationId/read
 * Mark notification as read
 */
router.put('/notifications/:userId/:notificationId/read', async (req, res) => {
  try {
    const { userId, notificationId } = req.params;
    
    const result = await notificationService.markNotificationAsRead(userId, notificationId);
    
    sendSuccessResponse(res, {
      notification: result,
      timestamp: new Date().toISOString()
    }, 'Notification marked as read successfully');
  } catch (error) {
    logger.error('[RealtimeRoutes] Mark notification as read error:', error);
    sendErrorResponse(res, 'Failed to mark notification as read', 500, { error: error.message });
  }
});

/**
 * PUT /notifications/:userId/read-all
 * Mark all notifications as read
 */
router.put('/notifications/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await notificationService.markAllNotificationsAsRead(userId);
    
    sendSuccessResponse(res, {
      success: result,
      timestamp: new Date().toISOString()
    }, 'All notifications marked as read successfully');
  } catch (error) {
    logger.error('[RealtimeRoutes] Mark all notifications as read error:', error);
    sendErrorResponse(res, 'Failed to mark all notifications as read', 500, { error: error.message });
  }
});

/**
 * GET /event-types
 * Get available event types
 */
router.get('/event-types', async (req, res) => {
  try {
    const eventTypes = socketService.eventTypes;
    
    sendSuccessResponse(res, {
      eventTypes,
      count: Object.keys(eventTypes).length,
      timestamp: new Date().toISOString()
    }, 'Event types retrieved successfully');
  } catch (error) {
    logger.error('[RealtimeRoutes] Get event types error:', error);
    sendErrorResponse(res, 'Failed to get event types', 500, { error: error.message });
  }
});

module.exports = router;
