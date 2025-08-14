// middleware/authMiddleware.js - UNIFIED AUTHENTICATION MIDDLEWARE
// This replaces all other auth middleware files for consistency
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

// ===============================================
// ENHANCED AUTHENTICATION MIDDLEWARE
// ===============================================

export const authenticate = async (req, res, next) => {
  try {
    console.log('🔍 Authentication middleware called');
    
    // Extract token from various sources
    let token = null;
    
    // Method 1: Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('✅ Token found in Authorization header');
    }
    
    // Method 2: Custom header
    if (!token && req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
      console.log('✅ Token found in x-auth-token header');
    }
    
    // Method 3: Cookies
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {});
      
      token = cookies.access_token || cookies.token;
      if (token) {
        console.log('✅ Token found in cookies');
      }
    }
    
    if (!token) {
      console.log('❌ No authentication token found');
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'No token provided',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('🔍 Token received (first 20 chars):', token.substring(0, 20) + '...');
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ JWT token verified successfully');
    console.log('👤 Decoded user info:', {
      user_id: decoded.user_id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    });
    
    // ✅ FIXED: Get fresh user data from database with proper MySQL handling
    const userResult = await db.query(`
      SELECT 
        id, username, email, role, is_member, membership_stage, 
        isbanned, is_verified, converse_id, application_ticket,
        full_membership_status, application_status
      FROM users 
      WHERE id = ?
    `, [decoded.user_id]);
    
    // ✅ FIXED: Handle MySQL result format (your database returns direct array)
    let users = [];
    if (Array.isArray(userResult)) {
      users = userResult;
    } else if (userResult && userResult.rows && Array.isArray(userResult.rows)) {
      users = userResult.rows;
    } else if (userResult && Array.isArray(userResult[0])) {
      users = userResult[0];
    }
    
    console.log('📊 Database query result:', {
      resultType: typeof userResult,
      isArray: Array.isArray(userResult),
      userCount: users.length,
      firstUser: users[0] ? 'found' : 'not found'
    });
    
    if (!users || users.length === 0) {
      console.log('❌ User not found in database:', decoded.user_id);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }
    
    const user = users[0];
    
    // Check if user is banned
    if (user.isbanned) {
      console.log('❌ User is banned:', user.email);
      return res.status(403).json({
        success: false,
        error: 'Account banned',
        message: 'Your account has been banned',
        timestamp: new Date().toISOString()
      });
    }
    
    // Add user to request object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_member: user.is_member,
      membership_stage: user.membership_stage,
      is_verified: user.is_verified,
      converse_id: user.converse_id,
      application_ticket: user.application_ticket,
      full_membership_status: user.full_membership_status,
      application_status: user.application_status,
      // Add decoded token data for compatibility
      user_id: decoded.user_id,
      token_role: decoded.role,
      token_membership_stage: decoded.membership_stage,
      token_is_member: decoded.is_member
    };
    
    console.log('✅ Authentication successful for user:', user.username);
    next();
    
  } catch (error) {
    console.error('❌ Authentication middleware error:', {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid token',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Token expired',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'Internal server error during authentication',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// ALTERNATIVE EXPORT NAME FOR COMPATIBILITY
// ===============================================
export const authenticateToken = authenticate;

// ===============================================
// OPTIONAL AUTHENTICATION (doesn't fail if no token)
// ===============================================
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || 
                 req.headers['x-auth-token'] || 
                 req.cookies?.access_token;
    
    if (!token) {
      console.log('⚠️ Optional auth: no token provided, continuing');
      return next();
    }
    
    // Try to authenticate
    await authenticate(req, res, () => {
      console.log('✅ Optional auth succeeded');
      next();
    });
  } catch (error) {
    // Authentication failed, but continue anyway
    console.log('⚠️ Optional auth failed, continuing without user:', error.message);
    next();
  }
};

// ===============================================
// ROLE-BASED AUTHORIZATION
// ===============================================
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }
    
    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      console.log('❌ Insufficient permissions:', {
        userRole,
        requiredRoles: allowedRoles,
        user: req.user.username
      });
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `Requires one of: ${allowedRoles.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('✅ Role authorization successful:', userRole);
    next();
  };
};

// ===============================================
// MEMBERSHIP-BASED AUTHORIZATION
// ===============================================
export const requireMembership = (membershipLevels) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }
    
    const userMembership = req.user.membership_stage || 'none';
    const allowedLevels = Array.isArray(membershipLevels) ? membershipLevels : [membershipLevels];
    
    if (!allowedLevels.includes(userMembership)) {
      console.log('❌ Insufficient membership level:', {
        userMembership,
        requiredLevels: allowedLevels,
        user: req.user.username
      });
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient membership level',
        message: `Requires: ${allowedLevels.join(' or ')}`,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('✅ Membership authorization successful:', userMembership);
    next();
  };
};

// ===============================================
// ADMIN AUTHORIZATION
// ===============================================
export const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      errorType: 'authorization_error',
      timestamp: new Date().toISOString()
    });
  }
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Super admin access required',
      errorType: 'authorization_error',
      timestamp: new Date().toISOString()
    });
  }
  next();
};

export const authorize = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Authorization failed. No user found.',
          errorType: 'authorization_error'
        });
      }

      if (!requiredRoles.includes(user.role)) {
        return res.status(403).json({ 
          success: false,
          error: 'Authorization failed. Insufficient permissions.',
          errorType: 'authorization_error',
          requiredRoles,
          userRole: user.role
        });
      }

      next();
    } catch (error) {
      console.error('Error in authorize middleware:', error.message);
      res.status(403).json({ 
        success: false,
        error: 'Authorization failed.',
        errorType: 'authorization_error'
      });
    }
  };
};

// ===============================================
// CACHING MIDDLEWARE
// ===============================================
export const cacheMiddleware = (duration = 300) => {
  const cache = new Map();
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < duration * 1000) {
      return res.json(cached.data);
    }
    
    const originalSend = res.json;
    res.json = function(data) {
      cache.set(key, { data, timestamp: Date.now() });
      originalSend.call(this, data);
    };
    
    next();
  };
};

// ===============================================
// DEFAULT EXPORT FOR COMPATIBILITY
// ===============================================
export default {
  authenticate,
  authenticateToken,
  optionalAuth,
  requireRole,
  requireMembership,
  requireAdmin,
  requireSuperAdmin,
  authorize,
  cacheMiddleware
};

console.log('✅ Unified authentication middleware loaded successfully');