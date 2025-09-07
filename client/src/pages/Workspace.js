import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ExcalidrawCanvas from '../components/ExcalidrawCanvas';
import UserList from '../components/UserList';
import VideoCall from '../components/VideoCall';
import Chat from '../components/Chat';
import ShareWorkspace from '../components/ShareWorkspace';
import TopNavigation from '../components/TopNavigation';
import { useSocket } from '../sockets/useSocket';
import { useWorkspace } from '../sockets/useWorkspace';

const Workspace = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const username = searchParams.get('username') || 'Guest';
  
  const [users, setUsers] = useState([]);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  
  const socket = useSocket(roomId, { username });
  const { workspaceData, loading: workspaceLoading } = useWorkspace(roomId);

  useEffect(() => {
    if (!socket) return;

    // Handle room state updates
    socket.on('room-state', (data) => {
      setUsers(data.users);
      if (data.workspaceName) {
        setWorkspaceName(data.workspaceName);
      }
    });

    socket.on('user-joined', (data) => {
      setUsers(prev => [...prev, data]);
    });

    socket.on('user-left', (data) => {
      setUsers(prev => prev.filter(user => user.id !== data.userId));
    });

    socket.on('workspace-name-updated', (data) => {
      setWorkspaceName(data.name);
    });

    return () => {
      socket.off('room-state');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('workspace-name-updated');
    };
  }, [socket]);

  useEffect(() => {
    // Set workspace name from workspace data or generate one
    if (workspaceData?.name) {
      setWorkspaceName(workspaceData.name);
    } else if (roomId) {
      setWorkspaceName(`Workspace ${roomId.slice(-6).toUpperCase()}`);
    }
  }, [workspaceData, roomId]);

  const toggleVideoCall = () => {
    setIsVideoCallActive(!isVideoCallActive);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleShareWorkspace = () => {
    setIsShareModalOpen(true);
  };

  const updateWorkspaceName = (newName) => {
    setWorkspaceName(newName);
    if (socket) {
      socket.emit('update-workspace-name', { roomId, name: newName });
    }
  };

  if (!socket || workspaceLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation */}
      <TopNavigation
        workspaceName={workspaceName}
        onUpdateWorkspaceName={updateWorkspaceName}
        username={username}
        onShareWorkspace={handleShareWorkspace}
        onToggleVideoCall={toggleVideoCall}
        isVideoCallActive={isVideoCallActive}
        onToggleChat={toggleChat}
        isChatOpen={isChatOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Online Users */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Online Users ({users.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <UserList users={users} currentUser={username} />
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          <ExcalidrawCanvas socket={socket} workspaceData={workspaceData} />
        </div>

        {/* Right Sidebar - Chat */}
        {isChatOpen && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Chat</h3>
              <button
                onClick={toggleChat}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1">
              <Chat socket={socket} roomId={roomId} username={username} />
            </div>
          </div>
        )}
      </div>

      {/* Video Call Overlay */}
      {isVideoCallActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-4/5 h-4/5 max-w-6xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Video Call</h3>
              <button
                onClick={toggleVideoCall}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4 h-full">
              <VideoCall
                socket={socket}
                roomId={roomId}
                username={username}
                onClose={toggleVideoCall}
              />
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareWorkspace
          roomId={roomId}
          workspaceName={workspaceName}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Workspace;
