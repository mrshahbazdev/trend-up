// ==========================================
// Global Error Handlers (MUST be first!)
// ==========================================
console.log('[INFO] Setting up global error handlers...');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[ERROR] ========================================');
  console.error('[ERROR] UNCAUGHT EXCEPTION');
  console.error('[ERROR] ========================================');
  console.error('[ERROR] Message:', error.message);
  console.error('[ERROR] Name:', error.name);
  console.error('[ERROR] Stack:', error.stack);
  console.error('[ERROR] ========================================');
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] ========================================');
  console.error('[ERROR] UNHANDLED REJECTION');
  console.error('[ERROR] ========================================');
  console.error('[ERROR] Reason:', reason);
  console.error('[ERROR] Promise:', promise);
  console.error('[ERROR] ========================================');
  process.exit(1);
});

console.log('[INFO] Global error handlers registered');

// ==========================================
// Module Imports
// ==========================================
const app = require('./app'); // Aapki app.js file
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { logger } = require('./core/utils/logger');
const config = require('./config');
const { Server } = require("socket.io"); // 🛑 Socket.IO Server
const jwt = require('jsonwebtoken'); // 🛑 JWT Auth ke liye
// const User = require('./models/user.model'); // 🛑 User model (agar zaroorat paray)

async function startServer() {
  try {
    console.log('[INFO] ==========================================');
    console.log('[INFO] Starting TrendUp Backend Server...');
    console.log('[INFO] ==========================================');
// ... (Database aur Redis connection code waisa hi...) ...
    console.log(`[INFO] Environment: ${config.server.env}`);
    console.log(`[INFO] Host: ${config.server.host}`);
    console.log(`[INFO] Port: ${config.server.port}`);
    console.log(`[INFO] Node Version: ${process.version}`);
    console.log(`[INFO] Process ID: ${process.pid}`);
    
    console.log('[INFO] Configuration loaded:');
    console.log(`[INFO]   - MongoDB URI: ${config.database.uri ? 'Set' : 'Not set'}`);
    console.log(`[INFO]   - Redis URL: ${config.redis.url ? 'Set' : 'Not set'}`);
    console.log(`[INFO]   - JWT Secret: ${config.jwt.secret ? 'Set' : 'Not set'}`);
    console.log('[INFO] ==========================================');

    console.log('[INFO] Attempting to connect to MongoDB...');
    try {
      await connectDatabase();
      console.log('[INFO] Database connected successfully');
      logger.info('Database connected successfully');
    } catch (dbError) {
      console.error('[ERROR] Database connection failed:');
      console.error('[ERROR]   Error:', dbError.message);
      console.error('[ERROR]   Code:', dbError.code);
      console.error('[ERROR]   URI:', config.database.uri);
      logger.error('Database connection failed:', {
        error: dbError.message,
        code: dbError.code,
        uri: config.database.uri,
        stack: dbError.stack
      });
      throw dbError;
    }

    console.log('[INFO] Attempting to connect to Redis...');
    try {
      await connectRedis();
      console.log('[INFO] Redis connected successfully');
      logger.info('Redis connected successfully');
      
      console.log('[INFO] Initializing Redis-based services...');
      try {
        const redisService = require('./core/services/redis.service');
        const queueService = require('./core/services/queue.service');
        const redisMonitoring = require('./core/monitoring/redis.monitoring');
        const realtimeService = require('./core/services/realtime.service.simple');
        const notificationService = require('./core/services/notification.service.simple');
        const moderationService = require('./core/services/moderation.service');
        
        await redisService.initialize();
        await queueService.initialize();
        await redisMonitoring.initialize();
        await realtimeService.initialize();
        await notificationService.initialize();
        await moderationService.initialize();
        console.log('[INFO] All Redis-based services initialized successfully');
        logger.info('All Redis-based services initialized successfully');
      } catch (serviceError) {
        console.error('[ERROR] Service initialization failed:', serviceError.message);
        logger.error('Service initialization failed:', {
          error: serviceError.message,
          stack: serviceError.stack
        });
        throw serviceError;
      }
    } catch (redisError) {
      console.error('[ERROR] Redis connection failed:');
      console.error('[ERROR]   Error:', redisError.message);
      console.error('[ERROR]   Code:', redisError.code);
      console.error('[ERROR]   URL:', config.redis.url);
      logger.error('Redis connection failed:', {
        error: redisError.message,
        code: redisError.code,
        url: config.redis.url,
        stack: redisError.stack
      });
      throw redisError;
    }

    // Start server
    console.log('[INFO] Starting HTTP server...');
    const server = app.listen(config.server.port, config.server.host, async () => {
      console.log('[INFO] Server started successfully!');
      console.log(`[INFO]   URL: http://${config.server.host}:${config.server.port}`);
      console.log(`[INFO]   Health: http://${config.server.host}:${config.server.port}/health`);
      console.log(`[INFO]   API: http://${config.server.host}:${config.server.port}/api/v1`);
      logger.info(`Server running on http://${config.server.host}:${config.server.port} in ${config.server.env} mode`);
    });

    // 🛑 3. Initialize Socket.IO
    console.log('[INFO] Initializing Socket.io...');
    const io = new Server(server, {
        cors: {
            origin: "*", // Yahan 'http://localhost:5173' bhi daal sakte hain
            methods: ["GET", "POST"]
        }
    });

    // 🛑 4. Set up Socket.IO logic
    
    // Import live.service YAHAN, database connect hone ke baad
    const liveService = require('./modules/live/services/live.service'); 
    
    const userSockets = {}; // Maps Agora UID -> Socket ID
    const socketRooms = {}; // Maps Socket ID -> Room Name

    // Controllers ko in cheezon ki zaroorat hogi
    app.set('userSockets', userSockets);
    app.set('socketio', io);

    // Real-time update bhej ne ke liye helper function
    const emitRoomUpdate = async (channelName, updatedSpace) => {
        try {
            let spaceToEmit = updatedSpace;
            if (!spaceToEmit) {
                spaceToEmit = await liveService.getSpaceDetails(channelName);
            }
            
            if (spaceToEmit) {
                io.to(channelName).emit('roomStateUpdate', spaceToEmit);
                console.log(`[Socket Emit] Sent roomStateUpdate to ${channelName}`);
            } else {
                console.warn(`[Socket Emit] Could not find space ${channelName} to emit update.`);
            }
        } catch (error) {
            console.error(`[Socket Emit] Error emitting room update: ${error.message}`);
        }
    };

    app.set('emitRoomUpdate', emitRoomUpdate);

    // 🛑 5. Socket.IO Authentication Middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                console.warn(`[Socket Auth] Failed: Token not provided for socket ${socket.id}`);
                return next(new Error('Authentication error: Token not provided'));
            }
            
            // Apne config se JWT secret istemal karein
            const decoded = jwt.verify(token, config.jwt.secret); 
            
            // User ID ko socket par save karein
            socket.user = { _id: decoded.id }; 
            
            next();
        } catch (err) {
            console.error(`[Socket Auth] Error for socket ${socket.id}: ${err.message}`);
            next(new Error('Authentication error: Invalid token'));
        }
    });


    io.on('connection', (socket) => {
        console.log(`[Socket] User connected: ${socket.id} (User ID: ${socket.user?._id})`);

        // Frontend se 'registerUser' event suno
        socket.on('registerUser', ({ uid, channelName }) => {
            const userId = String(uid);
            console.log(`[Socket Register] User ${userId} (${socket.id}) joining room ${channelName}`);
            
            userSockets[userId] = socket.id;
            socketRooms[socket.id] = channelName;
            
            socket.join(channelName);

            emitRoomUpdate(channelName, null); 
        });

        // Chat message suno
        socket.on('chatMessage', ({ channelName, message, userName }) => {
            const msg = {
                id: Date.now(),
                user: userName || 'Anonymous',
                text: message,
                type: 'message'
            };
            io.to(channelName).emit('newChatMessage', msg);
        });

        // Disconnect suno
        socket.on('disconnect', () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
            
            const roomName = socketRooms[socket.id];
            let uidToCleanup = null;

            for (const uid in userSockets) {
                if (userSockets[uid] === socket.id) {
                    uidToCleanup = uid;
                    delete userSockets[uid];
                    break;
                }
            }
            delete socketRooms[socket.id];

            if (roomName && uidToCleanup) {
                console.log(`[Socket Cleanup] User ${uidToCleanup} removed from room ${roomName}`);
                emitRoomUpdate(roomName, null);
            }
        });
    });

    console.log('[INFO] Socket.io initialized and listening.');
    logger.info('Socket.io initialized and listening.');
    // 🛑 END OF NEW SOCKET CODE

    // Handle server errors
    server.on('error', (error) => {
      console.error('[ERROR] Server error:', error.message);
      logger.error('Server error:', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[INFO] SIGTERM received. Shutting down gracefully...');
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        // Close Redis connections
        const { disconnectRedis } = require('./config/redis');
        disconnectRedis();
        // Close Redis-based services
        const redisService = require('./core/services/redis.service');
        const queueService = require('./core/services/queue.service');
        const redisMonitoring = require('./core/monitoring/redis.monitoring');
        const realtimeService = require('./core/services/realtime.service.simple');
        const notificationService = require('./core/services/notification.service.simple');
        const moderationService = require('./core/services/moderation.service');

        redisService.close();
        queueService.closeAllQueues();
        queueService.stopAllWorkers();
        redisMonitoring.close();
        realtimeService.close();
        notificationService.close();
            moderationService.close();

        // 🛑 ADD: Close Socket.IO server
        io.close(); 
        console.log('[INFO] Process terminated');
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('[INFO] SIGINT received. Shutting down gracefully...');
      logger.info('SIGINT received. Shutting down gracefully...');
      server.close(() => {
        // Close Redis connections
        const { disconnectRedis } = require('./config/redis');
        disconnectRedis();
        // Close Redis-based services
        const redisService = require('./core/services/redis.service');
        const queueService = require('./core/services/queue.service');
        const redisMonitoring = require('./core/monitoring/redis.monitoring');
        const realtimeService = require('./core/services/realtime.service.simple');
        const notificationService = require('./core/services/notification.service.simple');
         const moderationService = require('./core/services/moderation.service');

        redisService.close();
        queueService.closeAllQueues();
        queueService.stopAllWorkers();
        redisMonitoring.close();
        realtimeService.close();
        notificationService.close();
            moderationService.close();

        // 🛑 ADD: Close Socket.IO server
        io.close();
        console.log('[INFO] Process terminated');
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('[ERROR] Failed to start server:');
    console.error('[ERROR]   Error:', error.message);
    console.error('[ERROR]   Name:', error.name);
    console.error('[ERROR]   Code:', error.code);
    console.error('[ERROR]   Stack:', error.stack);
    
    logger.error('Failed to start server:', {
      error: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    
    console.log('[INFO] Exiting process...');
    process.exit(1);
  }
}

startServer();

