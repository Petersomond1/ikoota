// ikootaapi/services/surveyServices.js
// SURVEY SERVICES - Business logic for survey operations
// Handles database operations, email notifications, and data processing

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

// ===============================================
// SURVEY SUBMISSION SERVICES
// ===============================================

/**
 * Submit initial application survey
 * Compatible with preMemberApplicationController
 */
export const submitInitialApplicationService = async ({
  answers,
  applicationTicket,
  userId,
  userEmail,
  username
}) => {
  const connection = await db.getConnection();
  
  try {
    console.log('🔍 Processing initial application submission');
    await connection.beginTransaction();
    
    // Check if user has already submitted
    const [existingCheck] = await connection.query(
      'SELECT id FROM surveylog WHERE user_id = ? AND application_type = ? AND approval_status NOT IN (?, ?, ?)',
      [userId, 'initial_application', 'declined', 'rejected', 'withdrawn']
    );
    
    if (existingCheck.length > 0) {
      throw new CustomError('Application already submitted', 400);
    }
    
    // Insert survey log with all required fields for compatibility
    const answersJson = typeof answers === 'string' ? answers : JSON.stringify(answers);
    const [surveyResult] = await connection.query(
      `INSERT INTO surveylog 
       (user_id, answers, application_ticket, application_type, approval_status, 
        verified_by, rating_remarks, createdAt, processedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, answersJson, applicationTicket, 'initial_application', 'pending', '', '', ]
    );
    
    // Update user status to match membership controller expectations
    await connection.query(
      `UPDATE users 
       SET is_member = ?, 
           membership_stage = ?,
           application_status = ?, 
           application_ticket = ?, 
           applicationSubmittedAt = NOW(),
           updatedAt = NOW()
       WHERE id = ?`,
      ['pending', 'applicant', 'submitted', applicationTicket, userId]
    );
    
    await connection.commit();
    
    // Send confirmation emails (non-blocking)
    sendApplicationEmails(userEmail, username, 'initial').catch(err => {
      console.error('Email sending failed (non-critical):', err);
    });
    
    console.log('✅ Initial application submitted successfully');
    return { 
      success: true, 
      applicationTicket,
      surveyId: surveyResult.insertId,
      userId,
      username
    };
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error submitting initial application:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Submit full membership application survey
 */
export const submitFullMembershipApplicationService = async ({
  answers,
  membershipTicket,
  userId,
  userEmail,
  username
}) => {
  const connection = await db.getConnection();
  
  try {
    console.log('🔍 Processing full membership application submission');
    await connection.beginTransaction();
    
    // Check user eligibility
    const [userCheck] = await connection.query(
      'SELECT membership_stage, is_member FROM users WHERE id = ?',
      [userId]
    );
    
    if (!userCheck.length || userCheck[0].membership_stage !== 'pre_member') {
      throw new CustomError('User not eligible for full membership', 403);
    }
    
    // Check for existing full membership application
    const [existingCheck] = await connection.query(
      'SELECT id FROM full_membership_applications WHERE user_id = ? AND status != ?',
      [userId, 'declined']
    );
    
    if (existingCheck.length > 0) {
      throw new CustomError('Full membership application already exists', 400);
    }
    
    // Insert full membership application
    const answersJson = typeof answers === 'string' ? answers : JSON.stringify(answers);
    const [result] = await connection.query(
      `INSERT INTO full_membership_applications 
       (user_id, membership_ticket, answers, status) 
       VALUES (?, ?, ?, ?)`,
      [userId, membershipTicket, answersJson, 'pending']
    );
    
    // Update user status
    await connection.query(
      `UPDATE users 
       SET full_membership_status = ?, full_membership_ticket = ?, fullMembershipAppliedAt = NOW() 
       WHERE id = ?`,
      ['applied', membershipTicket, userId]
    );
    
    // Also log in surveylog for consistency
    await connection.query(
      `INSERT INTO surveylog 
       (user_id, answers, application_ticket, application_type, approval_status) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, answersJson, membershipTicket, 'full_membership', 'pending']
    );
    
    await connection.commit();
    
    // Send confirmation emails
    await sendApplicationEmails(userEmail, username, 'full');
    
    console.log('✅ Full membership application submitted successfully');
    return { 
      success: true, 
      membershipTicket,
      applicationId: result.insertId 
    };
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error submitting full membership application:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// ===============================================
// SURVEY DRAFT SERVICES (NEW)
// ===============================================

/**
 * Save survey draft for users or admins
 * Allows both users and admins to save incomplete survey responses
 */
export const saveDraftSurvey = async ({
  userId,
  answers,
  draftId = null,
  applicationType = 'initial_application',
  adminId = null,
  adminNotes = null
}) => {
  const connection = await db.getConnection();
  
  try {
    console.log('🔍 Saving survey draft:', { userId, applicationType, draftId, adminId });
    
    await connection.beginTransaction();
    
    // Validate user exists
    const [userCheck] = await connection.query(
      'SELECT id, username, role FROM users WHERE id = ?',
      [userId]
    );
    
    if (userCheck.length === 0) {
      throw new CustomError('User not found', 404);
    }
    
    const user = userCheck[0];
    const isAdmin = adminId && (user.role === 'admin' || user.role === 'super_admin');
    
    // Process answers
    const answersJson = typeof answers === 'string' ? answers : JSON.stringify(answers);
    
    if (draftId) {
      // Update existing draft
      const [existingDraft] = await connection.query(
        'SELECT id, user_id FROM survey_drafts WHERE id = ? AND user_id = ?',
        [draftId, userId]
      );
      
      if (existingDraft.length === 0) {
        throw new CustomError('Draft not found or access denied', 404);
      }
      
      await connection.query(
        `UPDATE survey_drafts 
         SET answers = ?, 
             application_type = ?,
             admin_notes = ?,
             saved_by_admin_id = ?,
             updatedAt = NOW()
         WHERE id = ? AND user_id = ?`,
        [answersJson, applicationType, adminNotes, adminId, draftId, userId]
      );
      
      console.log('✅ Draft updated successfully');
      
    } else {
      // Create new draft
      // Check for existing draft of same type
      const [existingCheck] = await connection.query(
        'SELECT id FROM survey_drafts WHERE user_id = ? AND application_type = ?',
        [userId, applicationType]
      );
      
      if (existingCheck.length > 0) {
        // Update existing draft instead
        await connection.query(
          `UPDATE survey_drafts 
           SET answers = ?, 
               admin_notes = ?,
               saved_by_admin_id = ?,
               updatedAt = NOW()
           WHERE user_id = ? AND application_type = ?`,
          [answersJson, adminNotes, adminId, userId, applicationType]
        );
        
        draftId = existingCheck[0].id;
      } else {
        // Insert new draft
        const [result] = await connection.query(
          `INSERT INTO survey_drafts 
           (user_id, answers, application_type, admin_notes, saved_by_admin_id, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [userId, answersJson, applicationType, adminNotes, adminId]
        );
        
        draftId = result.insertId;
      }
      
      console.log('✅ Draft saved successfully');
    }
    
    await connection.commit();
    
    // Log the action
    await connection.query(
      `INSERT INTO audit_logs (user_id, action, details, createdAt)
       VALUES (?, ?, ?, NOW())`,
      [
        adminId || userId, 
        isAdmin ? 'admin_save_survey_draft' : 'user_save_survey_draft',
        JSON.stringify({
          targetUserId: userId,
          draftId,
          applicationType,
          answerCount: Array.isArray(answers) ? answers.length : Object.keys(answers || {}).length,
          savedBy: isAdmin ? 'admin' : 'user'
        })
      ]
    );
    
    return {
      success: true,
      draftId,
      userId,
      applicationType,
      savedBy: isAdmin ? 'admin' : 'user',
      message: 'Draft saved successfully'
    };
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error saving survey draft:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get survey drafts for a user
 */
export const getUserSurveyDrafts = async (userId, applicationType = null) => {
  try {
    let query = `
      SELECT 
        id,
        answers,
        application_type,
        admin_notes,
        saved_by_admin_id,
        createdAt,
        updatedAt
      FROM survey_drafts 
      WHERE user_id = ?
    `;
    const params = [userId];
    
    if (applicationType) {
      query += ' AND application_type = ?';
      params.push(applicationType);
    }
    
    query += ' ORDER BY updatedAt DESC';
    
    const [drafts] = await db.query(query, params);
    
    // Parse answers if JSON
    const processedDrafts = drafts.map(draft => ({
      ...draft,
      answers: draft.answers ? (typeof draft.answers === 'string' ? 
        (() => { try { return JSON.parse(draft.answers); } catch(e) { return draft.answers; } })() 
        : draft.answers) : null
    }));
    
    return processedDrafts;
    
  } catch (error) {
    console.error('❌ Error fetching survey drafts:', error);
    throw new CustomError('Failed to fetch survey drafts', 500);
  }
};

/**
 * Delete survey draft
 */
export const deleteSurveyDraft = async (draftId, userId, adminId = null) => {
  try {
    // Check if user owns the draft or if admin is deleting
    const [draftCheck] = await db.query(
      'SELECT user_id FROM survey_drafts WHERE id = ?',
      [draftId]
    );
    
    if (draftCheck.length === 0) {
      throw new CustomError('Draft not found', 404);
    }
    
    // Allow if user owns draft or if admin is deleting
    const canDelete = draftCheck[0].user_id === userId || adminId;
    
    if (!canDelete) {
      throw new CustomError('Access denied', 403);
    }
    
    const [result] = await db.query(
      'DELETE FROM survey_drafts WHERE id = ?',
      [draftId]
    );
    
    if (result.affectedRows === 0) {
      throw new CustomError('Draft not found', 404);
    }
    
    // Log the action
    await db.query(
      `INSERT INTO audit_logs (user_id, action, details, createdAt)
       VALUES (?, ?, ?, NOW())`,
      [
        adminId || userId,
        adminId ? 'admin_delete_survey_draft' : 'user_delete_survey_draft',
        JSON.stringify({
          draftId,
          targetUserId: draftCheck[0].user_id,
          deletedBy: adminId ? 'admin' : 'user'
        })
      ]
    );
    
    return { success: true, affectedRows: result.affectedRows };
    
  } catch (error) {
    console.error('❌ Error deleting survey draft:', error);
    throw error;
  }
};

// ===============================================
// SURVEY RETRIEVAL SERVICES
// ===============================================

/**
 * Fetch survey questions from database
 */
export const fetchSurveyQuestions = async () => {
  try {
    const [rows] = await db.query(
      'SELECT id, question FROM survey_questions WHERE is_active = 1 ORDER BY question_order ASC'
    );
    
    return rows.map(row => row.question);
  } catch (error) {
    console.error('❌ Error fetching survey questions:', error);
    throw new CustomError('Failed to fetch survey questions', 500);
  }
};

/**
 * Check user's survey status
 * Compatible with membership controllers
 */
export const checkUserSurveyStatus = async (userId) => {
  try {
    // Check initial application with proper user_id handling
    const [surveyCheck] = await db.query(
      `SELECT id, approval_status, createdAt, reviewedAt, application_ticket,
              admin_notes, verified_by, rating_remarks
       FROM surveylog 
       WHERE user_id = ? AND application_type = ? 
       ORDER BY createdAt DESC LIMIT 1`,
      [userId, 'initial_application']
    );
    
    // Check full membership application
    const [fullMemberCheck] = await db.query(
      `SELECT id, status, submittedAt, reviewedAt, membership_ticket
       FROM full_membership_applications 
       WHERE user_id = ? 
       ORDER BY submittedAt DESC LIMIT 1`,
      [userId]
    );
    
    // Get user's current status with all required fields
    const [userStatus] = await db.query(
      `SELECT membership_stage, is_member, full_membership_status, 
              application_status, converse_id, mentor_id, primary_class_id
       FROM users WHERE id = ?`,
      [userId]
    );
    
    const latestSurvey = surveyCheck[0] || null;
    const hasSurvey = latestSurvey !== null;
    const surveyCompleted = hasSurvey && 
                           latestSurvey.answers && 
                           latestSurvey.answers.trim() !== '' &&
                           latestSurvey.approval_status === 'approved';
    
    return {
      hasInitialApplication: surveyCheck.length > 0,
      initialApplicationStatus: surveyCheck[0]?.approval_status || null,
      hasFullMembershipApplication: fullMemberCheck.length > 0,
      fullMembershipStatus: fullMemberCheck[0]?.status || null,
      currentMembershipStage: userStatus[0]?.membership_stage || 'none',
      currentMemberStatus: userStatus[0]?.is_member || 'pending',
      survey_completed: surveyCompleted,
      survey_data: latestSurvey,
      needs_survey: !hasSurvey || !surveyCompleted,
      user_details: userStatus[0] || {}
    };
    
  } catch (error) {
    console.error('❌ Error checking survey status:', error);
    throw new CustomError('Failed to check survey status', 500);
  }
};

/**
 * Get user's survey history
 */
export const getUserSurveyHistory = async (userId) => {
  try {
    const [history] = await db.query(
      `SELECT 
        id,
        application_type,
        approval_status,
        createdAt,
        reviewedAt,
        admin_notes,
        application_ticket
       FROM surveylog 
       WHERE user_id = ? 
       ORDER BY createdAt DESC`,
      [userId]
    );
    
    return history;
  } catch (error) {
    console.error('❌ Error fetching survey history:', error);
    throw new CustomError('Failed to fetch survey history', 500);
  }
};

// ===============================================
// SURVEY MANAGEMENT SERVICES
// ===============================================

/**
 * Update user survey response
 */
export const updateUserSurveyResponse = async (surveyId, userId, answers) => {
  try {
    const answersJson = typeof answers === 'string' ? answers : JSON.stringify(answers);
    
    const [result] = await db.query(
      `UPDATE surveylog 
       SET answers = ?, updatedAt = NOW() 
       WHERE id = ? AND user_id = ? AND approval_status = ?`,
      [answersJson, surveyId, userId, 'pending']
    );
    
    if (result.affectedRows === 0) {
      throw new CustomError('Survey not found or cannot be updated', 404);
    }
    
    return { affectedRows: result.affectedRows };
  } catch (error) {
    console.error('❌ Error updating survey response:', error);
    throw error;
  }
};

/**
 * Delete user survey response
 */
export const deleteUserSurveyResponse = async (surveyId, userId) => {
  try {
    const [result] = await db.query(
      `DELETE FROM surveylog 
       WHERE id = ? AND user_id = ? AND approval_status = ?`,
      [surveyId, userId, 'pending']
    );
    
    if (result.affectedRows === 0) {
      throw new CustomError('Survey not found or cannot be deleted', 404);
    }
    
    return { affectedRows: result.affectedRows };
  } catch (error) {
    console.error('❌ Error deleting survey response:', error);
    throw error;
  }
};

// ===============================================
// ADMIN SURVEY SERVICES
// ===============================================

/**
 * Fetch all survey logs with filters
 * Enhanced for membership admin compatibility
 */
export const fetchAllSurveyLogs = async (filters = {}, pagination = {}) => {
  try {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (filters.approval_status) {
      whereClause += ' AND sl.approval_status = ?';
      params.push(filters.approval_status);
    }
    
    if (filters.application_type) {
      whereClause += ' AND sl.application_type = ?';
      params.push(filters.application_type);
    }
    
    if (filters.membership_stage) {
      whereClause += ' AND u.membership_stage = ?';
      params.push(filters.membership_stage);
    }
    
    if (filters.search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ? OR sl.application_ticket LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (filters.startDate) {
      whereClause += ' AND sl.createdAt >= ?';
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      whereClause += ' AND sl.createdAt <= ?';
      params.push(filters.endDate);
    }
    
    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM surveylog sl 
       INNER JOIN users u ON sl.user_id = u.id
       ${whereClause}`,
      params
    );
    
    // Get paginated results with all necessary fields for membership admin
    const query = `
      SELECT 
        sl.*,
        u.username,
        u.email as user_email,
        u.membership_stage,
        u.is_member,
        u.converse_id,
        u.mentor_id,
        u.primary_class_id,
        u.application_status,
        u.applicationSubmittedAt,
        u.applicationReviewedAt,
        reviewer.username as reviewed_by_name
      FROM surveylog sl
      INNER JOIN users u ON sl.user_id = u.id
      LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
      ${whereClause}
      ORDER BY sl.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    
    const [logs] = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);
    
    // Parse answers if JSON string
    const processedLogs = logs.map(log => ({
      ...log,
      answers: log.answers ? (typeof log.answers === 'string' ? 
        (() => { try { return JSON.parse(log.answers); } catch(e) { return log.answers; } })() 
        : log.answers) : null
    }));
    
    return {
      data: processedLogs,
      count: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit)
    };
    
  } catch (error) {
    console.error('❌ Error fetching survey logs:', error);
    throw new CustomError('Failed to fetch survey logs', 500);
  }
};

/**
 * Approve survey submission with full database sync
 * Enhanced to work with membership controllers
 */
export const approveSurveySubmission = async ({
  surveyId,
  userId,
  status,
  adminNotes,
  reviewedBy,
  reviewerName,
  mentorId,
  classId,
  converseId
}) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Update surveylog with all required fields
    await connection.query(
      `UPDATE surveylog 
       SET approval_status = ?, 
           admin_notes = ?,
           reviewedAt = NOW(),
           reviewed_by = ?,
           verified_by = ?,
           rating_remarks = ?,
           mentor_assigned = ?,
           class_assigned = ?,
           converse_id_generated = ?,
           updatedAt = NOW()
       WHERE id = ? AND user_id = ?`,
      [
        status, 
        adminNotes, 
        reviewedBy, 
        reviewerName || 'admin',
        status === 'approved' ? 'Approved by admin' : 'Reviewed by admin',
        mentorId || null,
        classId || null,
        converseId || null,
        surveyId, 
        userId
      ]
    );
    
    // Update user status based on approval with proper stage transitions
    if (status === 'approved' || status === 'granted') {
      // For initial application approval
      await connection.query(
        `UPDATE users 
         SET is_member = 'pre_member',
             membership_stage = 'pre_member',
             application_status = 'approved',
             applicationReviewedAt = NOW(),
             reviewed_by = ?,
             converse_id = COALESCE(?, converse_id),
             mentor_id = COALESCE(?, mentor_id),
             primary_class_id = COALESCE(?, primary_class_id),
             updatedAt = NOW()
         WHERE id = ?`,
        [reviewedBy, converseId, mentorId, classId, userId]
      );
      
      // Add to class membership if classId provided
      if (classId && classId !== '000000') {
        await connection.query(
          `INSERT INTO user_class_memberships 
           (user_id, class_id, membership_status, joinedAt)
           VALUES (?, ?, 'active', NOW())
           ON DUPLICATE KEY UPDATE membership_status = 'active'`,
          [userId, classId]
        );
      }
    } else if (status === 'declined' || status === 'rejected') {
      await connection.query(
        `UPDATE users 
         SET is_member = 'rejected',
             membership_stage = 'applicant',
             application_status = 'declined',
             applicationReviewedAt = NOW(),
             decline_reason = ?,
             reviewed_by = ?,
             updatedAt = NOW()
         WHERE id = ?`,
        [adminNotes || 'Application declined by admin', reviewedBy, userId]
      );
    }
    
    // Log in membership review history for audit trail
    await connection.query(
      `INSERT INTO membership_review_history 
       (user_id, application_type, application_id, reviewer_id, 
        previous_status, new_status, review_notes, action_taken, reviewedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId, 
        'initial_application', 
        surveyId, 
        reviewedBy, 
        'pending', 
        status, 
        adminNotes,
        status === 'approved' ? 'approve' : 'decline'
      ]
    );
    
    // Create audit log
    await connection.query(
      `INSERT INTO audit_logs (user_id, action, details, createdAt)
       VALUES (?, ?, ?, NOW())`,
      [reviewedBy, 'survey_approval', JSON.stringify({
        surveyId,
        userId,
        decision: status,
        adminNotes,
        mentorId,
        classId,
        converseId,
        timestamp: new Date().toISOString()
      })]
    );
    
    await connection.commit();
    
    // Send notification email (non-blocking)
    if (status === 'approved' || status === 'granted') {
      sendApprovalEmail(userId).catch(err => {
        console.error('Email notification failed (non-critical):', err);
      });
    }
    
    return { 
      success: true, 
      userStatusUpdated: true,
      status,
      membershipStage: status === 'approved' ? 'pre_member' : 'applicant'
    };
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error approving survey:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Bulk approve survey submissions
 */
export const bulkApproveSurveySubmissions = async ({
  surveyIds,
  status,
  adminNotes,
  reviewedBy,
  reviewerName
}) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    let processed = 0;
    const errors = [];
    
    for (const surveyId of surveyIds) {
      try {
        // Get user ID for this survey
        const [surveyData] = await connection.query(
          'SELECT user_id FROM surveylog WHERE id = ?',
          [surveyId]
        );
        
        if (surveyData.length > 0) {
          await approveSurveySubmission({
            surveyId,
            userId: surveyData[0].user_id,
            status,
            adminNotes,
            reviewedBy,
            reviewerName
          });
          processed++;
        }
      } catch (error) {
        errors.push({ surveyId, error: error.message });
      }
    }
    
    await connection.commit();
    
    return {
      processed,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error in bulk approval:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get survey analytics data
 */
export const getSurveyAnalyticsData = async ({ startDate, endDate, groupBy }) => {
  try {
    const params = [];
    let dateFilter = '';
    
    if (startDate) {
      dateFilter += ' AND createdAt >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      dateFilter += ' AND createdAt <= ?';
      params.push(endDate);
    }
    
    // Get status breakdown
    const [statusBreakdown] = await db.query(
      `SELECT 
        approval_status,
        application_type,
        COUNT(*) as count
       FROM surveylog
       WHERE 1=1 ${dateFilter}
       GROUP BY approval_status, application_type`,
      params
    );
    
    // Get daily/weekly/monthly trends
    let timeGrouping = 'DATE(createdAt)';
    if (groupBy === 'week') {
      timeGrouping = 'YEARWEEK(createdAt)';
    } else if (groupBy === 'month') {
      timeGrouping = 'DATE_FORMAT(createdAt, "%Y-%m")';
    }
    
    const [trends] = await db.query(
      `SELECT 
        ${timeGrouping} as period,
        COUNT(*) as total,
        SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN approval_status = 'declined' THEN 1 ELSE 0 END) as declined,
        SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM surveylog
       WHERE 1=1 ${dateFilter}
       GROUP BY period
       ORDER BY period DESC`,
      params
    );
    
    return {
      statusBreakdown,
      trends,
      summary: {
        total: statusBreakdown.reduce((sum, item) => sum + item.count, 0),
        pending: statusBreakdown.filter(s => s.approval_status === 'pending').reduce((sum, item) => sum + item.count, 0),
        approved: statusBreakdown.filter(s => s.approval_status === 'approved').reduce((sum, item) => sum + item.count, 0),
        declined: statusBreakdown.filter(s => s.approval_status === 'declined').reduce((sum, item) => sum + item.count, 0)
      }
    };
    
  } catch (error) {
    console.error('❌ Error fetching survey analytics:', error);
    throw new CustomError('Failed to fetch survey analytics', 500);
  }
};

/**
 * Export survey data to CSV
 */
export const exportSurveyDataToCSV = async (filters = {}) => {
  try {
    const { data } = await fetchAllSurveyLogs(filters, { page: 1, limit: 10000 });
    
    if (data.length === 0) {
      return 'No data to export';
    }
    
    // Create CSV header
    const headers = [
      'ID',
      'User ID',
      'Username',
      'Email',
      'Application Type',
      'Status',
      'Submitted At',
      'Reviewed At',
      'Admin Notes'
    ];
    
    // Create CSV rows
    const rows = data.map(survey => [
      survey.id,
      survey.user_id,
      survey.username,
      survey.user_email,
      survey.application_type,
      survey.approval_status,
      survey.createdAt,
      survey.reviewedAt || '',
      survey.admin_notes || ''
    ]);
    
    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csvContent;
    
  } catch (error) {
    console.error('❌ Error exporting survey data:', error);
    throw new CustomError('Failed to export survey data', 500);
  }
};

/**
 * Get specific survey details
 */
export const getSurveyDetailsById = async (surveyId) => {
  try {
    const [survey] = await db.query(
      `SELECT 
        sl.*,
        u.username,
        u.email as user_email,
        u.membership_stage,
        u.is_member,
        u.phone,
        u.createdAt as user_created_at
       FROM surveylog sl
       INNER JOIN users u ON sl.user_id = u.id
       WHERE sl.id = ?`,
      [surveyId]
    );
    
    if (survey.length === 0) {
      return null;
    }
    
    // Parse answers if JSON
    try {
      survey[0].answers = JSON.parse(survey[0].answers);
    } catch (e) {
      // Keep as is if not valid JSON
    }
    
    return survey[0];
    
  } catch (error) {
    console.error('❌ Error fetching survey details:', error);
    throw new CustomError('Failed to fetch survey details', 500);
  }
};

/**
 * Delete survey log by ID
 */
export const deleteSurveyLogById = async (surveyId) => {
  try {
    const [result] = await db.query(
      'DELETE FROM surveylog WHERE id = ?',
      [surveyId]
    );
    
    if (result.affectedRows === 0) {
      throw new CustomError('Survey not found', 404);
    }
    
    return { affectedRows: result.affectedRows };
    
  } catch (error) {
    console.error('❌ Error deleting survey log:', error);
    throw error;
  }
};

// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Send application confirmation emails
 */
async function sendApplicationEmails(userEmail, username, type) {
  try {
    // User confirmation email
    const userSubject = type === 'full' 
      ? 'Full Membership Application Received'
      : 'Application Submission Confirmation';
      
    const userText = `Hello ${username},\n\nThank you for submitting your ${type === 'full' ? 'full membership' : ''} application. We have received your submission and it is currently under review.\n\nYou will be notified once a decision has been made.\n\nBest regards,\nIkoota Team`;
    
    await sendEmail(userEmail, userSubject, userText);
    
    // Admin notification email
    if (process.env.ADMIN_EMAIL) {
      const adminSubject = `New ${type === 'full' ? 'Full Membership' : 'Initial'} Application`;
      const adminText = `A new ${type === 'full' ? 'full membership' : 'initial'} application has been submitted by ${username} (${userEmail}).\n\nPlease review the application in the admin panel.`;
      
      await sendEmail(process.env.ADMIN_EMAIL, adminSubject, adminText);
    }
    
  } catch (error) {
    console.error('❌ Error sending application emails:', error);
    // Don't throw - email failure shouldn't break submission
  }
}

/**
 * Send approval notification email
 */
async function sendApprovalEmail(userId) {
  try {
    const [user] = await db.query(
      'SELECT email, username FROM users WHERE id = ?',
      [userId]
    );
    
    if (user.length > 0 && user[0].email) {
      const subject = 'Welcome to Ikoota - Application Approved! 🎉';
      const text = `Hello ${user[0].username},\n\nCongratulations! Your application has been approved.\n\nYou now have access to the Ikoota community features.\n\nWelcome aboard!\n\nBest regards,\nIkoota Team`;
      
      await sendEmail(user[0].email, subject, text);
    }
  } catch (error) {
    console.error('❌ Error sending approval email:', error);
  }
}

export default {
  submitInitialApplicationService,
  submitFullMembershipApplicationService,
  fetchSurveyQuestions,
  checkUserSurveyStatus,
  getUserSurveyHistory,
  updateUserSurveyResponse,
  deleteUserSurveyResponse,
  fetchAllSurveyLogs,
  approveSurveySubmission,
  bulkApproveSurveySubmissions,
  getSurveyAnalyticsData,
  exportSurveyDataToCSV,
  getSurveyDetailsById,
  deleteSurveyLogById,
  // New draft functions
  saveDraftSurvey,
  getUserSurveyDrafts,
  deleteSurveyDraft
};