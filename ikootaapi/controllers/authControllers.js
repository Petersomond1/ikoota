//ikootaapi\controllers\authControllers.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import crypto from 'crypto';
import db from '../config/db.js';
import { sendEmail } from '../utils/email.js';
import {generateToken } from '../utils/jwt.js';
import { registerUserService, loginUserService,  sendPasswordResetEmailOrSMS,
  updatePassword,
  verifyResetCode,
  generateVerificationCode,} from '../services/authServices.js';

const SECRET_KEY = process.env.SECRET_KEY;
dotenv.config();

export const registerUser = async (req, res, next) => {
    try {
      const { username, email, password, phone } = req.body;
      if (!username || !email || !password || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      const userId = await registerUserService({ username, email, password, phone });
  
      const user = { user_id, email, is_member: false, role: false };
      const token = generateToken(user);
  
      res.cookie('access_token', token, { httpOnly: true });
  
      res.status(201).json({
        message: 'Registration in progress; please take the Application survey to complete registration',
        redirectTo: '/applicationsurvey',
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  };



export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const token = await loginUserService(email, password);

        res.cookie('access_token', token, { httpOnly: true });

        // res.status(200).json({ message: 'Login successful' });
        res.status(200).json({ message: 'Login successful', token, Status: "Success" });
    } catch (err) {
        next(err);
    }
};

export const logoutUser = async (req, res) => {
    try {
      res.clearCookie('token');
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Error in logoutUser:', error.message);
      res.status(500).json({ error: 'An error occurred while logging out.' });
    }
  };

export const verifyUser = async (req, res) => {
    try {
        const sql = "SELECT * FROM users WHERE email=?";
        const [result] = await db.execute(sql, [req.params.token]);

        if (result.length === 0) {
            return res.json({ error: "Invalid token" });
        }

        const updateSql = "UPDATE users SET is_member: pending WHERE email=?";
        await db.execute(updateSql, [req.params.token]);

        res.redirect(`http://localhost:5173/applicationsurvey/${req.params.token}`);
    } catch (err) {
        console.error(err);
        return res.json({ error: err.message || "Error verifying token" });
    }
};

export const getAuthenticatedUser = (req, res) => {
    res.set("Access-Control-Allow-Credentials", "true");
    return res.json({ Status: "Success", userData: { username: req.user.username, email: req.user.email }, setAuth: true });
};


export const requestPasswordReset = async (req, res) => {
  const { emailOrPhone } = req.body;
  try {
    await sendPasswordResetEmailOrSMS(emailOrPhone);
    res.status(200).json({ message: "Password reset link sent!" });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  const { emailOrPhone, newPassword, confirmNewPassword } = req.body;

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: 'Passwords do not match!' });
  }

  try {
    await updatePassword(emailOrPhone, newPassword);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const isEmail = emailOrPhone.includes('@');
    const alternateMedium = isEmail ? 'phone' : 'email';

    await db.query(
      `UPDATE users SET verificationCode = ?, codeExpiry = ? WHERE ${isEmail ? 'email' : 'phone'} = ?`,
      [verificationCode, Date.now() + 3600000, emailOrPhone]
    );

    if (isEmail) {
      const message = `Your verification code is ${verificationCode}`;
      await sendSMS(user.phone, message);
    } else {
      const subject = 'Verification Code';
      const text = `Your verification code is ${verificationCode}`;
      await sendEmail(user.email, subject, text);
    }

    res.status(200).json({ message: 'Password updated! Please check your email or phone for a new code and verify here.' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};


export const verifyPasswordReset = async (req, res) => {
  const { emailOrPhone, verificationCode } = req.body;
  try {
    await verifyResetCode(emailOrPhone, verificationCode);
    res.status(200).json({ message: "Verification successful! Password reset is complete." });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};



