import React, { useState } from 'react';

const TopNavigation = ({
  workspaceName,
  onUpdateWorkspaceName,
  username,
  onShareWorkspace,
  onToggleVideoCall,
  isVideoCallActive,
  onToggleChat,
  isChatOpen
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(workspaceName);

  const handleNameEdit = () => {
    setIsEditingName(true);
    setEditedName(workspaceName);
  };

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== workspaceName) {
      onUpdateWorkspaceName(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setEditedName(workspaceName);
    setIsEditingName(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Workspace Name */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CW</span>
              </div>
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={handleNameSave}
                    className="text-xl font-semibold text-gray-900 bg-gray-50 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleNameSave}
                    className="text-green-600 hover:text-green-700"
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleNameCancel}
                    className="text-red-600 hover:text-red-700"
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {workspaceName || 'Untitled Workspace'}
                  </h1>
                  <button
                    onClick={handleNameEdit}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Edit workspace name"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Logged in as: <span className="font-medium">{username}</span>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Chat Toggle */}
            <button
              onClick={onToggleChat}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isChatOpen
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
              title={isChatOpen ? 'Hide Chat' : 'Show Chat'}
            >
              <span>💬</span>
              <span>Chat</span>
            </button>

            {/* Share Button */}
            <button
              onClick={onShareWorkspace}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
              title="Share workspace"
            >
              <span>🔗</span>
              <span>Share</span>
            </button>

            {/* Video Call Button */}
            <button
              onClick={onToggleVideoCall}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isVideoCallActive
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              title={isVideoCallActive ? 'End Video Call' : 'Start Video Call'}
            >
              <span>{isVideoCallActive ? '📹' : '📞'}</span>
              <span>{isVideoCallActive ? 'End Call' : 'Video Call'}</span>
            </button>

            {/* User Avatar */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;
