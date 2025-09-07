import React from 'react';

const UserList = ({ users, currentUser }) => {
  const getRandomColor = (name) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatJoinTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const joinTime = new Date(timestamp);
    const diff = Math.floor((now - joinTime) / 1000 / 60); // minutes
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="p-4">
      <div className="space-y-3">
        {users.map((user) => {
          const isCurrentUser = user.username === currentUser || user.id === currentUser;
          const username = user.username || user.name || 'Anonymous';
          const avatarColor = getRandomColor(username);
          
          return (
            <div
              key={user.id}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isCurrentUser
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {/* User Avatar */}
              <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-sm">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {username}
                    {isCurrentUser && (
                      <span className="text-blue-600 font-normal"> (You)</span>
                    )}
                  </p>
                  {/* Online Status */}
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title="Online"></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 truncate">
                    {formatJoinTime(user.joinedAt)}
                  </p>
                  {user.isDrawing && (
                    <span className="text-xs text-blue-600 font-medium">Drawing...</span>
                  )}
                </div>
              </div>
              
              {/* User Actions */}
              {!isCurrentUser && (
                <div className="flex space-x-1">
                  <button
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Send message"
                  >
                    💬
                  </button>
                  <button
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Follow cursor"
                  >
                    👁️
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {users.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-2">👥</div>
          <p className="text-sm text-gray-500">No users online</p>
          <p className="text-xs text-gray-400 mt-1">Share the workspace to invite others</p>
        </div>
      )}
      
      {/* Online Status Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Total online: {users.length}</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>All online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserList;
