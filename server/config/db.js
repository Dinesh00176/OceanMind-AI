const mongoose = require('mongoose');

let isConnected = false;

/**
 * Validates the MongoDB connection URI format.
 * Supports both standard mongodb:// and SRV mongodb+srv:// (Atlas).
 */
const validateMongoURI = (uri) => {
  if (!uri || typeof uri !== 'string') {
    return {
      valid: false,
      error: 'MONGODB_URI is not defined. Please set MONGODB_URI in your environment variables.',
    };
  }
  const trimmed = uri.trim();
  if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
    return {
      valid: false,
      error: 'Invalid MONGODB_URI format. URI must begin with "mongodb://" or "mongodb+srv://". For MongoDB Atlas, use: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority',
    };
  }
  return { valid: true, uri: trimmed };
};

/**
 * Centralized MongoDB connection module.
 * Optimized for MongoDB Atlas production deployment with connection pooling,
 * keep-alive, retry logic, connection reuse, and zero credential exposure.
 */
const connectDB = async () => {
  // If already connected, reuse existing mongoose connection
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose.connection;
  }

  const rawURI = process.env.MONGODB_URI;
  const validation = validateMongoURI(rawURI);

  if (!validation.valid) {
    console.error(`\n[Database Configuration Error] ${validation.error}\n`);
    if (process.env.NODE_ENV === 'production') {
      // In production, fail immediately if database configuration is missing
      process.exit(1);
    } else {
      console.warn('[Database Notice] Falling back to local MongoDB for development if available.');
    }
  }

  const mongoURI = validation.valid ? validation.uri : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/argo_ocean_db');

  const options = {
    // MongoDB Atlas recommended production settings
    maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE, 10) || 10,
    minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE, 10) || 2,
    serverSelectionTimeoutMS: 10000, // 10s timeout for initial cluster selection
    socketTimeoutMS: 45000,         // Close sockets after 45s of inactivity
    heartbeatFrequencyMS: 10000,    // Health check heartbeat every 10s
  };

  try {
    const conn = await mongoose.connect(mongoURI, options);
    isConnected = true;

    // Mask any potential credentials from log output
    const hostDisplay = conn.connection.host || 'cluster';
    const dbName = conn.connection.name || 'default';
    const isAtlas = mongoURI.includes('mongodb+srv://') || mongoURI.includes('.mongodb.net');

    console.log(`[Database] ${isAtlas ? 'MongoDB Atlas' : 'MongoDB'} Connected successfully.`);
    console.log(`[Database Target] Host: ${hostDisplay} | Database: ${dbName}`);

    // Register lifecycle event listeners
    mongoose.connection.on('error', (err) => {
      console.error('[Database Event Error]', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[Database Event Warning] MongoDB connection lost. Attempting automatic reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      console.log('[Database Event Info] MongoDB reconnected successfully.');
    });

    return conn;
  } catch (error) {
    console.error(`\n[Database Connection Failure] Unable to connect to MongoDB:\n  ${error.message}`);
    console.error('Troubleshooting Tips:');
    console.error(' 1. Verify your MONGODB_URI environment variable format.');
    console.error(' 2. In MongoDB Atlas, ensure Network Access allows your IP (Add IP Address: 0.0.0.0/0 for cloud deployments).');
    console.error(' 3. Confirm Database User credentials and permissions (readWrite on target database).\n');

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Returns the current database connection status without exposing sensitive credentials.
 */
const getDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const stateCode = mongoose.connection.readyState;
  return {
    state: states[stateCode] || 'unknown',
    isConnected: stateCode === 1,
    database: mongoose.connection.name || null,
  };
};

module.exports = connectDB;
module.exports.getDBStatus = getDBStatus;
