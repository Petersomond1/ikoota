// ikootaapi/middleware/auth.js - UNIFIED AUTHENTICATION MIDDLEWARE
// Merges auth.js and authMiddleware.js preserving all functionality
// Enhanced authentication middleware with comprehensive role-based access control

import jwt from 'jsonwebtoken';
import db from '../config/db.js';

// ===============================================
// ENHANCED AUTHENTICATION MIDDLEWARE
// ===============================================

/**
 * Main authentication middleware - Enhanced from both files
 * Verifies JWT token and adds comprehensive user info to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    console.log('🔍 Authentication middleware called for:', req.method, req.originalUrl);
    
    // ✅ ENHANCED: Extract token from multiple sources (from authMiddleware.js)
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
    
    // Method 4: Simple header extraction (from auth.js)
    if (!token) {
      const altToken = authHeader?.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;
      if (altToken) {
        token = altToken;
        console.log('✅ Token found via alternative extraction');
      }
    }
    
    if (!token) {
      console.log('❌ No authentication token found');
      return res.status(401).json({
        success: false,
        error: 'Authorization header required',
        message: 'No token provided',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('🔍 Token received (first 20 chars):', token.substring(0, 20) + '...');
    
    // ✅ ENHANCED: Verify JWT token with better error handling
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ JWT token verified successfully');
    console.log('👤 Decoded user info:', {
      user_id: decoded.user_id || decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    });
    
    // ✅ ENHANCED: Get comprehensive user data from database
    const userResult = await db.query(`
      SELECT 
        id, username, email, role, is_member, membership_stage, 
        isbanned, is_verified, converse_id, application_ticket,
        full_membership_status, application_status, mentor_id, 
        primary_class_id, createdAt, updatedAt
      FROM users 
      WHERE id = ?
    `, [decoded.user_id || decoded.id]);
    
    // ✅ ENHANCED: Handle MySQL result format properly (from authMiddleware.js)
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
      console.log('❌ User not found in database:', decoded.user_id || decoded.id);
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'User account not found in system',
        timestamp: new Date().toISOString()
      });
    }
    
    const user = users[0];
    
    // ✅ ENHANCED: Check if user is banned
    if (user.isbanned) {
      console.log('❌ User is banned:', user.email);
      return res.status(403).json({
        success: false,
        error: 'Account has been suspended',
        message: 'Your account has been banned',
        timestamp: new Date().toISOString()
      });
    }
    
    // ✅ ENHANCED: Add comprehensive user info to request object
    req.user = {
      // Primary identifiers
      id: user.id,
      user_id: user.id, // For backward compatibility
      username: user.username,
      email: user.email,
      
      // Role and permissions
      role: user.role || 'user',
      is_member: user.is_member,
      membership_stage: user.membership_stage,
      
      // Status flags
      is_verified: user.is_verified,
      isbanned: user.isbanned,
      
      // Relationships
      converse_id: user.converse_id,
      mentor_id: user.mentor_id,
      primary_class_id: user.primary_class_id,
      
      // Application tracking
      application_ticket: user.application_ticket,
      full_membership_status: user.full_membership_status,
      application_status: user.application_status,
      
      // Timestamps
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      
      // Token data for compatibility
      token_role: decoded.role,
      token_membership_stage: decoded.membership_stage,
      token_is_member: decoded.is_member,
      
      // Decoded token info
      token_data: decoded
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
        error: 'Invalid token',
        message: 'JWT token is malformed or invalid',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Authentication token has expired',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Internal server error during authentication',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// BACKWARD COMPATIBILITY EXPORTS
// ===============================================
export const authenticateToken = authenticate;

// ===============================================
// ENHANCED OPTIONAL AUTHENTICATION
// ===============================================
export const optionalAuth = async (req, res, next) => {
  try {
    console.log('⚠️ Optional authentication for:', req.method, req.originalUrl);
    
    // Extract token from various sources
    const token = req.headers.authorization?.split(' ')[1] || 
                 req.headers['x-auth-token'] || 
                 req.cookies?.access_token;
    
    if (!token) {
      console.log('⚠️ Optional auth: no token provided, continuing without user');
      req.user = null;
      return next();
    }
    
    // Try to authenticate but don't fail if it doesn't work
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const userResult = await db.query(
        'SELECT id, username, email, role, membership_stage, is_member, isbanned FROM users WHERE id = ?',
        [decoded.user_id || decoded.id]
      );
      
      let users = [];
      if (Array.isArray(userResult)) {
        users = userResult;
      } else if (userResult && Array.isArray(userResult[0])) {
        users = userResult[0];
      }

      if (users && users.length > 0 && !users[0].isbanned) {
        req.user = {
          id: users[0].id,
          user_id: users[0].id,
          username: users[0].username,
          email: users[0].email,
          role: users[0].role || 'user',
          membership_stage: users[0].membership_stage,
          is_member: users[0].is_member
        };
        console.log('✅ Optional auth succeeded for:', users[0].username);
      } else {
        req.user = null;
        console.log('⚠️ Optional auth: user not found or banned');
      }
    } catch (tokenError) {
      req.user = null;
      console.log('⚠️ Optional auth failed:', tokenError.message);
    }
    
    next();
  } catch (error) {
    console.error('⚠️ Optional auth error:', error);
    req.user = null;
    next();
  }
};

// ===============================================
// ENHANCED ROLE-BASED AUTHORIZATION
// ===============================================
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      const userRole = req.user.role || 'user';
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      if (!roles.includes(userRole)) {
        console.log('❌ Insufficient permissions:', {
          userRole,
          requiredRoles: roles,
          user: req.user.username
        });
        
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `Requires one of: ${roles.join(', ')}`,
          required: roles,
          current: userRole,
          timestamp: new Date().toISOString()
        });
      }

      console.log('✅ Role authorization successful:', userRole);
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// ===============================================
// ENHANCED MEMBERSHIP-BASED AUTHORIZATION
// ===============================================
export const requireMembershipStage = (allowedStages) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      const userStage = req.user.membership_stage || 'none';
      const stages = Array.isArray(allowedStages) ? allowedStages : [allowedStages];
      
      if (!stages.includes(userStage)) {
        console.log('❌ Insufficient membership level:', {
          userStage,
          requiredStages: stages,
          user: req.user.username
        });
        
        return res.status(403).json({
          success: false,
          error: 'Membership level insufficient',
          message: `Requires: ${stages.join(' or ')}`,
          required: stages,
          current: userStage,
          timestamp: new Date().toISOString()
        });
      }

      console.log('✅ Membership authorization successful:', userStage);
      next();
    } catch (error) {
      console.error('Membership authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Membership authorization failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// Alternative export name for compatibility
export const requireMembership = requireMembershipStage;

// ===============================================
// ENHANCED CONTENT ACCESS CONTROL
// ===============================================
export const requireContentAccess = (contentType) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      const { membership_stage, role } = req.user;
      
      // Admin and super_admin have access to everything
      if (['admin', 'super_admin'].includes(role)) {
        console.log('✅ Admin access granted for:', contentType);
        return next();
      }

      // Content access rules based on membership stage
      const accessRules = {
        'towncrier': ['pre_member', 'member'],
        'iko': ['member'],
        'basic': ['applicant', 'pre_member', 'member'],
        'classes': ['pre_member', 'member'],
        'admin': ['admin', 'super_admin']
      };

      const allowedStages = accessRules[contentType];
      
      if (!allowedStages || !allowedStages.includes(membership_stage)) {
        console.log('❌ Content access denied:', {
          contentType,
          userStage: membership_stage,
          allowedStages,
          user: req.user.username
        });
        
        return res.status(403).json({
          success: false,
          error: `Access denied to ${contentType} content`,
          required_membership: allowedStages,
          current_membership: membership_stage,
          upgrade_info: getUpgradeInfo(membership_stage, contentType),
          timestamp: new Date().toISOString()
        });
      }

      console.log('✅ Content access granted for:', contentType);
      next();
    } catch (error) {
      console.error('Content access error:', error);
      res.status(500).json({
        success: false,
        error: 'Content access check failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// ===============================================
// ADMIN AUTHORIZATION SHORTCUTS
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
  console.log('✅ Admin access granted to:', req.user.username);
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
  console.log('✅ Super admin access granted to:', req.user.username);
  next();
};

// Legacy authorization function for backward compatibility
export const authorize = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Authorization failed. No user found.',
          errorType: 'authorization_error',
          timestamp: new Date().toISOString()
        });
      }

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          success: false,
          error: 'Authorization failed. Insufficient permissions.',
          errorType: 'authorization_error',
          requiredRoles: roles,
          userRole: user.role,
          timestamp: new Date().toISOString()
        });
      }

      next();
    } catch (error) {
      console.error('Error in authorize middleware:', error.message);
      res.status(403).json({ 
        success: false,
        error: 'Authorization failed.',
        errorType: 'authorization_error',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// ===============================================
// OWNERSHIP-BASED AUTHORIZATION
// ===============================================
export const requireOwnershipOrAdmin = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      const { role, id: currentUserId } = req.user;
      
      // Admins can access anything
      if (['admin', 'super_admin'].includes(role)) {
        console.log('✅ Admin ownership bypass for:', req.user.username);
        return next();
      }

      // Check if user owns the resource
      const resourceUserId = req.params[resourceUserIdField] || 
                           req.body[resourceUserIdField] || 
                           req.query[resourceUserIdField];

      if (parseInt(resourceUserId) === currentUserId) {
        console.log('✅ Resource ownership verified for:', req.user.username);
        return next();
      }

      console.log('❌ Resource ownership failed:', {
        currentUserId,
        resourceUserId,
        field: resourceUserIdField
      });

      res.status(403).json({
        success: false,
        error: 'Access denied - can only access your own resources',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        error: 'Ownership check failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// ===============================================
// RATE LIMITING MIDDLEWARE
// ===============================================
export const rateLimit = (maxRequests = 10, windowMs = 60000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    try {
      const key = req.user?.id || req.ip;
      const now = Date.now();
      
      if (!requests.has(key)) {
        requests.set(key, []);
      }
      
      const userRequests = requests.get(key);
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: Math.ceil(windowMs / 1000),
          timestamp: new Date().toISOString()
        });
      }
      
      validRequests.push(now);
      requests.set(key, validRequests);
      
      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next(); // Continue on error
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
      console.log('✅ Cache hit for:', key);
      return res.json(cached.data);
    }
    
    const originalSend = res.json;
    res.json = function(data) {
      cache.set(key, { data, timestamp: Date.now() });
      console.log('💾 Cached response for:', key);
      originalSend.call(this, data);
    };
    
    next();
  };
};

// ===============================================
// AUDIT LOGGING MIDDLEWARE
// ===============================================
export const auditLog = (action) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        // Log the action (implement based on your audit log table)
        await db.query(
          'INSERT INTO audit_logs (user_id, action, details, createdAt) VALUES (?, ?, ?, NOW())',
          [
            req.user.id,
            action,
            JSON.stringify({
              method: req.method,
              url: req.originalUrl,
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              timestamp: new Date().toISOString(),
              userId: req.user.id,
              username: req.user.username
            })
          ]
        );
        console.log('📝 Audit log created for:', action);
      }
      next();
    } catch (error) {
      console.error('Audit log error:', error);
      next(); // Continue on error
    }
  };
};

// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Helper function to get upgrade information
 */
function getUpgradeInfo(currentStage, contentType) {
  const upgradeMap = {
    'none': {
      'towncrier': 'Apply for initial membership to access Towncrier content',
      'iko': 'Apply for initial membership first, then upgrade to full member',
      'classes': 'Apply for initial membership to join classes'
    },
    'applicant': {
      'towncrier': 'Wait for application approval to access Towncrier content',
      'iko': 'Get approved as pre-member first, then apply for full membership',
      'classes': 'Wait for application approval to join classes'
    },
    'pre_member': {
      'iko': 'Apply for full membership to access Iko content'
    }
  };
  
  return upgradeMap[currentStage]?.[contentType] || 'Contact support for upgrade information';
}

// ===============================================
// COMPREHENSIVE DEFAULT EXPORT
// ===============================================
export default {
  // Main authentication
  authenticate,
  authenticateToken,
  optionalAuth,
  
  // Role-based authorization
  requireRole,
  requireMembershipStage,
  requireMembership,
  requireContentAccess,
  
  // Admin shortcuts
  requireAdmin,
  requireSuperAdmin,
  authorize,
  
  // Ownership and security
  requireOwnershipOrAdmin,
  rateLimit,
  auditLog,
  
  // Utility
  cacheMiddleware
};

console.log('✅ Unified authentication middleware loaded successfully with all features');