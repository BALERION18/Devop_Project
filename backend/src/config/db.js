import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;
let connectionError = null;

export const connectDB = async () => {
  if (!config.mongodbUri) {
    connectionError = 'MONGODB_URI is not set in environment variables. Running in disconnected/memory mode.';
    console.warn(`[MongoDB Warning] ${connectionError}`);
    return false;
  }

  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    connectionError = null;
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}, Database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB Error]', err.message);
      isConnected = false;
      connectionError = err.message;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB Disconnected] Lost connection to MongoDB Atlas');
      isConnected = false;
    });

    return true;
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    console.error(`[MongoDB Connection Error] Failed to connect: ${err.message}`);
    return false;
  }
};

export const getDBStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    readyStateText: ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][mongoose.connection.readyState] || 'Unknown',
    databaseName: mongoose.connection.name || 'Not Connected',
    host: mongoose.connection.host || 'Not Connected',
    error: connectionError,
  };
};
