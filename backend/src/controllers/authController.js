import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { getDBStatus } from '../config/db.js';

// In-memory fallback cache when Atlas is not yet connected
const inMemoryUsers = [];

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

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

      const user = await User.create({
        name,
        email: normalizedEmail,
        password,
        role: role || 'devops_engineer',
        lastLogin: new Date(),
      });

      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully in MongoDB Atlas.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
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
    const memoryUser = {
      id: 'mem_' + Date.now(),
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'devops_engineer',
      lastLogin: new Date(),
      createdAt: new Date(),
    };
    inMemoryUsers.push(memoryUser);

    const token = generateToken(memoryUser);

    return res.status(201).json({
      success: true,
      message: 'Account created in local session (Connect MongoDB Atlas in Settings to persist permanently).',
      token,
      isInMemoryMode: true,
      user: {
        id: memoryUser.id,
        name: memoryUser.name,
        email: memoryUser.email,
        role: memoryUser.role,
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
          role: user.role,
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
        name: 'DevOps Engineer',
        email: normalizedEmail,
        role: 'admin',
        lastLogin: new Date(),
      };
      const token = generateToken(demoUser);
      return res.status(200).json({
        success: true,
        message: 'Signed in as Demo DevOps Lead (In-Memory session).',
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
        role: memoryUser.role,
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
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};
