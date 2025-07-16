// ikootaapi/services/authServices.js
import bcrypt from 'bcrypt';
import CustomError from '../utils/CustomError.js';
import { sendEmail } from '../utils/email.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/db.js';
import { sendSMS } from '../utils/sms.js';

export const registerUserService = async (userData) => {
    const { username, email, password, phone } = userData;
    try {
        const existingUser = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return { error: true, message: 'User already exists' };
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

       
    const sql = 'INSERT INTO users (username, email, password_hash, phone, role, is_member) VALUES (?, ?, ?, ?, ?, ?)';
    console.log(username, email, hashedPassword, phone);
    const result = await db.query(sql, [username, email, hashedPassword, phone, false, false]);

        const subject = 'Welcome to Our Platform!';
        const text = `Hello ${username},\n\nWelcome to our platform! We're glad to have you. Please proceed with choosing your class on the form page.`;
        await sendEmail(email, subject, text);

        return result.insertId;
    } catch (error) {
        throw new CustomError('uncompleted request failed', 500, error);
    }
};



export const loginUserService = async (email, password) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const user = await db.query(sql, [email]);

    if (user.length === 0) {
        throw new CustomError('Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user[0].password_hash);
    if (!isMatch) {
        throw new CustomError('Invalid credentials', 401);
    }

    const payload = {
        user_id: user[0].id,
        email: user[0].email,
        role:user[0].role,
        isVerified: user[0].isVerified,
        isConfirmed: user[0].isConfirmed,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    return token; // Return the token to the controller for setting the cookie during login
};

export const sendPasswordResetEmail = async (email) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const user = await db.query(sql, [email]);

    if (user.length === 0) {
        throw new CustomError('User not found', 404);
    }

    const token = crypto.randomBytes(20).toString('hex'); // Generate a random token for password reset different from the JWT token
    await db.query('UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?', [token, Date.now() + 3600000, email]);

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const subject = 'Password Reset Request';
    const text = `To reset your password, please click the link below:\n\n${resetLink}`;
    await sendEmail(email, subject, text);
};



// Generate a random verification code
export const generateVerificationCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase(); // Generates a 6-character alphanumeric code
  };
  
  // Send password reset link via email or SMS
  export const sendPasswordResetEmailOrSMS = async (emailOrPhone) => {
    let user;
    const isEmail = emailOrPhone.includes('@');
  
    if (isEmail) {
      user = await db.query('SELECT * FROM users WHERE email = ?', [emailOrPhone]);
    } else {
      user = await db.query('SELECT * FROM users WHERE phone = ?', [emailOrPhone]);
    }
  
    if (user.length === 0) {
      throw new CustomError('User not found', 404);
    }
  
    const token = crypto.randomBytes(20).toString('hex');
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const expiryTime = Date.now() + 3600000; // 1 hour
  
    await db.query('UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?', [token, expiryTime, user[0].id]);
  
    if (isEmail) {
      const subject = 'Password Reset Request';
      const text = `To reset your password, please click the link below:\n\n${resetLink}`;
      await sendEmail(emailOrPhone, subject, text);
    } else {
      const message = `To reset your password, click the link: ${resetLink}`;
      await sendSMS(emailOrPhone, message);
    }
  };
  
  // Update the user's password
  export const updatePassword = async (emailOrPhone, newPassword) => {
    const isEmail = emailOrPhone.includes('@');
    const user = isEmail
      ? await db.query('SELECT * FROM users WHERE email = ?', [emailOrPhone])
      : await db.query('SELECT * FROM users WHERE phone = ?', [emailOrPhone]);
  
    if (user.length === 0) {
      throw new CustomError('User not found', 404);
    }
  
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
  
    await db.query('UPDATE users SET password_hash = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?', [
      hashedPassword,
      user[0].id,
    ]);
  };
  


  // Verify the code sent to the alternate medium
  export const verifyResetCode = async (emailOrPhone, verificationCode) => {
    const isEmail = emailOrPhone.includes('@');
    const user = isEmail
      ? await db.query('SELECT * FROM users WHERE email = ?', [emailOrPhone])
      : await db.query('SELECT * FROM users WHERE phone = ?', [emailOrPhone]);
  
    if (user.length === 0) {
      throw new CustomError('User not found', 404);
    }
  
    if (user[0].verificationCode !== verificationCode || user[0].codeExpiry < Date.now()) {
      throw new CustomError('Invalid or expired verification code', 400);
    }
  
    await db.query('UPDATE users SET verificationCode = NULL, codeExpiry = NULL WHERE id = ?', [user[0].id]);
  };
