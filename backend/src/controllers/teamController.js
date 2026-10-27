import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { getDBStatus } from '../config/db.js';
import { normalizeRole } from './authController.js';
import bcrypt from 'bcryptjs';

// In-Memory fallback team cache
let inMemoryTeams = {};

export const getTeam = async (req, res, next) => {
  try {
    const dbStatus = getDBStatus();
    const teamId = req.user.teamId || req.user._id?.toString() || req.user.id;

    if (!dbStatus.isConnected) {
      if (!inMemoryTeams[teamId]) {
        inMemoryTeams[teamId] = [
          {
            _id: req.user.id || 'current_user',
            name: req.user.name || 'Project Leader',
            email: req.user.email,
            role: 'leader',
            teamId,
            lastLogin: new Date(),
            createdAt: new Date(),
          },
        ];
      }
      return res.status(200).json({ success: true, team: inMemoryTeams[teamId] });
    }

    // Atlas Connected: Only return members that belong to THIS user's team!
    let team = await User.find({ teamId }).select('-password').sort({ createdAt: -1 });

    // If no team members found with teamId (e.g. legacy user), self-heal and assign current user's teamId
    if (team.length === 0) {
      const currentUserDoc = await User.findById(req.user._id);
      if (currentUserDoc) {
        currentUserDoc.teamId = currentUserDoc._id.toString();
        currentUserDoc.role = normalizeRole(currentUserDoc.role);
        await currentUserDoc.save();
        team = [currentUserDoc];
      }
    }

    const normalizedTeam = team.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: normalizeRole(u.role),
      teamId: u.teamId,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
    }));

    res.status(200).json({ success: true, team: normalizedTeam });
  } catch (err) {
    next(err);
  }
};

export const addTeammate = async (req, res, next) => {
  try {
    const { name, email, role = 'teammate', password = 'Password123!' } = req.body;
    const teamId = req.user.teamId || req.user._id?.toString() || req.user.id;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required to add a teammate.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const validRole = role === 'leader' ? 'leader' : 'teammate';
    const dbStatus = getDBStatus();

    if (!dbStatus.isConnected) {
      if (!inMemoryTeams[teamId]) inMemoryTeams[teamId] = [];
      const existing = inMemoryTeams[teamId].find((u) => u.email === normalizedEmail);
      if (existing) {
        return res.status(409).json({ success: false, message: 'A teammate with this email already exists.' });
      }

      const newMember = {
        _id: 'mem_' + Date.now(),
        name,
        email: normalizedEmail,
        role: validRole,
        teamId,
        lastLogin: null,
        createdAt: new Date(),
      };
      inMemoryTeams[teamId].push(newMember);

      return res.status(201).json({
        success: true,
        message: `Teammate ${name} added to your project team as ${validRole.toUpperCase()}.`,
        member: newMember,
      });
    }

    // Atlas Connected
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      // If user exists, attach them to this team if they aren't already
      if (existingUser.teamId === teamId) {
        return res.status(409).json({ success: false, message: 'This teammate is already in your team.' });
      }
      existingUser.teamId = teamId;
      existingUser.role = validRole;
      await existingUser.save();

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

    const newTeammate = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: validRole,
      teamId,
    });

    await AuditLog.create({
      actor: { name: req.user.name, email: req.user.email },
      action: 'MEMBER_ROLE_UPDATED',
      target: name,
      details: `Added new ${validRole} (${normalizedEmail}) to project team`,
    });

    res.status(201).json({
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
    next(err);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const teamId = req.user.teamId || req.user._id?.toString() || req.user.id;

    if (!['leader', 'teammate'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be either leader or teammate.' });
    }

    const dbStatus = getDBStatus();
    if (!dbStatus.isConnected) {
      const teamList = inMemoryTeams[teamId] || [];
      const member = teamList.find((u) => u._id === id);
      if (!member) {
        return res.status(404).json({ success: false, message: 'Teammate not found in your team.' });
      }
      member.role = role;
      return res.status(200).json({
        success: true,
        message: `Updated role of ${member.name} to ${role.toUpperCase()}.`,
        member,
      });
    }

    // Atlas Connected: Ensure the target user belongs to caller's team
    const member = await User.findOne({ _id: id, teamId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Teammate not found in your project team.' });
    }

    member.role = role;
    await member.save();

    await AuditLog.create({
      actor: { name: req.user.name, email: req.user.email },
      action: 'MEMBER_ROLE_UPDATED',
      target: member.name,
      details: `Changed role to ${role.toUpperCase()}`,
    });

    res.status(200).json({
      success: true,
      message: `Updated role of ${member.name} to ${role.toUpperCase()}.`,
      member: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role,
        teamId,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTeammate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teamId = req.user.teamId || req.user._id?.toString() || req.user.id;

    if (id === req.user._id?.toString() || id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot remove yourself from your own team.' });
    }

    const dbStatus = getDBStatus();
    if (!dbStatus.isConnected) {
      if (inMemoryTeams[teamId]) {
        inMemoryTeams[teamId] = inMemoryTeams[teamId].filter((u) => u._id !== id);
      }
      return res.status(200).json({ success: true, message: 'Teammate removed from your team.' });
    }

    const member = await User.findOne({ _id: id, teamId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Teammate not found in your project team.' });
    }

    await User.findByIdAndDelete(id);

    await AuditLog.create({
      actor: { name: req.user.name, email: req.user.email },
      action: 'SERVER_NODE_REMOVED',
      target: member.name,
      details: `Removed teammate ${member.name} (${member.email}) from project team`,
    });

    res.status(200).json({ success: true, message: `Teammate ${member.name} removed from your project team.` });
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const dbStatus = getDBStatus();
    if (!dbStatus.isConnected) {
      return res.status(200).json({ success: true, logs: [] });
    }

    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(30);
    res.status(200).json({ success: true, logs });
  } catch (err) {
    next(err);
  }
};
