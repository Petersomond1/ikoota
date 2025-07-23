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
        sl.reviewed_at,
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
export const approveUserSurvey = async (surveyId, userId, status) => {
  try {
    console.log('🔍 Approving survey:', { surveyId, userId, status });
    
    const query = `
      UPDATE surveylog 
      SET approval_status = ?, verified_by = ?, updated_at = NOW() 
      WHERE id = ? AND user_id = ?
    `;
    
    const result = await db.query(query, [status, 'admin', surveyId, userId]);
    
    // ✅ Handle different result formats
    let affectedRows;
    if (Array.isArray(result) && result[0] && typeof result[0] === 'object') {
      affectedRows = result[0].affectedRows || result.affectedRows;
    } else if (result && typeof result === 'object') {
      affectedRows = result.affectedRows;
    } else {
      affectedRows = 0;
    }
    
    if (affectedRows === 0) {
      throw new CustomError('Survey not found or already processed', 404);
    }
    
    console.log('✅ Survey approval status updated successfully');
    return { success: true, affectedRows };
    
  } catch (error) {
    console.error('❌ Error approving survey:', error);
    throw new CustomError(`Failed to approve survey: ${error.message}`, 500);
  }
};


// //ikootaapi\services\surveyServices.js
// import db from '../config/db.js';
// import CustomError from '../utils/CustomError.js';
// import { sendEmail } from '../utils/email.js';
// import dotenv from 'dotenv';
// dotenv.config();

// export const submitSurveyService = async (answers, email) => {
//   try {
//     const sql = 'SELECT * FROM users WHERE email = ?';
//     const user = await db.query(sql, [email]);

//     if (user.length === 0) {
//       throw new CustomError('no user found issue!', 400);
//     }

//     const userId = user[0].id;

//     const insertSql = 'INSERT INTO surveylog (user_id, answers) VALUES (?, ?)';
//     const savedForm = await db.query(insertSql, [userId, JSON.stringify(answers)]);

//     if (savedForm.affectedRows === 0) {
//       throw new CustomError('data failed to be saved in db', 500);
//     }

//     await db.query('UPDATE users SET is_member = ? WHERE id = ?', ['pending', userId]);

//     const subject = 'Survey Submission Confirmation';
//     const text = `Hello ${user[0].username},\n\nThank you for submitting the survey. Your responses have been recorded. Just give us a little time for your account application to be activated.`;
//     await sendEmail(email, subject, text);

//     const adminEmail = process.env.ADMIN_EMAIL;
//     const adminSubject = 'New Survey Submission Pending Approval';
//     const adminText = `A new survey submission has been received from ${user[0].username}. Please review and approve the submission.`;
//     await sendEmail(adminEmail, adminSubject, adminText);

//     return { success: true };
//   } catch (error) {
//     console.log("the issue", error);
//     throw new CustomError('Form submission failed', 500, error.message);
//   }
// };


// // Fetch questions from the database
// export const fetchSurveyQuestions = async () => {
//   const query = 'SELECT id, question FROM survey_questions';
//   const rows = await db.query(query);
//   return rows;
// };

// // Update questions in the database
// export const modifySurveyQuestions = async (questions) => {
//   const deleteQuery = 'DELETE FROM survey_questions';
//   const insertQuery = 'INSERT INTO survey_questions (question) VALUES ?';
  
//   await db.query(deleteQuery); // Clear old questions
//   const values = questions.map((question) => [question]);
//   await db.query(insertQuery, [values]); // Insert new questions
// };

// // Fetch survey logs from the database
// // export const fetchSurveyLogs = async () => {
// //   const query = 'SELECT * FROM surveylog';
// //   const rows = await db.query(query);
// //   return rows;
// // };

// export const fetchSurveyLogs = async () => {
//   try {
//     console.log('🔍 Fetching survey logs with user information...');
    
//     const query = `
//       SELECT 
//         sl.id,
//         sl.user_id,
//         sl.answers,
//         sl.approval_status,
//         sl.createdAt,
//         sl.updatedAt,
//         sl.admin_notes,
//         sl.application_type,
//         sl.reviewed_at,
//         sl.reviewed_by,
//         sl.application_ticket,
//         u.username,
//         u.email as user_email,
//         u.membership_stage,
//         u.is_member
//       FROM surveylog sl
//       INNER JOIN users u ON sl.user_id = u.id
//       ORDER BY sl.createdAt DESC
//     `;
    
//     const result = await db.query(query);
//     console.log('🔍 Raw survey logs result:', result);
    
//     // ✅ Handle different database result formats
//     let rows;
//     if (Array.isArray(result) && result.length > 0) {
//       // Check if it's MySQL2 format [rows, fields] or direct array
//       if (Array.isArray(result[0]) && typeof result[0][0] === 'object') {
//         rows = result[0]; // MySQL2 format
//         console.log('✅ Using MySQL2 format for survey logs');
//       } else if (typeof result[0] === 'object' && result[0].id) {
//         rows = result; // Direct array format
//         console.log('✅ Using direct array format for survey logs');
//       } else {
//         rows = [];
//         console.log('✅ Empty survey logs result');
//       }
//     } else {
//       rows = [];
//       console.log('✅ No survey logs found');
//     }
    
//     console.log(`✅ Successfully fetched ${rows.length} survey logs`);
//     return rows;
    
//   } catch (error) {
//     console.error('❌ Error fetching survey logs:', error);
//     throw new CustomError(`Failed to fetch survey logs: ${error.message}`, 500);
//   }
// };


// // Update survey approval status in the database
// export const approveUserSurvey = async (surveyId, userId, status) => {
//   const query = `
//     UPDATE surveylog 
//     SET approval_status = ?, verified_by = ? 
//     WHERE id = ? AND user_id = ?`;
//   await db.query(query, [status, 'admin', surveyId, userId]);
// };
