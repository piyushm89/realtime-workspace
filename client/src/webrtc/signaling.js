/**
 * WebRTC Signaling Server
 * Handles peer-to-peer connection establishment for video calls
 */

class WebRTCSignaling {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> Set of socketIds
    
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`WebRTC: User connected ${socket.id}`);

      // Handle joining WebRTC room
      socket.on('webrtc-join-room', (roomId) => {
        socket.join(roomId);
        
        if (!this.rooms.has(roomId)) {
          this.rooms.set(roomId, new Set());
        }
        
        const room = this.rooms.get(roomId);
        
        // Notify existing users about new user
        room.forEach(existingSocketId => {
          socket.to(existingSocketId).emit('webrtc-user-joined', {
            userId: socket.id
          });
        });
        
        room.add(socket.id);
        
        // Send existing users to new user
        const existingUsers = Array.from(room).filter(id => id !== socket.id);
        socket.emit('webrtc-existing-users', existingUsers);
      });

      // Handle offer
      socket.on('webrtc-offer', ({ targetId, offer }) => {
        socket.to(targetId).emit('webrtc-offer', {
          senderId: socket.id,
          offer
        });
      });

      // Handle answer
      socket.on('webrtc-answer', ({ targetId, answer }) => {
        socket.to(targetId).emit('webrtc-answer', {
          senderId: socket.id,
          answer
        });
      });

      // Handle ICE candidates
      socket.on('webrtc-ice-candidate', ({ targetId, candidate }) => {
        socket.to(targetId).emit('webrtc-ice-candidate', {
          senderId: socket.id,
          candidate
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`WebRTC: User disconnected ${socket.id}`);
        
        // Remove from all rooms and notify other users
        this.rooms.forEach((room, roomId) => {
          if (room.has(socket.id)) {
            room.delete(socket.id);
            
            // Notify other users in the room
            room.forEach(otherSocketId => {
              socket.to(otherSocketId).emit('webrtc-user-left', {
                userId: socket.id
              });
            });
            
            // Clean up empty rooms
            if (room.size === 0) {
              this.rooms.delete(roomId);
            }
          }
        });
      });
    });
  }
}

module.exports = WebRTCSignaling;
