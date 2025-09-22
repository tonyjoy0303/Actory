const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Load env vars
dotenv.config({ path: './.env' });

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

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

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});