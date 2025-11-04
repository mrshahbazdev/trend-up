/**
 * Socket.io Service
 * Real-time communication with Redis Pub/Sub
 */

const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const redisService = require('./redis.service');
const { logger } = require('../utils/logger');

class SocketService {
  constructor() {
    this.io = null;
    this.isInitialized = false;
    this.connectedUsers = new Map(); // userId -> socketId mapping
    this.userRooms = new Map(); // userId -> room names
    this.roomUsers = new Map(); // room -> Set of userIds
    
    // Event types
    this.eventTypes = {
      // Post events
      POST_CREATED: 'post:created',
      POST_UPDATED: 'post:updated',
      POST_DELETED: 'post:deleted',
      POST_LIKED: 'post:liked',
      POST_UNLIKED: 'post:unliked',
      
      // Comment events
      COMMENT_CREATED: 'comment:created',
      COMMENT_UPDATED: 'comment:updated',
      COMMENT_DELETED: 'comment:deleted',
      COMMENT_LIKED: 'comment:liked',
      
      // Reaction events
      REACTION_ADDED: 'reaction:added',
      REACTION_REMOVED: 'reaction:removed',
      
      // Karma events
      KARMA_EARNED: 'karma:earned',
      KARMA_DEDUCTED: 'karma:deducted',
      LEVEL_UP: 'level:up',
      BADGE_EARNED: 'badge:earned',
      
      // Follow events
      USER_FOLLOWED: 'user:followed',
      USER_UNFOLLOWED: 'user:unfollowed',
      
      // Poll events
      POLL_CREATED: 'poll:created',
      POLL_VOTED: 'poll:voted',
      POLL_EXPIRED: 'poll:expired',
      
      // Prediction events
      PREDICTION_CREATED: 'prediction:created',
      PREDICTION_STAKED: 'prediction:staked',
      PREDICTION_RESOLVED: 'prediction:resolved',
      
      // Notification events
      NOTIFICATION_RECEIVED: 'notification:received',
      
      // System events
      USER_CONNECTED: 'user:connected',
      USER_DISCONNECTED: 'user:disconnected',
      FEED_UPDATED: 'feed:updated',
      TRENDING_UPDATED: 'trending:updated'
    };
  }

  /**
   * Initialize Socket.io server
   */
  async initialize(httpServer) {
    try {
      // Don't initialize Redis here - it's already initialized in server.js
      // Just get the existing client
      const client = redisService.getClient();
      if (!client) {
        throw new Error('Redis client not available. Make sure Redis is initialized first.');
      }
      
      // Create Socket.io server
      this.io = new Server(httpServer, {
        cors: {
          origin: process.env.FRONTEND_URL || "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000
      });

      // Set up Redis adapter for scaling
      const pubClient = client;
      const subClient = pubClient.duplicate();
      
      this.io.adapter(createAdapter(pubClient, subClient));
      
      // Set up event handlers
      this.setupEventHandlers();
      
      this.isInitialized = true;
      logger.info('[SocketService] Initialized successfully with Redis adapter');
      
      return this.io;
    } catch (error) {
      logger.error('[SocketService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set up Socket.io event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`[SocketService] User connected: ${socket.id}`);
      
      // Handle user authentication and room joining
      socket.on('authenticate', async (data) => {
        try {
          const { userId, token } = data;
          
          // TODO: Verify JWT token here
          // For now, we'll trust the client
          
          // Store user connection
          this.connectedUsers.set(userId, socket.id);
          socket.userId = userId;
          
          // Join user to their personal room
          const userRoom = `user:${userId}`;
          socket.join(userRoom);
          this.addUserToRoom(userId, userRoom);
          
          // Join user to general rooms
          socket.join('general');
          socket.join('notifications');
          
          // Notify user of successful connection
          socket.emit('authenticated', {
            userId,
            socketId: socket.id,
            timestamp: new Date().toISOString()
          });
          
          // Notify others that user is online
          socket.to('general').emit(this.eventTypes.USER_CONNECTED, {
            userId,
            timestamp: new Date().toISOString()
          });
          
          logger.info(`[SocketService] User ${userId} authenticated and joined rooms`);
        } catch (error) {
          logger.error('[SocketService] Authentication error:', error);
          socket.emit('error', { message: 'Authentication failed' });
        }
      });

      // Handle joining specific rooms
      socket.on('join_room', (data) => {
        try {
          const { room } = data;
          socket.join(room);
          
          if (socket.userId) {
            this.addUserToRoom(socket.userId, room);
          }
          
          socket.emit('room_joined', { room });
          logger.debug(`[SocketService] User ${socket.userId} joined room: ${room}`);
        } catch (error) {
          logger.error('[SocketService] Join room error:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Handle leaving rooms
      socket.on('leave_room', (data) => {
        try {
          const { room } = data;
          socket.leave(room);
          
          if (socket.userId) {
            this.removeUserFromRoom(socket.userId, room);
          }
          
          socket.emit('room_left', { room });
          logger.debug(`[SocketService] User ${socket.userId} left room: ${room}`);
        } catch (error) {
          logger.error('[SocketService] Leave room error:', error);
          socket.emit('error', { message: 'Failed to leave room' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        try {
          const { postId, commentId } = data;
          const room = commentId ? `post:${postId}:comments` : `post:${postId}`;
          
          socket.to(room).emit('user_typing', {
            userId: socket.userId,
            postId,
            commentId,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          logger.error('[SocketService] Typing start error:', error);
        }
      });

      socket.on('typing_stop', (data) => {
        try {
          const { postId, commentId } = data;
          const room = commentId ? `post:${postId}:comments` : `post:${postId}`;
          
          socket.to(room).emit('user_stopped_typing', {
            userId: socket.userId,
            postId,
            commentId,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          logger.error('[SocketService] Typing stop error:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        try {
          if (socket.userId) {
            // Remove user from all rooms
            this.removeUserFromAllRooms(socket.userId);
            
            // Remove from connected users
            this.connectedUsers.delete(socket.userId);
            
            // Notify others that user is offline
            socket.to('general').emit(this.eventTypes.USER_DISCONNECTED, {
              userId: socket.userId,
              timestamp: new Date().toISOString()
            });
            
            logger.info(`[SocketService] User ${socket.userId} disconnected`);
          } else {
            logger.info(`[SocketService] Anonymous user disconnected: ${socket.id}`);
          }
        } catch (error) {
          logger.error('[SocketService] Disconnect error:', error);
        }
      });
    });
  }

  /**
   * Add user to room tracking
   */
  addUserToRoom(userId, room) {
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId).add(room);
    
    if (!this.roomUsers.has(room)) {
      this.roomUsers.set(room, new Set());
    }
    this.roomUsers.get(room).add(userId);
  }

  /**
   * Remove user from room tracking
   */
  removeUserFromRoom(userId, room) {
    if (this.userRooms.has(userId)) {
      this.userRooms.get(userId).delete(room);
    }
    
    if (this.roomUsers.has(room)) {
      this.roomUsers.get(room).delete(userId);
    }
  }

  /**
   * Remove user from all rooms
   */
  removeUserFromAllRooms(userId) {
    if (this.userRooms.has(userId)) {
      const rooms = this.userRooms.get(userId);
      rooms.forEach(room => {
        this.removeUserFromRoom(userId, room);
      });
      this.userRooms.delete(userId);
    }
  }

  /**
   * Emit event to specific user
   */
  async emitToUser(userId, event, data) {
    try {
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        this.io.to(socketId).emit(event, {
          ...data,
          timestamp: new Date().toISOString()
        });
        logger.debug(`[SocketService] Emitted ${event} to user ${userId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`[SocketService] Emit to user error for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Emit event to room
   */
  async emitToRoom(room, event, data) {
    try {
      this.io.to(room).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      logger.debug(`[SocketService] Emitted ${event} to room ${room}`);
      return true;
    } catch (error) {
      logger.error(`[SocketService] Emit to room error for room ${room}:`, error);
      return false;
    }
  }

  /**
   * Emit event to all connected users
   */
  async emitToAll(event, data) {
    try {
      this.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      logger.debug(`[SocketService] Emitted ${event} to all users`);
      return true;
    } catch (error) {
      logger.error(`[SocketService] Emit to all error:`, error);
      return false;
    }
  }

  /**
   * Emit event to users following a specific user
   */
  async emitToFollowers(userId, event, data) {
    try {
      // TODO: Get followers from database
      // For now, emit to general room
      await this.emitToRoom('general', event, {
        ...data,
        targetUserId: userId
      });
      return true;
    } catch (error) {
      logger.error(`[SocketService] Emit to followers error for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get room users count
   */
  getRoomUsersCount(room) {
    return this.roomUsers.has(room) ? this.roomUsers.get(room).size : 0;
  }

  /**
   * Get user's rooms
   */
  getUserRooms(userId) {
    return this.userRooms.has(userId) ? Array.from(this.userRooms.get(userId)) : [];
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get server statistics
   */
  getServerStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalRooms: this.roomUsers.size,
      isInitialized: this.isInitialized,
      eventTypes: Object.keys(this.eventTypes).length
    };
  }

  /**
   * Close Socket.io server
   */
  async close() {
    try {
      if (this.io) {
        this.io.close();
        this.connectedUsers.clear();
        this.userRooms.clear();
        this.roomUsers.clear();
        this.isInitialized = false;
        logger.info('[SocketService] Closed successfully');
      }
    } catch (error) {
      logger.error('[SocketService] Close error:', error);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

module.exports = socketService;
