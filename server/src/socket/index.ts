import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware for socket connections
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new Error('Server configuration error'));
      }

      const decoded = jwt.verify(token, jwtSecret) as any;
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      if (user.suspended?.reason) {
        return next(new Error('Account suspended'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.username} connected (${socket.id})`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle alumet events
    socket.on('alumet:join', (alumetId: string) => {
      socket.join(`alumet:${alumetId}`);
      socket.to(`alumet:${alumetId}`).emit('alumet:participant_joined', {
        alumetId,
        participant: { userId: socket.userId, username: socket.user?.username },
        username: socket.user?.username
      });
    });

    socket.on('alumet:leave', (alumetId: string) => {
      socket.leave(`alumet:${alumetId}`);
      socket.to(`alumet:${alumetId}`).emit('alumet:participant_left', {
        alumetId,
        userId: socket.userId,
        username: socket.user?.username
      });
    });

    socket.on('alumet:update', (data: { alumetId: string; update: any }) => {
      socket.to(`alumet:${data.alumetId}`).emit('alumet:update', {
        alumetId: data.alumetId,
        update: data.update
      });
    });

    // Handle message events
    socket.on('message:send', async (data: { conversationId: string; content: string; type?: string }) => {
      try {
        // TODO: Save message to database and get full message object
        const message = {
          _id: `temp_${Date.now()}`,
          conversationId: data.conversationId,
          sender: socket.userId,
          senderInfo: {
            username: socket.user?.username,
            name: socket.user?.name,
            lastname: socket.user?.lastname,
            icon: socket.user?.icon
          },
          content: data.content,
          type: data.type || 'text',
          timestamp: new Date(),
        };

        // Emit to conversation participants
        io.to(`conversation:${data.conversationId}`).emit('message:receive', message);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('message:typing', (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${data.conversationId}`).emit('message:typing', {
        conversationId: data.conversationId,
        userId: socket.userId,
        isTyping: data.isTyping,
        username: socket.user?.username
      });
    });

    socket.on('message:reaction', (data: { messageId: string; emoji: string; action: 'add' | 'remove' }) => {
      // TODO: Update message reaction in database
      socket.broadcast.emit('message:reaction', {
        messageId: data.messageId,
        emoji: data.emoji,
        action: data.action,
        userId: socket.userId
      });
    });

    // Handle collaboration events
    socket.on('collaboration:cursor', (data: { x: number; y: number; alumetId: string }) => {
      socket.to(`alumet:${data.alumetId}`).emit('collaboration:cursor', {
        x: data.x,
        y: data.y,
        userId: socket.userId,
        alumetId: data.alumetId,
        username: socket.user?.username
      });
    });

    socket.on('collaboration:edit', (data: { type: string; data: any; alumetId: string }) => {
      socket.to(`alumet:${data.alumetId}`).emit('collaboration:edit', {
        type: data.type,
        data: data.data,
        alumetId: data.alumetId,
        userId: socket.userId
      });
    });

    socket.on('collaboration:selection', (data: { selection: any; alumetId: string }) => {
      socket.to(`alumet:${data.alumetId}`).emit('collaboration:selection', {
        selection: data.selection,
        userId: socket.userId,
        alumetId: data.alumetId
      });
    });

    // Handle notification events
    socket.on('notification:read', (notificationId: string) => {
      // TODO: Mark notification as read in database
      socket.emit('notification:read', notificationId);
    });

    // Handle presence events
    socket.on('presence:update', (status: 'online' | 'offline' | 'away') => {
      socket.broadcast.emit('presence:update', {
        userId: socket.userId,
        status,
        lastSeen: status === 'offline' ? new Date() : undefined
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user?.username} disconnected (${socket.id}): ${reason}`);
      
      // Notify others that user went offline
      socket.broadcast.emit('presence:update', {
        userId: socket.userId,
        status: 'offline',
        lastSeen: new Date()
      });
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user?.username}:`, error);
    });

    // Send authentication confirmation
    socket.emit('authenticated', { userId: socket.userId });
  });

  // Global error handler
  io.engine.on('connection_error', (err) => {
    console.error('Socket.IO connection error:', err.req);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    console.error('Error context:', err.context);
  });
};