// middleware/adminAudit.js - Complete Admin Audit Logging Middleware
// Real implementation using your database structure

import { query } from '../config/db.js';

// Main audit logging middleware
export const logAdminAction = (actionType, options = {}) => {
  return async (req, res, next) => {
    try {
      // Skip if no user or not an admin action
      if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
        return next();
      }

      // Capture request details
      const auditData = {
        adminId: req.user.id,
        action: actionType,
        targetType: getTargetType(req.originalUrl, actionType),
        targetId: getTargetId(req),
        actionData: {
          method: req.method,
          url: req.originalUrl,
          body: sanitizeBody(req.body),
          params: req.params,
          query: req.query,
          timestamp: new Date().toISOString(),
          adminUsername: req.user.username,
          adminRole: req.user.role
        },
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent') || 'Unknown'
      };

      // Store in database using your existing audit_logs table
      await query(`
        INSERT INTO audit_logs (user_id, action, resource, details, ip_address, user_agent, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        auditData.adminId,
        auditData.action,
        auditData.targetType,
        JSON.stringify(auditData.actionData),
        auditData.ipAddress,
        auditData.userAgent
      ]);

      // Also store in admin action logs if table exists
      try {
        await query(`
          INSERT INTO admin_action_logs (adminId, action, targetType, targetId, actionData, ipAddress, userAgent, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          auditData.adminId,
          auditData.action,
          auditData.targetType,
          auditData.targetId,
          JSON.stringify(auditData.actionData),
          auditData.ipAddress,
          auditData.userAgent
        ]);
      } catch (adminLogError) {
        // Silently ignore if admin_action_logs table doesn't exist
        if (adminLogError.code === 'ER_NO_SUCH_TABLE') {
          console.log('ℹ️  Admin action logs table not available, using audit_logs only');
        } else {
          console.error('❌ Admin action logs error:', adminLogError.message);
        }
      }

      console.log(`Admin action logged: ${actionType} by ${req.user.username}`);
      next();

    } catch (error) {
      console.error('Admin audit logging error:', error);
      // Continue without failing the request
      next();
    }
  };
};

// Enhanced audit logging with response capture
export const logAdminActionWithResponse = (actionType) => {
  return (req, res, next) => {
    // Apply the regular audit logging first
    logAdminAction(actionType)(req, res, () => {
      // Capture response data
      const originalSend = res.json;
      res.json = function(data) {
        // Log response asynchronously
        setImmediate(async () => {
          try {
            await query(`
              UPDATE audit_logs 
              SET details = JSON_SET(details, '$.response', ?, '$.responseStatus', ?)
              WHERE user_id = ? AND action = ? AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
              ORDER BY createdAt DESC
              LIMIT 1
            `, [
              JSON.stringify({ success: data.success, message: data.message }),
              res.statusCode,
              req.user.id,
              actionType
            ]);
          } catch (error) {
            console.error('Response audit logging error:', error);
          }
        });

        return originalSend.call(this, data);
      };
      next();
    });
  };
};

// Helper function to determine target type from URL
function getTargetType(url, actionType) {
  if (url.includes('/users/admin/')) return 'user';
  if (url.includes('/applications/') || actionType.includes('application')) return 'application';
  if (url.includes('/reports/') || actionType.includes('report')) return 'content';
  if (url.includes('/stats/') || actionType.includes('stats')) return 'system';
  if (url.includes('/bulk/')) return 'bulk_operation';
  return 'unknown';
}

// Helper function to extract target ID from request
function getTargetId(req) {
  // Try to get ID from various sources
  return req.params.id || 
         req.params.userId || 
         req.params.applicationId || 
         req.params.reportId || 
         req.body.userId || 
         req.body.targetId || 
         null;
}

// Helper function to sanitize request body
function sanitizeBody(body) {
  const sanitized = { ...body };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.password_hash;
  delete sanitized.token;
  delete sanitized.resetToken;
  
  // Truncate large fields
  if (sanitized.content && sanitized.content.length > 500) {
    sanitized.content = sanitized.content.substring(0, 500) + '... [truncated]';
  }
  
  if (sanitized.message && sanitized.message.length > 500) {
    sanitized.message = sanitized.message.substring(0, 500) + '... [truncated]';
  }
  
  return sanitized;
}

// Helper function to get client IP
function getClientIP(req) {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         'Unknown';
}

// Specialized audit functions for specific actions
export const auditUserAction = logAdminAction('user_management');
export const auditApplicationAction = logAdminAction('application_review');
export const auditContentAction = logAdminAction('content_moderation');
export const auditSystemAction = logAdminAction('system_administration');
export const auditBulkAction = logAdminActionWithResponse('bulk_operation');

// Export default object
export default {
  logAdminAction,
  logAdminActionWithResponse,
  auditUserAction,
  auditApplicationAction,
  auditContentAction,
  auditSystemAction,
  auditBulkAction
};