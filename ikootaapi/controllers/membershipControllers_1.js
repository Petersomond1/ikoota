// ikootaapi/controllers/membershipControllers_1.js
// ==================================================
// CORE FUNCTIONS, AUTHENTICATION & UTILITIES
// ==================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { sendEmail, sendSMS } from '../utils/notifications.js';
import CustomError from '../utils/CustomError.js';

// =============================================================================
// UTILITY FUNCTIONS
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
 * FIXED: Get user by ID with proper error handling
 */
export const getUserById = async (userId) => {
  try {
    console.log('🔍 getUserById called with userId:', userId);
    
    const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    console.log('🔍 Raw DB result structure check');
    
    // Handle different possible result structures
    let users;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0])) {
        users = result[0]; // MySQL2 format: [rows, fields]
        console.log('✅ Using MySQL2 format: result[0]');
      } else {
        users = result; // Direct array format
        console.log('✅ Using direct array format: result');
      }
    } else {
      console.log('❌ Unexpected result structure');
      throw new CustomError('Unexpected database result structure', 500);
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No users found');
      throw new CustomError('User not found', 404);
    }
    
    const user = users[0];
    console.log('✅ User extracted:', user.id, user.username);
    
    return user;
  } catch (error) {
    console.error('❌ Database query error in getUserById:', error);
    throw new CustomError('Database operation failed: ' + error.message, 500);
  }
};

/**
 * Standardized database query executor with proper error handling
 */
export const executeQuery = async (query, params = []) => {
  try {
    const [results] = await db.query(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw new CustomError('Database operation failed', 500);
  }
};

/**
 * Validate membership stage transitions
 */
export const validateStageTransition = (currentStage, newStage) => {
  const validTransitions = {
    'none': ['applicant'],
    'applicant': ['pre_member', 'applicant'], // Can stay applicant if rejected
    'pre_member': ['member'],
    'member': ['member'] // Members stay members
  };
  
  return validTransitions[currentStage]?.includes(newStage) || false;
};

/**
 * Helper function to convert data to CSV
 */
export const convertToCSV = (data) => {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      if (value instanceof Date) return `"${value.toISOString()}"`;
      return value;
    }).join(',')
  );
  
  return [headers, ...rows].join('\n');
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

// ==================================================
// AUTHENTICATION & REGISTRATION FUNCTIONS
// ==================================================

/**
 * Enhanced login with comprehensive membership status
 */
export const enhancedLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      throw new CustomError('Email/username and password are required', 400);
    }
    
    // Get user with membership information
    const [users] = await db.query(`
      SELECT u.*, 
             COALESCE(sl.approval_status, 'not_submitted') as initial_application_status,
             sl.createdAt as initial_application_date,
             fma.first_accessed_at as full_membership_accessed,
             CASE WHEN fma.user_id IS NOT NULL THEN 1 ELSE 0 END as has_accessed_full_membership
      FROM users u
      LEFT JOIN surveylog sl ON u.id = CAST(sl.user_id AS UNSIGNED) 
        AND sl.application_type = 'initial_application'
      LEFT JOIN full_membership_access fma ON u.id = fma.user_id
      WHERE u.email = ? OR u.username = ?
      GROUP BY u.id
    `, [identifier, identifier]);
    
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
    } else if (user.membership_stage === 'member' && user.is_member === 'active') {
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

/**
 * Send verification code for registration
 */
export const sendVerificationCode = async (req, res) => {
  try {
    const { email, phone, type = 'email' } = req.body;
    
    if (!email && !phone) {
      throw new CustomError('Email or phone number is required', 400);
    }
    
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store verification code
    await db.query(`
      INSERT INTO verification_codes (email, phone, code, type, expires_at, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        code = VALUES(code), 
        expires_at = VALUES(expires_at), 
        attempts = 0,
        created_at = NOW()
    `, [email || null, phone || null, verificationCode, type, expiresAt]);
    
    // Send verification code
    try {
      if (type === 'email' && email) {
        await sendEmail(email, 'verification_code', {
          VERIFICATION_CODE: verificationCode,
          EXPIRES_IN: '10 minutes'
        });
      } else if (type === 'sms' && phone) {
        await sendSMS(phone, `Your Ikoota verification code is: ${verificationCode}. Valid for 10 minutes.`);
      }
    } catch (notificationError) {
      console.error('Notification sending failed:', notificationError);
      // Don't fail the entire request if notification fails
    }
    
    return successResponse(res, {
      expiresIn: 600 // 10 minutes in seconds
    }, `Verification code sent to ${type === 'email' ? email : phone}`);
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Register with verification
 */
export const registerWithVerification = async (req, res) => {
  try {
    const {
       username,
       email,
       password,
       phone,
       verificationCode,
       verificationType = 'email'
     } = req.body;
        
    // Validate required fields
    if (!username || !email || !password || !verificationCode) {
      throw new CustomError('All fields are required', 400);
    }
        
    // Verify the verification code
    const verificationTarget = verificationType === 'email' ? email : phone;
    const [verificationResults] = await db.query(`
      SELECT * FROM verification_codes 
      WHERE ${verificationType === 'email' ? 'email' : 'phone'} = ? 
        AND code = ? 
        AND type = ? 
        AND expires_at > NOW() 
        AND attempts < 3
    `, [verificationTarget, verificationCode, verificationType]);
        
    if (!verificationResults || verificationResults.length === 0) {
      throw new CustomError('Invalid or expired verification code', 400);
    }
        
    // Check if user already exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
        
    if (existingUsers && existingUsers.length > 0) {
      throw new CustomError('User with this email or username already exists', 409);
    }
        
    const result = await db.transaction(async (connection) => {
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
            
      // Generate application ticket
      const applicationTicket = generateApplicationTicket(username, email);
            
      // Create user
      const [insertResult] = await connection.execute(`
        INSERT INTO users (
          username, 
          email, 
          password_hash, 
          phone, 
          membership_stage, 
          is_member, 
          application_ticket,
          createdAt
        ) VALUES (?, ?, ?, ?, 'none', 'pending', ?, NOW())
      `, [username, email, passwordHash, phone || null, applicationTicket]);
            
      const userId = insertResult.insertId;
            
      // Delete used verification code
      await connection.execute(`
        DELETE FROM verification_codes 
        WHERE ${verificationType === 'email' ? 'email' : 'phone'} = ? AND code = ?
      `, [verificationTarget, verificationCode]);
            
      return {
        userId,
        username,
        email,
        applicationTicket
      };
    });
        
    // Generate JWT token
    const token = jwt.sign(
      {
         user_id: result.userId,
         username: result.username,
         email: result.email,
        membership_stage: 'none',
        is_member: 'pending',
        role: 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
        
    // Send welcome email (non-blocking)
    try {
      await sendEmail(result.email, 'welcome_registration', {
        USERNAME: result.username,
        APPLICATION_TICKET: result.applicationTicket
      });
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
    }
        
    return successResponse(res, {
      token,
      user: {
        id: result.userId,
        username: result.username,
        email: result.email,
        membership_stage: 'none',
        application_ticket: result.applicationTicket
      },
      redirectTo: '/application-survey'
    }, 'Registration successful', 201);
        
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

// ==================================================
// MIDDLEWARE HELPERS
// ==================================================

/**
 * Validate request parameters
 */
export const validateRequest = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return errorResponse(res, 
        new CustomError(`Missing required fields: ${missingFields.join(', ')}`, 400), 
        400
      );
    }
    
    next();
  };
};

/**
 * Validate admin permissions
 */
export const requireAdmin = (req, res, next) => {
  const userRole = req.user?.role;
  
  if (!['admin', 'super_admin'].includes(userRole)) {
    return errorResponse(res, 
      new CustomError('Administrative privileges required', 403), 
      403
    );
  }
  
  next();
};

/**
 * Validate super admin permissions
 */
export const requireSuperAdmin = (req, res, next) => {
  const userRole = req.user?.role;
  
  if (userRole !== 'super_admin') {
    return errorResponse(res, 
      new CustomError('Super administrative privileges required', 403), 
      403
    );
  }
  
  next();
};