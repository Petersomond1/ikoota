//ikootaapi\services\surveyServices.js
import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { sendEmail } from '../utils/email.js';
import dotenv from 'dotenv';
dotenv.config();

export const submitSurveyService = async (answers, email) => {
  try {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const user = await db.query(sql, [email]);

    if (user.length === 0) {
      throw new CustomError('no user found issue!', 400);
    }

    const userId = user[0].id;

    const insertSql = 'INSERT INTO surveylog (user_id, answers) VALUES (?, ?)';
    const savedForm = await db.query(insertSql, [userId, JSON.stringify(answers)]);

    if (savedForm.affectedRows === 0) {
      throw new CustomError('data failed to be saved in db', 500);
    }

    await db.query('UPDATE users SET is_member = ? WHERE id = ?', ['pending', userId]);

    const subject = 'Survey Submission Confirmation';
    const text = `Hello ${user[0].username},\n\nThank you for submitting the survey. Your responses have been recorded. Just give us a little time for your account application to be activated.`;
    await sendEmail(email, subject, text);

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminSubject = 'New Survey Submission Pending Approval';
    const adminText = `A new survey submission has been received from ${user[0].username}. Please review and approve the submission.`;
    await sendEmail(adminEmail, adminSubject, adminText);

    return { success: true };
  } catch (error) {
    console.log("the issue", error);
    throw new CustomError('Form submission failed', 500, error.message);
  }
};

// Fetch questions from the database
export const fetchSurveyQuestions = async () => {
  try {
    const query = 'SELECT id, question FROM survey_questions ORDER BY id ASC';
    const rows = await db.query(query);
    
    // ✅ Handle different database result formats
    let questions;
    if (Array.isArray(rows) && rows.length > 0) {
      // Check if it's MySQL2 format [rows, fields] or direct array
      if (Array.isArray(rows[0]) && typeof rows[0][0] === 'object') {
        questions = rows[0]; // MySQL2 format
      } else if (typeof rows[0] === 'object' && (rows[0].id || rows[0].question)) {
        questions = rows; // Direct array format
      } else {
        questions = [];
      }
    } else {
      questions = [];
    }
    
    // Extract just the question text for the frontend
    return questions.map(row => row.question || row);
  } catch (error) {
    console.error('❌ Error fetching survey questions:', error);
    throw new CustomError(`Failed to fetch survey questions: ${error.message}`, 500);
  }
};

// ✅ FIXED: Update questions in the database with proper SQL syntax
export const modifySurveyQuestions = async (questions) => {
  try {
    console.log('🔍 Updating survey questions:', questions);
    
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new CustomError('Questions array is required and cannot be empty', 400);
    }
    
    // Start a transaction for atomic operation
    await db.query('START TRANSACTION');
    
    try {
      // Clear existing questions
      const deleteQuery = 'DELETE FROM survey_questions';
      await db.query(deleteQuery);
      console.log('✅ Cleared existing questions');
      
      // ✅ FIXED: Insert new questions one by one (safer approach)
      const insertQuery = 'INSERT INTO survey_questions (question) VALUES (?)';
      
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (question && question.trim()) {
          await db.query(insertQuery, [question.trim()]);
          console.log(`✅ Inserted question ${i + 1}: ${question.trim()}`);
        }
      }
      
      // Commit the transaction
      await db.query('COMMIT');
      console.log('✅ Survey questions updated successfully');
      
    } catch (insertError) {
      // Rollback on error
      await db.query('ROLLBACK');
      throw insertError;
    }
    
  } catch (error) {
    console.error('❌ Error in modifySurveyQuestions:', error);
    throw new CustomError(`Failed to update survey questions: ${error.message}`, 500);
  }
};

export const fetchSurveyLogs = async () => {
  try {
    console.log('🔍 Fetching survey logs with user information...');
    
    const query = `
      SELECT 
        sl.id,
        sl.user_id,
        sl.answers,
        sl.approval_status,
        sl.createdAt,
        sl.updatedAt,
        sl.admin_notes,
        sl.application_type,
        sl.reviewedAt,
        sl.reviewed_by,
        sl.application_ticket,
        u.username,
        u.email as user_email,
        u.membership_stage,
        u.is_member
      FROM surveylog sl
      INNER JOIN users u ON sl.user_id = u.id
      ORDER BY sl.createdAt DESC
    `;
    
    const result = await db.query(query);
    console.log('🔍 Raw survey logs result:', result);
    
    // ✅ Handle different database result formats
    let rows;
    if (Array.isArray(result) && result.length > 0) {
      // Check if it's MySQL2 format [rows, fields] or direct array
      if (Array.isArray(result[0]) && typeof result[0][0] === 'object') {
        rows = result[0]; // MySQL2 format
        console.log('✅ Using MySQL2 format for survey logs');
      } else if (typeof result[0] === 'object' && result[0].id) {
        rows = result; // Direct array format
        console.log('✅ Using direct array format for survey logs');
      } else {
        rows = [];
        console.log('✅ Empty survey logs result');
      }
    } else {
      rows = [];
      console.log('✅ No survey logs found');
    }
    
    console.log(`✅ Successfully fetched ${rows.length} survey logs`);
    return rows;
    
  } catch (error) {
    console.error('❌ Error fetching survey logs:', error);
    throw new CustomError(`Failed to fetch survey logs: ${error.message}`, 500);
  }
};

// Update survey approval status in the database
// export const approveUserSurvey = async (surveyId, userId, status) => {
//   try {
//     console.log('🔍 Approving survey:', { surveyId, userId, status });
    
//     const query = `
//       UPDATE surveylog 
//       SET approval_status = ?, verified_by = ?, updatedAt = NOW() 
//       WHERE id = ? AND user_id = ?
//     `;
    
//     const result = await db.query(query, [status, 'admin', surveyId, userId]);
    
//     // ✅ Handle different result formats
//     let affectedRows;
//     if (Array.isArray(result) && result[0] && typeof result[0] === 'object') {
//       affectedRows = result[0].affectedRows || result.affectedRows;
//     } else if (result && typeof result === 'object') {
//       affectedRows = result.affectedRows;
//     } else {
//       affectedRows = 0;
//     }
    
//     if (affectedRows === 0) {
//       throw new CustomError('Survey not found or already processed', 404);
//     }
    
//     console.log('✅ Survey approval status updated successfully');
//     return { success: true, affectedRows };
    
//   } catch (error) {
//     console.error('❌ Error approving survey:', error);
//     throw new CustomError(`Failed to approve survey: ${error.message}`, 500);
//   }
// };


export const approveUserSurvey = async (surveyId, userId, status) => {
  try {
    console.log('🔍 Approving survey with full database sync:', { surveyId, userId, status });
    
    // Start database transaction for consistency
    await db.query('START TRANSACTION');
    
    try {
      // ✅ STEP 1: Update surveylog table (existing functionality)
      const updateSurveyQuery = `
        UPDATE surveylog 
        SET approval_status = ?, 
            verified_by = 'admin',
            processedAt = NOW(),
            reviewedAt = NOW(),
            admin_notes = CASE 
              WHEN ? = 'approved' THEN 'Application approved - user granted pre-member access'
              WHEN ? = 'granted' THEN 'Application granted - user granted pre-member access'  
              WHEN ? = 'declined' THEN 'Application declined by admin'
              ELSE 'Status updated by admin'
            END
        WHERE id = ? AND user_id = ?
      `;
      
      const surveyResult = await db.query(updateSurveyQuery, [
        status, status, status, status, surveyId, userId
      ]);
      
      console.log('✅ Survey log updated:', surveyResult);
      
      // ✅ STEP 2: NEW - Update users table based on approval status
      let userUpdateQuery;
      let userUpdateParams;
      
      if (status === 'approved' || status === 'granted') {
        // ✅ CRITICAL: Update user to pre-member status when approved
        userUpdateQuery = `
          UPDATE users 
          SET is_member = 'approved',
              membership_stage = 'pre',
              application_status = 'approved',
              application_reviewedAt = NOW(),
              updatedAt = NOW()
          WHERE id = ?
        `;
        userUpdateParams = [userId];
        
      } else if (status === 'declined' || status === 'denied') {
        // Update user to denied status
        userUpdateQuery = `
          UPDATE users 
          SET is_member = 'denied',
              membership_stage = 'none',
              application_status = 'declined',
              application_reviewedAt = NOW(),
              decline_reason = 'Application declined by admin',
              updatedAt = NOW()
          WHERE id = ?
        `;
        userUpdateParams = [userId];
        
      } else {
        // For pending or other statuses, keep current state but update timestamp
        userUpdateQuery = `
          UPDATE users 
          SET application_status = ?,
              updatedAt = NOW()
          WHERE id = ?
        `;
        userUpdateParams = [status, userId];
      }
      
      const userUpdateResult = await db.query(userUpdateQuery, userUpdateParams);
      console.log('✅ User table updated:', userUpdateResult);
      
      // ✅ STEP 3: NEW - Update all_applications_status table for tracking
      const statusUpdateQuery = `
        INSERT INTO all_applications_status 
        (application_type, user_id, username, email, ticket, status, submittedAt, reviewedAt, admin_notes, reviewer_name)
        SELECT 
          'initial' as application_type,
          u.id as user_id,
          u.username,
          u.email,
          u.application_ticket as ticket,
          ? as status,
          u.application_submittedAt as submittedAt,
          NOW() as reviewedAt,
          CASE 
            WHEN ? = 'approved' THEN 'Application approved - user granted pre-member access'
            WHEN ? = 'granted' THEN 'Application granted - user granted pre-member access'  
            WHEN ? = 'declined' THEN 'Application declined by admin'
            ELSE 'Status updated by admin'
          END as admin_notes,
          'admin' as reviewer_name
        FROM users u 
        WHERE u.id = ?
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          reviewedAt = VALUES(reviewedAt),
          admin_notes = VALUES(admin_notes)
      `;
      
      await db.query(statusUpdateQuery, [
        status, status, status, status, userId
      ]);
      
      // ✅ STEP 4: Commit transaction
      await db.query('COMMIT');
      console.log('✅ Transaction committed successfully');
      
      // ✅ STEP 5: Send email notification (non-blocking)
      if (status === 'approved' || status === 'granted') {
        try {
          await sendApprovalNotificationEmail(userId, status);
        } catch (emailError) {
          console.error('❌ Email notification failed (non-critical):', emailError);
        }
      }
      
    } catch (transactionError) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      console.error('❌ Transaction rolled back due to error:', transactionError);
      throw transactionError;
    }
    
    console.log('✅ Survey approval process completed successfully');
    return { 
      success: true, 
      affectedRows: 1,
      userStatusUpdated: true,
      status: status
    };
    
  } catch (error) {
    console.error('❌ Error in enhanced approveUserSurvey:', error);
    throw new CustomError(`Failed to approve survey: ${error.message}`, 500);
  }
};

// ✅ NEW HELPER: Email notification function
const sendApprovalNotificationEmail = async (userId, status) => {
  try {
    // Get user details
    const userQuery = 'SELECT email, username FROM users WHERE id = ?';
    const userResult = await db.query(userQuery, [userId]);
    
    if (!userResult || userResult.length === 0) {
      console.log('⚠️ User not found for email notification');
      return;
    }
    
    const user = userResult[0];
    
    const emailContent = {
      approved: {
        subject: 'Welcome to Ikoota - Application Approved! 🎉',
        text: `Hello ${user.username},\n\nCongratulations! Your application to join Ikoota has been approved.\n\nYou now have access to:\n- Towncrier community discussions\n- Pre-member features and content\n- Educational resources\n\nYou can log in to your account and start exploring: ${process.env.FRONTEND_URL}/towncrier\n\nWelcome to the Ikoota community!`
      },
      granted: {
        subject: 'Ikoota Access Granted - Welcome! 🎉',
        text: `Hello ${user.username},\n\nYour access to Ikoota has been granted!\n\nYou can now explore the community at: ${process.env.FRONTEND_URL}/towncrier\n\nWelcome aboard!`
      }
    };
    
    const template = emailContent[status];
    if (template && user.email) {
      await sendEmail(user.email, template.subject, template.text);
      console.log('✅ Approval email sent to:', user.email);
    }
    
  } catch (error) {
    console.error('❌ Error sending approval email:', error);
    // Don't throw error - email failure shouldn't break approval process
  }
};
