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
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Set security headers
app.use((req, res, next) => {
  // Set Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; font-src 'self' data: http://localhost:5000; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http://localhost:5000; connect-src 'self' http://localhost:5000 ws://localhost:5000 http://localhost:8080"
  );

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:8080');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Cross-Origin headers
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  next();
});

// Static files for uploads (profile photos, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve assets (including fonts) from the frontend's assets directory
app.use('/assets', express.static(path.join(__dirname, '../actory-spotlight-ui/dist/assets')));

// Mount routers
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/casting', require('./routes/casting'));
app.use('/api/v1/videos', require('./routes/videos'));
app.use('/api/v1/actor', require('./routes/actor'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/profile', require('./routes/profile'));
app.use('/api/v1/messages', require('./routes/messages'));
app.use('/api', require('./routes/prediction'));

// Handle OPTIONS preflight requests
app.options('*', cors(corsOptions));

// KNN Role Fit Classification
// POST /api/v1/fit/knn
// Body: {
//   candidate: { age, height, skillsEncoded, expYears, callbackRate, portfolioVideos, genreMatch },
//   trainingSet: [
//     { features: { age, height, skillsEncoded, expYears, callbackRate, portfolioVideos, genreMatch }, label: 'Good Fit' | 'Partial Fit' | 'Poor Fit' },
//     ...
//   ],
//   k?: number
// }
// Returns: { category, neighbors }
app.post('/api/v1/fit/knn', (req, res) => {
  try {
    const { candidate, trainingSet, k = 5 } = req.body || {};
    if (!candidate || !Array.isArray(trainingSet) || trainingSet.length === 0) {
      return res.status(400).json({ success: false, message: 'candidate and non-empty trainingSet are required' });
    }

    const featureKeys = ['age','height','skillsEncoded','expYears','callbackRate','portfolioVideos','genreMatch'];

    // Build vectors and compute min/max for normalization
    const train = trainingSet.map((row) => ({
      x: featureKeys.map((k) => Number((row.features || {})[k] ?? 0)),
      label: row.label || 'Partial Fit'
    }));
    const cand = featureKeys.map((k) => Number(candidate[k] ?? 0));

    const mins = Array(featureKeys.length).fill(Infinity);
    const maxs = Array(featureKeys.length).fill(-Infinity);
    for (const r of train) {
      r.x.forEach((v, i) => {
        if (v < mins[i]) mins[i] = v;
        if (v > maxs[i]) maxs[i] = v;
      });
    }
    // Include candidate in range to avoid divide by zero when dataset has constants
    cand.forEach((v, i) => {
      if (v < mins[i]) mins[i] = v;
      if (v > maxs[i]) maxs[i] = v;
    });

    const norm = (vec) => vec.map((v, i) => {
      const range = maxs[i] - mins[i];
      if (!isFinite(range) || range === 0) return 0; // constant feature -> 0
      return (v - mins[i]) / range;
    });

    const candN = norm(cand);
    const trainN = train.map((r) => ({ x: norm(r.x), label: r.label }));

    const dist = (a, b) => {
      let s = 0;
      for (let i = 0; i < a.length; i++) {
        const d = (a[i] - b[i]);
        s += d * d;
      }
      return Math.sqrt(s);
    };

    const neighbors = trainN
      .map((r, idx) => ({ idx, d: dist(candN, r.x), label: r.label }))
      .sort((a, b) => a.d - b.d)
      .slice(0, Math.max(1, Math.min(k, trainN.length)));

    // Majority vote with tie-breaker by average distance
    const tally = new Map();
    const distSum = new Map();
    for (const n of neighbors) {
      tally.set(n.label, (tally.get(n.label) || 0) + 1);
      distSum.set(n.label, (distSum.get(n.label) || 0) + n.d);
    }
    let bestLabel = null;
    let bestCount = -1;
    let bestAvg = Infinity;
    for (const [label, count] of tally.entries()) {
      const avg = (distSum.get(label) || 0) / count;
      if (count > bestCount || (count === bestCount && avg < bestAvg)) {
        bestLabel = label;
        bestCount = count;
        bestAvg = avg;
      }
    }

    return res.json({ success: true, category: bestLabel, neighbors });
  } catch (e) {
    console.error('KNN classification error', e);
    return res.status(500).json({ success: false, message: 'KNN classification failed' });
  }
});

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
          // Notify the approved user to proceed to join
          io.to(socketId).emit('vc:join-approved', { roomId });
          // Broadcast a placeholder to current room members so they can render the user tile immediately (camera off)
          io.to(roomId).emit('vc:user-approved', { roomId, socketId, user: user || { name: 'Guest' } });
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

        // Leave room and notify peers (using rooms map state)
        const leaveAll = () => {
          for (const [id, state] of rooms.entries()) {
            if (state.members.has(socket.id)) {
              socket.to(id).emit('vc:user-left', { socketId: socket.id });
              state.members.delete(socket.id);
              state.pending.delete(socket.id);
              // If admin leaves, promote first remaining member to admin
              if (state.adminSocketId === socket.id) {
                const nextAdmin = [...state.members][0];
                if (nextAdmin) {
                  state.adminSocketId = nextAdmin;
                  io.to(nextAdmin).emit('vc:promoted-admin', { roomId: id });
                }
              }
              // Remove empty room
              if (state.members.size === 0) {
                rooms.delete(id);
              }
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