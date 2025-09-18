const mongoose = require('mongoose');

const connectDB = async () => {
  console.log('🔍 Attempting to connect to MongoDB...');
  console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Found' : '❌ Missing');
  
  try {
    const options = {
      family: 4, // Prefer IPv4
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 10000, // Fail fast if initial connection takes too long
    };

    console.log('⏳ Connecting to MongoDB with options:', JSON.stringify(options, null, 2));
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log('MongoDB Connection State:', mongoose.connection.readyState); // 1 = connected, 2 = connecting, 3 = disconnecting, 0 = disconnected
    
    // Connection events for better debugging
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('ℹ️  Mongoose disconnected from DB');
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      codeName: error.codeName,
      errorLabels: error.errorLabels
    });
    // Don't exit the process here, let the server handle it
    throw error;
  }
};

module.exports = connectDB;