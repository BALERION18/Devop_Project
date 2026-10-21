import mongoose from 'mongoose';

const serverMetricSchema = new mongoose.Schema(
  {
    serverName: {
      type: String,
      default: 'EC2-Production-Host',
    },
    cpuUsagePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    memory: {
      totalBytes: Number,
      usedBytes: Number,
      freeBytes: Number,
      usagePercent: Number,
    },
    disk: {
      totalBytes: Number,
      usedBytes: Number,
      freeBytes: Number,
      usagePercent: Number,
      available: Boolean,
    },
    loadAverage: [Number],
    uptimeSeconds: Number,
    isContainer: {
      type: Boolean,
      default: false,
    },
    platform: String,
    arch: String,
    hostname: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
      expires: '7d', // Automatic 7-day TTL cleanup
    },
  },
  {
    timestamps: true,
  }
);

export const ServerMetric = mongoose.model('ServerMetric', serverMetricSchema);
