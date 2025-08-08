// ikootaapi/controllers/membershipControllers.js
// ================================================================
// MEMBERSHIP CONTROLLERS - USER-FACING OPERATIONS
// Consolidated from multiple .OLD files following Phase 3 specifications
// Handles: User dashboard, status checks, application management
// ================================================================

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { sendEmail } from '../utils/notifications.js';
import { sendEmailWithTemplate } from '../utils/email.js';
import { generateUniqueConverseId } from '../utils/idGenerator.js';

// =============================================================================
// CORE UTILITY FUNCTIONS (Extracted from membershipCore.js)
// =============================================================================

/**
 * Generate application ticket with consistent format
 */
export const generateApplicationTicket = (username, email, method = 'INITIAL') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  const prefix = method === 'FULL' ? 'FMA' : 'APP';
  return `${prefix}-${username.substr(0, 3).toUpperCase()}-${timestamp}-${random}`.toUpperCase();
};

/**
 * Get user by ID with robust error handling
 */
export const getUserById = async (userId) => {
  try {
    console.log('🔍 getUserById called with userId:', userId);
    
    if (!userId || (typeof userId !== 'number' && typeof userId !== 'string')) {
      throw new CustomError('Invalid user ID provided', 400);
    }
    
    const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    let users;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0])) {
        users = result[0]; // MySQL2 format: [rows, fields]
      } else {
        users = result; // Direct array format
      }
    } else {
      throw new CustomError('User not found', 404);
    }
    
    if (!users || users.length === 0) {
      throw new CustomError('User not found', 404);
    }
    
    const user = users[0];
    console.log('✅ User retrieved:', user.id, user.username);
    
    return user;
  } catch (error) {
    console.error('❌ getUserById error:', error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Database operation failed: ' + error.message, 500);
  }
};

/**
 * Standardized response functions
 */
export const successResponse = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
};

export const errorResponse = (res, error, statusCode = 500) => {
  console.error('Error occurred:', error);
  return res.status(statusCode).json({
    success: false,
    error: error.message || 'An error occurred',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

// =============================================================================
// USER DASHBOARD & STATUS FUNCTIONS
// =============================================================================

/**
 * Enhanced user dashboard with comprehensive status
 * GET /api/membership/dashboard
 */
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const userRole = req.user.role;
    
    console.log('🎯 getUserDashboard called for userId:', userId, 'role:', userRole);
    
    if (!userId) {
      throw new CustomError('User ID not found', 401);
    }
    
    // Enhanced database query to get complete user status
    const result = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.is_member,
        u.membership_stage,
        u.role,
        u.application_status,
        u.applicationSubmittedAt,
        u.application_ticket,
        u.createdAt,
        u.converse_id,
        u.mentor_id,
        u.primary_class_id,
        s.approval_status as survey_approval_status,
        s.application_ticket as survey_ticket,
        s.createdAt as survey_submittedAt,
        s.reviewedAt,
        s.reviewed_by,
        s.admin_notes,
        reviewer.username as reviewed_by_name
      FROM users u
      LEFT JOIN surveylog s ON u.id = s.user_id 
        AND s.application_type = 'initial_application'
        AND s.id = (
          SELECT MAX(id) FROM surveylog 
          WHERE user_id = u.id 
          AND application_type = 'initial_application'
        )
      LEFT JOIN users reviewer ON s.reviewed_by = reviewer.id
      WHERE u.id = ?
    `, [userId]);
    
    // Handle result structure
    let user;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        user = result[0][0];
      } else if (result[0] && typeof result[0] === 'object') {
        user = result[0];
      }
    }
    
    if (!user || !user.id) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Handle admin users with empty is_member
    let memberStatus = user.is_member;
    if (!memberStatus || memberStatus === '') {
      if (userRole === 'admin' || userRole === 'super_admin') {
        memberStatus = 'member';
        await db.query('UPDATE users SET is_member = ? WHERE id = ?', ['member', userId]);
      } else {
        memberStatus = 'pending';
      }
    }
    
    // Determine application status and next actions
    let applicationStatus = 'not_submitted';
    let statusDisplay = 'Not Submitted';
    let applicationDescription = 'Application not yet submitted';
    
    // Status logic based on membership progression
    if (user.is_member === 'pre_member' || user.membership_stage === 'pre_member') {
      applicationStatus = 'approved_pre_member';
      statusDisplay = 'Pre-Member';
      applicationDescription = 'Approved - Pre-Member Access to Towncrier';
    } else if (user.is_member === 'member' && user.membership_stage === 'member') {
      applicationStatus = 'approved_member';
      statusDisplay = 'Full Member';
      applicationDescription = 'Approved - Full Member Access to Iko Chat';
    } else if (user.survey_submittedAt || user.applicationSubmittedAt) {
      const actualStatus = user.survey_approval_status || user.application_status;
      
      switch (actualStatus) {
        case 'approved':
          applicationStatus = 'approved';
          statusDisplay = 'Approved';
          applicationDescription = 'Your application has been approved! Welcome to the community.';
          break;
        case 'rejected':
        case 'declined':
          applicationStatus = 'rejected';
          statusDisplay = 'Rejected';
          applicationDescription = 'Your application was not approved. You may reapply after addressing feedback.';
          break;
        case 'under_review':
          applicationStatus = 'under_review';
          statusDisplay = 'Under Review';
          applicationDescription = 'Your application is currently being reviewed by our team.';
          break;
        case 'submitted':
        case 'pending':
        default:
          applicationStatus = 'pending';
          statusDisplay = 'Pending Review';
          applicationDescription = 'Your application is submitted and awaiting review.';
          break;
      }
    } else if (user.is_member === 'applied' && user.membership_stage === 'none') {
      applicationStatus = 'ready_to_apply';
      statusDisplay = 'Ready to Apply';
      applicationDescription = 'Complete your membership application to join our community.';
    }
    
    // Build quick actions based on status
    const quickActions = [];
    
    if (user.role === 'admin' || user.role === 'super_admin') {
      quickActions.push(
        { type: 'primary', text: 'Admin Panel', link: '/admin' },
        { type: 'info', text: 'User Management', link: '/admin/users' },
        { type: 'success', text: 'Applications', link: '/admin/applications' }
      );
    } else {
      quickActions.push({ type: 'primary', text: 'View Profile', link: '/profile' });
      
      if (user.membership_stage === 'member') {
        quickActions.push({ type: 'success', text: 'Iko Chat', link: '/iko' });
      } else if (user.membership_stage === 'pre_member' || user.is_member === 'pre_member') {
        quickActions.push({ type: 'info', text: 'Towncrier', link: '/towncrier' });
        quickActions.push({ type: 'warning', text: 'Apply for Full Membership', link: '/full-membership' });
      } else {
        if (applicationStatus === 'not_submitted' || applicationStatus === 'ready_to_apply') {
          quickActions.push({ type: 'warning', text: 'Submit Application', link: '/applicationsurvey' });
        } else if (applicationStatus === 'pending') {
          quickActions.push({ type: 'info', text: 'Application Status', link: '/pending-verification' });
        } else if (applicationStatus === 'rejected') {
          quickActions.push({ type: 'warning', text: 'Resubmit Application', link: '/applicationsurvey' });
        }
      }
    }
    
    quickActions.push({ type: 'secondary', text: 'Settings', link: '/settings' });
    
    // Build activities timeline
    const activities = [
      {
        type: 'account_created',
        title: 'Account Created',
        description: 'Welcome to the Ikoota platform!',
        date: user.createdAt,
        status: 'completed',
        icon: '🎉'
      }
    ];
    
    if (user.survey_submittedAt || user.applicationSubmittedAt) {
      activities.push({
        type: 'application_submitted',
        title: 'Application Submitted',
        description: applicationDescription,
        date: user.survey_submittedAt || user.applicationSubmittedAt,
        status: applicationStatus.includes('approved') ? 'completed' : 
                applicationStatus === 'rejected' ? 'failed' : 'pending',
        icon: applicationStatus.includes('approved') ? '✅' : 
              applicationStatus === 'rejected' ? '❌' : '📝'
      });
    }
    
    // Build notifications
    const notifications = [{
      type: 'system',
      message: `Welcome back, ${user.username}!`,
      date: new Date().toISOString()
    }];
    
    if (applicationStatus === 'approved_pre_member') {
      notifications.unshift({
        type: 'success',
        message: 'You have Pre-Member access! You can now access Towncrier content.',
        date: user.reviewedAt || new Date().toISOString()
      });
    } else if (applicationStatus === 'ready_to_apply') {
      notifications.unshift({
        type: 'info',
        message: 'Welcome! Complete your membership application to access community features.',
        date: new Date().toISOString()
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          memberSince: user.createdAt,
          role: user.role
        },
        membership: {
          status: memberStatus,
          stage: user.membership_stage,
          displayStatus: statusDisplay
        },
        application: {
          status: applicationStatus,
          statusDisplay: statusDisplay,
          description: applicationDescription,
          submittedAt: user.survey_submittedAt || user.applicationSubmittedAt,
          reviewedAt: user.reviewedAt,
          reviewedBy: user.reviewed_by_name,
          ticket: user.survey_ticket || user.application_ticket,
          adminNotes: user.admin_notes
        },
        activities,
        notifications,
        quickActions
      }
    });
    
  } catch (error) {
    console.error('❌ getUserDashboard error:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Check current membership status
 * GET /api/membership/status
 */
export const getCurrentMembershipStatus = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    console.log('🔍 Checking membership status for user:', userId);
    
    const [userStatus] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.is_member,
        u.membership_stage,
        u.application_status,
        u.applicationSubmittedAt,
        u.applicationReviewedAt,
        u.converse_id,
        u.mentor_id,
        u.primary_class_id,
        u.decline_reason,
        s.approval_status,
        s.reviewedAt as survey_reviewedAt,
        s.createdAt as survey_submittedAt
      FROM users u
      LEFT JOIN surveylog s ON u.id = s.user_id 
        AND s.application_type = 'initial_application'
        AND s.id = (
          SELECT MAX(id) FROM surveylog 
          WHERE user_id = u.id AND application_type = 'initial_application'
        )
      WHERE u.id = ?
    `, [userId]);
    
    if (userStatus.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userStatus[0];
    
    // Determine if user needs to complete survey
    const needsSurvey = (
      user.is_member === 'applied' && 
      user.membership_stage === 'none' && 
      user.application_status === 'not_submitted'
    );
    
    const surveyCompleted = user.application_status !== 'not_submitted' || !!user.survey_submittedAt;
    
    // Determine redirect path based on status
    let redirectTo = '/dashboard';
    if (needsSurvey) {
      redirectTo = '/applicationsurvey';
    } else if (user.is_member === 'pre_member' || user.membership_stage === 'pre_member') {
      redirectTo = '/towncrier';
    } else if (user.is_member === 'member' && user.membership_stage === 'member') {
      redirectTo = '/iko';
    }
    
    res.json({
      success: true,
      user_status: user.is_member,
      membership_stage: user.membership_stage,
      application_status: user.application_status,
      needs_survey: needsSurvey,
      survey_completed: surveyCompleted,
      approval_status: user.approval_status,
      converse_id: user.converse_id,
      submittedAt: user.applicationSubmittedAt || user.survey_submittedAt,
      reviewedAt: user.applicationReviewedAt || user.survey_reviewedAt,
      decline_reason: user.decline_reason,
      redirect_to: redirectTo,
      permissions: {
        can_access_towncrier: ['pre_member', 'member'].includes(user.membership_stage),
        can_access_iko: user.membership_stage === 'member',
        can_apply_full_membership: user.membership_stage === 'pre_member'
      }
    });
    
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get application history for user
 * GET /api/membership/application-history
 */
export const getApplicationHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    // Get application history from surveylog
    const [history] = await db.query(`
      SELECT 
        sl.application_type,
        sl.approval_status,
        sl.createdAt as submittedAt,
        sl.reviewedAt,
        sl.admin_notes,
        reviewer.username as reviewed_by,
        sl.application_ticket as ticket
      FROM surveylog sl
      LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
      WHERE sl.user_id = ?
      ORDER BY sl.createdAt DESC
    `, [userId]);

    // Get review history
    const [reviews] = await db.query(`
      SELECT 
        mrh.application_type,
        mrh.previous_status,
        mrh.new_status,
        mrh.review_notes,
        mrh.action_taken,
        mrh.reviewedAt,
        reviewer.username as reviewer_name
      FROM membership_review_history mrh
      LEFT JOIN users reviewer ON mrh.reviewer_id = reviewer.id
      WHERE mrh.user_id = ?
      ORDER BY mrh.reviewedAt DESC
    `, [userId]);

    return successResponse(res, {
      applications: history,
      reviews
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Get user permissions based on membership level
 * GET /api/membership/permissions
 */
export const getUserPermissions = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    const user = await getUserById(userId);
    
    // Define permissions based on membership stage and role
    const permissions = {
      canAccessTowncrier: ['pre_member', 'member'].includes(user.membership_stage) || ['admin', 'super_admin'].includes(user.role),
      canAccessIko: user.membership_stage === 'member' || ['admin', 'super_admin'].includes(user.role),
      canSubmitInitialApplication: !user.membership_stage || user.membership_stage === 'none' || (user.membership_stage === 'applicant' && user.is_member === 'rejected'),
      canSubmitFullMembershipApplication: user.membership_stage === 'pre_member',
      canAccessAdmin: ['admin', 'super_admin'].includes(user.role),
      canManageUsers: user.role === 'super_admin',
      canReviewApplications: ['admin', 'super_admin'].includes(user.role)
    };
    
    return successResponse(res, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        membership_stage: user.membership_stage,
        is_member: user.is_member,
        role: user.role
      },
      permissions
    });
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// APPLICATION STATUS CHECKING
// =============================================================================

/**
 * Check application status with detailed information
 * GET /api/membership/application/status
 */
export const checkApplicationStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID not found in request'
      });
    }
    
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      return res.status(400).json({
        error: 'Invalid user ID format'
      });
    }
    
    const user = await getUserById(numericUserId);
    
    // Check survey completion
    const surveyQuery = `
      SELECT * FROM surveylog 
      WHERE user_id = ? 
      AND application_type = 'initial_application'
      ORDER BY createdAt DESC 
      LIMIT 1
    `;
    const surveyResult = await db.query(surveyQuery, [numericUserId]);
    
    let surveys = [];
    if (Array.isArray(surveyResult)) {
      surveys = Array.isArray(surveyResult[0]) ? surveyResult[0] : surveyResult;
    }
    
    const latestSurvey = surveys[0] || null;
    const hasSurvey = latestSurvey !== null;
    const surveyCompleted = hasSurvey && latestSurvey.answers && latestSurvey.answers.trim() !== '';
    
    const response = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        converse_id: user.converse_id,
        role: user.role,
        is_member: user.is_member,
        membership_stage: user.membership_stage,
        is_identity_masked: user.is_identity_masked
      },
      survey_completed: surveyCompleted,
      survey_data: latestSurvey,
      approval_status: latestSurvey?.approval_status || 'pending',
      needs_survey: !hasSurvey || !surveyCompleted,
      redirect_to: (!hasSurvey || !surveyCompleted) ? '/applicationsurvey' : '/dashboard'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ checkApplicationStatus error:', error);
    
    const errorResponse = {
      error: error.message || 'Failed to check application status',
      code: error.statusCode || 500
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.debug = {
        stack: error.stack,
        userId: req.user?.id,
        userObject: req.user
      };
    }
    
    res.status(error.statusCode || 500).json(errorResponse);
  }
};

/**
 * Get application requirements and guidelines
 * GET /api/membership/application/requirements
 */
export const getApplicationRequirements = async (req, res) => {
  try {
    const { type = 'initial' } = req.query;
    
    let requirements, guidelines, estimatedTime;
    
    if (type === 'initial') {
      requirements = [
        'Valid email address for verification',
        'Complete personal information',
        'Answer all application questions',
        'Agree to community guidelines',
        'Provide reason for joining'
      ];
      
      guidelines = [
        'Be honest and thorough in your responses',
        'Provide specific examples where requested',
        'Review your answers before submission',
        'Application processing takes 3-5 business days',
        'You will receive email notification of decision'
      ];
      
      estimatedTime = '10-15 minutes';
    } else {
      requirements = [
        'Must be an approved pre-member',
        'Active participation for at least 30 days',
        'Good standing with community guidelines',
        'Complete full membership questionnaire',
        'Provide references if requested'
      ];
      
      guidelines = [
        'Demonstrate your commitment to the community',
        'Show examples of your participation and contributions',
        'Be prepared for potential interview process',
        'Full membership review takes 5-7 business days',
        'Decision will be communicated via email'
      ];
      
      estimatedTime = '20-30 minutes';
    }
    
    return successResponse(res, {
      applicationType: type,
      requirements,
      guidelines,
      estimatedTime,
      supportContact: 'support@ikoota.com'
    });
    
  } catch (error) {
    return errorResponse(res, error);
  }
};

// =============================================================================
// APPLICATION MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Update application answers (before submission)
 * PUT /api/membership/application/update-answers
 */
export const updateApplicationAnswers = async (req, res) => {
  try {
    const { answers, applicationType = 'initial_application' } = req.body;
    const userId = req.user.id || req.user.user_id;
    
    if (!answers || !Array.isArray(answers)) {
      throw new CustomError('Valid answers array is required', 400);
    }
    
    // Check if application exists and is still pending
    const [applications] = await db.query(`
      SELECT id, approval_status 
      FROM surveylog 
      WHERE user_id = ? AND application_type = ?
      ORDER BY createdAt DESC LIMIT 1
    `, [userId, applicationType]);
    
    if (!applications.length) {
      throw new CustomError('No application found to update', 404);
    }
    
    const application = applications[0];
    
    if (application.approval_status !== 'pending') {
      throw new CustomError('Cannot update application that has already been reviewed', 400);
    }
    
    // Update application answers
    await db.query(`
      UPDATE surveylog 
      SET answers = ?, updatedAt = NOW()
      WHERE id = ?
    `, [JSON.stringify(answers), application.id]);
    
    return successResponse(res, {
      applicationId: application.id,
      updatedAnswers: answers.length
    }, 'Application answers updated successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Withdraw application (user can withdraw pending applications)
 * POST /api/membership/application/withdraw
 */
export const withdrawApplication = async (req, res) => {
  try {
    const { applicationType = 'initial_application', reason } = req.body;
    const userId = req.user.id || req.user.user_id;
    
    // Check if application exists and is pending
    const [applications] = await db.query(`
      SELECT id, approval_status 
      FROM surveylog 
      WHERE user_id = ? AND application_type = ?
      ORDER BY createdAt DESC LIMIT 1
    `, [userId, applicationType]);
    
    if (!applications.length) {
      throw new CustomError('No application found to withdraw', 404);
    }
    
    const application = applications[0];
    
    if (application.approval_status !== 'pending') {
      throw new CustomError('Can only withdraw pending applications', 400);
    }
    
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update application status to withdrawn
      await connection.execute(`
        UPDATE surveylog 
        SET approval_status = 'declined', admin_notes = ?, reviewedAt = NOW()
        WHERE id = ?
      `, [reason || 'Withdrawn by user', application.id]);
      
      // If withdrawing initial application, reset user status
      if (applicationType === 'initial_application') {
        await connection.execute(`
          UPDATE users 
          SET membership_stage = 'none', is_member = 'applied'
          WHERE id = ?
        `, [userId]);
      }
      
      await connection.commit();
      connection.release();
      
      return successResponse(res, {
        applicationId: application.id,
        applicationType
      }, 'Application withdrawn successfully');
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// FULL MEMBERSHIP STATUS & ACCESS
// =============================================================================

/**
 * Get full membership status and eligibility
 * GET /api/membership/full-membership/status
 */
export const getFullMembershipStatus = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    const user = await getUserById(userId);
    
    // Get full membership application details if exists
    const [fullMembershipApps] = await db.query(`
      SELECT 
        fma.id,
        fma.membership_ticket,
        fma.status,
        fma.submittedAt,
        fma.reviewedAt,
        fma.admin_notes,
        fma.answers,
        reviewer.username as reviewed_by
      FROM full_membership_applications fma
      LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
      WHERE fma.user_id = ?
      ORDER BY fma.submittedAt DESC
      LIMIT 1
    `, [userId]);
    
    // Check eligibility for full membership
    const isEligible = user.membership_stage === 'pre_member';
    const currentApp = fullMembershipApps[0] || null;
    
    // Get requirements and benefits
    const requirements = [
      'Must be an approved pre-member',
      'Active participation for at least 30 days',
      'Good standing with community guidelines',
      'Complete full membership questionnaire'
    ];
    
    const benefits = [
      'Access to exclusive Iko Chat',
      'Advanced educational content',
      'Mentorship opportunities',
      'Community leadership roles',
      'Priority support and feedback'
    ];
    
    return successResponse(res, {
      currentStatus: {
        membership_stage: user.membership_stage,
        is_member: user.is_member,
        full_membership_status: user.full_membership_status
      },
      fullMembershipApplication: currentApp,
      eligibility: {
        isEligible,
        canApply: isEligible && (!currentApp || currentApp.status === 'declined'),
        requirements,
        benefits
      },
      nextSteps: isEligible ? [
        'Review full membership benefits',
        'Complete full membership application',
        'Submit required information'
      ] : [
        'Complete initial membership process first'
      ]
    });
    
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Log full membership access
 * POST /api/membership/full-membership/log-access
 */
export const logFullMembershipAccess = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    // Insert or update access log
    await db.query(`
      INSERT INTO full_membership_access (user_id, firstAccessedAt, lastAccessedAt, access_count)
      VALUES (?, NOW(), NOW(), 1)
      ON DUPLICATE KEY UPDATE 
        lastAccessedAt = NOW(),
        access_count = access_count + 1
    `, [userId]);
    
    // Get updated access info
    const [accessInfo] = await db.query(`
      SELECT firstAccessedAt, lastAccessedAt, access_count
      FROM full_membership_access
      WHERE user_id = ?
    `, [userId]);
    
    return successResponse(res, {
      accessInfo: accessInfo[0] || null
    }, 'Access logged successfully');
    
  } catch (error) {
    return errorResponse(res, error);
  }
};

// =============================================================================
// HEALTH & TESTING FUNCTIONS
// =============================================================================

/**
 * Health check endpoint for membership system
 * GET /api/membership/health
 */
export const healthCheck = async (req, res) => {
  try {
    // Check database connectivity
    await db.query('SELECT 1 as health_check');
    
    // Get basic system stats
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as new_users_24h,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_applications
      FROM users
    `);
    
    return successResponse(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: stats[0],
      version: '3.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
    
  } catch (error) {
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Test user lookup functionality
 * GET /api/membership/test-user/:userId
 */
export const testUserLookup = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id;
    
    console.log('🧪 Testing user lookup for:', {
      paramUserId: req.params.userId,
      authUserId: req.user?.id,
      finalUserId: userId
    });
    
    const user = await getUserById(userId);
    
    res.json({
      success: true,
      user,
      debug: {
        originalUserId: userId,
        type: typeof userId,
        converted: parseInt(userId, 10)
      }
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message,
      debug: {
        userId,
        type: typeof userId,
        stack: error.stack
      }
    });
  }
};

// =============================================================================
// EXPORT ALL FUNCTIONS
// =============================================================================

export default {
  // Dashboard & Status
  getUserDashboard,
  getCurrentMembershipStatus,
  getApplicationHistory,
  getUserPermissions,
  
  // Application Status
  checkApplicationStatus,
  getApplicationRequirements,
  
  // Application Management
  updateApplicationAnswers,
  withdrawApplication,
  
  // Full Membership
  getFullMembershipStatus,
  logFullMembershipAccess,
  
  // System & Testing
  healthCheck,
  testUserLookup,
  
  // Utilities (for internal use)
  generateApplicationTicket,
  getUserById,
  successResponse,
  errorResponse
};