import mongoose from 'mongoose';

const deploymentSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
      default: 'devopshub-app',
      trim: true,
    },
    environment: {
      type: String,
      enum: ['production', 'staging', 'development'],
      default: 'production',
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'in_progress', 'queued', 'cancelled'],
      default: 'queued',
      index: true,
    },
    branch: {
      type: String,
      required: true,
      default: 'main',
    },
    commitSha: {
      type: String,
      required: true,
      default: 'HEAD',
      trim: true,
    },
    commitMessage: {
      type: String,
      default: 'Manual deployment trigger',
    },
    author: {
      type: String,
      default: 'DevOps System',
    },
    triggeredBy: {
      type: String,
      default: 'system',
    },
    workflowRunId: {
      type: String,
      default: null,
    },
    workflowRunUrl: {
      type: String,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        step: String,
        message: String,
        status: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
      },
    ],
    deployedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
deploymentSchema.index({ createdAt: -1 });
deploymentSchema.index({ status: 1, createdAt: -1 });

export const Deployment = mongoose.model('Deployment', deploymentSchema);
