import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { chatService } from './chat.service';

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Must match the config from app.ts or be restricted to specific frontend URLs
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['x-auth-token'];
    if (!token) {
      return next(new Error('Authentication error'));
    }
    jwt.verify(token as string, config.jwt.secret, (err: any, decoded: any) => {
      if (err) return next(new Error('Authentication error'));
      socket.data.user = decoded; // Contains id, role
      next();
    });
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user.id;
    console.log(`User connected to chat: ${userId}`);

    // Join a specific chat room
    socket.on('joinRoom', async (chatSessionId: string) => {
      try {
        // Validation: Ensure the user is a participant
        await chatService.getMessages(userId, chatSessionId); 
        socket.join(chatSessionId);
        console.log(`User ${userId} joined room ${chatSessionId}`);
      } catch (err) {
        socket.emit('error', 'Failed to join room or not a participant');
      }
    });

    // Send a message
    socket.on('sendMessage', async (data: { chatSessionId: string; content: string }) => {
      try {
        const { chatSessionId, content } = data;
        const msg = await chatService.saveMessage(chatSessionId, userId, content);
        
        // Broadcast the message to the room (including the sender itself for immediate UI update confirmation)
        io.to(chatSessionId).emit('newMessage', msg);
      } catch (err) {
        socket.emit('error', 'Error sending message');
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected from chat: ${userId}`);
    });
  });

  return io;
};
