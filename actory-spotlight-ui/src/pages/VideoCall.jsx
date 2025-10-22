import React, { useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, Video, VideoOff, Mic, MicOff, Phone, FlipHorizontal } from 'lucide-react';
import { toast } from 'sonner';

const SIGNALING_URL = 'http://localhost:5000';


export default function VideoCall() {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [pending, setPending] = useState([]); // [{socketId, name}]
  const [connectedPeers, setConnectedPeers] = useState([]); // socketIds
  const [participants, setParticipants] = useState([]); // [{socketId, name, isAdmin}]
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoMirrored, setIsVideoMirrored] = useState(true);

  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(new Map()); // Map of socketId -> RTCPeerConnection
  const localStreamRef = useRef(null);
  const remoteStreamsRef = useRef(new Map()); // Map of socketId -> MediaStream
  const [speakingUser, setSpeakingUser] = useState(null);
  const [audioLevels, setAudioLevels] = useState(new Map());

  // Initialize socket
  useEffect(() => {
    const socket = io(SIGNALING_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      // no-op
    });

    // Room lifecycle
    socket.on('vc:created', ({ roomId, admin }) => {
      console.log('Room created:', { roomId, admin });
      setRoomId(roomId);
      setIsAdmin(!!admin);
      if (admin) {
        // Add admin to participants list
        setParticipants([{ socketId: socket.id, name: getDisplayName(), isAdmin: true }]);
      }
      toast.success(`Room created: ${roomId}`);
    });

    socket.on('vc:join-request', ({ roomId, socketId, user }) => {
      console.log('Join request received:', { roomId, socketId, user });
      setPending((prev) => [{ socketId, name: user?.name || 'Guest' }, ...prev]);
    });

    socket.on('vc:join-approved', async ({ roomId }) => {
      console.log('Join approved, joining room:', roomId);
      setRoomId(roomId);
      toast.success('Approved by host');
      
      // Get local media stream for participant
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (error) {
        console.error('Error getting user media:', error);
        toast.error('Failed to access camera/microphone');
      }
      
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

    return () => {
      socket.disconnect();
      cleanupMedia();
    };
  }, []);

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
      
      // Assign the stream to the remote video element
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        console.log('Remote video stream assigned:', stream, 'to element:', remoteVideoRef.current);
      } else {
        console.warn('Remote video ref is null, cannot assign stream');
      }
      
      // Set up audio level monitoring for speaker detection
      if (stream.getAudioTracks().length > 0) {
        setupAudioLevelMonitoring(remoteSocketId, stream);
      }
    };

    // Get local media if not already available
    if (!localStreamRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('Local video stream assigned:', stream);
      }
    }

    // Add local tracks to this peer connection
    localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));

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
      user: { name: getDisplayName() }
    });
  }

  async function handleRequestJoin() {
    if (!roomIdInput) return toast.error('Enter a room code');
    console.log('Requesting to join room:', roomIdInput);
    socketRef.current?.emit('vc:request-join', { roomId: roomIdInput, user: { name: getDisplayName() } });
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
    try {
      // Get local media first
      if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      }
      
      setIsInCall(true);
      toast.success('Call started');
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call');
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

  function toggleVideo() {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !isVideoOn;
      setIsVideoOn(!isVideoOn);
    }
  }

  function toggleMic() {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isMicOn;
      setIsMicOn(!isMicOn);
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
    toast.success('Call ended');
  }

  function approve(socketId) {
    console.log('Approving user:', socketId);
    socketRef.current?.emit('vc:approve', { roomId, socketId });
    setPending((prev) => prev.filter((p) => p.socketId !== socketId));
  }
  function reject(socketId) {
    socketRef.current?.emit('vc:reject', { roomId, socketId });
    setPending((prev) => prev.filter((p) => p.socketId !== socketId));
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
        React.createElement('div', { className: 'grid gap-4 md:grid-cols-2' },
          React.createElement('div', { className: 'space-y-2' },
            React.createElement('h4', { className: 'text-sm font-medium text-center' }, 'Your Video'),
            React.createElement('video', { 
              ref: localVideoRef, 
              autoPlay: true, 
              muted: true, 
              playsInline: true, 
              className: `w-full rounded-md border ${isVideoMirrored ? 'scale-x-[-1]' : ''}` 
            })
          ),
          React.createElement('div', { className: 'space-y-2' },
            React.createElement('h4', { className: 'text-sm font-medium text-center' }, 'Remote Video'),
            React.createElement('video', { 
              ref: remoteVideoRef, 
              autoPlay: true, 
              playsInline: true, 
              className: 'w-full rounded-md border' 
            })
          )
        )
      ),

      isInCall && React.createElement('div', { className: 'flex justify-center space-x-4' },
        React.createElement(Button, { variant: isVideoOn ? 'default' : 'destructive', onClick: toggleVideo },
          isVideoOn ? React.createElement(Video, { className: 'h-4 w-4' }) : React.createElement(VideoOff, { className: 'h-4 w-4' })
        ),
        React.createElement(Button, { variant: isMicOn ? 'default' : 'destructive', onClick: toggleMic },
          isMicOn ? React.createElement(Mic, { className: 'h-4 w-4' }) : React.createElement(MicOff, { className: 'h-4 w-4' })
        ),
        React.createElement(Button, { variant: isVideoMirrored ? 'default' : 'outline', onClick: toggleVideoMirror, title: 'Toggle Video Mirror' },
          React.createElement(FlipHorizontal, { className: 'h-4 w-4' })
        ),
        React.createElement(Button, { variant: 'destructive', onClick: endCall },
          React.createElement(Phone, { className: 'h-4 w-4' })
        )
      )
    )
  );
}
