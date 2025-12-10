const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: './.env' });

// Initialize Express app
const app = express();

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enable CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:8080',
  'http://localhost:8080',
  'https://actory-1ci4.onrender.com'
];

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Set security headers
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  if (allowedOrigins.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Connect to DB (on first request, cached after)
let dbConnected = false;

const ensureDBConnection = async () => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (err) {
      console.error('Database connection failed:', err.message);
      throw err;
    }
  }
};

// Routes
const authRoutes = require('./routes/auth');
const actorRoutes = require('./routes/actor');
const castingRoutes = require('./routes/casting');
const videoRoutes = require('./routes/videos');
const messageRoutes = require('./routes/messages');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/actors', actorRoutes);
app.use('/api/v1/castings', castingRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Export for Vercel serverless function
module.exports = app;
