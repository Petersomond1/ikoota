import dbQuery from '../config/dbQuery.js';
import CustomError from '../utils/CustomError.js';
import { sendEmail } from '../utils/email.js';

export const submitSurveyService = async (answers, email) => {
  try {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const user = await dbQuery(sql, [email]);

    if (user.length === 0) {
      throw new CustomError('no user found issue!', 400);
    }

    const userId = user[0].id;

    const insertSql = 'INSERT INTO surveylog (user_id, answers) VALUES (?, ?)';
    const savedForm = await dbQuery(insertSql, [userId, JSON.stringify(answers)]);

    if (savedForm.affectedRows === 0) {
      throw new CustomError('data failed to be saved in db', 500);
    }

    await dbQuery('UPDATE users SET is_member = ? WHERE id = ?', ['pending', userId]);

    const subject = 'Survey Submission Confirmation';
    const text = `Hello ${user[0].username},\n\nThank you for submitting the survey. Your responses have been recorded. Just give us a little time for your account application to be activated.`;
    await sendEmail(email, subject, text);

    const adminEmail = process.env.MAIL_USER;
    const adminSubject = 'New Survey Submission Pending Approval';
    const adminText = `A new survey submission has been received from ${user[0].username}. Please review and approve the submission.`;
    await sendEmail(adminEmail, adminSubject, adminText);

    return { success: true };
  } catch (error) {
    console.log("the issue", error);
    throw new CustomError('Form submission failed', 500, error.message);
  }
};