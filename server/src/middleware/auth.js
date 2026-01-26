import { findUserByClerkId } from '../models/User.js';
import logger from '../config/logger.js';

// Clerk authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    // Clerk user ID should be sent in header from frontend
    const clerkUserId = req.headers['x-clerk-user-id'];
    
    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    // Find or sync user in our database
    let user = await findUserByClerkId(clerkUserId);
    
    if (!user) {
      // User not synced yet - frontend should call /users/sync first
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_SYNCED',
        message: 'User not found in database. Please sync user first.'
      });
    }

    req.userId = user.id;
    req.clerkUserId = clerkUserId;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication failed'
    });
  }
};
