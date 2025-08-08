// ikootaapi/controllers/adminManagementController.js
// ===============================================
// ADMIN MANAGEMENT CONTROLLER
// Handles all admin functions for pre-member and full member application management
// ===============================================

import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { sendEmail, sendSMS } from '../utils/notifications.js';
import { sendEmailWithTemplate } from '../utils/email.js';
import { generateUniqueConverseId } from '../utils/idGenerator.js';
import CustomError from '../utils/CustomError.js';
import {
  getUserById,
  validateStageTransition,
  convertToCSV,
  successResponse,
  errorResponse,
  executeQuery,
  sendApprovalNotification,
  sendDeclineNotification
} from './old.membershipCore.js';
import * as membershipService from '../services/old.membershipServices_old.js';

// =============================================================================
// PRE-MEMBER APPLICATION REVIEW FUNCTIONS
// =============================================================================

/**
 * Approve pre-member application with mentor and class assignment
 * POST /approve/:userId
 */
export const approvePreMemberApplication = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { userId } = req.params;
    const { mentorId, classId, adminNotes } = req.body;
    
    console.log('✅ Approving pre-member application for user:', userId);
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Generate unique converse ID
      const converseId = await generateUniqueConverseId();
      
      // Update user with approval and assignments
      await connection.execute(`
        UPDATE users 
        SET 
          is_member = 'pre_member',
          membership_stage = 'pre_member',
          application_status = 'approved',
          application_reviewedAt = NOW(),
          reviewed_by = ?,
          converse_id = ?,
          mentor_id = ?,
          primary_class_id = ?,
          updatedAt = NOW()
        WHERE id = ?
      `, [req.user.id, converseId, mentorId, classId, userId]);
      
      // Update surveylog
      await connection.execute(`
        UPDATE surveylog 
        SET 
          approval_status = 'approved',
          reviewedAt = NOW(),
          reviewed_by = ?,
          admin_notes = ?,
          mentor_assigned = ?,
          class_assigned = ?,
          converse_id_generated = ?
        WHERE user_id = ? AND application_type = 'initial_application'
        ORDER BY createdAt DESC LIMIT 1
      `, [req.user.id, adminNotes, mentorId, classId, converseId, userId]);
      
      // Add to class membership if classId provided
      if (classId && classId !== '000000') {
        await connection.execute(`
          INSERT INTO user_class_memberships (user_id, class_id, membership_status, joinedAt)
          VALUES (?, ?, 'active', NOW())
          ON DUPLICATE KEY UPDATE membership_status = 'active'
        `, [userId, classId]);
      }
      
      // Log the approval action
      await connection.execute(`
        INSERT INTO membership_review_history 
        (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewedAt)
        VALUES (?, 'initial_application', 'pending', 'approved', ?, ?, NOW())
      `, [userId, adminNotes, req.user.id]);
      
      await connection.commit();
      connection.release();
      
      // Send approval notification (non-blocking)
      sendApprovalNotification(userId, converseId, mentorId, classId).catch(err => {
        console.warn('⚠️ Approval notification failed:', err.message);
      });
      
      res.json({
        success: true,
        message: 'Application approved successfully',
        data: {
          user_status: 'pre_member',
          converse_id: converseId,
          access_granted: 'towncrier',
          mentor_assigned: mentorId,
          class_assigned: classId
        }
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Application approval error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Decline pre-member application
 * POST /decline/:userId
 */
export const declinePreMemberApplication = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { userId } = req.params;
    const { declineReason, adminNotes } = req.body;
    
    console.log('❌ Declining pre-member application for user:', userId);
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update user with decline status
      await connection.execute(`
        UPDATE users 
        SET 
          is_member = 'rejected',
          membership_stage = 'applicant',
          application_status = 'declined',
          application_reviewedAt = NOW(),
          reviewed_by = ?,
          converse_id = '000000',
          mentor_id = '000000',
          primary_class_id = '000000',
          decline_reason = ?,
          decline_notification_sent = FALSE,
          updatedAt = NOW()
        WHERE id = ?
      `, [req.user.id, declineReason, userId]);
      
      // Update surveylog
      await connection.execute(`
        UPDATE surveylog 
        SET 
          approval_status = 'declined',
          reviewedAt = NOW(),
          reviewed_by = ?,
          admin_notes = ?,
          approval_decision_reason = ?
        WHERE user_id = ? AND application_type = 'initial_application'
        ORDER BY createdAt DESC LIMIT 1
      `, [req.user.id, adminNotes, declineReason, userId]);
      
      // Log the decline action
      await connection.execute(`
        INSERT INTO membership_review_history 
        (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewedAt)
        VALUES (?, 'initial_application', 'pending', 'declined', ?, ?, NOW())
      `, [userId, adminNotes, req.user.id]);
      
      await connection.commit();
      connection.release();
      
      // Send decline notification (non-blocking)
      sendDeclineNotification(userId, declineReason).catch(err => {
        console.warn('⚠️ Decline notification failed:', err.message);
      });
      
      res.json({
        success: true,
        message: 'Application declined',
        data: {
          user_status: 'rejected',
          decline_reason: declineReason,
          notification_sent: true
        }
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Application decline error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// =============================================================================
// PENDING APPLICATIONS MANAGEMENT
// =============================================================================

/**
 * Get pending applications with enhanced filtering and pagination
 * GET /admin/pending-applications
 */
export const getPendingApplications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'pending',
      stage = 'initial',
      sortBy = 'submittedAt', 
      sortOrder = 'DESC', 
      search = '' 
    } = req.query;
    
    console.log('🔍 Getting pending applications with filters:', {
      page, limit, status, stage, sortBy, sortOrder, search
    });
    
    // Call service function with proper parameters
    const result = await membershipService.getPendingApplicationsWithPagination({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      search,
      sortBy,
      sortOrder,
      stage
    });
    
    // Enhanced response with additional metadata
    res.json({
      success: true,
      data: {
        ...result,
        filters: { status, stage, sortBy, sortOrder, search },
        summary: {
          total_pending: result.total,
          showing: result.applications.length,
          pages: result.pagination?.totalPages || Math.ceil(result.total / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error in getPendingApplications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending applications',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update application status (Generic admin function)
 * PUT /admin/update-user-status/:userId
 */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, adminNotes, notifyUser = true, applicationType = 'initial_application' } = req.body;
    const reviewerId = req.user.id;
    
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
        memberStatus = 'pre_member';
      } else if (status === 'rejected') {
        newStage = 'applicant';
        memberStatus = 'rejected';
      }
    } else if (applicationType === 'full_membership') {
      if (status === 'approved') {
        newStage = 'member';
        memberStatus = 'member';
      }
    }
    
    // Validate transition
    if (!validateStageTransition(user.membership_stage, newStage)) {
      throw new CustomError('Invalid membership stage transition', 400);
    }
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update surveylog
      await connection.execute(`
        UPDATE surveylog 
        SET approval_status = ?, admin_notes = ?, reviewedAt = NOW(), reviewed_by = ?
        WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
        ORDER BY createdAt DESC LIMIT 1
      `, [status, adminNotes, reviewerId, userId, applicationType]);
      
      // Update user status
      await connection.execute(`
        UPDATE users 
        SET membership_stage = ?, is_member = ?, application_reviewedAt = NOW(), reviewed_by = ?
        WHERE id = ?
      `, [newStage, memberStatus, reviewerId, userId]);
      
      // Log the review action
      await connection.execute(`
        INSERT INTO membership_review_history 
        (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewedAt)
        VALUES (?, ?, 'pending', ?, ?, ?, NOW())
      `, [userId, applicationType, status, adminNotes, reviewerId]);
      
      await connection.commit();
      connection.release();
      
      // Send notification if requested (non-blocking)
      if (notifyUser) {
        try {
          const emailTemplate = status === 'approved' ? 
             `${applicationType}_approved` : `${applicationType}_rejected`;
                     
          sendEmail(user.email, emailTemplate, {
            USERNAME: user.username,
            ADMIN_NOTES: adminNotes || '',
            REVIEW_DATE: new Date().toLocaleDateString()
          }).catch(err => console.warn('Email notification failed:', err));
        } catch (emailError) {
          console.warn('Notification setup failed:', emailError);
        }
      }
      
      res.json({
        success: true,
        message: `Application ${status} successfully`,
        data: {
          newStatus: {
            membership_stage: newStage,
            approval_status: status,
            is_member: memberStatus
          }
        }
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Update application status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update application status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Bulk approve applications
 * POST /admin/bulk-approve
 */
export const bulkApproveApplications = async (req, res) => {
  try {
    const { userIds, action, adminNotes, applicationType = 'initial_application' } = req.body;
    const reviewerId = req.user.id;
    
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
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      const processedUsers = [];
      
      for (const userId of userIds) {
        try {
          const user = await getUserById(userId);
        
          let newStage = user.membership_stage;
          let memberStatus = user.is_member;
        
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
        
          // Validate transition
          if (!validateStageTransition(user.membership_stage, newStage)) {
            console.warn(`Invalid transition for user ${userId}: ${user.membership_stage} -> ${newStage}`);
            continue; // Skip this user
          }
        
          // Update surveylog
          await connection.execute(`
            UPDATE surveylog 
            SET approval_status = ?, admin_notes = ?, reviewedAt = NOW(), reviewed_by = ?
            WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
            ORDER BY createdAt DESC LIMIT 1
          `, [status, adminNotes, reviewerId, userId, applicationType]);
        
          // Update user status
          await connection.execute(`
            UPDATE users 
            SET membership_stage = ?, is_member = ?, application_reviewedAt = NOW(), reviewed_by = ?
            WHERE id = ?
          `, [newStage, memberStatus, reviewerId, userId]);
        
          // Log review
          await connection.execute(`
            INSERT INTO membership_review_history 
            (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewedAt)
            VALUES (?, ?, 'pending', ?, ?, ?, NOW())
          `, [userId, applicationType, status, adminNotes, reviewerId]);
        
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
      
      await connection.commit();
      connection.release();
      
      // Send notification emails (non-blocking)
      const emailTemplate = status === 'approved' ? 
        `${applicationType}_approved` : `${applicationType}_rejected`;
          
      const emailPromises = processedUsers.map(user => 
        sendEmail(user.email, emailTemplate, {
          USERNAME: user.username,
          ADMIN_NOTES: adminNotes || '',
          REVIEW_DATE: new Date().toLocaleDateString()
        }).catch(err => console.error('Email failed for', user.email, err))
      );
        
      // Don't wait for emails to complete
      Promise.allSettled(emailPromises);
      
      res.json({
        success: true,
        message: `Successfully ${action}ed ${processedUsers.length} out of ${userIds.length} applications`,
        data: {
          processedCount: processedUsers.length,
          requestedCount: userIds.length,
          processedUsers
        }
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Bulk approve error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process bulk operation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// =============================================================================
// FULL MEMBERSHIP MANAGEMENT
// =============================================================================

/**
 * Get pending full memberships (Admin)
 * GET /admin/pending-full-memberships
 */
export const getPendingFullMemberships = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'submittedAt', 
      sortOrder = 'DESC',
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
        sl.createdAt as submittedAt,
        sl.application_ticket,
        sl.additional_data,
        fma.first_accessedAt,
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
 * PUT /admin/review-full-membership/:applicationId
 */
export const updateFullMembershipStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, adminNotes, notifyUser = true } = req.body;
    const reviewerId = req.user.id;
    
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
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update surveylog
      await connection.execute(`
        UPDATE surveylog 
        SET approval_status = ?, admin_notes = ?, reviewedAt = NOW(), reviewed_by = ?
        WHERE id = ?
      `, [status, adminNotes, reviewerId, applicationId]);
      
      // Update user to full member if approved
      if (status === 'approved') {
        await connection.execute(`
          UPDATE users 
          SET membership_stage = 'member', is_member = 'member'
          WHERE id = ?
        `, [userId]);
      }
      
      // Log the review
      await connection.execute(`
        INSERT INTO membership_review_history 
        (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewedAt)
        VALUES (?, 'full_membership', 'pending', ?, ?, ?, NOW())
      `, [userId, status, adminNotes, reviewerId]);
      
      await connection.commit();
      connection.release();
      
      // Send notification (non-blocking)
      if (notifyUser) {
        try {
          const emailTemplate = status === 'approved' ? 'full_membership_approved' : 'full_membership_rejected';
          
          sendEmail(user.email, emailTemplate, {
            USERNAME: user.username,
            ADMIN_NOTES: adminNotes || '',
            REVIEW_DATE: new Date().toLocaleDateString()
          }).catch(err => console.warn('Email notification failed:', err));
        } catch (emailError) {
          console.warn('Notification setup failed:', emailError);
        }
      }
      
      res.json({
        success: true,
        message: `Full membership application ${status} successfully`,
        data: { userId, status }
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Update full membership status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update full membership status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// =============================================================================
// ADMIN RESOURCE MANAGEMENT
// =============================================================================

/**
 * Get available mentors for assignment
 * GET /admin/mentors
 */
export const getAvailableMentors = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const [mentors] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.converse_id,
        u.email,
        COALESCE(m.current_mentees, 0) as current_mentees,
        COALESCE(m.max_mentees, 5) as max_mentees,
        (COALESCE(m.max_mentees, 5) - COALESCE(m.current_mentees, 0)) as available_slots
      FROM users u
      LEFT JOIN mentors m ON u.converse_id = m.mentor_converse_id
      WHERE u.role IN ('admin', 'super_admin') 
        OR (u.is_member = 'member' AND u.membership_stage = 'member')
      ORDER BY available_slots DESC, u.username ASC
    `);
    
    res.json({
      success: true,
      data: {
        mentors: mentors.filter(mentor => mentor.available_slots > 0),
        total_available: mentors.filter(mentor => mentor.available_slots > 0).length,
        all_mentors: mentors.length
      }
    });
    
  } catch (error) {
    console.error('❌ Get mentors error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get available classes for assignment
 * GET /admin/classes
 */
export const getAvailableClasses = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const [classes] = await db.query(`
      SELECT 
        c.id,
        c.class_id,
        c.class_name,
        c.class_type,
        c.description,
        c.max_members,
        COALESCE(cm.current_members, 0) as current_members,
        (c.max_members - COALESCE(cm.current_members, 0)) as available_slots
      FROM classes c
      LEFT JOIN (
        SELECT 
          class_id, 
          COUNT(*) as current_members
        FROM user_class_memberships 
        WHERE membership_status = 'active'
        GROUP BY class_id
      ) cm ON c.class_id = cm.class_id
      WHERE c.is_active = 1
      ORDER BY c.class_type, available_slots DESC, c.class_name ASC
    `);
    
    res.json({
      success: true,
      data: {
        classes: classes.filter(cls => cls.available_slots > 0),
        total_available: classes.filter(cls => cls.available_slots > 0).length,
        all_classes: classes.length
      }
    });
    
  } catch (error) {
    console.error('❌ Get classes error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// =============================================================================
// NOTIFICATION FUNCTIONS
// =============================================================================

/**
 * Send notification to users (Admin)
 * POST /admin/send-notification
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
 * POST /admin/send-membership-notification
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

// =============================================================================
// REPORTS & ANALYTICS
// =============================================================================

/**
 * Get all reports for admin dashboard
 * GET /admin/reports
 */
export const getAllReports = async (req, res) => {
  try {
    console.log('🔍 Admin reports request from user:', req.user.username);
    
    // Call service function for comprehensive reports
    const reports = await membershipService.getAllReportsForAdmin();
    
    res.json({
      success: true,
      data: {
        reports: reports || [],
        generatedAt: new Date().toISOString(),
        generated_by: req.user.username
      }
    });
  } catch (error) {
    console.error('❌ Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// =============================================================================
// USER MANAGEMENT & SEARCH
// =============================================================================

/**
 * Search users (Admin)
 * GET /admin/search-users
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
      },
      searchCriteria: { query, membershipStage, role }
    });
    
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Delete user account (Admin function for user management)
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
        reason: reason || 'Admin deletion'
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
// SYSTEM HEALTH & CONFIGURATION
// =============================================================================

/**
 * Health check endpoint for membership system
 * GET /health
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
      version: '2.0.0',
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
 * Get system configuration (Admin only)
 * GET /admin/config
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
      memberStatuses: ['pending', 'granted', 'rejected', 'active', 'pre_member', 'member'],
      userRoles: ['user', 'admin', 'super_admin'],
      applicationTypes: ['initial_application', 'full_membership'],
      approvalStatuses: ['not_submitted', 'pending', 'approved', 'rejected', 'declined'],
      notificationTypes: ['email', 'sms', 'both'],
      systemLimits: {
        maxBulkOperations: 100,
        maxExportRecords: 10000,
        sessionTimeout: '7d',
        verificationCodeExpiry: '10m'
      },
      features: {
        emailNotifications: true,
        smsNotifications: process.env.SMS_ENABLED === 'true',
        bulkOperations: true,
        dataExport: true,
        analytics: true,
        mentorAssignment: true,
        classAssignment: true
      },
      adminCapabilities: {
        canApproveApplications: true,
        canDeclineApplications: true,
        canBulkProcess: true,
        canAssignMentors: true,
        canAssignClasses: true,
        canViewReports: true,
        canSendNotifications: true,
        canManageUsers: userRole === 'super_admin',
        canDeleteUsers: userRole === 'super_admin'
      }
    };
    
    return successResponse(res, { 
      config,
      userRole,
      configuredAt: new Date().toISOString()
    });
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// ADVANCED ADMIN FUNCTIONS
// =============================================================================

/**
 * Get membership overview for admin dashboard
 * GET /admin/membership-overview
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
        initial_app.reviewedAt as initial_reviewed,
        initial_reviewer.username as initial_reviewer,
        
        -- Full Membership Info  
        COALESCE(full_app.approval_status, 'not_submitted') as full_status,
        full_app.createdAt as full_submitted,
        full_app.reviewedAt as full_reviewed,
        full_reviewer.username as full_reviewer,
        
        -- Access Info
        fma.first_accessedAt as full_membership_accessed,
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
        COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending' AND application_type = 'initial_application') as pending_initial,
        (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending' AND application_type = 'full_membership') as pending_full
      FROM users
    `);
    
    return successResponse(res, {
      overview,
      summary: summary[0],
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Export membership data
 * GET /admin/export-membership-data
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
        initial_app.reviewedAt as initial_reviewed,
        COALESCE(full_app.approval_status, 'not_submitted') as full_status,
        full_app.createdAt as full_submitted,
        full_app.reviewedAt as full_reviewed
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
        totalRecords: membershipData.length,
        exportedBy: req.user.username
      });
    }
  } catch (error) {
    return errorResponse(res, error);
  }
};