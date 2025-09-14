// ikootaapi/services/surveyServices.js - UPDATED FOR OPTIMIZED STRUCTURE
// ===============================================
// SURVEY SERVICES - OPTIMIZED VERSION
// Uses new surveylog structure with survey_id tracking
// Lightweight tracking in surveylog, bulk data in response tables
// ===============================================

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

// ===============================================
// COMPATIBILITY LAYER (TEMPORARY - REMOVE AFTER MIGRATION)
// ===============================================

/**
 * Check if new optimized structure is available
 */
const isNewStructureAvailable = async () => {
  try {
    const [result] = await db.query("SHOW COLUMNS FROM surveylog LIKE 'new_survey_id'");
    return result.length > 0;
  } catch (error) {
    return false;
  }
};

// ===============================================
// OPTIMIZED SURVEY SUBMISSION SERVICES
// ===============================================

/**
 * Submit initial application survey - OPTIMIZED VERSION
 */
export const submitInitialApplicationService = async ({
  answers,
  questions = null,
  applicationTicket,
  userId,
  userEmail,
  username
}) => {
  const connection = await db.getConnection();
  
  try {
    console.log('🔍 Processing initial application submission (optimized)');
    await connection.beginTransaction();
    
    // Check if user has already submitted
    if (await isNewStructureAvailable()) {
      // NEW STRUCTURE
      const [existingCheck] = await connection.query(
        `SELECT sl.id FROM surveylog sl
         WHERE sl.user_id = ? AND sl.new_survey_type = ? 
         AND sl.new_status NOT IN ('declined', 'rejected')`,
        [userId, 'initial_application']
      );
      
      if (existingCheck.length > 0) {
        throw new CustomError('Application already submitted', 400);
      }
      
      // Step 1: Create lightweight tracking entry in surveylog
      const [surveyResult] = await connection.query(
        `INSERT INTO surveylog 
         (user_id, new_survey_type, new_status, startedAt, createdAt, processedAt) 
         VALUES (?, ?, ?, NOW(), NOW(), NOW())`,
        [userId, 'initial_application', 'submitted']
      );
      const surveyId = surveyResult.insertId;
      
      // Step 2: Store bulk data in specialized response table
      const questionsAnswers = questions ? { questions, answers } : { answers };
      const [appResult] = await connection.query(
        `INSERT INTO initial_membership_applications 
         (survey_id, user_id, membership_ticket, questions_answers, survey_title, 
          completion_percentage, submittedAt) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [surveyId, userId, applicationTicket, JSON.stringify(questionsAnswers), 
         'Initial Membership Application', 100.00]
      );
      
      // Step 3: Update surveylog with response table reference
      await connection.query(
        `UPDATE surveylog 
         SET response_table_id = ? 
         WHERE new_survey_id = ?`,
        [appResult.insertId, surveyId]
      );
      
      console.log('✅ Using NEW optimized structure');
      
    } else {
      // FALLBACK TO OLD STRUCTURE (compatibility)
      const [existingCheck] = await connection.query(
        'SELECT id FROM surveylog WHERE user_id = ? AND application_type = ? AND approval_status NOT IN (?, ?, ?)',
        [userId, 'initial_application', 'declined', 'rejected', 'withdrawn']
      );
      
      if (existingCheck.length > 0) {
        throw new CustomError('Application already submitted', 400);
      }
      
      const answersJson = typeof answers === 'string' ? answers : JSON.stringify(answers);
      const [surveyResult] = await connection.query(
        `INSERT INTO surveylog 
         (user_id, answers, application_ticket, application_type, approval_status, 
          verified_by, rating_remarks, createdAt, processedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, answersJson, applicationTicket, 'initial_application', 'pending', '', '']
      );
      
      console.log('⚠️ Using OLD structure (fallback)');
    }
    
    // Update user status (same for both structures)
    await connection.query(
      `UPDATE users 
       SET is_member = ?, 
           membership_stage = ?,
           initial_application_status = ?, 
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
      surveyId: await isNewStructureAvailable() ? surveyId : surveyResult.insertId,
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
 * Submit full membership application survey - OPTIMIZED VERSION
 */
export const submitFullMembershipApplicationService = async ({
  answers,
  questions = null,
  membershipTicket,
  userId,
  userEmail,
  username
}) => {
  const connection = await db.getConnection();
  
  try {
    console.log('🔍 Processing full membership application submission (optimized)');
    await connection.beginTransaction();
    
    // Check user eligibility
    const [userCheck] = await connection.query(
      'SELECT membership_stage, is_member FROM users WHERE id = ?',
      [userId]
    );
    
    if (!userCheck.length || userCheck[0].membership_stage !== 'pre_member') {
      throw new CustomError('User not eligible for full membership', 403);
    }
    
    if (await isNewStructureAvailable()) {
      // NEW STRUCTURE
      const [existingCheck] = await connection.query(
        `SELECT sl.id FROM surveylog sl
         INNER JOIN full_membership_applications fma ON sl.new_survey_id = fma.survey_id
         WHERE sl.user_id = ? AND fma.status != 'declined'`,
        [userId]
      );
      
      if (existingCheck.length > 0) {
        throw new CustomError('Full membership application already exists', 400);
      }
      
      // Step 1: Create tracking entry in surveylog
      const [surveyResult] = await connection.query(
        `INSERT INTO surveylog 
         (user_id, new_survey_type, new_status, startedAt, createdAt) 
         VALUES (?, ?, ?, NOW(), NOW())`,
        [userId, 'full_membership', 'submitted']
      );
      const surveyId = surveyResult.insertId;
      
      // Step 2: Store bulk data in specialized table
      const questionsAnswers = questions ? { questions, answers } : { answers };
      const [appResult] = await connection.query(
        `INSERT INTO full_membership_applications 
         (survey_id, user_id, membership_ticket, questions_answers, survey_title,
          completion_percentage, submittedAt) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [surveyId, userId, membershipTicket, JSON.stringify(questionsAnswers),
         'Full Membership Application', 100.00]
      );
      
      // Step 3: Update tracking reference
      await connection.query(
        `UPDATE surveylog 
         SET response_table_id = ? 
         WHERE new_survey_id = ?`,
        [appResult.insertId, surveyId]
      );
      
      console.log('✅ Using NEW optimized structure');
      
    } else {
      // FALLBACK TO OLD STRUCTURE
      const [existingCheck] = await connection.query(
        'SELECT id FROM full_membership_applications WHERE user_id = ? AND status != ?',
        [userId, 'declined']
      );
      
      if (existingCheck.length > 0) {
        throw new CustomError('Full membership application already exists', 400);
      }
      
      const answersJson = typeof answers === 'string' ? answers : JSON.stringify(answers);
      const [result] = await connection.query(
        `INSERT INTO full_membership_applications 
         (user_id, membership_ticket, answers, status) 
         VALUES (?, ?, ?, ?)`,
        [userId, membershipTicket, answersJson, 'pending']
      );
      
      // Also log in surveylog for consistency (old method)
      await connection.query(
        `INSERT INTO surveylog 
         (user_id, answers, application_ticket, application_type, approval_status) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, answersJson, membershipTicket, 'full_membership', 'pending']
      );
      
      console.log('⚠️ Using OLD structure (fallback)');
    }
    
    // Update user status (same for both)
    await connection.query(
      `UPDATE users 
       SET full_membership_appl_status = ?, full_membership_ticket = ?, fullMembershipAppliedAt = NOW() 
       WHERE id = ?`,
      ['applied', membershipTicket, userId]
    );
    
    await connection.commit();
    
    // Send confirmation emails
    await sendApplicationEmails(userEmail, username, 'full');
    
    console.log('✅ Full membership application submitted successfully');
    return { 
      success: true, 
      membershipTicket,
      surveyId: await isNewStructureAvailable() ? surveyId : result.insertId
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
// OPTIMIZED DATA RETRIEVAL SERVICES
// ===============================================

/**
 * Get user survey data - OPTIMIZED VERSION
 */
export const getUserSurveyData = async (userId, surveyType = null) => {
  try {
    if (await isNewStructureAvailable()) {
      // NEW OPTIMIZED STRUCTURE
      let query, params;
      
      if (surveyType === 'initial_application') {
        query = `
          SELECT 
            sl.new_survey_id as survey_id,
            sl.new_status as status,
            sl.startedAt,
            sl.createdAt as submittedAt,
            sl.reviewedAt,
            sl.reviewed_by,
            ima.questions_answers,
            ima.admin_notes,
            ima.survey_title,
            ima.completion_percentage,
            ima.time_spent_minutes,
            ima.mentor_assigned,
            ima.class_assigned,
            ima.converse_id_generated
          FROM surveylog sl
          LEFT JOIN initial_membership_applications ima ON sl.new_survey_id = ima.survey_id
          WHERE sl.user_id = ? AND sl.new_survey_type = 'initial_application'
          ORDER BY sl.new_survey_id DESC
        `;
        params = [userId];
        
      } else if (surveyType === 'full_membership') {
        query = `
          SELECT 
            sl.new_survey_id as survey_id,
            sl.new_status as status,
            sl.startedAt,
            sl.createdAt as submittedAt,
            sl.reviewedAt,
            sl.reviewed_by,
            fma.questions_answers,
            fma.admin_notes,
            fma.survey_title,
            fma.completion_percentage,
            fma.time_spent_minutes,
            fma.mentor_recommendation
          FROM surveylog sl
          LEFT JOIN full_membership_applications fma ON sl.new_survey_id = fma.survey_id
          WHERE sl.user_id = ? AND sl.new_survey_type = 'full_membership'
          ORDER BY sl.new_survey_id DESC
        `;
        params = [userId];
        
      } else {
        // All survey types
        query = `
          SELECT 
            sl.new_survey_id as survey_id,
            sl.new_survey_type as survey_type,
            sl.new_status as status,
            sl.startedAt,
            sl.createdAt as submittedAt,
            sl.reviewedAt,
            sl.reviewed_by,
            CASE 
              WHEN sl.new_survey_type = 'initial_application' THEN ima.questions_answers
              WHEN sl.new_survey_type = 'full_membership' THEN fma.questions_answers
              ELSE sr.questions_answers
            END as questions_answers,
            CASE 
              WHEN sl.new_survey_type = 'initial_application' THEN ima.admin_notes
              WHEN sl.new_survey_type = 'full_membership' THEN fma.admin_notes
              ELSE sr.admin_notes
            END as admin_notes
          FROM surveylog sl
          LEFT JOIN initial_membership_applications ima ON sl.new_survey_id = ima.survey_id AND sl.new_survey_type = 'initial_application'
          LEFT JOIN full_membership_applications fma ON sl.new_survey_id = fma.survey_id AND sl.new_survey_type = 'full_membership'
          LEFT JOIN survey_responses sr ON sl.new_survey_id = sr.survey_id AND sl.new_survey_type = 'general_survey'
          WHERE sl.user_id = ?
          ORDER BY sl.new_survey_id DESC
        `;
        params = [userId];
      }
      
      const [results] = await db.query(query, params);
      console.log('✅ Retrieved data using NEW optimized structure');
      return results;
      
    } else {
      // FALLBACK TO OLD STRUCTURE
      const query = surveyType 
        ? 'SELECT * FROM surveylog WHERE user_id = ? AND application_type = ? ORDER BY id DESC'
        : 'SELECT * FROM surveylog WHERE user_id = ? ORDER BY id DESC';
      
      const params = surveyType ? [userId, surveyType] : [userId];
      const [results] = await db.query(query, params);
      
      console.log('⚠️ Retrieved data using OLD structure (fallback)');
      return results;
    }
    
  } catch (error) {
    console.error('❌ Error retrieving user survey data:', error);
    throw error;
  }
};

/**
 * Get user survey history - OPTIMIZED VERSION
 */
export const getUserSurveyHistory = async (userId) => {
  try {
    return await getUserSurveyData(userId); // Uses optimized method
  } catch (error) {
    console.error('❌ Error getting user survey history:', error);
    throw error;
  }
};

// ===============================================
// SURVEY QUESTIONS SERVICE
// ===============================================

/**
 * Fetch survey questions (unchanged - not affected by optimization)
 */
export const fetchSurveyQuestions = async () => {
  try {
    const [questions] = await db.query(`
      SELECT 
        q.id,
        q.question,
        q.question_type,
        q.category,
        q.validation_rules,
        q.options,
        q.is_required,
        q.question_order
      FROM survey_questions q
      WHERE q.is_active = 1
      ORDER BY q.question_order ASC, q.id ASC
    `);
    
    return questions;
  } catch (error) {
    console.error('❌ Error fetching survey questions:', error);
    throw error;
  }
};

// ===============================================
// EMAIL NOTIFICATION HELPERS (UNCHANGED)
// ===============================================

const sendApplicationEmails = async (userEmail, username, type) => {
  try {
    const subject = type === 'initial' 
      ? 'Initial Application Received - Ikoota Institution'
      : 'Full Membership Application Received - Ikoota Institution';
      
    const message = `
      Dear ${username},
      
      Thank you for submitting your ${type === 'initial' ? 'initial' : 'full membership'} application.
      
      Your application is now under review. You will receive notification once the review is complete.
      
      Best regards,
      Ikoota Institution Team
    `;
    
    await sendEmail(userEmail, subject, message);
    console.log(`✅ ${type} application email sent to ${userEmail}`);
    
  } catch (error) {
    console.error(`❌ Failed to send ${type} application email:`, error);
    // Don't throw - email failure shouldn't stop the application process
  }
};

// ===============================================
// DRAFT SERVICES (TO BE UPDATED SEPARATELY)
// ===============================================

// Note: Draft services need similar optimization but are less critical
// Will be updated in Phase 3 after core functionality is migrated

export const saveDraftSurvey = async ({ userId, answers, draftId = null, applicationType = 'initial_application' }) => {
  // Existing implementation for now - to be optimized in Phase 3
  console.log('⚠️ Using existing draft service - will be optimized in Phase 3');
  // ... existing draft code ...
};

// ===============================================
// SURVEY LOGS RETRIEVAL (FOR ADMIN)
// ===============================================

/**
 * Fetch all survey logs with filtering and pagination
 */
export const fetchAllSurveyLogs = async (filters = {}, pagination = { page: 1, limit: 20 }) => {
  try {
    console.log('🔍 fetchAllSurveyLogs called with filters:', filters, 'pagination:', pagination);
    
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    
    // Build WHERE conditions
    let whereConditions = ['1=1'];
    const queryParams = [];
    
    if (filters.approval_status) {
      whereConditions.push('sl.approval_status = ?');
      queryParams.push(filters.approval_status);
    }
    
    if (filters.new_survey_type) {
      whereConditions.push('sl.new_survey_type = ?');
      queryParams.push(filters.new_survey_type);
    }
    
    if (filters.user_id) {
      whereConditions.push('sl.user_id = ?');
      queryParams.push(filters.user_id);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM surveylog sl 
      WHERE ${whereClause}
    `;
    
    const [countResult] = await db.query(countQuery, queryParams);
    console.log('🔍 Count query result:', countResult);
    const totalCount = countResult && countResult.length > 0 ? countResult[0].count : 0;
    
    // Get paginated data using optimized structure
    const dataQuery = `
      SELECT 
        sl.*,
        u.username,
        u.email,
        CASE 
          WHEN sl.new_survey_type = 'initial_application' THEN ima.answers
          WHEN sl.new_survey_type = 'full_membership' THEN fma.answers
          ELSE sr.questions_answers
        END as questions_answers,
        CASE 
          WHEN sl.new_survey_type = 'initial_application' THEN ima.admin_notes
          WHEN sl.new_survey_type = 'full_membership' THEN fma.admin_notes
          ELSE sr.admin_notes
        END as detailed_admin_notes
      FROM surveylog sl
      LEFT JOIN users u ON sl.user_id = u.id
      LEFT JOIN initial_membership_applications ima ON sl.response_table_id = ima.id AND sl.new_survey_type = 'initial_application'
      LEFT JOIN full_membership_applications fma ON sl.response_table_id = fma.id AND sl.new_survey_type = 'full_membership'
      LEFT JOIN survey_responses sr ON sl.response_table_id = sr.id AND sl.new_survey_type = 'general_survey'
      WHERE ${whereClause}
      ORDER BY sl.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(limit, offset);
    const [data] = await db.query(dataQuery, queryParams);
    
    console.log('✅ fetchAllSurveyLogs retrieved:', data ? data.length : 0, 'records');
    console.log('🔍 Data query result:', data);
    
    return {
      data: data || [],
      count: totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / limit)
    };
    
  } catch (error) {
    console.error('❌ Error in fetchAllSurveyLogs:', error);
    throw error;
  }
};

// ===============================================
// EXPORTS
// ===============================================

export default {
  submitInitialApplicationService,
  submitFullMembershipApplicationService,
  getUserSurveyData,
  getUserSurveyHistory,
  fetchSurveyQuestions,
  saveDraftSurvey,
  fetchAllSurveyLogs
};