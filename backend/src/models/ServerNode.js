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
    instanceId: {
      type: String,
      default: '',
    },
    privateIp: {
      type: String,
      default: '',
    },
    availabilityZone: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      enum: ['running', 'stopped', 'pending', 'shutting-down', 'terminated'],
      default: 'running',
    },
    costPerHour: {
      type: Number,
      default: 0.0104, // Default t3.micro price
    },
    monthlyEstimatedCost: {
      type: Number,
      default: 7.5,
    },
    isWastingCost: {
      type: Boolean,
      default: false,
    },
    costWastageReason: {
      type: String,
      default: '',
    },
    securityRisks: [
      {
        port: Number,
        protocol: String,
        severity: {
          type: String,
          enum: ['critical', 'high', 'medium', 'low', 'info'],
          default: 'medium',
        },
        description: String,
      },
    ],
    securityScore: {
      type: Number,
      default: 95,
      min: 0,
      max: 100,
    },
    agentToken: {
      type: String,
      default: '',
      index: true,
    },
    lastHeartbeat: {
      type: Date,
      default: null,
    },
    connectionType: {
      type: String,
      enum: ['aws_cloudwatch_iam', 'curl_bash_agent', 'manual_ip', 'local_host'],
      default: 'manual_ip',
    },
    cloudWatchMetrics: {
      networkInBytes: { type: Number, default: 0 },
      networkOutBytes: { type: Number, default: 0 },
      statusCheckFailed: { type: Number, default: 0 },
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
