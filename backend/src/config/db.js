import mongoose from 'mongoose';
import { config } from './env.js';

let connectionError = null;

export const connectDB = async () => {
  if (!config.mongodbUri) {
    connectionError = 'MONGODB_URI is not set in environment variables.';
    console.warn(`[MongoDB Warning] ${connectionError}`);
    return false;
  }

  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    connectionError = null;
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}, Database: ${conn.connection.name}`);

    mongoose.connection.on('connected', () => {
      console.log('[MongoDB Event] Connection active');
      connectionError = null;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB Event] Reconnection established');
      connectionError = null;
    });

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB Event Error]', err.message);
      connectionError = err.message;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB Event Disconnected] Lost connection to MongoDB Atlas');
    });

    return true;
  } catch (err) {
    connectionError = err.message;
    console.error(`[MongoDB Connection Error] Failed to connect: ${err.message}`);
    return false;
  }
};

export const getDBStatus = () => {
  const isActuallyConnected = mongoose.connection.readyState === 1;
  return {
    isConnected: isActuallyConnected,
    readyState: mongoose.connection.readyState,
    readyStateText: ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][mongoose.connection.readyState] || 'Unknown',
    databaseName: mongoose.connection.name || 'devopshub',
    host: mongoose.connection.host || 'MongoDB Atlas',
    error: isActuallyConnected ? null : connectionError,
  };
};
