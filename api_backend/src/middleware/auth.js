import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { sendError } from '../utils/responseHelper.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return sendError(res, 'Access denied. No token provided.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'password_reset_token', 'email_verification_token'] }
    });
    
    if (!user || !user.is_active) {
      return sendError(res, 'Invalid token.', 401);
    }

    if (!user.email_verified) {
      return sendError(res, 'Please verify your email address.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired.', 401);
    }
    sendError(res, 'Invalid token.', 401);
  }
};

export const checkSubscription = (requiredPlan = 'free') => {
  return (req, res, next) => {
    const user = req.user;
    
    const planLevels = { free: 1, pro: 2, agency: 3 };
    const userLevel = planLevels[user.subscription_plan] || 0;
    const requiredLevel = planLevels[requiredPlan] || 0;
    
    if (userLevel < requiredLevel) {
      return sendError(res, 'Upgrade your subscription to access this feature.', 403);
    }
    
    // Check if subscription is expired (except for free tier)
    if (user.subscription_plan !== 'free' && user.subscription_expires && new Date() > user.subscription_expires) {
      return sendError(res, 'Your subscription has expired.', 403);
    }
    
    next();
  };
};

// Optional auth - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'password_reset_token', 'email_verification_token'] }
      });
      
      if (user && user.is_active) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};
