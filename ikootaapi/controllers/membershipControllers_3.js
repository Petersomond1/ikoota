// ikootaapi/controllers/membershipControllers_3.js
// ==================================================
// ADMIN FUNCTIONS, ANALYTICS & SYSTEM MANAGEMENT
// ==================================================

import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { sendEmail } from '../utils/notifications.js';
import CustomError from '../utils/CustomError.js';
import { 
  getUserById, 
  validateStageTransition,
  convertToCSV,
  successResponse, 
  errorResponse,
  executeQuery
} from './membershipControllers_1.js';
import * as membershipService from '../services/membershipServices.js';

// ==================================================
// ADMIN APPLICATION MANAGEMENT
// ==================================================

/**
 * Get pending applications with advanced filtering
 */
// export const getPendingApplications = async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 20, 
//       status = 'pending', 
//       stage = 'initial',
//       sortBy = 'submitted_at',
//       sortOrder = 'ASC',
//       search = ''
//     } = req.query;
    
//     const offset = (page - 1) * limit;
//     const applicationType = stage === 'initial' ? 'initial_application' : 'full_membership';
    
//     // Build search conditions
//     let searchClause = '';
//     let searchParams = [];
    
//     if (search) {
//       searchClause = 'AND (u.username LIKE ? OR u.email LIKE ?)';
//       searchParams = [`%${search}%`, `%${search}%`];
//     }
    
//     // Get applications with user details
//     const [applications] = await db.query(`
//       SELECT 
//         u.id as user_id,
//         u.username,
//         u.email,
//         u.phone,
//         u.membership_stage,
//         sl.id as application_id,
//         sl.answers,
//         sl.createdAt as submitted_at,
//         sl.application_ticket,
//         sl.additional_data,
//         DATEDIFF(NOW(), sl.createdAt) as days_pending,
//         fma.first_accessed_at,
//         fma.access_count
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
//       WHERE sl.approval_status = ? 
//         AND sl.application_type = ?
//         ${searchClause}
//       ORDER BY ${sortBy} ${sortOrder}
//       LIMIT ? OFFSET ?
//     `, [status, applicationType, ...searchParams, parseInt(limit), offset]);

//     // Get total count for pagination
//     const [countResult] = await db.query(`
//       SELECT COUNT(*) as total
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       WHERE sl.approval_status = ? 
//         AND sl.application_type = ?
//         ${searchClause}
//     `, [status, applicationType, ...searchParams]);

//     return successResponse(res, {
//       applications,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: countResult[0].total,
//         totalPages: Math.ceil(countResult[0].total / limit)
//       },
//       filters: { status, stage, sortBy, sortOrder, search }
//     });
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };
export const getPendingApplications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'pending',  // ✅ Added back from old version
      stage = 'initial',
      sortBy = 'submitted_at', 
      sortOrder = 'ASC', 
      search = '' 
    } = req.query;
    
    // ✅ CORRECTED: Call service function with proper name
    const result = await membershipService.getPendingApplicationsWithPagination({
      page: parseInt(page),
      limit: parseInt(limit),
      status,  // ✅ Pass status to service
      search,
      sortBy,
      sortOrder,
      stage
    });
    
    // ✅ Use successResponse if available, otherwise standard response
    if (typeof successResponse === 'function') {
      return successResponse(res, {
        ...result,
        filters: { status, stage, sortBy, sortOrder, search }  // ✅ Added filters object
      });
    } else {
      res.json({
        success: true,
        ...result,
        filters: { status, stage, sortBy, sortOrder, search }  // ✅ Added filters object
      });
    }
    
  } catch (error) {
    console.error('❌ Error in getPendingApplications:', error);
    
    // ✅ Use errorResponse if available, otherwise standard error response
    if (typeof errorResponse === 'function') {
      return errorResponse(res, error);
    } else {
      res.status(500).json({
        success: false,
        error: 'Database query failed: ' + error.message
      });
    }
  }
};



/**
 * Update application status (Admin)
 */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, adminNotes, notifyUser = true, applicationType = 'initial_application' } = req.body;
    const reviewerId = req.user.user_id || req.user.id;
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      throw new CustomError('Invalid status', 400);
    }
    
    // Validate stage transition
    const user = await getUserById(userId);
    let newStage = user.membership_stage;
    let memberStatus = user.is_member;
    
    if (applicationType === 'initial_application') {
      if (status === 'approved') {
        newStage = 'pre_member';
        memberStatus = 'granted';
      } else if (status === 'rejected') {
        newStage = 'applicant';
        memberStatus = 'rejected';
      }
    } else if (applicationType === 'full_membership') {
      if (status === 'approved') {
        newStage = 'member';
        memberStatus = 'active';
      }
    }
    
    // Validate transition
    if (!validateStageTransition(user.membership_stage, newStage)) {
      throw new CustomError('Invalid membership stage transition', 400);
    }
    
    const result = await db.transaction(async (connection) => {
      // Update surveylog
      await connection.execute(`
        UPDATE surveylog 
        SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
        WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
        ORDER BY createdAt DESC LIMIT 1
      `, [status, adminNotes, reviewerId, userId, applicationType]);
            
      // Update user status
      await connection.execute(`
        UPDATE users 
        SET membership_stage = ?, is_member = ?
        WHERE id = ?
      `, [newStage, memberStatus, userId]);
            
      // Log the review action
      await connection.execute(`
        INSERT INTO membership_review_history 
        (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [userId, applicationType, 'pending', status, adminNotes, reviewerId]);
            
      return {
        newStatus: {
          membership_stage: newStage,
          approval_status: status,
          is_member: memberStatus
        }
      };
    });
        
    // Send notification if requested
    if (notifyUser) {
      try {
        const emailTemplate = status === 'approved' ? 
           `${applicationType}_approved` : `${applicationType}_rejected`;
                   
        await sendEmail(user.email, emailTemplate, {
          USERNAME: user.username,
          ADMIN_NOTES: adminNotes || '',
          REVIEW_DATE: new Date().toLocaleDateString()
        });
      } catch (emailError) {
        console.error('Notification email failed:', emailError);
      }
    }
        
    return successResponse(res, result, `Application ${status} successfully`);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Bulk approve applications
 */
export const bulkApproveApplications = async (req, res) => {
  try {
    const { userIds, action, adminNotes, applicationType = 'initial_application' } = req.body;
    const reviewerId = req.user.user_id || req.user.id;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new CustomError('User IDs are required', 400);
    }
    
    if (!['approve', 'reject'].includes(action)) {
      throw new CustomError('Invalid action', 400);
    }
    
    if (userIds.length > 100) {
      throw new CustomError('Maximum 100 applications can be processed at once', 400);
    }
    
    const status = action === 'approve' ? 'approved' : 'rejected';
    
    const result = await db.transaction(async (connection) => {
      const processedUsers = [];
      
      for (const userId of userIds) {
        try {
          const user = await getUserById(userId);
        
          let newStage = user.membership_stage;
          let memberStatus = user.is_member;
        
          if (applicationType === 'initial_application') {
            if (status === 'approved') {
              newStage = 'pre_member';
              memberStatus = 'granted';
            } else {
              newStage = 'applicant';
              memberStatus = 'rejected';
            }
          } else if (applicationType === 'full_membership') {
            if (status === 'approved') {
              newStage = 'member';
              memberStatus = 'active';
            }
          }
        
          // Validate transition
          if (!validateStageTransition(user.membership_stage, newStage)) {
            console.warn(`Invalid transition for user ${userId}: ${user.membership_stage} -> ${newStage}`);
            continue; // Skip this user
          }
        
          // Update surveylog
          await connection.execute(`
            UPDATE surveylog 
            SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
            WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
            ORDER BY createdAt DESC LIMIT 1
          `, [status, adminNotes, reviewerId, userId, applicationType]);
        
          // Update user status
          await connection.execute(`
            UPDATE users 
            SET membership_stage = ?, is_member = ?
            WHERE id = ?
          `, [newStage, memberStatus, userId]);
        
          // Log review
          await connection.execute(`
            INSERT INTO membership_review_history 
            (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
          `, [userId, applicationType, 'pending', status, adminNotes, reviewerId]);
        
          processedUsers.push({
            userId,
            username: user.username,
            email: user.email,
            newStatus: { membership_stage: newStage, is_member: memberStatus }
          });
        } catch (userError) {
          console.error(`Error processing user ${userId}:`, userError);
          // Continue with other users
        }
      }
      
      return {
        processedCount: processedUsers.length,
        requestedCount: userIds.length,
        processedUsers
      };
    });
      
    // Send notification emails (non-blocking)
    const emailTemplate = status === 'approved' ? 
      `${applicationType}_approved` : `${applicationType}_rejected`;
        
    const emailPromises = result.processedUsers.map(user => 
      sendEmail(user.email, emailTemplate, {
        USERNAME: user.username,
        ADMIN_NOTES: adminNotes || '',
        REVIEW_DATE: new Date().toLocaleDateString()
      }).catch(err => console.error('Email failed for', user.email, err))
    );
      
    // Don't wait for emails to complete
    Promise.allSettled(emailPromises);
      
    return successResponse(res, result, `Successfully ${action}ed ${result.processedCount} out of ${result.requestedCount} applications`);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Get pending full memberships (Admin)
 */
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
      searchClause = 'AND (u.username LIKE ? OR u.email LIKE ?)';
      searchParams = [`%${search}%`, `%${search}%`];
    }
    
    const [applications] = await db.query(`
      SELECT 
        u.id as user_id,
        u.username,
        u.email,
        sl.id as application_id,
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
      WHERE sl.application_type = 'full_membership' 
        AND sl.approval_status = 'pending'
        ${searchClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `, [...searchParams, parseInt(limit), offset]);
    
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM surveylog sl
      JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
      WHERE sl.application_type = 'full_membership' 
        AND sl.approval_status = 'pending'
        ${searchClause}
    `, searchParams);
    
    return successResponse(res, {
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
    
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Update full membership status (Admin)
 */
export const updateFullMembershipStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, adminNotes, notifyUser = true } = req.body;
    const reviewerId = req.user.user_id || req.user.id;
    
    if (!['approved', 'rejected'].includes(status)) {
      throw new CustomError('Invalid status', 400);
    }
    
    // Get application details
    const [applications] = await db.query(`
      SELECT CAST(user_id AS UNSIGNED) as user_id 
      FROM surveylog 
      WHERE id = ? AND application_type = 'full_membership'
    `, [applicationId]);
    
    if (!applications || applications.length === 0) {
      throw new CustomError('Application not found', 404);
    }
    
    const userId = applications[0].user_id;
    const user = await getUserById(userId);
    
    const result = await db.transaction(async (connection) => {
      // Update surveylog
      await connection.execute(`
        UPDATE surveylog 
        SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
        WHERE id = ?
      `, [status, adminNotes, reviewerId, applicationId]);
      
      // Update user to full member if approved
      if (status === 'approved') {
        await connection.execute(`
          UPDATE users 
          SET membership_stage = 'member', is_member = 'active'
          WHERE id = ?
        `, [userId]);
      }
      
      // Log the review
      await connection.execute(`
        INSERT INTO membership_review_history 
        (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
        VALUES (?, 'full_membership', 'pending', ?, ?, ?, NOW())
      `, [userId, status, adminNotes, reviewerId]);
      
      return { userId, status };
    });
    
    // Send notification
    if (notifyUser) {
      try {
        const emailTemplate = status === 'approved' ? 'full_membership_approved' : 'full_membership_rejected';
        
        await sendEmail(user.email, emailTemplate, {
          USERNAME: user.username,
          ADMIN_NOTES: adminNotes || '',
          REVIEW_DATE: new Date().toLocaleDateString()
        });
      } catch (emailError) {
        console.error('Notification email failed:', emailError);
      }
    }
    
    return successResponse(res, {}, `Full membership application ${status} successfully`);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// ==================================================
// ANALYTICS & REPORTING FUNCTIONS
// ==================================================

/**
 * Get comprehensive membership analytics
 */
export const getMembershipAnalytics = async (req, res) => {
  try {
    const { period = '30d', detailed = false } = req.query;
    
    // Get basic membership statistics
    const [membershipStats] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as total_applicants,
        COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as total_pre_members,
        COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as total_members,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week
      FROM users
    `);
    
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
    const periodDays = period === '30d' ? 30 : period === '7d' ? 7 : 90;
    const [timeSeriesData] = await db.query(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as registrations,
        COUNT(CASE WHEN membership_stage = 'pre_member' OR membership_stage = 'member' THEN 1 END) as approvals
      FROM users 
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `, [periodDays]);
    
    // Get application processing stats
    const [processingStats] = await db.query(`
      SELECT 
        application_type,
        COUNT(*) as total_applications,
        COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending,
        AVG(CASE WHEN reviewed_at IS NOT NULL THEN DATEDIFF(reviewed_at, createdAt) END) as avg_processing_days
      FROM surveylog
      GROUP BY application_type
    `);
    
    let detailedAnalytics = {};
    if (detailed === 'true') {
      // Get detailed breakdown by various factors
      const [roleBreakdown] = await db.query(`
        SELECT 
          role,
          COUNT(*) as count,
          COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members
        FROM users
        GROUP BY role
      `);
      
      const [monthlyTrends] = await db.query(`
        SELECT 
          YEAR(createdAt) as year,
          MONTH(createdAt) as month,
          COUNT(*) as registrations,
          COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as conversions
        FROM users
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY YEAR(createdAt), MONTH(createdAt)
        ORDER BY year DESC, month DESC
      `);
      
      detailedAnalytics = { 
        roleBreakdown,
        monthlyTrends
      };
    }
    
    return successResponse(res, {
      overview: membershipStats[0],
      conversionFunnel: funnelData[0],
      timeSeries: timeSeriesData,
      processingStats,
      ...detailedAnalytics
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Get membership overview for admin dashboard
 */
export const getMembershipOverview = async (req, res) => {
  try {
    // Get comprehensive overview data
    const [overview] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.membership_stage,
        u.is_member,
        u.role,
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
      LIMIT 100
    `);
    
    // Get summary statistics
    const [summary] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as applicants,
        COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as pre_members,
        COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month,
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week
      FROM users
    `);
    
    return successResponse(res, {
      overview,
      summary: summary[0]
    });
    
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Get detailed membership statistics
 */
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
        (SELECT COUNT(*) FROM surveylog WHERE application_type = 'initial_application') as submitted_initial_applications,
        (SELECT COUNT(*) FROM surveylog WHERE application_type = 'initial_application' AND approval_status = 'pending') as pending_initial_applications,
        (SELECT COUNT(*) FROM surveylog WHERE application_type = 'full_membership') as submitted_full_applications,
        (SELECT COUNT(*) FROM surveylog WHERE application_type = 'full_membership' AND approval_status = 'pending') as pending_full_applications
        
      FROM users
    `);
    
    // Get registration trends
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
    
    return successResponse(res, {
      membershipStats: membershipStats[0],
      registrationTrends,
      approvalRates,
      processingTimes
    });
    
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Export membership data
 */
export const exportMembershipData = async (req, res) => {
  try {
    const { format = 'csv', filters = {} } = req.query;
    
    // Get comprehensive membership data
    const [membershipData] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.phone,
        u.membership_stage,
        u.is_member,
        u.role,
        u.createdAt as user_created,
        COALESCE(initial_app.approval_status, 'not_submitted') as initial_status,
        initial_app.createdAt as initial_submitted,
        initial_app.reviewed_at as initial_reviewed,
        COALESCE(full_app.approval_status, 'not_submitted') as full_status,
        full_app.createdAt as full_submitted,
        full_app.reviewed_at as full_reviewed
      FROM users u
      LEFT JOIN surveylog initial_app ON u.id = CAST(initial_app.user_id AS UNSIGNED) 
        AND initial_app.application_type = 'initial_application'
      LEFT JOIN surveylog full_app ON u.id = CAST(full_app.user_id AS UNSIGNED) 
        AND full_app.application_type = 'full_membership'
      ORDER BY u.createdAt DESC
    `);
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(membershipData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="membership_data.csv"');
      res.send(csv);
    } else {
      return successResponse(res, {
        data: membershipData,
        exportedAt: new Date().toISOString(),
        totalRecords: membershipData.length
      });
    }
  } catch (error) {
    return errorResponse(res, error);
  }
};

// ==================================================
// NOTIFICATION FUNCTIONS
// ==================================================

/**
 * Send notification to users (Admin)
 */
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
      const [users] = await db.query('SELECT id, username, email, phone FROM users');
      userList = users;
    } else if (Array.isArray(recipients)) {
      const placeholders = recipients.map(() => '?').join(',');
      const [users] = await db.query(
        `SELECT id, username, email, phone FROM users WHERE id IN (${placeholders})`,
        recipients
      );
      userList = users;
    } else {
      throw new CustomError('Invalid recipients format', 400);
    }
    
    let successCount = 0;
    const sendPromises = [];
    
    for (const user of userList) {
      if ((type === 'email' || type === 'both') && user.email) {
        sendPromises.push(
          sendEmail(user.email, 'admin_notification', {
            USERNAME: user.username,
            SUBJECT: subject,
            MESSAGE: message,
            PRIORITY: priority
          }).then(() => successCount++).catch(err => console.error('Email failed for', user.email, err))
        );
      }
      
      if ((type === 'sms' || type === 'both') && user.phone) {
        sendPromises.push(
          sendSMS(user.phone, `${subject}: ${message}`)
            .then(() => successCount++).catch(err => console.error('SMS failed for', user.phone, err))
        );
      }
    }
    
    await Promise.allSettled(sendPromises);
    
    return successResponse(res, {
      sentCount: userList.length,
      successCount
    }, `Notification sent to ${userList.length} users`);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Send membership-specific notification (Admin)
 */
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
    
    let successCount = 0;
    const sendPromises = [];
    
    for (const user of users) {
      if (type === 'email' && user.email) {
        sendPromises.push(
          sendEmail(user.email, 'membership_notification', {
            USERNAME: user.username,
            SUBJECT: subject,
            MESSAGE: message,
            MEMBERSHIP_STAGE: membershipStage
          }).then(() => successCount++).catch(err => console.error('Email failed for', user.email, err))
        );
      }
      
      if (type === 'sms' && user.phone) {
        sendPromises.push(
          sendSMS(user.phone, `${subject}: ${message}`)
            .then(() => successCount++).catch(err => console.error('SMS failed for', user.phone, err))
        );
      }
    }
    
    await Promise.allSettled(sendPromises);
    
    return successResponse(res, {
      sentCount: users.length,
      successCount
    }, `Membership notification sent to ${users.length} ${membershipStage}s`);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// ==================================================
// SYSTEM & UTILITY FUNCTIONS
// ==================================================

/**
 * Health check endpoint for membership system
 */
export const healthCheck = async (req, res) => {
  try {
    // Check database connectivity
    await executeQuery('SELECT 1 as health_check');
    
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
      version: '2.0.0'
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
 * Get system configuration (Admin only)
 */
export const getSystemConfig = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    if (!['admin', 'super_admin'].includes(userRole)) {
      throw new CustomError('Insufficient permissions', 403);
    }
    
    // Get various system configurations
    const config = {
      membershipStages: ['none', 'applicant', 'pre_member', 'member'],
      memberStatuses: ['pending', 'granted', 'rejected', 'active'],
      userRoles: ['user', 'admin', 'super_admin'],
      applicationTypes: ['initial_application', 'full_membership'],
      approvalStatuses: ['not_submitted', 'pending', 'approved', 'rejected'],
      notificationTypes: ['email', 'sms', 'both'],
      systemLimits: {
        maxBulkOperations: 100,
        maxExportRecords: 10000,
        sessionTimeout: '7d',
        verificationCodeExpiry: '10m'
      },
      features: {
        emailNotifications: true,
        smsNotifications: true,
        bulkOperations: true,
        dataExport: true,
        analytics: true
      }
    };
    
    return successResponse(res, { config });
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// ==================================================
// USER MANAGEMENT FUNCTIONS
// ==================================================

/**
 * Delete user account (self-deletion)
 */
export const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    const { password, reason } = req.body;
        
    if (!password) {
      throw new CustomError('Password confirmation required', 400);
    }
        
    // Get current user
    const user = await getUserById(userId);
        
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new CustomError('Password is incorrect', 400);
    }
        
    const result = await db.transaction(async (connection) => {
      // Log the deletion
      await connection.execute(`
        INSERT INTO user_deletion_log (user_id, username, email, reason, deleted_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [userId, user.username, user.email, reason || 'User requested deletion']);
            
      // Delete related data
      await connection.execute('DELETE FROM surveylog WHERE CAST(user_id AS UNSIGNED) = ?', [userId]);
      await connection.execute('DELETE FROM full_membership_access WHERE user_id = ?', [userId]);
      await connection.execute('DELETE FROM membership_review_history WHERE user_id = ?', [userId]);
            
      // Delete user
      await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
            
      return { deleted: true };
    });
        
    return successResponse(res, {}, 'Account deleted successfully');
        
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Search users (Admin)
 */
export const searchUsers = async (req, res) => {
  try {
    const { 
      query = '', 
      membershipStage = '', 
      role = '', 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    
    if (query) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      queryParams.push(`%${query}%`, `%${query}%`);
    }
    
    if (membershipStage) {
      whereClause += ' AND u.membership_stage = ?';
      queryParams.push(membershipStage);
    }
    
    if (role) {
      whereClause += ' AND u.role = ?';
      queryParams.push(role);
    }
    
    const [users] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.phone,
        u.membership_stage,
        u.is_member,
        u.role,
        u.createdAt,
        COALESCE(initial_app.approval_status, 'not_submitted') as initial_status,
        COALESCE(full_app.approval_status, 'not_submitted') as full_status
      FROM users u
      LEFT JOIN surveylog initial_app ON u.id = CAST(initial_app.user_id AS UNSIGNED) 
        AND initial_app.application_type = 'initial_application'
      LEFT JOIN surveylog full_app ON u.id = CAST(full_app.user_id AS UNSIGNED) 
        AND full_app.application_type = 'full_membership'
      ${whereClause}
      ORDER BY u.createdAt DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);
    
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `, queryParams);
    
    return successResponse(res, {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
    
  } catch (error) {
    return errorResponse(res, error);
  }
};

export const getAllReports = async (req, res) => {
  try {
    console.log('🔍 Admin reports request from user:', req.user.username);
    
    // ✅ CORRECTED: Call service function
    const reports = await membershipService.getAllReportsForAdmin();
    
    res.json({
      success: true,
      reports: reports || []
    });
  } catch (error) {
    console.error('❌ Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      details: error.message
    });
  }
};


