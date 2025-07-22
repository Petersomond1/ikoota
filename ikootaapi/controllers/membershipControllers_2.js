// ikootaapi/controllers/membershipControllers_2.js
// ==================================================
// USER DASHBOARD, STATUS & APPLICATION MANAGEMENT
// ==================================================

import db from '../config/db.js';
import { sendEmail } from '../utils/notifications.js';
import CustomError from '../utils/CustomError.js';
import { 
  getUserById, 
  generateApplicationTicket, 
  successResponse, 
  errorResponse,
  executeQuery 
} from './membershipControllers_1.js';
import { sendEmailWithTemplate } from '../utils/email.js';
import { generateUniqueConverseId } from '../utils/idGenerator.js';
// import { successResponse, errorResponse } from './membershipControllers_1.js';


// ==================================================
// USER DASHBOARD & STATUS FUNCTIONS
// ==================================================

/**
 * Enhanced user dashboard with comprehensive data
 */
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const userRole = req.user.role;
    
    console.log('🎯 getUserDashboard called for userId:', userId, 'role:', userRole);
    
    if (!userId) {
      throw new CustomError('User ID not found', 401);
    }
    
    // Try direct database query first
    console.log('🔍 Attempting direct database query...');
    const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    console.log('🔍 Direct query result check');
    
    // Handle the result properly
    let user;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        user = result[0][0]; // MySQL2 format: [rows, fields]
        console.log('✅ Using MySQL2 format: result[0][0]');
      } else if (result[0] && typeof result[0] === 'object') {
        user = result[0]; // Direct format
        console.log('✅ Using direct format: result[0]');
      }
    }
    
    console.log('✅ User extracted:', user?.id, user?.username);
    
    if (!user || !user.id) {
      console.error('❌ No valid user data found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Handle empty is_member for admin users
    let memberStatus = user.is_member;
    if (!memberStatus || memberStatus === '' || memberStatus === null) {
      if (userRole === 'admin' || userRole === 'super_admin') {
        memberStatus = 'active';
        // Update in database
        await db.query(
          'UPDATE users SET is_member = ? WHERE id = ?',
          ['active', userId]
        );
        console.log('🔧 Fixed empty is_member for admin user');
      } else {
        memberStatus = 'pending';
      }
    }
    
    // Create status object
    const status = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      membership_stage: user.membership_stage || 'none',
      is_member: memberStatus,
      initial_application_status: 'approved', // Simplified for testing
      full_membership_application_status: 'approved',
      has_accessed_full_membership: true,
      user_created: user.createdAt
    };
    
    // Define quick actions based on user status
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
      } else if (user.membership_stage === 'pre_member') {
        quickActions.push({ type: 'info', text: 'Towncrier', link: '/towncrier' });
        quickActions.push({ type: 'warning', text: 'Apply for Full Membership', link: '/full-membership' });
      } else {
        quickActions.push({ type: 'warning', text: 'Submit Application', link: '/application-survey' });
      }
    }
    
    quickActions.push({ type: 'secondary', text: 'Settings', link: '/settings' });
    
    console.log('✅ Sending dashboard response');
    
    return res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      membershipStatus: status,
      recentActivities: [],
      notifications: [{
        type: 'system',
        message: `Welcome back, ${user.username}!`,
        date: new Date().toISOString()
      }],
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

/**
 * Check application status with detailed information
 */
const query = db.query;

export const checkApplicationStatus = async (req, res) => {
    try {
        // ✅ CRITICAL FIX: Extract user ID properly and validate it exists
        const userId = req.user?.id;
        
        console.log('🔍 Checking application status for user:', {
            userId,
            userObject: req.user,
            type: typeof userId
        });
        
        // ✅ CRITICAL: Validate userId before proceeding
        if (!userId) {
            console.error('❌ No user ID found in request');
            return res.status(400).json({
                error: 'User ID not found in request'
            });
        }
        
        // ✅ FIXED: Pass only the user ID, ensure it's a number
        const numericUserId = parseInt(userId, 10);
        if (isNaN(numericUserId)) {
            console.error('❌ Invalid user ID format:', userId);
            return res.status(400).json({
                error: 'Invalid user ID format'
            });
        }
        
        console.log('✅ Using numeric user ID:', numericUserId);
        
        // ✅ FIXED: Pass only the numeric user ID
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
        const surveyResult = await query(surveyQuery, [numericUserId]);
        
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

// ✅ ENHANCED: Also fix getUserById validation to be more robust
export const getUserByIdFixed = async (userId) => {
    try {
        console.log('🔍 getUserById called with userId:', {
            value: userId,
            type: typeof userId,
            isNumber: !isNaN(Number(userId))
        });
        
        // ✅ ENHANCED: More robust validation
        if (userId === null || userId === undefined) {
            throw new CustomError('User ID is required', 400);
        }
        
        // Convert to number if it's a string representation of a number
        let numericUserId;
        if (typeof userId === 'string') {
            numericUserId = parseInt(userId, 10);
            if (isNaN(numericUserId)) {
                throw new CustomError('Invalid user ID format', 400);
            }
        } else if (typeof userId === 'number') {
            numericUserId = userId;
        } else {
            throw new CustomError('User ID must be a number or numeric string', 400);
        }
        
        // Validate it's a positive integer
        if (numericUserId <= 0) {
            throw new CustomError('User ID must be a positive number', 400);
        }
        
        console.log('✅ Validated user ID:', numericUserId);
        
        const result = await query('SELECT * FROM users WHERE id = ?', [numericUserId]);
        console.log('🔍 Raw DB result structure check');
        
        // Handle different possible result structures
        let users;
        if (Array.isArray(result) && result.length > 0) {
            if (Array.isArray(result[0])) {
                users = result[0]; // MySQL2 format: [rows, fields]
                console.log('✅ Using MySQL2 format: result[0]');
            } else {
                users = result; // Direct array format
                console.log('✅ Using direct array format: result');
            }
        } else {
            console.log('❌ Unexpected result structure or empty result');
            throw new CustomError('User not found', 404);
        }
        
        if (!users || users.length === 0) {
            console.log('❌ No users found for ID:', numericUserId);
            throw new CustomError('User not found', 404);
        }
        
        const user = users[0];
        console.log('✅ User extracted:', {
            id: user.id,
            username: user.username || 'N/A',
            email: user.email
        });
        
        return user;
    } catch (error) {
        console.error('❌ Database query error in getUserById:', {
            error: error.message,
            userId,
            stack: error.stack
        });
        
        // Re-throw CustomError as-is, wrap other errors
        if (error instanceof CustomError) {
            throw error;
        }
        
        throw new CustomError('Database operation failed: ' + error.message, 500);
    }
};

// ✅ DEBUG: Add a test endpoint to verify the fix
export const testUserLookup = async (req, res) => {
    try {
        const userId = req.params.userId || req.user?.id;
        
        console.log('🧪 Testing user lookup for:', {
            paramUserId: req.params.userId,
            authUserId: req.user?.id,
            finalUserId: userId
        });
        
        const user = await getUserByIdFixed(userId);
        
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



export const getCurrentMembershipStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    
    console.log('🔍 Checking membership status for user:', userId);
    
    const [userStatus] = await db.execute(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.is_member,
        u.membership_stage,
        u.application_status,
        u.application_submitted_at,
        u.application_reviewed_at,
        u.converse_id,
        u.mentor_id,
        u.primary_class_id,
        u.decline_reason,
        s.approval_status,
        s.reviewed_at as survey_reviewed_at
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
      submitted_at: user.application_submitted_at,
      reviewed_at: user.application_reviewed_at || user.survey_reviewed_at,
      decline_reason: user.decline_reason
    });
    
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ error: error.message });
  }
};



/**
 * Submit initial application with enhanced validation
 */
// export const submitInitialApplication = async (req, res) => {
//   try {
//     console.log('🎯 submitInitialApplication called!');
//     console.log('📝 Request body:', req.body);

//     const { answers, applicationTicket } = req.body;
//     const user = req.user;
    
//     console.log('👤 User:', user);
    
//     if (!user || !user.id) {
//       return res.status(401).json({ error: 'User not authenticated' });
//     }

//     const userId = user.id;
//     console.log('🔍 Extracted userId:', userId);

//     const result = await db.transaction(async (connection) => {
//       // Get user details
//       const [userRows] = await connection.execute(
//         'SELECT * FROM users WHERE id = ?',
//         [userId]
//       );

//       if (userRows.length === 0) {
//         throw new Error('User not found');
//       }

//       const userData = userRows[0];
//       console.log('✅ User found:', userData.username);

//       // Insert application into surveylog (not applications table)
//       const insertQuery = `
//         INSERT INTO surveylog (
//           user_id, application_type, answers, application_ticket,
//           approval_status, createdAt
//         ) VALUES (?, ?, ?, ?, ?, NOW())
//       `;

//       const [insertResult] = await connection.execute(insertQuery, [
//         userId.toString(),
//         'initial_application',
//         JSON.stringify(answers),
//         applicationTicket,
//         'pending'
//       ]);

//       // Update user record
//       const updateQuery = `
//         UPDATE users 
//         SET application_ticket = ?, membership_stage = ?
//         WHERE id = ?
//       `;

//       await connection.execute(updateQuery, [
//         applicationTicket,
//         'applicant',
//         userId
//       ]);

//       return {
//         applicationId: insertResult.insertId,
//         applicationTicket,
//         userId
//       };
//     });

//     console.log('✅ Application submitted successfully:', result);
    
//     res.json({
//       success: true,
//       message: 'Application submitted successfully',
//       data: result
//     });

//   } catch (error) {
//     console.error('❌ submitInitialApplication error:', error);
//     res.status(500).json({ 
//       error: 'Failed to submit application',
//       details: error.message 
//     });
//   }
// };

// =====================================================
// MERGED AND ENHANCED submitInitialApplication
// ikootaapi/controllers/membershipControllers_2.js
// =====================================================

// import { sendEmailWithTemplate } from '../utils/email.js';
// import { generateApplicationTicket } from './membershipControllers_1.js';
// import db from '../config/db.js';

export const submitInitialApplication = async (req, res) => {
  try {
    console.log('🎯 submitInitialApplication called!');
    console.log('📝 Request body:', req.body);
    
    // ✅ ENHANCED: Support both old and new request formats
    const { answers, applicationTicket, surveyData } = req.body;
    const user = req.user;
    
    console.log('👤 User:', user);
    
    if (!user || !user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId = user.id;
    console.log('🔍 Extracted userId:', userId);
    
    // ✅ ENHANCED: Determine which data format we're using
    const applicationData = surveyData || answers;
    const ticket = applicationTicket || generateApplicationTicket(user.username, user.email, 'INITIAL');
    
    if (!applicationData) {
      return res.status(400).json({ 
        error: 'Missing application data', 
        expected: 'Either "answers" or "surveyData" required' 
      });
    }
    
    console.log('📋 Using application data format:', surveyData ? 'surveyData' : 'answers');
    
    // ✅ ENHANCED: Validate user eligibility for submission
    const [userCheck] = await db.execute(
      'SELECT id, username, email, is_member, application_status, membership_stage FROM users WHERE id = ?',
      [userId]
    );
    
    if (userCheck.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userCheck[0];
    console.log('✅ User found:', userData.username);
    
    // ✅ ENHANCED: Check if user is eligible to submit application
    if (userData.is_member !== 'applied') {
      return res.status(400).json({ 
        error: 'User not eligible for application submission',
        current_status: userData.is_member,
        note: 'Only users with status "applied" can submit initial applications'
      });
    }
    
    // ✅ ENHANCED: Prevent duplicate submissions (optional check)
    if (userData.application_status === 'submitted') {
      return res.status(400).json({
        error: 'Application already submitted',
        current_status: userData.application_status,
        note: 'You can update your application instead of resubmitting'
      });
    }
    
    // ✅ ENHANCED: Use proper database transaction
    const result = await db.transaction(async (connection) => {
      // ✅ NEW: Insert/Update survey response with enhanced data
      const surveyQuery = `
        INSERT INTO surveylog (
          user_id, 
          answers, 
          application_type, 
          approval_status, 
          application_ticket,
          createdAt,
          updatedAt
        ) VALUES (?, ?, 'initial_application', 'pending', ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
          answers = VALUES(answers),
          approval_status = 'pending',
          application_ticket = VALUES(application_ticket),
          updatedAt = NOW()
      `;
      
      const [surveyResult] = await connection.execute(surveyQuery, [
        userId.toString(),
        JSON.stringify(applicationData),
        ticket
      ]);
      
      // ✅ ENHANCED: Update user status with comprehensive data
      const updateQuery = `
        UPDATE users 
        SET 
          application_ticket = ?, 
          membership_stage = 'applicant',
          application_status = 'submitted',
          application_submitted_at = NOW(),
          updatedAt = NOW()
        WHERE id = ?
      `;
      
      await connection.execute(updateQuery, [ticket, userId]);
      
      return {
        applicationId: surveyResult.insertId,
        applicationTicket: ticket,
        userId,
        status: 'submitted',
        membershipStage: 'applicant'
      };
    });
    
    console.log('✅ Application submitted successfully:', result);
    
    // ✅ NEW: Notify admins of new application
    try {
      await notifyAdminsOfNewApplication(userId, userData.username, userData.email);
      console.log('✅ Admin notifications sent');
    } catch (emailError) {
      console.warn('⚠️ Admin notification failed (non-critical):', emailError.message);
      // Don't fail the application submission if email fails
    }
    
    // ✅ ENHANCED: Comprehensive response
    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: result,
      next_steps: {
        status: 'pending_review',
        description: 'Your application is now under admin review',
        estimated_review_time: '2-5 business days',
        notification_method: 'email'
      }
    });
    
  } catch (error) {
    console.error('❌ submitInitialApplication error:', error);
    
    // ✅ ENHANCED: Better error handling
    let errorMessage = 'Failed to submit application';
    let statusCode = 500;
    
    if (error.message.includes('not eligible')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes('not found')) {
      errorMessage = 'User not found';
      statusCode = 404;
    } else if (error.message.includes('Duplicate entry')) {
      errorMessage = 'Application already exists for this user';
      statusCode = 409;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

// =====================================================
// ✅ ENHANCED: Admin Notification Function
// =====================================================

const notifyAdminsOfNewApplication = async (userId, username, email) => {
  try {
    console.log('📧 Sending admin notifications for new application...');
    
    // Get all admin users
    const [admins] = await db.execute(
      'SELECT email, username FROM users WHERE role IN ("admin", "super_admin") AND email IS NOT NULL'
    );
    
    if (admins.length === 0) {
      console.warn('⚠️ No admin users found to notify');
      return;
    }
    
    console.log(`📧 Found ${admins.length} admin(s) to notify`);
    
    // Send notification to each admin
    const notificationPromises = admins.map(async (admin) => {
      try {
        await sendEmailWithTemplate(admin.email, 'admin_new_application', {
          APPLICANT_USERNAME: username,
          APPLICANT_EMAIL: email,
          SUBMISSION_DATE: new Date().toLocaleDateString(),
          REVIEW_URL: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/applications`,
          ADMIN_NAME: admin.username
        });
        console.log(`✅ Notification sent to admin: ${admin.email}`);
      } catch (emailError) {
        console.error(`❌ Failed to notify admin ${admin.email}:`, emailError.message);
      }
    });
    
    // Wait for all notifications to complete (but don't fail if some fail)
    await Promise.allSettled(notificationPromises);
    console.log('✅ Admin notification process completed');
    
  } catch (error) {
    console.error('❌ Admin notification error:', error);
    throw error; // Re-throw so caller knows notification failed
  }
};

// =====================================================
// ✅ ADDITIONAL: Application Update Function (Bonus)
// =====================================================

export const updateInitialApplication = async (req, res) => {
  try {
    const { userId } = req.user;
    const { surveyData, answers } = req.body;
    
    console.log('📝 Updating application for user:', userId);
    
    const applicationData = surveyData || answers;
    
    if (!applicationData) {
      return res.status(400).json({ 
        error: 'Missing application data to update' 
      });
    }
    
    // Check if user has a submitted application that can be updated
    const [userCheck] = await db.execute(
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
    await db.execute(`
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
      updated_at: new Date().toISOString()
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
 * Get application history for user
 */
export const getApplicationHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    // Get application history
    const [history] = await db.query(`
      SELECT 
        sl.application_type,
        sl.approval_status,
        sl.createdAt as submitted_at,
        sl.reviewed_at,
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
        mrh.reviewed_at,
        reviewer.username as reviewer_name
      FROM membership_review_history mrh
      LEFT JOIN users reviewer ON mrh.reviewer_id = reviewer.id
      WHERE mrh.user_id = ?
      ORDER BY mrh.reviewed_at DESC
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

// ==================================================
// FULL MEMBERSHIP FUNCTIONS
// ==================================================

/**
 * Get full membership status and eligibility
 */
export const getFullMembershipStatus = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    const user = await getUserById(userId);
    
    // Get full membership application details if exists
    const [fullMembershipApps] = await db.query(`
      SELECT 
        sl.answers,
        sl.approval_status,
        sl.createdAt as submitted_at,
        sl.reviewed_at,
        sl.admin_notes,
        reviewer.username as reviewed_by
      FROM surveylog sl
      LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
      WHERE CAST(sl.user_id AS UNSIGNED) = ? AND sl.application_type = 'full_membership'
      ORDER BY sl.createdAt DESC
      LIMIT 1
    `, [userId]);
    
    // Check eligibility for full membership
    const isEligible = user.membership_stage === 'pre_member';
    const currentApp = fullMembershipApps[0] || null;
    
    // Get requirements and benefits
    const requirements = [
      'Completed initial membership application',
      'Active participation for at least 30 days',
      'Attended at least 2 community events',
      'Good standing with community guidelines'
    ];
    
    const benefits = [
      'Access to exclusive member events',
      'Voting rights in community decisions',
      'Advanced class access',
      'Mentorship opportunities',
      'Priority support'
    ];
    
    return successResponse(res, {
      currentStatus: {
        membership_stage: user.membership_stage,
        is_member: user.is_member,
        full_membership_application_status: currentApp?.approval_status || 'not_submitted'
      },
      fullMembershipApplication: currentApp,
      eligibility: {
        isEligible,
        canApply: isEligible && (!currentApp || currentApp.approval_status === 'rejected'),
        requirements,
        benefits
      },
      nextSteps: isEligible ? [
        'Review full membership benefits',
        'Complete full membership application',
        'Submit required documentation'
      ] : [
        'Complete initial membership process first'
      ]
    });
    
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Submit full membership application
 */
export const submitFullMembershipApplication = async (req, res) => {
  try {
    const { answers, additionalDocuments } = req.body;
    const userId = req.user.id || req.user.user_id;
        
    // Validate input
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      throw new CustomError('Application answers are required', 400);
    }
        
    const user = await getUserById(userId);
        
    // Check eligibility
    if (user.membership_stage !== 'pre_member') {
      throw new CustomError('Not eligible for full membership application', 403);
    }
        
    // Check for existing application
    const [existingApps] = await db.query(`
      SELECT approval_status FROM surveylog 
      WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = 'full_membership'
      ORDER BY createdAt DESC LIMIT 1
    `, [userId]);
        
    if (existingApps.length > 0 && existingApps[0].approval_status === 'pending') {
      throw new CustomError('Full membership application already submitted', 400);
    }
        
    const result = await db.transaction(async (connection) => {
      // Generate application ticket
      const applicationTicket = generateApplicationTicket(user.username, user.email, 'FULL');
            
      // Submit application
      await connection.execute(`
        INSERT INTO surveylog (
          user_id, 
          answers, 
          application_type, 
          approval_status, 
          application_ticket,
          additional_data,
          createdAt
        ) VALUES (?, ?, 'full_membership', 'pending', ?, ?, NOW())
      `, [
        userId.toString(), 
        JSON.stringify(answers), 
        applicationTicket,
        JSON.stringify({ additionalDocuments: additionalDocuments || [] })
      ]);
            
      return { applicationTicket };
    });
        
    // Send confirmation email
    try {
      await sendEmail(user.email, 'full_membership_application_submitted', {
        USERNAME: user.username,
        APPLICATION_TICKET: result.applicationTicket,
        SUBMISSION_DATE: new Date().toLocaleDateString()
      });
    } catch (emailError) {
      console.error('Confirmation email failed:', emailError);
    }
        
    return successResponse(res, {
      applicationTicket: result.applicationTicket,
      nextSteps: [
        'Your application is now under review',
        'Review process typically takes 5-7 business days',
        'You will receive email notification once reviewed',
        'Continue participating in community activities'
      ]
    }, 'Full membership application submitted successfully', 201);
        
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Log full membership access
 */
export const logFullMembershipAccess = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    // Insert or update access log
    await db.query(`
      INSERT INTO full_membership_access (user_id, first_accessed_at, last_accessed_at, access_count)
      VALUES (?, NOW(), NOW(), 1)
      ON DUPLICATE KEY UPDATE 
        last_accessed_at = NOW(),
        access_count = access_count + 1
    `, [userId]);
    
    // Get updated access info
    const [accessInfo] = await db.query(`
      SELECT first_accessed_at, last_accessed_at, access_count
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

// ==================================================
// APPLICATION UTILITY FUNCTIONS
// ==================================================

/**
 * Update application answers (before submission)
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
      SET answers = ?, updated_at = NOW()
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
        SET approval_status = 'withdrawn', admin_notes = ?, reviewed_at = NOW()
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