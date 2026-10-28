import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { getDBStatus } from '../config/db.js';
import { normalizeRole } from './authController.js';

export const getTeam = async (req, res, next) => {
  try {
    const callerId = req.user?._id?.toString() || req.user?.id;
    let teamId = req.user?.teamId;

    // If caller has no teamId, set it to caller's own id so they own a workspace
    if (!teamId || teamId === 'default_team') {
      teamId = callerId;
      if (callerId && mongoose.isValidObjectId(callerId)) {
        await User.findByIdAndUpdate(callerId, { teamId });
      }
    }

    // Comprehensive query that links all team collaborators:
    // 1. All users whose teamId matches this workspace teamId
    // 2. The project Leader whose _id matches teamId (if teamId is a user id)
    // 3. The caller themselves
    const matchConditions = [{ teamId }];
    if (teamId && mongoose.isValidObjectId(teamId)) {
      matchConditions.push({ _id: new mongoose.Types.ObjectId(teamId) });
    }
    if (callerId && mongoose.isValidObjectId(callerId)) {
      matchConditions.push({ _id: new mongoose.Types.ObjectId(callerId) });
    }

    let team = await User.find({ $or: matchConditions })
      .select('-password')
      .sort({ role: 1, createdAt: 1 });

    // Deduplicate in case condition matched multiple
    const seen = new Set();
    const uniqueTeam = [];
    for (const member of team) {
      const idStr = member._id.toString();
      if (!seen.has(idStr)) {
        seen.add(idStr);
        uniqueTeam.push(member);
      }
    }

    // Fallback if DB returns empty
    if (uniqueTeam.length === 0) {
      uniqueTeam.push({
        _id: callerId || 'current_user',
        name: req.user?.name || 'Project Leader',
        email: req.user?.email || 'leader@devopshub.io',
        role: normalizeRole(req.user?.role || 'leader'),
        teamId,
        createdAt: new Date(),
      });
    }

    const normalizedTeam = uniqueTeam.map((u) => ({
      _id: u._id || u.id,
      name: u.name,
      email: u.email,
      role: normalizeRole(u.role),
      teamId: u.teamId || teamId,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
    }));

    return res.status(200).json({ success: true, team: normalizedTeam });
  } catch (err) {
    console.error('[Team Controller Error in getTeam]:', err);
    const fallbackMember = {
      _id: req.user?._id || req.user?.id || 'current_user',
      name: req.user?.name || 'Project Leader',
      email: req.user?.email || 'admin@devopshub.io',
      role: 'leader',
      teamId: req.user?.teamId || 'default_team',
      lastLogin: new Date(),
      createdAt: new Date(),
    };
    return res.status(200).json({ success: true, team: [fallbackMember] });
  }
};

export const addTeammate = async (req, res, next) => {
  try {
    const { name, email, role = 'teammate', password = 'Password123!' } = req.body;
    const callerId = req.user?._id?.toString() || req.user?.id;
    let teamId = req.user?.teamId;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required to add a teammate.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const validRole = role === 'leader' ? 'leader' : 'teammate';

    // If caller has no teamId yet, set caller's teamId to callerId and save to DB
    if (!teamId || teamId === 'default_team') {
      teamId = callerId || 'team_' + Date.now();
      if (callerId && mongoose.isValidObjectId(callerId)) {
        await User.findByIdAndUpdate(callerId, { teamId });
      }
      if (req.user) req.user.teamId = teamId;
    }

    // Check if user with this email already exists in MongoDB Atlas
    let existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      // Re-link existing account to this caller's team and assign the requested role
      existingUser.teamId = teamId;
      existingUser.role = validRole;
      await existingUser.save();

      try {
        await AuditLog.create({
          teamId,
          actor: { name: req.user?.name || 'Leader', email: req.user?.email || 'leader@devopshub.io' },
          action: 'MEMBER_ROLE_UPDATED',
          target: existingUser.name,
          details: `Linked existing account (${normalizedEmail}) to project team as ${validRole.toUpperCase()}`,
        });
      } catch (auditErr) {
        console.warn('[Add Teammate] AuditLog warning:', auditErr.message);
      }

      return res.status(200).json({
        success: true,
        message: `Teammate ${existingUser.name} added to your team as ${validRole.toUpperCase()}.`,
        member: {
          _id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: validRole,
          teamId,
        },
      });
    }

    // Create brand new teammate in MongoDB Atlas
    const newTeammate = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: validRole,
      teamId,
    });

    try {
      await AuditLog.create({
        teamId,
        actor: { name: req.user?.name || 'Leader', email: req.user?.email || 'leader@devopshub.io' },
        action: 'MEMBER_ROLE_UPDATED',
        target: name,
        details: `Created new ${validRole} (${normalizedEmail}) for project team`,
      });
    } catch (auditErr) {
      console.warn('[Add Teammate] AuditLog warning:', auditErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Teammate ${name} added to your project team as ${validRole.toUpperCase()}.`,
      member: {
        _id: newTeammate._id,
        name: newTeammate.name,
        email: newTeammate.email,
        role: validRole,
        teamId,
      },
    });
  } catch (err) {
    console.error('[Add Teammate Error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to add teammate.' });
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['leader', 'teammate'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be either leader or teammate.' });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid teammate ID.' });
    }

    const member = await User.findById(id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Teammate not found in your team.' });
    }

    member.role = role;
    await member.save();

    try {
      await AuditLog.create({
        teamId: member.teamId || req.user?.teamId,
        actor: { name: req.user?.name || 'Leader', email: req.user?.email || 'leader@devopshub.io' },
        action: 'MEMBER_ROLE_UPDATED',
        target: member.name,
        details: `Changed role to ${role.toUpperCase()}`,
      });
    } catch (auditErr) {
      console.warn('[Update Role] AuditLog warning:', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Updated role of ${member.name} to ${role.toUpperCase()}.`,
      member: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role,
        teamId: member.teamId,
      },
    });
  } catch (err) {
    console.error('[Update Role Error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to update role.' });
  }
};

export const deleteTeammate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const callerId = req.user?._id?.toString() || req.user?.id;

    if (id === callerId) {
      return res.status(400).json({ success: false, message: 'You cannot remove yourself from your own team.' });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid teammate ID.' });
    }

    const member = await User.findById(id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Teammate not found in your project team.' });
    }

    await User.findByIdAndDelete(id);

    try {
      await AuditLog.create({
        teamId: member.teamId || callerId,
        actor: { name: req.user?.name || 'Leader', email: req.user?.email || 'leader@devopshub.io' },
        action: 'SERVER_NODE_REMOVED',
        target: member.name,
        details: `Removed teammate ${member.name} (${member.email}) from project team`,
      });
    } catch (auditErr) {
      console.warn('[Delete Teammate] AuditLog warning:', auditErr.message);
    }

    return res.status(200).json({ success: true, message: `Teammate ${member.name} removed from your project team.` });
  } catch (err) {
    console.error('[Delete Teammate Error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to remove teammate.' });
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const callerId = req.user?._id?.toString() || req.user?.id;
    const teamId = req.user?.teamId || callerId;

    // Strict multi-tenant isolation: Only fetch logs for THIS team workspace
    const conditions = [];
    if (teamId) {
      conditions.push({ teamId });
      if (mongoose.isValidObjectId(teamId)) {
        conditions.push({ teamId: new mongoose.Types.ObjectId(teamId) });
      }
    }
    if (req.user?.email) {
      conditions.push({ 'actor.email': req.user.email.toLowerCase().trim() });
    }

    const query = conditions.length > 0 ? { $or: conditions } : { teamId: 'none' };
    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(30);
    return res.status(200).json({ success: true, logs: logs || [] });
  } catch (err) {
    console.warn('[Audit Logs Error]:', err.message);
    return res.status(200).json({ success: true, logs: [] });
  }
};
