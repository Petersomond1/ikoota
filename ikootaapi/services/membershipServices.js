// ikootaapi/services/membershipServices.js
// ===============================================
// MEMBERSHIP SERVICES - COMPLETE BUSINESS LOGIC LAYER
// Clean, organized implementation following Phase 3 specifications
// ===============================================

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { getUserById, executeQuery, validateStageTransition } from '../controllers/membershipCore.js';





// =============================================================================
// APPLICATION MANAGEMENT SERVICES
// =============================================================================

/**
 * Get pending applications with enhanced pagination and filtering
 * Used by: membershipAdminControllers.getPendingApplications
 */
export const getPendingApplicationsWithPagination = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'pending',
      search = '',
      sortBy = 'submittedAt',
      sortOrder = 'DESC',
      stage = 'initial'
    } = options;

    const offset = (page - 1) * limit;
    
    // Validate sort parameters
    const validSortFields = ['submittedAt', 'username', 'email', 'days_pending'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'submittedAt';
    const safeSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Build search clause
    let searchClause = '';
    let searchParams = [];
    
    if (search && search.trim()) {
      searchClause = 'AND (u.username LIKE ? OR u.email LIKE ? OR sl.application_ticket LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      searchParams = [searchTerm, searchTerm, searchTerm];
    }

    // Build application type filter
    const applicationType = stage === 'full' ? 'full_membership' : 'initial_application';

    // Main query to get applications
    const mainQuery = `
      SELECT 
        u.id as user_id,
        u.username,
        u.email,
        u.membership_stage,
        u.is_member,
        u.createdAt as user_created,
        sl.id as application_id,
        sl.answers,
        sl.createdAt as submittedAt,
        sl.application_ticket,
        sl.approval_status,
        sl.admin_notes,
        sl.reviewedAt,
        reviewer.username as reviewed_by_name,
        DATEDIFF(NOW(), sl.createdAt) as days_pending
      FROM surveylog sl
      JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
      LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
      WHERE sl.application_type = ? 
        AND sl.approval_status = ?
        ${searchClause}
      ORDER BY ${safeSortBy === 'submittedAt' ? 'sl.createdAt' : 
                 safeSortBy === 'username' ? 'u.username' : 
                 safeSortBy === 'email' ? 'u.email' : 'days_pending'} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const queryParams = [applicationType, status, ...searchParams, parseInt(limit), offset];
    const [applications] = await db.query(mainQuery, queryParams);

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM surveylog sl
      JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
      WHERE sl.application_type = ? 
        AND sl.approval_status = ?
        ${searchClause}
    `;

    const countParams = [applicationType, status, ...searchParams];
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    // Parse answers for better frontend handling
    const processedApplications = applications.map(app => ({
      ...app,
      answers: app.answers ? JSON.parse(app.answers) : null
    }));

    return {
      applications: processedApplications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: (parseInt(page) * parseInt(limit)) < total
      },
      filters: {
        status,
        stage,
        search,
        sortBy: safeSortBy,
        sortOrder: safeSortOrder
      }
    };

  } catch (error) {
    console.error('❌ Error in getPendingApplicationsWithPagination:', error);
    throw new CustomError(`Failed to fetch pending applications: ${error.message}`, 500);
  }
};

/**
 * Get all reports for admin dashboard
 * Used by: membershipAdminControllers.getAllReports
 */
export const getAllReportsForAdmin = async () => {
  try {
    console.log('📊 Generating comprehensive admin reports...');

    // Application Summary Report
    const [applicationSummary] = await db.query(`
      SELECT 
        application_type,
        approval_status,
        COUNT(*) as count,
        AVG(DATEDIFF(COALESCE(reviewedAt, NOW()), createdAt)) as avg_processing_days
      FROM surveylog
      GROUP BY application_type, approval_status
      ORDER BY application_type, approval_status
    `);

    // Membership Stage Distribution
    const [membershipDistribution] = await db.query(`
      SELECT 
        membership_stage,
        is_member,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE role = 'user' OR role IS NULL), 2) as percentage
      FROM users
      WHERE role = 'user' OR role IS NULL
      GROUP BY membership_stage, is_member
      ORDER BY count DESC
    `);

    // Recent Activity Report (Last 30 days)
    const [recentActivity] = await db.query(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as new_applications,
        COUNT(CASE WHEN application_type = 'initial_application' THEN 1 END) as initial_apps,
        COUNT(CASE WHEN application_type = 'full_membership' THEN 1 END) as full_apps
      FROM surveylog
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
      LIMIT 30
    `);

    // Admin Performance Report
    const [adminPerformance] = await db.query(`
      SELECT 
        reviewer.username as admin_name,
        COUNT(*) as reviews_completed,
        COUNT(CASE WHEN sl.approval_status = 'approved' THEN 1 END) as approvals,
        COUNT(CASE WHEN sl.approval_status = 'rejected' OR sl.approval_status = 'declined' THEN 1 END) as rejections,
        AVG(DATEDIFF(sl.reviewedAt, sl.createdAt)) as avg_review_time_days
      FROM surveylog sl
      JOIN users reviewer ON sl.reviewed_by = reviewer.id
      WHERE sl.reviewedAt >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        AND sl.reviewed_by IS NOT NULL
      GROUP BY reviewer.id, reviewer.username
      ORDER BY reviews_completed DESC
    `);

    // System Health Indicators
    const [systemHealth] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_applications,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending' AND createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY)) as overdue_applications,
        (SELECT COUNT(*) FROM users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) AND (role = 'user' OR role IS NULL)) as new_users_today,
        (SELECT COUNT(*) FROM surveylog WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_applications_today,
        (SELECT AVG(DATEDIFF(reviewedAt, createdAt)) FROM surveylog WHERE reviewedAt IS NOT NULL AND reviewedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as avg_review_time_30d,
        (SELECT COUNT(*) FROM full_membership_applications WHERE status = 'pending') as pending_full_memberships
    `);

    // Conversion Funnel Report
    const [conversionFunnel] = await db.query(`
      SELECT 
        'Registered Users' as stage,
        COUNT(*) as count,
        100.0 as percentage
      FROM users
      WHERE role = 'user' OR role IS NULL
      
      UNION ALL
      
      SELECT 
        'Submitted Initial Application' as stage,
        COUNT(DISTINCT sl.user_id) as count,
        ROUND(COUNT(DISTINCT sl.user_id) * 100.0 / (SELECT COUNT(*) FROM users WHERE role = 'user' OR role IS NULL), 2) as percentage
      FROM surveylog sl
      WHERE sl.application_type = 'initial_application'
      
      UNION ALL
      
      SELECT 
        'Approved as Pre-Member' as stage,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE role = 'user' OR role IS NULL), 2) as percentage
      FROM users
      WHERE membership_stage = 'pre_member'
      
      UNION ALL
      
      SELECT 
        'Submitted Full Membership' as stage,
        COUNT(DISTINCT fma.user_id) as count,
        ROUND(COUNT(DISTINCT fma.user_id) * 100.0 / (SELECT COUNT(*) FROM users WHERE role = 'user' OR role IS NULL), 2) as percentage
      FROM full_membership_applications fma
      
      UNION ALL
      
      SELECT 
        'Approved as Full Member' as stage,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE role = 'user' OR role IS NULL), 2) as percentage
      FROM users
      WHERE membership_stage = 'member'
    `);

    // Processing Time Analysis
    const [processingTimes] = await db.query(`
      SELECT 
        application_type,
        approval_status,
        COUNT(*) as count,
        AVG(DATEDIFF(reviewedAt, createdAt)) as avg_days,
        MIN(DATEDIFF(reviewedAt, createdAt)) as min_days,
        MAX(DATEDIFF(reviewedAt, createdAt)) as max_days,
        STDDEV(DATEDIFF(reviewedAt, createdAt)) as stddev_days
      FROM surveylog
      WHERE reviewedAt IS NOT NULL
        AND reviewedAt >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY application_type, approval_status
      ORDER BY application_type, approval_status
    `);

    // Compile all reports
    const reports = {
      applicationSummary: {
        title: 'Application Summary by Type and Status',
        data: applicationSummary,
        description: 'Overview of all applications by type and current status'
      },
      membershipDistribution: {
        title: 'Membership Stage Distribution',
        data: membershipDistribution,
        description: 'Current distribution of users across membership stages'
      },
      recentActivity: {
        title: 'Recent Application Activity (Last 30 Days)',
        data: recentActivity,
        description: 'Daily breakdown of new applications submitted'
      },
      adminPerformance: {
        title: 'Admin Review Performance (Last 90 Days)',
        data: adminPerformance,
        description: 'Review activity and performance metrics by admin'
      },
      systemHealth: {
        title: 'System Health Indicators',
        data: systemHealth[0],
        description: 'Key metrics for system monitoring and alerts'
      },
      conversionFunnel: {
        title: 'Membership Conversion Funnel',
        data: conversionFunnel,
        description: 'User progression through membership stages'
      },
      processingTimes: {
        title: 'Application Processing Time Analysis',
        data: processingTimes,
        description: 'Statistical analysis of application processing times'
      }
    };

    console.log('✅ Admin reports generated successfully');
    return reports;

  } catch (error) {
    console.error('❌ Error generating admin reports:', error);
    throw new CustomError(`Failed to generate reports: ${error.message}`, 500);
  }
};

// =============================================================================
// USER MANAGEMENT SERVICES
// =============================================================================

/**
 * Get user's complete membership journey
 * Used by: preMemberApplicationController.getUserDashboard
 */
export const getUserMembershipJourney = async (userId) => {
  try {
    const [journey] = await db.query(`
      SELECT 
        -- User Info
        u.id,
        u.username,
        u.email,
        u.membership_stage,
        u.is_member,
        u.role,
        u.createdAt as joined_date,
        
        -- Initial Application
        initial_app.id as initial_app_id,
        initial_app.approval_status as initial_status,
        initial_app.createdAt as initial_submitted,
        initial_app.reviewedAt as initial_reviewed,
        initial_reviewer.username as initial_reviewer_name,
        
        -- Full Membership Application
        full_app.id as full_app_id,
        full_app.status as full_status,
        full_app.submittedAt as full_submitted,
        full_app.reviewedAt as full_reviewed,
        full_reviewer.username as full_reviewer_name,
        
        -- Access Tracking
        fma.first_accessedAt,
        fma.last_accessedAt,
        fma.access_count
        
      FROM users u
      LEFT JOIN surveylog initial_app ON u.id = CAST(initial_app.user_id AS UNSIGNED)
        AND initial_app.application_type = 'initial_application'
        AND initial_app.id = (
          SELECT MAX(id) FROM surveylog 
          WHERE user_id = u.id AND application_type = 'initial_application'
        )
      LEFT JOIN users initial_reviewer ON initial_app.reviewed_by = initial_reviewer.id
      LEFT JOIN full_membership_applications full_app ON u.id = full_app.user_id
        AND full_app.id = (
          SELECT MAX(id) FROM full_membership_applications 
          WHERE user_id = u.id
        )
      LEFT JOIN users full_reviewer ON full_app.reviewed_by = full_reviewer.id
      LEFT JOIN full_membership_access fma ON u.id = fma.user_id
      WHERE u.id = ?
    `, [userId]);

    if (journey.length === 0) {
      throw new CustomError('User not found', 404);
    }

    const userJourney = journey[0];

    // Calculate journey milestones
    const milestones = [];
    
    // Registration milestone
    milestones.push({
      stage: 'registration',
      title: 'Account Created',
      date: userJourney.joined_date,
      status: 'completed',
      description: 'User registered on the platform'
    });

    // Initial application milestone
    if (userJourney.initial_submitted) {
      milestones.push({
        stage: 'initial_application',
        title: 'Initial Application Submitted',
        date: userJourney.initial_submitted,
        status: userJourney.initial_status === 'approved' ? 'completed' : 
                userJourney.initial_status === 'declined' || userJourney.initial_status === 'rejected' ? 'failed' : 'pending',
        description: `Application ${userJourney.initial_status || 'pending review'}`
      });
    }

    // Pre-member access milestone
    if (userJourney.initial_status === 'approved') {
      milestones.push({
        stage: 'pre_member_access',
        title: 'Pre-Member Access Granted',
        date: userJourney.initial_reviewed,
        status: 'completed',
        description: 'Granted access to Towncrier content'
      });
    }

    // Full membership application milestone
    if (userJourney.full_submitted) {
      milestones.push({
        stage: 'full_application',
        title: 'Full Membership Application Submitted',
        date: userJourney.full_submitted,
        status: userJourney.full_status === 'approved' ? 'completed' : 
                userJourney.full_status === 'declined' || userJourney.full_status === 'rejected' ? 'failed' : 'pending',
        description: `Full membership ${userJourney.full_status || 'pending review'}`
      });
    }

    // Full member access milestone
    if (userJourney.full_status === 'approved') {
      milestones.push({
        stage: 'full_member_access',
        title: 'Full Member Access Granted',
        date: userJourney.full_reviewed,
        status: 'completed',
        description: 'Granted full member privileges'
      });
    }

    return {
      user: {
        id: userJourney.id,
        username: userJourney.username,
        email: userJourney.email,
        current_stage: userJourney.membership_stage,
        current_status: userJourney.is_member,
        role: userJourney.role
      },
      milestones,
      applications: {
        initial: {
          status: userJourney.initial_status,
          submitted: userJourney.initial_submitted,
          reviewed: userJourney.initial_reviewed,
          reviewer: userJourney.initial_reviewer_name
        },
        full: {
          status: userJourney.full_status,
          submitted: userJourney.full_submitted,
          reviewed: userJourney.full_reviewed,
          reviewer: userJourney.full_reviewer_name
        }
      },
      access_history: {
        first_access: userJourney.first_accessedAt,
        last_access: userJourney.last_accessedAt,
        total_access_count: userJourney.access_count || 0
      }
    };

  } catch (error) {
    console.error('❌ Error getting user membership journey:', error);
    throw new CustomError(`Failed to get membership journey: ${error.message}`, 500);
  }
};

/**
 * Validate application transition eligibility
 * Used by: preMemberApplicationController, membershipAdminControllers
 */
export const validateApplicationTransition = async (userId, fromStatus, toStatus, applicationType) => {
  try {
    const user = await getUserById(userId);
    
    // Define valid transitions based on application type
    const validTransitions = {
      'initial_application': {
        'pending': ['approved', 'declined', 'rejected'],
        'approved': [], // Cannot change approved applications
        'declined': ['pending'], // Can resubmit
        'rejected': ['pending'], // Can resubmit
        'withdrawn': ['pending'] // Can resubmit
      },
      'full_membership': {
        'pending': ['approved', 'declined', 'rejected'],
        'approved': [], // Cannot change approved applications
        'declined': ['pending'], // Can resubmit
        'rejected': ['pending'], // Can resubmit
        'withdrawn': ['pending'] // Can resubmit
      }
    };

    // Check if transition is valid
    const allowedTransitions = validTransitions[applicationType]?.[fromStatus];
    if (!allowedTransitions || !allowedTransitions.includes(toStatus)) {
      throw new CustomError(`Invalid transition: ${fromStatus} → ${toStatus} for ${applicationType}`, 400);
    }

    // Additional business logic checks
    if (applicationType === 'full_membership') {
      // Can only apply for full membership if pre-member
      if (user.membership_stage !== 'pre_member') {
        throw new CustomError('User must be pre-member to apply for full membership', 400);
      }
    }

    return {
      valid: true,
      user_current_stage: user.membership_stage,
      user_current_status: user.is_member
    };

  } catch (error) {
    console.error('❌ Error validating application transition:', error);
    throw error;
  }
};

// =============================================================================
// ANALYTICS SERVICES
// =============================================================================

/**
 * Get membership conversion metrics
 * Used by: membershipAdminControllers.getMembershipAnalytics
 */
export const getMembershipConversionMetrics = async (timeframe = '30d') => {
  try {
    let dateFilter = '';
    
    switch (timeframe) {
      case '7d':
        dateFilter = 'DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case '30d':
        dateFilter = 'DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case '90d':
        dateFilter = 'DATE_SUB(NOW(), INTERVAL 90 DAY)';
        break;
      case '1y':
        dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 YEAR)';
        break;
      default:
        dateFilter = 'DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    const [metrics] = await db.query(`
      SELECT 
        -- Registration to Application
        COUNT(DISTINCT u.id) as total_registered_users,
        COUNT(DISTINCT CASE WHEN sl.id IS NOT NULL THEN u.id END) as users_who_applied,
        ROUND(COUNT(DISTINCT CASE WHEN sl.id IS NOT NULL THEN u.id END) * 100.0 / COUNT(DISTINCT u.id), 2) as application_rate,
        
        -- Application to Pre-Member
        COUNT(DISTINCT CASE WHEN sl.approval_status = 'approved' AND sl.application_type = 'initial_application' THEN u.id END) as approved_pre_members,
        ROUND(COUNT(DISTINCT CASE WHEN sl.approval_status = 'approved' AND sl.application_type = 'initial_application' THEN u.id END) * 100.0 / COUNT(DISTINCT CASE WHEN sl.id IS NOT NULL THEN u.id END), 2) as approval_rate,
        
        -- Pre-Member to Full Member Application
        COUNT(DISTINCT CASE WHEN full_sl.id IS NOT NULL THEN u.id END) as pre_members_who_applied_full,
        ROUND(COUNT(DISTINCT CASE WHEN full_sl.id IS NOT NULL THEN u.id END) * 100.0 / COUNT(DISTINCT CASE WHEN sl.approval_status = 'approved' AND sl.application_type = 'initial_application' THEN u.id END), 2) as full_application_rate,
        
        -- Full Member Approval
        COUNT(DISTINCT CASE WHEN full_sl.status = 'approved' THEN u.id END) as approved_full_members,
        ROUND(COUNT(DISTINCT CASE WHEN full_sl.status = 'approved' THEN u.id END) * 100.0 / COUNT(DISTINCT CASE WHEN full_sl.id IS NOT NULL THEN u.id END), 2) as full_approval_rate,
        
        -- Overall Conversion
        ROUND(COUNT(DISTINCT CASE WHEN full_sl.status = 'approved' THEN u.id END) * 100.0 / COUNT(DISTINCT u.id), 2) as overall_conversion_rate
        
      FROM users u
      LEFT JOIN surveylog sl ON u.id = CAST(sl.user_id AS UNSIGNED) 
        AND sl.application_type = 'initial_application'
      LEFT JOIN full_membership_applications full_sl ON u.id = full_sl.user_id
      WHERE u.createdAt >= ${dateFilter}
        AND (u.role = 'user' OR u.role IS NULL)
    `);

    return {
      timeframe,
      metrics: metrics[0],
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error getting conversion metrics:', error);
    throw new CustomError(`Failed to get conversion metrics: ${error.message}`, 500);
  }
};

/**
 * Get application processing performance metrics
 * Used by: membershipAdminControllers
 */
export const getApplicationProcessingMetrics = async () => {
  try {
    const [processingMetrics] = await db.query(`
      SELECT 
        application_type,
        approval_status,
        COUNT(*) as total_applications,
        AVG(DATEDIFF(COALESCE(reviewedAt, NOW()), createdAt)) as avg_processing_time_days,
        MIN(DATEDIFF(reviewedAt, createdAt)) as min_processing_time_days,
        MAX(DATEDIFF(reviewedAt, createdAt)) as max_processing_time_days,
        COUNT(CASE WHEN reviewedAt IS NULL THEN 1 END) as pending_count,
        COUNT(CASE WHEN DATEDIFF(NOW(), createdAt) > 7 AND reviewedAt IS NULL THEN 1 END) as overdue_count
      FROM surveylog
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY application_type, approval_status
      ORDER BY application_type, approval_status
    `);

    // Get daily processing volume for the last 30 days
    const [dailyVolume] = await db.query(`
      SELECT 
        DATE(createdAt) as date,
        application_type,
        COUNT(*) as submitted_count,
        COUNT(CASE WHEN reviewedAt IS NOT NULL THEN 1 END) as processed_count
      FROM surveylog
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(createdAt), application_type
      ORDER BY date DESC, application_type
    `);

    return {
      processing_metrics: processingMetrics,
      daily_volume: dailyVolume,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error getting processing metrics:', error);
    throw new CustomError(`Failed to get processing metrics: ${error.message}`, 500);
  }
};

// =============================================================================
// DATA VALIDATION SERVICES
// =============================================================================

/**
 * Validate application data structure
 * Used by: preMemberApplicationController.submitInitialApplication
 */
export const validateApplicationData = (answers, applicationType = 'initial_application') => {
  try {
    if (!answers || !Array.isArray(answers)) {
      throw new CustomError('Answers must be an array', 400);
    }

    if (answers.length === 0) {
      throw new CustomError('At least one answer is required', 400);
    }

    // Define required fields based on application type
    const requiredFields = {
      'initial_application': ['question', 'answer'],
      'full_membership': ['question', 'answer']
    };

    const required = requiredFields[applicationType] || requiredFields['initial_application'];

    // Validate each answer object
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      
      if (!answer || typeof answer !== 'object') {
        throw new CustomError(`Answer ${i + 1} must be an object`, 400);
      }

      for (const field of required) {
        if (!answer[field] || (typeof answer[field] === 'string' && answer[field].trim() === '')) {
          throw new CustomError(`Answer ${i + 1} is missing required field: ${field}`, 400);
        }
      }
    }

    return {
      valid: true,
      total_answers: answers.length,
      validatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error validating application data:', error);
    throw error;
  }
};

/**
 * Validate user eligibility for specific actions
 * Used by: Various controllers for permission checking
 */
export const validateUserEligibility = async (userId, action) => {
  try {
    const user = await getUserById(userId);
    
    const eligibilityRules = {
      'submit_initial_application': {
        allowed_stages: ['none', 'applicant'],
        allowed_statuses: ['pending', 'rejected'],
        description: 'Can submit initial application'
      },
      'submit_full_membership': {
        allowed_stages: ['pre_member'],
        allowed_statuses: ['pre_member'],
        description: 'Can submit full membership application'
      },
      'access_towncrier': {
        allowed_stages: ['pre_member', 'member'],
        allowed_statuses: ['pre_member', 'member'],
        description: 'Can access Towncrier content'
      },
      'access_iko': {
        allowed_stages: ['member'],
        allowed_statuses: ['member'],
        description: 'Can access Iko full member content'
      },
      'admin_functions': {
        allowed_roles: ['admin', 'super_admin'],
        description: 'Can perform admin functions'
      }
    };

    const rule = eligibilityRules[action];
    if (!rule) {
      throw new CustomError(`Unknown action: ${action}`, 400);
    }

    let isEligible = false;
    let reason = '';

    // Check role-based eligibility
    if (rule.allowed_roles) {
      isEligible = rule.allowed_roles.includes(user.role);
      reason = isEligible ? 'Authorized by role' : `Role ${user.role} not authorized`;
    } 
    // Check stage/status-based eligibility
    else {
      const stageMatch = rule.allowed_stages?.includes(user.membership_stage);
      const statusMatch = rule.allowed_statuses?.includes(user.is_member);
      
      isEligible = stageMatch && statusMatch;
      reason = isEligible ? 
        'Meets membership requirements' : 
        `Current stage: ${user.membership_stage}, status: ${user.is_member}`;
    }

    return {
      eligible: isEligible,
      reason,
      user_stage: user.membership_stage,
      user_status: user.is_member,
      user_role: user.role,
      action_description: rule.description
    };

  } catch (error) {
    console.error('❌ Error validating user eligibility:', error);
    throw error;
  }
};

// =============================================================================
// NOTIFICATION SERVICES
// =============================================================================

/**
 * Queue notification for processing
 * Used by: membershipAdminControllers notification functions
 */
export const queueNotification = async (notificationData) => {
  try {
    const {
      recipients,
      subject,
      message,
      type = 'email',
      priority = 'normal',
      scheduledFor = null,
      createdBy
    } = notificationData;

    // Insert notification into queue
    const [result] = await db.query(`
      INSERT INTO notification_queue (
        recipients,
        subject,
        message,
        type,
        priority,
        scheduled_for,
        created_by,
        status,
        createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', NOW())
    `, [
      JSON.stringify(recipients),
      subject,
      message,
      type,
      priority,
      scheduledFor,
      createdBy
    ]);

    return {
      notification_id: result.insertId,
      queuedAt: new Date().toISOString(),
      status: 'queued'
    };

  } catch (error) {
    console.error('❌ Error queuing notification:', error);
    throw new CustomError(`Failed to queue notification: ${error.message}`, 500);
  }
};

// =============================================================================
// DASHBOARD SERVICES
// =============================================================================

/**
 * Get membership statistics for dashboard widgets
 * Used by: membershipAdminControllers.getMembershipOverview
 */
export const getMembershipDashboardStats = async () => {
  try {
    const [dashboardStats] = await db.query(`
      SELECT 
        -- User counts by stage
        COUNT(CASE WHEN u.membership_stage = 'none' OR u.membership_stage IS NULL THEN 1 END) as new_registrations,
        COUNT(CASE WHEN u.membership_stage = 'applicant' THEN 1 END) as applicants,
        COUNT(CASE WHEN u.membership_stage = 'pre_member' THEN 1 END) as pre_members,
        COUNT(CASE WHEN u.membership_stage = 'member' THEN 1 END) as full_members,
        
        -- Application counts
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending' AND application_type = 'initial_application') as pending_initial,
        (SELECT COUNT(*) FROM full_membership_applications WHERE status = 'pending') as pending_full,
        
        -- Growth metrics
        COUNT(CASE WHEN u.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_month,
        COUNT(CASE WHEN u.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_users_week,
        
        -- Conversion rates
        ROUND(COUNT(CASE WHEN u.membership_stage = 'pre_member' THEN 1 END) * 100.0 / COUNT(*), 2) as pre_member_conversion_rate,
        ROUND(COUNT(CASE WHEN u.membership_stage = 'member' THEN 1 END) * 100.0 / COUNT(*), 2) as full_member_conversion_rate
        
      FROM users u
      WHERE u.role = 'user' OR u.role IS NULL
    `);

    // Get recent activity for quick overview
    const [recentActivity] = await db.query(`
      SELECT 
        'application' as activity_type,
        sl.application_type,
        sl.approval_status,
        u.username,
        sl.createdAt as activity_date
      FROM surveylog sl
      JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
      WHERE sl.createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY sl.createdAt DESC
      LIMIT 10
    `);

    return {
      dashboard_stats: dashboardStats[0],
      recent_activity: recentActivity,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error getting dashboard stats:', error);
    throw new CustomError(`Failed to get dashboard stats: ${error.message}`, 500);
  }
};

// =============================================================================
// TRANSACTION HELPERS
// =============================================================================

/**
 * Update application status with proper transaction handling
 */
export const updateApplicationStatusSafely = async (applicationId, status, reviewerId, adminNotes = null) => {
  let connection = null;
  
  try {
    // Validate status
    const validStatuses = ['approved', 'declined', 'pending', 'under_review'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update the application
      await connection.query(`
        UPDATE surveylog 
        SET 
          approval_status = ?,
          reviewedAt = NOW(),
          reviewed_by = ?,
          admin_notes = ?,
          updatedAt = NOW()
        WHERE id = ?
      `, [status, reviewerId, adminNotes, applicationId]);
      
      // Log the action
      await connection.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'application_status_updated', ?, NOW())
      `, [reviewerId, JSON.stringify({
        applicationId,
        newStatus: status,
        adminNotes,
        timestamp: new Date().toISOString()
      })]);
      
      await connection.commit();
      
      return {
        success: true,
        applicationId,
        newStatus: status,
        reviewedBy: reviewerId,
        reviewedAt: new Date().toISOString()
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error in updateApplicationStatusSafely:', error);
    throw new Error(`Failed to update application status: ${error.message}`);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Bulk operations helper
 */
export const bulkUpdateApplications = async (applicationIds, status, reviewerId, adminNotes = null) => {
  let connection = null;
  
  try {
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      throw new Error('Application IDs must be a non-empty array');
    }
    
    if (applicationIds.length > 100) {
      throw new Error('Cannot process more than 100 applications at once');
    }
    
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    const results = [];
    
    try {
      for (const appId of applicationIds) {
        await connection.query(`
          UPDATE surveylog 
          SET 
            approval_status = ?,
            reviewedAt = NOW(),
            reviewed_by = ?,
            admin_notes = ?,
            updatedAt = NOW()
          WHERE id = ?
        `, [status, reviewerId, adminNotes, appId]);
        
        results.push({ applicationId: appId, status, reviewerId });
      }
      
      // Log bulk operation
      await connection.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'bulk_application_update', ?, NOW())
      `, [reviewerId, JSON.stringify({
        applicationIds,
        newStatus: status,
        adminNotes,
        count: applicationIds.length,
        timestamp: new Date().toISOString()
      })]);
      
      await connection.commit();
      
      return {
        success: true,
        processedCount: results.length,
        results
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error in bulkUpdateApplications:', error);
    throw new Error(`Failed to bulk update applications: ${error.message}`);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// =============================================================================
// CACHE SERVICES
// =============================================================================

/**
 * Simple in-memory cache for frequently accessed data
 */
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

export const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

export const clearCache = (pattern = null) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

// =============================================================================
// USER STATISTICS SERVICES
// =============================================================================

/**
 * Get user statistics for dashboard
 */
export const getUserStatistics = async (userId) => {
  try {
    const [userStats] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.membership_stage,
        u.is_member,
        u.role,
        u.createdAt,
        COUNT(sl.id) as total_applications,
        COUNT(CASE WHEN sl.approval_status = 'approved' THEN 1 END) as approved_applications,
        COUNT(CASE WHEN sl.approval_status = 'pending' THEN 1 END) as pending_applications,
        fma.access_count,
        fma.first_accessedAt,
        fma.last_accessedAt
      FROM users u
      LEFT JOIN surveylog sl ON u.id = sl.user_id
      LEFT JOIN full_membership_access fma ON u.id = fma.user_id
      WHERE u.id = ?
      GROUP BY u.id, fma.access_count, fma.first_accessedAt, fma.last_accessedAt
    `, [userId]);
    
    return userStats[0] || null;
  } catch (error) {
    console.error('❌ Error in getUserStatistics:', error);
    throw new Error(`Failed to fetch user statistics: ${error.message}`);
  }
};


export const getMembershipAnalytics = async (period = '30d') => {
  try {
    let days = 30;
    switch (period) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case '1y': days = 365; break;
    }

    const [analytics] = await db.query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN u.id END) as new_users_period,
        COUNT(CASE WHEN u.membership_stage = 'pre_member' THEN 1 END) as pre_members,
        COUNT(CASE WHEN u.membership_stage = 'member' THEN 1 END) as full_members,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_applications,
        (SELECT AVG(DATEDIFF(reviewedAt, createdAt)) FROM surveylog WHERE reviewedAt IS NOT NULL AND reviewedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)) as avg_processing_time
      FROM users u
      WHERE u.role = 'user' OR u.role IS NULL
    `, [days, days]);

    const [conversionRates] = await db.query(`
      SELECT 
        ROUND(COUNT(CASE WHEN u.membership_stage = 'pre_member' THEN 1 END) * 100.0 / COUNT(*), 2) as pre_member_rate,
        ROUND(COUNT(CASE WHEN u.membership_stage = 'member' THEN 1 END) * 100.0 / COUNT(*), 2) as full_member_rate
      FROM users u
      WHERE u.role = 'user' OR u.role IS NULL
    `);

    return {
      period,
      user_metrics: analytics[0],
      conversion_rates: conversionRates[0],
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    throw new CustomError(`Failed to generate analytics: ${error.message}`, 500);
  }
};



export const membershipService = {
  getPendingApplicationsWithPagination,
  getAllReportsForAdmin,
  validateApplicationTransition,
  validateApplicationData,
  updateApplicationStatusSafely,
  bulkUpdateApplications,
  getUserMembershipJourney,
  getUserStatistics,
  validateUserEligibility,
  getMembershipConversionMetrics,
  getApplicationProcessingMetrics,
  getMembershipDashboardStats,
  getMembershipAnalytics, // Add this new function
  queueNotification,
  getCachedData,
  setCachedData,
  clearCache
};

// =============================================================================
// EXPORT ALL SERVICES
// =============================================================================

export default {
  // Application Services
  getPendingApplicationsWithPagination,
  getAllReportsForAdmin,
  validateApplicationTransition,
  validateApplicationData,
  updateApplicationStatusSafely,
  bulkUpdateApplications,
  
  // User Services
  getUserMembershipJourney,
  getUserStatistics,
  validateUserEligibility,
  
  // Analytics Services
  getMembershipConversionMetrics,
  getApplicationProcessingMetrics,
  getMembershipDashboardStats,
  
  // Notification Services
  queueNotification,
  
  // Cache Services
  getCachedData,
  setCachedData,
  clearCache
};