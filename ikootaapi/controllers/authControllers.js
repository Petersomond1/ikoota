//ikootaapi/controllers/authControllers.js - FIXED DATABASE FIELD NAMES
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import crypto from 'crypto';
import db from '../config/db.js';
import { sendEmail, sendSMS } from '../utils/notifications.js';
import CustomError from '../utils/CustomError.js';
import { sendEmail as utilsSendEmail } from '../utils/email.js';
import { generateToken } from '../utils/jwt.js';
import { 
  registerUserService, 
  loginUserService,  
  sendPasswordResetEmailOrSMS,
  updatePassword,
  verifyResetCode,
  generateVerificationCode,
} from '../services/authServices.js';

const SECRET_KEY = process.env.SECRET_KEY;
dotenv.config();

// =============================================================================
// UTILITY FUNCTIONS (Moved from membershipControllers_1.js)
// =============================================================================

/**
 * Generate application ticket with consistent format
 */
export const generateApplicationTicket = (username, email, type = 'INITIAL') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  const prefix = type === 'FULL' ? 'FMA' : 'APP';
  return `${prefix}-${username.substr(0, 3).toUpperCase()}-${timestamp}-${random}`.toUpperCase();
};

/**
 * ✅ ENHANCED: Backend-safe converse ID generation
 */
export const generateConverseId = () => {
    const prefix = 'OTO#';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    try {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const array = new Uint8Array(6);
            crypto.getRandomValues(array);
            
            for (let i = 0; i < 6; i++) {
                result += chars[array[i] % chars.length];
            }
        } else {
            // Fallback for older Node.js environments
            const crypto = require('crypto');
            for (let i = 0; i < 6; i++) {
                result += chars[crypto.randomInt(0, chars.length)];
            }
        }
    } catch (error) {
        console.warn('⚠️ Crypto not available, using Math.random fallback');
        // Fallback to Math.random (less secure but functional)
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    
    return prefix + result;
};

/**
 * ✅ ENHANCED: Check if converse ID is unique in database
 */
export const ensureUniqueConverseId = async () => {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        const candidateId = generateConverseId();
        
        try {
            // Check if this ID already exists
            const result = await db.query('SELECT id FROM users WHERE converse_id = ?', [candidateId]);
            
            // Handle result format
            let existingUsers;
            if (Array.isArray(result)) {
                existingUsers = Array.isArray(result[0]) ? result[0] : result;
            } else {
                existingUsers = [];
            }
            
            if (existingUsers.length === 0) {
                console.log('✅ Generated unique converse ID:', candidateId);
                return candidateId;
            }
            
            console.log('⚠️ Converse ID collision, retrying...', candidateId);
            attempts++;
        } catch (error) {
            console.error('❌ Error checking converse ID uniqueness:', error);
            // Return the candidate ID anyway to avoid blocking
            return candidateId;
        }
    }
    
    // If we've exhausted attempts, return the last generated ID
    console.warn('⚠️ Max attempts reached, using last generated ID');
    return generateConverseId();
};

/**
 * Standardized success response
 */
export const successResponse = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
};

/**
 * Standardized error response
 */
export const errorResponse = (res, error, statusCode = 500) => {
  console.error('Error occurred:', error);
  return res.status(statusCode).json({
    success: false,
    error: error.message || 'An error occurred',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

// =============================================================================
// ✅ FIXED AUTHENTICATION FUNCTIONS - CORRECTED DATABASE FIELD NAMES
// =============================================================================

/**
 * ✅ FIXED: Send verification code - CORRECTED DATABASE FIELD NAMES
 */
export const sendVerificationCode = async (req, res) => {
  try {
    const { email, phone, method = 'email' } = req.body;
    
    console.log('🔍 sendVerificationCode called with:', { email, phone, method });
    
    if (!email && !phone) {
      throw new CustomError('Email or phone number is required', 400);
    }
    
    if (!method || !['email', 'phone'].includes(method)) {
      throw new CustomError('Invalid verification method. Must be email or phone', 400);
    }
    
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log('✅ Generated verification code:', verificationCode);
    
    // ✅ CRITICAL FIX: Let MySQL handle the expiry time calculation
    try {
      // First, clean up any existing expired codes for this user
      await db.query(`
        DELETE FROM verification_codes 
        WHERE ${method === 'email' ? 'email' : 'phone'} = ? 
        AND expiresAt < NOW()
      `, [method === 'email' ? email : phone]);
      
      console.log('🧹 Cleaned up expired verification codes');
      
      // ✅ FIXED: Use MySQL's DATE_ADD to set expiry time correctly
      const result = await db.query(`
        INSERT INTO verification_codes (email, phone, code, method, expiresAt, createdAt) 
        VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW())
      `, [email || null, phone || null, verificationCode, method]);
      
      console.log('✅ Verification code stored in database');
      
      // ✅ ENHANCED: Verify the code was stored correctly
      if (process.env.NODE_ENV === 'development') {
        const verifyResult = await db.query(`
          SELECT code, method, createdAt, expiresAt, 
                 (expiresAt > NOW()) as is_valid,
                 TIMESTAMPDIFF(MINUTE, NOW(), expiresAt) as minutes_until_expiry,
                 NOW() as current_server_time
          FROM verification_codes 
          WHERE ${method === 'email' ? 'email' : 'phone'} = ? 
          AND code = ?
          ORDER BY createdAt DESC 
          LIMIT 1
        `, [method === 'email' ? email : phone, verificationCode]);
        
        const verifyRows = Array.isArray(verifyResult) ? 
          (Array.isArray(verifyResult[0]) ? verifyResult[0] : verifyResult) : [];
        
        console.log('🔍 Verification code storage check:', verifyRows[0]);
        
        if (verifyRows[0]?.is_valid === 0) {
          console.error('❌ CRITICAL: Verification code was stored as expired!');
        } else {
          console.log('✅ Verification code stored correctly and is valid');
        }
      }
      
    } catch (dbError) {
      console.error('❌ Database error storing verification code:', dbError);
      throw new CustomError('Failed to store verification code', 500);
    }
    
    // Send verification code
    try {
      if (method === 'email' && email) {
        console.log('📧 Attempting to send email to:', email);
        await sendEmail(email, 'verification_code', {
          VERIFICATION_CODE: verificationCode,
          EXPIRES_IN: '10 minutes'
        });
        console.log('✅ Email sent successfully');
      } else if (method === 'phone' && phone) {
        console.log('📱 Attempting to send SMS to:', phone);
        await sendSMS(phone, `Your Ikoota verification code is: ${verificationCode}. Valid for 10 minutes.`);
        console.log('✅ SMS sent successfully');
      } else {
        throw new CustomError(`Invalid method ${method} for provided contact info`, 400);
      }
    } catch (notificationError) {
      console.error('❌ Notification sending failed:', notificationError);
      // Don't fail the entire request if notification fails
      console.log('⚠️ Continuing despite notification failure for development');
    }
    
    return successResponse(res, {
      expiresIn: 600, // 10 minutes in seconds
      // ✅ For development only - remove in production
      ...(process.env.NODE_ENV === 'development' && { 
        devCode: verificationCode,
        devNote: 'This code is only shown in development mode'
      })
    }, `Verification code sent to ${method === 'email' ? email : phone}`);
    
  } catch (error) {
    console.error('❌ sendVerificationCode error:', error);
    return errorResponse(res, error, error.statusCode || 500);
  }
};


export const registerWithVerification = async (req, res) => {
  let connection = null;
  
  try {
    const {
      username,
      email,
      password,
      phone,
      verificationCode,
      verificationMethod = 'email'
    } = req.body;
    
    console.log('🔍 registerWithVerification called with:', { 
      username, 
      email, 
      phone, 
      verificationMethod,
      hasVerificationCode: !!verificationCode 
    });
        
    // ✅ ENHANCED: More robust validation
    if (!username || !email || !password || !verificationCode) {
      throw new CustomError('All fields are required', 400);
    }
    
    // ✅ ENHANCED: Username validation
    if (username.length < 2 || username.length > 50) {
      throw new CustomError('Username must be between 2 and 50 characters', 400);
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new CustomError('Username can only contain letters, numbers, underscores, and hyphens', 400);
    }
    
    // ✅ ENHANCED: Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new CustomError('Invalid email format', 400);
    }
    
    // ✅ ENHANCED: Password validation
    if (password.length < 8) {
      throw new CustomError('Password must be at least 8 characters long', 400);
    }
    
    if (!['email', 'phone'].includes(verificationMethod)) {
      throw new CustomError('Invalid verification method', 400);
    }
        
    // ✅ CORRECT: Verify the verification code using your exact field names
    const verificationTarget = verificationMethod === 'email' ? email : phone;
    
    console.log('🔍 Checking verification code for:', verificationTarget, 'method:', verificationMethod);
    
    // ✅ CORRECT: Using 'code' and 'method' as in your working code
    const verificationResult = await db.query(`
      SELECT id, code, method, createdAt, expiresAt,
             TIMESTAMPDIFF(SECOND, NOW(), expiresAt) as seconds_until_expiry
      FROM verification_codes 
      WHERE ${verificationMethod === 'email' ? 'email' : 'phone'} = ? 
        AND code = ? 
        AND method = ? 
        AND expiresAt > NOW()
      ORDER BY createdAt DESC
      LIMIT 1
    `, [verificationTarget, verificationCode, verificationMethod]);
    
    // ✅ CORRECT: Handle database result properly (same as your working code)
    let verificationRows;
    if (Array.isArray(verificationResult)) {
      verificationRows = Array.isArray(verificationResult[0]) ? verificationResult[0] : verificationResult;
    } else {
      verificationRows = [];
    }

    // ✅ ENHANCED: Better debugging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Verification query result:', {
        foundRows: verificationRows?.length || 0,
        searchedFor: verificationCode,
        searchedMethod: verificationMethod,
        searchedTarget: verificationTarget,
        secondsUntilExpiry: verificationRows[0]?.seconds_until_expiry
      });

      // Debug: Show what's actually in the database (using correct field names)
      const debugResult = await db.query(`
        SELECT id, email, phone, code, method, expiresAt, createdAt,
               (expiresAt > NOW()) as is_not_expired
        FROM verification_codes 
        WHERE ${verificationMethod === 'email' ? 'email' : 'phone'} = ?
        ORDER BY createdAt DESC
        LIMIT 3
      `, [verificationTarget]);
      
      let debugRows = Array.isArray(debugResult) ? 
        (Array.isArray(debugResult[0]) ? debugResult[0] : debugResult) : [];
      
      console.log('🔍 Debug - Recent codes for this user:', debugRows);
    }
        
    if (!verificationRows || verificationRows.length === 0) {
      console.log('❌ Invalid verification code for:', verificationTarget);
      throw new CustomError('Invalid or expired verification code', 400);
    }
    
    console.log('✅ Verification code validated');
        
    // ✅ ENHANCED: More comprehensive duplicate check
    const existingUserResult = await db.query(`
      SELECT id, email, username, is_verified 
      FROM users 
      WHERE email = ? OR username = ?
    `, [email, username]);
    
    // ✅ CORRECT: Handle database result properly (same as your working code)
    let existingUsers;
    if (Array.isArray(existingUserResult)) {
      existingUsers = Array.isArray(existingUserResult[0]) ? existingUserResult[0] : existingUserResult;
    } else {
      existingUsers = [];
    }
        
    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.email === email) {
        throw new CustomError('User with this email already exists', 409);
      }
      if (existingUser.username === username) {
        throw new CustomError('Username is already taken', 409);
      }
    }
    
    console.log('✅ User uniqueness validated');
        
    // ✅ ENHANCED: Transaction-based user creation with proper error handling
    let newUser;
    
    try {
      // Get connection for transaction
      connection = await db.getConnection();
      await connection.beginTransaction();
      
      console.log('🔄 Starting transaction for user creation');
      
      // Hash password with higher security
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
            
      // Generate application ticket
      const applicationTicket = generateApplicationTicket(username, email);
      
      // Generate unique converse ID with retry logic
      const converseId = await ensureUniqueConverseId();
      
      console.log('🔍 Creating user with:', {
        username,
        email,
        phone: phone || null,
        applicationTicket,
        converseId
      });
      
      // ✅ CORRECT: Insert user using your exact field names
      const [insertResult] = await connection.execute(`
        INSERT INTO users (
          username, 
          email, 
          password_hash, 
          phone, 
          application_ticket,
          converse_id,
          verification_method,
          is_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        username, 
        email, 
        passwordHash, 
        phone || null, 
        applicationTicket,
        converseId,
        verificationMethod
      ]);
      
      const userId = insertResult.insertId;
      
      if (!userId) {
        throw new Error('Failed to create user - no ID returned');
      }
      
      console.log('✅ User created with ID:', userId);
      
      // ✅ ENHANCED: Better class assignment with error handling
      try {
        // Check if OTU#Public class exists
        const [classCheck] = await connection.execute(`
          SELECT id FROM classes WHERE id = 'OTU#Public'
        `);
        
        if (classCheck.length === 0) {
          console.warn('⚠️ OTU#Public class not found, creating it...');
          await connection.execute(`
            INSERT INTO classes (id, name, description, type, createdAt)
            VALUES ('OTU#Public', 'Public Class', 'Default public class for all users', 'public', NOW())
            ON DUPLICATE KEY UPDATE updatedAt = NOW()
          `);
        }
        
        // Insert into user_class_memberships with conflict resolution
        await connection.execute(`
          INSERT INTO user_class_memberships (user_id, class_id, membership_status)
          VALUES (?, 'OTU#Public', 'active')
          ON DUPLICATE KEY UPDATE membership_status = 'active'
        `, [userId]);
        
        // Update user totals
        await connection.execute(`
          UPDATE users 
          SET total_classes = 1, primary_class_id = 'OTU#Public'
          WHERE id = ?
        `, [userId]);
        
        console.log('✅ User class assignments completed');
        
      } catch (classError) {
        console.error('❌ Class assignment error:', classError);
        console.warn('⚠️ Continuing without class assignment - can be fixed later');
        // Don't fail the entire transaction for class assignment issues
      }
      
      // ✅ CORRECT: Clean up verification codes using your exact field names
      await connection.execute(`
        DELETE FROM verification_codes 
        WHERE ${verificationMethod === 'email' ? 'email' : 'phone'} = ?
      `, [verificationTarget]);
      
      console.log('✅ All verification codes cleaned up for user');
      
      // Commit transaction
      await connection.commit();
      console.log('✅ Transaction committed successfully');
            
      newUser = {
        userId,
        username,
        email,
        applicationTicket,
        converseId
      };
      
    } catch (dbError) {
      // Rollback transaction on any error
      if (connection) {
        await connection.rollback();
        console.log('🔄 Transaction rolled back due to error');
      }
      
      console.error('❌ Database transaction error:', dbError);
      
      // ✅ ENHANCED: Specific error handling
      if (dbError.code === 'ER_DUP_ENTRY') {
        if (dbError.message.includes('email')) {
          throw new CustomError('Email address is already registered', 409);
        } else if (dbError.message.includes('username')) {
          throw new CustomError('Username is already taken', 409);
        } else {
          throw new CustomError('User already exists', 409);
        }
      } else if (dbError.code === 'ER_DATA_TOO_LONG') {
        throw new CustomError('One or more fields exceed maximum length', 400);
      } else if (dbError.code === 'ER_BAD_NULL_ERROR') {
        throw new CustomError('Required field is missing', 400);
      } else {
        throw new CustomError(`Registration failed: ${dbError.message}`, 500);
      }
    } finally {
      // Release connection
      if (connection) {
        connection.release();
      }
    }
        
    // ✅ ENHANCED: Generate JWT token with more claims (keeping your exact structure)
    const tokenPayload = {
      user_id: newUser.userId,
      username: newUser.username,
      email: newUser.email,
      membership_stage: 'none',
      is_member: 'applied',
      role: 'user',
      converse_id: newUser.converseId,
      iat: Math.floor(Date.now() / 1000)
    };
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✅ JWT token generated with enhanced payload');
        
    // ✅ CORRECT: Send welcome email using your exact template structure
    try {
      await sendEmail(newUser.email, 'welcome_registration', {
        USERNAME: newUser.username,
        APPLICATION_TICKET: newUser.applicationTicket,
        LOGIN_URL: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
        SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'support@ikoota.com'
      });
      console.log('✅ Welcome email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Welcome email failed:', emailError);
      // Log this for follow-up but don't fail registration
    }
    
    // ✅ ENHANCED: Log successful registration for analytics (optional)
    try {
      await db.query(`
        INSERT INTO user_activity_log (
          user_id, 
          activity_type, 
          details, 
          ip_address, 
          user_agent,
          createdAt
        ) VALUES (?, 'registration', ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE createdAt = VALUES(createdAt)
      `, [
        newUser.userId,
        JSON.stringify({
          verification_method: verificationMethod,
          has_phone: !!phone,
          application_ticket: newUser.applicationTicket
        }),
        req.ip || req.connection?.remoteAddress || 'unknown',
        req.get('User-Agent') || 'unknown'
      ]);
      console.log('✅ Registration logged for analytics');
    } catch (logError) {
      console.error('⚠️ Failed to log registration activity:', logError);
      // Don't fail registration for logging issues
    }
        
    // ✅ CORRECT: Return response using your exact structure
    return successResponse(res, {
      token,
      user: {
        id: newUser.userId,
        username: newUser.username,
        email: newUser.email,
        membership_stage: 'none',
        is_member: 'applied',
        application_ticket: newUser.applicationTicket,
        converse_id: newUser.converseId
      },
      redirectTo: '/applicationsurvey'
    }, 'Registration successful', 201);
        
  } catch (error) {
    console.error('❌ registerWithVerification error:', error);
    
    // ✅ ENHANCED: Cleanup on failure
    if (connection) {
      try {
        await connection.rollback();
        connection.release();
      } catch (cleanupError) {
        console.error('❌ Error during cleanup:', cleanupError);
      }
    }
    
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// export const registerWithVerification = async (req, res) => {
//   try {
//     const {
//       username,
//       email,
//       password,
//       phone,
//       verificationCode,
//       verificationMethod = 'email'
//     } = req.body;
    
//     console.log('🔍 registerWithVerification called with:', { 
//       username, 
//       email, 
//       phone, 
//       verificationMethod,
//       hasVerificationCode: !!verificationCode 
//     });
        
//     // Validate required fields
//     if (!username || !email || !password || !verificationCode) {
//       throw new CustomError('All fields are required', 400);
//     }
    
//     if (!['email', 'phone'].includes(verificationMethod)) {
//       throw new CustomError('Invalid verification method', 400);
//     }
        
//     // ✅ FIXED: Verify the verification code using CORRECT database field names
//     const verificationTarget = verificationMethod === 'email' ? email : phone;
    
//     console.log('🔍 Checking verification code for:', verificationTarget, 'method:', verificationMethod);
    
//     // ✅ CRITICAL FIX: Use 'code' and 'method' instead of 'verification_code' and 'verification_method'
//     const verificationResult = await db.query(`
//       SELECT * FROM verification_codes 
//       WHERE ${verificationMethod === 'email' ? 'email' : 'phone'} = ? 
//         AND code = ? 
//         AND method = ? 
//         AND expiresAt > NOW()
//       ORDER BY createdAt DESC
//       LIMIT 1
//     `, [verificationTarget, verificationCode, verificationMethod]);
    
//     // ✅ FIXED: Handle database result properly
//     let verificationRows;
//     if (Array.isArray(verificationResult)) {
//       verificationRows = Array.isArray(verificationResult[0]) ? verificationResult[0] : verificationResult;
//     } else {
//       verificationRows = [];
//     }

//     // ✅ ENHANCED: Add debugging information for development
//     if (process.env.NODE_ENV === 'development') {
//       console.log('🔍 Verification query result:', {
//         foundRows: verificationRows?.length || 0,
//         searchedFor: verificationCode,
//         searchedMethod: verificationMethod,
//         searchedTarget: verificationTarget
//       });

//       // Debug: Show what's actually in the database
//       const debugResult = await db.query(`
//         SELECT id, email, phone, code, method, expiresAt, createdAt,
//                (expiresAt > NOW()) as is_not_expired
//         FROM verification_codes 
//         WHERE ${verificationMethod === 'email' ? 'email' : 'phone'} = ?
//         ORDER BY createdAt DESC
//         LIMIT 3
//       `, [verificationTarget]);
      
//       let debugRows = Array.isArray(debugResult) ? 
//         (Array.isArray(debugResult[0]) ? debugResult[0] : debugResult) : [];
      
//       console.log('🔍 Debug - Recent codes for this user:', debugRows);
//     }
        
//     if (!verificationRows || verificationRows.length === 0) {
//       console.log('❌ Invalid verification code for:', verificationTarget);
//       throw new CustomError('Invalid or expired verification code', 400);
//     }
    
//     console.log('✅ Verification code validated');
        
//     // Check if user already exists
//     const existingUserResult = await db.query(
//       'SELECT id FROM users WHERE email = ? OR username = ?',
//       [email, username]
//     );
    
//     // ✅ FIXED: Handle database result properly
//     let existingUsers;
//     if (Array.isArray(existingUserResult)) {
//       existingUsers = Array.isArray(existingUserResult[0]) ? existingUserResult[0] : existingUserResult;
//     } else {
//       existingUsers = [];
//     }
        
//     if (existingUsers && existingUsers.length > 0) {
//       throw new CustomError('User with this email or username already exists', 409);
//     }
    
//     console.log('✅ User uniqueness validated');
        
//     // ✅ SIMPLE: Basic insert without trigger conflicts
//     let newUser;
//     try {
//       // Hash password
//       const saltRounds = 12;
//       const passwordHash = await bcrypt.hash(password, saltRounds);
            
//       // Generate application ticket
//       const applicationTicket = generateApplicationTicket(username, email);
      
//       // Generate unique converse ID
//       const converseId = await ensureUniqueConverseId();
      
//       console.log('🔍 Creating user with:', {
//         username,
//         email,
//         phone: phone || null,
//         applicationTicket,
//         converseId
//       });
            
//       // ✅ SIMPLE: Basic insert (trigger is now disabled)
//       const insertResult = await db.query(`
//         INSERT INTO users (
//           username, 
//           email, 
//           password_hash, 
//           phone, 
//           application_ticket,
//           converse_id,
//           verification_method,
//           is_verified
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
//       `, [
//         username, 
//         email, 
//         passwordHash, 
//         phone || null, 
//         applicationTicket,
//         converseId,
//         verificationMethod
//       ]);
      
//       // ✅ FIXED: Handle insertId properly
//       let userId;
//       if (Array.isArray(insertResult)) {
//         userId = insertResult[0]?.insertId || insertResult.insertId;
//       } else {
//         userId = insertResult.insertId;
//       }
      
//       if (!userId) {
//         throw new CustomError('Failed to create user - no ID returned', 500);
//       }
      
//       console.log('✅ User created with ID:', userId);
      
//       // ✅ MANUAL: Do what the trigger would have done (since trigger is disabled)
//       try {
//         // Insert into user_class_memberships
//         await db.query(`
//           INSERT INTO user_class_memberships (user_id, class_id, membership_status)
//           VALUES (?, 'OTU#Public', 'active')
//           ON DUPLICATE KEY UPDATE membership_status = 'active'
//         `, [userId]);
        
//         // Update user totals
//         await db.query(`
//           UPDATE users 
//           SET total_classes = 1, primary_class_id = 'OTU#Public'
//           WHERE id = ?
//         `, [userId]);
        
//         console.log('✅ User class assignments completed manually');
//       } catch (classError) {
//         console.warn('⚠️ Class assignment failed, but user created successfully:', classError.message);
//         // Don't fail the entire registration if class assignment fails
//       }
            
//       // ✅ FIXED: Delete used verification code using correct field names
//       await db.query(`
//         DELETE FROM verification_codes 
//         WHERE ${verificationMethod === 'email' ? 'email' : 'phone'} = ? AND code = ?
//       `, [verificationTarget, verificationCode]);
      
//       console.log('✅ Verification code cleaned up');
            
//       newUser = {
//         userId,
//         username,
//         email,
//         applicationTicket,
//         converseId
//       };
      
//     } catch (dbError) {
//       console.error('❌ Database transaction error:', dbError);
      
//       // ✅ ENHANCED: Better error handling for specific database issues
//       if (dbError.code === 'ER_DUP_ENTRY') {
//         throw new CustomError('User already exists with this email or username', 409);
//       } else {
//         throw new CustomError(`Registration failed: ${dbError.message}`, 500);
//       }
//     }
        
//     // Generate JWT token
//     const token = jwt.sign(
//       {
//         user_id: newUser.userId,
//         username: newUser.username,
//         email: newUser.email,
//         membership_stage: 'none',
//         is_member: 'applied',
//         role: 'user'
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );
    
//     console.log('✅ JWT token generated');
        
//     // Send welcome email (non-blocking)
//     try {
//       await sendEmail(newUser.email, 'welcome_registration', {
//         USERNAME: newUser.username,
//         APPLICATION_TICKET: newUser.applicationTicket
//       });
//       console.log('✅ Welcome email sent');
//     } catch (emailError) {
//       console.error('⚠️ Welcome email failed:', emailError);
//     }
        
//     return successResponse(res, {
//       token,
//       user: {
//         id: newUser.userId,
//         username: newUser.username,
//         email: newUser.email,
//         membership_stage: 'none',
//         is_member: 'applied',
//         application_ticket: newUser.applicationTicket,
//         converse_id: newUser.converseId
//       },
//       redirectTo: '/applicationsurvey'
//     }, 'Registration successful', 201);
        
//   } catch (error) {
//     console.error('❌ registerWithVerification error:', error);
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };


/**
 * ✅ MOVED: Enhanced login - Back to using email like before
 */
export const enhancedLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new CustomError('Email and password are required', 400);
    }
    
    // ✅ FIXED: Proper database query result handling
    const result = await db.query(`
      SELECT u.*, 
             COALESCE(sl.approval_status, 'not_submitted') as initial_application_status,
             sl.createdAt as initial_application_date,
             fma.first_accessed_at as full_membership_accessed,
             CASE WHEN fma.user_id IS NOT NULL THEN 1 ELSE 0 END as has_accessed_full_membership
      FROM users u
      LEFT JOIN surveylog sl ON u.id = CAST(sl.user_id AS UNSIGNED) 
        AND sl.application_type = 'initial_application'
      LEFT JOIN full_membership_access fma ON u.id = fma.user_id
      WHERE u.email = ?
      GROUP BY u.id
    `, [email]);
    
    // ✅ FIXED: Handle database result properly
    let users;
    if (Array.isArray(result) && result.length > 0) {
      // Check if it's MySQL2 format [rows, fields] or direct array
      if (Array.isArray(result[0])) {
        users = result[0]; // MySQL2 format
      } else {
        users = result; // Direct array format
      }
    } else {
      users = [];
    }
    
    if (!users || users.length === 0) {
      throw new CustomError('Invalid credentials', 401);
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new CustomError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        user_id: user.id, 
        username: user.username, 
        email: user.email,
        membership_stage: user.membership_stage,
        is_member: user.is_member,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Smart redirect logic
    let redirectTo = '/';
    
    if (user.role === 'admin' || user.role === 'super_admin') {
      redirectTo = '/admin';
    } else if (user.membership_stage === 'member' && user.is_member === 'member') {
      redirectTo = '/iko';
    } else if (user.membership_stage === 'pre_member') {
      redirectTo = '/towncrier';
    } else if (user.membership_stage === 'applicant') {
      if (user.initial_application_status === 'not_submitted') {
        redirectTo = '/application-survey';
      } else if (user.initial_application_status === 'pending') {
        redirectTo = '/pending-verification';
      } else if (user.initial_application_status === 'approved') {
        redirectTo = '/approved-verification';
      }
    } else {
      redirectTo = '/dashboard';
    }

    return successResponse(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        membership_stage: user.membership_stage,
        is_member: user.is_member,
        role: user.role
      },
      redirectTo
    }, 'Login successful');

  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// =============================================================================
// ✅ ENHANCED LOGOUT FUNCTION
// =============================================================================

export const logoutUser = async (req, res) => {
    try {
      res.clearCookie('access_token');
      res.clearCookie('token');
      
      return successResponse(res, {}, 'Logged out successfully');
    } catch (error) {
      console.error('Error in logoutUser:', error.message);
      return errorResponse(res, new CustomError('An error occurred while logging out.', 500), 500);
    }
};

// =============================================================================
// ✅ EXISTING FUNCTIONS (Keep existing functionality)
// =============================================================================

export const verifyUser = async (req, res) => {
    try {
        const sql = "SELECT * FROM users WHERE email=?";
        const [result] = await db.execute(sql, [req.params.token]);

        if (result.length === 0) {
            return res.json({ error: "Invalid token" });
        }

        const updateSql = "UPDATE users SET is_member = 'pending' WHERE email=?";
        await db.execute(updateSql, [req.params.token]);

        res.redirect(`http://localhost:5173/applicationsurvey/${req.params.token}`);
    } catch (err) {
        console.error(err);
        return res.json({ error: err.message || "Error verifying token" });
    }
};

export const getAuthenticatedUser = (req, res) => {
    res.set("Access-Control-Allow-Credentials", "true");
    return res.json({ 
      Status: "Success", 
      userData: { 
        username: req.user.username, 
        email: req.user.email 
      }, 
      setAuth: true 
    });
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

    await db.query(
      `UPDATE users SET verification_code = ?, codeExpiry = ? WHERE ${isEmail ? 'email' : 'phone'} = ?`,
      [verificationCode, Date.now() + 3600000, emailOrPhone]
    );

    if (isEmail) {
      const message = `Your verification code is ${verificationCode}`;
      await sendSMS(user.phone, message);
    } else {
      const subject = 'Verification Code';
      const text = `Your verification code is ${verificationCode}`;
      await utilsSendEmail(user.email, subject, text);
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

// =============================================================================
// ✅ DEPRECATED FUNCTIONS (Keep for backward compatibility)
// =============================================================================

export const registerUser = async (req, res, next) => {
    try {
      const { username, email, password, phone } = req.body;
      if (!username || !email || !password || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      console.log('⚠️ DEPRECATED: registerUser called - use registerWithVerification instead');
      
      const userId = await registerUserService({ username, email, password, phone });

      const user = { user_id: userId, email, is_member: false, role: false };
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

        console.log('⚠️ DEPRECATED: loginUser called - use enhancedLogin instead');

        const token = await loginUserService(email, password);

        res.cookie('access_token', token, { httpOnly: true });

        res.status(200).json({ message: 'Login successful', token, Status: "Success" });
    } catch (err) {
        next(err);
    }
};

