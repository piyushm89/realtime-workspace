import { useState, useEffect, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const useWebRTC = (socket, localStream) => {
  const [peers, setPeers] = useState({});
  const [remoteStreams, setRemoteStreams] = useState({});

  const createPeerConnection = useCallback((userId) => {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    
    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => ({
        ...prev,
        [userId]: remoteStream
      }));
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('webrtc-ice-candidate', {
          targetId: userId,
          candidate: event.candidate
        });
      }
    };

    return peerConnection;
  }, [localStream, socket]);

  const startCall = useCallback(async (targetUserId) => {
    const peerConnection = createPeerConnection(targetUserId);
    setPeers(prev => ({ ...prev, [targetUserId]: peerConnection }));

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socket?.emit('webrtc-offer', {
        targetId: targetUserId,
        offer
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [createPeerConnection, socket]);

  const endCall = useCallback((userId) => {
    if (peers[userId]) {
      peers[userId].close();
      setPeers(prev => {
        const newPeers = { ...prev };
        delete newPeers[userId];
        return newPeers;
      });
    }
    
    setRemoteStreams(prev => {
      const newStreams = { ...prev };
      delete newStreams[userId];
      return newStreams;
    });
  }, [peers]);

  useEffect(() => {
    if (!socket) return;

    // Handle incoming offers
    socket.on('webrtc-offer', async ({ offer, senderId }) => {
      const peerConnection = createPeerConnection(senderId);
      setPeers(prev => ({ ...prev, [senderId]: peerConnection }));

      try {
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socket.emit('webrtc-answer', {
          targetId: senderId,
          answer
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    // Handle incoming answers
    socket.on('webrtc-answer', async ({ answer, senderId }) => {
      const peerConnection = peers[senderId];
      if (peerConnection) {
        try {
          await peerConnection.setRemoteDescription(answer);
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      }
    });

    // Handle ICE candidates
    socket.on('webrtc-ice-candidate', async ({ candidate, senderId }) => {
      const peerConnection = peers[senderId];
      if (peerConnection) {
        try {
          await peerConnection.addIceCandidate(candidate);
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    return () => {
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
    };
  }, [socket, createPeerConnection, peers]);

  return {
    remoteStreams,
    startCall,
    endCall
  };
};
