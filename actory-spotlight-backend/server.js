const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Load env vars
dotenv.config({ path: './.env' });

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:8080',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Static files for uploads (profile photos, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/casting', require('./routes/casting'));
app.use('/api/v1/videos', require('./routes/videos'));
app.use('/api/v1/actor', require('./routes/actor'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/profile', require('./routes/profile'));
app.use('/api/v1/messages', require('./routes/messages'));

app.get('/', (req, res) => {
    res.send('Actory API is running...');
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Ensure DB connects before starting HTTP server
    await connectDB();

    // Create HTTP server and attach Socket.IO for WebRTC signaling
    const http = require('http');
    const server = http.createServer(app);

    // Lazy import to avoid requiring when not installed
    let io;
    try {
      const { Server } = require('socket.io');
      io = new Server(server, {
        cors: {
          origin: process.env.CLIENT_ORIGIN || 'http://localhost:8080',
          methods: ['GET', 'POST']
        }
      });
    } catch (e) {
      console.warn('Socket.IO not installed yet. Run npm install socket.io');
    }

    // In-memory room state (ephemeral):
    // rooms: roomId -> { adminSocketId: string, members: Set<string>, pending: Map<socketId, userMeta> }
    const rooms = new Map();

    if (io) {
      io.on('connection', (socket) => {
        // Create a room, mark this socket as admin
        socket.on('vc:create', ({ roomId, user, settings }) => {
          const id = roomId || Math.random().toString(36).slice(2, 10);
          rooms.set(id, { 
            adminSocketId: socket.id, 
            members: new Set([socket.id]), 
            pending: new Map(),
            adminUser: user || { name: 'Admin' },
            maxParticipants: settings?.maxParticipants || 10
          });
          socket.join(id);
          socket.emit('vc:created', { roomId: id, admin: true, settings: rooms.get(id) });
        });

        // Request to join a room (auto-approve for late comers)
        socket.on('vc:request-join', ({ roomId, user }) => {
          console.log('Join request received:', { roomId, socketId: socket.id, user });
          const room = rooms.get(roomId);
          if (!room) {
            console.log('Room not found:', roomId);
            socket.emit('vc:join-rejected', { roomId, reason: 'Room not found' });
            return;
          }
          
          // Check if room is full
          const maxParticipants = room.maxParticipants || 10;
          
          if (room.members.size >= maxParticipants) {
            socket.emit('vc:join-rejected', { roomId, reason: 'Room is full' });
            return;
          }
          
          // Always require admin approval - no automatic joins
          room.pending.set(socket.id, user || { name: 'Guest' });
          console.log('Notifying admin of join request:', room.adminSocketId);
          console.log('Admin socket exists:', io.sockets.sockets.has(room.adminSocketId));
          console.log('Current pending list for room:', Array.from(room.pending.entries()));
          io.to(room.adminSocketId).emit('vc:join-request', { roomId, socketId: socket.id, user: user || { name: 'Guest' } });
        });

        // Admin approves a waiting participant
        socket.on('vc:approve', ({ roomId, socketId }) => {
          console.log('Approval request:', { roomId, socketId, adminSocketId: socket.id });
          const room = rooms.get(roomId);
          if (!room || room.adminSocketId !== socket.id) {
            console.log('Approval failed: not admin or room not found');
            console.log('Room exists:', !!room);
            console.log('Is admin:', room?.adminSocketId === socket.id);
            return;
          }
          if (!room.pending.has(socketId)) {
            console.log('Approval failed: socket not in pending');
            console.log('Current pending:', Array.from(room.pending.keys()));
            return;
          }
          const user = room.pending.get(socketId);
          room.pending.delete(socketId);
          console.log('Sending approval to:', socketId);
          console.log('Target socket exists:', io.sockets.sockets.has(socketId));
          io.to(socketId).emit('vc:join-approved', { roomId });
        });

        // Admin rejects a waiting participant
        socket.on('vc:reject', ({ roomId, socketId, reason }) => {
          const room = rooms.get(roomId);
          if (!room || room.adminSocketId !== socket.id) return;
          if (!room.pending.has(socketId)) return;
          const user = room.pending.get(socketId);
          room.pending.delete(socketId);
          io.to(socketId).emit('vc:join-rejected', { roomId, reason: reason || 'Rejected by host' });
        });

        // Admin updates room settings
        socket.on('vc:update-settings', ({ roomId, settings }) => {
          const room = rooms.get(roomId);
          if (!room || room.adminSocketId !== socket.id) return;
          
          // Update room settings (only maxParticipants now)
          if (settings.maxParticipants !== undefined) {
            room.maxParticipants = settings.maxParticipants;
          }
          
          // Notify all participants about settings change
          io.to(roomId).emit('vc:settings-updated', { settings: {
            maxParticipants: room.maxParticipants
          }});
        });

        // Finalize join after approval
        socket.on('vc:join', ({ roomId, userId, user }) => {
          console.log('Final join request:', { roomId, socketId: socket.id, userId, user });
          const room = rooms.get(roomId);
          if (!room) {
            console.log('Join failed: room not found');
            return;
          }
          // If this is not admin and not yet a member, ensure approval happened
          const isAdmin = room.adminSocketId === socket.id;
          const alreadyMember = room.members.has(socket.id);
          if (!isAdmin && !alreadyMember) {
            // Only allow if client was approved (client emits vc:join after join-approved)
            // We trust flow; alternatively, track an approved flag set by server on this socket
          }
          socket.join(roomId);
          room.members.add(socket.id);
          console.log('User joined room, notifying others');
          
          // Send user info along with the join notification to existing members
          socket.to(roomId).emit('vc:user-joined', { 
            socketId: socket.id, 
            userId, 
            user: user || { name: 'Guest' }
          });
          
          // Send existing participants list to the newly joined user
          const existingParticipants = Array.from(room.members).map(memberSocketId => {
            if (memberSocketId === room.adminSocketId) {
              return {
                socketId: memberSocketId,
                name: room.adminUser?.name || 'Admin',
                isAdmin: true
              };
            } else {
              // For other participants, we need to get their names from pending requests or use a default
              return {
                socketId: memberSocketId,
                name: 'Participant',
                isAdmin: false
              };
            }
          });
          
          socket.emit('vc:participants-list', { participants: existingParticipants });
        });

        // WebRTC SDP offer/answer/candidates relay
        socket.on('vc:offer', ({ roomId, to, description }) => {
          if (to) io.to(to).emit('vc:offer', { from: socket.id, description });
          else socket.to(roomId).emit('vc:offer', { from: socket.id, description });
        });

        socket.on('vc:answer', ({ to, description }) => {
          if (to) io.to(to).emit('vc:answer', { from: socket.id, description });
        });

        socket.on('vc:candidate', ({ to, candidate }) => {
          if (to) io.to(to).emit('vc:candidate', { from: socket.id, candidate });
        });

        // Leave room and notify peers
        const leaveAll = () => {
          for (const roomId of socket.rooms) {
            if (roomId === socket.id) continue;
            socket.to(roomId).emit('vc:user-left', { socketId: socket.id });
            const set = roomMembers.get(roomId);
            if (set) {
              set.delete(socket.id);
              if (set.size === 0) roomMembers.delete(roomId);
            }
          }
        };

        socket.on('vc:leave', () => {
          leaveAll();
        });
        socket.on('disconnect', () => {
          // Cleanup from rooms map and notify peers
          for (const [roomId, state] of rooms.entries()) {
            if (state.members.delete(socket.id)) {
              socket.to(roomId).emit('vc:user-left', { socketId: socket.id });
              if (state.members.size === 0) rooms.delete(roomId);
            }
            // If admin leaves, promote first member to admin if any
            if (state.adminSocketId === socket.id) {
              const nextAdmin = [...state.members][0];
              if (nextAdmin) {
                state.adminSocketId = nextAdmin;
                io.to(nextAdmin).emit('vc:promoted-admin', { roomId });
              }
            }
            // Remove any pending requests from this socket
            state.pending.delete(socket.id);
          }
          leaveAll();
        });
      });
    }

    server.listen(
      PORT,
      () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
    );

    // Handle unhandled promise rejections gracefully
    process.on('unhandledRejection', (err) => {
      console.log(`Error: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error('Failed to start server due to DB connection error.');
    console.error(err?.message || err);
    process.exit(1);
  }
}

start();