
// ikootaapi/controllers/preMemberApplicationController.js
// ===============================================
// PRE-MEMBER APPLICATION CONTROLLER
// Handles all pre-member (initial) application processes
// ===============================================

import db from '../config/db.js';
import { sendEmail } from '../utils/notifications.js';
import { sendEmailWithTemplate } from '../utils/email.js';
import CustomError from '../utils/CustomError.js';
import { 
  getUserById,
  getUserByIdFixed, 
  generateApplicationTicket, 
  successResponse, 
  errorResponse,
  executeQuery,
  notifyAdminsOfNewApplication
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
    
    // Enhanced database query
    console.log('🔍 Attempting enhanced database query...');
    const result = await db.query(`
  SELECT 
    u.id,
    u.username,
    u.email,
    u.is_member,
    u.membership_stage,
    u.role,
    u.application_status,
    u.application_submittedAt,
    u.application_ticket as user_ticket,
    u.createdAt,
    u.converse_id,
    u.mentor_id,
    u.primary_class_id,
    s.approval_status as survey_approval_status,
    s.application_ticket as survey_ticket,
    s.createdAt as survey_submittedAt,
    s.reviewedAt,        -- ✅ FIXED: Changed from s.reviewedAt to s.reviewedAt
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
    console.log('🔍 Enhanced query result check');
    let user;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        user = result[0][0];
        console.log('✅ Using MySQL2 format: result[0][0]');
      } else if (result[0] && typeof result[0] === 'object') {
        user = result[0];
        console.log('✅ Using direct format: result[0]');
      }
    }
    
    console.log('✅ User extracted:', user?.id, user?.username);
    console.log('🔍 Raw user data:', {
      is_member: user?.is_member,
      membership_stage: user?.membership_stage,
      application_status: user?.application_status,
      survey_submittedAt: user?.survey_submittedAt,
      application_submittedAt: user?.application_submittedAt
    });
    
    if (!user || !user.id) {
      console.error('❌ No valid user data found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Handle empty is_member for admin users
    let memberStatus = user.is_member;
    if (!memberStatus || memberStatus === '' || memberStatus === null) {
      if (userRole === 'admin' || userRole === 'super_admin') {
        memberStatus = 'active';
        await db.query(
          'UPDATE users SET is_member = ? WHERE id = ?',
          ['active', userId]
        );
        console.log('🔧 Fixed empty is_member for admin user');
      } else {
        memberStatus = 'pending';
      }
    }
    
    // Enhanced application status logic for new users
    let applicationStatus = 'not_submitted';
    let statusDisplay = 'Not Submitted';
    let applicationDescription = 'Application not yet submitted';
    
    // FIRST: Check for pre_member status (highest priority)
    if (user.is_member === 'pre_member' || user.membership_stage === 'pre_member') {
      applicationStatus = 'approved_pre_member';
      statusDisplay = 'Pre-Member';
      applicationDescription = 'Approved - Pre-Member Access';
    }
    // SECOND: Check for full member status
    else if (user.is_member === 'member' && user.membership_stage === 'member') {
      applicationStatus = 'approved_member';
      statusDisplay = 'Full Member';
      applicationDescription = 'Approved - Full Member Access';
    }
    // THIRD: Check if user has actually submitted an application survey
    else if (user.survey_submittedAt || user.application_submittedAt) {
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
    }
    // FOURTH: Handle users who signed up but haven't submitted application
    else if (user.is_member === 'applied' && user.membership_stage === 'none') {
      // Check if they actually have application data
      if (!user.survey_submittedAt && !user.application_submittedAt && user.application_status === 'not_submitted') {
        applicationStatus = 'ready_to_apply';
        statusDisplay = 'Ready to Apply';
        applicationDescription = 'Complete your membership application to join our community.';
      } else {
        applicationStatus = 'pending';
        statusDisplay = 'Pending Review';
        applicationDescription = 'Your application is submitted and awaiting review.';
      }
    }
    // FIFTH: Default fallback for other authenticated users
    else {
      applicationStatus = 'not_submitted';
      statusDisplay = 'Not Submitted';
      applicationDescription = 'Application not yet submitted';
    }
    
    console.log('✅ Final status determination:', {
      applicationStatus,
      statusDisplay,
      applicationDescription,
      reasoning: 'Based on user database state'
    });
    
    // Create comprehensive status object
    const status = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      membership_stage: user.membership_stage || 'none',
      is_member: memberStatus,
      
      // Application status based on actual user state
      application_status: applicationStatus,
      application_status_display: statusDisplay,
      application_description: applicationDescription,
      
      // Additional application details
      application_submittedAt: user.survey_submittedAt || user.application_submittedAt,
      application_reviewedAt: user.reviewedAt,
      application_reviewed_by: user.reviewed_by_name,
      application_ticket: user.survey_ticket || user.user_ticket,
      admin_notes: user.admin_notes,
      
      // Legacy fields for compatibility
      initial_application_status: applicationStatus,
      full_membership_application_status: 'not_applied',
      has_accessed_full_membership: memberStatus === 'active' || user.membership_stage === 'member',
      user_created: user.createdAt
    };
    
    // Enhanced quick actions based on status
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
        // Different actions based on application status
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
    
    // Build activities list with correct status
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
    
    // Only add application activity if actually submitted
    if (user.survey_submittedAt || user.application_submittedAt) {
      activities.push({
        type: 'application_submitted',
        title: 'Application Submitted',
        description: applicationDescription,
        date: user.survey_submittedAt || user.application_submittedAt,
        status: applicationStatus === 'approved' || applicationStatus === 'approved_pre_member' || applicationStatus === 'approved_member' ? 'completed' : 
                applicationStatus === 'rejected' ? 'failed' : 'pending',
        icon: applicationStatus === 'approved' || applicationStatus === 'approved_pre_member' || applicationStatus === 'approved_member' ? '✅' : 
              applicationStatus === 'rejected' ? '❌' : '📝'
      });
    } else if (applicationStatus === 'ready_to_apply') {
      // Add "next step" activity for users who need to apply
      activities.push({
        type: 'next_step',
        title: 'Next Step: Submit Application',
        description: 'Complete your membership application to join our community.',
        date: new Date().toISOString(),
        status: 'pending',
        icon: '📝'
      });
    }
    
    // Build notifications with correct status
    const notifications = [{
      type: 'system',
      message: `Welcome back, ${user.username}!`,
      date: new Date().toISOString()
    }];
    
    // Status-specific notifications
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
    } else if (applicationStatus === 'pending') {
      notifications.unshift({
        type: 'info',
        message: 'Your application is being reviewed. You will be notified once the review is complete.',
        date: new Date().toISOString()
      });
    } else if (applicationStatus === 'rejected') {
      notifications.unshift({
        type: 'warning',
        message: 'Your application requires attention. Please check your application status.',
        date: user.reviewedAt || new Date().toISOString()
      });
    }
    
    console.log('✅ Sending enhanced dashboard response with status:', statusDisplay);
    
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
          displayStatus: memberStatus.toUpperCase()
        },
        application: {
          status: applicationStatus,
          statusDisplay: statusDisplay,
          description: applicationDescription,
          submittedAt: user.survey_submittedAt || user.application_submittedAt,
          reviewedAt: user.reviewedAt,
          reviewedBy: user.reviewed_by_name,
          ticket: user.survey_ticket || user.user_ticket,
          adminNotes: user.admin_notes
        },
        activities,
        notifications,
        quickActions
      },
      
      // Legacy compatibility
      membershipStatus: status,
      recentActivities: activities,
      notifications,
      quickActions
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
    // Extract user ID properly and validate it exists
    const userId = req.user?.id;
    
    console.log('🔍 Checking application status for user:', {
      userId,
      userObject: req.user,
      type: typeof userId
    });
    
    // Validate userId before proceeding
    if (!userId) {
      console.error('❌ No user ID found in request');
      return res.status(400).json({
        error: 'User ID not found in request'
      });
    }
    
    // Pass only the user ID, ensure it's a number
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      console.error('❌ Invalid user ID format:', userId);
      return res.status(400).json({
        error: 'Invalid user ID format'
      });
    }
    
    console.log('✅ Using numeric user ID:', numericUserId);
    
    // Pass only the numeric user ID
    const user = await getUserById(numericUserId);
    
    console.log('✅ User retrieved successfully:', {
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    // Check survey completion using existing surveylog table
    const surveyQuery = `
      SELECT * FROM surveylog 
      WHERE user_id = ? 
      AND application_type = 'initial_application'
      ORDER BY createdAt DESC 
      LIMIT 1
    `;
    const surveyResult = await db.query(surveyQuery, [numericUserId]);
    
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
    
    console.log('✅ Application status check complete:', {
      userId: numericUserId,
      hasSurvey,
      surveyCompleted,
      redirect: response.redirect_to
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ checkApplicationStatus error:', error);
    
    // Enhanced error response
    const errorResponse = {
      error: error.message || 'Failed to check application status',
      code: error.statusCode || 500
    };
    
    // Add debug info in development
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
 * Get current membership status
 * GET /status
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
        u.application_submittedAt,
        u.application_reviewedAt,
        u.converse_id,
        u.mentor_id,
        u.primary_class_id,
        u.decline_reason,
        s.approval_status,
        s.reviewedAt as survey_reviewedAt
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
    
    const surveyCompleted = user.application_status !== 'not_submitted';
    
    res.json({
      success: true,
      user_status: user.is_member,
      membership_stage: user.membership_stage,
      application_status: user.application_status,
      needs_survey: needsSurvey,
      survey_completed: surveyCompleted,
      approval_status: user.approval_status,
      converse_id: user.converse_id,
      submittedAt: user.application_submittedAt,
      reviewedAt: user.application_reviewedAt || user.survey_reviewedAt,
      decline_reason: user.decline_reason
    });
    
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ error: error.message });
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
    console.log('🎯 submitInitialApplication called!');
    console.log('📝 Request body:', req.body);
    console.log('👤 User from auth:', req.user);

    // STEP 1: Safe user ID extraction
    const userId = req.user?.id || req.user?.user_id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found',
        details: 'Authentication failed - no user ID'
      });
    }
    
    console.log('🔍 Extracted userId:', userId);

    // STEP 2: Safe username extraction (multiple fallbacks)
    let username = 'unknown';
    
    // Try to get username from auth token first
    if (req.user?.username) {
      username = req.user.username;
      console.log('✅ Username from req.user:', username);
    } 
    // If not in token, try from request body
    else if (req.body?.username) {
      username = req.body.username;
      console.log('✅ Username from req.body:', username);
    } 
    // If still not found, get from database
    else {
      try {
        console.log('🔍 Getting username from database...');
        
        // Direct database query since getUserById might be the problem
        const [userRows] = await db.query('SELECT username FROM users WHERE id = ?', [userId]);
        
        if (userRows && userRows.length > 0) {
          username = userRows[0].username;
          console.log('✅ Username from database:', username);
        } else {
          console.log('⚠️ User not found in database, using fallback');
          username = `user${userId}`;
        }
      } catch (dbError) {
        console.log('⚠️ Database error, using fallback username:', dbError.message);
        username = `user${userId}`;
      }
    }

    // STEP 3: Safe application ticket generation
    const applicationTicket = req.body?.applicationTicket || 
      `APP-${username.substring(0, 3).toUpperCase()}-${Date.now().toString(36)}`;
    
    console.log('✅ Final username:', username);
    console.log('✅ Application ticket:', applicationTicket);

    // STEP 4: Process the answers
    const answers = req.body.answers;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid answers format',
        details: 'Answers must be an array'
      });
    }

    console.log('📋 Processing', answers.length, 'answers');

    // STEP 5: Insert into database (using db.query, NOT db.execute)
    const result = await db.query(`
      INSERT INTO surveylog (
        user_id, 
        answers, 
        application_type, 
        approval_status, 
        application_ticket,
        createdAt
      ) VALUES (?, ?, 'initial_application', 'pending', ?, NOW())
    `, [userId, JSON.stringify(answers), applicationTicket]);

    console.log('✅ Database insert successful:', result);

    // STEP 6: Update user's application status
    await db.query(`
      UPDATE users 
      SET 
        application_status = 'submitted',
        application_submittedAt = NOW(),
        application_ticket = ?,
        updatedAt = NOW()
      WHERE id = ?
    `, [applicationTicket, userId]);

    console.log('✅ User status updated successfully');

    // STEP 7: Send admin notifications (non-blocking)
    try {
      // Get user email for admin notification
      let userEmail = req.user?.email;
      if (!userEmail) {
        const [userEmailRows] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
        userEmail = userEmailRows[0]?.email || 'unknown@example.com';
      }
      
      // Send admin notification (don't wait for it)
      notifyAdminsOfNewApplication(userId, username, userEmail).catch(err => {
        console.warn('⚠️ Admin notification failed (non-critical):', err.message);
      });
    } catch (notificationError) {
      console.warn('⚠️ Admin notification setup failed:', notificationError.message);
    }

    // STEP 8: Success response
    res.json({
      success: true,
      message: 'Application submitted successfully',
      applicationTicket: applicationTicket,
      userId: userId,
      username: username,
      timestamp: new Date().toISOString()
    });

    console.log('✅ Application submission completed successfully');

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
 * Update initial application answers (before submission)
 * PUT /application/update-answers
 */
export const updateApplicationAnswers = async (req, res) => {
  try {
    const { answers, applicationType = 'initial_application' } = req.body;
    const userId = req.user.id || req.user.user_id;
    
    if (!answers || !Array.isArray(answers)) {
      throw new CustomError('Valid answers array is required', 400);
    }
    
    // Check if application exists and is still pending
    const applications = await executeQuery(`
      SELECT id, approval_status 
      FROM surveylog 
      WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
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
    await executeQuery(`
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
 * Update initial application (Enhanced version)
 * PUT /application/answers
 */
export const updateInitialApplication = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    const { surveyData, answers } = req.body;
    
    console.log('📝 Updating application for user:', userId);
    
    const applicationData = surveyData || answers;
    
    if (!applicationData) {
      return res.status(400).json({ 
        error: 'Missing application data to update' 
      });
    }
    
    // Check if user has a submitted application that can be updated
    const [userCheck] = await db.query(
      'SELECT application_status FROM users WHERE id = ?',
      [userId]
    );
    
    if (userCheck.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (userCheck[0].application_status !== 'submitted') {
      return res.status(400).json({
        error: 'No submitted application found to update',
        current_status: userCheck[0].application_status
      });
    }
    
    // Update the application
    await db.query(`
      UPDATE surveylog 
      SET 
        answers = ?,
        updatedAt = NOW()
      WHERE user_id = ? AND application_type = 'initial_application'
    `, [JSON.stringify(applicationData), userId]);
    
    res.json({
      success: true,
      message: 'Application updated successfully',
      status: 'submitted',
      updatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Update application error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update application',
      details: error.message
    });
  }
};

/**
 * Withdraw application (user can withdraw pending applications)
 * POST /application/withdraw
 */
export const withdrawApplication = async (req, res) => {
  try {
    const { applicationType = 'initial_application', reason } = req.body;
    const userId = req.user.id || req.user.user_id;
        
    // Check if application exists and is pending
    const applications = await executeQuery(`
      SELECT id, approval_status 
      FROM surveylog 
      WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
      ORDER BY createdAt DESC LIMIT 1
    `, [userId, applicationType]);
        
    if (!applications.length) {
      throw new CustomError('No application found to withdraw', 404);
    }
        
    const application = applications[0];
        
    if (application.approval_status !== 'pending') {
      throw new CustomError('Can only withdraw pending applications', 400);
    }
        
    const result = await db.transaction(async (connection) => {
      // Update application status to withdrawn
      await connection.execute(`
        UPDATE surveylog 
        SET approval_status = 'withdrawn', admin_notes = ?, reviewedAt = NOW()
        WHERE id = ?
      `, [reason || 'Withdrawn by user', application.id]);
            
      // If withdrawing initial application, reset user status
      if (applicationType === 'initial_application') {
        await connection.execute(`
          UPDATE users 
          SET membership_stage = 'none', is_member = 'pending'
          WHERE id = ?
        `, [userId]);
      }
            
      return {
        applicationId: application.id,
        applicationType
      };
    });
        
    return successResponse(res, result, 'Application withdrawn successfully');
        
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
// USER HISTORY & PERMISSIONS
// =============================================================================

/**
 * Get application history for user
 * GET /application-history
 */
export const getApplicationHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    // Get application history
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
      WHERE CAST(sl.user_id AS UNSIGNED) = ?
      ORDER BY sl.createdAt DESC
    `, [userId]);

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
// STATUS CONSISTENCY VERIFICATION (DEBUG)
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
        u.application_status as user_app_status,
        u.application_submittedAt,
        s.approval_status as survey_status,
        s.reviewed_by,
        s.reviewedAt,
        s.createdAt as survey_created
      FROM users u
      LEFT JOIN surveylog s ON u.id = s.user_id 
        AND s.application_type = 'initial_application'
      WHERE u.id = ?
      ORDER BY s.id DESC
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
      error: error.message
    });
  }
};