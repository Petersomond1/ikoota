import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import db from '../config/db.js';
import { sendEmail } from '../utils/email.js';
import {generateToken } from '../utils/jwt.js';
import { registerUserService, loginUserService} from '../services/authServices.js';

const SECRET_KEY = process.env.SECRET_KEY;

export const registerUser = async (req, res, next) => {
    try {
      const { username, email, password, phone } = req.body;
      if (!username || !email || !password || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      const userId = await registerUserService({ username, email, password, phone });
  
      const user = { userId, email, is_member: false, role: false };
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

