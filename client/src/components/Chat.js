import React, { useState, useEffect, useRef } from 'react';

const Chat = ({ socket, roomId, username }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    // Listen for incoming messages
    socket.on('chat-message', (data) => {
      setMessages(prev => [...prev, {
        id: `${data.userId}-${Date.now()}`,
        username: data.username,
        message: data.message,
        timestamp: data.timestamp,
        userId: data.userId,
        type: 'message'
      }]);
    });

    // Listen for user join/leave notifications
    socket.on('user-joined', (data) => {
      setMessages(prev => [...prev, {
        id: `join-${Date.now()}`,
        type: 'notification',
        message: `${data.username} joined the workspace`,
        timestamp: new Date().toISOString()
      }]);
    });

    socket.on('user-left', (data) => {
      setMessages(prev => [...prev, {
        id: `leave-${Date.now()}`,
        type: 'notification',
        message: `${data.username} left the workspace`,
        timestamp: new Date().toISOString()
      }]);
    });

    // Listen for typing indicators
    socket.on('user-typing', (data) => {
      if (data.username !== username) {
        setTypingUsers(prev => {
          const filtered = prev.filter(user => user !== data.username);
          return data.isTyping ? [...filtered, data.username] : filtered;
        });
      }
    });

    // Load chat history if available
    socket.emit('get-chat-history', { roomId });
    socket.on('chat-history', (history) => {
      setMessages(history.map((msg, index) => ({
        id: `history-${index}`,
        ...msg
      })));
    });

    return () => {
      socket.off('chat-message');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('user-typing');
      socket.off('chat-history');
    };
  }, [socket, roomId, username]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      roomId,
      username,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      userId: socket.id
    };

    // Send to server
    socket.emit('chat-message', messageData);
    setNewMessage('');
    
    // Stop typing
    handleStopTyping();
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicator
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('user-typing', { roomId, username, isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      socket.emit('user-typing', { roomId, username, isTyping: false });
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRandomColor = (name) => {
    const colors = [
      'text-red-600', 'text-blue-600', 'text-green-600', 'text-yellow-600',
      'text-purple-600', 'text-pink-600', 'text-indigo-600', 'text-gray-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">💬</div>
            <p className="text-gray-500 text-sm mb-2">No messages yet</p>
            <p className="text-gray-400 text-xs">Start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center mb-4">
                <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                  {date}
                </div>
              </div>

              {/* Messages for this date */}
              <div className="space-y-3">
                {dateMessages.map((msg, index) => {
                  const prevMsg = index > 0 ? dateMessages[index - 1] : null;
                  const showUsername = !prevMsg || prevMsg.username !== msg.username || prevMsg.type !== msg.type;
                  const isCurrentUser = msg.username === username;

                  if (msg.type === 'notification') {
                    return (
                      <div key={msg.id} className="text-center">
                        <div className="inline-flex items-center bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                          <span className="mr-1">ℹ️</span>
                          {msg.message}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-1' : 'order-2'}`}>
                        {showUsername && !isCurrentUser && (
                          <div className={`text-xs font-medium mb-1 ${getRandomColor(msg.username)}`}>
                            {msg.username}
                          </div>
                        )}
                        <div className={`px-4 py-2 rounded-lg ${
                          isCurrentUser
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <p className="text-sm break-words">{msg.message}</p>
                        </div>
                        <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>
              {typingUsers.length === 1 
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.slice(0, -1).join(', ')} and ${typingUsers[typingUsers.length - 1]} are typing...`
              }
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onBlur={handleStopTyping}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              maxLength={1000}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <span>Send</span>
            <span>📤</span>
          </button>
        </form>
        
        {/* Character count */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div>
            {newMessage.length > 0 && (
              <span className={newMessage.length > 900 ? 'text-red-500' : ''}>
                {newMessage.length}/1000
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span>💡 Tip: Use @username to mention someone</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
