import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token is missing.',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Check if user still exists if database is connected
    try {
      let user = null;
      if (decoded.id && mongoose.isValidObjectId(decoded.id)) {
        user = await User.findById(decoded.id).select('-password');
      } else if (decoded.email) {
        user = await User.findOne({ email: decoded.email.toLowerCase().trim() }).select('-password');
      }

      if (user) {
        if (!user.teamId) {
          user.teamId = user._id.toString();
          await user.save();
        }
        if (user.role === 'admin') user.role = 'leader';
        else if (user.role === 'devops_engineer' || user.role === 'viewer') user.role = 'teammate';
        req.user = user;
        return next();
      }
    } catch {
      // If DB read fails, fall back to decoded token payload
    }

    req.user = {
      _id: decoded.id,
      email: decoded.email,
      name: decoded.name || 'DevOps User',
      role: decoded.role === 'admin' ? 'leader' : decoded.role || 'leader',
      teamId: decoded.teamId || decoded.id,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
    });
  }
};
