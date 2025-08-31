// ikootaapi/middleware/adminMiddleware.js - COMPLETE RECREATION
// Admin panel integration middleware for content management
import CustomError from '../utils/CustomError.js';
import { handleAuthError } from '../utils/errorHelpers.js';
import db from '../config/db.js';

/**
 * ✅ Admin Authentication Middleware
 * Verifies admin privileges for content management
 */
export const requireAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user) {
      throw new CustomError('Authentication required', 401);
    }
    
    // Check admin status from database
    const [adminCheck] = await db.query(
      `SELECT role, is_admin, status FROM users WHERE id = ? OR converse_id = ?`,
      [req.user.id, req.user.converse_id || req.user.id]
    );
    
    if (!adminCheck || adminCheck.length === 0) {
      throw new CustomError('User not found', 404);
    }
    
    const user = adminCheck[0];
    
    // Check admin privileges
    if (!user.is_admin && user.role !== 'admin' && user.role !== 'moderator') {
      throw new CustomError('Admin privileges required', 403);
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      throw new CustomError('Account is not active', 403);
    }
    
    // Add admin info to request
    req.admin = {
      id: req.user.id,
      role: user.role,
      is_admin: user.is_admin
    };
    
    next();
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    
    handleAuthError(error);
  }
};

/**
 * ✅ Content Moderation Middleware
 * Handles content approval workflows
 */
export const requireModerator = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      throw new CustomError('Authentication required', 401);
    }
    
    // Check moderator status
    const [moderatorCheck] = await db.query(
      `SELECT role, is_admin, permissions FROM users WHERE id = ? OR converse_id = ?`,
      [req.user.id, req.user.converse_id || req.user.id]
    );
    
    if (!moderatorCheck || moderatorCheck.length === 0) {
      throw new CustomError('User not found', 404);
    }
    
    const user = moderatorCheck[0];
    
    // Check moderation privileges
    const canModerate = user.is_admin || 
                       user.role === 'admin' || 
                       user.role === 'moderator' ||
                       (user.permissions && user.permissions.includes('moderate_content'));
    
    if (!canModerate) {
      throw new CustomError('Content moderation privileges required', 403);
    }
    
    // Add moderator info to request
    req.moderator = {
      id: req.user.id,
      role: user.role,
      permissions: user.permissions
    };
    
    next();
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    
    handleAuthError(error);
  }
};

/**
 * ✅ Content Ownership Middleware
 * Verifies content ownership or admin privileges
 */
export const requireOwnershipOrAdmin = (contentType = 'content') => {
  return async (req, res, next) => {
    try {
      const contentId = req.params.id || req.params.chatId || req.params.teachingId || req.params.commentId;
      
      if (!contentId) {
        throw new CustomError('Content ID required', 400);
      }
      
      // Check if user is admin first
      const [adminCheck] = await db.query(
        `SELECT role, is_admin FROM users WHERE id = ? OR converse_id = ?`,
        [req.user.id, req.user.converse_id || req.user.id]
      );
      
      if (adminCheck && adminCheck.length > 0) {
        const user = adminCheck[0];
        if (user.is_admin || user.role === 'admin' || user.role === 'moderator') {
          req.isAdmin = true;
          return next();
        }
      }
      
      // Check content ownership
      let ownershipQuery;
      let tableName;
      
      switch (contentType) {
        case 'chat':
          tableName = 'chats';
          ownershipQuery = `SELECT user_id FROM ${tableName} WHERE id = ?`;
          break;
        case 'teaching':
          tableName = 'teachings';
          ownershipQuery = `SELECT user_id FROM ${tableName} WHERE id = ?`;
          break;
        case 'comment':
          tableName = 'comments';
          ownershipQuery = `SELECT user_id FROM ${tableName} WHERE id = ?`;
          break;
        default:
          throw new CustomError('Invalid content type', 400);
      }
      
      const [ownershipCheck] = await db.query(ownershipQuery, [contentId]);
      
      if (!ownershipCheck || ownershipCheck.length === 0) {
        throw new CustomError(`${contentType} not found`, 404);
      }
      
      const content = ownershipCheck[0];
      const isOwner = content.user_id === req.user.id || 
                     content.user_id === req.user.converse_id ||
                     content.user_id === String(req.user.id);
      
      if (!isOwner) {
        throw new CustomError('Access denied: not owner or admin', 403);
      }
      
      req.isOwner = true;
      next();
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      
      console.error(`Ownership check error for ${contentType}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Ownership verification failed'
      });
    }
  };
};

/**
 * ✅ Content Status Middleware
 * Checks content approval status
 */
export const checkContentStatus = (allowDrafts = false) => {
  return (req, res, next) => {
    // If user is admin or moderator, allow all content
    if (req.admin || req.moderator) {
      return next();
    }
    
    // Add status filter to query parameters
    if (!allowDrafts) {
      req.query.status = req.query.status || 'approved';
    }
    
    next();
  };
};

/**
 * ✅ Bulk Action Middleware
 * Handles bulk operations with proper validation
 */
export const validateBulkAction = (req, res, next) => {
  try {
    const { action, ids } = req.body;
    
    if (!action) {
      throw new CustomError('Bulk action required', 400);
    }
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new CustomError('Content IDs required for bulk action', 400);
    }
    
    if (ids.length > 100) {
      throw new CustomError('Maximum 100 items allowed per bulk action', 400);
    }
    
    const allowedActions = ['approve', 'reject', 'delete', 'archive', 'feature', 'unfeature'];
    if (!allowedActions.includes(action)) {
      throw new CustomError(`Invalid bulk action. Allowed: ${allowedActions.join(', ')}`, 400);
    }
    
    req.bulkAction = { action, ids };
    next();
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Bulk action validation failed'
    });
  }
};

/**
 * ✅ Audit Log Middleware
 * Logs admin actions for audit trail
 */
export const auditLog = (action) => {
  return async (req, res, next) => {
    try {
      const originalSend = res.json;
      
      res.json = function(data) {
        // Log the admin action
        if (req.admin || req.moderator) {
          const auditData = {
            admin_id: req.user.id,
            action: action,
            target_type: req.baseUrl.split('/').pop(),
            target_id: req.params.id || null,
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('User-Agent'),
            timestamp: new Date(),
            success: data.success !== false
          };
          
          // In a real app, you'd save this to an audit_logs table
          console.log('Admin Action Logged:', auditData);
        }
        
        originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Audit logging error:', error);
      next(); // Don't block the request if audit logging fails
    }
  };
};