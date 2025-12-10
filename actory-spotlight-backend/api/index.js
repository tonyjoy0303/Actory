const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('../config/db');

// Load env vars
dotenv.config();

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

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// DB Connection cache
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  
  try {
    await connectDB();
    cachedDb = true;
    console.log('✅ Database connected');
    return cachedDb;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    throw error;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Actory Backend API' });
});

// Routes
const authRoutes = require('../routes/auth');
const actorRoutes = require('../routes/actor');
const castingRoutes = require('../routes/casting');
const videoRoutes = require('../routes/videos');
const messageRoutes = require('../routes/messages');
const profileRoutes = require('../routes/profile');
const adminRoutes = require('../routes/admin');

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
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Vercel serverless handler
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('🚀 Incoming request:', req.method, req.url);
    await connectToDatabase();
    console.log('✅ Database connected, forwarding to Express');
    return app(req, res);
  } catch (error) {
    console.error('❌ Handler error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// Export app for local development
module.exports.app = app;
