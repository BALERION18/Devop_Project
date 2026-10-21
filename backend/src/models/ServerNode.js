import mongoose from 'mongoose';

const serverNodeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      enum: ['AWS EC2', 'Google Cloud', 'DigitalOcean', 'Azure', 'On-Premise Bare-Metal'],
      default: 'AWS EC2',
    },
    instanceType: {
      type: String,
      default: 't3.micro',
    },
    region: {
      type: String,
      default: 'ap-south-1 (Mumbai)',
    },
    environment: {
      type: String,
      enum: ['production', 'staging', 'development'],
      default: 'production',
    },
    status: {
      type: String,
      enum: ['healthy', 'degraded', 'offline'],
      default: 'healthy',
    },
    healthEndpoint: {
      type: String,
      default: '',
    },
    cpuUsagePercent: {
      type: Number,
      default: 0,
    },
    memoryUsagePercent: {
      type: Number,
      default: 0,
    },
    diskUsagePercent: {
      type: Number,
      default: 0,
    },
    uptimeSeconds: {
      type: Number,
      default: 0,
    },
    isCurrentHost: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    createdBy: {
      type: String,
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

export const ServerNode = mongoose.model('ServerNode', serverNodeSchema);
