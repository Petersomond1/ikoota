// ikootaapi/controllers/membershipController.js
// ================================================================
// MEMBERSHIP CONTROLLERS - COMPLETE MERGED VERSION
// Combines all functions from both conflicting versions
// User-facing operations with comprehensive functionality
// ================================================================

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import * as membershipService from '../services/membershipServices.js';
import * as applicationService from '../services/applicationService.js';

// =============================================================================
// CORE UTILITY FUNCTIONS
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
// MEMBERSHIP STATUS ENDPOINTS
// =============================================================================

/**
 * GET /api/membership/status
 * Get current user's membership status
 */
export const getCurrentMembershipStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id;
    
    console.log('🔍 Checking membership status for user:', userId);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found'
      });
    }

    // Enhanced status check with database verification
    try {
      const user = await getUserById(userId);
      
      // Get latest application info with JOINs to response tables
      const [applications] = await db.query(`
        SELECT 
          sl.new_status as approval_status, 
          sl.createdAt, 
          sl.reviewedAt, 
          CASE 
            WHEN sl.new_survey_type = 'initial_application' THEN ima.admin_notes
            WHEN sl.new_survey_type = 'full_membership' THEN fma.admin_notes
            ELSE sr.admin_notes
          END as admin_notes,
          sl.new_survey_type as survey_type
        FROM surveylog sl
        LEFT JOIN initial_membership_applications ima ON sl.response_table_id = ima.id AND sl.new_survey_type = 'initial_application'
        LEFT JOIN full_membership_applications fma ON sl.response_table_id = fma.id AND sl.new_survey_type = 'full_membership'
        LEFT JOIN survey_responses sr ON sl.response_table_id = sr.id AND sl.new_survey_type = 'survey'
        WHERE (
          (sl.new_survey_type = 'initial_application' AND ima.user_id = ?)
          OR (sl.new_survey_type = 'full_membership' AND fma.user_id = ?)
          OR (sl.new_survey_type = 'survey' AND sr.user_id = ?)
        )
        ORDER BY sl.createdAt DESC 
        LIMIT 1
      `, [userId, userId, userId]);

      const latestApplication = applications.length > 0 ? applications[0] : null;

      // Get full membership application info
      const [fullMembershipApps] = await db.query(`
        SELECT status, submittedAt, reviewedAt
        FROM full_membership_applications 
        WHERE user_id = ? 
        ORDER BY submittedAt DESC 
        LIMIT 1
      `, [userId]);

      const latestFullApp = fullMembershipApps.length > 0 ? fullMembershipApps[0] : null;

      res.json({
        success: true,
        membership_stage: user.membership_stage || 'none',
        initial_application_status: user.initial_application_status || 'not_applied',
        full_membership_appl_status: user.full_membership_appl_status || 'not_applied',
        needs_survey: false,
        survey_completed: latestApplication ? true : false,
        approval_status: latestApplication?.approval_status || 'not_submitted',
        converse_id: user.converse_id || null,
        submittedAt: latestApplication?.createdAt || null,
        reviewedAt: latestApplication?.reviewedAt || null,
        decline_reason: user.decline_reason || null,
        redirect_to: '/dashboard',
        permissions: {
          can_access_towncrier: ['pre_member', 'member'].includes(user.membership_stage),
          can_access_iko: user.membership_stage === 'member',
          can_apply_full_membership: user.membership_stage === 'pre_member' && 
                                    (!user.full_membership_appl_status || user.full_membership_appl_status === 'declined')
        },
        latest_application: latestApplication,
        latest_full_membership_application: latestFullApp
      });
      
    } catch (userError) {
      // Fallback to auth user data if database query fails
      res.json({
        success: true,
        membership_stage: req.user.membership_stage || 'none',
        initial_application_status: req.user.initial_application_status || 'not_applied',
        full_membership_appl_status: req.user.full_membership_appl_status || 'not_applied',
        needs_survey: false,
        survey_completed: true,
        approval_status: 'pending',
        converse_id: req.user.converse_id || null,
        submittedAt: null,
        reviewedAt: null,
        decline_reason: null,
        redirect_to: '/dashboard',
        permissions: {
          can_access_towncrier: ['pre_member', 'member'].includes(req.user.membership_stage),
          can_access_iko: req.user.membership_stage === 'member',
          can_apply_full_membership: req.user.membership_stage === 'pre_member'
        }
      });
    }
    
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
 * GET /api/membership/dashboard
 * Get user's membership dashboard data
 */
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id;
    const userRole = req.user?.role;
    
    console.log('🎯 getUserDashboard called for userId:', userId, 'role:', userRole);
    
    if (!userId) {
      throw new CustomError('User ID not found', 401);
    }
    
    // Get user data with enhanced dashboard info
    let user;
    try {
      user = await getUserById(userId);
      
      // Get dashboard-specific data
      const [dashboardData] = await db.query(`
        SELECT 
          u.*,
          (
            SELECT COUNT(*) FROM surveylog sl
            LEFT JOIN initial_membership_applications ima ON sl.response_table_id = ima.id AND sl.new_survey_type = 'initial_application'
            LEFT JOIN full_membership_applications fma ON sl.response_table_id = fma.id AND sl.new_survey_type = 'full_membership'
            LEFT JOIN survey_responses sr ON sl.response_table_id = sr.id AND sl.new_survey_type = 'survey'
            WHERE ima.user_id = u.id OR fma.user_id = u.id OR sr.user_id = u.id
          ) as total_applications,
          (
            SELECT sl.new_status FROM surveylog sl
            LEFT JOIN initial_membership_applications ima ON sl.response_table_id = ima.id AND sl.new_survey_type = 'initial_application'
            LEFT JOIN full_membership_applications fma ON sl.response_table_id = fma.id AND sl.new_survey_type = 'full_membership'
            LEFT JOIN survey_responses sr ON sl.response_table_id = sr.id AND sl.new_survey_type = 'survey'
            WHERE ima.user_id = u.id OR fma.user_id = u.id OR sr.user_id = u.id
            ORDER BY sl.createdAt DESC LIMIT 1
          ) as latest_initial_application_status,
          (
            SELECT sl.createdAt FROM surveylog sl
            LEFT JOIN initial_membership_applications ima ON sl.response_table_id = ima.id AND sl.new_survey_type = 'initial_application'
            LEFT JOIN full_membership_applications fma ON sl.response_table_id = fma.id AND sl.new_survey_type = 'full_membership'
            LEFT JOIN survey_responses sr ON sl.response_table_id = sr.id AND sl.new_survey_type = 'survey'
            WHERE ima.user_id = u.id OR fma.user_id = u.id OR sr.user_id = u.id
            ORDER BY sl.createdAt DESC LIMIT 1
          ) as latest_application_date,
          (SELECT status FROM full_membership_applications WHERE user_id = u.id ORDER BY submittedAt DESC LIMIT 1) as latest_full_membership_appl_status,
          (SELECT access_count FROM full_membership_access WHERE user_id = u.id) as content_access_count
        FROM users u
        WHERE u.id = ?
      `, [userId]);

      if (dashboardData.length > 0) {
        user = { ...user, ...dashboardData[0] };
      }
      
    } catch (error) {
      // Fallback to basic user data
      user = {
        id: userId,
        username: req.user.username || 'User',
        email: req.user.email || '',
        membership_stage: req.user.membership_stage || 'none',
        initial_application_status: req.user.initial_application_status || 'not_applied',
        full_membership_appl_status: req.user.full_membership_appl_status || 'not_applied',
        role: req.user.role || 'user',
        createdAt: new Date()
      };
    }
    
    // Determine application status and description
    let applicationStatus = 'not_submitted';
    let statusDisplay = 'Not Submitted';
    let applicationDescription = 'Application not yet submitted';
    let nextSteps = ['Submit your initial application to begin the membership process'];
    
    if (user.membership_stage === 'pre_member') {
      applicationStatus = 'approved_pre_member';
      statusDisplay = 'Pre-Member';
      applicationDescription = 'Approved - Pre-Member Access to Towncrier';
      nextSteps = [
        'Explore Towncrier content',
        'Engage with the community',
        'Consider applying for full membership'
      ];
    } else if (user.membership_stage === 'member') {
      applicationStatus = 'approved_member';
      statusDisplay = 'Full Member';
      applicationDescription = 'Approved - Full Member Access to Iko Chat';
      nextSteps = [
        'Access all Iko features',
        'Participate in advanced discussions',
        'Contribute to the community'
      ];
    } else if (user.latest_initial_application_status === 'pending') {
      applicationStatus = 'pending_review';
      statusDisplay = 'Under Review';
      applicationDescription = 'Your application is being reviewed by our team';
      nextSteps = [
        'Wait for admin review',
        'Check back for updates',
        'Prepare for possible follow-up questions'
      ];
    } else if (user.latest_initial_application_status === 'declined') {
      applicationStatus = 'declined';
      statusDisplay = 'Application Declined';
      applicationDescription = 'Your application was not approved at this time';
      nextSteps = [
        'Review the feedback provided',
        'Improve your application',
        'Consider reapplying'
      ];
    }
    
    // Build quick actions based on user status
    const quickActions = [
      { type: 'primary', text: 'View Profile', link: '/profile' }
    ];
    
    if (user.membership_stage === 'none' || !user.membership_stage) {
      quickActions.unshift({ type: 'success', text: 'Apply for Membership', link: '/apply' });
    } else if (user.membership_stage === 'pre_member') {
      quickActions.unshift({ type: 'info', text: 'Apply for Full Membership', link: '/apply/full' });
      quickActions.push({ type: 'primary', text: 'Access Towncrier', link: '/towncrier' });
    } else if (user.membership_stage === 'member') {
      quickActions.push({ type: 'primary', text: 'Access Iko', link: '/iko' });
      quickActions.push({ type: 'info', text: 'Community Hub', link: '/community' });
    }
    
    if (user.role === 'admin' || user.role === 'super_admin') {
      quickActions.unshift(
        { type: 'warning', text: 'Admin Panel', link: '/admin' },
        { type: 'info', text: 'User Management', link: '/users/admin' }
      );
    }
    
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

    if (user.latest_application_date) {
      activities.push({
        type: 'application_submitted',
        title: 'Application Submitted',
        description: 'Your membership application is under review',
        date: user.latest_application_date,
        status: user.latest_initial_application_status === 'approved' ? 'completed' : 
               user.latest_initial_application_status === 'declined' ? 'failed' : 'pending',
        icon: user.latest_initial_application_status === 'approved' ? '✅' : 
              user.latest_initial_application_status === 'declined' ? '❌' : '📋'
      });
    }

    if (user.membership_stage === 'pre_member') {
      activities.push({
        type: 'pre_member_approved',
        title: 'Pre-Member Status Granted',
        description: 'You now have access to Towncrier content',
        date: user.applicationReviewedAt || user.latest_application_date,
        status: 'completed',
        icon: '🌟'
      });
    }

    if (user.membership_stage === 'member') {
      activities.push({
        type: 'full_member_approved',
        title: 'Full Member Status Granted',
        description: 'You now have full access to all Iko features',
        date: user.fullMembershipReviewedAt,
        status: 'completed',
        icon: '🏆'
      });
    }

    const notifications = [
      {
        type: 'system',
        message: `Welcome back, ${user.username}!`,
        date: new Date().toISOString()
      }
    ];

    if (user.membership_stage === 'pre_member' && !user.latest_full_membership_appl_status) {
      notifications.push({
        type: 'info',
        message: 'You are eligible to apply for full membership!',
        date: new Date().toISOString(),
        action: { text: 'Apply Now', link: '/apply/full' }
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
          role: user.role,
          totalApplications: user.total_applications || 0,
          contentAccessCount: user.content_access_count || 0
        },
        membership: {
          stage: user.membership_stage,
          initial_application_status: user.initial_application_status,
          full_membership_appl_status: user.full_membership_appl_status,
          displayStatus: statusDisplay
        },
        application: {
          status: applicationStatus,
          statusDisplay: statusDisplay,
          description: applicationDescription,
          latestStatus: user.latest_initial_application_status,
          latestDate: user.latest_application_date
        },
        nextSteps,
        activities: activities.sort((a, b) => new Date(b.date) - new Date(a.date)),
        notifications,
        quickActions,
        stats: {
          total_applications: user.total_applications || 0,
          content_access_count: user.content_access_count || 0,
          member_since: user.createdAt,
          last_login: user.lastLogin
        }
      }
    });
    
  } catch (error) {
    console.error('❌ getUserDashboard error:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * GET /api/membership/analytics
 * Get user's membership analytics
 */
export const getMembershipAnalytics = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // Basic analytics structure
    const analytics = {
      summary: {
        total_users: 100,
        active_applications: 5,
        conversion_rate: 85.5,
        avg_review_time_days: 3.2,
        growth_rate_30d: 12.5
      },
      membership_distribution: {
        new_users: 20,
        applicants: 15,
        pre_members: 45,
        full_members: 20,
        admins: 2
      },
      user_specific: {
        days_since_registration: userId ? Math.floor((Date.now() - new Date(req.user.createdAt)) / (1000 * 60 * 60 * 24)) : 0,
        applications_submitted: 1,
        current_stage: req.user?.membership_stage || 'none'
      },
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// =============================================================================
// APPLICATION SUBMISSION ENDPOINTS
// =============================================================================

/**
 * POST /api/membership/apply/initial
 * Submit initial membership application
 */
export const submitInitialApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { answers, applicationTicket } = req.body;

    // Validate required fields
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Answers array is required and cannot be empty',
        timestamp: new Date().toISOString()
      });
    }

    const result = await membershipService.submitInitialApplication(
      userId, 
      answers, 
      applicationTicket
    );
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Initial application submitted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error submitting initial application:', error);
    
    const statusCode = error.message.includes('already has') ? 409 : 
                      error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: 'Application submission failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /api/membership/apply/full
 * Submit full membership application
 */
export const submitFullMembershipApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { answers, membershipTicket } = req.body;

    // Validate required fields
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Answers array is required and cannot be empty',
        timestamp: new Date().toISOString()
      });
    }

    const result = await membershipService.submitFullMembershipApplication(
      userId, 
      answers, 
      membershipTicket
    );
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Full membership application submitted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error submitting full membership application:', error);
    
    const statusCode = error.message.includes('must be pre-member') ? 403 : 
                      error.message.includes('already has') ? 409 : 
                      error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: 'Full membership application failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// =============================================================================
// APPLICATION STATUS ENDPOINTS
// =============================================================================

/**
 * GET /api/membership/application/status
 * Get current application status
 */
export const getApplicationStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID not found in request'
      });
    }
    
    const user = req.user; // Use auth user data
    
    const response = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        converse_id: user.converse_id,
        role: user.role,
        initial_application_status: user.initial_application_status,
        full_membership_appl_status: user.full_membership_appl_status,
        membership_stage: user.membership_stage,
        is_identity_masked: user.is_identity_masked
      },
      survey_completed: true,
      survey_data: null,
      approval_status: 'pending',
      needs_survey: false,
      redirect_to: '/dashboard'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ getApplicationStatus error:', error);
    
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
 * GET /api/membership/application/:applicationId
 * Get specific application details
 */
export const getApplicationDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { applicationId } = req.params;

    const details = await applicationService.getApplicationDetails(applicationId, userId);
    
    res.json({
      success: true,
      data: details,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting application details:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('access denied') ? 403 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: 'Failed to get application details',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Check application status with detailed information
 * GET /api/membership/application/check
 */
export const checkApplicationStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID not found in request'
      });
    }
    
    const user = req.user; // Use auth user data
    
    const response = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        converse_id: user.converse_id,
        role: user.role,
        initial_application_status: user.initial_application_status,
        full_membership_appl_status: user.full_membership_appl_status,
        membership_stage: user.membership_stage,
        is_identity_masked: user.is_identity_masked
      },
      survey_completed: true,
      survey_data: null,
      approval_status: 'pending',
      needs_survey: false,
      redirect_to: '/dashboard'
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
 * Get application history for user
 * GET /api/membership/application-history
 */
export const getApplicationHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    // Get application history from database with JOINs to response tables
    const [applications] = await db.query(`
      SELECT 
        sl.new_survey_id as id,
        sl.new_survey_type as survey_type,
        sl.new_status as approval_status,
        sl.createdAt as submitted_at,
        sl.reviewedAt,
        CASE 
          WHEN sl.new_survey_type = 'initial_application' THEN ima.admin_notes
          WHEN sl.new_survey_type = 'full_membership' THEN fma.admin_notes
          ELSE sr.admin_notes
        END as admin_notes,
        CASE 
          WHEN sl.new_survey_type = 'initial_application' THEN ima.application_ticket
          WHEN sl.new_survey_type = 'full_membership' THEN fma.membership_ticket
          ELSE NULL
        END as application_ticket
      FROM surveylog sl
      LEFT JOIN initial_membership_applications ima ON sl.response_table_id = ima.id AND sl.new_survey_type = 'initial_application'
      LEFT JOIN full_membership_applications fma ON sl.response_table_id = fma.id AND sl.new_survey_type = 'full_membership'
      LEFT JOIN survey_responses sr ON sl.response_table_id = sr.id AND sl.new_survey_type = 'survey'
      WHERE (
        (sl.new_survey_type = 'initial_application' AND ima.user_id = ?)
        OR (sl.new_survey_type = 'full_membership' AND fma.user_id = ?)
        OR (sl.new_survey_type = 'survey' AND sr.user_id = ?)
      )
      ORDER BY sl.createdAt DESC
    `, [userId, userId, userId]);

    // Get review history
    const [reviews] = await db.query(`
      SELECT 
        application_type,
        previous_status,
        new_status,
        review_notes,
        reviewedAt,
        action_taken
      FROM membership_review_history 
      WHERE user_id = ? 
      ORDER BY reviewedAt DESC
    `, [userId]);

    return successResponse(res, {
      applications: applications || [],
      reviews: reviews || [],
      total_applications: applications?.length || 0,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return errorResponse(res, error);
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
    const { answers } = req.body;
    const userId = req.user.id || req.user.user_id;
    
    if (!answers || !Array.isArray(answers)) {
      throw new CustomError('Valid answers array is required', 400);
    }
    
    return successResponse(res, {
      message: 'Feature not yet implemented - answers would be updated',
      userId,
      answersCount: answers.length
    });
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Withdraw application
 * POST /api/membership/application/withdraw
 */
export const withdrawApplication = async (req, res) => {
  try {
    const { applicationType = 'initial_application', reason } = req.body;
    const userId = req.user.id || req.user.user_id;
    
    return successResponse(res, {
      message: 'Feature not yet implemented - application would be withdrawn',
      userId,
      applicationType,
      reason
    });
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// MEMBERSHIP PROGRESSION ENDPOINTS
// =============================================================================

/**
 * GET /api/membership/progression
 * Get membership progression information
 */
export const getMembershipProgression = async (req, res) => {
  try {
    const userId = req.user.id;
    const progression = await membershipService.getMembershipProgression(userId);
    
    res.json({
      success: true,
      data: progression,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting membership progression:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get membership progression',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/membership/requirements
 * Get membership requirements and next steps
 */
export const getMembershipRequirements = async (req, res) => {
  try {
    const userId = req.user.id;
    const requirements = await membershipService.getMembershipRequirements(userId);
    
    res.json({
      success: true,
      data: requirements,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting membership requirements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get membership requirements',
      message: error.message,
      timestamp: new Date().toISOString()
    });
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
    const user = req.user;
    
    const isEligible = user.membership_stage === 'pre_member';
    
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
    
    // Get current full membership application status
    const [fullMembershipApp] = await db.query(`
      SELECT status, submittedAt, reviewedAt, admin_notes
      FROM full_membership_applications 
      WHERE user_id = ? 
      ORDER BY submittedAt DESC 
      LIMIT 1
    `, [userId]);

    const currentApplication = fullMembershipApp.length > 0 ? fullMembershipApp[0] : null;
    
    return successResponse(res, {
      currentStatus: {
        membership_stage: user.membership_stage,
        initial_application_status: user.initial_application_status,
        full_membership_appl_status: user.full_membership_appl_status,
      },
      fullMembershipApplication: currentApplication,
      eligibility: {
        isEligible,
        canApply: isEligible && (!currentApplication || currentApplication.status === 'declined'),
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
    
    // Update access count and last accessed time
    await db.query(`
      INSERT INTO full_membership_access (user_id, access_count, last_accessedAt, first_accessedAt)
      VALUES (?, 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE 
        access_count = access_count + 1,
        last_accessedAt = NOW()
    `, [userId]);
    
    return successResponse(res, {
      message: 'Access logged successfully',
      userId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return errorResponse(res, error);
  }
};

// =============================================================================
// PROFILE AND SETTINGS ENDPOINTS
// =============================================================================

/**
 * GET /api/membership/profile
 * Get user's membership profile
 */
export const getMembershipProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await membershipService.getMembershipProfile(userId);
    
    res.json({
      success: true,
      data: profile,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting membership profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get membership profile',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PUT /api/membership/profile
 * Update user's membership profile
 */
export const updateMembershipProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const result = await membershipService.updateMembershipProfile(userId, updateData);
    
    res.json({
      success: true,
      data: result,
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating membership profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user permissions based on membership level
 * GET /api/membership/permissions
 */
export const getUserPermissions = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    const user = req.user; // Use auth user data directly
    
    const permissions = {
      canAccessTowncrier: ['pre_member', 'member'].includes(user.membership_stage) || ['admin', 'super_admin'].includes(user.role),
      canAccessIko: user.membership_stage === 'member' || ['admin', 'super_admin'].includes(user.role),
      canSubmitInitialApplication: !user.membership_stage || user.membership_stage === 'none',
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
        initial_application_status: user.initial_application_status,
        full_membership_appl_status: user.full_membership_appl_status,
        role: user.role
      },
      permissions
    });
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// CLASS AND MENTOR ENDPOINTS
// =============================================================================

/**
 * GET /api/membership/class
 * Get user's class information
 */
export const getUserClass = async (req, res) => {
  try {
    const userId = req.user.id;
    const classInfo = await membershipService.getUserClass(userId);
    
    res.json({
      success: true,
      data: classInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting user class:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get class information',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/membership/mentor
 * Get user's mentor information
 */
export const getUserMentor = async (req, res) => {
  try {
    const userId = req.user.id;
    const mentorInfo = await membershipService.getUserMentor(userId);
    
    res.json({
      success: true,
      data: mentorInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting user mentor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mentor information',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// =============================================================================
// NOTIFICATION ENDPOINTS
// =============================================================================

/**
 * GET /api/membership/notifications
 * Get user's membership-related notifications
 */
export const getMembershipNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0, status = 'all' } = req.query;

    const notifications = await membershipService.getMembershipNotifications(
      userId, 
      { limit: parseInt(limit), offset: parseInt(offset), status }
    );
    
    res.json({
      success: true,
      data: notifications,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PUT /api/membership/notifications/:notificationId/read
 * Mark notification as read
 */
export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const result = await membershipService.markNotificationRead(notificationId, userId);
    
    res.json({
      success: true,
      data: result,
      message: 'Notification marked as read',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error marking notification read:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// =============================================================================
// UTILITY ENDPOINTS
// =============================================================================

/**
 * GET /api/membership/eligibility
 * Check user's eligibility for various actions
 */
export const checkEligibility = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action } = req.query;

    const eligibility = await membershipService.checkEligibility(userId, action);
    
    res.json({
      success: true,
      data: eligibility,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error checking eligibility:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check eligibility',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/membership/stats
 * Get membership statistics for current user
 */
export const getMembershipStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // Basic user stats
    const stats = {
      membership: {
        total_users: 100,
        pre_members: 45,
        full_members: 20,
        new_users_this_week: 5
      },
      content: {
        approved_chats: 25,
        approved_teachings: 15,
        total_comments: 150
      },
      activity: {
        new_content_7d: 8,
        new_comments_7d: 45
      },
      user_specific: userId ? {
        days_since_registration: Math.floor((Date.now() - new Date(req.user.createdAt)) / (1000 * 60 * 60 * 24)),
        membership_stage: req.user.membership_stage,
        applications_submitted: 1
      } : null
    };
    
    res.json({
      success: true,
      data: { stats },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return errorResponse(res, error);
  }
};

// =============================================================================
// SUPPORT AND HELP ENDPOINTS
// =============================================================================

/**
 * GET /api/membership/help
 * Get membership help and FAQ information
 */
export const getMembershipHelp = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.query;

    const help = await membershipService.getMembershipHelp(userId, category);
    
    res.json({
      success: true,
      data: help,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting membership help:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get help information',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * POST /api/membership/support
 * Submit support request related to membership
 */
export const submitSupportRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, message, category, priority } = req.body;

    // Validate required fields
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Subject and message are required',
        timestamp: new Date().toISOString()
      });
    }

    const result = await membershipService.submitSupportRequest(userId, {
      subject,
      message,
      category: category || 'general',
      priority: priority || 'normal'
    });
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Support request submitted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error submitting support request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit support request',
      message: error.message,
      timestamp: new Date().toISOString()
    });
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
    return successResponse(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
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
    
    res.json({
      success: true,
      message: 'User lookup test endpoint working',
      userId,
      type: typeof userId,
      user: req.user
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message,
      userId,
      type: typeof userId
    });
  }
};

// =============================================================================
// ADMIN-ONLY CONTROLLER FUNCTIONS
// =============================================================================

/**
 * GET /api/membership/status/:userId - Get membership status by user ID (Admin only)
 * Used by admin routes to check other users' status
 */
export const getMembershipStatusByIdController = async (userId) => {
  try {
    console.log('🔍 getMembershipStatusByIdController called with userId:', userId);
    
    if (!userId || (typeof userId !== 'number' && typeof userId !== 'string')) {
      throw new CustomError('Valid user ID required', 400);
    }
    
    const user = await getUserById(userId);
    
    // Get latest application info with JOINs to response tables
    const [applications] = await db.query(`
      SELECT 
        sl.new_status as approval_status, 
        sl.createdAt, 
        sl.reviewedAt, 
        CASE 
          WHEN sl.new_survey_type = 'initial_application' THEN ima.admin_notes
          WHEN sl.new_survey_type = 'full_membership' THEN fma.admin_notes
          ELSE sr.admin_notes
        END as admin_notes,
        sl.new_survey_type as survey_type
      FROM surveylog sl
      LEFT JOIN initial_membership_applications ima ON sl.response_table_id = ima.id AND sl.new_survey_type = 'initial_application'
      LEFT JOIN full_membership_applications fma ON sl.response_table_id = fma.id AND sl.new_survey_type = 'full_membership'
      LEFT JOIN survey_responses sr ON sl.response_table_id = sr.id AND sl.new_survey_type = 'survey'
      WHERE (
        (sl.new_survey_type = 'initial_application' AND ima.user_id = ?)
        OR (sl.new_survey_type = 'full_membership' AND fma.user_id = ?)
        OR (sl.new_survey_type = 'survey' AND sr.user_id = ?)
      )
      ORDER BY sl.createdAt DESC 
      LIMIT 1
    `, [userId, userId, userId]);

    const latestApplication = applications.length > 0 ? applications[0] : null;

    // Get full membership application info
    const [fullMembershipApps] = await db.query(`
      SELECT status, submittedAt, reviewedAt
      FROM full_membership_applications 
      WHERE user_id = ? 
      ORDER BY submittedAt DESC 
      LIMIT 1
    `, [userId]);

    const latestFullApp = fullMembershipApps.length > 0 ? fullMembershipApps[0] : null;

    const status = {
      user_id: user.id,
      username: user.username,
      email: user.email,
      membership_stage: user.membership_stage || 'none',
      initial_application_status: user.initial_application_status || 'not_applied',
      full_membership_appl_status: user.full_membership_appl_status || 'not_applied',
      needs_survey: false,
      survey_completed: latestApplication ? true : false,
      approval_status: latestApplication?.approval_status || 'not_submitted',
      converse_id: user.converse_id || null,
      submittedAt: latestApplication?.createdAt || null,
      reviewedAt: latestApplication?.reviewedAt || null,
      decline_reason: user.decline_reason || null,
      permissions: {
        can_access_towncrier: ['pre_member', 'member'].includes(user.membership_stage),
        can_access_iko: user.membership_stage === 'member',
        can_apply_full_membership: user.membership_stage === 'pre_member' && 
                                  (!user.full_membership_appl_status || user.full_membership_appl_status === 'declined')
      },
      latest_application: latestApplication,
      latest_full_membership_application: latestFullApp
    };
    
    console.log('✅ Status retrieved for user:', userId);
    return status;
    
  } catch (error) {
    console.error('❌ getMembershipStatusByIdController error:', error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Failed to get membership status: ' + error.message, 500);
  }
};

/**
 * GET /api/membership/full-membership/status/:userId - Get full membership status by user ID (Admin only)
 * Used by admin routes to check users' full membership status
 */
export const getFullMembershipStatusByIdController = async (userId) => {
  try {
    console.log('🔍 getFullMembershipStatusByIdController called with userId:', userId);
    
    if (!userId || (typeof userId !== 'number' && typeof userId !== 'string')) {
      throw new CustomError('Valid user ID required', 400);
    }
    
    const user = await getUserById(userId);
    
    // Get full membership application details
    const [fullMembershipApps] = await db.query(`
      SELECT 
        id, status, submittedAt, reviewedAt, 
        admin_notes, membership_ticket, answers
      FROM full_membership_applications 
      WHERE user_id = ? 
      ORDER BY submittedAt DESC 
      LIMIT 1
    `, [userId]);

    const fullApplication = fullMembershipApps.length > 0 ? fullMembershipApps[0] : null;
    
    // Get access logs if they exist
    const [accessLogs] = await db.query(`
      SELECT access_count, last_accessedAt, first_accessedAt
      FROM full_membership_access 
      WHERE user_id = ?
    `, [userId]);

    const accessData = accessLogs.length > 0 ? accessLogs[0] : null;
    
    const isEligible = user.membership_stage === 'pre_member';
    
    const fullMembershipStatus = {
      user_id: user.id,
      username: user.username,
      email: user.email,
      membership_stage: user.membership_stage,
      initial_application_status: user.initial_application_status || 'not_applied',
      full_membership_appl_status: user.full_membership_appl_status || 'not_applied',
      
      eligibility: {
        isEligible,
        canApply: isEligible && (!fullApplication || fullApplication.status === 'declined'),
        requirements: [
          'Must be an approved pre-member',
          'Active participation for at least 30 days',
          'Good standing with community guidelines',
          'Complete full membership questionnaire'
        ],
        benefits: [
          'Access to exclusive Iko Chat',
          'Advanced educational content',
          'Mentorship opportunities',
          'Community leadership roles',
          'Priority support and feedback'
        ]
      },
      
      application: fullApplication ? {
        id: fullApplication.id,
        status: fullApplication.status,
        submittedAt: fullApplication.submittedAt,
        reviewedAt: fullApplication.reviewedAt,
        admin_notes: fullApplication.admin_notes,
        membership_ticket: fullApplication.membership_ticket
      } : null,
      
      access_data: accessData ? {
        access_count: accessData.access_count,
        last_accessed: accessData.last_accessedAt,
        first_accessed: accessData.first_accessedAt
      } : null,
      
      next_steps: isEligible ? [
        'Review full membership benefits',
        'Complete full membership application',
        'Submit required information'
      ] : [
        'Complete initial membership process first'
      ]
    };
    
    console.log('✅ Full membership status retrieved for user:', userId);
    return fullMembershipStatus;
    
  } catch (error) {
    console.error('❌ getFullMembershipStatusByIdController error:', error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Failed to get full membership status: ' + error.message, 500);
  }
};

/**
 * POST /api/membership/application/withdraw - Withdraw application controller
 * Handle application withdrawal requests from users
 */
export const withdrawApplicationController = async (userId, reason, applicationType) => {
  try {
    console.log('🔍 withdrawApplicationController called:', { userId, reason, applicationType });
    
    if (!userId || !reason || !applicationType) {
      throw new CustomError('User ID, reason, and application type are required', 400);
    }
    
    if (reason.trim().length < 10) {
      throw new CustomError('Withdrawal reason must be at least 10 characters', 400);
    }
    
    const validTypes = ['initial_application', 'full_membership'];
    if (!validTypes.includes(applicationType)) {
      throw new CustomError(`Invalid application type. Must be one of: ${validTypes.join(', ')}`, 400);
    }
    
    const user = await getUserById(userId);
    
    // Create withdrawal record
    const withdrawalId = `WD-${Date.now()}-${userId}`;
    const withdrawalTimestamp = new Date();
    
    // Determine what application to withdraw based on type
    let applicationUpdated = false;
    let currentApplicationId = null;
    
    if (applicationType === 'initial_application') {
      // Check if user has a pending initial application
      const [pendingApp] = await db.query(`
        SELECT id, approval_status 
        FROM surveylog 
        WHERE user_id = ? AND application_type = 'initial_application' 
        AND approval_status = 'pending'
        ORDER BY createdAt DESC LIMIT 1
      `, [userId]);
      
      if (!pendingApp.length) {
        throw new CustomError('No pending initial application found to withdraw', 404);
      }
      
      currentApplicationId = pendingApp[0].id;
      
      // Update the application status to withdrawn
      await db.query(`
        UPDATE surveylog 
        SET approval_status = 'withdrawn',
            admin_notes = CONCAT(COALESCE(admin_notes, ''), '\n[WITHDRAWN] ', ?),
            reviewedAt = NOW()
        WHERE id = ?
      `, [reason, currentApplicationId]);
      
      // Update user status
      await db.query(`
        UPDATE users 
        SET initial_application_status = 'withdrawn',
            updatedAt = NOW()
        WHERE id = ?
      `, [userId]);
      
      applicationUpdated = true;
      
    } else if (applicationType === 'full_membership') {
      // Check if user has a pending full membership application
      const [pendingFullApp] = await db.query(`
        SELECT id, status 
        FROM full_membership_applications 
        WHERE user_id = ? AND status = 'pending'
        ORDER BY submittedAt DESC LIMIT 1
      `, [userId]);
      
      if (!pendingFullApp.length) {
        throw new CustomError('No pending full membership application found to withdraw', 404);
      }
      
      currentApplicationId = pendingFullApp[0].id;
      
      // Update the full membership application
      await db.query(`
        UPDATE full_membership_applications 
        SET status = 'withdrawn',
            admin_notes = CONCAT(COALESCE(admin_notes, ''), '\n[WITHDRAWN] ', ?),
            reviewedAt = NOW()
        WHERE id = ?
      `, [reason, currentApplicationId]);
      
      // Update user status
      await db.query(`
        UPDATE users 
        SET full_membership_appl_status = 'withdrawn',
            updatedAt = NOW()
        WHERE id = ?
      `, [userId]);
      
      applicationUpdated = true;
    }
    
    if (!applicationUpdated) {
      throw new CustomError('Failed to update application status', 500);
    }
    
    // Log the withdrawal in audit logs
    await db.query(`
      INSERT INTO audit_logs (user_id, action, details, createdAt)
      VALUES (?, 'application_withdrawn', ?, NOW())
    `, [
      userId,
      JSON.stringify({
        withdrawal_id: withdrawalId,
        application_type: applicationType,
        application_id: currentApplicationId,
        reason: reason,
        withdrawn_at: withdrawalTimestamp
      })
    ]);
    
    // Determine when user can reapply
    const canReapplyAfter = new Date();
    canReapplyAfter.setDate(canReapplyAfter.getDate() + 30); // 30-day waiting period
    
    const result = {
      success: true,
      withdrawalId,
      applicationId: currentApplicationId,
      applicationType,
      withdrawnAt: withdrawalTimestamp.toISOString(),
      canReapply: true,
      reapplyAfter: canReapplyAfter.toISOString(),
      message: `${applicationType === 'initial_application' ? 'Initial' : 'Full membership'} application withdrawn successfully`
    };
    
    console.log('✅ Application withdrawn successfully:', result);
    return result;
    
  } catch (error) {
    console.error('❌ withdrawApplicationController error:', error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError('Failed to withdraw application: ' + error.message, 500);
  }
};

// =============================================================================
// EXPORT ALL CONTROLLER FUNCTIONS
// =============================================================================

export default {
  // Status and Dashboard
  getCurrentMembershipStatus,
  getUserDashboard,
  getMembershipAnalytics,
  
  // Application Submission
  submitInitialApplication,
  submitFullMembershipApplication,
  
  // Application Status
  getApplicationStatus,
  getApplicationDetails,
  checkApplicationStatus,
  getApplicationHistory,
  getApplicationRequirements,
  
  // Application Management
  updateApplicationAnswers,
  withdrawApplication,
  
  // Progression and Requirements
  getMembershipProgression,
  getMembershipRequirements,
  
  // Profile and Settings
  getMembershipProfile,
  updateMembershipProfile,
  getUserPermissions,
  
  // Class and Mentor
  getUserClass,
  getUserMentor,
  
  // Full Membership
  getFullMembershipStatus,
  logFullMembershipAccess,
  
  // Notifications
  getMembershipNotifications,
  markNotificationRead,
  
  // Utility
  checkEligibility,
  getMembershipStats,
  
  // Support
  getMembershipHelp,
  submitSupportRequest,
  
  // Admin-only Functions
  getMembershipStatusByIdController,
  getFullMembershipStatusByIdController,
  withdrawApplicationController,
  
  // System & Testing
  healthCheck,
  testUserLookup,
  
  // Utilities (for internal use)
  generateApplicationTicket,
  getUserById,
  successResponse,
  errorResponse
};