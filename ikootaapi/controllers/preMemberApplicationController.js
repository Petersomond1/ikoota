// ikootaapi/controllers/preMemberApplicationController.js
// ===============================================
// PRE-MEMBER APPLICATION CONTROLLER
// Handles all pre-member (initial) application processes
// Clean, organized implementation following Phase 3 specifications
// ===============================================

import db from '../config/db.js';
import { sendEmail } from '../utils/notifications.js';
import { sendEmailWithTemplate } from '../utils/email.js';
import { generateUniqueConverseId } from '../utils/idGenerator.js';
import CustomError from '../utils/CustomError.js';
import {
  getUserById,
  generateApplicationTicket,
  successResponse,
  errorResponse,
  executeQuery,
  notifyAdminsOfNewApplication,
  assignConverseIdToUser
} from './membershipCore.js';

// =============================================================================
// USER DASHBOARD & STATUS FUNCTIONS
// =============================================================================

/**
 * Enhanced user dashboard with comprehensive status
 * GET /dashboard
 */
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const userRole = req.user.role;
    
    console.log('🎯 getUserDashboard called for userId:', userId, 'role:', userRole);
    
    if (!userId) {
      throw new CustomError('User ID not found', 401);
    }
    
    // Enhanced database query with proper joins
    const result = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.membership_stage,
        u.role,
        u.initial_application_status,
        u.applicationSubmittedAt,
        u.application_ticket as user_ticket,
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
      LEFT JOIN (
        SELECT 
          sl.new_survey_id,
          sl.new_status as approval_status,
          sl.createdAt,
          sl.reviewedAt,
          sl.reviewed_by,
          ima.user_id,
          ima.admin_notes,
          ima.application_ticket
        FROM surveylog sl
        JOIN initial_membership_applications ima ON sl.response_table_id = ima.id
        WHERE sl.new_survey_type = 'initial_application'
          AND sl.new_survey_id = (
            SELECT MAX(sl2.new_survey_id) FROM surveylog sl2
            JOIN initial_membership_applications ima2 ON sl2.response_table_id = ima2.id
            WHERE ima2.user_id = u.id AND sl2.new_survey_type = 'initial_application'
          )
      ) s ON u.id = s.user_id
      LEFT JOIN users reviewer ON s.reviewed_by = reviewer.id
      WHERE u.id = ?
    `, [userId]);
    
    // Handle result structure (MySQL2 compatibility)
    let user;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        user = result[0][0];
      } else if (result[0] && typeof result[0] === 'object') {
        user = result[0];
      }
    }
    
    if (!user || !user.id) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    // Normalize member status for admin users
    let memberStatus = user.membership_stage;
    if (!memberStatus && ['admin', 'super_admin'].includes(userRole)) {
      memberStatus = 'active';
      // User status managed via membership_stage
    }
    
    // Enhanced application status logic
    let applicationStatus = 'not_submitted';
    let statusDisplay = 'Not Submitted';
    let applicationDescription = 'Complete your membership application to join our community.';
    
    // Determine actual status based on data
    if (user.membership_stage === 'pre_member') {
      applicationStatus = 'approved_pre_member';
      statusDisplay = 'Pre-Member';
      applicationDescription = 'Approved - You have access to Towncrier content!';
    } else if (user.membership_stage === 'member') {
      applicationStatus = 'approved_member';
      statusDisplay = 'Full Member';
      applicationDescription = 'Approved - You have full member access!';
    } else if (user.survey_submittedAt || user.applicationSubmittedAt) {
      const actualStatus = user.survey_approval_status || user.initial_application_status;
      
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
        default:
          applicationStatus = 'pending';
          statusDisplay = 'Pending Review';
          applicationDescription = 'Your application is submitted and awaiting review.';
          break;
      }
    } else if (user.membership_stage === 'applicant') {
      applicationStatus = 'ready_to_apply';
      statusDisplay = 'Ready to Apply';
      applicationDescription = 'Complete your membership application to join our community.';
    }
    
    // Build quick actions based on status and role
    const quickActions = [];
    
    if (['admin', 'super_admin'].includes(user.role)) {
      quickActions.push(
        { type: 'primary', text: 'Admin Panel', link: '/admin' },
        { type: 'info', text: 'Applications', link: '/admin/applications' },
        { type: 'success', text: 'User Management', link: '/users/admin' }
      );
    } else {
      quickActions.push({ type: 'primary', text: 'View Profile', link: '/profile' });
      
      if (user.membership_stage === 'member') {
        quickActions.push({ type: 'success', text: 'Iko Chat', link: '/iko' });
      } else if (user.membership_stage === 'pre_member') {
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
      
      quickActions.push({ type: 'secondary', text: 'Settings', link: '/settings' });
    }
    
    // Build activity timeline
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
        message: 'Complete your membership application to access community features.',
        date: new Date().toISOString()
      });
    }
    
    // Return comprehensive dashboard data
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
          status: memberStatus || 'pending',
          stage: user.membership_stage || 'none',
          displayStatus: (memberStatus || 'pending').toUpperCase()
        },
        application: {
          status: applicationStatus,
          statusDisplay: statusDisplay,
          description: applicationDescription,
          submittedAt: user.survey_submittedAt || user.applicationSubmittedAt,
          reviewedAt: user.reviewedAt,
          reviewedBy: user.reviewed_by_name,
          ticket: user.survey_ticket || user.user_ticket,
          adminNotes: user.admin_notes
        },
        activities,
        notifications,
        quickActions
      }
    });
    
  } catch (error) {
    console.error('❌ getUserDashboard error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// =============================================================================
// APPLICATION STATUS & CHECKING FUNCTIONS
// =============================================================================

/**
 * Check application status with detailed information
 * GET /application/status
 */
export const checkApplicationStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in request'
      });
    }
    
    // Validate and convert userId
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }
    
    // Get user data
    const user = await getUserById(numericUserId);
    
    // Check survey completion using new schema
    const surveyResult = await db.query(`
      SELECT 
        sl.new_survey_id as id,
        sl.new_status as approval_status,
        sl.createdAt,
        sl.reviewedAt,
        ima.answers,
        ima.admin_notes,
        ima.application_ticket,
        ima.user_id
      FROM surveylog sl
      JOIN initial_membership_applications ima ON sl.response_table_id = ima.id
      WHERE ima.user_id = ? 
      AND sl.new_survey_type = 'initial_application'
      ORDER BY sl.createdAt DESC 
      LIMIT 1
    `, [numericUserId]);
    
    // Handle result format
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
        is_member: user.membership_stage === 'member',
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
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to check application status'
    });
  }
};

/**
 * Get current membership status
 * GET /status
 */
export const getCurrentMembershipStatus = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    const [userStatus] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.membership_stage,
        u.initial_application_status,
        u.applicationSubmittedAt,
        u.applicationReviewedAt,
        u.converse_id,
        u.mentor_id,
        u.primary_class_id,
        u.decline_reason,
        s.approval_status,
        s.reviewedAt as survey_reviewedAt
      FROM users u
      LEFT JOIN (
        SELECT 
          sl.new_survey_id,
          sl.new_status as approval_status,
          sl.reviewedAt,
          ima.user_id
        FROM surveylog sl
        JOIN initial_membership_applications ima ON sl.response_table_id = ima.id
        WHERE sl.new_survey_type = 'initial_application'
          AND sl.new_survey_id = (
            SELECT MAX(sl2.new_survey_id) FROM surveylog sl2
            JOIN initial_membership_applications ima2 ON sl2.response_table_id = ima2.id
            WHERE ima2.user_id = u.id AND sl2.new_survey_type = 'initial_application'
          )
      ) s ON u.id = s.user_id
      WHERE u.id = ?
    `, [userId]);
    
    if (userStatus.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    const user = userStatus[0];
    
    // Determine if user needs to complete survey
    const needsSurvey = (
      user.membership_stage === 'applicant' && 
      user.membership_stage === 'none' && 
      user.initial_application_status === 'not_applied'
    );
    
    const surveyCompleted = user.initial_application_status !== 'not_applied';
    
    res.json({
      success: true,
      user_status: user.membership_stage,
      membership_stage: user.membership_stage,
      initial_application_status: user.initial_application_status,
      needs_survey: needsSurvey,
      survey_completed: surveyCompleted,
      approval_status: user.approval_status,
      converse_id: user.converse_id,
      submittedAt: user.applicationSubmittedAt,
      reviewedAt: user.application_reviewedAt || user.survey_reviewedAt,
      decline_reason: user.decline_reason
    });
    
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// =============================================================================
// INITIAL APPLICATION SUBMISSION & MANAGEMENT
// =============================================================================

/**
 * Submit initial application (Pre-Member Application)
 * POST /survey/submit-application
 */
export const submitInitialApplication = async (req, res) => {
  try {
    console.log('🎯 submitInitialApplication called');
    
    // Extract user ID
    const userId = req.user?.id || req.user?.user_id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found',
        details: 'Authentication failed'
      });
    }
    
    // Extract username safely
    let username = 'unknown';
    if (req.user?.username) {
      username = req.user.username;
    } else if (req.body?.username) {
      username = req.body.username;
    } else {
      try {
        const [userRows] = await db.query('SELECT username FROM users WHERE id = ?', [userId]);
        username = userRows[0]?.username || `user${userId}`;
      } catch (dbError) {
        username = `user${userId}`;
      }
    }
    
    // Generate application ticket
    const applicationTicket = req.body?.applicationTicket || 
      generateApplicationTicket(username, req.user?.email || 'unknown@example.com');
    
    // Validate answers
    const answers = req.body.answers;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid answers format',
        details: 'Answers must be an array'
      });
    }
    
    console.log('📋 Processing', answers.length, 'answers for user:', username);
    
    // Insert application into new schema
    // First insert into initial_membership_applications
    const [appResult] = await db.query(`
      INSERT INTO initial_membership_applications (
        user_id, 
        answers, 
        application_ticket,
        status,
        submittedAt
      ) VALUES (?, ?, ?, 'pending', NOW())
    `, [userId, JSON.stringify(answers), applicationTicket]);

    // Then insert into surveylog for tracking
    const result = await db.query(`
      INSERT INTO surveylog (
        new_survey_id, 
        new_survey_type, 
        new_status, 
        response_table_id,
        createdAt
      ) VALUES (?, 'initial_application', 'pending', ?, NOW())
    `, [appResult.insertId, appResult.insertId]);
    
    // Update user's application status
    await db.query(`
      UPDATE users 
      SET 
        initial_application_status = 'submitted',
        applicationSubmittedAt = NOW(),
        application_ticket = ?,
        updatedAt = NOW()
      WHERE id = ?
    `, [applicationTicket, userId]);
    
    console.log('✅ Application submitted successfully');
    
    // Send admin notifications (non-blocking)
    try {
      const userEmail = req.user?.email || 'unknown@example.com';
      notifyAdminsOfNewApplication(userId, username, userEmail).catch(err => {
        console.warn('⚠️ Admin notification failed:', err.message);
      });
    } catch (notificationError) {
      console.warn('⚠️ Admin notification setup failed:', notificationError.message);
    }
    
    // Success response
    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationTicket: applicationTicket,
        userId: userId,
        username: username,
        timestamp: new Date().toISOString(),
        nextSteps: [
          'Your application is now under review',
          'Review process typically takes 3-5 business days',
          'You will receive email notification once reviewed',
          'Check your dashboard for status updates'
        ]
      }
    });
    
  } catch (error) {
    console.error('❌ submitInitialApplication error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit application',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update initial application answers
 * PUT /application/update-answers
 */
export const updateApplicationAnswers = async (req, res) => {
  try {
    const { answers, applicationType = 'initial_application' } = req.body;
    const userId = req.user.id || req.user.user_id;
    
    if (!answers || !Array.isArray(answers)) {
      throw new CustomError('Valid answers array is required', 400);
    }
    
    // Check if application exists and is still pending using new schema
    const applications = await executeQuery(`
      SELECT 
        sl.new_survey_id as id, 
        sl.new_status as approval_status 
      FROM surveylog sl
      JOIN initial_membership_applications ima ON sl.response_table_id = ima.id
      WHERE ima.user_id = ? AND sl.new_survey_type = ?
      ORDER BY sl.createdAt DESC LIMIT 1
    `, [userId, applicationType]);
    
    if (!applications.length) {
      throw new CustomError('No application found to update', 404);
    }
    
    const application = applications[0];
    
    if (application.approval_status !== 'pending') {
      throw new CustomError('Cannot update application that has already been reviewed', 400);
    }
    
    // Update application answers in the appropriate response table
    if (applicationType === 'initial_application') {
      await executeQuery(`
        UPDATE initial_membership_applications 
        SET answers = ?, updatedAt = NOW()
        WHERE id = (
          SELECT response_table_id FROM surveylog WHERE new_survey_id = ?
        )
      `, [JSON.stringify(answers), application.id]);
    } else if (applicationType === 'full_membership') {
      await executeQuery(`
        UPDATE full_membership_applications 
        SET answers = ?, updatedAt = NOW()
        WHERE id = (
          SELECT response_table_id FROM surveylog WHERE new_survey_id = ?
        )
      `, [JSON.stringify(answers), application.id]);
    }
    
    return successResponse(res, {
      applicationId: application.id,
      updatedAnswers: answers.length,
      updatedAt: new Date().toISOString()
    }, 'Application answers updated successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Withdraw application
 * POST /application/withdraw
 */
export const withdrawApplication = async (req, res) => {
  try {
    const { applicationType = 'initial_application', reason } = req.body;
    const userId = req.user.id || req.user.user_id;
        
    // Check if application exists and is pending using new schema
    const applications = await executeQuery(`
      SELECT 
        sl.new_survey_id as id, 
        sl.new_status as approval_status 
      FROM surveylog sl
      JOIN initial_membership_applications ima ON sl.response_table_id = ima.id
      WHERE ima.user_id = ? AND sl.new_survey_type = ?
      ORDER BY sl.createdAt DESC LIMIT 1
    `, [userId, applicationType]);
        
    if (!applications.length) {
      throw new CustomError('No application found to withdraw', 404);
    }
        
    const application = applications[0];
        
    if (application.approval_status !== 'pending') {
      throw new CustomError('Can only withdraw pending applications', 400);
    }
        
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update application status to withdrawn in both tables
      await connection.query(`
        UPDATE surveylog 
        SET new_status = 'withdrawn', reviewedAt = NOW()
        WHERE new_survey_id = ?
      `, [application.id]);
      
      // Update the response table with admin notes
      if (applicationType === 'initial_application') {
        await connection.query(`
          UPDATE initial_membership_applications 
          SET admin_notes = ?, updatedAt = NOW()
          WHERE id = (
            SELECT response_table_id FROM surveylog WHERE new_survey_id = ?
          )
        `, [reason || 'Withdrawn by user', application.id]);
      }
            
      // If withdrawing initial application, reset user status
      if (applicationType === 'initial_application') {
        await connection.query(`
          UPDATE users 
          SET membership_stage = 'none', initial_application_status = 'withdrawn'
          WHERE id = ?
        `, [userId]);
      }
      
      await connection.commit();
      connection.release();
            
      return successResponse(res, {
        applicationId: application.id,
        applicationType,
        withdrawnAt: new Date().toISOString()
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
// USER HISTORY & PERMISSIONS
// =============================================================================

/**
 * Get application history for user
 * GET /application-history
 */
export const getApplicationHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    // Get application history using new schema
    const [history] = await db.query(`
      SELECT 
        sl.new_survey_type as survey_type,
        sl.new_status as approval_status,
        sl.createdAt as submittedAt,
        sl.reviewedAt,
        CASE 
          WHEN sl.new_survey_type = 'initial_application' THEN ima.admin_notes
          WHEN sl.new_survey_type = 'full_membership' THEN fma.admin_notes
          ELSE sr.admin_notes
        END as admin_notes,
        reviewer.username as reviewed_by,
        CASE 
          WHEN sl.new_survey_type = 'initial_application' THEN ima.application_ticket
          WHEN sl.new_survey_type = 'full_membership' THEN fma.membership_ticket
          ELSE NULL
        END as ticket
      FROM surveylog sl
      LEFT JOIN initial_membership_applications ima ON sl.response_table_id = ima.id AND sl.new_survey_type = 'initial_application'
      LEFT JOIN full_membership_applications fma ON sl.response_table_id = fma.id AND sl.new_survey_type = 'full_membership'
      LEFT JOIN survey_responses sr ON sl.response_table_id = sr.id AND sl.new_survey_type = 'survey'
      LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
      WHERE (
        (sl.new_survey_type = 'initial_application' AND ima.user_id = ?)
        OR (sl.new_survey_type = 'full_membership' AND fma.user_id = ?)
        OR (sl.new_survey_type = 'survey' AND sr.user_id = ?)
      )
      ORDER BY sl.createdAt DESC
    `, [userId, userId, userId]);

    // Get review history if available
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
 * Get user's current membership stage and permissions
 * GET /permissions
 */
export const getUserPermissions = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    const user = await getUserById(userId);
    
    // Define permissions based on membership stage and role
    const permissions = {
      canAccessTowncrier: ['pre_member', 'member'].includes(user.membership_stage) || ['admin', 'super_admin'].includes(user.role),
      canAccessIko: user.membership_stage === 'member' || ['admin', 'super_admin'].includes(user.role),
      canSubmitInitialApplication: !user.membership_stage || user.membership_stage === 'none' || user.membership_stage === 'applicant',
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
        is_member: user.membership_stage === 'member',
        role: user.role
      },
      permissions
    });
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Get application requirements and guidelines
 * GET /application/requirements
 */
export const getApplicationRequirements = async (req, res) => {
  try {
    const { type = 'initial' } = req.query;
    
    let requirements, guidelines, estimatedTime;
    
    if (type === 'initial') {
      requirements = [
        'Valid email address for verification',
        'Complete personal information',
        'Answer all application questions honestly',
        'Agree to community guidelines',
        'Provide thoughtful responses'
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

/**
 * Update initial application (Pre-Member Application)
 * PUT /survey/update-application or PUT /application/update
 * Allows users to update their pending initial application
 */
export const updateInitialApplication = async (req, res) => {
  try {
    console.log('🎯 updateInitialApplication called');
    
    // Extract user ID
    const userId = req.user?.id || req.user?.user_id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found',
        details: 'Authentication failed'
      });
    }
    
    const { answers, applicationTicket } = req.body;
    
    // Validate answers
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid answers format',
        details: 'Answers must be an array'
      });
    }
    
    console.log('📋 Updating application with', answers.length, 'answers for user:', userId);
    
    // Check if user has an existing initial application that can be updated using new schema
    const existingApplicationResult = await db.query(`
      SELECT 
        sl.new_survey_id as id, 
        sl.new_status as approval_status, 
        ima.application_ticket, 
        ima.user_id
      FROM surveylog sl
      JOIN initial_membership_applications ima ON sl.response_table_id = ima.id
      WHERE ima.user_id = ? 
      AND sl.new_survey_type = 'initial_application'
      ORDER BY sl.createdAt DESC 
      LIMIT 1
    `, [userId]);
    
    // Handle result format (MySQL2 compatibility)
    let existingApplication = null;
    if (Array.isArray(existingApplicationResult)) {
      if (Array.isArray(existingApplicationResult[0]) && existingApplicationResult[0].length > 0) {
        existingApplication = existingApplicationResult[0][0];
      } else if (existingApplicationResult[0] && typeof existingApplicationResult[0] === 'object') {
        existingApplication = existingApplicationResult[0];
      }
    }
    
    // Check if application exists and can be updated
    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        error: 'No initial application found to update',
        details: 'Please submit an initial application first'
      });
    }
    
    // Check if application status allows updates
    if (existingApplication.approval_status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update application',
        details: `Application has already been ${existingApplication.approval_status}. Only pending applications can be updated.`,
        currentStatus: existingApplication.approval_status
      });
    }
    
    // Use existing application ticket if not provided
    const finalApplicationTicket = applicationTicket || existingApplication.application_ticket;
    
    // Start database transaction for consistency
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update the existing application in initial_membership_applications
      const updateResult = await connection.query(`
        UPDATE initial_membership_applications ima
        JOIN surveylog sl ON ima.id = sl.response_table_id
        SET 
          ima.answers = ?,
          ima.application_ticket = ?,
          ima.updatedAt = NOW()
        WHERE sl.new_survey_id = ? AND ima.user_id = ?
      `, [JSON.stringify(answers), finalApplicationTicket, existingApplication.id, userId]);
      
      if (updateResult.affectedRows === 0) {
        throw new Error('Failed to update application in surveylog');
      }
      
      // Update user's application info if needed
      await connection.query(`
        UPDATE users 
        SET 
          application_ticket = ?,
          updatedAt = NOW()
        WHERE id = ?
      `, [finalApplicationTicket, userId]);
      
      // Commit the transaction
      await connection.commit();
      connection.release();
      
      console.log('✅ Application updated successfully');
      
      // Get updated application data for response using new schema
      const updatedApplicationResult = await db.query(`
        SELECT 
          sl.new_survey_id as id,
          sl.new_survey_type,
          sl.new_status,
          sl.createdAt,
          sl.updatedAt,
          ima.*,
          u.username,
          u.email
        FROM surveylog sl
        JOIN initial_membership_applications ima ON sl.response_table_id = ima.id
        JOIN users u ON ima.user_id = u.id
        WHERE sl.new_survey_id = ?
      `, [existingApplication.id]);
      
      let updatedApplication = null;
      if (Array.isArray(updatedApplicationResult)) {
        if (Array.isArray(updatedApplicationResult[0]) && updatedApplicationResult[0].length > 0) {
          updatedApplication = updatedApplicationResult[0][0];
        } else if (updatedApplicationResult[0] && typeof updatedApplicationResult[0] === 'object') {
          updatedApplication = updatedApplicationResult[0];
        }
      }
      
      // Send admin notification about the update (non-blocking)
      try {
        const userEmail = req.user?.email || updatedApplication?.email || 'unknown@example.com';
        const username = req.user?.username || updatedApplication?.username || 'Unknown User';
        
        // Notify admins of application update
        notifyAdminsOfApplicationUpdate(userId, username, userEmail, finalApplicationTicket).catch(err => {
          console.warn('⚠️ Admin notification failed:', err.message);
        });
      } catch (notificationError) {
        console.warn('⚠️ Admin notification setup failed:', notificationError.message);
      }
      
      // Success response
      res.json({
        success: true,
        message: 'Initial application updated successfully',
        data: {
          applicationId: existingApplication.id,
          applicationTicket: finalApplicationTicket,
          userId: userId,
          answersCount: answers.length,
          status: 'pending',
          updatedAt: new Date().toISOString(),
          nextSteps: [
            'Your updated application is now under review',
            'Review process typically takes 3-5 business days',
            'You will receive email notification once reviewed',
            'Check your dashboard for status updates'
          ]
        }
      });
      
    } catch (transactionError) {
      // Rollback transaction on error
      await connection.rollback();
      connection.release();
      throw transactionError;
    }
    
  } catch (error) {
    console.error('❌ updateInitialApplication error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update application',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Helper function to notify admins of application updates
 * This is a non-blocking notification function
 */
const notifyAdminsOfApplicationUpdate = async (userId, username, email, applicationTicket) => {
  try {
    console.log('📧 Sending admin notifications for application update...');
    
    // Get all admin users
    const [admins] = await db.query(
      'SELECT email, username FROM users WHERE role IN ("admin", "super_admin") AND email IS NOT NULL'
    );
    
    if (admins.length === 0) {
      console.warn('⚠️ No admin users found to notify');
      return;
    }
    
    console.log(`📧 Found ${admins.length} admin(s) to notify about application update`);
    
    // Send notification to each admin
    const notificationPromises = admins.map(async (admin) => {
      try {
        const emailContent = {
          to: admin.email,
          subject: '🔄 Application Updated - Review Required',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
                <h2>📝 Application Updated</h2>
              </div>
              <div style="padding: 20px;">
                <p>Hello ${admin.username},</p>
                <p>An initial application has been updated and requires review:</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <strong>Applicant:</strong> ${username}<br>
                  <strong>Email:</strong> ${email}<br>
                  <strong>Ticket:</strong> ${applicationTicket}<br>
                  <strong>Updated:</strong> ${new Date().toLocaleString()}
                </div>
                <p>Please review the updated application in the admin panel.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/applications" 
                     style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Review Application
                  </a>
                </div>
                <p>Best regards,<br>Ikoota System</p>
              </div>
            </div>
          `,
          text: `
Application Updated - Review Required

Hello ${admin.username},

An initial application has been updated and requires review:

Applicant: ${username}
Email: ${email}
Ticket: ${applicationTicket}
Updated: ${new Date().toLocaleString()}

Please review the updated application in the admin panel: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/applications

Best regards,
Ikoota System
          `
        };
        
        if (sendEmailWithTemplate) {
          await sendEmailWithTemplate(emailContent);
          console.log(`✅ Update notification sent to admin: ${admin.email}`);
        } else if (sendEmail) {
          await sendEmail(emailContent);
          console.log(`✅ Update notification sent to admin: ${admin.email}`);
        }
      } catch (emailError) {
        console.error(`❌ Failed to notify admin ${admin.email}:`, emailError.message);
      }
    });
    
    // Wait for all notifications to complete (but don't fail if some fail)
    await Promise.allSettled(notificationPromises);
    console.log('✅ Admin notification process completed for application update');
    
  } catch (error) {
    console.error('❌ Admin notification error for application update:', error);
    // Don't throw - this is a non-critical operation
  }
};

// ADD TO YOUR EXPORTS SECTION:
// Add 'updateInitialApplication,' to your export default object


// =============================================================================
// DEBUGGING & TESTING UTILITIES
// =============================================================================

/**
 * Verify application status consistency (Debug helper)
 * GET /debug/status-consistency
 */
export const verifyApplicationStatusConsistency = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    const [results] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.initial_application_status as user_app_status,
        u.applicationSubmittedAt,
        s.approval_status as survey_status,
        s.reviewed_by,
        s.reviewedAt,
        s.createdAt as survey_created
      FROM users u
      LEFT JOIN (
        SELECT 
          sl.new_status as approval_status,
          sl.reviewed_by,
          sl.reviewedAt,
          sl.createdAt,
          ima.user_id
        FROM surveylog sl
        JOIN initial_membership_applications ima ON sl.response_table_id = ima.id
        WHERE sl.new_survey_type = 'initial_application'
      ) s ON u.id = s.user_id
      WHERE u.id = ?
      ORDER BY s.createdAt DESC
    `, [userId]);
    
    res.json({
      success: true,
      debug: {
        userId,
        statusData: results,
        recommendation: results.length > 0 ? 
          'Data found - check for status consistency' : 
          'No application data found'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Test user lookup functionality (Debug helper)
 * GET /debug/test-user/:userId?
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
      success: false,
      error: error.message,
      debug: {
        userId,
        type: typeof userId,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
  checkApplicationStatus,
  getCurrentMembershipStatus,
  
  // Application Management
  submitInitialApplication,
  updateApplicationAnswers,
  updateInitialApplication,
  withdrawApplication,
  
  // User History & Permissions
  getApplicationHistory,
  getUserPermissions,
  getApplicationRequirements,
  
  // Debug & Testing
  verifyApplicationStatusConsistency,
  testUserLookup
};