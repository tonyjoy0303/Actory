import React, { useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, Video, VideoOff, Mic, MicOff, Phone, FlipHorizontal } from 'lucide-react';
import { toast } from 'sonner';

const SIGNALING_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';


export default function VideoCall() {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [pending, setPending] = useState([]); // [{socketId, name}]
  const [connectedPeers, setConnectedPeers] = useState([]); // socketIds
  const [participants, setParticipants] = useState([]); // [{socketId, name, isAdmin}]
  const [isVideoOn, setIsVideoOn] = useState(false); // Start with camera off
  const [isMicOn, setIsMicOn] = useState(false); // Start with mic off
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoMirrored, setIsVideoMirrored] = useState(true);
  const [cameraStarted, setCameraStarted] = useState(false); // Track if camera has been started
  const [roomSettings, setRoomSettings] = useState({
    maxParticipants: 10
  });

  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(new Map()); // Map of socketId -> RTCPeerConnection
  const localStreamRef = useRef(null);
  const remoteStreamsRef = useRef(new Map()); // Map of socketId -> MediaStream
  const [speakingUser, setSpeakingUser] = useState(null);
  const [audioLevels, setAudioLevels] = useState(new Map());
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render when streams change

  // Initialize socket
  useEffect(() => {
    const socket = io(SIGNALING_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      // no-op
    });

    // Room lifecycle
    socket.on('vc:created', ({ roomId, admin, settings }) => {
      console.log('Room created:', { roomId, admin, settings });
      setRoomId(roomId);
      setIsAdmin(!!admin);
      if (settings) {
        setRoomSettings(settings);
      }
      if (admin) {
        // Add admin to participants list
        setParticipants([{ socketId: socket.id, name: getDisplayName(), isAdmin: true }]);
      }
      toast.success(`Room created: ${roomId}`);
    });

    socket.on('vc:join-request', ({ roomId, socketId, user }) => {
      console.log('Join request received:', { roomId, socketId, user });
      console.log('Current pending before update:', pending);
      setPending((prev) => {
        const newPending = [{ socketId, name: user?.name || 'Guest' }, ...prev];
        console.log('Updated pending list:', newPending);
        return newPending;
      });
    });

    socket.on('vc:join-approved', async ({ roomId }) => {
      console.log('Join approved, joining room:', roomId);
      setRoomId(roomId);
      toast.success('Approved by host');
      
      // Automatically join the room after approval
      socket.emit('vc:join', { 
        roomId, 
        userId: getUserId(),
        user: { name: getDisplayName() }
      });
      // Set in call state for participant
      setIsInCall(true);
    });

    socket.on('vc:join-rejected', ({ reason }) => {
      toast.error(reason || 'Join request rejected');
    });

    socket.on('vc:user-joined', async ({ socketId, userId, user }) => {
      console.log('User joined:', socketId, userId, user);
      setConnectedPeers((prev) => Array.from(new Set([...prev, socketId])));
      // Use the user name from the backend or fallback to default
      const userName = user?.name || 'Guest';
      setParticipants((prev) => [...prev, { socketId, name: userName, isAdmin: false }]);
      toast.success('User joined the room');
      
      // Initiate WebRTC connection if we're in a call (admin side)
      if (isInCall && isAdmin) {
        console.log('Admin initiating WebRTC connection with:', socketId);
        await initiateWebRTCConnection(socketId);
      }
    });

    socket.on('vc:user-left', ({ socketId }) => {
      setConnectedPeers((prev) => prev.filter((id) => id !== socketId));
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
      
      // Clean up peer connection
      const pc = pcRef.current.get(socketId);
      if (pc) {
        pc.close();
        pcRef.current.delete(socketId);
      }
      
      // Clean up remote stream
      const stream = remoteStreamsRef.current.get(socketId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        remoteStreamsRef.current.delete(socketId);
      }
      
      // Update speaking user if they left
      if (speakingUser === socketId) {
        setSpeakingUser(null);
      }
    });

    socket.on('vc:participants-list', async ({ participants }) => {
      console.log('Received participants list:', participants);
      setParticipants(participants);
      setConnectedPeers(participants.map(p => p.socketId));
      
      // If we're a participant and there are other participants, initiate WebRTC connections
      if (isInCall && !isAdmin) {
        console.log('Initiating WebRTC connections for participants:', participants);
        for (const participant of participants) {
          if (participant.socketId !== socket.id) {
            console.log('Initiating connection with:', participant.socketId);
            await initiateWebRTCConnection(participant.socketId);
          }
        }
      }
    });

    // Signaling handlers
    socket.on('vc:offer', async ({ from, description }) => {
      console.log('Received offer from:', from);
      console.log('Offer description:', description);
      const pc = await ensurePeerConnection(from);
      console.log('Peer connection for offer:', pc);
      
      await pc.setRemoteDescription(description);
      console.log('Remote description set for offer');
      
      const answer = await pc.createAnswer();
      console.log('Answer created:', answer);
      
      await pc.setLocalDescription(answer);
      console.log('Local description set for answer');
      
      socket.emit('vc:answer', { to: from, description: answer });
      console.log('Answer sent to:', from);
    });

    socket.on('vc:answer', async ({ from, description }) => {
      console.log('Received answer from:', from);
      console.log('Answer description:', description);
      const pc = pcRef.current.get(from);
      if (!pc) {
        console.error('No peer connection found for:', from);
        return;
      }
      console.log('Setting remote description for answer');
      await pc.setRemoteDescription(description);
      console.log('Remote description set for answer');
    });

    socket.on('vc:candidate', async ({ from, candidate }) => {
      console.log('Received candidate from:', from);
      const pc = pcRef.current.get(from);
      if (!pc || !candidate) return;
      try {
        await pc.addIceCandidate(candidate);
      } catch (e) {
        console.error('Error adding ICE candidate:', e);
      }
    });

    // Room settings update
    socket.on('vc:settings-updated', ({ settings }) => {
      console.log('Room settings updated:', settings);
      setRoomSettings(settings);
      toast.info('Room settings updated');
    });

    return () => {
      socket.disconnect();
      cleanupMedia();
    };
  }, []);

  // Update video elements when streams change
  useEffect(() => {
    // This effect will run when forceUpdate changes, ensuring video elements get updated
    const updateVideoElements = () => {
      // Find all video elements and update their srcObject if needed
      const videoElements = document.querySelectorAll('video[data-socket-id]');
      videoElements.forEach(video => {
        const socketId = video.getAttribute('data-socket-id');
        if (socketId === 'local') {
          // Handle local video stream
          if (localStreamRef.current && video.srcObject !== localStreamRef.current) {
            console.log('Setting local video stream');
            video.srcObject = localStreamRef.current;
          }
        } else if (socketId) {
          // Handle remote video streams
          const stream = remoteStreamsRef.current.get(socketId);
          if (stream && video.srcObject !== stream) {
            console.log('Setting remote video stream for:', socketId);
            video.srcObject = stream;
          }
        }
      });
    };
    
    updateVideoElements();
  }, [forceUpdate, cameraStarted, localStreamRef.current]);

  // Specific effect for local video stream
  useEffect(() => {
    if (cameraStarted && localStreamRef.current && localVideoRef.current) {
      console.log('Setting local video stream via ref');
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [cameraStarted, localStreamRef.current]);

  const getUserId = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')._id || 'guest';
    } catch {
      return 'guest';
    }
  };

  async function ensurePeerConnection(remoteSocketId) {
    if (pcRef.current.has(remoteSocketId)) {
      return pcRef.current.get(remoteSocketId);
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit('vc:candidate', { to: remoteSocketId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      console.log('Received remote stream from:', remoteSocketId);
      const [stream] = e.streams;
      remoteStreamsRef.current.set(remoteSocketId, stream);
      
      // Set up audio level monitoring for speaker detection
      if (stream.getAudioTracks().length > 0) {
        setupAudioLevelMonitoring(remoteSocketId, stream);
      }
      
      // Force re-render to update video grid
      setParticipants(prev => [...prev]);
      setForceUpdate(prev => prev + 1);
    };

    // Only add local tracks if camera is started
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
    }

    pcRef.current.set(remoteSocketId, pc);
    return pc;
  }

  function cleanupMedia() {
    // Close all peer connections
    pcRef.current.forEach((pc) => {
      pc.getSenders()?.forEach((s) => {
        try { s.track && s.track.stop(); } catch {}
      });
      pc.close();
    });
    pcRef.current.clear();

    // Stop all remote streams
    remoteStreamsRef.current.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });
    remoteStreamsRef.current.clear();

    localStreamRef.current?.getTracks()?.forEach((t) => t.stop());
    localStreamRef.current = null;
    
    // Reset state
    setSpeakingUser(null);
    setAudioLevels(new Map());
  }

  async function handleCreateRoom() {
    socketRef.current?.emit('vc:create', { 
      user: { name: getDisplayName() },
      settings: roomSettings
    });
  }

  async function handleRequestJoin() {
    if (!roomIdInput) return toast.error('Enter a room code');
    console.log('Requesting to join room:', roomIdInput);
    console.log('Socket connected:', socketRef.current?.connected);
    console.log('User info:', { name: getDisplayName() });
    socketRef.current?.emit('vc:request-join', { roomId: roomIdInput, user: { name: getDisplayName() } });
    toast.info('Requesting to join room...');
  }

  function updateRoomSettings(newSettings) {
    if (!roomId || !isAdmin) return;
    socketRef.current?.emit('vc:update-settings', { 
      roomId, 
      settings: newSettings 
    });
    setRoomSettings(newSettings);
  }

  function getDisplayName() {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}').name || 'Guest';
    } catch {
      return 'Guest';
    }
  }

  async function startCallAsAdmin() {
    if (!roomId) return;
    setIsInCall(true);
    toast.success('Call started - Start camera when ready');
    // Proactively initiate WebRTC with existing participants
    try {
      for (const p of participants) {
        if (p.socketId && p.socketId !== socketRef.current?.id) {
          await initiateWebRTCConnection(p.socketId);
        }
      }
    } catch (e) {
      console.error('Error initiating connections on start:', e);
    }
  }

  function copyRoomCode() {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId).then(() => {
      toast.success('Room code copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy room code');
    });
  }

  async function startCamera() {
    try {
      if (localStreamRef.current) {
        toast.info('Camera is already started');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Also update any video elements in the DOM directly
      setTimeout(() => {
        const localVideoElements = document.querySelectorAll('video[data-socket-id="local"]');
        localVideoElements.forEach(video => {
          if (video.srcObject !== stream) {
            console.log('Directly setting local video stream to DOM element');
            video.srcObject = stream;
          }
        });
      }, 100);
      
      // Set initial states based on track availability
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      setIsVideoOn(!!videoTrack && videoTrack.enabled);
      setIsMicOn(!!audioTrack && audioTrack.enabled);
      setCameraStarted(true);
      
      // Add/replace tracks on all existing peer connections and renegotiate
      for (const [remoteSocketId, pc] of pcRef.current.entries()) {
        try {
          const senders = pc.getSenders ? pc.getSenders() : [];
          // Replace or add tracks
          stream.getTracks().forEach(track => {
            const sender = senders.find(s => s.track && s.track.kind === track.kind);
            if (sender && sender.replaceTrack) {
              sender.replaceTrack(track);
            } else {
              pc.addTrack(track, stream);
            }
          });
          // Renegotiate
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current?.emit('vc:offer', { to: remoteSocketId, description: offer });
        } catch (err) {
          console.error('Error renegotiating with peer', remoteSocketId, err);
        }
      }
      
      // Force re-render to update video grid
      setParticipants(prev => [...prev]);
      setForceUpdate(prev => prev + 1);
      
      // Debug: Check video elements
      setTimeout(() => {
        const videoElements = document.querySelectorAll('video');
        console.log('Total video elements found:', videoElements.length);
        videoElements.forEach((video, index) => {
          console.log(`Video ${index}:`, {
            srcObject: !!video.srcObject,
            socketId: video.getAttribute('data-socket-id'),
            videoTracks: video.srcObject?.getVideoTracks().length || 0
          });
        });
      }, 200);
      
      toast.success('Camera started');
    } catch (error) {
      console.error('Error starting camera:', error);
      toast.error('Failed to start camera. Please check permissions.');
    }
  }

  function stopCamera() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      setIsVideoOn(false);
      setIsMicOn(false);
      setCameraStarted(false);
      
      // Force re-render to update video grid
      setParticipants(prev => [...prev]);
      setForceUpdate(prev => prev + 1);
      
      toast.info('Camera stopped');
    }
  }

  function toggleVideo() {
    if (!localStreamRef.current) {
      toast.error('Please start camera first');
      return;
    }
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !isVideoOn;
      setIsVideoOn(!isVideoOn);
      
      // Force re-render to update video grid
      setParticipants(prev => [...prev]);
      setForceUpdate(prev => prev + 1);
    }
  }

  function toggleMic() {
    if (!localStreamRef.current) {
      toast.error('Please start camera first');
      return;
    }
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isMicOn;
      setIsMicOn(!isMicOn);
      
      // Force re-render to update video grid
      setParticipants(prev => [...prev]);
      setForceUpdate(prev => prev + 1);
    }
  }

  function toggleVideoMirror() {
    setIsVideoMirrored(!isVideoMirrored);
  }

  function setupAudioLevelMonitoring(socketId, stream) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    analyser.fftSize = 256;
    source.connect(analyser);
    
    const checkAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      
      setAudioLevels(prev => {
        const newLevels = new Map(prev);
        newLevels.set(socketId, average);
        return newLevels;
      });
      
      // Update speaking user based on highest audio level
      if (average > 10) { // Threshold for detecting speech
        setSpeakingUser(socketId);
      }
      
      requestAnimationFrame(checkAudioLevel);
    };
    
    checkAudioLevel();
  }

  async function initiateWebRTCConnection(remoteSocketId) {
    try {
      console.log('Initiating WebRTC connection with:', remoteSocketId);
      const pc = await ensurePeerConnection(remoteSocketId);
      console.log('Peer connection created:', pc);
      
      const offer = await pc.createOffer();
      console.log('Offer created:', offer);
      
      await pc.setLocalDescription(offer);
      console.log('Local description set');
      
      socketRef.current?.emit('vc:offer', { to: remoteSocketId, description: offer });
      console.log('Offer sent to:', remoteSocketId);
    } catch (error) {
      console.error('Error initiating WebRTC connection:', error);
    }
  }

  function endCall() {
    cleanupMedia();
    setIsInCall(false);
    setParticipants([]);
    setConnectedPeers([]);
    setCameraStarted(false);
    setIsVideoOn(false);
    setIsMicOn(false);
    toast.success('Call ended');
  }

  function approve(socketId) {
    console.log('Approving user:', socketId);
    console.log('Current roomId:', roomId);
    console.log('Current pending list:', pending);
    socketRef.current?.emit('vc:approve', { roomId, socketId });
    setPending((prev) => {
      const filtered = prev.filter((p) => p.socketId !== socketId);
      console.log('Pending after approval:', filtered);
      return filtered;
    });
  }
  function reject(socketId) {
    console.log('Rejecting user:', socketId);
    console.log('Current roomId:', roomId);
    socketRef.current?.emit('vc:reject', { roomId, socketId });
    setPending((prev) => {
      const filtered = prev.filter((p) => p.socketId !== socketId);
      console.log('Pending after rejection:', filtered);
      return filtered;
    });
  }

  function createVideoGrid() {
    const allParticipants = [...participants];
    
    // Add local user if camera is started
    if (cameraStarted && localStreamRef.current) {
      allParticipants.unshift({
        socketId: 'local',
        name: getDisplayName(),
        isAdmin: isAdmin,
        isLocal: true
      });
    }

    // Filter out current socket's own participant entry to avoid duplicate/empty tile
    const renderedParticipants = allParticipants.filter(
      (p) => p.socketId !== socketRef.current?.id
    );

    if (renderedParticipants.length === 0) {
      return React.createElement('div', { className: 'text-center text-muted-foreground py-8' },
        'No participants with active cameras'
      );
    }

    // Determine layout based on number of participants
    let gridClass = '';
    let videoSizeClass = '';
    
    if (renderedParticipants.length === 1) {
      gridClass = 'grid grid-cols-1 max-w-md mx-auto';
      videoSizeClass = 'aspect-video';
    } else if (renderedParticipants.length === 2) {
      gridClass = 'grid grid-cols-2 gap-4';
      videoSizeClass = 'aspect-video';
    } else if (renderedParticipants.length <= 4) {
      gridClass = 'grid grid-cols-2 gap-4';
      videoSizeClass = 'aspect-video';
    } else {
      gridClass = 'grid grid-cols-3 gap-4';
      videoSizeClass = 'aspect-video';
    }

    return React.createElement('div', { className: gridClass },
      renderedParticipants.map((participant, index) => {
        const isSpeaking = speakingUser === participant.socketId;
        const audioLevel = audioLevels.get(participant.socketId) || 0;
        const isHighlighted = isSpeaking && renderedParticipants.length > 2;
        const hasRemoteStream = !participant.isLocal && remoteStreamsRef.current.get(participant.socketId);
        
        return React.createElement('div', { 
          key: participant.socketId,
          className: `relative rounded-lg overflow-hidden border-2 transition-all duration-300 ${
            isHighlighted 
              ? 'border-blue-500 shadow-lg scale-105 z-10' 
              : 'border-gray-300'
          }`,
          style: isHighlighted ? { order: -1 } : {}
        },
          // Video element
          React.createElement('video', {
            ref: participant.isLocal ? localVideoRef : (el) => {
              if (el && !participant.isLocal) {
                // Use useEffect-like approach to set stream when element is available
                const stream = remoteStreamsRef.current.get(participant.socketId);
                if (stream && el.srcObject !== stream) {
                  el.srcObject = stream;
                }
              }
            },
            'data-socket-id': participant.socketId,
            autoPlay: true,
            muted: participant.isLocal,
            playsInline: true,
            className: `${videoSizeClass} w-full object-cover ${
              participant.isLocal && isVideoMirrored ? 'scale-x-[-1]' : ''
            }`,
            onLoadedMetadata: (e) => {
              // Ensure video plays when metadata is loaded
              e.target.play().catch(console.error);
            },
            // For local video, ensure the stream is set
            ...(participant.isLocal && localStreamRef.current ? { srcObject: localStreamRef.current } : {})
          }),
          
          // Participant info overlay
          React.createElement('div', { 
            className: 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2'
          },
            React.createElement('div', { className: 'flex items-center justify-between' },
              React.createElement('span', { 
                className: 'text-white text-sm font-medium truncate' 
              }, participant.name),
              React.createElement('div', { className: 'flex items-center space-x-1' },
                participant.isAdmin && React.createElement(Badge, { 
                  variant: 'secondary', 
                  className: 'text-xs' 
                }, 'Admin'),
                participant.isLocal && React.createElement(Badge, { 
                  variant: 'outline', 
                  className: 'text-xs bg-white/20 text-white border-white/30' 
                }, 'You')
              )
            )
          ),
          
          // Speaking indicator
          isSpeaking && React.createElement('div', { 
            className: 'absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse' 
          }),
          
          // Audio level indicator
          audioLevel > 10 && React.createElement('div', { 
            className: 'absolute top-2 left-2 flex space-x-1' 
          },
            [...Array(Math.min(Math.floor(audioLevel / 20), 5))].map((_, i) => 
              React.createElement('div', { 
                key: i,
                className: 'w-1 bg-green-500 rounded-full animate-pulse',
                style: { height: `${(i + 1) * 4}px` }
              })
            )
          ),
          
          // Camera off indicator for remote participants without streams
          (!participant.isLocal && !hasRemoteStream) && 
          React.createElement('div', { 
            className: 'absolute inset-0 bg-gray-800 flex items-center justify-center' 
          },
            React.createElement('div', { className: 'text-center text-white' },
              React.createElement(VideoOff, { className: 'h-8 w-8 mx-auto mb-2' }),
              React.createElement('p', { className: 'text-sm' }, 'Camera off')
            )
          )
        );
      })
    );
  }

  return (
    React.createElement('div', { className: 'container mx-auto px-4 py-6 space-y-6' },
      React.createElement('div', { className: 'grid gap-6 md:grid-cols-4' },
        React.createElement(Card, null,
          React.createElement(CardHeader, null,
            React.createElement(CardTitle, null, 'Create a Room')
          ),
          React.createElement(CardContent, { className: 'space-y-3' },
            React.createElement(Button, { onClick: handleCreateRoom }, 'Create Room'),
            roomId && React.createElement('div', { className: 'space-y-2' },
              React.createElement('p', { className: 'text-sm text-muted-foreground' }, `Room ID: ${roomId}`),
              React.createElement(Button, { size: 'sm', variant: 'outline', onClick: copyRoomCode },
                React.createElement(Copy, { className: 'h-4 w-4 mr-2' }),
                'Copy Code'
              )
            ),
            isAdmin && !isInCall && React.createElement(Button, { variant: 'secondary', onClick: startCallAsAdmin }, 'Start Call')
          )
        ),

        React.createElement(Card, null,
          React.createElement(CardHeader, null,
            React.createElement(CardTitle, null, 'Join by Code')
          ),
          React.createElement(CardContent, { className: 'space-y-3' },
            React.createElement(Input, { placeholder: 'Enter room code', value: roomIdInput, onChange: (e) => setRoomIdInput(e.target.value) }),
            React.createElement(Button, { onClick: handleRequestJoin }, 'Request to Join')
          )
        ),

        isAdmin && React.createElement(Card, null,
          React.createElement(CardHeader, null,
            React.createElement(CardTitle, null, 'Waiting Room')
          ),
          React.createElement(CardContent, { className: 'space-y-2' },
            pending.length === 0 ? (
              React.createElement('p', { className: 'text-sm text-muted-foreground' }, 'No pending requests')
            ) : (
              pending.map((p) => (
                React.createElement('div', { key: p.socketId, className: 'flex items-center justify-between rounded-md border p-2' },
                  React.createElement('span', null, p.name),
                  React.createElement('div', { className: 'space-x-2' },
                    React.createElement(Button, { size: 'sm', onClick: () => approve(p.socketId) }, 'Approve'),
                    React.createElement(Button, { size: 'sm', variant: 'destructive', onClick: () => reject(p.socketId) }, 'Reject')
                  )
                )
              ))
            )
          )
        ),

        isAdmin && React.createElement(Card, null,
          React.createElement(CardHeader, null,
            React.createElement(CardTitle, null, 'Room Settings')
          ),
          React.createElement(CardContent, { className: 'space-y-4' },
            React.createElement('div', { className: 'space-y-2' },
              React.createElement('label', { className: 'text-sm font-medium' }, 'Max Participants'),
              React.createElement(Input, { 
                type: 'number', 
                min: 2, 
                max: 20, 
                value: roomSettings.maxParticipants,
                onChange: (e) => updateRoomSettings({ ...roomSettings, maxParticipants: parseInt(e.target.value) })
              })
            ),
            React.createElement('div', { className: 'text-sm text-muted-foreground' },
              'All participants require admin approval to join'
            )
          )
        ),

        React.createElement(Card, null,
          React.createElement(CardHeader, null,
            React.createElement(CardTitle, { className: 'flex items-center' },
              React.createElement(Users, { className: 'h-4 w-4 mr-2' }),
              'Participants'
            )
          ),
          React.createElement(CardContent, { className: 'space-y-2' },
            participants.length === 0 ? (
              React.createElement('p', { className: 'text-sm text-muted-foreground' }, 'No participants')
            ) : (
              participants.map((p) => (
                React.createElement('div', { key: p.socketId, className: 'flex items-center justify-between rounded-md border p-2' },
                  React.createElement('span', null, p.name),
                  p.isAdmin && React.createElement(Badge, { variant: 'secondary' }, 'Admin')
                )
              ))
            )
          )
        )
      ),

      React.createElement('div', { className: 'space-y-4' },
        React.createElement('h3', { className: 'text-lg font-semibold text-center' }, 
          `Video Call - ${participants.length} participant${participants.length !== 1 ? 's' : ''}`
        ),
        createVideoGrid()
      ),

      isInCall && React.createElement('div', { className: 'space-y-4' },
        // Camera Control Section
        React.createElement('div', { className: 'flex justify-center space-x-4' },
          !cameraStarted ? (
            React.createElement(Button, { onClick: startCamera, className: 'bg-green-600 hover:bg-green-700' },
              React.createElement(Video, { className: 'h-4 w-4 mr-2' }),
              'Start Camera'
            )
          ) : (
            React.createElement(Button, { onClick: stopCamera, variant: 'destructive' },
              React.createElement(VideoOff, { className: 'h-4 w-4 mr-2' }),
              'Stop Camera'
            )
          )
        ),
        
        // Media Controls (only show when camera is started)
        cameraStarted && React.createElement('div', { className: 'flex justify-center space-x-4' },
          React.createElement(Button, { variant: isVideoOn ? 'default' : 'destructive', onClick: toggleVideo },
            isVideoOn ? React.createElement(Video, { className: 'h-4 w-4' }) : React.createElement(VideoOff, { className: 'h-4 w-4' })
          ),
          React.createElement(Button, { variant: isMicOn ? 'default' : 'destructive', onClick: toggleMic },
            isMicOn ? React.createElement(Mic, { className: 'h-4 w-4' }) : React.createElement(MicOff, { className: 'h-4 w-4' })
          ),
          React.createElement(Button, { variant: isVideoMirrored ? 'default' : 'outline', onClick: toggleVideoMirror, title: 'Toggle Video Mirror' },
            React.createElement(FlipHorizontal, { className: 'h-4 w-4' })
          )
        ),
        
        // End Call Button
        React.createElement('div', { className: 'flex justify-center' },
          React.createElement(Button, { variant: 'destructive', onClick: endCall },
            React.createElement(Phone, { className: 'h-4 w-4 mr-2' }),
            'End Call'
          )
        )
      )
    )
  );
}
