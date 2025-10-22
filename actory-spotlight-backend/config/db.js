const mongoose = require('mongoose');

const connectDB = async () => {
  console.log('🔍 Attempting to connect to MongoDB...');
  console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Found' : '❌ Missing');

  const options = {
    family: 4, // Prefer IPv4
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10, // Maximum number of connections in the connection pool
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    connectTimeoutMS: 10000, // Fail fast if initial connection takes too long
  };

  const primaryUri = process.env.MONGODB_URI;
  const seedlistUri = process.env.MONGODB_URI_SEEDLIST; // optional fallback without SRV

  try {
    console.log('⏳ Connecting to MongoDB with options:', JSON.stringify(options, null, 2));
    const conn = await mongoose.connect(primaryUri, options);
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
    // If SRV lookup fails (common on restricted DNS), optionally retry using a seedlist URI
    const looksLikeSrv = typeof primaryUri === 'string' && primaryUri.startsWith('mongodb+srv://');
    const isSrvResolutionIssue = error && (error.code === 'ECONNREFUSED' || error.name === 'MongoServerSelectionError');
    if (looksLikeSrv && isSrvResolutionIssue && seedlistUri) {
      console.warn('⚠️ SRV lookup failed. Retrying with non-SRV seedlist URI from MONGODB_URI_SEEDLIST...');
      try {
        const conn = await mongoose.connect(seedlistUri, options);
        console.log(`✅ MongoDB Connected via seedlist: ${conn.connection.host}`);
        return conn;
      } catch (fallbackErr) {
        console.error('❌ Fallback connection using MONGODB_URI_SEEDLIST also failed:', fallbackErr.message);
        console.error('Fallback details:', {
          name: fallbackErr.name,
          code: fallbackErr.code,
          codeName: fallbackErr.codeName,
          errorLabels: fallbackErr.errorLabels
        });
        throw fallbackErr;
      }
    }

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