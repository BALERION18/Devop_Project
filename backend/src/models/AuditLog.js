import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      name: { type: String, default: 'DevOps Lead' },
      email: { type: String, default: 'admin@devopshub.io' },
    },
    action: {
      type: String,
      required: true,
      enum: [
        'DEPLOYMENT_TRIGGERED',
        'DEPLOYMENT_ROLLED_BACK',
        'SERVER_NODE_ADDED',
        'SERVER_NODE_REMOVED',
        'MONITOR_CREATED',
        'MEMBER_ROLE_UPDATED',
        'DIAGNOSTIC_COMMAND_EXECUTED',
      ],
    },
    target: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['success', 'warning', 'error'],
      default: 'success',
    },
  },
  {
    timestamps: true,
  }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
