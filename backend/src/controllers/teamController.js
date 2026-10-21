import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { getDBStatus } from '../config/db.js';

let inMemoryTeam = [
  {
    _id: 'user_1',
    name: 'Divyansh Lead',
    email: 'divyansh@devopshub.io',
    role: 'admin',
    lastLogin: new Date(),
    createdAt: new Date(),
  },
  {
    _id: 'user_2',
    name: 'Sarah Connor',
    email: 'sarah@devopshub.io',
    role: 'devops_engineer',
    lastLogin: new Date(Date.now() - 86400000),
    createdAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    _id: 'user_3',
    name: 'James Wilson',
    email: 'james@devopshub.io',
    role: 'viewer',
    lastLogin: new Date(Date.now() - 172800000),
    createdAt: new Date(Date.now() - 86400000 * 12),
  },
];

let inMemoryLogs = [
  {
    _id: 'log_1',
    actor: { name: 'Divyansh Lead', email: 'divyansh@devopshub.io' },
    action: 'DEPLOYMENT_TRIGGERED',
    target: 'devopshub-app',
    details: 'Initiated production build for commit 9b2c3a1 to AWS EC2 Host',
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    _id: 'log_2',
    actor: { name: 'Divyansh Lead', email: 'divyansh@devopshub.io' },
    action: 'SERVER_NODE_ADDED',
    target: 'EC2-Staging-Cluster',
    details: 'Configured staging node in ap-south-1',
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    _id: 'log_3',
    actor: { name: 'Sarah Connor', email: 'sarah@devopshub.io' },
    action: 'MONITOR_CREATED',
    target: 'Backend API Health Probe',
    details: 'Added synthetic health probe for /api/health (15s interval)',
    createdAt: new Date(Date.now() - 14400000),
  },
];

export const getTeam = async (req, res, next) => {
  try {
    const dbStatus = getDBStatus();
    if (!dbStatus.isConnected) {
      return res.status(200).json({ success: true, team: inMemoryTeam });
    }

    const team = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, team });
  } catch (err) {
    next(err);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowed = ['admin', 'devops_engineer', 'viewer'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const dbStatus = getDBStatus();
    if (!dbStatus.isConnected) {
      const member = inMemoryTeam.find((u) => u._id === id);
      if (member) member.role = role;
      return res.status(200).json({ success: true, message: 'Role updated in session.', member });
    }

    const member = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
    res.status(200).json({ success: true, message: 'Role updated successfully.', member });
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const dbStatus = getDBStatus();
    if (!dbStatus.isConnected) {
      return res.status(200).json({ success: true, logs: inMemoryLogs });
    }

    const count = await AuditLog.countDocuments();
    if (count === 0) {
      await AuditLog.create(inMemoryLogs.map(({ _id, ...rest }) => rest));
    }

    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(30);
    res.status(200).json({ success: true, logs });
  } catch (err) {
    next(err);
  }
};
