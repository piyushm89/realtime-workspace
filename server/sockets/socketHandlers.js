const { v4: uuidv4 } = require('uuid');
const { saveDrawingAction, saveChatMessage, getWorkspaceData, updateWorkspaceName } = require('../controllers/workspaceController');

// Store active rooms and users
const rooms = new Map();
const users = new Map();
const typingUsers = new Map(); // Track typing users by room

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Handle user joining a room
    socket.on('join-room', (roomId, userData) => {
      socket.join(roomId);
      
      // Store user data with additional properties
      users.set(socket.id, {
        id: socket.id,
        roomId,
        joinedAt: new Date().toISOString(),
        isDrawing: false,
        lastActivity: new Date().toISOString(),
        ...userData
      });
      
      // Update room data
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          users: new Set(),
          createdAt: new Date(),
          name: `Workspace ${roomId.slice(-6).toUpperCase()}`,
          lastActivity: new Date()
        });
      }
      
      const room = rooms.get(roomId);
      room.users.add(socket.id);
      room.lastActivity = new Date();
      
      // Notify others in the room with enhanced user data
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        username: userData.username || 'Anonymous',
        ...userData
      });
      
      // Send current room state to the new user with workspace info
      const roomUsers = Array.from(room.users).map(userId => users.get(userId));
      socket.emit('room-state', {
        roomId,
        users: roomUsers,
        workspaceName: room.name
      });
      
      console.log(`User ${userData.username || socket.id} joined room ${roomId}`);
    });

    // Handle workspace name updates
    socket.on('update-workspace-name', async (data) => {
      const user = users.get(socket.id);
      if (user && data.roomId && data.name) {
        try {
          // Update in memory
          const room = rooms.get(data.roomId);
          if (room) {
            room.name = data.name;
          }
          
          // Update in database
          await updateWorkspaceName(data.roomId, data.name);
          
          // Notify all users in the room
          io.to(data.roomId).emit('workspace-name-updated', {
            name: data.name
          });
          
          console.log(`Workspace ${data.roomId} renamed to: ${data.name}`);
        } catch (error) {
          console.error('Error updating workspace name:', error);
        }
      }
    });

    // Handle drawing events with enhanced data
    socket.on('draw-event', (data) => {
      const user = users.get(socket.id);
      if (user) {
        // Update user drawing status
        user.isDrawing = data.type === 'start' || data.type === 'draw';
        user.lastActivity = new Date().toISOString();
        
        const drawingData = {
          ...data,
          userId: socket.id,
          username: user.username,
          timestamp: new Date().toISOString()
        };
        
        socket.to(user.roomId).emit('draw-event', drawingData);
        
        // Update room activity
        const room = rooms.get(user.roomId);
        if (room) {
          room.lastActivity = new Date();
        }
        
        // Save to database
        saveDrawingAction(user.roomId, drawingData);
        
        // Notify users of drawing status change
        const roomUsers = Array.from(rooms.get(user.roomId).users).map(userId => users.get(userId));
        socket.to(user.roomId).emit('user-list-update', roomUsers);
      }
    });

    // Handle enhanced chat messages
    socket.on('chat-message', (data) => {
      const user = users.get(socket.id);
      if (user) {
        const messageData = {
          ...data,
          userId: socket.id,
          username: user.username || 'Anonymous',
          timestamp: new Date().toISOString()
        };
        
        // Broadcast to all users in room (including sender for confirmation)
        io.to(user.roomId).emit('chat-message', messageData);
        
        // Update user activity
        user.lastActivity = new Date().toISOString();
        
        // Save to database
        saveChatMessage(user.roomId, messageData);
      }
    });

    // Handle typing indicators
    socket.on('user-typing', (data) => {
      const user = users.get(socket.id);
      if (user && data.roomId) {
        if (!typingUsers.has(data.roomId)) {
          typingUsers.set(data.roomId, new Set());
        }
        
        const roomTypingUsers = typingUsers.get(data.roomId);
        
        if (data.isTyping) {
          roomTypingUsers.add(socket.id);
        } else {
          roomTypingUsers.delete(socket.id);
        }
        
        // Broadcast typing status to other users
        socket.to(data.roomId).emit('user-typing', {
          username: data.username,
          isTyping: data.isTyping
        });
      }
    });

    // Handle chat history requests
    socket.on('get-chat-history', async (data) => {
      try {
        const workspaceData = await getWorkspaceData(data.roomId);
        if (workspaceData && workspaceData.chatHistory) {
          socket.emit('chat-history', workspaceData.chatHistory);
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    });
    
    // Handle cursor movement with user info
    socket.on('cursor-move', (data) => {
      const user = users.get(socket.id);
      if (user) {
        socket.to(user.roomId).emit('cursor-move', {
          ...data,
          userId: socket.id,
          username: user.username,
          color: user.cursorColor || '#000000'
        });
      }
    });

    // Handle canvas updates
    socket.on('canvas-update', (data) => {
      const user = users.get(socket.id);
      if (user) {
        socket.to(user.roomId).emit('canvas-update', {
          ...data,
          userId: socket.id
        });
        
        // Save significant canvas states
        if (data.elements && data.elements.length > 0) {
          saveDrawingAction(user.roomId, {
            type: 'canvas-state',
            elements: data.elements,
            userId: socket.id,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
    
    // Handle WebRTC signaling for video calls
    socket.on('webrtc-offer', (data) => {
      socket.to(data.targetId).emit('webrtc-offer', {
        offer: data.offer,
        senderId: socket.id,
        senderName: users.get(socket.id)?.username
      });
    });
    
    socket.on('webrtc-answer', (data) => {
      socket.to(data.targetId).emit('webrtc-answer', {
        answer: data.answer,
        senderId: socket.id,
        senderName: users.get(socket.id)?.username
      });
    });
    
    socket.on('webrtc-ice-candidate', (data) => {
      socket.to(data.targetId).emit('webrtc-ice-candidate', {
        candidate: data.candidate,
        senderId: socket.id
      });
    });

    // Handle video call room events
    socket.on('join-video-call', (data) => {
      const user = users.get(socket.id);
      if (user) {
        socket.to(user.roomId).emit('user-joined-video', {
          userId: socket.id,
          username: user.username
        });
      }
    });

    socket.on('leave-video-call', (data) => {
      const user = users.get(socket.id);
      if (user) {
        socket.to(user.roomId).emit('user-left-video', {
          userId: socket.id,
          username: user.username
        });
      }
    });

    // Handle user activity updates
    socket.on('user-activity', (data) => {
      const user = users.get(socket.id);
      if (user) {
        user.lastActivity = new Date().toISOString();
        
        // Optionally broadcast activity status
        socket.to(user.roomId).emit('user-activity-update', {
          userId: socket.id,
          activity: data.activity
        });
      }
    });
    
    // Handle disconnect with enhanced cleanup
    socket.on('disconnect', () => {
      const user = users.get(socket.id);
      if (user) {
        const room = rooms.get(user.roomId);
        if (room) {
          room.users.delete(socket.id);
          
          // Clean up typing status
          const roomTypingUsers = typingUsers.get(user.roomId);
          if (roomTypingUsers) {
            roomTypingUsers.delete(socket.id);
          }
          
          // Notify other users
          socket.to(user.roomId).emit('user-left', {
            userId: socket.id,
            username: user.username
          });
          
          // Update user list for remaining users
          const remainingUsers = Array.from(room.users).map(userId => users.get(userId));
          socket.to(user.roomId).emit('user-list-update', remainingUsers);
          
          // Clean up empty rooms
          if (room.users.size === 0) {
            rooms.delete(user.roomId);
            typingUsers.delete(user.roomId);
            console.log(`Room ${user.roomId} cleaned up (empty)`);
          }
        }
        users.delete(socket.id);
      }
      console.log(`User disconnected: ${socket.id}`);
    });

    // Handle manual room leave
    socket.on('leave-room', (data) => {
      const user = users.get(socket.id);
      if (user && data.roomId) {
        socket.leave(data.roomId);
        
        const room = rooms.get(data.roomId);
        if (room) {
          room.users.delete(socket.id);
          
          socket.to(data.roomId).emit('user-left', {
            userId: socket.id,
            username: user.username
          });
        }
      }
    });

    // Periodic cleanup of inactive users (every 5 minutes)
    setInterval(() => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      users.forEach((user, socketId) => {
        const lastActivity = new Date(user.lastActivity);
        if (lastActivity < fiveMinutesAgo) {
          console.log(`Cleaning up inactive user: ${socketId}`);
          // Force disconnect inactive users
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect(true);
          }
        }
      });
    }, 5 * 60 * 1000); // Run every 5 minutes
  });

  // Periodic room statistics (optional)
  setInterval(() => {
    console.log(`Active rooms: ${rooms.size}, Active users: ${users.size}`);
    rooms.forEach((room, roomId) => {
      console.log(`Room ${roomId}: ${room.users.size} users`);
    });
  }, 10 * 60 * 1000); // Run every 10 minutes
};
