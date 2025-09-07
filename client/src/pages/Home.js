import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const createRoom = () => {
    const newRoomId = uuidv4();
    if (username.trim()) {
      navigate(`/workspace/${newRoomId}?username=${encodeURIComponent(username)}`);
    } else {
      alert('Please enter a username');
    }
  };

  const createRoomAsGuest = () => {
    const newRoomId = uuidv4();
    const guestName = `Guest_${Math.random().toString(36).substring(2, 8)}`;
    navigate(`/workspace/${newRoomId}?username=${encodeURIComponent(guestName)}&isGuest=true`);
  };

  const joinRoom = () => {
    if (roomId.trim() && username.trim()) {
      navigate(`/workspace/${roomId}?username=${encodeURIComponent(username)}`);
    } else {
      alert('Please enter both room ID and username');
    }
  };

  const joinRoomAsGuest = () => {
    if (roomId.trim()) {
      const guestName = `Guest_${Math.random().toString(36).substring(2, 8)}`;
      navigate(`/workspace/${roomId}?username=${encodeURIComponent(guestName)}&isGuest=true`);
    } else {
      alert('Please enter a room ID');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Realtime Workspace
        </h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
            />
          </div>
          
          <button
            onClick={createRoom}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200"
          >
            Create New Room
          </button>
          
          <button
            onClick={createRoomAsGuest}
            className="w-full bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 transition duration-200"
          >
            Create Room as Guest
          </button>
          
          <div className="text-center text-gray-500">or</div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room ID
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter room ID to join"
            />
          </div>
          
          <button
            onClick={joinRoom}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-200"
          >
            Join Existing Room
          </button>
          
          <button
            onClick={joinRoomAsGuest}
            className="w-full bg-emerald-500 text-white py-2 px-4 rounded-md hover:bg-emerald-600 transition duration-200"
          >
            Join as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
