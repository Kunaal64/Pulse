import jwt from 'jsonwebtoken';
import config from '../config/index.js';

// Store connected sockets
const connectedUsers = new Map();

/**
 * Initialize Socket.io handlers
 * @param {Server} io - Socket.io server instance
 */
export const initializeSocket = (io) => {
  // Authentication middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.userId}`);
    
    // Store socket connection
    connectedUsers.set(socket.userId, socket);
    
    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    
    // Emit connection success
    socket.emit('connected', {
      message: 'Connected to real-time updates',
      userId: socket.userId
    });

    // Handle subscribing to video updates
    socket.on('subscribe:video', (videoId) => {
      socket.join(`video:${videoId}`);
      console.log(`User ${socket.userId} subscribed to video ${videoId}`);
    });

    // Handle unsubscribing from video updates
    socket.on('unsubscribe:video', (videoId) => {
      socket.leave(`video:${videoId}`);
      console.log(`User ${socket.userId} unsubscribed from video ${videoId}`);
    });

    // Handle ping for connection health check
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`❌ User disconnected: ${socket.userId} (${reason})`);
      connectedUsers.delete(socket.userId);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  console.log('✅ Socket.io initialized');
  
  return io;
};

/**
 * Get socket emitter function for a specific user
 * @param {string} userId - User ID to emit to
 * @returns {Function} - Emitter function
 */
export const getSocketEmitter = (userId) => {
  return (event, data) => {
    const socket = connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  };
};

/**
 * Emit to a specific user
 * @param {Server} io - Socket.io server instance
 * @param {string} userId - User ID to emit to
 * @param {string} event - Event name
 * @param {object} data - Data to emit
 */
export const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit to all subscribers of a video
 * @param {Server} io - Socket.io server instance
 * @param {string} videoId - Video ID
 * @param {string} event - Event name
 * @param {object} data - Data to emit
 */
export const emitToVideoSubscribers = (io, videoId, event, data) => {
  io.to(`video:${videoId}`).emit(event, data);
};

/**
 * Broadcast to all connected users in an organization
 * @param {Server} io - Socket.io server instance
 * @param {string} organization - Organization name
 * @param {string} event - Event name
 * @param {object} data - Data to emit
 */
export const broadcastToOrganization = (io, organization, event, data) => {
  io.to(`org:${organization}`).emit(event, data);
};

/**
 * Get number of connected users
 */
export const getConnectedUsersCount = () => {
  return connectedUsers.size;
};

/**
 * Check if user is connected
 */
export const isUserConnected = (userId) => {
  return connectedUsers.has(userId);
};

export default {
  initializeSocket,
  getSocketEmitter,
  emitToUser,
  emitToVideoSubscribers,
  broadcastToOrganization,
  getConnectedUsersCount,
  isUserConnected
};
