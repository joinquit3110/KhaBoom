// =============================================================================
// WebSocket Server for Real-time Updates
// (c) Kha-Boom!
// =============================================================================

import {Server} from 'socket.io';
import {Server as HTTPServer} from 'http';
import {User} from './models/user';

interface SocketData {
  userId?: string;
  username?: string;
}

export function setupWebSocket(server: HTTPServer) {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://localhost:8080'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        // Verify token and get user
        const user = await User.findById(token);
        if (user) {
          (socket.data as SocketData).userId = user.id;
          (socket.data as SocketData).username = user.fullName;
        }
      } catch (error) {
        console.error('Socket auth error:', error);
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log('New WebSocket connection:', socket.id);
    
    // Join user to their personal room for notifications
    const userId = (socket.data as SocketData).userId;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Add real-time event handlers here as needed
    // For example: course progress updates, notifications, etc.

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected:', socket.id);
    });
  });

  return io;
}
