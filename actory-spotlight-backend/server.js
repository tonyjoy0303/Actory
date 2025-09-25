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

async function start() {
  try {
    // Ensure DB connects before starting HTTP server
    await connectDB();

    const server = app.listen(
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