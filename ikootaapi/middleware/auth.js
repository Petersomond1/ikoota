// middleware/auth.js - COMPLETE AUTHENTICATION MIDDLEWARE
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

// Enhanced authentication middleware with database verification
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    
    if (!decoded.user_id) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token: missing user ID'
      });
    }

    // CORRECT: MySQL syntax with ? and correct field names
    const result = await db.query(`
      SELECT id, username, email, role, membership_stage, is_member, isbanned
      FROM users 
      WHERE id = ?
    `, [decoded.user_id]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    // CORRECT: Check isbanned field
    if (user.isbanned) {
      return res.status(403).json({
        success: false,
        error: 'Account is banned'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      membership_stage: user.membership_stage,
      is_member: user.is_member
    };

    next();
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Membership level requirement middleware
export const requireMembership = (allowedLevels) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedLevels.includes(req.user.membership_stage)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required membership level: ${allowedLevels.join(' or ')}`,
        user_level: req.user.membership_stage
      });
    }

    next();
  };
};