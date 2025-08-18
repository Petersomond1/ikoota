// ikootaapi/middlewares/membershipMiddleware.js
// ===============================================
// MEMBERSHIP MIDDLEWARE - COMPLETE ACCESS CONTROL & VALIDATION
// Clean, organized implementation following Phase 3 specifications
// ===============================================

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// =============================================================================
// MEMBERSHIP LEVEL ACCESS CONTROL
// =============================================================================

/**
 * Require full member access
 * Used for: Iko content, advanced features
 */
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

    // Check for member level access
    if (req.user.membership_stage === 'member' && req.user.is_member === 'member') {
      return next();
    }

    return res.status(403).json({ 
      success: false,
      message: 'Full member status required for this resource',
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

/**
 * Require pre-member or higher access
 * Used for: Towncrier content, basic member features
 */
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

/**
 * Check if user can apply for membership
 * Used for: Full membership application endpoints
 */
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
    const [userCheck] = await db.query(`
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

// =============================================================================
// ADMIN ACCESS CONTROL
// =============================================================================

/**
 * Require admin access
 * Used for: Admin dashboard, user management
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required',
        userRole: req.user.role,
        requiredRole: 'admin or super_admin'
      });
    }

    next();

  } catch (error) {
    console.error('❌ requireAdmin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during permission check'
    });
  }
};

/**
 * Require super admin access
 * Used for: System configuration, user deletion, emergency functions
 */
export const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin privileges required',
        userRole: req.user.role,
        requiredRole: 'super_admin'
      });
    }

    next();

  } catch (error) {
    console.error('❌ requireSuperAdmin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during permission check'
    });
  }
};

/**
 * Check application review permissions
 * Used for: Application review endpoints
 */
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

// =============================================================================
// DATA VALIDATION MIDDLEWARE
// =============================================================================

/**
 * Validate membership application data
 * Used for: Application submission endpoints
 */
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
    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: answers must be an array',
        errors: ['answers must be a valid array']
      });
    }

    if (answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: at least one answer is required',
        errors: ['answers array cannot be empty']
      });
    }

    // Validate each answer object
    const errors = [];
    answers.forEach((answer, index) => {
      if (!answer || typeof answer !== 'object') {
        errors.push(`Answer ${index + 1} must be an object`);
        return;
      }

      if (!answer.question || typeof answer.question !== 'string' || answer.question.trim() === '') {
        errors.push(`Answer ${index + 1} missing or invalid question`);
      }

      if (!answer.answer || typeof answer.answer !== 'string' || answer.answer.trim() === '') {
        errors.push(`Answer ${index + 1} missing or invalid answer`);
      }

      // Check answer length
      if (answer.answer && answer.answer.length < 10) {
        errors.push(`Answer ${index + 1} too short (minimum 10 characters)`);
      }

      if (answer.answer && answer.answer.length > 5000) {
        errors.push(`Answer ${index + 1} too long (maximum 5000 characters)`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: application data is invalid',
        errors: errors
      });
    }

    // Validate membership ticket format
    if (typeof membershipTicket !== 'string' || membershipTicket.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: invalid membership ticket format',
        errors: ['membershipTicket must be a valid string']
      });
    }

    // Add validation metadata to request
    req.validationInfo = {
      answersCount: answers.length,
      totalCharacters: answers.reduce((total, answer) => total + answer.answer.length, 0),
      validatedAt: new Date().toISOString()
    };

    next();

  } catch (error) {
    console.error('❌ validateMembershipApplication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during validation'
    });
  }
};

/**
 * Validate application review data
 * Used for: Admin review endpoints
 */
export const validateApplicationReview = (req, res, next) => {
  try {
    const { status, adminNotes, decision } = req.body;

    // Check for either status or decision (legacy compatibility)
    const reviewDecision = status || decision;
    
    if (!reviewDecision) {
      return res.status(400).json({
        success: false,
        message: 'Review decision is required',
        errors: ['status or decision field must be provided']
      });
    }

    // Validate decision values
    const validDecisions = ['approved', 'declined', 'rejected', 'pending', 'under_review'];
    if (!validDecisions.includes(reviewDecision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review decision',
        errors: [`Decision must be one of: ${validDecisions.join(', ')}`],
        provided: reviewDecision
      });
    }

    // Admin notes validation
    if (adminNotes && typeof adminNotes !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Admin notes must be a string',
        errors: ['adminNotes must be a valid string']
      });
    }

    if (adminNotes && adminNotes.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Admin notes too long',
        errors: ['adminNotes cannot exceed 2000 characters']
      });
    }

    // Require admin notes for rejection/decline
    if (['declined', 'rejected'].includes(reviewDecision) && (!adminNotes || adminNotes.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Admin notes required for rejection/decline',
        errors: ['adminNotes required when declining or rejecting applications']
      });
    }

    // Normalize the decision field
    req.body.status = reviewDecision;
    req.body.decision = reviewDecision;

    next();

  } catch (error) {
    console.error('❌ validateApplicationReview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during review validation'
    });
  }
};

// =============================================================================
// RATE LIMITING MIDDLEWARE
// =============================================================================

/**
 * Rate limit application submissions
 * Prevents spam submissions
 */
const applicationSubmissions = new Map();

export const rateLimitApplications = (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const now = Date.now();
    const userSubmissions = applicationSubmissions.get(userId) || [];
    
    // Clean old submissions (older than 1 hour)
    const recentSubmissions = userSubmissions.filter(timestamp => 
      now - timestamp < 60 * 60 * 1000
    );
    
    // Check rate limit (max 3 submissions per hour)
    if (recentSubmissions.length >= 3) {
      const oldestSubmission = Math.min(...recentSubmissions);
      const timeUntilReset = 60 - Math.floor((now - oldestSubmission) / (60 * 1000));
      
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        details: 'Maximum 3 application submissions per hour',
        retryAfter: timeUntilReset,
        nextAvailableAt: new Date(oldestSubmission + 60 * 60 * 1000).toISOString()
      });
    }
    
    // Add current submission timestamp
    recentSubmissions.push(now);
    applicationSubmissions.set(userId, recentSubmissions);
    
    // Clean up old entries periodically
    if (Math.random() < 0.1) { // 10% chance
      const cutoffTime = now - 60 * 60 * 1000;
      for (const [key, timestamps] of applicationSubmissions.entries()) {
        const validTimestamps = timestamps.filter(t => t > cutoffTime);
        if (validTimestamps.length === 0) {
          applicationSubmissions.delete(key);
        } else {
          applicationSubmissions.set(key, validTimestamps);
        }
      }
    }

    next();

  } catch (error) {
    console.error('❌ rateLimitApplications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during rate limiting'
    });
  }
};

// =============================================================================
// LOGGING & AUDIT MIDDLEWARE
// =============================================================================

/**
 * Log membership actions for audit trail
 */
export const logMembershipAction = (action) => {
  return async (req, res, next) => {
    try {
      // Store action info in request for later logging
      req.membershipAction = {
        action,
        userId: req.user?.id,
        username: req.user?.username,
        userRole: req.user?.role,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        params: req.params,
        query: req.query
      };

      // Continue to next middleware
      next();

      // Log successful actions after response
      const originalSend = res.send;
      res.send = function(data) {
        // Only log successful operations
        if (res.statusCode < 400) {
          // Non-blocking audit log
          setImmediate(async () => {
            try {
              await db.query(`
                INSERT INTO audit_logs (user_id, action, details, createdAt)
                VALUES (?, ?, ?, NOW())
              `, [
                req.membershipAction.userId,
                req.membershipAction.action,
                JSON.stringify({
                  ...req.membershipAction,
                  responseStatus: res.statusCode,
                  success: true
                })
              ]);
            } catch (logError) {
              console.warn('⚠️ Audit logging failed:', logError.message);
            }
          });
        }
        
        // Call original send
        originalSend.call(this, data);
      };

    } catch (error) {
      console.error('❌ logMembershipAction error:', error);
      // Don't block the request for logging errors
      next();
    }
  };
};

// =============================================================================
// UTILITY MIDDLEWARE
// =============================================================================

/**
 * Add membership context to request
 * Enriches request with user membership info
 */
export const addMembershipContext = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next();
    }

    const [membershipInfo] = await db.query(`
      SELECT 
        u.membership_stage,
        u.is_member,
        u.full_membership_status,
        u.role,
        COUNT(CASE WHEN sl.approval_status = 'pending' THEN 1 END) as pending_applications,
        COUNT(CASE WHEN fma.status = 'pending' THEN 1 END) as pending_full_applications
      FROM users u
      LEFT JOIN surveylog sl ON u.id = sl.user_id AND sl.approval_status = 'pending'
      LEFT JOIN full_membership_applications fma ON u.id = fma.user_id AND fma.status = 'pending'
      WHERE u.id = ?
      GROUP BY u.id, u.membership_stage, u.is_member, u.full_membership_status, u.role
    `, [req.user.id]);

    if (membershipInfo.length > 0) {
      req.membershipContext = membershipInfo[0];
    }

    next();

  } catch (error) {
    console.error('❌ addMembershipContext error:', error);
    // Don't block request for context errors
    next();
  }
};

/**
 * Validate user eligibility for specific membership actions
 */
export const validateMembershipEligibility = (requiredAction) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user.id;
      const [user] = await db.query(`
        SELECT membership_stage, is_member, role, full_membership_status
        FROM users WHERE id = ?
      `, [userId]);

      if (!user.length) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userInfo = user[0];
      let isEligible = false;
      let reason = '';

      switch (requiredAction) {
        case 'submit_initial_application':
          isEligible = !userInfo.membership_stage || 
                      userInfo.membership_stage === 'none' || 
                      (userInfo.membership_stage === 'applicant' && userInfo.is_member === 'rejected');
          reason = isEligible ? 'Eligible to submit initial application' : 
                  'User has already progressed beyond initial application stage';
          break;

        case 'submit_full_membership':
          isEligible = userInfo.membership_stage === 'pre_member' && 
                      (!userInfo.full_membership_status || 
                       ['not_applied', 'declined'].includes(userInfo.full_membership_status));
          reason = isEligible ? 'Eligible to submit full membership application' : 
                  'User not eligible for full membership application';
          break;

        case 'access_towncrier':
          isEligible = ['pre_member', 'member'].includes(userInfo.membership_stage) || 
                      ['admin', 'super_admin'].includes(userInfo.role);
          reason = isEligible ? 'Has access to Towncrier content' : 
                  'Requires pre-member status or higher';
          break;

        case 'access_iko':
          isEligible = userInfo.membership_stage === 'member' || 
                      ['admin', 'super_admin'].includes(userInfo.role);
          reason = isEligible ? 'Has access to Iko content' : 
                  'Requires full member status';
          break;

        default:
          isEligible = true;
          reason = 'No specific eligibility check required';
      }

      if (!isEligible) {
        return res.status(403).json({
          success: false,
          message: 'Not eligible for this action',
          reason: reason,
          userStatus: {
            membership_stage: userInfo.membership_stage,
            is_member: userInfo.is_member,
            full_membership_status: userInfo.full_membership_status
          }
        });
      }

      // Add eligibility info to request
      req.eligibilityInfo = {
        action: requiredAction,
        eligible: isEligible,
        reason: reason,
        userStatus: userInfo
      };

      next();

    } catch (error) {
      console.error('❌ validateMembershipEligibility error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during eligibility check'
      });
    }
  };
};

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

/**
 * Handle membership-specific errors
 */
export const handleMembershipErrors = (error, req, res, next) => {
  console.error('❌ Membership middleware error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    user: req.user?.username,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors || [error.message]
    });
  }

  if (error.name === 'AuthorizationError') {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      reason: error.message
    });
  }

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      details: 'This action has already been performed'
    });
  }

  // Generic error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    type: 'membership_middleware_error',
    timestamp: new Date().toISOString()
  });
};

// =============================================================================
// EXPORT ALL MIDDLEWARE
// =============================================================================

export default {
  // Access Control
  requireMember,
  requirePreMemberOrHigher,
  canApplyForMembership,
  requireAdmin,
  requireSuperAdmin,
  canReviewApplications,
  
  // Validation
  validateMembershipApplication,
  validateApplicationReview,
  validateMembershipEligibility,
  
  // Rate Limiting
  rateLimitApplications,
  
  // Logging & Audit
  logMembershipAction,
  addMembershipContext,
  
  // Error Handling
  handleMembershipErrors
};










// // middlewares/membershipMiddleware.js (NEW FILE)
// import db from '../config/db.js';

// // ✅ STANDARDIZED: Require member (full member) access
// export const requireMember = async (req, res, next) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ 
//         success: false,
//         message: 'Authentication required' 
//       });
//     }

//     // Admins have access to everything
//     if (['admin', 'super_admin'].includes(req.user.role)) {
//       return next();
//     }

//     // Check for member level - use standardized terminology
//     if (req.user.membership_stage === 'member' && req.user.is_member === 'member') {
//       return next();
//     }

//     return res.status(403).json({ 
//       success: false,
//       message: 'Member status required for this resource',
//       userStatus: {
//         membership_stage: req.user.membership_stage,
//         is_member: req.user.is_member,
//         required: 'member'
//       }
//     });

//   } catch (error) {
//     console.error('❌ requireMember middleware error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error during authorization check'
//     });
//   }
// };

// // ✅ STANDARDIZED: Require pre-member or higher access
// export const requirePreMemberOrHigher = async (req, res, next) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ 
//         success: false,
//         message: 'Authentication required' 
//       });
//     }

//     // Admins have access to everything
//     if (['admin', 'super_admin'].includes(req.user.role)) {
//       return next();
//     }

//     // Check for pre_member or member level
//     if (['member', 'pre_member'].includes(req.user.membership_stage)) {
//       return next();
//     }

//     return res.status(403).json({ 
//       success: false,
//       message: 'Pre-member status or higher required',
//       userStatus: {
//         membership_stage: req.user.membership_stage,
//         is_member: req.user.is_member,
//         required: 'pre_member or higher'
//       }
//     });

//   } catch (error) {
//     console.error('❌ requirePreMemberOrHigher middleware error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error during authorization check'
//     });
//   }
// };

// // ✅ STANDARDIZED: Check if user can apply for membership
// export const canApplyForMembership = async (req, res, next) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ 
//         success: false,
//         message: 'Authentication required' 
//       });
//     }

//     const userId = req.user.id;

//     // Get current user status from database
//     const userCheck = await db.query(`
//       SELECT 
//         membership_stage, 
//         is_member, 
//         full_membership_status,
//         role
//       FROM users 
//       WHERE id = ?
//     `, [userId]);

//     if (userCheck.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     const user = userCheck[0];

//     // Admins can always access
//     if (['admin', 'super_admin'].includes(user.role)) {
//       req.userMembershipInfo = user;
//       return next();
//     }

//     // Check if user is pre_member and can apply
//     if (user.membership_stage === 'pre_member') {
//       // Check if they don't already have a pending application
//       if (user.full_membership_status === 'pending') {
//         return res.status(400).json({
//           success: false,
//           message: 'You already have a pending membership application',
//           currentStatus: user.full_membership_status
//         });
//       }

//       // They can apply if not applied, or if previously declined
//       if (['not_applied', 'declined'].includes(user.full_membership_status)) {
//         req.userMembershipInfo = user;
//         return next();
//       }
//     }

//     return res.status(403).json({
//       success: false,
//       message: 'You are not eligible to apply for membership at this time',
//       userStatus: {
//         membership_stage: user.membership_stage,
//         is_member: user.is_member,
//         full_membership_status: user.full_membership_status
//       },
//       eligibility: {
//         required: 'pre_member status',
//         applicationStatus: 'not_applied or declined'
//       }
//     });

//   } catch (error) {
//     console.error('❌ canApplyForMembership middleware error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error during eligibility check'
//     });
//   }
// };

// // ✅ STANDARDIZED: Validate membership application data
// export const validateMembershipApplication = (req, res, next) => {
//   try {
//     const { answers, membershipTicket } = req.body;

//     // Check required fields
//     if (!answers) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed: answers are required',
//         errors: ['answers field is missing']
//       });
//     }

//     if (!membershipTicket) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed: membershipTicket is required',
//         errors: ['membershipTicket field is missing']
//       });
//     }

//     // Validate answers structure
//     if (typeof answers !== 'object') {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed: answers must be an object',
//         errors: ['answers must be a valid object']
//       });
//     }

//     // Validate membership ticket format (example: FM-USR-NAME-YYMMDD-HHMM)
//     const ticketPattern = /^FM-[A-Z]{3}-[A-Z]{3,4}-\d{6}-\d{4}$/;
//     if (!ticketPattern.test(membershipTicket)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed: invalid membership ticket format',
//         errors: ['membershipTicket must follow format: FM-XXX-XXXX-YYMMDD-HHMM'],
//         example: 'FM-USR-NAME-250125-1430'
//       });
//     }

//     // Add validated data to request for use in controller
//     req.validatedApplication = {
//       answers,
//       membershipTicket,
//       timestamp: new Date().toISOString()
//     };

//     next();

//   } catch (error) {
//     console.error('❌ validateMembershipApplication middleware error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error during validation'
//     });
//   }
// };

// // ✅ STANDARDIZED: Check application review permissions
// export const canReviewApplications = async (req, res, next) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ 
//         success: false,
//         message: 'Authentication required' 
//       });
//     }

//     // Only admins and super_admins can review applications
//     if (!['admin', 'super_admin'].includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Admin privileges required to review applications',
//         userRole: req.user.role,
//         requiredRole: 'admin or super_admin'
//       });
//     }

//     // Add reviewer info to request
//     req.reviewer = {
//       id: req.user.id,
//       username: req.user.username,
//       role: req.user.role
//     };

//     next();

//   } catch (error) {
//     console.error('❌ canReviewApplications middleware error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error during permission check'
//     });
//   }
// };

// // ✅ STANDARDIZED: Validate application review data
// export const validateApplicationReview = (req, res, next) => {
//   try {
//     const { status, adminNotes } = req.body;

//     // Check required fields
//     if (!status) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed: status is required',
//         errors: ['status field is missing'],
//         allowedValues: ['approved', 'declined']
//       });
//     }

//     // Validate status value
//     if (!['approved', 'declined'].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed: invalid status value',
//         errors: [`status must be 'approved' or 'declined', received: '${status}'`],
//         allowedValues: ['approved', 'declined']
//       });
//     }

//     // Admin notes are optional but should be meaningful if provided
//     if (adminNotes && typeof adminNotes !== 'string') {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed: adminNotes must be a string',
//         errors: ['adminNotes must be a valid string if provided']
//       });
//     }

//     // Add validated data to request
//     req.validatedReview = {
//       status,
//       adminNotes: adminNotes || null,
//       timestamp: new Date().toISOString()
//     };

//     next();

//   } catch (error) {
//     console.error('❌ validateApplicationReview middleware error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error during validation'
//     });
//   }
// };

// // ✅ STANDARDIZED: Rate limiting for application submissions
// export const rateLimitApplications = async (req, res, next) => {
//   try {
//     if (!req.user) {
//       return next(); // Let authentication middleware handle this
//     }

//     const userId = req.user.id;
//     const timeWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

//     // Check if user has submitted an application recently
//     const recentApplications = await db.query(`
//       SELECT COUNT(*) as count
//       FROM full_membership_applications 
//       WHERE user_id = ? 
//         AND submittedAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)
//     `, [userId]);

//     const applicationCount = recentApplications[0].count;

//     // Limit to 1 application per 24 hours
//     if (applicationCount >= 1) {
//       return res.status(429).json({
//         success: false,
//         message: 'Rate limit exceeded: You can only submit one application per 24 hours',
//         retryAfter: '24 hours',
//         currentCount: applicationCount,
//         limit: 1
//       });
//     }

//     next();

//   } catch (error) {
//     console.error('❌ rateLimitApplications middleware error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error during rate limit check'
//     });
//   }
// };

// // ✅ STANDARDIZED: Log membership actions for audit trail
// export const logMembershipAction = (action) => {
//   return async (req, res, next) => {
//     try {
//       // Store original response.json to intercept it
//       const originalJson = res.json;
      
//       res.json = function(data) {
//         // Log the action after successful response
//         if (data.success && req.user) {
//           setImmediate(async () => {
//             try {
//               await db.query(`
//                 INSERT INTO audit_logs (user_id, action, details, createdAt)
//                 VALUES (?, ?, ?, NOW())
//               `, [
//                 req.user.id,
//                 action,
//                 JSON.stringify({
//                   path: req.path,
//                   method: req.method,
//                   userAgent: req.get('User-Agent'),
//                   ip: req.ip,
//                   responseData: data,
//                   timestamp: new Date().toISOString()
//                 })
//               ]);
//             } catch (logError) {
//               console.error(`❌ Failed to log ${action}:`, logError);
//             }
//           });
//         }
        
//         // Call original json method
//         return originalJson.call(this, data);
//       };

//       next();

//     } catch (error) {
//       console.error('❌ logMembershipAction middleware error:', error);
//       next(); // Don't block the request for logging errors
//     }
//   };
// };