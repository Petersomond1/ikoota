// ikootaapi/controllers/membershipAdminControllers.js
// ===============================================
// MEMBERSHIP ADMIN CONTROLLERS
// Complete admin interface for membership management system
// Includes all admin functions, analytics, reporting, and user management
// ===============================================

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { membershipService } from '../services/membershipServices.js';
import { membershipAdminService } from '../services/membershipAdminServices.js';
import {
  getUserById,
  successResponse,
  errorResponse,
  executeQuery,
  validateApplicationData,
  sendMembershipEmail
} from './membershipCore.js';

// =============================================================================
// PRE-MEMBER APPLICATION REVIEW
// =============================================================================

/**
 * Get pending pre-member applications with filtering and pagination
 * GET /admin/pending-applications
 */
export const getPendingApplications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'pending',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      dateFrom,
      dateTo 
    } = req.query;

    console.log('📋 Getting pending applications with filters:', { status, page, limit, search });

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build WHERE clause
    let whereConditions = [`sl.approval_status = ?`];
    let queryParams = [status];
    
    if (search) {
      whereConditions.push(`(u.username LIKE ? OR u.email LIKE ?)`);
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (dateFrom) {
      whereConditions.push(`sl.createdAt >= ?`);
      queryParams.push(dateFrom);
    }
    
    if (dateTo) {
      whereConditions.push(`sl.createdAt <= ?`);
      queryParams.push(dateTo);
    }

    const whereClause = whereConditions.join(' AND ');
    
    // Get applications with user info
    const [applications] = await db.query(`
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
        u.username,
        u.email,
        u.phone,
        u.createdAt as user_registered,
        u.membership_stage,
        u.is_member,
        reviewer.username as reviewer_name
      FROM surveylog sl
      JOIN users u ON sl.user_id = u.id
      LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
      WHERE ${whereClause}
        AND sl.application_type = 'initial_application'
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);

    // Get total count
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM surveylog sl
      JOIN users u ON sl.user_id = u.id
      WHERE ${whereClause}
        AND sl.application_type = 'initial_application'
    `, queryParams);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit));

    // Parse answers and format response
    const formattedApplications = applications.map(app => ({
      application_id: app.application_id,
      application_ticket: app.application_ticket,
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
        answers: app.answers ? JSON.parse(app.answers) : null,
        admin_notes: app.admin_notes,
        reviewed_by: app.reviewer_name,
        reviewed_at: app.reviewedAt
      },
      review_priority: membershipAdminService.calculateReviewPriority(app)
    }));

    return successResponse(res, {
      applications: formattedApplications,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: total,
        items_per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      },
      filters: {
        status,
        search,
        date_range: { from: dateFrom, to: dateTo },
        sort: { by: sortBy, order: sortOrder }
      }
    }, `Found ${total} applications`);

  } catch (error) {
    console.error('❌ Error getting pending applications:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Approve pre-member application
 * POST /admin/approve-application/:applicationId
 */
export const approvePreMemberApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { 
      adminNotes, 
      mentorId, 
      classId,
      sendNotification = true,
      autoAssignMentor = false 
    } = req.body;
    
    const adminId = req.user.id;
    const adminUsername = req.user.username;

    console.log('✅ Approving application:', applicationId, 'by admin:', adminUsername);

    // Get application details
    const [applications] = await db.query(`
      SELECT sl.*, u.username, u.email, u.membership_stage
      FROM surveylog sl
      JOIN users u ON sl.user_id = u.id
      WHERE sl.id = ? AND sl.application_type = 'initial_application'
    `, [applicationId]);

    if (applications.length === 0) {
      throw new CustomError('Application not found', 404);
    }

    const application = applications[0];
    
    if (application.approval_status === 'approved') {
      throw new CustomError('Application already approved', 400);
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update application status
      await connection.execute(`
        UPDATE surveylog 
        SET approval_status = 'approved',
            reviewed_by = ?,
            reviewedAt = NOW(),
            admin_notes = ?
        WHERE id = ?
      `, [adminId, adminNotes || 'Approved for pre-membership', applicationId]);

      // Update user status to pre-member
      await connection.execute(`
        UPDATE users 
        SET membership_stage = 'pre_member',
            is_member = 'granted',
            application_status = 'approved',
            applicationReviewedAt = NOW(),
            mentor_id = ?,
            primary_class_id = ?
        WHERE id = ?
      `, [mentorId || null, classId || null, application.user_id]);

      // Auto-assign mentor if requested
      let assignedMentorId = mentorId;
      if (autoAssignMentor && !mentorId) {
        assignedMentorId = await membershipAdminService.autoAssignMentor(application.user_id);
        if (assignedMentorId) {
          await connection.execute(`
            UPDATE users SET mentor_id = ? WHERE id = ?
          `, [assignedMentorId, application.user_id]);
        }
      }

      // Log the approval
      await connection.execute(`
        INSERT INTO membership_review_history 
        (user_id, application_type, previous_status, new_status, reviewer_id, review_notes, action_taken, reviewedAt)
        VALUES (?, 'initial_application', ?, 'approved', ?, ?, 'approved_application', NOW())
      `, [
        application.user_id, 
        application.approval_status, 
        adminId, 
        adminNotes || 'Application approved for pre-membership'
      ]);

      await connection.commit();
      connection.release();

      // Send notification email
      if (sendNotification) {
        try {
          await sendMembershipEmail(application.email, 'application_approved', {
            username: application.username,
            adminNotes: adminNotes,
            nextSteps: [
              'Access Towncrier content with your pre-member status',
              'Connect with your assigned mentor (if applicable)',
              'Consider applying for full membership when ready'
            ]
          });
        } catch (emailError) {
          console.warn('📧 Email notification failed:', emailError.message);
        }
      }

      return successResponse(res, {
        application_id: applicationId,
        user: {
          id: application.user_id,
          username: application.username,
          email: application.email,
          new_status: 'pre_member'
        },
        review: {
          approved_by: adminUsername,
          approved_at: new Date().toISOString(),
          admin_notes: adminNotes,
          assigned_mentor_id: assignedMentorId,
          assigned_class_id: classId
        },
        notification_sent: sendNotification
      }, 'Application approved successfully');

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error approving application:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Decline pre-member application
 * POST /admin/decline-application/:applicationId
 */
export const declinePreMemberApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { 
      reason, 
      adminNotes, 
      allowResubmission = true,
      sendNotification = true 
    } = req.body;
    
    const adminId = req.user.id;
    const adminUsername = req.user.username;

    if (!reason) {
      throw new CustomError('Decline reason is required', 400);
    }

    console.log('❌ Declining application:', applicationId, 'reason:', reason);

    // Get application details
    const [applications] = await db.query(`
      SELECT sl.*, u.username, u.email
      FROM surveylog sl
      JOIN users u ON sl.user_id = u.id
      WHERE sl.id = ? AND sl.application_type = 'initial_application'
    `, [applicationId]);

    if (applications.length === 0) {
      throw new CustomError('Application not found', 404);
    }

    const application = applications[0];

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update application status
      await connection.execute(`
        UPDATE surveylog 
        SET approval_status = 'declined',
            reviewed_by = ?,
            reviewedAt = NOW(),
            admin_notes = ?,
            decline_reason = ?
        WHERE id = ?
      `, [adminId, adminNotes || reason, reason, applicationId]);

      // Update user status
      await connection.execute(`
        UPDATE users 
        SET application_status = 'declined',
            is_member = 'rejected',
            applicationReviewedAt = NOW(),
            decline_reason = ?
        WHERE id = ?
      `, [reason, application.user_id]);

      // Log the decline
      await connection.execute(`
        INSERT INTO membership_review_history 
        (user_id, application_type, previous_status, new_status, reviewer_id, review_notes, action_taken, reviewedAt)
        VALUES (?, 'initial_application', ?, 'declined', ?, ?, 'declined_application', NOW())
      `, [
        application.user_id, 
        application.approval_status, 
        adminId, 
        `Declined: ${reason}. Notes: ${adminNotes || 'None'}`
      ]);

      await connection.commit();
      connection.release();

      // Send notification email
      if (sendNotification) {
        try {
          await sendMembershipEmail(application.email, 'application_declined', {
            username: application.username,
            reason: reason,
            adminNotes: adminNotes,
            canResubmit: allowResubmission,
            resubmissionGuidance: allowResubmission ? [
              'Review the feedback provided',
              'Improve your application based on the comments',
              'Resubmit when you feel ready'
            ] : null
          });
        } catch (emailError) {
          console.warn('📧 Email notification failed:', emailError.message);
        }
      }

      return successResponse(res, {
        application_id: applicationId,
        user: {
          id: application.user_id,
          username: application.username,
          email: application.email
        },
        review: {
          declined_by: adminUsername,
          declined_at: new Date().toISOString(),
          reason: reason,
          admin_notes: adminNotes,
          can_resubmit: allowResubmission
        },
        notification_sent: sendNotification
      }, 'Application declined');

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error declining application:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Bulk review applications
 * POST /admin/bulk-review-applications
 */
export const bulkReviewApplications = async (req, res) => {
  try {
    const { 
      applicationIds, 
      action, 
      reason, 
      adminNotes,
      autoAssignMentors = false 
    } = req.body;
    
    const adminId = req.user.id;
    const adminUsername = req.user.username;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      throw new CustomError('Application IDs array is required', 400);
    }

    if (!['approve', 'decline'].includes(action)) {
      throw new CustomError('Action must be approve or decline', 400);
    }

    if (action === 'decline' && !reason) {
      throw new CustomError('Reason is required for bulk decline', 400);
    }

    if (applicationIds.length > 50) {
      throw new CustomError('Maximum 50 applications per bulk operation', 400);
    }

    console.log(`🔄 Bulk ${action} for ${applicationIds.length} applications by ${adminUsername}`);

    return await membershipAdminService.bulkProcessApplications({
      applicationIds,
      action,
      reason,
      adminNotes,
      adminId,
      adminUsername,
      autoAssignMentors
    });

  } catch (error) {
    console.error('❌ Bulk review error:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// FULL MEMBERSHIP MANAGEMENT
// =============================================================================

/**
 * Get pending full membership applications
 * GET /admin/pending-full-memberships
 */
export const getPendingFullMemberships = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    console.log('📋 Getting pending full membership applications');

    const [applications] = await db.query(`
      SELECT 
        fma.*,
        u.username,
        u.email,
        u.phone,
        u.membership_stage,
        u.createdAt as user_registered,
        u.mentor_id,
        mentor.username as mentor_name,
        reviewer.username as reviewer_name
      FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      LEFT JOIN users mentor ON u.mentor_id = mentor.id
      LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
      WHERE fma.status = ?
      ORDER BY fma.submittedAt ASC
      LIMIT ? OFFSET ?
    `, [status, parseInt(limit), offset]);

    // Get total count
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM full_membership_applications fma
      WHERE fma.status = ?
    `, [status]);

    const total = countResult[0].total;

    const formattedApplications = applications.map(app => ({
      id: app.id,
      membership_ticket: app.membership_ticket,
      user: {
        id: app.user_id,
        username: app.username,
        email: app.email,
        phone: app.phone,
        registered_at: app.user_registered,
        membership_stage: app.membership_stage,
        mentor: app.mentor_name
      },
      application: {
        questions_answers: app.questions_answers ? JSON.parse(app.questions_answers) : null,
        submitted_at: app.submittedAt,
        status: app.status,
        admin_notes: app.admin_notes,
        reviewed_by: app.reviewer_name,
        reviewed_at: app.reviewedAt
      }
    }));

    return successResponse(res, {
      applications: formattedApplications,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    }, `Found ${total} pending full membership applications`);

  } catch (error) {
    console.error('❌ Error getting pending full memberships:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Review full membership application
 * POST /admin/review-full-membership/:applicationId
 */
export const reviewFullMembershipApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { 
      action, 
      adminNotes, 
      reason,
      sendNotification = true 
    } = req.body;
    
    const adminId = req.user.id;
    const adminUsername = req.user.username;

    if (!['approve', 'decline'].includes(action)) {
      throw new CustomError('Action must be approve or decline', 400);
    }

    console.log(`${action === 'approve' ? '✅' : '❌'} Reviewing full membership:`, applicationId);

    // Get application details
    const [applications] = await db.query(`
      SELECT fma.*, u.username, u.email
      FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      WHERE fma.id = ?
    `, [applicationId]);

    if (applications.length === 0) {
      throw new CustomError('Full membership application not found', 404);
    }

    const application = applications[0];

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update application status
      await connection.execute(`
        UPDATE full_membership_applications 
        SET status = ?,
            reviewed_by = ?,
            reviewedAt = NOW(),
            admin_notes = ?,
            decline_reason = ?
        WHERE id = ?
      `, [action === 'approve' ? 'approved' : 'declined', adminId, adminNotes, reason || null, applicationId]);

      if (action === 'approve') {
        // Update user to full member
        await connection.execute(`
          UPDATE users 
          SET membership_stage = 'member',
              full_membership_status = 'approved',
              fullMembershipReviewedAt = NOW()
          WHERE id = ?
        `, [application.user_id]);

        // Create access record
        await connection.execute(`
          INSERT INTO full_membership_access (user_id, access_granted_date, granted_by)
          VALUES (?, NOW(), ?)
          ON DUPLICATE KEY UPDATE access_granted_date = NOW(), granted_by = ?
        `, [application.user_id, adminId, adminId]);
      } else {
        // Update user status for decline
        await connection.execute(`
          UPDATE users 
          SET full_membership_status = 'declined',
              fullMembershipReviewedAt = NOW()
          WHERE id = ?
        `, [application.user_id]);
      }

      // Log the review
      await connection.execute(`
        INSERT INTO membership_review_history 
        (user_id, application_type, previous_status, new_status, reviewer_id, review_notes, action_taken, reviewedAt)
        VALUES (?, 'full_membership', ?, ?, ?, ?, ?, NOW())
      `, [
        application.user_id, 
        application.status, 
        action === 'approve' ? 'approved' : 'declined',
        adminId, 
        adminNotes || reason,
        `${action}_full_membership`
      ]);

      await connection.commit();
      connection.release();

      // Send notification
      if (sendNotification) {
        try {
          const emailTemplate = action === 'approve' ? 'full_membership_approved' : 'full_membership_declined';
          await sendMembershipEmail(application.email, emailTemplate, {
            username: application.username,
            adminNotes: adminNotes,
            reason: reason,
            nextSteps: action === 'approve' ? [
              'Access full Iko content and features',
              'Participate in advanced member activities',
              'Connect with the full member community'
            ] : [
              'Review the feedback provided',
              'Continue as a pre-member with Towncrier access',
              'Consider reapplying in the future'
            ]
          });
        } catch (emailError) {
          console.warn('📧 Email notification failed:', emailError.message);
        }
      }

      return successResponse(res, {
        application_id: applicationId,
        user: {
          id: application.user_id,
          username: application.username,
          new_status: action === 'approve' ? 'member' : 'pre_member'
        },
        review: {
          action: action,
          reviewed_by: adminUsername,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
          reason: reason
        },
        notification_sent: sendNotification
      }, `Full membership application ${action}d successfully`);

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error reviewing full membership application:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Bulk review full membership applications
 * POST /admin/bulk-review-full-memberships
 */
export const bulkReviewFullMemberships = async (req, res) => {
  try {
    const { applicationIds, action, reason, adminNotes } = req.body;
    
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      throw new CustomError('Application IDs array is required', 400);
    }

    if (!['approve', 'decline'].includes(action)) {
      throw new CustomError('Action must be approve or decline', 400);
    }

    console.log(`🔄 Bulk ${action} full memberships:`, applicationIds.length);

    return await membershipAdminService.bulkProcessFullMembershipApplications({
      applicationIds,
      action,
      reason,
      adminNotes,
      adminId: req.user.id,
      adminUsername: req.user.username
    });

  } catch (error) {
    console.error('❌ Bulk full membership review error:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// ADMIN RESOURCES & UTILITIES
// =============================================================================

/**
 * Get available mentors
 * GET /admin/available-mentors
 */
export const getAvailableMentors = async (req, res) => {
  try {
    const [mentors] = await db.query(`
      SELECT 
        id,
        username,
        email,
        role,
        createdAt,
        (SELECT COUNT(*) FROM users WHERE mentor_id = m.id) as current_mentees
      FROM users m
      WHERE role IN ('admin', 'super_admin', 'mentor')
        AND id != ?
      ORDER BY current_mentees ASC, username ASC
    `, [req.user.id]);

    return successResponse(res, {
      mentors: mentors.map(mentor => ({
        id: mentor.id,
        username: mentor.username,
        email: mentor.email,
        role: mentor.role,
        current_mentees: mentor.current_mentees,
        available: mentor.current_mentees < 10 // Configurable limit
      }))
    });

  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Get available classes
 * GET /admin/available-classes
 */
export const getAvailableClasses = async (req, res) => {
  try {
    const [classes] = await db.query(`
      SELECT 
        id,
        class_name,
        description,
        max_members,
        (SELECT COUNT(*) FROM user_class_memberships WHERE class_id = c.id) as current_members,
        created_by,
        createdAt
      FROM classes c
      WHERE is_active = 1
      ORDER BY class_name ASC
    `);

    return successResponse(res, {
      classes: classes.map(cls => ({
        id: cls.id,
        name: cls.class_name,
        description: cls.description,
        current_members: cls.current_members,
        max_members: cls.max_members,
        has_space: cls.current_members < cls.max_members,
        created_at: cls.createdAt
      }))
    });

  } catch (error) {
    return errorResponse(res, error);
  }
};

// =============================================================================
// ANALYTICS & REPORTING
// =============================================================================

/**
 * Get membership analytics
 * GET /admin/analytics
 */
export const getMembershipAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    console.log('📊 Generating membership analytics for period:', period);
    
    const analytics = await membershipService.getMembershipAnalytics(period);
    
    return successResponse(res, analytics, 'Analytics generated successfully');

  } catch (error) {
    console.error('❌ Analytics error:', error);
    return errorResponse(res, error);
  }
};

/**
 * Get all reports
 * GET /admin/reports
 */
export const getAllReports = async (req, res) => {
  try {
    console.log('📈 Generating all admin reports');
    
    const reports = await membershipService.getAllReportsForAdmin();
    
    return successResponse(res, reports, 'All reports generated successfully');

  } catch (error) {
    console.error('❌ Reports error:', error);
    return errorResponse(res, error);
  }
};

/**
 * Export membership data
 * GET /admin/export
 */
export const exportMembershipData = async (req, res) => {
  try {
    const { format = 'json', includePersonalData = false } = req.query;
    
    // Only super admins can export personal data
    if (includePersonalData === 'true' && req.user.role !== 'super_admin') {
      throw new CustomError('Super admin privileges required for personal data export', 403);
    }
    
    console.log('📤 Exporting membership data, format:', format);
    
    const exportData = await membershipAdminService.exportMembershipData({
      format,
      includePersonalData: includePersonalData === 'true',
      exportedBy: req.user.username
    });
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="membership_export_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(exportData);
    }
    
    return successResponse(res, exportData, 'Data exported successfully');

  } catch (error) {
    console.error('❌ Export error:', error);
    return errorResponse(res, error);
  }
};

// =============================================================================
// NOTIFICATIONS
// =============================================================================

/**
 * Send notification to user(s)
 * POST /admin/send-notification
 */
export const sendNotification = async (req, res) => {
  try {
    const { 
      recipients, 
      subject, 
      message, 
      type = 'general',
      sendEmail = true 
    } = req.body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new CustomError('Recipients array is required', 400);
    }
    
    if (!subject || !message) {
      throw new CustomError('Subject and message are required', 400);
    }
    
    console.log('📧 Sending notifications to', recipients.length, 'recipients');
    
    const result = await membershipAdminService.sendBulkNotifications({
      recipients,
      subject,
      message,
      type,
      sendEmail,
      sentBy: req.user.username
    });
    
    return successResponse(res, result, 'Notifications sent successfully');

  } catch (error) {
    console.error('❌ Notification error:', error);
    return errorResponse(res, error);
  }
};

// =============================================================================
// USER MANAGEMENT
// =============================================================================

/**
 * Search users with filters
 * GET /admin/search-users
 */
export const searchUsers = async (req, res) => {
  try {
    const { 
      query, 
      membershipStage, 
      role, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereConditions = ['1 = 1'];
    let queryParams = [];
    
    if (query) {
      whereConditions.push('(username LIKE ? OR email LIKE ?)');
      queryParams.push(`%${query}%`, `%${query}%`);
    }
    
    if (membershipStage) {
      whereConditions.push('membership_stage = ?');
      queryParams.push(membershipStage);
    }
    
    if (role) {
      whereConditions.push('role = ?');
      queryParams.push(role);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const [users] = await db.query(`
      SELECT 
        id,
        username,
        email,
        phone,
        role,
        membership_stage,
        is_member,
        createdAt,
        last_login,
        mentor_id,
        primary_class_id
      FROM users
      WHERE ${whereClause}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);
    
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM users
      WHERE ${whereClause}
    `, queryParams);
    
    const total = countResult[0].total;
    
    return successResponse(res, {
      users,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    return errorResponse(res, error);
  }
};

// =============================================================================
// SYSTEM & CONFIGURATION
// =============================================================================

/**
 * Get system configuration
 * GET /admin/system-config
 */
export const getSystemConfig = async (req, res) => {
  try {
    const config = {
      membership_settings: {
        auto_approve_applications: false,
        require_mentor_assignment: true,
        max_applications_per_day: 50,
        review_timeout_days: 7
      },
      notification_settings: {
        email_notifications_enabled: true,
        sms_notifications_enabled: false,
        admin_notification_emails: ['admin@ikootaapi.com']
      },
      system_limits: {
        max_bulk_operations: 100,
        max_export_records: 10000,
        session_timeout_minutes: 120
      },
      feature_flags: {
        advanced_analytics: true,
        auto_mentor_assignment: true,
        bulk_operations: true,
        data_export: true
      }
    };
    
    return successResponse(res, config);

  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * System health check
 * GET /admin/health
 */
export const healthCheck = async (req, res) => {
  try {
    // Check database connectivity
    await executeQuery('SELECT 1 as health_check');
    
    // Get system stats
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_applications,
        (SELECT COUNT(*) FROM full_membership_applications WHERE status = 'pending') as pending_full_memberships
    `);
    
    return res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      statistics: stats[0]
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
 * Delete user account (Super Admin only)
 * DELETE /admin/users/:userId
 */
export const deleteUserAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
        
    // Only super admins can delete user accounts
    if (req.user.role !== 'super_admin') {
      throw new CustomError('Super admin privileges required', 403);
    }
        
    // Get current user
    const user = await getUserById(userId);
    
    // Prevent deletion of other admins
    if (['admin', 'super_admin'].includes(user.role) && adminId !== parseInt(userId)) {
      throw new CustomError('Cannot delete other admin accounts', 403);
    }
        
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Log the deletion
      await connection.execute(`
        INSERT INTO user_deletion_log (user_id, username, email, reason, deleted_by, deletedAt)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [userId, user.username, user.email, reason || 'Admin deletion', adminId]);
            
      // Delete related data
      await connection.execute('DELETE FROM surveylog WHERE CAST(user_id AS UNSIGNED) = ?', [userId]);
      await connection.execute('DELETE FROM full_membership_applications WHERE user_id = ?', [userId]);
      await connection.execute('DELETE FROM full_membership_access WHERE user_id = ?', [userId]);
      await connection.execute('DELETE FROM membership_review_history WHERE user_id = ?', [userId]);
      await connection.execute('DELETE FROM user_class_memberships WHERE user_id = ?', [userId]);
            
      // Delete user
      await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
      
      await connection.commit();
      connection.release();
            
      return successResponse(res, {
        deletedUser: {
          id: userId,
          username: user.username,
          email: user.email
        },
        deletedBy: req.user.username,
        reason: reason || 'Admin deletion',
        deletedAt: new Date().toISOString()
      }, 'User account deleted successfully');
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
        
  } catch (error) {
    console.error('❌ Delete user account error:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// SYSTEM STATUS & MONITORING
// =============================================================================

/**
 * Get membership system health status
 * GET /admin/system-health
 */
export const getSystemHealth = async (req, res) => {
  try {
    // Check database connectivity
    await executeQuery('SELECT 1 as health_check');
    
    // Get critical system metrics
    const [systemMetrics] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'user' OR role IS NULL) as total_users,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending' AND application_type = 'initial_application') as pending_initial,
        (SELECT COUNT(*) FROM full_membership_applications WHERE status = 'pending') as pending_full,
        (SELECT COUNT(*) FROM users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_users_24h,
        (SELECT COUNT(*) FROM surveylog WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_applications_24h,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending' AND createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY)) as overdue_applications,
        (SELECT AVG(DATEDIFF(reviewedAt, createdAt)) FROM surveylog WHERE reviewedAt IS NOT NULL AND reviewedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as avg_review_time_days
    `);
    
    const metrics = systemMetrics[0];
    
    // Determine health status
    let status = 'healthy';
    const alerts = [];
    
    if (metrics.overdue_applications > 10) {
      status = 'warning';
      alerts.push('High number of overdue applications');
    }
    
    if (metrics.avg_review_time_days > 7) {
      status = 'warning';
      alerts.push('Average review time exceeds 7 days');
    }
    
    if (metrics.pending_initial > 50) {
      status = 'warning';
      alerts.push('High volume of pending initial applications');
    }
    
    return successResponse(res, {
      status,
      timestamp: new Date().toISOString(),
      metrics,
      alerts,
      recommendations: alerts.length > 0 ? [
        'Consider increasing review capacity',
        'Implement automated review workflows',
        'Add more admin reviewers'
      ] : ['System operating normally']
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
 * Get detailed membership funnel analysis
 * GET /admin/funnel-analysis
 */
export const getFunnelAnalysis = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    
    const [funnelData] = await db.query(`
      SELECT 
        -- Registration to Application
        COUNT(DISTINCT u.id) as total_registrations,
        COUNT(DISTINCT CASE WHEN sl.id IS NOT NULL THEN u.id END) as submitted_applications,
        ROUND(COUNT(DISTINCT CASE WHEN sl.id IS NOT NULL THEN u.id END) * 100.0 / COUNT(DISTINCT u.id), 2) as application_rate,
        
        -- Application to Approval
        COUNT(DISTINCT CASE WHEN sl.approval_status = 'approved' THEN u.id END) as approved_initial,
        ROUND(COUNT(DISTINCT CASE WHEN sl.approval_status = 'approved' THEN u.id END) * 100.0 / NULLIF(COUNT(DISTINCT CASE WHEN sl.id IS NOT NULL THEN u.id END), 0), 2) as approval_rate,
        
        -- Pre-member to Full Application
        COUNT(DISTINCT CASE WHEN fma.id IS NOT NULL THEN u.id END) as submitted_full_applications,
        ROUND(COUNT(DISTINCT CASE WHEN fma.id IS NOT NULL THEN u.id END) * 100.0 / NULLIF(COUNT(DISTINCT CASE WHEN sl.approval_status = 'approved' THEN u.id END), 0), 2) as full_application_rate,
        
        -- Full Application to Approval
        COUNT(DISTINCT CASE WHEN fma.status = 'approved' THEN u.id END) as approved_full,
        ROUND(COUNT(DISTINCT CASE WHEN fma.status = 'approved' THEN u.id END) * 100.0 / NULLIF(COUNT(DISTINCT CASE WHEN fma.id IS NOT NULL THEN u.id END), 0), 2) as full_approval_rate,
        
        -- Overall Conversion
        ROUND(COUNT(DISTINCT CASE WHEN fma.status = 'approved' THEN u.id END) * 100.0 / COUNT(DISTINCT u.id), 2) as overall_conversion_rate
        
      FROM users u
      LEFT JOIN surveylog sl ON u.id = sl.user_id AND sl.application_type = 'initial_application'
      LEFT JOIN full_membership_applications fma ON u.id = fma.user_id
      WHERE u.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND (u.role = 'user' OR u.role IS NULL)
    `, [days]);
    
    // Get drop-off analysis
    const [dropOffData] = await db.query(`
      SELECT 
        'Registered but no application' as stage,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY) AND (role = 'user' OR role IS NULL)), 2) as percentage
      FROM users u
      LEFT JOIN surveylog sl ON u.id = sl.user_id AND sl.application_type = 'initial_application'
      WHERE u.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND (u.role = 'user' OR u.role IS NULL)
        AND sl.id IS NULL
        
      UNION ALL
      
      SELECT 
        'Applied but not approved' as stage,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY) AND (role = 'user' OR role IS NULL)), 2) as percentage
      FROM users u
      JOIN surveylog sl ON u.id = sl.user_id AND sl.application_type = 'initial_application'
      WHERE u.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND (u.role = 'user' OR u.role IS NULL)
        AND sl.approval_status != 'approved'
        
      UNION ALL
      
      SELECT 
        'Pre-member but no full application' as stage,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY) AND (role = 'user' OR role IS NULL)), 2) as percentage
      FROM users u
      LEFT JOIN full_membership_applications fma ON u.id = fma.user_id
      WHERE u.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND (u.role = 'user' OR u.role IS NULL)
        AND u.membership_stage = 'pre_member'
        AND fma.id IS NULL
        
      ORDER BY count DESC
    `, [days, days, days, days, days]);
    
    return successResponse(res, {
      period,
      funnel: funnelData[0],
      dropOffAnalysis: dropOffData,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Generate comprehensive admin report
 * GET /admin/generate-report
 */
export const generateComprehensiveReport = async (req, res) => {
  try {
    const { format = 'json', includeUserData = false } = req.query;
    
    console.log('📊 Generating comprehensive admin report...');
    
    // Use the service function for comprehensive reports
    const reports = await membershipService.getAllReportsForAdmin();
    
    // Add additional analysis
    const [additionalMetrics] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as active_users_30d,
        (SELECT COUNT(*) FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as active_users_7d,
        (SELECT COUNT(*) FROM audit_logs WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as admin_actions_24h,
        (SELECT COUNT(DISTINCT user_id) FROM full_membership_access WHERE last_accessedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as active_content_users
    `);
    
    const comprehensiveReport = {
      ...reports,
      additionalMetrics: additionalMetrics[0],
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.username,
      adminRole: req.user.role,
      reportScope: includeUserData === 'true' ? 'detailed' : 'summary'
    };
    
    if (format === 'csv') {
      // Convert key metrics to CSV format
      const csvData = convertToCSV([
        { metric: 'Total Users', value: reports.membershipDistribution.data.reduce((sum, item) => sum + item.count, 0) },
        { metric: 'Pending Applications', value: reports.systemHealth.data.pending_applications },
        { metric: 'Active Users (30d)', value: additionalMetrics[0].active_users_30d },
        { metric: 'Admin Actions (24h)', value: additionalMetrics[0].admin_actions_24h }
      ]);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="admin_report_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvData);
    }
    
    return successResponse(res, comprehensiveReport);
    
  } catch (error) {
    console.error('❌ Error generating comprehensive report:', error);
    return errorResponse(res, error);
  }
};

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Batch user operations (Super Admin only)
 * POST /admin/batch-operations
 */
export const performBatchOperations = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      throw new CustomError('Super admin privileges required', 403);
    }
    
    const { operation, userIds, parameters = {} } = req.body;
    
    if (!operation || !Array.isArray(userIds) || userIds.length === 0) {
      throw new CustomError('Operation and user IDs required', 400);
    }
    
    if (userIds.length > 100) {
      throw new CustomError('Maximum 100 users per batch operation', 400);
    }
    
    const validOperations = ['reset_membership', 'assign_mentor', 'assign_class', 'update_role'];
    if (!validOperations.includes(operation)) {
      throw new CustomError(`Invalid operation. Must be one of: ${validOperations.join(', ')}`, 400);
    }
    
    console.log(`🔧 Performing batch operation: ${operation} for ${userIds.length} users`);
    
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    const results = [];
    const errors = [];
    
    try {
      for (const userId of userIds) {
        try {
          const user = await getUserById(userId);
          
          switch (operation) {
            case 'reset_membership':
              await connection.execute(`
                UPDATE users 
                SET membership_stage = 'none', is_member = 'pending', 
                    full_membership_status = NULL, updatedAt = NOW()
                WHERE id = ?
              `, [userId]);
              results.push({ userId, username: user.username, action: 'membership_reset' });
              break;
              
            case 'assign_mentor':
              const { mentorId } = parameters;
              if (!mentorId) throw new Error('Mentor ID required for assign_mentor operation');
              
              await connection.execute(`
                UPDATE users SET mentor_id = ?, updatedAt = NOW() WHERE id = ?
              `, [mentorId, userId]);
              results.push({ userId, username: user.username, action: 'mentor_assigned', mentorId });
              break;
              
            case 'assign_class':
              const { classId } = parameters;
              if (!classId) throw new Error('Class ID required for assign_class operation');
              
              await connection.execute(`
                INSERT INTO user_class_memberships (user_id, class_id, membership_status, joinedAt)
                VALUES (?, ?, 'active', NOW())
                ON DUPLICATE KEY UPDATE membership_status = 'active'
              `, [userId, classId]);
              results.push({ userId, username: user.username, action: 'class_assigned', classId });
              break;
              
            case 'update_role':
              const { newRole } = parameters;
              if (!newRole) throw new Error('New role required for update_role operation');
              
              await connection.execute(`
                UPDATE users SET role = ?, updatedAt = NOW() WHERE id = ?
              `, [newRole, userId]);
              results.push({ userId, username: user.username, action: 'role_updated', newRole });
              break;
          }
        } catch (userError) {
          errors.push({ userId, error: userError.message });
        }
      }
      
      // Log batch operation
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'batch_operation', ?, NOW())
      `, [req.user.id, JSON.stringify({
        operation,
        totalUsers: userIds.length,
        successCount: results.length,
        errorCount: errors.length,
        parameters,
        performedBy: req.user.username,
        timestamp: new Date().toISOString()
      })]);
      
      await connection.commit();
      connection.release();
      
      return successResponse(res, {
        operation,
        totalRequested: userIds.length,
        successCount: results.length,
        errorCount: errors.length,
        results,
        errors,
        performedBy: req.user.username,
        timestamp: new Date().toISOString()
      }, `Batch operation ${operation} completed`);
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Batch operation error:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Emergency user reset (Super Admin only)
 * POST /admin/emergency-reset/:userId
 */
export const emergencyUserReset = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      throw new CustomError('Super admin privileges required', 403);
    }
    
    const { userId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      throw new CustomError('Reset reason is required', 400);
    }
    
    console.log('🚨 Emergency user reset for:', userId, 'reason:', reason);
    
    const user = await getUserById(userId);
    
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Reset user membership status
      await connection.execute(`
        UPDATE users 
        SET membership_stage = 'none',
            is_member = 'pending',
            application_status = 'not_submitted',
            full_membership_status = NULL,
            applicationSubmittedAt = NULL,
            applicationReviewedAt = NULL,
            fullMembershipAppliedAt = NULL,
            fullMembershipReviewedAt = NULL,
            decline_reason = NULL,
            mentor_id = NULL,
            updatedAt = NOW()
        WHERE id = ?
      `, [userId]);
      
      // Archive current applications
      await connection.execute(`
        UPDATE surveylog 
        SET approval_status = 'archived_reset',
            admin_notes = CONCAT(COALESCE(admin_notes, ''), ' | EMERGENCY RESET: ', ?)
        WHERE user_id = ?
      `, [reason, userId]);
      
      await connection.execute(`
        UPDATE full_membership_applications 
        SET status = 'archived_reset',
            admin_notes = CONCAT(COALESCE(admin_notes, ''), ' | EMERGENCY RESET: ', ?)
        WHERE user_id = ?
      `, [reason, userId]);
      
      // Log the reset
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'emergency_reset', ?, NOW())
      `, [req.user.id, JSON.stringify({
        targetUserId: userId,
        targetUsername: user.username,
        reason: reason,
        resetBy: req.user.username,
        timestamp: new Date().toISOString()
      })]);
      
      await connection.commit();
      connection.release();
      
      return successResponse(res, {
        user: {
          id: userId,
          username: user.username,
          new_status: 'reset_to_none'
        },
        reset: {
          performed_by: req.user.username,
          reason: reason,
          reset_at: new Date().toISOString()
        }
      }, 'Emergency user reset completed');
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Emergency reset error:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert data to CSV format
 */
function convertToCSV(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => 
        JSON.stringify(row[header] || '')
      ).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

// =============================================================================
// EXPORT ALL FUNCTIONS
// =============================================================================

export default {
  // Pre-Member Application Review
  getPendingApplications,
  approvePreMemberApplication,
  declinePreMemberApplication,
  bulkReviewApplications,
  
  // Full Membership Management
  getPendingFullMemberships,
  reviewFullMembershipApplication,
  bulkReviewFullMemberships,
  
  // Admin Resources
  getAvailableMentors,
  getAvailableClasses,
  
  // Analytics & Reporting
  getMembershipAnalytics,
  getAllReports,
  exportMembershipData,
  getFunnelAnalysis,
  generateComprehensiveReport,
  
  // Notifications
  sendNotification,
  
  // User Management
  searchUsers,
  
  // System & Configuration
  getSystemConfig,
  healthCheck,
  getSystemHealth,
  
  // Batch Operations
  performBatchOperations,
  
  // Emergency Functions
  emergencyUserReset,
  deleteUserAccount
};