import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { getDBStatus } from '../config/db.js';

// In-memory fallback cache when Atlas is not yet connected
const inMemoryUsers = [];

export const normalizeRole = (role) => {
  if (role === 'admin' || role === 'leader') return 'leader';
  return 'teammate';
};

const generateToken = (user) => {
  const role = normalizeRole(user.role);
  const teamId = user.teamId || (user._id ? user._id.toString() : user.id);
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role,
      teamId,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, teamId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const dbStatus = getDBStatus();
    const normalizedEmail = email.toLowerCase().trim();

    if (dbStatus.isConnected) {
      // Real MongoDB Atlas Storage
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'A user with this email address already exists.',
        });
      }

      // New user signup is always a project Leader with their own isolated workspace
      const user = new User({
        name,
        email: normalizedEmail,
        password,
        role: teamId ? 'teammate' : 'leader',
        lastLogin: new Date(),
      });
      user.teamId = teamId || user._id.toString();
      await user.save();

      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully in MongoDB Atlas. You are the project Leader.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: normalizeRole(user.role),
          teamId: user.teamId,
          createdAt: user.createdAt,
        },
      });
    }

    // In-Memory Dev / Offline Mode Fallback
    const existingMemoryUser = inMemoryUsers.find((u) => u.email === normalizedEmail);
    if (existingMemoryUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists in session.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const memId = 'mem_' + Date.now();
    const memoryUser = {
      id: memId,
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: teamId ? 'teammate' : 'leader',
      teamId: teamId || memId,
      lastLogin: new Date(),
      createdAt: new Date(),
    };
    inMemoryUsers.push(memoryUser);

    const token = generateToken(memoryUser);

    return res.status(201).json({
      success: true,
      message: 'Account created in local session. You are the project Leader.',
      token,
      isInMemoryMode: true,
      user: {
        id: memoryUser.id,
        name: memoryUser.name,
        email: memoryUser.email,
        role: normalizeRole(memoryUser.role),
        teamId: memoryUser.teamId,
        createdAt: memoryUser.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const dbStatus = getDBStatus();
    const normalizedEmail = email.toLowerCase().trim();

    if (dbStatus.isConnected) {
      // Real MongoDB Atlas verification
      const user = await User.findOne({ email: normalizedEmail }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      if (!user.teamId) {
        user.teamId = user._id.toString();
      }
      user.role = normalizeRole(user.role);
      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user);

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: normalizeRole(user.role),
          teamId: user.teamId,
          lastLogin: user.lastLogin,
        },
      });
    }

    // In-memory or Default Demo Account
    let memoryUser = inMemoryUsers.find((u) => u.email === normalizedEmail);

    // If demo account entered
    if (!memoryUser && (normalizedEmail === 'demo@devopshub.io' || normalizedEmail === 'admin@devopshub.com')) {
      const demoUser = {
        id: 'demo_user_01',
        name: 'Project Leader',
        email: normalizedEmail,
        role: 'leader',
        teamId: 'team_demo_01',
        lastLogin: new Date(),
      };
      const token = generateToken(demoUser);
      return res.status(200).json({
        success: true,
        message: 'Signed in as Demo Project Leader (In-Memory session).',
        token,
        isInMemoryMode: true,
        user: demoUser,
      });
    }

    if (!memoryUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. (Hint: Use demo@devopshub.io with any password or sign up)',
      });
    }

    const isMatch = await bcrypt.compare(password, memoryUser.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    memoryUser.lastLogin = new Date();
    memoryUser.role = normalizeRole(memoryUser.role);
    const token = generateToken(memoryUser);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      isInMemoryMode: true,
      user: {
        id: memoryUser.id,
        name: memoryUser.name,
        email: memoryUser.email,
        role: normalizeRole(memoryUser.role),
        teamId: memoryUser.teamId,
        lastLogin: memoryUser.lastLogin,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id || req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: normalizeRole(req.user.role),
        teamId: req.user.teamId,
      },
    });
  } catch (err) {
    next(err);
  }
};
