// ikootaapi/services/membershipAdminServices.js
// ===============================================
// MEMBERSHIP ADMIN SERVICES - FIXED DATABASE ISSUES
// All business logic, database operations, and complex processing
// ✅ CLEAN INDIVIDUAL EXPORTS ONLY (NO DUPLICATES)
// ===============================================

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { sendEmail } from '../utils/email.js';
import { generateUniqueConverseId } from '../utils/idGenerator.js';

// =============================================================================
// AUDIT LOGGING HELPER - SAFE WITH FALLBACK
// =============================================================================

const logAuditSafe = async (userId, action, details) => {
  try {
    await db.query(`
      INSERT INTO audit_logs (user_id, action, details, createdAt)
      VALUES (?, ?, ?, NOW())
    `, [userId, action, JSON.stringify(details)]);
  } catch (error) {
    console.warn('⚠️ Audit logging failed (non-critical):', error.message);
  }
};

// =============================================================================
// TEST & CONNECTIVITY SERVICES
// =============================================================================

/**
 * Test connectivity and return system info
 */
export const testConnectivity = async (user) => {
  try {
    // Test database connection
    await db.query('SELECT 1 as health_check');
    
    return {
      success: true,
      message: 'Admin membership services are operational!',
      timestamp: new Date().toISOString(),
      user: {
        id: user?.id,
        username: user?.username,
        role: user?.role
      },
      database: 'connected',
      availableEndpoints: [
        'GET /applications - Get applications with filtering',
        'GET /stats - Get application statistics',
        'GET /full-membership-stats - Get full membership statistics',
        'GET /analytics - Get comprehensive analytics',
        'GET /overview - Get membership overview',
        'PUT /applications/:id/review - Review application',
        'POST /applications/bulk-review - Bulk review applications'
      ]
    };
  } catch (error) {
    throw new CustomError(`Service connectivity test failed: ${error.message}`, 503);
  }
};

/**
 * Get comprehensive system health
 */
export const getSystemHealth = async () => {
  try {
    // Test database
    await db.query('SELECT 1 as health_check');
    
    // Get system metrics with safe queries
    const [metrics] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'user' OR role IS NULL) as total_users,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_applications,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending' AND createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY)) as overdue_applications,
        (SELECT COUNT(*) FROM users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_users_24h,
        (SELECT COALESCE(AVG(DATEDIFF(reviewedAt, createdAt)), 0) FROM surveylog WHERE reviewedAt IS NOT NULL AND reviewedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as avg_review_time_days
    `);
    
    const systemMetrics = metrics[0];
    
    // Determine health status
    let status = 'healthy';
    const alerts = [];
    
    if (systemMetrics.overdue_applications > 10) {
      status = 'warning';
      alerts.push(`${systemMetrics.overdue_applications} applications overdue`);
    }
    
    if (systemMetrics.avg_review_time_days > 7) {
      status = 'warning';
      alerts.push(`Average review time: ${systemMetrics.avg_review_time_days?.toFixed(1)} days`);
    }
    
    return {
      status,
      timestamp: new Date().toISOString(),
      database: 'connected',
      metrics: systemMetrics,
      alerts,
      recommendations: alerts.length > 0 ? [
        'Consider increasing review capacity',
        'Review admin availability'
      ] : ['System operating normally']
    };
  } catch (error) {
    throw new CustomError(`Health check failed: ${error.message}`, 503);
  }
};

// =============================================================================
// APPLICATION MANAGEMENT SERVICES - 🔧 SURGICALLY FIXED SQL QUERIES
// =============================================================================

/**
 * ✅ SURGICALLY FIXED: Get all applications with comprehensive filtering
 * FIXES APPLIED:
 * 1. Removed CAST(sl.user_id AS UNSIGNED) - both fields are INT
 * 2. Fixed LIMIT/OFFSET parameters using string interpolation
 * 3. Kept ALL existing functionality intact
 */
export const getAllApplications = async (filters) => {
  try {
    const { page, limit, status, type, search, sortBy, sortOrder, dateFrom, dateTo } = filters;
    const offset = (page - 1) * limit;
    
    // Build WHERE clause with proper parameter handling
    let whereConditions = ['1=1'];
    let queryParams = [];
    
    if (status !== 'all') {
      whereConditions.push('sl.approval_status = ?');
      queryParams.push(status);
    }
    
    if (type !== 'all') {
      whereConditions.push('sl.application_type = ?');
      queryParams.push(type);
    }
    
    if (search && search.trim()) {
      whereConditions.push('(u.username LIKE ? OR u.email LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (dateFrom) {
      whereConditions.push('sl.createdAt >= ?');
      queryParams.push(dateFrom);
    }
    
    if (dateTo) {
      whereConditions.push('sl.createdAt <= ?');
      queryParams.push(dateTo);
    }

    const whereClause = whereConditions.join(' AND ');
    
    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['createdAt', 'approval_status', 'application_type', 'reviewedAt'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    // 🔧 FIXED: Removed CAST and fixed LIMIT/OFFSET parameters
    const applicationsQuery = `
      SELECT 
        sl.id as application_id,
        sl.user_id,
        sl.answers,
        sl.createdAt as submitted_at,
        sl.approval_status,
        sl.admin_notes,
        sl.reviewed_by,
        sl.reviewedAt,
        sl.application_ticket,
        sl.application_type,
        u.username,
        u.email,
        u.phone,
        u.createdAt as user_registered,
        u.membership_stage,
        u.is_member,
        reviewer.username as reviewer_name,
        DATEDIFF(NOW(), sl.createdAt) as days_pending
      FROM surveylog sl
      JOIN users u ON sl.user_id = u.id
      LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
      WHERE ${whereClause}
      ORDER BY sl.${safeSortBy} ${safeSortOrder}
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    // 🔧 FIXED: No LIMIT/OFFSET in queryParams anymore
    const [applications] = await db.query(applicationsQuery, queryParams);
    
    console.log('🔍 Applications result structure:', {
      applications: applications,
      type: typeof applications,
      isArray: Array.isArray(applications),
      length: applications ? applications.length : 'undefined'
    });

    // Get total count with same filters
    const countQuery = `
      SELECT COUNT(*) as total
      FROM surveylog sl
      JOIN users u ON sl.user_id = u.id
      WHERE ${whereClause}
    `;

    const [countResult] = await db.query(countQuery, queryParams);
    console.log('🔍 Count result structure:', {
      countResult: countResult,
      firstRow: countResult[0],
      type: typeof countResult,
      isArray: Array.isArray(countResult)
    });
    
    // ✅ FIXED: Safe access to total with fallback
    const total = (countResult && countResult[0] && countResult[0].total) || 0;

    // ✅ FIXED: Ensure applications is always an array
    const safeApplications = Array.isArray(applications) ? applications : [];

    // Format applications safely
    const formattedApplications = safeApplications.map(app => ({
      application_id: app.application_id,
      application_ticket: app.application_ticket,
      application_type: app.application_type,
      user: {
        id: app.user_id,
        username: app.username,
        email: app.email,
        phone: app.phone,
        registered_at: app.user_registered,
        current_status: {
          membership_stage: app.membership_stage,
          is_member: app.is_member
        }
      },
      application: {
        submitted_at: app.submitted_at,
        status: app.approval_status,
        answers: app.answers ? (() => {
          try {
            return JSON.parse(app.answers);
          } catch {
            return app.answers;
          }
        })() : null,
        admin_notes: app.admin_notes,
        reviewed_by: app.reviewer_name,
        reviewed_at: app.reviewedAt
      },
      review_priority: calculateReviewPriority(app),
      days_pending: app.days_pending
    }));

    return {
      applications: formattedApplications,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit,
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1
      },
      filters_applied: filters,
      summary: {
        total_found: total,
        high_priority: formattedApplications.filter(app => app.review_priority === 'high').length,
        overdue: formattedApplications.filter(app => app.days_pending > 7).length
      }
    };
  } catch (error) {
    console.error('❌ getAllApplications error:', error);
    throw new CustomError(`Failed to get applications: ${error.message}`, 500);
  }
};

/**
 * Get application by ID with full details - FIXED
 */
export const getApplicationById = async (applicationId) => {
  try {
    const [applications] = await db.query(`
      SELECT 
        sl.*,
        u.username,
        u.email,
        u.phone,
        u.membership_stage,
        u.is_member,
        reviewer.username as reviewer_name
      FROM surveylog sl
      JOIN users u ON sl.user_id = u.id
      LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
      WHERE sl.id = ?
    `, [applicationId]);

    if (applications.length === 0) {
      throw new CustomError('Application not found', 404);
    }

    const app = applications[0];
    
    return {
      application_id: app.id,
      user: {
        id: app.user_id,
        username: app.username,
        email: app.email,
        phone: app.phone,
        membership_stage: app.membership_stage,
        is_member: app.is_member
      },
      application: {
        type: app.application_type,
        ticket: app.application_ticket,
        submitted_at: app.createdAt,
        status: app.approval_status,
        answers: app.answers ? (() => {
          try {
            return JSON.parse(app.answers);
          } catch {
            return app.answers;
          }
        })() : null,
        admin_notes: app.admin_notes,
        reviewed_by: app.reviewer_name,
        reviewed_at: app.reviewedAt
      },
      review_info: {
        days_pending: Math.floor((Date.now() - new Date(app.createdAt)) / (1000 * 60 * 60 * 24)),
        priority: calculateReviewPriority(app)
      }
    };
  } catch (error) {
    throw new CustomError(`Failed to get application: ${error.message}`, 500);
  }
};

/**
 * Review individual application - FIXED
 */
export const reviewApplication = async (applicationId, reviewData, reviewer) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();
  
  try {
    const { action, adminNotes, reason, mentorId, classId, sendNotification } = reviewData;
    
    // Validate action
    if (!['approve', 'decline', 'approved', 'declined'].includes(action)) {
      throw new CustomError('Invalid review action', 400);
    }

    // Get application
    const [applications] = await connection.query(`
      SELECT sl.*, u.username, u.email, u.membership_stage
      FROM surveylog sl
      JOIN users u ON sl.user_id = u.id
      WHERE sl.id = ?
    `, [applicationId]);

    if (applications.length === 0) {
      throw new CustomError('Application not found', 404);
    }

    const application = applications[0];
    const userId = application.user_id;
    const finalStatus = ['approve', 'approved'].includes(action) ? 'approved' : 'declined';

    // Update application
    await connection.query(`
      UPDATE surveylog 
      SET approval_status = ?, admin_notes = ?, reviewedAt = NOW(), reviewed_by = ?
      WHERE id = ?
    `, [finalStatus, adminNotes || reason, reviewer.id, applicationId]);

    // Update user status
    let newStage = application.membership_stage;
    let memberStatus = application.is_member;
    
    if (application.application_type === 'initial_application') {
      if (finalStatus === 'approved') {
        newStage = 'pre_member';
        memberStatus = 'pre_member';
        
        // Generate converse ID for new pre-members if not exists
        if (!application.converse_id) {
          try {
            const converseId = await generateUniqueConverseId();
            await connection.query(`
              UPDATE users SET converse_id = ? WHERE id = ?
            `, [converseId, userId]);
          } catch (converseError) {
            console.warn('Failed to generate converse ID:', converseError.message);
          }
        }
      } else {
        newStage = 'applicant';
        memberStatus = 'rejected';
      }
    }

    await connection.query(`
      UPDATE users 
      SET membership_stage = ?, is_member = ?, applicationReviewedAt = NOW(), mentor_id = ?
      WHERE id = ?
    `, [newStage, memberStatus, mentorId || null, userId]);

    // Log review safely
    await logAuditSafe(reviewer.id, 'application_reviewed', {
      application_id: applicationId,
      user_id: userId,
      decision: finalStatus,
      admin_notes: adminNotes,
      reviewed_by: reviewer.username,
      timestamp: new Date().toISOString()
    });

    await connection.commit();

    // Send notification email if requested
    if (sendNotification && application.email) {
      try {
        await sendEmail(application.email, 
          finalStatus === 'approved' ? 'Application Approved' : 'Application Update',
          {
            username: application.username,
            decision: finalStatus,
            notes: adminNotes || reason,
            next_steps: finalStatus === 'approved' ? 
              'Welcome to pre-membership! You can now access member features.' :
              'Thank you for your application. You may reapply in the future.'
          }
        );
      } catch (emailError) {
        console.warn('Failed to send notification email:', emailError.message);
      }
    }

    return {
      application_id: applicationId,
      user: {
        id: userId,
        username: application.username,
        email: application.email,
        new_status: newStage
      },
      review: {
        decision: finalStatus,
        reviewed_by: reviewer.username,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes,
        mentor_assigned: mentorId ? true : false
      },
      notification_sent: sendNotification && application.email
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Bulk review applications - FIXED
 */
export const bulkReviewApplications = async (bulkData, reviewer) => {
  const { applicationIds, action, reason, adminNotes, autoAssignMentors, sendNotifications } = bulkData;
  
  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    throw new CustomError('Application IDs array is required', 400);
  }
  
  if (!['approve', 'decline'].includes(action)) {
    throw new CustomError('Action must be approve or decline', 400);
  }
  
  if (applicationIds.length > 50) {
    throw new CustomError('Maximum 50 applications per bulk operation', 400);
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();
  
  try {
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
        // Get application
        const [apps] = await connection.query(`
          SELECT sl.*, u.username, u.email, u.membership_stage
          FROM surveylog sl
          JOIN users u ON sl.user_id = u.id
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
        const finalStatus = action === 'approve' ? 'approved' : 'declined';

        // Update application
        await connection.query(`
          UPDATE surveylog 
          SET approval_status = ?, admin_notes = ?, reviewedAt = NOW(), reviewed_by = ?
          WHERE id = ?
        `, [finalStatus, adminNotes || reason, reviewer.id, appId]);

        // Update user status
        let newStage = app.membership_stage;
        let memberStatus = app.is_member;
        
        if (app.application_type === 'initial_application') {
          if (finalStatus === 'approved') {
            newStage = 'pre_member';
            memberStatus = 'pre_member';
          } else {
            newStage = 'applicant';
            memberStatus = 'rejected';
          }
        }

        await connection.query(`
          UPDATE users 
          SET membership_stage = ?, is_member = ?, applicationReviewedAt = NOW()
          WHERE id = ?
        `, [newStage, memberStatus, app.user_id]);

        results.processed.push({
          applicationId: appId,
          userId: app.user_id,
          username: app.username,
          email: app.email,
          decision: finalStatus,
          newStage: newStage
        });

        results.summary.successCount++;

      } catch (error) {
        console.error(`Failed to process application ${appId}:`, error);
        results.failed.push({
          applicationId: appId,
          reason: error.message
        });
        results.summary.failureCount++;
      }
    }

    // Log bulk operation safely
    await logAuditSafe(reviewer.id, 'bulk_application_review', {
      action,
      totalRequested: applicationIds.length,
      successCount: results.summary.successCount,
      failureCount: results.summary.failureCount,
      adminNotes,
      reviewedBy: reviewer.username,
      timestamp: new Date().toISOString()
    });

    await connection.commit();

    return {
      operation: `bulk_${action}`,
      ...results,
      processedBy: reviewer.username,
      processedAt: new Date().toISOString()
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// =============================================================================
// STATISTICS & ANALYTICS SERVICES - FIXED
// =============================================================================

/**
 * Get application statistics - FIXED
 */
export const getApplicationStats = async (period = '30d', groupBy = 'day', includeDetailedBreakdown = false) => {
  try {
    let days = 30;
    switch (period) {
      case '7d': days = 7; break;
      case '90d': days = 90; break;
      case '1y': days = 365; break;
    }

    // Core statistics with safe queries
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN approval_status IN ('declined', 'rejected') THEN 1 END) as declined_count,
        COALESCE(AVG(CASE WHEN reviewedAt IS NOT NULL THEN DATEDIFF(reviewedAt, createdAt) END), 0) as avg_processing_days,
        COUNT(CASE WHEN application_type = 'initial_application' THEN 1 END) as initial_applications,
        COUNT(CASE WHEN application_type = 'full_membership' THEN 1 END) as full_membership_applications
      FROM surveylog
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);

    const result = {
      period,
      stats: stats[0],
      summary: {
        total_in_period: stats[0]?.total_applications || 0,
        approval_rate: stats[0]?.total_applications > 0 ? 
          ((stats[0]?.approved_count || 0) / stats[0]?.total_applications * 100).toFixed(1) : 0,
        avg_processing_time: parseFloat((stats[0]?.avg_processing_days || 0).toFixed(1))
      },
      generatedAt: new Date().toISOString()
    };

    // Add detailed breakdown if requested
    if (includeDetailedBreakdown) {
      let timeGrouping = 'DATE(createdAt)';
      if (groupBy === 'week') {
        timeGrouping = 'YEARWEEK(createdAt)';
      } else if (groupBy === 'month') {
        timeGrouping = 'DATE_FORMAT(createdAt, "%Y-%m")';
      }

      const [trends] = await db.query(`
        SELECT 
          ${timeGrouping} as period,
          COUNT(*) as total,
          COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN approval_status = 'declined' THEN 1 END) as declined,
          COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending
        FROM surveylog
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY period
        ORDER BY period ASC
      `, [days]);

      result.trends = trends;
    }

    return result;
  } catch (error) {
    throw new CustomError(`Failed to get application stats: ${error.message}`, 500);
  }
};

/**
 * Get full membership statistics - FIXED
 */
export const getFullMembershipStats = async (period = '30d', includeDetails = false) => {
  try {
    let days = 30;
    switch (period) {
      case '7d': days = 7; break;
      case '90d': days = 90; break;
      case '1y': days = 365; break;
    }

    // ✅ FIXED: Simplified query to avoid complex JOINs that cause packet errors
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE membership_stage = 'member') as total_full_members,
        (SELECT COUNT(*) FROM users WHERE membership_stage = 'pre_member') as total_pre_members,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending' AND application_type = 'full_membership') as pending_full_applications,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'approved' AND application_type = 'full_membership' AND reviewedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)) as approved_full_applications,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'declined' AND application_type = 'full_membership' AND reviewedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)) as declined_full_applications,
        (SELECT COUNT(*) FROM surveylog WHERE application_type = 'full_membership') as total_full_applications,
        (SELECT COALESCE(AVG(DATEDIFF(reviewedAt, createdAt)), 0) FROM surveylog WHERE reviewedAt IS NOT NULL AND application_type = 'full_membership') as avg_full_processing_days
    `, [days, days]);

    const result = {
      period,
      summary: {
        total_full_members: stats[0]?.total_full_members || 0,
        pending_full_applications: stats[0]?.pending_full_applications || 0,
        approved_full_applications: stats[0]?.approved_full_applications || 0,
        declined_full_applications: stats[0]?.declined_full_applications || 0,
        total_full_applications: stats[0]?.total_full_applications || 0,
        avg_full_processing_days: Math.round(stats[0]?.avg_full_processing_days || 0)
      },
      // Legacy format for backward compatibility
      pending_full_applications: stats[0]?.pending_full_applications || 0,
      approved_full_applications: stats[0]?.approved_full_applications || 0,
      declined_full_applications: stats[0]?.declined_full_applications || 0,
      total_full_applications: stats[0]?.total_full_applications || 0,
      avg_full_processing_days: stats[0]?.avg_full_processing_days || 0,
      generatedAt: new Date().toISOString()
    };

    return result;
  } catch (error) {
    throw new CustomError(`Failed to get full membership stats: ${error.message}`, 500);
  }
};

/**
 * Get comprehensive membership analytics - FIXED
 */
export const getMembershipAnalytics = async (analyticsOptions) => {
  try {
    const { period = '30d', detailed = false, includeTimeSeries = true, includeConversionFunnel = true } = analyticsOptions;
    
    let days = 30;
    switch (period) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case '1y': days = 365; break;
    }

    // ✅ FIXED: Separate queries to avoid complex JOINs
    const [userMetrics] = await db.query(`
      SELECT 
        COUNT(DISTINCT id) as total_users,
        COUNT(DISTINCT CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN id END) as new_users_period,
        COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as current_pre_members,
        COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as current_full_members
      FROM users
      WHERE role = 'user' OR role IS NULL
    `, [days]);

    const [applicationMetrics] = await db.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN user_id END) as new_applications_period,
        COALESCE(AVG(CASE WHEN reviewedAt IS NOT NULL THEN DATEDIFF(reviewedAt, createdAt) END), 0) as avg_processing_days
      FROM surveylog
    `, [days]);

    const analytics = {
      period,
      core_metrics: {
        total_users: userMetrics[0]?.total_users || 0,
        new_users_period: userMetrics[0]?.new_users_period || 0,
        new_applications_period: applicationMetrics[0]?.new_applications_period || 0,
        current_pre_members: userMetrics[0]?.current_pre_members || 0,
        current_full_members: userMetrics[0]?.current_full_members || 0,
        avg_processing_days: applicationMetrics[0]?.avg_processing_days || 0
      },
      generatedAt: new Date().toISOString()
    };

    // Add conversion funnel if requested
    if (includeConversionFunnel) {
      analytics.conversionFunnel = {
        total_registrations: userMetrics[0]?.total_users || 0,
        started_application: applicationMetrics[0]?.new_applications_period || 0,
        approved_initial: userMetrics[0]?.current_pre_members || 0,
        full_members: userMetrics[0]?.current_full_members || 0
      };
    }

    // Add time series if requested
    if (includeTimeSeries) {
      const [timeSeries] = await db.query(`
        SELECT 
          DATE(createdAt) as date,
          COUNT(CASE WHEN application_type = 'initial_application' THEN 1 END) as registrations,
          COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approvals
        FROM surveylog
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `, [days]);

      analytics.timeSeries = timeSeries;
    }

    return analytics;
  } catch (error) {
    throw new CustomError(`Failed to get membership analytics: ${error.message}`, 500);
  }
};

/**
 * Get membership overview for dashboard - FIXED
 */
export const getMembershipOverview = async (includeRecentActivity = true) => {
  try {
    // Core overview metrics
    const [overview] = await db.query(`
      SELECT 
        COUNT(CASE WHEN membership_stage = 'none' OR membership_stage IS NULL THEN 1 END) as new_users,
        COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as applicants,
        COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as pre_members,
        COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_applications,
        COUNT(CASE WHEN u.createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as new_users_24h,
        COUNT(CASE WHEN u.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_users_7d
      FROM users u
      WHERE role = 'user' OR role IS NULL
    `);

    const result = {
      overview: overview[0],
      generatedAt: new Date().toISOString()
    };

    // Add recent activity if requested
    if (includeRecentActivity) {
      const [recentActivity] = await db.query(`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as applications
        FROM surveylog
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
      `);

      result.recent_activity = recentActivity;
    }

    return result;
  } catch (error) {
    throw new CustomError(`Failed to get membership overview: ${error.message}`, 500);
  }
};

// =============================================================================
// USER MANAGEMENT SERVICES - FIXED
// =============================================================================

/**
 * Search users with advanced filters - FIXED
 */
export const searchUsers = async (searchCriteria) => {
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
      includeInactive = false,
      dateFrom,
      dateTo
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
      whereConditions.push('(u.lastLogin >= DATE_SUB(NOW(), INTERVAL 90 DAY) OR u.lastLogin IS NULL)');
    }

    if (dateFrom) {
      whereConditions.push('u.createdAt >= ?');
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('u.createdAt <= ?');
      queryParams.push(dateTo);
    }

    const whereClause = whereConditions.join(' AND ');

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['createdAt', 'username', 'email', 'membership_stage', 'lastLogin'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Main search query - FIXED LIMIT/OFFSET
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
        u.lastLogin,
        u.converse_id,
        
        -- Latest application info
        latest_app.approval_status as latest_application_status,
        latest_app.application_type as latest_application_type,
        latest_app.createdAt as latest_application_date,
        latest_app.reviewedAt as latest_review_date,
        reviewer.username as reviewed_by,
        
        -- Flags
        CASE WHEN u.lastLogin < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END as is_inactive,
        CASE WHEN latest_app.approval_status = 'pending' AND latest_app.createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END as has_overdue_application
        
      FROM users u
      LEFT JOIN (
        SELECT 
          sl.*,
          ROW_NUMBER() OVER (PARTITION BY sl.user_id ORDER BY sl.createdAt DESC) as rn
        FROM surveylog sl
      ) latest_app ON u.id = latest_app.user_id AND latest_app.rn = 1
      LEFT JOIN users reviewer ON latest_app.reviewed_by = reviewer.id
      WHERE ${whereClause}
      ORDER BY u.${safeSortBy} ${safeSortOrder}
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    const [users] = await db.query(searchQuery, queryParams);
    
    console.log('🔍 Users search result structure:', {
      users: users,
      type: typeof users,
      isArray: Array.isArray(users),
      length: users ? users.length : 'undefined'
    });

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
      ) latest_app ON u.id = latest_app.user_id
      WHERE ${whereClause}
    `;

    const [countResult] = await db.query(countQuery, queryParams);
    console.log('🔍 User search count result:', {
      countResult: countResult,
      firstRow: countResult[0],
      type: typeof countResult
    });

    // ✅ FIXED: Safe access to total with fallback
    const total = (countResult && countResult[0] && countResult[0].total) || 0;

    // ✅ FIXED: Ensure users is always an array
    const safeUsers = Array.isArray(users) ? users : [];

    return {
      users: safeUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit)
      },
      search_criteria: searchCriteria,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new CustomError(`Failed to search users: ${error.message}`, 500);
  }
};

/**
 * Get available mentors with workload info - FIXED
 */
export const getAvailableMentors = async (includeWorkload = false) => {
  try {
    console.log('🔍 getAvailableMentors: Starting mentor query...');
    const queryResult = await db.query(`
      SELECT 
        m.id,
        m.username,
        m.email,
        m.role,
        m.createdAt,
        (SELECT COUNT(*) FROM users WHERE mentor_id = m.id) as current_mentees
      FROM users m
      WHERE role IN ('admin', 'super_admin', 'mentor')
      ORDER BY current_mentees ASC, username ASC
    `);
    
    console.log('🔍 Raw query result type:', typeof queryResult);
    console.log('🔍 Raw query result isArray:', Array.isArray(queryResult));
    console.log('🔍 Raw query result length:', queryResult?.length);
    console.log('🔍 Raw query result first item:', queryResult?.[0]);
    
    // Handle different result formats from db.query
    let mentors;
    if (Array.isArray(queryResult)) {
      // If the result is directly an array
      mentors = queryResult;
    } else if (Array.isArray(queryResult[0])) {
      // If the result is [rows, fields] format
      mentors = queryResult[0];
    } else {
      console.error('❌ Unexpected query result format:', queryResult);
      throw new Error('Unexpected database query result format');
    }

    console.log('🔍 Extracted mentors type:', typeof mentors);
    console.log('🔍 Extracted mentors isArray:', Array.isArray(mentors));
    console.log('🔍 Extracted mentors length:', mentors?.length);

    if (!Array.isArray(mentors)) {
      throw new Error(`mentors is not an array: ${typeof mentors}`);
    }

    const formattedMentors = mentors.map(mentor => ({
      id: mentor.id,
      username: mentor.username,
      email: mentor.email,
      role: mentor.role,
      current_mentees: mentor.current_mentees,
      available: mentor.current_mentees < 10,
      capacity_percentage: Math.round((mentor.current_mentees / 10) * 100)
    }));

    if (includeWorkload) {
      // Add additional workload metrics
      for (let mentor of formattedMentors) {
        const [workload] = await db.query(`
          SELECT 
            COUNT(CASE WHEN sl.approval_status = 'pending' THEN 1 END) as pending_reviews,
            COUNT(CASE WHEN sl.reviewedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as reviews_this_week
          FROM surveylog sl
          WHERE sl.reviewed_by = ?
        `, [mentor.id]);

        mentor.workload = workload[0];
      }
    }

    return {
      mentors: formattedMentors,
      summary: {
        total_mentors: mentors.length,
        available_mentors: formattedMentors.filter(m => m.available).length,
        average_capacity: Math.round(formattedMentors.reduce((sum, m) => sum + m.capacity_percentage, 0) / mentors.length)
      }
    };
  } catch (error) {
    throw new CustomError(`Failed to get available mentors: ${error.message}`, 500);
  }
};

// =============================================================================
// SYSTEM MANAGEMENT SERVICES - FIXED
// =============================================================================

/**
 * Export membership data with privacy controls - FIXED
 */
export const exportMembershipData = async (exportOptions, exporter) => {
  try {
    const { format, includePersonalData, exportType, dateFrom, dateTo } = exportOptions;
    
    // Build query based on export type
    let query;
    let queryParams = [];
    
    if (exportType === 'applications') {
      query = includePersonalData ? 
        `SELECT sl.id, sl.user_id, u.username, u.email, sl.application_type, sl.approval_status, sl.createdAt, sl.reviewedAt 
         FROM surveylog sl JOIN users u ON sl.user_id = u.id` :
        `SELECT sl.id, sl.user_id, u.username, sl.application_type, sl.approval_status, sl.createdAt, sl.reviewedAt 
         FROM surveylog sl JOIN users u ON sl.user_id = u.id`;
    } else {
      query = includePersonalData ? 
        `SELECT id, username, email, membership_stage, is_member, createdAt FROM users WHERE role = 'user' OR role IS NULL` :
        `SELECT id, username, membership_stage, is_member, createdAt FROM users WHERE role = 'user' OR role IS NULL`;
    }
    
    // Add date filters if provided
    if (dateFrom || dateTo) {
      query += ' WHERE ';
      const conditions = [];
      
      if (dateFrom) {
        conditions.push('createdAt >= ?');
        queryParams.push(dateFrom);
      }
      
      if (dateTo) {
        conditions.push('createdAt <= ?');
        queryParams.push(dateTo);
      }
      
      query += conditions.join(' AND ');
    }
    
    const [data] = await db.query(query, queryParams);
    
    // Log export activity safely
    await logAuditSafe(exporter.id, 'data_export', {
      export_type: exportType,
      format,
      include_personal_data: includePersonalData,
      record_count: data.length,
      exported_by: exporter.username,
      timestamp: new Date().toISOString()
    });
    
    if (format === 'csv') {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      );
      return [headers, ...rows].join('\n');
    }
    
    return {
      data,
      export_info: {
        type: exportType,
        format,
        record_count: data.length,
        exported_by: exporter.username,
        exported_at: new Date().toISOString(),
        includes_personal_data: includePersonalData
      }
    };
  } catch (error) {
    throw new CustomError(`Failed to export data: ${error.message}`, 500);
  }
};

/**
 * Send bulk notifications to users - FIXED
 */
export const sendBulkNotifications = async (notificationData, sender) => {
  try {
    const { recipients, subject, message, type, sendEmail: shouldSendEmail, template, templateData } = notificationData;
    
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new CustomError('Recipients array is required', 400);
    }
    
    if (!subject || !message) {
      throw new CustomError('Subject and message are required', 400);
    }
    
    let successCount = 0;
    let failureCount = 0;
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const recipientEmail = typeof recipient === 'string' ? recipient : recipient.email;
        const recipientName = typeof recipient === 'object' ? recipient.username || recipient.name : 'User';
        
        if (shouldSendEmail && recipientEmail) {
          const emailData = {
            username: recipientName,
            message: message,
            ...templateData
          };
          
          await sendEmail(recipientEmail, subject, emailData);
          
          results.push({
            recipient: recipientEmail,
            status: 'sent',
            method: 'email'
          });
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to send notification to ${recipient}:`, error);
        results.push({
          recipient: typeof recipient === 'string' ? recipient : recipient.email,
          status: 'failed',
          error: error.message
        });
        failureCount++;
      }
    }
    
    // Log notification activity safely
    await logAuditSafe(sender.id, 'bulk_notification_sent', {
      type,
      subject,
      recipient_count: recipients.length,
      success_count: successCount,
      failure_count: failureCount,
      sent_by: sender.username,
      timestamp: new Date().toISOString()
    });
    
    return {
      total_recipients: recipients.length,
      success_count: successCount,
      failure_count: failureCount,
      results,
      sent_by: sender.username,
      sent_at: new Date().toISOString()
    };
  } catch (error) {
    throw new CustomError(`Failed to send bulk notifications: ${error.message}`, 500);
  }
};

// =============================================================================
// ADDITIONAL ADMIN SERVICES
// =============================================================================

/**
 * Get audit logs with fallback
 */
export const getAuditLogs = async (filters = {}) => {
  try {
    console.log('🔍 Fetching audit logs...');
    
    const { page = 1, limit = 50, action, userId, dateFrom, dateTo } = filters;
    const offset = (page - 1) * limit;
    
    let whereConditions = ['1=1'];
    let queryParams = [];
    
    if (action) {
      whereConditions.push('action = ?');
      queryParams.push(action);
    }
    
    if (userId) {
      whereConditions.push('user_id = ?');
      queryParams.push(userId);
    }
    
    if (dateFrom) {
      whereConditions.push('createdAt >= ?');
      queryParams.push(dateFrom);
    }
    
    if (dateTo) {
      whereConditions.push('createdAt <= ?');
      queryParams.push(dateTo);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // ✅ FIXED: Simple query without LIMIT/OFFSET parameter issues
    const logsQuery = `
      SELECT id, user_id, action, resource, details, createdAt
      FROM audit_logs 
      WHERE ${whereClause}
      ORDER BY createdAt DESC 
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;
    
    const [logs] = await db.query(logsQuery, queryParams);
    
    console.log('🔍 Audit logs result structure:', {
      logs: logs,
      type: typeof logs,
      isArray: Array.isArray(logs),
      length: logs ? logs.length : 'undefined'
    });
    
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM audit_logs 
      WHERE ${whereClause}
    `;
    
    const [countResult] = await db.query(countQuery, queryParams);
    console.log('🔍 Audit logs count result:', {
      countResult: countResult,
      firstRow: countResult[0],
      type: typeof countResult
    });
    
    // ✅ FIXED: Safe access to total with fallback
    const total = (countResult && countResult[0] && countResult[0].total) || 0;
    
    // ✅ FIXED: Ensure logs is always an array
    const safeLogs = Array.isArray(logs) ? logs : [];
    
    return {
      logs: safeLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('❌ getAuditLogs error:', error);
    // Return empty result instead of throwing
    return {
      logs: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
      },
      error: error.message
    };
  }
};

/**
 * Get dashboard data
 */
export const getDashboardData = async () => {
  try {
    const overview = await getMembershipOverview(true);
    const stats = await getApplicationStats('30d');
    const fullStats = await getFullMembershipStats('30d');
    
    return {
      overview: overview.overview,
      recent_activity: overview.recent_activity,
      application_stats: stats.summary,
      full_membership_stats: fullStats.summary,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    throw new CustomError(`Failed to get dashboard data: ${error.message}`, 500);
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate application review priority
 */
const calculateReviewPriority = (application) => {
  const daysPending = Math.floor((Date.now() - new Date(application.submitted_at || application.createdAt)) / (1000 * 60 * 60 * 24));
  
  if (daysPending > 14) return 'urgent';
  if (daysPending > 7) return 'high';
  if (daysPending > 3) return 'medium';
  return 'low';
};