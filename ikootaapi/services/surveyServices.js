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
  const query = 'SELECT id, question FROM survey_questions';
  const rows = await db.query(query);
  return rows;
};

// Update questions in the database
export const modifySurveyQuestions = async (questions) => {
  const deleteQuery = 'DELETE FROM survey_questions';
  const insertQuery = 'INSERT INTO survey_questions (question) VALUES ?';
  
  await db.query(deleteQuery); // Clear old questions
  const values = questions.map((question) => [question]);
  await db.query(insertQuery, [values]); // Insert new questions
};

// Fetch survey logs from the database
export const fetchSurveyLogs = async () => {
  const query = 'SELECT * FROM surveylog';
  const rows = await db.query(query);
  return rows;
};

// Update survey approval status in the database
export const approveUserSurvey = async (surveyId, userId, status) => {
  const query = `
    UPDATE surveylog 
    SET approval_status = ?, verified_by = ? 
    WHERE id = ? AND user_id = ?`;
  await db.query(query, [status, 'admin', surveyId, userId]);
};
