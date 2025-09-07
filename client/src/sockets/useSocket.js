import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useSocket = (roomId, userData) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('join-room', roomId, userData);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [roomId, userData]);

  return socket;
};
