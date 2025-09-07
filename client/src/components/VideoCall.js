import React, { useRef, useEffect, useState } from 'react';
import { useWebRTC } from '../webrtc/useWebRTC';

const VideoCall = ({ socket, users }) => {
  const localVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  const { remoteStreams, startCall, endCall } = useWebRTC(socket, localStream);

  useEffect(() => {
    // Get user media
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    .then(stream => {
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    })
    .catch(err => {
      console.error('Error accessing media devices:', err);
    });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <div className="space-y-4">
        {/* Local Video */}
        <div className="relative">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-32 object-cover rounded bg-gray-900"
          />
          <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
            You
          </div>
        </div>

        {/* Remote Videos */}
        {Object.entries(remoteStreams).map(([userId, stream]) => {
          const user = users.find(u => u.id === userId);
          return (
            <div key={userId} className="relative">
              <video
                autoPlay
                playsInline
                className="w-full h-32 object-cover rounded bg-gray-900"
                ref={el => {
                  if (el) el.srcObject = stream;
                }}
              />
              <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                {user?.username || 'Anonymous'}
              </div>
            </div>
          );
        })}

        {/* Controls */}
        <div className="flex justify-center space-x-2">
          <button
            onClick={toggleVideo}
            className={`p-2 rounded-full ${
              isVideoEnabled
                ? 'bg-gray-200 hover:bg-gray-300'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </button>
          
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-full ${
              isAudioEnabled
                ? 'bg-gray-200 hover:bg-gray-300'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
