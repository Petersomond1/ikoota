// ikootaapi/controllers/membershipControllers.js
// ==================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { sendEmail, sendSMS } from '../utils/notifications.js';
import CustomError from '../utils/CustomError.js';

// Utility function to generate application ticket
const generateApplicationTicket = (username, email) => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `APP-${username.substr(0, 3).toUpperCase()}-${timestamp}-${random}`.toUpperCase();
};

// REFINED: Enhanced Login with optimized query
export const enhancedLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // Single optimized query to get user with membership status
    const [users] = await db.query(`
      SELECT u.*, 
             COALESCE(sl.approval_status, 'not_submitted') as initial_application_status,
             sl.createdAt as initial_application_date,
             fma.first_accessed_at as full_membership_accessed,
             COUNT(fma.user_id) > 0 as has_accessed_full_membership
      FROM users u
      LEFT JOIN surveylog sl ON u.id = CAST(sl.user_id AS UNSIGNED) AND sl.application_type = 'initial_application'
      LEFT JOIN full_membership_access fma ON u.id = fma.user_id
      WHERE u.email = ? OR u.username = ?
      GROUP BY u.id
    `, [identifier, identifier]);
    
    if (!users || users.length === 0) {
      throw new CustomError('Invalid credentials', 401);
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new CustomError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        user_id: user.id, 
        username: user.username, 
        email: user.email,
        membership_stage: user.membership_stage,
        is_member: user.is_member,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Smart redirect logic
    let redirectTo = '/dashboard';
    
    if (user.membership_stage === 'applicant' && user.initial_application_status === 'not_submitted') {
      redirectTo = '/application-survey';
    } else if (user.membership_stage === 'applicant' && user.initial_application_status === 'pending') {
      redirectTo = '/application-pending';
    } else if (user.membership_stage === 'pre_member' && !user.has_accessed_full_membership) {
      redirectTo = '/full-membership-intro';
    } else if (user.membership_stage === 'pre_member' && user.full_membership_status === 'not_applied') {
      redirectTo = '/full-membership-application';
    } else if (user.membership_stage === 'member') {
      redirectTo = '/member-dashboard';
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        membership_stage: user.membership_stage,
        is_member: user.is_member,
        role: user.role
      },
      redirectTo
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ 
      error: error.message || 'Login failed' 
    });
  }
};

// NEW: Comprehensive User Dashboard
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Single comprehensive query using the stored procedure
    const [membershipData] = await db.query('CALL GetCompleteMembershipStatus(?)', [userId]);
    const status = membershipData[0][0];

    // Get user's classes and activities
    const [userActivities] = await db.query(`
      SELECT 
        'class_membership' as type,
        c.class_name as title,
        ucm.joined_at as date,
        ucm.membership_status as status
      FROM user_class_memberships ucm
      JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ?
      
      UNION ALL
      
      SELECT 
        'teaching' as type,
        t.topic as title,
        t.createdAt as date,
        'published' as status
      FROM teachings t
      WHERE CAST(t.user_id AS UNSIGNED) = ?
      
      ORDER BY date DESC
      LIMIT 10
    `, [userId, userId]);

    // Get recent notifications (if notifications table exists)
    const [notifications] = await db.query(`
      SELECT 
        'membership_update' as type,
        CASE 
          WHEN approval_status = 'approved' THEN 'Your application has been approved!'
          WHEN approval_status = 'rejected' THEN 'Your application needs revision'
          ELSE 'Your application is under review'
        END as message,
        reviewed_at as date
      FROM surveylog
      WHERE CAST(user_id AS UNSIGNED) = ? AND reviewed_at IS NOT NULL
      ORDER BY reviewed_at DESC
      LIMIT 5
    `, [userId]);

    res.json({
      membershipStatus: status,
      recentActivities: userActivities,
      notifications,
      quickActions: generateQuickActions(status)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

// Helper function for quick actions
const generateQuickActions = (status) => {
  const actions = [];
  
  if (status.membership_stage === 'applicant' && status.initial_application_status === 'not_submitted') {
    actions.push({ 
      type: 'primary', 
      text: 'Complete Application', 
      link: '/application-survey' 
    });
  }
  
  if (status.membership_stage === 'pre_member' && !status.has_accessed_full_membership) {
    actions.push({ 
      type: 'info', 
      text: 'Learn About Full Membership', 
      link: '/full-membership-info' 
    });
  }
  
  if (status.membership_stage === 'pre_member' && status.full_membership_application_status === 'not_submitted') {
    actions.push({ 
      type: 'success', 
      text: 'Apply for Full Membership', 
      link: '/full-membership-application' 
    });
  }
  
  actions.push({ 
    type: 'secondary', 
    text: 'View Profile', 
    link: '/profile' 
  });
  
  return actions;
};

// NEW: Application History
export const getApplicationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
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

    // Get review history
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

    res.json({
      applications: history,
      reviews
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get application history' });
  }
};

// ENHANCED: Optimized Pending Applications with Filters
export const getPendingApplications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'pending', 
      stage = 'initial',
      sortBy = 'submitted_at',
      sortOrder = 'ASC',
      search = ''
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build dynamic WHERE clause
    let whereClause = 'WHERE sl.approval_status = ? AND sl.application_type = ?';
    let queryParams = [status, stage === 'initial' ? 'initial_application' : 'full_membership'];
    
    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // Use the pending applications view for better performance
    const viewName = stage === 'initial' ? 'pending_initial_applications' : 'pending_full_memberships';
    
    const [applications] = await db.query(`
      SELECT * FROM ${viewName}
      ${search ? `WHERE username LIKE ? OR email LIKE ?` : ''}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `, search ? [`%${search}%`, `%${search}%`, parseInt(limit), offset] : [parseInt(limit), offset]);

    const [countResult] = await db.query(`
      SELECT COUNT(*) as total FROM ${viewName}
      ${search ? `WHERE username LIKE ? OR email LIKE ?` : ''}
    `, search ? [`%${search}%`, `%${search}%`] : []);

    res.json({
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      },
      filters: { status, stage, sortBy, sortOrder, search }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pending applications' });
  }
};

// NEW: Bulk Approve Applications
export const bulkApproveApplications = async (req, res) => {
  try {
    const { userIds, action, adminNotes } = req.body;
    const reviewerId = req.user.id;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new CustomError('User IDs are required', 400);
    }
    
    if (!['approve', 'reject'].includes(action)) {
      throw new CustomError('Invalid action', 400);
    }
    
    const status = action === 'approve' ? 'approved' : 'rejected';
    const newStage = action === 'approve' ? 'pre_member' : 'applicant';
    const newMemberStatus = action === 'approve' ? 'granted' : 'rejected';
    
    // Use transaction for bulk operations
    await db.beginTransaction();
    
    try {
      // Update surveylog entries
      const placeholders = userIds.map(() => '?').join(',');
      await db.query(`
        UPDATE surveylog 
        SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
        WHERE CAST(user_id AS UNSIGNED) IN (${placeholders}) AND application_type = 'initial_application'
      `, [status, adminNotes, reviewerId, ...userIds]);
      
      // Update user statuses
      await db.query(`
        UPDATE users 
        SET membership_stage = ?, is_member = ?
        WHERE id IN (${placeholders})
      `, [newStage, newMemberStatus, ...userIds]);
      
      // Get user details for notifications
      const [users] = await db.query(`
        SELECT id, username, email FROM users WHERE id IN (${placeholders})
      `, userIds);
      
      // Send notification emails
      const emailTemplate = action === 'approve' ? 'initial_application_approved' : 'initial_application_rejected';
      const emailPromises = users.map(user => 
        sendEmail(user.email, emailTemplate, {
          USERNAME: user.username,
          ADMIN_NOTES: adminNotes || '',
          REVIEW_DATE: new Date().toLocaleDateString()
        })
      );
      
      await Promise.all(emailPromises);
      await db.commit();
      
      res.json({
        message: `Successfully ${action}ed ${userIds.length} applications`,
        processedCount: userIds.length
      });
    } catch (error) {
      await db.rollback();
      throw error;
    }
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to process bulk applications'
    });
  }
};

// NEW: Enhanced Membership Analytics
export const getMembershipAnalytics = async (req, res) => {
  try {
    const { period = '30d', detailed = false } = req.query;
    
    // Get data from the membership_stats view
    const [statsData] = await db.query('SELECT * FROM membership_stats');
    
    // Get conversion funnel data
    const [funnelData] = await db.query(`
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN membership_stage != 'none' THEN 1 END) as started_application,
        COUNT(CASE WHEN membership_stage = 'pre_member' OR membership_stage = 'member' THEN 1 END) as approved_initial,
        COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members
      FROM users
    `);
    
    // Get time-series data for the chart
    const [timeSeriesData] = await db.query(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as registrations,
        COUNT(CASE WHEN membership_stage = 'pre_member' OR membership_stage = 'member' THEN 1 END) as approvals
      FROM users 
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `);
    
    let detailedAnalytics = {};
    if (detailed === 'true') {
      // Get detailed breakdown by demographics, classes, etc.
      const [classBreakdown] = await db.query(`
        SELECT 
          c.class_type,
          COUNT(DISTINCT ucm.user_id) as member_count
        FROM user_class_memberships ucm
        JOIN classes c ON ucm.class_id = c.class_id
        JOIN users u ON ucm.user_id = u.id
        WHERE u.membership_stage IN ('pre_member', 'member')
        GROUP BY c.class_type
      `);
      
      detailedAnalytics = { classBreakdown };
    }
    
    res.json({
      overview: statsData,
      conversionFunnel: funnelData[0],
      timeSeries: timeSeriesData,
      ...detailedAnalytics
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get membership analytics' });
  }
};

// NEW: Export Membership Data
export const exportMembershipData = async (req, res) => {
  try {
    const { format = 'csv', filters = {} } = req.query;
    
    // Use the admin_membership_overview view for comprehensive data
    const [membershipData] = await db.query(`
      SELECT 
        id,
        username,
        email,
        membership_stage,
        initial_status,
        initial_approval_status,
        initial_submitted,
        full_application_status,
        full_submitted,
        user_created
      FROM admin_membership_overview
      ORDER BY user_created DESC
    `);
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(membershipData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="membership_data.csv"');
      res.send(csv);
    } else {
      res.json({
        data: membershipData,
        exportedAt: new Date().toISOString(),
        totalRecords: membershipData.length
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to export membership data' });
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => 
      typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
};

// ENHANCED: Submit Initial Application with better validation
export const submitInitialApplication = async (req, res) => {
  try {
    const { answers, applicationTicket } = req.body;
    const userId = req.user.id;

    // Enhanced validation
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      throw new CustomError('Application answers are required', 400);
    }

    // Check if already submitted using the membership status procedure
    const [statusResult] = await db.query('CALL GetCompleteMembershipStatus(?)', [userId]);
    const status = statusResult[0][0];
    
    if (status.initial_application_status !== 'not_submitted') {
      throw new CustomError('Application already submitted', 400);
    }

    // Insert survey response with proper user_id handling
    await db.query(
      `INSERT INTO surveylog (user_id, answers, application_type, approval_status, createdAt) 
       VALUES (?, ?, 'initial_application', 'pending', NOW())`,
      [userId.toString(), JSON.stringify(answers)]
    );

    // Update user with application ticket if provided
    if (applicationTicket) {
      await db.query(
        'UPDATE users SET application_ticket = ? WHERE id = ?',
        [applicationTicket, userId]
      );
    }

    // Send confirmation email
    const [user] = await db.query('SELECT username, email FROM users WHERE id = ?', [userId]);
    await sendEmail(user[0].email, 'initial_application_submitted', {
      USERNAME: user[0].username,
      APPLICATION_TICKET: applicationTicket || 'AUTO-GENERATED',
      SUBMISSION_DATE: new Date().toLocaleDateString()
    });

    res.status(201).json({
      message: 'Application submitted successfully',
      applicationTicket: applicationTicket || 'AUTO-GENERATED',
      nextSteps: [
        'Your application is now under review',
        'You will receive an email notification within 3-5 business days',
        'Check your dashboard for status updates'
      ]
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ 
      error: error.message || 'Failed to submit application' 
    });
  }
};

export const checkApplicationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Use the stored procedure to get complete membership status
    const [membershipData] = await db.query('CALL GetCompleteMembershipStatus(?)', [userId]);
    const status = membershipData[0][0];

    // Get the latest application details from surveylog
    const [applicationDetails] = await db.query(`
      SELECT 
        sl.application_type,
        sl.approval_status,
        sl.createdAt as submitted_at,
        sl.reviewed_at,
        sl.admin_notes,
        sl.application_ticket,
        reviewer.username as reviewed_by
      FROM surveylog sl
      LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
      WHERE CAST(sl.user_id AS UNSIGNED) = ?
      ORDER BY sl.createdAt DESC
      LIMIT 1
    `, [userId]);

    // Determine next steps based on current status
    let nextSteps = [];
    let canSubmitApplication = false;
    
    if (status.initial_application_status === 'not_submitted') {
      nextSteps = [
        'Complete your initial application survey',
        'Submit required documentation',
        'Wait for admin review (3-5 business days)'
      ];
      canSubmitApplication = true;
    } else if (status.initial_application_status === 'pending') {
      nextSteps = [
        'Your application is under review',
        'You will receive an email notification once reviewed',
        'Check back in 3-5 business days'
      ];
    } else if (status.initial_application_status === 'approved') {
      if (status.membership_stage === 'pre_member' && !status.has_accessed_full_membership) {
        nextSteps = [
          'Congratulations! Your initial application was approved',
          'Learn about full membership benefits',
          'Access your pre-member dashboard'
        ];
      } else if (status.full_membership_application_status === 'not_submitted') {
        nextSteps = [
          'You are eligible for full membership',
          'Submit your full membership application',
          'Complete additional requirements if any'
        ];
      } else if (status.full_membership_application_status === 'pending') {
        nextSteps = [
          'Your full membership application is under review',
          'Final review process is in progress',
          'You will be notified of the decision soon'
        ];
      } else if (status.membership_stage === 'member') {
        nextSteps = [
          'Welcome! You are now a full member',
          'Access all member benefits and resources',
          'Participate in member-exclusive activities'
        ];
      }
    } else if (status.initial_application_status === 'rejected') {
      nextSteps = [
        'Your application was not approved',
        'Review admin feedback below',
        'You may resubmit after addressing the concerns'
      ];
      canSubmitApplication = true;
    }

    // Calculate progress percentage
    let progressPercentage = 0;
    if (status.membership_stage === 'applicant') {
      progressPercentage = status.initial_application_status === 'not_submitted' ? 0 : 25;
    } else if (status.membership_stage === 'pre_member') {
      progressPercentage = status.full_membership_application_status === 'not_submitted' ? 50 : 75;
    } else if (status.membership_stage === 'member') {
      progressPercentage = 100;
    }

    res.json({
      success: true,
      currentStatus: {
        membership_stage: status.membership_stage,
        initial_application_status: status.initial_application_status,
        full_membership_application_status: status.full_membership_application_status,
        is_member: status.is_member,
        progressPercentage
      },
      applicationDetails: applicationDetails[0] || null,
      nextSteps,
      canSubmitApplication,
      timeline: {
        registered: status.user_created,
        initialSubmitted: status.initial_application_submitted,
        initialReviewed: applicationDetails[0]?.reviewed_at || null,
        fullMembershipAccessed: status.full_membership_accessed,
        fullMembershipSubmitted: status.full_membership_application_submitted
      }
    });

  } catch (error) {
    console.error('Error checking application status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check application status',
      message: 'Please try again later or contact support if the issue persists'
    });
  }
};


// Add these missing functions to your membershipControllers.js file

// 1. Send Verification Code (SMS/Email)
export const sendVerificationCode = async (req, res) => {
  try {
    const { email, phone, type = 'email' } = req.body;
    
    if (!email && !phone) {
      throw new CustomError('Email or phone number is required', 400);
    }
    
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store verification code in database
    await db.query(`
      INSERT INTO verification_codes (email, phone, code, type, expires_at, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        code = VALUES(code), 
        expires_at = VALUES(expires_at), 
        attempts = 0,
        created_at = NOW()
    `, [email || null, phone || null, verificationCode, type, expiresAt]);
    
    // Send verification code
    if (type === 'email' && email) {
      await sendEmail(email, 'verification_code', {
        VERIFICATION_CODE: verificationCode,
        EXPIRES_IN: '10 minutes'
      });
    } else if (type === 'sms' && phone) {
      await sendSMS(phone, `Your Ikoota verification code is: ${verificationCode}. Valid for 10 minutes.`);
    }
    
    res.json({
      success: true,
      message: `Verification code sent to ${type === 'email' ? email : phone}`,
      expiresIn: 600 // 10 minutes in seconds
    });
    
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to send verification code'
    });
  }
};

// 2. Register with Verification
export const registerWithVerification = async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      phone, 
      verificationCode, 
      verificationType = 'email' 
    } = req.body;
    
    // Validate required fields
    if (!username || !email || !password || !verificationCode) {
      throw new CustomError('All fields are required', 400);
    }
    
    // Verify the verification code
    const [verificationResult] = await db.query(`
      SELECT * FROM verification_codes 
      WHERE ${verificationType === 'email' ? 'email' : 'phone'} = ? 
        AND code = ? 
        AND type = ? 
        AND expires_at > NOW() 
        AND attempts < 3
    `, [verificationType === 'email' ? email : phone, verificationCode, verificationType]);
    
    if (!verificationResult || verificationResult.length === 0) {
      throw new CustomError('Invalid or expired verification code', 400);
    }
    
    // Check if user already exists
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existingUser && existingUser.length > 0) {
      throw new CustomError('User with this email or username already exists', 409);
    }
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Generate application ticket
    const applicationTicket = generateApplicationTicket(username, email);
    
    // Create user
    const [result] = await db.query(`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        phone, 
        membership_stage, 
        is_member, 
        application_ticket,
        createdAt
      ) VALUES (?, ?, ?, ?, 'applicant', 'pending', ?, NOW())
    `, [username, email, passwordHash, phone || null, applicationTicket]);
    
    const userId = result.insertId;
    
    // Delete used verification code
    await db.query(`
      DELETE FROM verification_codes 
      WHERE ${verificationType === 'email' ? 'email' : 'phone'} = ? AND code = ?
    `, [verificationType === 'email' ? email : phone, verificationCode]);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        user_id: userId, 
        username, 
        email,
        membership_stage: 'applicant',
        is_member: 'pending',
        role: 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Send welcome email
    await sendEmail(email, 'welcome_registration', {
      USERNAME: username,
      APPLICATION_TICKET: applicationTicket
    });
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        username,
        email,
        membership_stage: 'applicant',
        application_ticket: applicationTicket
      },
      redirectTo: '/application-survey'
    });
    
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Registration failed'
    });
  }
};

// 3. Get Full Membership Status
export const getFullMembershipStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get comprehensive membership status
    const [membershipData] = await db.query('CALL GetCompleteMembershipStatus(?)', [userId]);
    const status = membershipData[0][0];
    
    // Get full membership application details if exists
    const [fullMembershipApp] = await db.query(`
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
    const isEligible = status.membership_stage === 'pre_member' && 
                      status.initial_application_status === 'approved';
    
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
    
    res.json({
      currentStatus: status,
      fullMembershipApplication: fullMembershipApp[0] || null,
      eligibility: {
        isEligible,
        canApply: isEligible && status.full_membership_application_status === 'not_submitted',
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
    res.status(500).json({
      error: 'Failed to get full membership status'
    });
  }
};

// 4. Log Full Membership Access
export const logFullMembershipAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    
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
    
    res.json({
      success: true,
      message: 'Access logged successfully',
      accessInfo: accessInfo[0]
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to log access'
    });
  }
};

// 5. Submit Full Membership Application
export const submitFullMembershipApplication = async (req, res) => {
  try {
    const { answers, additionalDocuments } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      throw new CustomError('Application answers are required', 400);
    }
    
    // Check eligibility
    const [membershipData] = await db.query('CALL GetCompleteMembershipStatus(?)', [userId]);
    const status = membershipData[0][0];
    
    if (status.membership_stage !== 'pre_member') {
      throw new CustomError('Not eligible for full membership application', 403);
    }
    
    if (status.full_membership_application_status !== 'not_submitted') {
      throw new CustomError('Full membership application already submitted', 400);
    }
    
    // Generate application ticket
    const [user] = await db.query('SELECT username, email FROM users WHERE id = ?', [userId]);
    const applicationTicket = generateApplicationTicket(user[0].username + '-FULL', user[0].email);
    
    // Submit application
    await db.query(`
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
    
    // Send confirmation email
    await sendEmail(user[0].email, 'full_membership_application_submitted', {
      USERNAME: user[0].username,
      APPLICATION_TICKET: applicationTicket,
      SUBMISSION_DATE: new Date().toLocaleDateString()
    });
    
    res.status(201).json({
      success: true,
      message: 'Full membership application submitted successfully',
      applicationTicket,
      nextSteps: [
        'Your application is now under review',
        'Review process typically takes 5-7 business days',
        'You will receive email notification once reviewed',
        'Continue participating in community activities'
      ]
    });
    
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to submit full membership application'
    });
  }
};

// 6. Update Application Status (Admin)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, adminNotes, notifyUser = true } = req.body;
    const reviewerId = req.user.id;
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      throw new CustomError('Invalid status', 400);
    }
    
    await db.beginTransaction();
    
    try {
      // Update surveylog
      await db.query(`
        UPDATE surveylog 
        SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
        WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = 'initial_application'
      `, [status, adminNotes, reviewerId, userId]);
      
      // Update user status
      const newStage = status === 'approved' ? 'pre_member' : 'applicant';
      const memberStatus = status === 'approved' ? 'granted' : 'rejected';
      
      await db.query(`
        UPDATE users 
        SET membership_stage = ?, is_member = ?
        WHERE id = ?
      `, [newStage, memberStatus, userId]);
      
      // Log the review action
      await db.query(`
        INSERT INTO membership_review_history 
        (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
        VALUES (?, 'initial_application', 'pending', ?, ?, ?, NOW())
      `, [userId, status, adminNotes, reviewerId]);
      
      // Send notification if requested
      if (notifyUser) {
        const [user] = await db.query('SELECT username, email FROM users WHERE id = ?', [userId]);
        const emailTemplate = status === 'approved' ? 'initial_application_approved' : 'initial_application_rejected';
        
        await sendEmail(user[0].email, emailTemplate, {
          USERNAME: user[0].username,
          ADMIN_NOTES: adminNotes || '',
          REVIEW_DATE: new Date().toLocaleDateString()
        });
      }
      
      await db.commit();
      
      res.json({
        success: true,
        message: `Application ${status} successfully`,
        newStatus: {
          membership_stage: newStage,
          approval_status: status
        }
      });
      
    } catch (error) {
      await db.rollback();
      throw error;
    }
    
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to update application status'
    });
  }
};

// 7. Get Pending Full Memberships (Admin)
export const getPendingFullMemberships = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'submitted_at', 
      sortOrder = 'ASC',
      search = ''
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let searchClause = '';
    let searchParams = [];
    
    if (search) {
      searchClause = 'WHERE (u.username LIKE ? OR u.email LIKE ?)';
      searchParams = [`%${search}%`, `%${search}%`];
    }
    
    const [applications] = await db.query(`
      SELECT 
        u.id as user_id,
        u.username,
        u.email,
        sl.answers,
        sl.createdAt as submitted_at,
        sl.application_ticket,
        sl.additional_data,
        fma.first_accessed_at,
        fma.access_count,
        DATEDIFF(NOW(), sl.createdAt) as days_pending
      FROM surveylog sl
      JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
      LEFT JOIN full_membership_access fma ON u.id = fma.user_id
      ${searchClause}
        AND sl.application_type = 'full_membership' 
        AND sl.approval_status = 'pending'
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `, [...searchParams, parseInt(limit), offset]);
    
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM surveylog sl
      JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
      ${searchClause}
        AND sl.application_type = 'full_membership' 
        AND sl.approval_status = 'pending'
    `, searchParams);
    
    res.json({
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get pending full memberships'
    });
  }
};

// 8. Update Full Membership Status (Admin)
export const updateFullMembershipStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, adminNotes, notifyUser = true } = req.body;
    const reviewerId = req.user.id;
    
    if (!['approved', 'rejected'].includes(status)) {
      throw new CustomError('Invalid status', 400);
    }
    
    await db.beginTransaction();
    
    try {
      // Get application details
      const [application] = await db.query(`
        SELECT CAST(user_id AS UNSIGNED) as user_id 
        FROM surveylog 
        WHERE id = ? AND application_type = 'full_membership'
      `, [applicationId]);
      
      if (!application || application.length === 0) {
        throw new CustomError('Application not found', 404);
      }
      
      const userId = application[0].user_id;
      
      // Update surveylog
      await db.query(`
        UPDATE surveylog 
        SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
        WHERE id = ?
      `, [status, adminNotes, reviewerId, applicationId]);
      
      // Update user to full member if approved
      if (status === 'approved') {
        await db.query(`
          UPDATE users 
          SET membership_stage = 'member', is_member = 'active'
          WHERE id = ?
        `, [userId]);
      }
      
      // Log the review
      await db.query(`
        INSERT INTO membership_review_history 
        (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
        VALUES (?, 'full_membership', 'pending', ?, ?, ?, NOW())
      `, [userId, status, adminNotes, reviewerId]);
      
      // Send notification
      if (notifyUser) {
        const [user] = await db.query('SELECT username, email FROM users WHERE id = ?', [userId]);
        const emailTemplate = status === 'approved' ? 'full_membership_approved' : 'full_membership_rejected';
        
        await sendEmail(user[0].email, emailTemplate, {
          USERNAME: user[0].username,
          ADMIN_NOTES: adminNotes || '',
          REVIEW_DATE: new Date().toLocaleDateString()
        });
      }
      
      await db.commit();
      
      res.json({
        success: true,
        message: `Full membership application ${status} successfully`
      });
      
    } catch (error) {
      await db.rollback();
      throw error;
    }
    
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to update full membership status'
    });
  }
};

// 9. Send Notification (Admin)
export const sendNotification = async (req, res) => {
  try {
    const { 
      recipients, // array of user IDs or 'all'
      subject,
      message,
      type = 'email', // 'email', 'sms', 'both'
      priority = 'normal' // 'low', 'normal', 'high'
    } = req.body;
    
    if (!subject || !message) {
      throw new CustomError('Subject and message are required', 400);
    }
    
    let userList = [];
    
    if (recipients === 'all') {
      const [allUsers] = await db.query('SELECT id, username, email, phone FROM users');
      userList = allUsers;
    } else if (Array.isArray(recipients)) {
      const placeholders = recipients.map(() => '?').join(',');
      const [selectedUsers] = await db.query(
        `SELECT id, username, email, phone FROM users WHERE id IN (${placeholders})`,
        recipients
      );
      userList = selectedUsers;
    } else {
      throw new CustomError('Invalid recipients format', 400);
    }
    
    const sendPromises = [];
    
    for (const user of userList) {
      if ((type === 'email' || type === 'both') && user.email) {
        sendPromises.push(
          sendEmail(user.email, 'admin_notification', {
            USERNAME: user.username,
            SUBJECT: subject,
            MESSAGE: message,
            PRIORITY: priority
          })
        );
      }
      
      if ((type === 'sms' || type === 'both') && user.phone) {
        sendPromises.push(
          sendSMS(user.phone, `${subject}: ${message}`)
        );
      }
    }
    
    await Promise.all(sendPromises);
    
    res.json({
      success: true,
      message: `Notification sent to ${userList.length} users`,
      sentCount: userList.length
    });
    
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to send notification'
    });
  }
};

// 10. Send Membership Notification (Admin)
export const sendMembershipNotification = async (req, res) => {
  try {
    const { 
      membershipStage, // 'applicant', 'pre_member', 'member'
      subject,
      message,
      type = 'email'
    } = req.body;
    
    if (!membershipStage || !subject || !message) {
      throw new CustomError('Membership stage, subject and message are required', 400);
    }
    
    const [users] = await db.query(`
      SELECT id, username, email, phone 
      FROM users 
      WHERE membership_stage = ?
    `, [membershipStage]);
    
    const sendPromises = [];
    
    for (const user of users) {
      if (type === 'email' && user.email) {
        sendPromises.push(
          sendEmail(user.email, 'membership_notification', {
            USERNAME: user.username,
            SUBJECT: subject,
            MESSAGE: message,
            MEMBERSHIP_STAGE: membershipStage
          })
        );
      }
      
      if (type === 'sms' && user.phone) {
        sendPromises.push(
          sendSMS(user.phone, `${subject}: ${message}`)
        );
      }
    }
    
    await Promise.all(sendPromises);
    
    res.json({
      success: true,
      message: `Membership notification sent to ${users.length} ${membershipStage}s`,
      sentCount: users.length
    });
    
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to send membership notification'
    });
  }
};

// 11. Get Membership Overview (Admin)
export const getMembershipOverview = async (req, res) => {
  try {
    // Use the admin_membership_overview view if it exists, otherwise create the query
    const [overview] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.membership_stage,
        u.is_member,
        u.createdAt as user_created,
        
        -- Initial Application Info
        COALESCE(initial_app.approval_status, 'not_submitted') as initial_status,
        initial_app.createdAt as initial_submitted,
        initial_app.reviewed_at as initial_reviewed,
        initial_reviewer.username as initial_reviewer,
        
        -- Full Membership Info  
        COALESCE(full_app.approval_status, 'not_submitted') as full_status,
        full_app.createdAt as full_submitted,
        full_app.reviewed_at as full_reviewed,
        full_reviewer.username as full_reviewer,
        
        -- Access Info
        fma.first_accessed_at as full_membership_accessed,
        fma.access_count
        
      FROM users u
      LEFT JOIN surveylog initial_app ON u.id = CAST(initial_app.user_id AS UNSIGNED) 
        AND initial_app.application_type = 'initial_application'
      LEFT JOIN users initial_reviewer ON initial_app.reviewed_by = initial_reviewer.id
      LEFT JOIN surveylog full_app ON u.id = CAST(full_app.user_id AS UNSIGNED) 
        AND full_app.application_type = 'full_membership'  
      LEFT JOIN users full_reviewer ON full_app.reviewed_by = full_reviewer.id
      LEFT JOIN full_membership_access fma ON u.id = fma.user_id
      ORDER BY u.createdAt DESC
    `);
    
    // Get summary statistics
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as applicants,
        COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as pre_members,
        COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week
      FROM users
    `);
    
    res.json({
      overview,
      summary: stats[0]
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get membership overview'
    });
  }
};

// 12. Get Membership Stats (Admin)
export const getMembershipStats = async (req, res) => {
  try {
    // Get comprehensive statistics
    const [membershipStats] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as total_applicants,
        COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as total_pre_members,
        COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as total_members,
        
        -- Application stats
        COUNT(CASE WHEN EXISTS(
          SELECT 1 FROM surveylog sl 
          WHERE CAST(sl.user_id AS UNSIGNED) = users.id 
            AND sl.application_type = 'initial_application'
        ) THEN 1 END) as submitted_initial_applications,
        
        COUNT(CASE WHEN EXISTS(
          SELECT 1 FROM surveylog sl 
          WHERE CAST(sl.user_id AS UNSIGNED) = users.id 
            AND sl.application_type = 'initial_application' 
            AND sl.approval_status = 'pending'
        ) THEN 1 END) as pending_initial_applications,
        
        COUNT(CASE WHEN EXISTS(
          SELECT 1 FROM surveylog sl 
          WHERE CAST(sl.user_id AS UNSIGNED) = users.id 
            AND sl.application_type = 'full_membership'
        ) THEN 1 END) as submitted_full_applications,
        
        COUNT(CASE WHEN EXISTS(
          SELECT 1 FROM surveylog sl 
          WHERE CAST(sl.user_id AS UNSIGNED) = users.id 
            AND sl.application_type = 'full_membership' 
            AND sl.approval_status = 'pending'
        ) THEN 1 END) as pending_full_applications
        
      FROM users
    `);
    
    // Get time-based registration stats
    const [registrationTrends] = await db.query(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as registrations
      FROM users 
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `);
    
    // Get approval rates
    const [approvalRates] = await db.query(`
      SELECT 
        application_type,
        COUNT(*) as total_applications,
        COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending,
        ROUND(COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) * 100.0 / COUNT(*), 2) as approval_rate
      FROM surveylog
      GROUP BY application_type
    `);
    
    // Get processing time stats
    const [processingTimes] = await db.query(`
      SELECT 
        application_type,
        AVG(DATEDIFF(reviewed_at, createdAt)) as avg_processing_days,
        MIN(DATEDIFF(reviewed_at, createdAt)) as min_processing_days,
        MAX(DATEDIFF(reviewed_at, createdAt)) as max_processing_days
      FROM surveylog
      WHERE reviewed_at IS NOT NULL
      GROUP BY application_type
    `);
    
    res.json({
      membershipStats: membershipStats[0],
      registrationTrends,
      approvalRates,
      processingTimes
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get membership statistics'
    });
  }
};


