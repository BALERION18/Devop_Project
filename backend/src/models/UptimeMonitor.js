import mongoose from 'mongoose';

const uptimeMonitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'HEAD'],
      default: 'GET',
    },
    intervalSeconds: {
      type: Number,
      default: 60,
    },
    status: {
      type: String,
      enum: ['up', 'down', 'degraded'],
      default: 'up',
    },
    lastLatencyMs: {
      type: Number,
      default: 0,
    },
    uptimePercent: {
      type: Number,
      default: 100,
    },
    lastChecked: {
      type: Date,
      default: Date.now,
    },
    history: [
      {
        timestamp: { type: Date, default: Date.now },
        statusCode: Number,
        latencyMs: Number,
        status: { type: String, enum: ['up', 'down'] },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const UptimeMonitor = mongoose.model('UptimeMonitor', uptimeMonitorSchema);
