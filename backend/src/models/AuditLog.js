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
        'AWS_FLEET_SYNCED',
        'EC2_ACTION_REBOOT',
        'EC2_ACTION_STOP',
        'EC2_ACTION_START',
        'SECURITY_AUDIT_RUN',
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
    teamId: {
      type: String,
      default: '',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
