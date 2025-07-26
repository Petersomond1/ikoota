// middlewares/membershipMiddleware.js (NEW FILE)
import db from '../config/db.js';

// ✅ STANDARDIZED: Require member (full member) access
export const requireMember = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Admins have access to everything
    if (['admin', 'super_admin'].includes(req.user.role)) {
      return next();
    }

    // Check for member level - use standardized terminology
    if (req.user.membership_stage === 'member' && req.user.is_member === 'member') {
      return next();
    }

    return res.status(403).json({ 
      success: false,
      message: 'Member status required for this resource',
      userStatus: {
        membership_stage: req.user.membership_stage,
        is_member: req.user.is_member,
        required: 'member'
      }
    });

  } catch (error) {
    console.error('❌ requireMember middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authorization check'
    });
  }
};

// ✅ STANDARDIZED: Require pre-member or higher access
export const requirePreMemberOrHigher = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Admins have access to everything
    if (['admin', 'super_admin'].includes(req.user.role)) {
      return next();
    }

    // Check for pre_member or member level
    if (['member', 'pre_member'].includes(req.user.membership_stage)) {
      return next();
    }

    return res.status(403).json({ 
      success: false,
      message: 'Pre-member status or higher required',
      userStatus: {
        membership_stage: req.user.membership_stage,
        is_member: req.user.is_member,
        required: 'pre_member or higher'
      }
    });

  } catch (error) {
    console.error('❌ requirePreMemberOrHigher middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authorization check'
    });
  }
};

// ✅ STANDARDIZED: Check if user can apply for membership
export const canApplyForMembership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const userId = req.user.id;

    // Get current user status from database
    const userCheck = await db.query(`
      SELECT 
        membership_stage, 
        is_member, 
        full_membership_status,
        role
      FROM users 
      WHERE id = ?
    `, [userId]);

    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userCheck[0];

    // Admins can always access
    if (['admin', 'super_admin'].includes(user.role)) {
      req.userMembershipInfo = user;
      return next();
    }

    // Check if user is pre_member and can apply
    if (user.membership_stage === 'pre_member') {
      // Check if they don't already have a pending application
      if (user.full_membership_status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending membership application',
          currentStatus: user.full_membership_status
        });
      }

      // They can apply if not applied, or if previously declined
      if (['not_applied', 'declined'].includes(user.full_membership_status)) {
        req.userMembershipInfo = user;
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'You are not eligible to apply for membership at this time',
      userStatus: {
        membership_stage: user.membership_stage,
        is_member: user.is_member,
        full_membership_status: user.full_membership_status
      },
      eligibility: {
        required: 'pre_member status',
        applicationStatus: 'not_applied or declined'
      }
    });

  } catch (error) {
    console.error('❌ canApplyForMembership middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during eligibility check'
    });
  }
};

// ✅ STANDARDIZED: Validate membership application data
export const validateMembershipApplication = (req, res, next) => {
  try {
    const { answers, membershipTicket } = req.body;

    // Check required fields
    if (!answers) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: answers are required',
        errors: ['answers field is missing']
      });
    }

    if (!membershipTicket) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: membershipTicket is required',
        errors: ['membershipTicket field is missing']
      });
    }

    // Validate answers structure
    if (typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: answers must be an object',
        errors: ['answers must be a valid object']
      });
    }

    // Validate membership ticket format (example: FM-USR-NAME-YYMMDD-HHMM)
    const ticketPattern = /^FM-[A-Z]{3}-[A-Z]{3,4}-\d{6}-\d{4}$/;
    if (!ticketPattern.test(membershipTicket)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: invalid membership ticket format',
        errors: ['membershipTicket must follow format: FM-XXX-XXXX-YYMMDD-HHMM'],
        example: 'FM-USR-NAME-250125-1430'
      });
    }

    // Add validated data to request for use in controller
    req.validatedApplication = {
      answers,
      membershipTicket,
      timestamp: new Date().toISOString()
    };

    next();

  } catch (error) {
    console.error('❌ validateMembershipApplication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during validation'
    });
  }
};

// ✅ STANDARDIZED: Check application review permissions
export const canReviewApplications = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Only admins and super_admins can review applications
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required to review applications',
        userRole: req.user.role,
        requiredRole: 'admin or super_admin'
      });
    }

    // Add reviewer info to request
    req.reviewer = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    };

    next();

  } catch (error) {
    console.error('❌ canReviewApplications middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during permission check'
    });
  }
};

// ✅ STANDARDIZED: Validate application review data
export const validateApplicationReview = (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    // Check required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: status is required',
        errors: ['status field is missing'],
        allowedValues: ['approved', 'declined']
      });
    }

    // Validate status value
    if (!['approved', 'declined'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: invalid status value',
        errors: [`status must be 'approved' or 'declined', received: '${status}'`],
        allowedValues: ['approved', 'declined']
      });
    }

    // Admin notes are optional but should be meaningful if provided
    if (adminNotes && typeof adminNotes !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: adminNotes must be a string',
        errors: ['adminNotes must be a valid string if provided']
      });
    }

    // Add validated data to request
    req.validatedReview = {
      status,
      adminNotes: adminNotes || null,
      timestamp: new Date().toISOString()
    };

    next();

  } catch (error) {
    console.error('❌ validateApplicationReview middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during validation'
    });
  }
};

// ✅ STANDARDIZED: Rate limiting for application submissions
export const rateLimitApplications = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(); // Let authentication middleware handle this
    }

    const userId = req.user.id;
    const timeWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Check if user has submitted an application recently
    const recentApplications = await db.query(`
      SELECT COUNT(*) as count
      FROM full_membership_applications 
      WHERE user_id = ? 
        AND submittedAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `, [userId]);

    const applicationCount = recentApplications[0].count;

    // Limit to 1 application per 24 hours
    if (applicationCount >= 1) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded: You can only submit one application per 24 hours',
        retryAfter: '24 hours',
        currentCount: applicationCount,
        limit: 1
      });
    }

    next();

  } catch (error) {
    console.error('❌ rateLimitApplications middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during rate limit check'
    });
  }
};

// ✅ STANDARDIZED: Log membership actions for audit trail
export const logMembershipAction = (action) => {
  return async (req, res, next) => {
    try {
      // Store original response.json to intercept it
      const originalJson = res.json;
      
      res.json = function(data) {
        // Log the action after successful response
        if (data.success && req.user) {
          setImmediate(async () => {
            try {
              await db.query(`
                INSERT INTO audit_logs (user_id, action, details, createdAt)
                VALUES (?, ?, ?, NOW())
              `, [
                req.user.id,
                action,
                JSON.stringify({
                  path: req.path,
                  method: req.method,
                  userAgent: req.get('User-Agent'),
                  ip: req.ip,
                  responseData: data,
                  timestamp: new Date().toISOString()
                })
              ]);
            } catch (logError) {
              console.error(`❌ Failed to log ${action}:`, logError);
            }
          });
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();

    } catch (error) {
      console.error('❌ logMembershipAction middleware error:', error);
      next(); // Don't block the request for logging errors
    }
  };
};