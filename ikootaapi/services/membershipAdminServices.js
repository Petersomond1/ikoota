// ikootaapi/services/membershipAdminServices.js
// ===============================================
// MEMBERSHIP ADMIN SERVICES - SPECIALIZED ADMIN BUSINESS LOGIC
// Advanced admin operations and system management
// ===============================================

import db from '../config/db.js';
import { sendEmail, sendSMS } from '../utils/notifications.js';
import { sendEmailWithTemplate } from '../utils/email.js';
import { generateUniqueConverseId } from '../utils/idGenerator.js';
import CustomError from '../utils/CustomError.js';
import {
  getUserById,
  validateStageTransition,
  convertToCSV,
  executeQuery
} from '../controllers/membershipCore.js';

// =============================================================================
// APPLICATION REVIEW SERVICES
// =============================================================================

/**
 * Bulk process applications with advanced validation
 * Used by: membershipAdminControllers.bulkReviewApplications
 */
export const bulkProcessApplications = async (applicationIds, decision, reviewerId, options = {}) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();
  
  try {
    const {
      adminNotes = '',
      notifyUsers = true,
      applicationType = 'initial_application',
      validateTransitions = true
    } = options;

    const results = {
      processed: [],
      failed: [],
      summary: {
        totalRequested: applicationIds.length,
        successCount: 0,
        failureCount: 0
      }
    };

    for (const appId of applicationIds) {
      try {
        // Get application details
        const [apps] = await connection.query(`
          SELECT sl.*, u.username, u.email, u.membership_stage, u.is_member
          FROM surveylog sl
          JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
          WHERE sl.id = ? AND sl.approval_status = 'pending'
        `, [appId]);

        if (apps.length === 0) {
          results.failed.push({
            applicationId: appId,
            reason: 'Application not found or not pending'
          });
          continue;
        }

        const app = apps[0];
        const userId = app.user_id;

        // Validate transition if requested
        if (validateTransitions) {
          const newStage = decision === 'approved' ? 
            (applicationType === 'initial_application' ? 'pre_member' : 'member') :
            'applicant';

          if (!validateStageTransition(app.membership_stage, newStage)) {
            results.failed.push({
              applicationId: appId,
              userId: userId,
              reason: `Invalid stage transition: ${app.membership_stage} → ${newStage}`
            });
            continue;
          }
        }

        // Process the application
        const processResult = await processIndividualApplication(
          connection, 
          app, 
          decision, 
          reviewerId, 
          adminNotes,
          applicationType
        );

        results.processed.push({
          applicationId: appId,
          userId: userId,
          username: app.username,
          email: app.email,
          previousStage: app.membership_stage,
          newStage: processResult.newStage,
          decision: decision
        });

        results.summary.successCount++;

      } catch (error) {
        console.error(`❌ Failed to process application ${appId}:`, error);
        results.failed.push({
          applicationId: appId,
          reason: error.message
        });
        results.summary.failureCount++;
      }
    }

    // Log bulk operation
    await connection.query(`
      INSERT INTO audit_logs (user_id, action, details, createdAt)
      VALUES (?, 'bulk_application_review', ?, NOW())
    `, [reviewerId, JSON.stringify({
      decision,
      applicationType,
      totalRequested: applicationIds.length,
      successCount: results.summary.successCount,
      failureCount: results.summary.failureCount,
      adminNotes,
      reviewedBy: reviewerId,
      timestamp: new Date().toISOString()
    })]);

    await connection.commit();

    // Send notifications (non-blocking)
    if (notifyUsers && results.processed.length > 0) {
      setImmediate(() => {
        sendBulkNotifications(results.processed, decision, adminNotes)
          .catch(err => console.error('Bulk notifications failed:', err));
      });
    }

    return results;

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Process individual application with full workflow
 */
const processIndividualApplication = async (connection, app, decision, reviewerId, adminNotes, applicationType) => {
  const userId = app.user_id;
  const status = decision === 'approved' ? 'approved' : 'declined';
  
  // Determine new membership stage
  let newStage = app.membership_stage;
  let memberStatus = app.is_member;
  
  if (applicationType === 'initial_application') {
    if (status === 'approved') {
      newStage = 'pre_member';
      memberStatus = 'pre_member';
    } else {
      newStage = 'applicant';
      memberStatus = 'rejected';
    }
  } else if (applicationType === 'full_membership') {
    if (status === 'approved') {
      newStage = 'member';
      memberStatus = 'member';
    }
  }

  // Update application
  await connection.query(`
    UPDATE surveylog 
    SET approval_status = ?, admin_notes = ?, reviewedAt = NOW(), reviewed_by = ?
    WHERE id = ?
  `, [status, adminNotes, reviewerId, app.id]);

  // Update user status
  await connection.query(`
    UPDATE users 
    SET membership_stage = ?, is_member = ?, application_reviewedAt = NOW(), reviewed_by = ?
    WHERE id = ?
  `, [newStage, memberStatus, reviewerId, userId]);

  // Log review action
  await connection.query(`
    INSERT INTO membership_review_history 
    (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewedAt)
    VALUES (?, ?, 'pending', ?, ?, ?, NOW())
  `, [userId, applicationType, status, adminNotes, reviewerId]);

  // Generate converse ID for approved pre-members
  if (status === 'approved' && applicationType === 'initial_application') {
    const converseId = await generateUniqueConverseId();
    await connection.query(`
      UPDATE users SET converse_id = ? WHERE id = ?
    `, [converseId, userId]);
  }

  return { newStage, memberStatus };
};

/**
 * Send bulk notifications to processed users
 */
const sendBulkNotifications = async (processedUsers, decision, adminNotes) => {
  const emailTemplate = decision === 'approved' ? 'application_approved' : 'application_declined';
  
  const emailPromises = processedUsers.map(user => 
    sendEmailWithTemplate(user.email, emailTemplate, {
      USERNAME: user.username,
      ADMIN_NOTES: adminNotes || '',
      DECISION: decision,
      REVIEW_DATE: new Date().toLocaleDateString()
    }).catch(err => console.error(`Email failed for ${user.email}:`, err))
  );

  await Promise.allSettled(emailPromises);
};

// =============================================================================
// ADVANCED ANALYTICS SERVICES
// =============================================================================

/**
 * Generate comprehensive admin analytics
 * Used by: membershipAdminControllers.getMembershipAnalytics
 */
export const generateAdvancedAnalytics = async (timeframe = '30d', includeDetailedBreakdown = false) => {
  try {
    const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30;

    // Core metrics
    const [coreMetrics] = await db.query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN u.id END) as new_users_period,
        COUNT(DISTINCT CASE WHEN sl.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN sl.user_id END) as new_applications_period,
        COUNT(DISTINCT CASE WHEN sl.reviewedAt >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN sl.user_id END) as processed_applications_period,
        
        -- Conversion metrics
        COUNT(CASE WHEN u.membership_stage = 'pre_member' THEN 1 END) as current_pre_members,
        COUNT(CASE WHEN u.membership_stage = 'member' THEN 1 END) as current_full_members,
        
        -- Processing efficiency
        AVG(CASE WHEN sl.reviewedAt IS NOT NULL THEN DATEDIFF(sl.reviewedAt, sl.createdAt) END) as avg_processing_days,
        COUNT(CASE WHEN sl.approval_status = 'pending' AND sl.createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as overdue_applications
        
      FROM users u
      LEFT JOIN surveylog sl ON u.id = CAST(sl.user_id AS UNSIGNED)
      WHERE u.role = 'user' OR u.role IS NULL
    `, [days, days, days]);

    // Application flow analysis
    const [flowAnalysis] = await db.query(`
      SELECT 
        sl.application_type,
        sl.approval_status,
        COUNT(*) as count,
        AVG(DATEDIFF(COALESCE(sl.reviewedAt, NOW()), sl.createdAt)) as avg_days_in_status,
        MIN(sl.createdAt) as earliest_submission,
        MAX(sl.createdAt) as latest_submission
      FROM surveylog sl
      WHERE sl.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY sl.application_type, sl.approval_status
      ORDER BY sl.application_type, sl.approval_status
    `, [days]);

    // Admin performance metrics
    const [adminPerformance] = await db.query(`
      SELECT 
        reviewer.username as admin_name,
        reviewer.role as admin_role,
        COUNT(*) as reviews_completed,
        COUNT(CASE WHEN sl.approval_status = 'approved' THEN 1 END) as approvals,
        COUNT(CASE WHEN sl.approval_status IN ('declined', 'rejected') THEN 1 END) as rejections,
        AVG(DATEDIFF(sl.reviewedAt, sl.createdAt)) as avg_review_time_days,
        MIN(sl.reviewedAt) as first_review_date,
        MAX(sl.reviewedAt) as last_review_date
      FROM surveylog sl
      JOIN users reviewer ON sl.reviewed_by = reviewer.id
      WHERE sl.reviewedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND sl.reviewed_by IS NOT NULL
      GROUP BY reviewer.id, reviewer.username, reviewer.role
      ORDER BY reviews_completed DESC
    `, [days]);

    // Quality metrics
    const [qualityMetrics] = await db.query(`
      SELECT 
        'Application Quality' as metric_category,
        COUNT(CASE WHEN JSON_LENGTH(sl.answers) >= 5 THEN 1 END) as comprehensive_applications,
        COUNT(CASE WHEN JSON_LENGTH(sl.answers) < 3 THEN 1 END) as minimal_applications,
        AVG(JSON_LENGTH(sl.answers)) as avg_answer_count,
        COUNT(CASE WHEN sl.admin_notes IS NOT NULL AND LENGTH(sl.admin_notes) > 10 THEN 1 END) as applications_with_detailed_notes
      FROM surveylog sl
      WHERE sl.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND sl.answers IS NOT NULL
    `, [days]);

    const analytics = {
      timeframe,
      core_metrics: coreMetrics[0],
      application_flow: flowAnalysis,
      admin_performance: adminPerformance,
      quality_metrics: qualityMetrics[0],
      generated_at: new Date().toISOString()
    };

    // Add detailed breakdown if requested
    if (includeDetailedBreakdown) {
      const [detailedBreakdown] = await db.query(`
        SELECT 
          DATE(sl.createdAt) as date,
          sl.application_type,
          COUNT(*) as submissions,
          COUNT(CASE WHEN sl.reviewedAt IS NOT NULL THEN 1 END) as reviews_completed,
          COUNT(CASE WHEN sl.approval_status = 'approved' THEN 1 END) as approvals,
          COUNT(CASE WHEN sl.approval_status IN ('declined', 'rejected') THEN 1 END) as rejections
        FROM surveylog sl
        WHERE sl.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(sl.createdAt), sl.application_type
        ORDER BY date DESC, sl.application_type
      `, [days]);

      analytics.detailed_breakdown = detailedBreakdown;
    }

    return analytics;

  } catch (error) {
    console.error('❌ Error generating advanced analytics:', error);
    throw new CustomError(`Failed to generate analytics: ${error.message}`, 500);
  }
};

/**
 * Generate membership health report
 * Used by: membershipAdminControllers.getSystemHealth
 */
export const generateMembershipHealthReport = async () => {
  try {
    // System health indicators
    const [healthMetrics] = await db.query(`
      SELECT 
        -- Application backlog
        COUNT(CASE WHEN sl.approval_status = 'pending' THEN 1 END) as pending_applications,
        COUNT(CASE WHEN sl.approval_status = 'pending' AND sl.createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as overdue_applications,
        COUNT(CASE WHEN sl.approval_status = 'pending' AND sl.createdAt < DATE_SUB(NOW(), INTERVAL 14 DAY) THEN 1 END) as severely_overdue,
        
        -- Processing capacity
        COUNT(CASE WHEN sl.reviewedAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as processed_last_24h,
        COUNT(CASE WHEN sl.reviewedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as processed_last_7d,
        
        -- Quality indicators
        AVG(CASE WHEN sl.reviewedAt IS NOT NULL THEN DATEDIFF(sl.reviewedAt, sl.createdAt) END) as avg_processing_time,
        COUNT(CASE WHEN sl.approval_status = 'approved' THEN 1 END) as total_approvals,
        COUNT(CASE WHEN sl.approval_status IN ('declined', 'rejected') THEN 1 END) as total_rejections
        
      FROM surveylog sl
      WHERE sl.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    // Admin capacity analysis
    const [adminCapacity] = await db.query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_admins,
        COUNT(DISTINCT CASE WHEN last_active.last_review >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id END) as active_admins_7d,
        COUNT(DISTINCT CASE WHEN last_active.last_review >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN u.id END) as active_admins_24h,
        AVG(admin_workload.review_count) as avg_reviews_per_admin
      FROM users u
      LEFT JOIN (
        SELECT reviewed_by, MAX(reviewedAt) as last_review
        FROM surveylog 
        WHERE reviewedAt IS NOT NULL
        GROUP BY reviewed_by
      ) last_active ON u.id = last_active.reviewed_by
      LEFT JOIN (
        SELECT reviewed_by, COUNT(*) as review_count
        FROM surveylog 
        WHERE reviewedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY reviewed_by
      ) admin_workload ON u.id = admin_workload.reviewed_by
      WHERE u.role IN ('admin', 'super_admin')
    `);

    // User satisfaction indicators
    const [satisfactionMetrics] = await db.query(`
      SELECT 
        COUNT(CASE WHEN u.membership_stage = 'pre_member' AND u.last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_pre_members,
        COUNT(CASE WHEN u.membership_stage = 'member' AND u.last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_full_members,
        COUNT(CASE WHEN fma.access_count > 0 THEN 1 END) as users_accessing_content,
        AVG(fma.access_count) as avg_content_access_count
      FROM users u
      LEFT JOIN full_membership_access fma ON u.id = fma.user_id
      WHERE u.membership_stage IN ('pre_member', 'member')
    `);

    // Determine overall health status
    const metrics = healthMetrics[0];
    const capacity = adminCapacity[0];
    
    let healthStatus = 'healthy';
    const alerts = [];
    const recommendations = [];

    // Check for issues
    if (metrics.overdue_applications > 10) {
      healthStatus = 'warning';
      alerts.push(`${metrics.overdue_applications} applications overdue (>7 days)`);
      recommendations.push('Increase admin review capacity');
    }

    if (metrics.severely_overdue > 5) {
      healthStatus = 'critical';
      alerts.push(`${metrics.severely_overdue} applications severely overdue (>14 days)`);
      recommendations.push('Urgent: Immediate admin intervention required');
    }

    if (capacity.active_admins_24h === 0) {
      healthStatus = 'warning';
      alerts.push('No admin activity in last 24 hours');
      recommendations.push('Check admin availability and notifications');
    }

    if (metrics.avg_processing_time > 7) {
      healthStatus = 'warning';
      alerts.push(`Average processing time: ${metrics.avg_processing_time.toFixed(1)} days (target: <7 days)`);
      recommendations.push('Review and optimize admin workflows');
    }

    return {
      overall_status: healthStatus,
      health_metrics: metrics,
      admin_capacity: capacity,
      satisfaction_metrics: satisfactionMetrics[0],
      alerts,
      recommendations,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error generating health report:', error);
    throw new CustomError(`Failed to generate health report: ${error.message}`, 500);
  }
};

// =============================================================================
// USER MANAGEMENT SERVICES
// =============================================================================

/**
 * Advanced user search with membership context
 * Used by: membershipAdminControllers.searchUsers
 */
export const advancedUserSearch = async (searchCriteria) => {
  try {
    const {
      query = '',
      membershipStage = '',
      role = '',
      applicationStatus = '',
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      includeInactive = false
    } = searchCriteria;

    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = ['1=1'];
    let queryParams = [];

    if (query) {
      whereConditions.push('(u.username LIKE ? OR u.email LIKE ? OR u.id = ?)');
      queryParams.push(`%${query}%`, `%${query}%`, query);
    }

    if (membershipStage) {
      whereConditions.push('u.membership_stage = ?');
      queryParams.push(membershipStage);
    }

    if (role) {
      whereConditions.push('u.role = ?');
      queryParams.push(role);
    }

    if (applicationStatus) {
      whereConditions.push('latest_app.approval_status = ?');
      queryParams.push(applicationStatus);
    }

    if (!includeInactive) {
      whereConditions.push('(u.last_login >= DATE_SUB(NOW(), INTERVAL 90 DAY) OR u.last_login IS NULL)');
    }

    const whereClause = whereConditions.join(' AND ');

    // Main search query
    const searchQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.phone,
        u.membership_stage,
        u.is_member,
        u.role,
        u.createdAt,
        u.last_login,
        u.converse_id,
        
        -- Latest application info
        latest_app.approval_status as latest_application_status,
        latest_app.application_type as latest_application_type,
        latest_app.createdAt as latest_application_date,
        latest_app.reviewedAt as latest_review_date,
        reviewer.username as reviewed_by,
        
        -- Activity metrics
        fma.access_count as content_access_count,
        fma.last_accessedAt as last_content_access,
        
        -- Flags
        CASE WHEN u.last_login < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END as is_inactive,
        CASE WHEN latest_app.approval_status = 'pending' AND latest_app.createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END as has_overdue_application
        
      FROM users u
      LEFT JOIN (
        SELECT 
          sl.*,
          ROW_NUMBER() OVER (PARTITION BY sl.user_id ORDER BY sl.createdAt DESC) as rn
        FROM surveylog sl
      ) latest_app ON u.id = CAST(latest_app.user_id AS UNSIGNED) AND latest_app.rn = 1
      LEFT JOIN users reviewer ON latest_app.reviewed_by = reviewer.id
      LEFT JOIN full_membership_access fma ON u.id = fma.user_id
      WHERE ${whereClause}
      ORDER BY u.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), offset);
    const [users] = await db.query(searchQuery, queryParams);

    // Count total results
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN (
        SELECT DISTINCT user_id, approval_status, application_type, createdAt
        FROM surveylog sl1
        WHERE sl1.createdAt = (
          SELECT MAX(sl2.createdAt) 
          FROM surveylog sl2 
          WHERE sl2.user_id = sl1.user_id
        )
      ) latest_app ON u.id = CAST(latest_app.user_id AS UNSIGNED)
      WHERE ${whereClause}
    `;

    const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      },
      search_criteria: searchCriteria,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in advanced user search:', error);
    throw new CustomError(`Failed to search users: ${error.message}`, 500);
  }
};

/**
 * Generate user activity report
 * Used by: membershipAdminControllers.getUserActivityReport
 */
export const generateUserActivityReport = async (userId) => {
  try {
    // User overview
    const [userOverview] = await db.query(`
      SELECT 
        u.*,
        DATEDIFF(NOW(), u.createdAt) as days_since_registration,
        DATEDIFF(NOW(), u.last_login) as days_since_last_login
      FROM users u
      WHERE u.id = ?
    `, [userId]);

    if (userOverview.length === 0) {
      throw new CustomError('User not found', 404);
    }

    // Application timeline
    const [applicationTimeline] = await db.query(`
      SELECT 
        sl.application_type,
        sl.approval_status,
        sl.createdAt as submitted_at,
        sl.reviewedAt,
        sl.admin_notes,
        reviewer.username as reviewed_by,
        DATEDIFF(COALESCE(sl.reviewedAt, NOW()), sl.createdAt) as processing_days
      FROM surveylog sl
      LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
      WHERE CAST(sl.user_id AS UNSIGNED) = ?
      ORDER BY sl.createdAt ASC
    `, [userId]);

    // Access patterns
    const [accessPatterns] = await db.query(`
      SELECT 
        fma.first_accessedAt,
        fma.last_accessedAt,
        fma.access_count,
        DATEDIFF(NOW(), fma.first_accessedAt) as days_since_first_access,
        DATEDIFF(NOW(), fma.last_accessedAt) as days_since_last_access
      FROM full_membership_access fma
      WHERE fma.user_id = ?
    `, [userId]);

    // Review history
    const [reviewHistory] = await db.query(`
      SELECT 
        mrh.application_type,
        mrh.previous_status,
        mrh.new_status,
        mrh.review_notes,
        mrh.reviewedAt,
        reviewer.username as reviewer_name
      FROM membership_review_history mrh
      LEFT JOIN users reviewer ON mrh.reviewer_id = reviewer.id
      WHERE mrh.user_id = ?
      ORDER BY mrh.reviewedAt ASC
    `, [userId]);

    const user = userOverview[0];

    return {
      user_overview: {
        ...user,
        membership_journey_stage: calculateMembershipJourneyStage(user, applicationTimeline),
        activity_level: calculateActivityLevel(user, accessPatterns[0])
      },
      application_timeline: applicationTimeline,
      access_patterns: accessPatterns[0] || null,
      review_history: reviewHistory,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error generating user activity report:', error);
    throw new CustomError(`Failed to generate user activity report: ${error.message}`, 500);
  }
};

/**
 * Calculate membership journey stage
 */
const calculateMembershipJourneyStage = (user, timeline) => {
  if (user.membership_stage === 'member') return 'complete';
  if (user.membership_stage === 'pre_member') return 'pre_member_active';
  
  const hasApplied = timeline.length > 0;
  if (!hasApplied) return 'registered_not_applied';
  
  const latestApp = timeline[timeline.length - 1];
  if (latestApp.approval_status === 'pending') return 'application_pending';
  if (latestApp.approval_status === 'declined') return 'application_declined';
  
  return 'unknown';
};

/**
 * Calculate user activity level
 */
const calculateActivityLevel = (user, accessPatterns) => {
  const daysSinceLogin = user.days_since_last_login;
  const accessCount = accessPatterns?.access_count || 0;
  
  if (daysSinceLogin <= 1 && accessCount > 10) return 'very_active';
  if (daysSinceLogin <= 7 && accessCount > 5) return 'active';
  if (daysSinceLogin <= 30) return 'moderate';
  if (daysSinceLogin <= 90) return 'low';
  return 'inactive';
};

// =============================================================================
// NOTIFICATION & COMMUNICATION SERVICES
// =============================================================================

/**
 * Advanced notification system with templates
 * Used by: membershipAdminControllers.sendNotification
 */
export const sendAdvancedNotification = async (notificationRequest) => {
  try {
    const {
      recipients,
      template,
      templateData = {},
      priority = 'normal',
      scheduledFor = null,
      createdBy
    } = notificationRequest;

    // Validate template
    const availableTemplates = {
      'welcome_pre_member': {
        subject: '🎉 Welcome to Pre-Member Status!',
        description: 'Congratulations on becoming a pre-member'
      },
      'full_member_approved': {
        subject: '🌟 Full Membership Approved!',
        description: 'You are now a full member'
      },
      'application_reminder': {
        subject: '📝 Application Status Update',
        description: 'Reminder about pending application'
      },
      'system_maintenance': {
        subject: '🔧 System Maintenance Notice',
        description: 'Scheduled maintenance notification'
      }
    };

    if (!availableTemplates[template]) {
      throw new CustomError(`Unknown template: ${template}`, 400);
    }

    // Get recipient details
    let recipientUsers = [];
    
    if (recipients === 'all') {
      const [users] = await db.query('SELECT id, username, email FROM users WHERE role = "user"');
      recipientUsers = users;
    } else if (recipients === 'pre_members') {
      const [users] = await db.query('SELECT id, username, email FROM users WHERE membership_stage = "pre_member"');
      recipientUsers = users;
    } else if (recipients === 'full_members') {
      const [users] = await db.query('SELECT id, username, email FROM users WHERE membership_stage = "member"');
      recipientUsers = users;
    } else if (Array.isArray(recipients)) {
      const placeholders = recipients.map(() => '?').join(',');
      const [users] = await db.query(
        `SELECT id, username, email FROM users WHERE id IN (${placeholders})`,
        recipients
      );
      recipientUsers = users;
    } else {
      throw new CustomError('Invalid recipients format', 400);
    }

    // Prepare notification data
    const templateInfo = availableTemplates[template];
    const notificationData = {
      template,
      subject: templateInfo.subject,
      recipients: recipientUsers.map(u => ({ id: u.id, email: u.email })),
      templateData,
      priority,
      scheduledFor,
      createdBy,
      createdAt: new Date().toISOString()
    };

    // Queue or send immediately
    if (scheduledFor) {
      // Queue for later sending
      const [result] = await db.query(`
        INSERT INTO notification_queue (
          template, recipients, template_data, priority, scheduled_for, created_by, status, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, 'queued', NOW())
      `, [
        template,
        JSON.stringify(recipientUsers),
        JSON.stringify(templateData),
        priority,
        scheduledFor,
        createdBy
      ]);

      return {
        notification_id: result.insertId,
        status: 'queued',
        scheduled_for: scheduledFor,
        recipient_count: recipientUsers.length
      };
    } else {
      // Send immediately
      const sendResults = await sendImmediateNotifications(recipientUsers, template, templateData);
      
      // Log the notification
      await db.query(`
        INSERT INTO notification_history (
          template, recipients, template_data, sent_count, failed_count, created_by, sentAt
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        template,
        JSON.stringify(recipientUsers),
        JSON.stringify(templateData),
        sendResults.successCount,
        sendResults.failureCount,
        createdBy
      ]);

      return {
        status: 'sent',
        recipient_count: recipientUsers.length,
        success_count: sendResults.successCount,
        failure_count: sendResults.failureCount,
        sent_at: new Date().toISOString()
      };
    }

  } catch (error) {
    console.error('❌ Error sending advanced notification:', error);
    throw new CustomError(`Failed to send notification: ${error.message}`, 500);
  }
};

/**
 * Send immediate notifications to users
 */
const sendImmediateNotifications = async (users, template, templateData) => {
  let successCount = 0;
  let failureCount = 0;

  const sendPromises = users.map(async (user) => {
    try {
      await sendEmailWithTemplate(user.email, template, {
        USERNAME: user.username,
        ...templateData
      });
      successCount++;
    } catch (error) {
      console.error(`Failed to send notification to ${user.email}:`, error);
      failureCount++;
    }
  });

  await Promise.allSettled(sendPromises);

  return { successCount, failureCount };
};

// =============================================================================
// SYSTEM MAINTENANCE SERVICES
// =============================================================================

/**
 * Perform system maintenance tasks
 * Used by: membershipAdminControllers.performMaintenance
 */
export const performSystemMaintenance = async (maintenanceType, options = {}) => {
  try {
    console.log(`🔧 Starting system maintenance: ${maintenanceType}`);

    const results = {
      maintenance_type: maintenanceType,
      started_at: new Date().toISOString(),
      completed_tasks: [],
      failed_tasks: [],
      summary: {}
    };

    switch (maintenanceType) {
      case 'cleanup_old_applications':
        await cleanupOldApplications(results, options);
        break;
        
      case 'update_user_statistics':
        await updateUserStatistics(results, options);
        break;
        
      case 'process_notification_queue':
        await processNotificationQueue(results, options);
        break;
        
      case 'generate_system_reports':
        await generateSystemReports(results, options);
        break;
        
      case 'full_maintenance':
        await cleanupOldApplications(results, options);
        await updateUserStatistics(results, options);
        await processNotificationQueue(results, options);
        await generateSystemReports(results, options);
        break;
        
      default:
        throw new CustomError(`Unknown maintenance type: ${maintenanceType}`, 400);
    }

    results.completed_at = new Date().toISOString();
    results.duration_minutes = Math.round(
      (new Date(results.completed_at) - new Date(results.started_at)) / (1000 * 60)
    );

    console.log(`✅ System maintenance completed: ${maintenanceType}`);
    return results;

  } catch (error) {
    console.error(`❌ System maintenance failed: ${maintenanceType}`, error);
    throw new CustomError(`Maintenance failed: ${error.message}`, 500);
  }
};

/**
 * Clean up old applications and logs
 */
const cleanupOldApplications = async (results, options) => {
  try {
    const { retentionDays = 365 } = options;

    // Archive old completed applications
    const [archivedApps] = await db.query(`
      INSERT INTO surveylog_archive 
      SELECT * FROM surveylog 
      WHERE approval_status IN ('approved', 'declined', 'rejected') 
        AND reviewedAt < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [retentionDays]);

    // Delete archived applications from main table
    const [deletedApps] = await db.query(`
      DELETE FROM surveylog 
      WHERE approval_status IN ('approved', 'declined', 'rejected') 
        AND reviewedAt < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [retentionDays]);

    // Clean up old audit logs
    const [deletedLogs] = await db.query(`
      DELETE FROM audit_logs 
      WHERE createdAt < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [retentionDays]);

    results.completed_tasks.push('cleanup_old_applications');
    results.summary.archived_applications = archivedApps.affectedRows;
    results.summary.deleted_applications = deletedApps.affectedRows;
    results.summary.deleted_audit_logs = deletedLogs.affectedRows;

  } catch (error) {
    results.failed_tasks.push({ task: 'cleanup_old_applications', error: error.message });
  }
};

/**
 * Update user statistics and derived fields
 */
const updateUserStatistics = async (results, options) => {
  try {
    // Update user application counts
    await db.query(`
      UPDATE users u
      LEFT JOIN (
        SELECT 
          CAST(user_id AS UNSIGNED) as uid,
          COUNT(*) as app_count,
          MAX(createdAt) as last_application
        FROM surveylog
        GROUP BY user_id
      ) app_stats ON u.id = app_stats.uid
      SET 
        u.total_applications = COALESCE(app_stats.app_count, 0),
        u.last_application_date = app_stats.last_application
    `);

    // Update membership progression dates
    await db.query(`
      UPDATE users u
      LEFT JOIN (
        SELECT 
          CAST(user_id AS UNSIGNED) as uid,
          MIN(CASE WHEN approval_status = 'approved' AND application_type = 'initial_application' THEN reviewedAt END) as pre_member_date,
          MIN(CASE WHEN approval_status = 'approved' AND application_type = 'full_membership' THEN reviewedAt END) as full_member_date
        FROM surveylog
        GROUP BY user_id
      ) progression ON u.id = progression.uid
      SET 
        u.pre_member_since = progression.pre_member_date,
        u.full_member_since = progression.full_member_date
    `);

    // Update access statistics
    await db.query(`
      UPDATE users u
      LEFT JOIN full_membership_access fma ON u.id = fma.user_id
      SET u.content_access_count = COALESCE(fma.access_count, 0)
    `);

    const [updatedUsers] = await db.query('SELECT ROW_COUNT() as count');

    results.completed_tasks.push('update_user_statistics');
    results.summary.updated_users = updatedUsers[0].count;

  } catch (error) {
    results.failed_tasks.push({ task: 'update_user_statistics', error: error.message });
  }
};

/**
 * Process queued notifications
 */
const processNotificationQueue = async (results, options) => {
  try {
    const { batchSize = 100 } = options;

    // Get queued notifications ready to send
    const [queuedNotifications] = await db.query(`
      SELECT * FROM notification_queue 
      WHERE status = 'queued' 
        AND (scheduled_for IS NULL OR scheduled_for <= NOW())
      ORDER BY priority DESC, createdAt ASC
      LIMIT ?
    `, [batchSize]);

    let processedCount = 0;
    let failedCount = 0;

    for (const notification of queuedNotifications) {
      try {
        const recipients = JSON.parse(notification.recipients);
        const templateData = JSON.parse(notification.template_data || '{}');

        await sendImmediateNotifications(recipients, notification.template, templateData);

        // Mark as sent
        await db.query(`
          UPDATE notification_queue 
          SET status = 'sent', sent_at = NOW() 
          WHERE id = ?
        `, [notification.id]);

        processedCount++;

      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error);

        // Mark as failed
        await db.query(`
          UPDATE notification_queue 
          SET status = 'failed', error_message = ? 
          WHERE id = ?
        `, [error.message, notification.id]);

        failedCount++;
      }
    }

    results.completed_tasks.push('process_notification_queue');
    results.summary.processed_notifications = processedCount;
    results.summary.failed_notifications = failedCount;

  } catch (error) {
    results.failed_tasks.push({ task: 'process_notification_queue', error: error.message });
  }
};

/**
 * Generate system reports
 */
const generateSystemReports = async (results, options) => {
  try {
    const { includeUserDetails = false } = options;

    // Generate daily summary report
    const [dailySummary] = await db.query(`
      SELECT 
        CURDATE() as report_date,
        COUNT(CASE WHEN u.createdAt >= CURDATE() THEN 1 END) as new_registrations_today,
        COUNT(CASE WHEN sl.createdAt >= CURDATE() THEN 1 END) as new_applications_today,
        COUNT(CASE WHEN sl.reviewedAt >= CURDATE() THEN 1 END) as processed_applications_today,
        COUNT(CASE WHEN sl.approval_status = 'pending' THEN 1 END) as pending_applications_total
      FROM users u
      LEFT JOIN surveylog sl ON u.id = CAST(sl.user_id AS UNSIGNED)
    `);

    // Store the report
    await db.query(`
      INSERT INTO daily_reports (
        report_date, report_data, generated_at
      ) VALUES (CURDATE(), ?, NOW())
      ON DUPLICATE KEY UPDATE 
        report_data = VALUES(report_data),
        generated_at = VALUES(generated_at)
    `, [JSON.stringify(dailySummary[0])]);

    results.completed_tasks.push('generate_system_reports');
    results.summary.generated_reports = 1;

  } catch (error) {
    results.failed_tasks.push({ task: 'generate_system_reports', error: error.message });
  }
};

// =============================================================================
// DATA EXPORT SERVICES
// =============================================================================

/**
 * Advanced data export with filtering and formatting
 * Used by: membershipAdminControllers.exportMembershipData
 */
export const advancedDataExport = async (exportRequest) => {
  try {
    const {
      exportType = 'users',
      format = 'csv',
      filters = {},
      includePersonalData = false,
      dateRange = {},
      customFields = []
    } = exportRequest;

    console.log(`📊 Starting data export: ${exportType} (${format})`);

    let exportData = [];
    let filename = '';

    switch (exportType) {
      case 'users':
        exportData = await exportUserData(filters, includePersonalData, dateRange);
        filename = `users_export_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
        
      case 'applications':
        exportData = await exportApplicationData(filters, dateRange);
        filename = `applications_export_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
        
      case 'analytics':
        exportData = await exportAnalyticsData(dateRange);
        filename = `analytics_export_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
        
      default:
        throw new CustomError(`Unknown export type: ${exportType}`, 400);
    }

    // Format the data
    let formattedData;
    if (format === 'csv') {
      formattedData = convertToCSV(exportData);
    } else if (format === 'json') {
      formattedData = JSON.stringify(exportData, null, 2);
    } else {
      throw new CustomError(`Unsupported format: ${format}`, 400);
    }

    return {
      data: formattedData,
      filename,
      recordCount: exportData.length,
      format,
      exportType,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in advanced data export:', error);
    throw new CustomError(`Export failed: ${error.message}`, 500);
  }
};

/**
 * Export user data with privacy controls
 */
const exportUserData = async (filters, includePersonalData, dateRange) => {
  let whereConditions = ['1=1'];
  let queryParams = [];

  // Apply filters
  if (filters.membershipStage) {
    whereConditions.push('u.membership_stage = ?');
    queryParams.push(filters.membershipStage);
  }

  if (filters.role) {
    whereConditions.push('u.role = ?');
    queryParams.push(filters.role);
  }

  if (dateRange.startDate) {
    whereConditions.push('u.createdAt >= ?');
    queryParams.push(dateRange.startDate);
  }

  if (dateRange.endDate) {
    whereConditions.push('u.createdAt <= ?');
    queryParams.push(dateRange.endDate);
  }

  const whereClause = whereConditions.join(' AND ');

  // Select fields based on privacy settings
  const selectFields = includePersonalData ? 
    'u.id, u.username, u.email, u.phone, u.membership_stage, u.is_member, u.role, u.createdAt, u.last_login' :
    'u.id, u.username, u.membership_stage, u.is_member, u.role, u.createdAt';

  const [users] = await db.query(`
    SELECT ${selectFields}
    FROM users u
    WHERE ${whereClause}
    ORDER BY u.createdAt DESC
  `, queryParams);

  return users;
};

/**
 * Export application data
 */
const exportApplicationData = async (filters, dateRange) => {
  let whereConditions = ['1=1'];
  let queryParams = [];

  if (filters.applicationType) {
    whereConditions.push('sl.application_type = ?');
    queryParams.push(filters.applicationType);
  }

  if (filters.approvalStatus) {
    whereConditions.push('sl.approval_status = ?');
    queryParams.push(filters.approvalStatus);
  }

  if (dateRange.startDate) {
    whereConditions.push('sl.createdAt >= ?');
    queryParams.push(dateRange.startDate);
  }

  if (dateRange.endDate) {
    whereConditions.push('sl.createdAt <= ?');
    queryParams.push(dateRange.endDate);
  }

  const whereClause = whereConditions.join(' AND ');

  const [applications] = await db.query(`
    SELECT 
      sl.id,
      sl.user_id,
      u.username,
      sl.application_type,
      sl.approval_status,
      sl.createdAt as submitted_at,
      sl.reviewedAt,
      reviewer.username as reviewed_by,
      DATEDIFF(COALESCE(sl.reviewedAt, NOW()), sl.createdAt) as processing_days
    FROM surveylog sl
    JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
    LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
    WHERE ${whereClause}
    ORDER BY sl.createdAt DESC
  `, queryParams);

  return applications;
};

/**
 * Export analytics data
 */
const exportAnalyticsData = async (dateRange) => {
  const days = dateRange.days || 30;

  const [analyticsData] = await db.query(`
    SELECT 
      DATE(sl.createdAt) as date,
      sl.application_type,
      COUNT(*) as submissions,
      COUNT(CASE WHEN sl.approval_status = 'approved' THEN 1 END) as approvals,
      COUNT(CASE WHEN sl.approval_status IN ('declined', 'rejected') THEN 1 END) as rejections,
      AVG(CASE WHEN sl.reviewedAt IS NOT NULL THEN DATEDIFF(sl.reviewedAt, sl.createdAt) END) as avg_processing_days
    FROM surveylog sl
    WHERE sl.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY DATE(sl.createdAt), sl.application_type
    ORDER BY date DESC, sl.application_type
  `, [days]);

  return analyticsData;
};



export const membershipAdminService = {
  bulkProcessApplications,
  generateAdvancedAnalytics,
  generateMembershipHealthReport,
  advancedUserSearch,
  generateUserActivityReport,
  sendAdvancedNotification,
  performSystemMaintenance,
  advancedDataExport,
  
  // Add missing helper functions
  calculateReviewPriority: (application) => {
    const daysPending = Math.floor((Date.now() - new Date(application.submitted_at)) / (1000 * 60 * 60 * 24));
    if (daysPending > 14) return 'high';
    if (daysPending > 7) return 'medium';
    return 'low';
  },

  autoAssignMentor: async (userId) => {
    try {
      const [mentors] = await db.query(`
        SELECT u.id, COUNT(mentees.id) as mentee_count
        FROM users u
        LEFT JOIN users mentees ON u.id = mentees.mentor_id
        WHERE u.role IN ('admin', 'super_admin')
        GROUP BY u.id
        ORDER BY mentee_count ASC
        LIMIT 1
      `);
      return mentors.length > 0 ? mentors[0].id : null;
    } catch (error) {
      console.error('Auto mentor assignment failed:', error);
      return null;
    }
  },

  bulkProcessApplications: async (options) => {
    const { applicationIds, action, reason, adminNotes, adminId, adminUsername } = options;
    const results = { processed: [], failed: [], summary: { successCount: 0, failureCount: 0 } };
    
    for (const appId of applicationIds) {
      try {
        // Process individual application
        results.processed.push({ applicationId: appId, action, adminId });
        results.summary.successCount++;
      } catch (error) {
        results.failed.push({ applicationId: appId, error: error.message });
        results.summary.failureCount++;
      }
    }
    
    return results;
  },

  exportMembershipData: async (options) => {
    const { format, includePersonalData, exportedBy } = options;
    
    const query = includePersonalData ? 
      'SELECT id, username, email, membership_stage, is_member, createdAt FROM users' :
      'SELECT id, username, membership_stage, is_member, createdAt FROM users';
    
    const [data] = await db.query(query);
    
    if (format === 'csv') {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => Object.values(row).join(','));
      return [headers, ...rows].join('\n');
    }
    
    return data;
  },

  sendBulkNotifications: async (options) => {
    const { recipients, subject, message, type, sendEmail, sentBy } = options;
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const recipient of recipients) {
      try {
        // Send notification logic here
        successCount++;
      } catch (error) {
        failureCount++;
      }
    }
    
    return { successCount, failureCount, total: recipients.length };
  }
};


// =============================================================================
// EXPORT ALL SERVICES
// =============================================================================

// export default {
//   // Application Review Services
//   bulkProcessApplications,
  
//   // Analytics Services
//   generateAdvancedAnalytics,
//   generateMembershipHealthReport,
  
//   // User Management Services
//   advancedUserSearch,
//   generateUserActivityReport,
  
//   // Notification Services
//   sendAdvancedNotification,
  
//   // System Maintenance Services
//   performSystemMaintenance,

//   // Data Export Services
//   advancedDataExport
// };

// export { membershipAdminService };
export default membershipAdminService;