


   // ikootaapi/routes/authRoutes.js - WORKING VERSION FOR YOUR SYSTEM
import express from 'express';

// Import controllers from your authControllers.js file
import {
    sendVerificationCode,
    registerWithVerification,
    enhancedLogin,
    logoutUser,
    requestPasswordReset,
    resetPassword,
    verifyPasswordReset,
    verifyUser,
    getAuthenticatedUser,
    authHealthCheck,
    getAuthStats
} from '../controllers/authControllers.js';

import { getBasicProfile } from '../controllers/userStatusControllers.js';

// Import your existing middleware
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ===============================================
// PRIMARY AUTHENTICATION ROUTES
// ===============================================

// ✅ Enhanced verification and registration system
router.post('/send-verification', sendVerificationCode);
router.post('/register', registerWithVerification);
router.post('/login', enhancedLogin);
router.get('/logout', logoutUser);

// ===============================================
// PASSWORD RESET ROUTES
// ===============================================

router.post('/passwordreset/request', requestPasswordReset);
router.post('/passwordreset/reset', resetPassword);
router.post('/passwordreset/verify', verifyPasswordReset);

// ===============================================
// USER VERIFICATION ROUTES
// ===============================================

router.get('/verify/:token', verifyUser);

// ===============================================
// AUTHENTICATED USER ROUTES
// ===============================================

router.get('/', authenticate, getAuthenticatedUser);


//Userinfo.jsx, AuthContext.js,
// New route to get user profile info
router.get('/users/profile', authenticate, getBasicProfile);



// ===============================================
// TESTING ROUTES
// ===============================================

// Simple test route to verify auth routes work
router.get('/test-simple', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication routes are working!',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    routes_available: [
      'POST /send-verification',
      'POST /register',
      'POST /login',
      'GET /logout',
      'POST /passwordreset/request',
      'POST /passwordreset/reset',
      'POST /passwordreset/verify',
      'GET /verify/:token',
      'GET /'
    ]
  });
});

// Test route with authentication
router.get('/test-auth', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication is working!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Health check route
router.get('/health', authHealthCheck);

// Stats route (admin only)
router.get('/stats', authenticate, getAuthStats);

// ===============================================
// DEVELOPMENT TESTING ROUTES
// ===============================================

if (process.env.NODE_ENV === 'development') {
  // Test email functionality (development only)
  router.post('/test-email', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false,
          error: 'Email address required',
          example: { email: 'your-email@gmail.com' }
        });
      }
      
      console.log('🧪 Testing email to:', email);
      
      // Use your existing sendEmail function
      const { sendEmail } = await import('../utils/email.js');
      
      const result = await sendEmail(email, 'Test Email', 'This is a test email from Ikoota API');
      
      res.json({
        success: true,
        message: 'Test email sent successfully',
        result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Test email failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        help: 'Check your Gmail App Password configuration',
        instructions: [
          '1. Enable 2FA on Gmail',
          '2. Generate App Password',
          '3. Set MAIL_USER and MAIL_PASS in .env',
          '4. Restart server'
        ]
      });
    }
  });

  // Development test token endpoint
  router.get('/test-token', async (req, res) => {
    try {
      const jwt = await import('jsonwebtoken');
      const db = await import('../config/db.js');
      
      // Get a real user from database
      const users = await db.default.query('SELECT * FROM users LIMIT 1');
      const userRows = Array.isArray(users) ? (Array.isArray(users[0]) ? users[0] : users) : [];
      
      let testUser;
      
      if (userRows.length > 0) {
        testUser = userRows[0];
      } else {
        testUser = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          membership_stage: 'pre_member',
          is_member: 'pre_member'
        };
      }
      
      const testToken = jwt.default.sign({
        user_id: testUser.id,
        username: testUser.username,
        email: testUser.email,
        role: testUser.role,
        membership_stage: testUser.membership_stage,
        is_member: testUser.is_member
      }, process.env.JWT_SECRET || 'your-secret-key-here', { expiresIn: '7d' });
      
      console.log('🧪 Test token generated from database user');
      
      res.json({
        success: true,
        token: testToken,
        user: {
          id: testUser.id,
          username: testUser.username,
          email: testUser.email,
          role: testUser.role,
          membership_stage: testUser.membership_stage,
          is_member: testUser.is_member
        },
        message: 'Test token generated from real database user',
        tokenInfo: {
          parts: testToken.split('.').length,
          isValidJWT: testToken.split('.').length === 3,
          length: testToken.length,
          source: 'real_database_user'
        }
      });
    } catch (error) {
      console.error('❌ Test token generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate test token',
        message: error.message
      });
    }
  });
}

// ===============================================
// ERROR HANDLING & LOGGING
// ===============================================

// Log all routes in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔐 Authentication routes loaded:');
  console.log('   Primary Auth: /send-verification, /register, /login, /logout');
  console.log('   Password Reset: /passwordreset/request, /passwordreset/reset, /passwordreset/verify');
  console.log('   User Verification: /verify/:token');
  console.log('   Authenticated User: /');
  console.log('   Test: /test-simple, /test-auth');
  console.log('   Health: /health, /stats');
}

// 404 handler for unmatched auth routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Authentication route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      primary: [
        'POST /send-verification',
        'POST /register',
        'POST /login',
        'GET /logout'
      ],
      passwordReset: [
        'POST /passwordreset/request',
        'POST /passwordreset/reset',
        'POST /passwordreset/verify'
      ],
      verification: [
        'GET /verify/:token'
      ],
      user: [
        'GET /'
      ],
      testing: [
        'GET /test-simple',
        'GET /test-auth',
        'GET /health'
      ]
    }
  });
});

// Global error handler for auth routes
router.use((error, req, res, next) => {
  console.error('Authentication route error:', error);
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

export default router;




kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk




   // ikootaapi/controllers/authControllers.js
// REORGANIZED & ENHANCED AUTHENTICATION CONTROLLERS
// Aligned with database schema, frontend API calls, and new route structure

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { sendEmail } from '../utils/email.js';
import { sendSMS } from '../utils/sms.js';

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

// ===============================================
// DATABASE RESULT HELPER FUNCTION
// ===============================================

/**
 * Extract rows from database result, handling different formats
 * @param {Object|Array} result - Database query result
 * @returns {Array} - Array of rows
 */
const extractDbRows = (result) => {
    if (!result) return [];
    
    // Handle { rows: [...] } format from updated db.js
    if (result.rows && Array.isArray(result.rows)) {
        return result.rows;
    }
    
    // Handle direct array format (legacy)
    if (Array.isArray(result)) {
        return result;
    }
    
    // Handle single object wrapped in array
    if (typeof result === 'object' && !Array.isArray(result)) {
        return [result];
    }
    
    return [];
};



const generateApplicationTicket = (username, email, type = 'INITIAL') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const prefix = type === 'FULL' ? 'FMA' : 'APP';
    return `${prefix}-${username.substr(0, 3).toUpperCase()}-${timestamp}-${random}`.toUpperCase();
};

const generateConverseId = () => {
    const prefix = 'OTO#';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    try {
        for (let i = 0; i < 6; i++) {
            result += chars[crypto.randomInt(0, chars.length)];
        }
    } catch (error) {
        console.warn('⚠️ Crypto not available, using Math.random fallback');
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    
    return prefix + result;
};

const ensureUniqueConverseId = async () => {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        const candidateId = generateConverseId();
        
        try {
            const existingUsers = await db.query('SELECT id FROM users WHERE converse_id = ?', [candidateId]);
            
            if (!existingUsers || existingUsers.length === 0) {
                console.log('✅ Generated unique converse ID:', candidateId);
                return candidateId;
            }
            
            console.log('⚠️ Converse ID collision, retrying...', candidateId);
            attempts++;
        } catch (error) {
            console.error('❌ Error checking converse ID uniqueness:', error);
            return candidateId;
        }
    }
    
    console.warn('⚠️ Max attempts reached, using last generated ID');
    return generateConverseId();
};

const successResponse = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...data,
        timestamp: new Date().toISOString()
    });
};

const errorResponse = (res, error, statusCode = 500) => {
    console.error('❌ Auth Controller Error:', {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        statusCode: error.statusCode || statusCode,
        timestamp: new Date().toISOString()
    });
    
    return res.status(error.statusCode || statusCode).json({
        success: false,
        error: error.message || 'Authentication error',
        errorType: error.name || 'AuthError',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { debug: error.stack })
    });
};

// ===============================================
// MAIN AUTHENTICATION CONTROLLERS
// ===============================================

/**
 * Send verification code via email or SMS
 * POST /api/auth/send-verification
 * Frontend: Signup.jsx, Login.jsx
 */
export const sendVerificationCode = async (req, res) => {
    try {
        const { email, phone, method = 'email' } = req.body;
        
        console.log('🔍 sendVerificationCode called:', { email, phone, method });
        
        // Validation
        if (!email && !phone) {
            throw new CustomError('Email or phone number is required', 400);
        }
        
        if (!['email', 'phone'].includes(method)) {
            throw new CustomError('Invalid verification method. Must be email or phone', 400);
        }
        
        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('✅ Generated verification code:', verificationCode);
        
        // Clean up expired codes first
        await db.query(`
            DELETE FROM verification_codes 
            WHERE ${method === 'email' ? 'email' : 'phone'} = ? 
            AND expiresAt < NOW()
        `, [method === 'email' ? email : phone]);
        
        // Insert new verification code
        await db.query(`
            INSERT INTO verification_codes (email, phone, code, method, expiresAt, createdAt) 
            VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW())
        `, [email || null, phone || null, verificationCode, method]);
        
        console.log('✅ Verification code stored in database');
        
        // Send verification code
        try {
            if (method === 'email' && email) {
                await sendEmail(email, 'Verification Code', `Your Ikoota verification code is: ${verificationCode}. Valid for 10 minutes.`);
                console.log('✅ Email sent successfully');
            } else if (method === 'phone' && phone) {
                await sendSMS(phone, `Your Ikoota verification code is: ${verificationCode}. Valid for 10 minutes.`);
                console.log('✅ SMS sent successfully');
            }
        } catch (notificationError) {
            console.error('❌ Notification sending failed:', notificationError);
            // Continue anyway in development
            if (process.env.NODE_ENV === 'production') {
                throw new CustomError('Failed to send verification code', 500);
            }
        }
        
        return successResponse(res, {
            expiresIn: 600,
            method,
            target: method === 'email' ? email : phone,
            ...(process.env.NODE_ENV === 'development' && { 
                devCode: verificationCode,
                devNote: 'Verification code shown in development mode only'
            })
        }, `Verification code sent to ${method === 'email' ? email : phone}`);
        
    } catch (error) {
        console.error('❌ sendVerificationCode error:', error);
        return errorResponse(res, error);
    }
};

/**
 * Register user with verification
 * POST /api/auth/register
 * Frontend: Signup.jsx
 */
export const registerWithVerification = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            phone,
            verificationCode,
            verificationMethod = 'email'
        } = req.body;
        
        console.log('🔍 registerWithVerification called:', { 
            username, 
            email, 
            phone, 
            verificationMethod,
            hasVerificationCode: !!verificationCode 
        });
        
        // Input validation
        if (!username || !email || !password || !verificationCode) {
            throw new CustomError('Username, email, password, and verification code are required', 400);
        }
        
        if (username.length < 2 || username.length > 50) {
            throw new CustomError('Username must be between 2 and 50 characters', 400);
        }
        
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            throw new CustomError('Username can only contain letters, numbers, underscores, and hyphens', 400);
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new CustomError('Invalid email format', 400);
        }
        
        if (password.length < 8) {
            throw new CustomError('Password must be at least 8 characters long', 400);
        }
        
        // Verify verification code
        const verificationTarget = verificationMethod === 'email' ? email : phone;
        
        const verificationRows = await db.query(`
            SELECT id, code, method, createdAt, expiresAt
            FROM verification_codes 
            WHERE ${verificationMethod === 'email' ? 'email' : 'phone'} = ? 
                AND code = ? 
                AND method = ? 
                AND expiresAt > NOW()
            ORDER BY createdAt DESC
            LIMIT 1
        `, [verificationTarget, verificationCode.trim(), verificationMethod]);
        
        if (!verificationRows || verificationRows.length === 0) {
            console.log('❌ Invalid verification code for:', verificationTarget);
            throw new CustomError('Invalid or expired verification code', 400);
        }
        
        console.log('✅ Verification code validated');
        
        // Check for existing users
       const existingUsersResult = await db.query(`
    SELECT id, email, username, is_verified 
    FROM users 
    WHERE email = ? OR username = ?
`, [email, username]);
const existingUsers = extractDbRows(existingUsersResult);
        
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
        
        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Generate user identifiers
        const applicationTicket = generateApplicationTicket(username, email);
        const converseId = await ensureUniqueConverseId();
        
        console.log('🔍 Creating user with identifiers:', {
            username,
            email,
            applicationTicket,
            converseId
        });
        
        // Insert user
       const insertResult = await db.query(`
            INSERT INTO users (
                username, 
                email, 
                password_hash, 
                phone, 
                application_ticket,
                converse_id,
                verification_method,
                is_verified,
                role,
                is_member,
                membership_stage,
                full_membership_status,
                application_status,
                createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'user', 'applied', 'none', 'not_applied', 'not_submitted', NOW())
        `, [
            username, 
            email, 
            passwordHash, 
            phone || null, 
            applicationTicket,
            converseId,
            verificationMethod
        ]);
        
        // ✅ SIMPLE FIX: With the updated db.js, insertResult IS the MySQL result object
        const userId = insertResult.insertId;
        
        if (!userId) {
            console.error('❌ No insertId in result:', insertResult);
            throw new Error('Failed to create user - no ID returned');
        }
        
        console.log('✅ User created with ID:', userId);
        
        // Assign to default public class
        try {
            // Ensure OTU#Public class exists
            await db.query(`
                INSERT IGNORE INTO classes (class_id, class_name, description, class_type, is_public, created_by, createdAt)
                VALUES ('OTU#Public', 'Public Class', 'Default public class for all users', 'public', 1, 1, NOW())
            `);
            
            // Add user to public class
            await db.query(`
                INSERT INTO user_class_memberships (user_id, class_id, membership_status, role_in_class)
                VALUES (?, 'OTU#Public', 'active', 'member')
                ON DUPLICATE KEY UPDATE membership_status = 'active'
            `, [userId]);
            
            // Update user with class info
            await db.query(`
                UPDATE users 
                SET total_classes = 1, primary_class_id = 'OTU#Public'
                WHERE id = ?
            `, [userId]);
            
            console.log('✅ User assigned to public class');
            
        } catch (classError) {
            console.error('⚠️ Class assignment error:', classError);
            // Continue without failing the registration
        }
        
        // Clean up verification codes
        await db.query(`
            DELETE FROM verification_codes 
            WHERE ${verificationMethod === 'email' ? 'email' : 'phone'} = ?
        `, [verificationTarget]);
        
        console.log('✅ Verification codes cleaned up');
        
        // Generate JWT token
        const tokenPayload = {
            user_id: userId,
            username,
            email,
            membership_stage: 'none',
            is_member: 'applied',
            role: 'user',
            converse_id: converseId,
            application_ticket: applicationTicket,
            iat: Math.floor(Date.now() / 1000)
        };
        
        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('✅ JWT token generated');
        
        // Send welcome email
        try {
            await sendEmail(email, 'Welcome to Ikoota', `
                Welcome ${username}!
                
                Your account has been created successfully.
                Application Ticket: ${applicationTicket}
                
                Next step: Complete your application survey to be considered for membership.
                
                Best regards,
                The Ikoota Team
            `);
            console.log('✅ Welcome email sent');
        } catch (emailError) {
            console.error('⚠️ Welcome email failed:', emailError);
        }
        
//         

   return res.status(201).json({
            success: true,
            message: 'Registration successful',
            // ✅ CRITICAL: Add both formats for frontend compatibility
            token,
            user: {
                id: userId,
                username,
                email,
                membership_stage: 'none',
                is_member: 'applied',
                application_ticket: applicationTicket,
                converse_id: converseId,
                role: 'user'
            },
            // ✅ ALSO include nested data format
            data: {
                token,
                user: {
                    id: userId,
                    username,
                    email,
                    membership_stage: 'none',
                    is_member: 'applied',
                    application_ticket: applicationTicket,
                    converse_id: converseId,
                    role: 'user'
                }
            },
            redirectTo: '/applicationsurvey',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ registerWithVerification error:', error);
        return errorResponse(res, error);
    }
};





/**
 * Enhanced login with smart routing - FIXED VERSION
 * POST /api/auth/login
 * Frontend: Login.jsx
 */
export const enhancedLogin = async (req, res) => {
    try {
        console.log('🔍 enhancedLogin function called');
        console.log('📥 Request body keys:', Object.keys(req.body || {}));
        
        const { email, password } = req.body;
        
        // Input validation
        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({
                success: false,
                error: 'Email and password are required',
                timestamp: new Date().toISOString()
            });
        }
        
        console.log('🔍 Login attempt for email:', email);
        
        // Check database connection first
        try {
            await db.query('SELECT 1');
            console.log('✅ Database connection verified');
        } catch (dbError) {
            console.error('❌ Database connection failed:', dbError);
            return res.status(500).json({
                success: false,
                error: 'Database connection error',
                timestamp: new Date().toISOString()
            });
        }
        
        // ✅ FIXED: Get user from database with proper result handling
        console.log('🔍 Querying database for user...');
        const userResult = await db.query(`
            SELECT 
                id,
                username,
                email,
                password_hash,
                role,
                is_member,
                membership_stage,
                is_verified,
                isbanned,
                application_ticket,
                converse_id,
                full_membership_status,
                application_status,
                createdAt
            FROM users 
            WHERE email = ?
        `, [email]);
        
        // ✅ FIXED: Handle the database result format properly
        const users = extractDbRows(userResult);
        
        console.log('📊 Database query result:', {
            rawResult: typeof userResult,
            hasRows: !!(userResult && userResult.rows),
            isArray: Array.isArray(userResult),
            extractedCount: users ? users.length : 0,
            found: users && users.length > 0
        });
        
        if (!users || users.length === 0) {
            console.log('❌ No user found with email:', email);
            return res.status(404).json({
                success: false,
                error: 'No account found with this email. Please sign up first.',
                timestamp: new Date().toISOString()
            });
        }
        
        const user = users[0];
        console.log('✅ User found:', {
            id: user.id,
            email: user.email,
            role: user.role,
            is_member: user.is_member,
            membership_stage: user.membership_stage
        });
        
        // Security checks
        if (user.isbanned) {
            console.log('❌ User is banned:', email);
            return res.status(403).json({
                success: false,
                error: 'Account is banned. Contact support.',
                timestamp: new Date().toISOString()
            });
        }
        
        // Verify password
        if (!user.password_hash) {
            console.log('❌ No password hash found for user:', email);
            return res.status(500).json({
                success: false,
                error: 'Invalid account configuration. Contact support.',
                timestamp: new Date().toISOString()
            });
        }
        
        console.log('🔍 Verifying password...');
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            console.log('❌ Invalid password for user:', email);
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                timestamp: new Date().toISOString()
            });
        }
        
        console.log('✅ Password verified successfully');
        
        // Generate JWT token
        const tokenPayload = { 
            user_id: user.id, 
            username: user.username, 
            email: user.email,
            membership_stage: user.membership_stage || 'none',
            is_member: user.is_member || 'applied',
            role: user.role || 'user',
            converse_id: user.converse_id,
            application_ticket: user.application_ticket,
            full_membership_status: user.full_membership_status,
            application_status: user.application_status,
            iat: Math.floor(Date.now() / 1000)
        };
        
        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('✅ JWT token generated successfully');
        
        // Smart redirect logic
        let redirectTo = '/dashboard'; // Default fallback
        
        const role = user.role?.toLowerCase();
        const memberStatus = user.is_member?.toLowerCase();
        const membershipStage = user.membership_stage?.toLowerCase();
        
        console.log('🔍 Determining redirect for user:', {
            role,
            memberStatus,
            membershipStage
        });
        
        if (role === 'admin' || role === 'super_admin') {
            redirectTo = '/admin';
            console.log('👑 Admin user - redirecting to admin panel');
        } else if ((memberStatus === 'member' && membershipStage === 'member') || 
                   (memberStatus === 'active' && membershipStage === 'member')) {
            redirectTo = '/iko';
            console.log('💎 Full member - redirecting to Iko Chat');
        } else if (memberStatus === 'pre_member' || membershipStage === 'pre_member') {
            redirectTo = '/towncrier';
            console.log('👤 Pre-member - redirecting to Towncrier');
        } else if (membershipStage === 'applicant' || memberStatus === 'applied') {
            redirectTo = '/applicationsurvey';
            console.log('📝 Applicant - redirecting to application survey');
        }
        
        console.log('🎯 Final redirect destination:', redirectTo);
        
        // Update last login
        try {
            await db.query('UPDATE users SET updatedAt = NOW() WHERE id = ?', [user.id]);
            console.log('✅ Last login updated');
        } catch (updateError) {
            console.warn('⚠️ Failed to update last login:', updateError);
        }
        
        // ✅ FIXED: Return consistent response format
        const responseData = {
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                membership_stage: user.membership_stage || 'none',
                is_member: user.is_member || 'applied',
                role: user.role || 'user',
                converse_id: user.converse_id,
                application_ticket: user.application_ticket,
                full_membership_status: user.full_membership_status,
                application_status: user.application_status
            },
            // Also include nested data format for compatibility
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    membership_stage: user.membership_stage || 'none',
                    is_member: user.is_member || 'applied',
                    role: user.role || 'user',
                    converse_id: user.converse_id,
                    application_ticket: user.application_ticket,
                    full_membership_status: user.full_membership_status,
                    application_status: user.application_status
                }
            },
            redirectTo,
            timestamp: new Date().toISOString()
        };
        
        console.log('✅ Sending successful login response');
        return res.status(200).json(responseData);
        
    } catch (error) {
        console.error('❌ Enhanced login error:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        // Return error response
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Login failed due to server error',
            errorType: error.name || 'LoginError',
            timestamp: new Date().toISOString(),
            ...(process.env.NODE_ENV === 'development' && { 
                stack: error.stack 
            })
        });
    }
};

/**
 * Logout user
 * GET /api/auth/logout
 * Frontend: Various components
 */
export const logoutUser = async (req, res) => {
    try {
        // Clear cookies
        res.clearCookie('access_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        
        console.log('✅ User logged out successfully');
        
        return successResponse(res, {}, 'Logged out successfully');
    } catch (error) {
        console.error('❌ Logout error:', error);
        return errorResponse(res, error);
    }
};

/**
 * Request password reset
 * POST /api/auth/passwordreset/request
 * Frontend: Passwordreset.jsx
 */
export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            throw new CustomError('Email is required', 400);
        }
        
        console.log('🔍 Password reset requested for:', email);
        
        // Check if user exists
      const usersResult = await db.query('SELECT id, email, username FROM users WHERE email = ?', [email]);
const users = extractDbRows(usersResult);

        if (!users || users.length === 0) {
            // Don't reveal if email exists for security
            return successResponse(res, {}, 'If an account with that email exists, you will receive a password reset email.');
        }
        
        const user = users[0];
        
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour
        
        // Store reset token
        await db.query(`
            UPDATE users 
            SET resetToken = ?, resetTokenExpiry = ?, updatedAt = NOW() 
            WHERE email = ?
        `, [resetToken, resetTokenExpiry, email]);
        
        // Send reset email
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        
        try {
            await sendEmail(email, 'Password Reset Request', `
                Hello ${user.username},
                
                You requested a password reset for your Ikoota account.
                
                Click the link below to reset your password:
                ${resetLink}
                
                This link will expire in 1 hour.
                
                If you didn't request this reset, please ignore this email.
                
                Best regards,
                The Ikoota Team
            `);
            
            console.log('✅ Password reset email sent');
        } catch (emailError) {
            console.error('❌ Failed to send reset email:', emailError);
            throw new CustomError('Failed to send reset email', 500);
        }
        
        return successResponse(res, {}, 'If an account with that email exists, you will receive a password reset email.');
        
    } catch (error) {
        console.error('❌ Password reset request error:', error);
        return errorResponse(res, error);
    }
};

/**
 * Reset password with token
 * POST /api/auth/passwordreset/reset
 * Frontend: Passwordreset.jsx
 */
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        
        if (!token || !newPassword || !confirmPassword) {
            throw new CustomError('Token, new password, and confirmation are required', 400);
        }
        
        if (newPassword !== confirmPassword) {
            throw new CustomError('Passwords do not match', 400);
        }
        
        if (newPassword.length < 8) {
            throw new CustomError('Password must be at least 8 characters long', 400);
        }
        
        console.log('🔍 Password reset attempt with token');
        
        // Find user with valid reset token
        const usersResult = await db.query(`
    SELECT id, email, username, resetToken, resetTokenExpiry 
    FROM users 
    WHERE resetToken = ? AND resetTokenExpiry > ?
`, [token, Date.now()]);
const users = extractDbRows(usersResult);
        
        if (!users || users.length === 0) {
            throw new CustomError('Invalid or expired reset token', 400);
        }
        
        const user = users[0];
        
        // Hash new password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);
        
        // Update password and clear reset token
        await db.query(`
            UPDATE users 
            SET password_hash = ?, resetToken = NULL, resetTokenExpiry = NULL, updatedAt = NOW()
            WHERE id = ?
        `, [passwordHash, user.id]);
        
        console.log('✅ Password reset successful for user:', user.email);
        
        // Send confirmation email
        try {
            await sendEmail(user.email, 'Password Reset Successful', `
                Hello ${user.username},
                
                Your password has been successfully reset.
                
                If you didn't make this change, please contact our support team immediately.
                
                Best regards,
                The Ikoota Team
            `);
        } catch (emailError) {
            console.warn('⚠️ Failed to send confirmation email:', emailError);
        }
        
        return successResponse(res, {}, 'Password reset successful. You can now log in with your new password.');
        
    } catch (error) {
        console.error('❌ Password reset error:', error);
        return errorResponse(res, error);
    }
};

/**
 * Verify password reset token
 * POST /api/auth/passwordreset/verify
 * Frontend: Passwordreset.jsx
 */
export const verifyPasswordReset = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            throw new CustomError('Reset token is required', 400);
        }
        
        console.log('🔍 Verifying password reset token');
        
        // Check if token is valid and not expired
       const usersResult = await db.query(`
    SELECT id, email, username, resetTokenExpiry,
           TIMESTAMPDIFF(SECOND, NOW(), FROM_UNIXTIME(resetTokenExpiry/1000)) as seconds_until_expiry
    FROM users 
    WHERE resetToken = ? AND resetTokenExpiry > ?
`, [token, Date.now()]);
const users = extractDbRows(usersResult);
        
        if (!users || users.length === 0) {
            throw new CustomError('Invalid or expired reset token', 400);
        }
        
        const user = users[0];
        const minutesRemaining = Math.floor(user.seconds_until_expiry / 60);
        
        console.log('✅ Password reset token verified');
        
        return successResponse(res, {
            valid: true,
            email: user.email,
            expiresIn: minutesRemaining > 0 ? `${minutesRemaining} minutes` : 'Less than 1 minute'
        }, 'Reset token is valid');
        
    } catch (error) {
        console.error('❌ Token verification error:', error);
        return errorResponse(res, error);
    }
};

/**
 * Verify user email with token
 * GET /api/auth/verify/:token
 * Frontend: Email verification links
 */
export const verifyUser = async (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({ error: "Verification token is required" });
        }
        
        console.log('🔍 Email verification attempt with token');
        
        // In this context, token is likely the email address for backward compatibility
        const usersResult = await db.query('SELECT id, email, username, is_verified FROM users WHERE email = ?', [token]);
const users = extractDbRows(usersResult);


        if (!users || users.length === 0) {
            return res.status(404).json({ error: "Invalid verification token" });
        }
        
        const user = users[0];
        
        // Update user verification status
        await db.query(`
            UPDATE users 
            SET is_verified = 1, is_member = 'pending', updatedAt = NOW()
            WHERE email = ?
        `, [token]);
        
        console.log('✅ Email verification successful for:', user.email);
        
        // Redirect to application survey
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/applicationsurvey/${token}`);
        
    } catch (error) {
        console.error('❌ Email verification error:', error);
        return res.status(500).json({ error: error.message || "Error verifying email" });
    }
};

/**
 * Get authenticated user info
 * GET /api/auth/
 * Frontend: Various components via useAuth hook
 */
export const getAuthenticatedUser = async (req, res) => {
    try {
        if (!req.user) {
            throw new CustomError('No authenticated user found', 401);
        }
        
        console.log('✅ Returning authenticated user info:', {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
        });
        
        // Set CORS headers for credentials
        res.set("Access-Control-Allow-Credentials", "true");
        
//        


  return res.status(200).json({ 
            success: true,
            Status: "Success", // Keep for backward compatibility
            message: 'User authenticated successfully',
            userData: { 
                id: req.user.id,
                username: req.user.username, 
                email: req.user.email,
                role: req.user.role,
                membership_stage: req.user.membership_stage,
                is_member: req.user.is_member,
                converse_id: req.user.converse_id,
                application_ticket: req.user.application_ticket
            },
            // ✅ ALSO include user data at root level
            user: {
                id: req.user.id,
                username: req.user.username, 
                email: req.user.email,
                role: req.user.role,
                membership_stage: req.user.membership_stage,
                is_member: req.user.is_member,
                converse_id: req.user.converse_id,
                application_ticket: req.user.application_ticket
            },
            setAuth: true,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Get authenticated user error:', error);
        res.set("Access-Control-Allow-Credentials", "true");
        return errorResponse(res, error);
    }
};




// ===============================================
// LEGACY COMPATIBILITY FUNCTIONS
// ===============================================

/**
 * Legacy register function for backward compatibility
 * @deprecated Use registerWithVerification instead
 */
export const registerUser = async (req, res, next) => {
    try {
        const { username, email, password, phone } = req.body;
        
        if (!username || !email || !password || !phone) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        console.log('⚠️ DEPRECATED: registerUser called - use registerWithVerification instead');
        
        // Check if user exists
        const existingUsers = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers && existingUsers.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }
        
        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Generate identifiers
        const applicationTicket = generateApplicationTicket(username, email);
        const converseId = await ensureUniqueConverseId();
        
        // Insert user
        const result = await db.query(`
            INSERT INTO users (username, email, password_hash, phone, application_ticket, converse_id, role, is_member, membership_stage, is_verified) 
            VALUES (?, ?, ?, ?, ?, ?, 'user', 'applied', 'none', 0)
        `, [username, email, passwordHash, phone, applicationTicket, converseId]);
        
        const userId = result.insertId;
        
        // Generate token
        const tokenPayload = { 
            user_id: userId, 
            email, 
            username,
            is_member: 'applied',
            membership_stage: 'none',
            role: 'user',
            converse_id: converseId
        };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // Set cookie
        res.cookie('access_token', token, { httpOnly: true });
        
        // Send welcome email
        try {
            await sendEmail(email, 'Welcome to Ikoota', `Welcome ${username}! Please complete your application survey.`);
        } catch (emailError) {
            console.warn('⚠️ Welcome email failed:', emailError);
        }
        
        res.status(201).json({
            message: 'Registration in progress; please take the Application survey to complete registration',
            redirectTo: '/applicationsurvey',
            user: { id: userId, username, email, application_ticket: applicationTicket }
        });
        
    } catch (error) {
        console.error('❌ Legacy register error:', error);
        next(error);
    }
};

/**
 * Legacy login function for backward compatibility
 * @deprecated Use enhancedLogin instead
 */
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        console.log('⚠️ DEPRECATED: loginUser called - use enhancedLogin instead');
        
        // Get user
       const usersResult = await db.query(`
    SELECT id, username, email, password_hash, role, is_member, membership_stage, isbanned
    FROM users WHERE email = ?
`, [email]);
const users = extractDbRows(usersResult);
        
        if (!users || users.length === 0) {
            throw new CustomError('Invalid credentials', 401);
        }
        
        const user = users[0];
        
        if (user.isbanned) {
            throw new CustomError('Account is banned', 403);
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new CustomError('Invalid credentials', 401);
        }
        
        // Generate token
        const tokenPayload = {
            user_id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            is_member: user.is_member,
            membership_stage: user.membership_stage
        };
        
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.cookie('access_token', token, { httpOnly: true });
        
        res.status(200).json({ 
            message: 'Login successful', 
            token, 
            Status: "Success",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                is_member: user.is_member,
                membership_stage: user.membership_stage
            }
        });
        
    } catch (error) {
        console.error('❌ Legacy login error:', error);
        next(error);
    }
};

// ===============================================
// ADDITIONAL UTILITY CONTROLLERS
// ===============================================

/**
 * Health check for auth system
 * GET /api/auth/health
 */
export const authHealthCheck = async (req, res) => {
    try {
        // Test database connection
        const result = await db.query('SELECT COUNT(*) as user_count FROM users LIMIT 1');
        
        return successResponse(res, {
            status: 'healthy',
            database: 'connected',
            userCount: result[0].user_count,
            timestamp: new Date().toISOString()
        }, 'Authentication system is healthy');
        
    } catch (error) {
        console.error('❌ Auth health check failed:', error);
        return res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Get auth system statistics
 * GET /api/auth/stats (Admin only)
 */
export const getAuthStats = async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_users,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
                SUM(CASE WHEN isbanned = 1 THEN 1 ELSE 0 END) as banned_users,
                SUM(CASE WHEN DATE(createdAt) = CURDATE() THEN 1 ELSE 0 END) as new_users_today,
                SUM(CASE WHEN DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_users_week
            FROM users
        `);
        
        const verificationStats = await db.query(`
            SELECT 
                COUNT(*) as pending_verifications,
                SUM(CASE WHEN method = 'email' THEN 1 ELSE 0 END) as email_verifications,
                SUM(CASE WHEN method = 'phone' THEN 1 ELSE 0 END) as phone_verifications,
                SUM(CASE WHEN expiresAt < NOW() THEN 1 ELSE 0 END) as expired_codes
            FROM verification_codes
        `);
        
        return successResponse(res, {
            users: stats[0],
            verifications: verificationStats[0],
            generatedAt: new Date().toISOString()
        }, 'Authentication statistics retrieved');
        
    } catch (error) {
        console.error('❌ Auth stats error:', error);
        return errorResponse(res, error);
    }
};

// ===============================================
// EXPORT DEFAULT CONTROLLER OBJECT
// ===============================================

export default {
    // Main authentication functions
    sendVerificationCode,
    registerWithVerification,
    enhancedLogin,
    logoutUser,
    requestPasswordReset,
    resetPassword,
    verifyPasswordReset,
    verifyUser,
    getAuthenticatedUser,
    
    // Legacy compatibility
    registerUser,
    loginUser,
    
    // Utility functions
    authHealthCheck,
    getAuthStats
};

kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkppppppppppppppppppppp

// ikootaapi/middleware/auth.js - ENHANCED WITH SURVEY INTEGRATION
// Enhanced version of your existing middleware with survey capabilities
// Maintains all existing functionality while adding survey-specific features

import jwt from 'jsonwebtoken';
import db from '../config/db.js';

// ===============================================
// ENHANCED AUTHENTICATION MIDDLEWARE
// ===============================================

/**
 * Main authentication middleware - Enhanced with survey capabilities
 * Verifies JWT token and adds comprehensive user info to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    console.log('🔍 Authentication middleware called for:', req.method, req.originalUrl);
    
    // Extract token from multiple sources
    let token = null;
    
    // Method 1: Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('✅ Token found in Authorization header');
    }
    
    // Method 2: Custom header
    if (!token && req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
      console.log('✅ Token found in x-auth-token header');
    }
    
    // Method 3: Cookies
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {});
      
      token = cookies.access_token || cookies.token;
      if (token) {
        console.log('✅ Token found in cookies');
      }
    }
    
    // Method 4: Simple header extraction (preserve existing logic)
    if (!token) {
      const altToken = authHeader?.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;
      if (altToken) {
        token = altToken;
        console.log('✅ Token found via alternative extraction');
      }
    }
    
    if (!token) {
      console.log('❌ No authentication token found');
      return res.status(401).json({
        success: false,
        error: 'Authorization header required',
        message: 'No token provided',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('🔍 Token received (first 20 chars):', token.substring(0, 20) + '...');
    
    // Verify JWT token with better error handling
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ JWT token verified successfully');
    console.log('👤 Decoded user info:', {
      user_id: decoded.user_id || decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    });
    
    // Get comprehensive user data from database
    const userResult = await db.query(`
      SELECT 
        id, username, email, role, is_member, membership_stage, 
        isbanned, is_verified, converse_id, application_ticket,
        full_membership_status, application_status, mentor_id, 
        primary_class_id, createdAt, updatedAt
      FROM users 
      WHERE id = ?
    `, [decoded.user_id || decoded.id]);
    
    // Handle MySQL result format properly
    let users = [];
    if (Array.isArray(userResult)) {
      users = userResult;
    } else if (userResult && userResult.rows && Array.isArray(userResult.rows)) {
      users = userResult.rows;
    } else if (userResult && Array.isArray(userResult[0])) {
      users = userResult[0];
    }
    
    console.log('📊 Database query result:', {
      resultType: typeof userResult,
      isArray: Array.isArray(userResult),
      userCount: users.length,
      firstUser: users[0] ? 'found' : 'not found'
    });
    
    if (!users || users.length === 0) {
      console.log('❌ User not found in database:', decoded.user_id || decoded.id);
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'User account not found in system',
        timestamp: new Date().toISOString()
      });
    }
    
    const user = users[0];
    
    // Check if user is banned
    if (user.isbanned) {
      console.log('❌ User is banned:', user.email);
      return res.status(403).json({
        success: false,
        error: 'Account has been suspended',
        message: 'Your account has been banned',
        timestamp: new Date().toISOString()
      });
    }
    
    // ✅ ENHANCED: Add comprehensive user info including survey permissions
    req.user = {
      // Primary identifiers
      id: user.id,
      user_id: user.id, // For backward compatibility
      username: user.username,
      email: user.email,
      
      // Role and permissions
      role: user.role || 'user',
      is_member: user.is_member,
      membership_stage: user.membership_stage,
      
      // Status flags
      is_verified: user.is_verified,
      isbanned: user.isbanned,
      
      // Relationships
      converse_id: user.converse_id,
      mentor_id: user.mentor_id,
      primary_class_id: user.primary_class_id,
      
      // Application tracking
      application_ticket: user.application_ticket,
      full_membership_status: user.full_membership_status,
      application_status: user.application_status,
      
      // ✅ NEW: Survey system permissions
      can_submit_surveys: true, // All authenticated users can submit general surveys
      can_save_drafts: true,
      can_view_survey_history: true,
      can_admin_surveys: ['admin', 'super_admin'].includes(user.role || 'user'),
      can_approve_surveys: ['admin', 'super_admin'].includes(user.role || 'user'),
      can_export_survey_data: user.role === 'super_admin',
      can_manage_questions: ['admin', 'super_admin'].includes(user.role || 'user'),
      can_bulk_operations: ['admin', 'super_admin'].includes(user.role || 'user'),
      
      // Timestamps
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      
      // Token data for compatibility
      token_role: decoded.role,
      token_membership_stage: decoded.membership_stage,
      token_is_member: decoded.is_member,
      
      // Decoded token info
      token_data: decoded
    };
    
    console.log('✅ Authentication successful for user:', user.username);
    console.log('📊 Survey permissions:', {
      can_submit: req.user.can_submit_surveys,
      can_admin: req.user.can_admin_surveys,
      can_approve: req.user.can_approve_surveys,
      can_export: req.user.can_export_survey_data
    });
    
    next();
    
  } catch (error) {
    console.error('❌ Authentication middleware error:', {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'JWT token is malformed or invalid',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Authentication token has expired',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Internal server error during authentication',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// BACKWARD COMPATIBILITY EXPORTS
// ===============================================
export const authenticateToken = authenticate;

// ===============================================
// ENHANCED OPTIONAL AUTHENTICATION
// ===============================================
export const optionalAuth = async (req, res, next) => {
  try {
    console.log('⚠️ Optional authentication for:', req.method, req.originalUrl);
    
    // Extract token from various sources
    const token = req.headers.authorization?.split(' ')[1] || 
                 req.headers['x-auth-token'] || 
                 req.cookies?.access_token;
    
    if (!token) {
      console.log('⚠️ Optional auth: no token provided, continuing without user');
      req.user = null;
      return next();
    }
    
    // Try to authenticate but don't fail if it doesn't work
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const userResult = await db.query(
        'SELECT id, username, email, role, membership_stage, is_member, isbanned FROM users WHERE id = ?',
        [decoded.user_id || decoded.id]
      );
      
      let users = [];
      if (Array.isArray(userResult)) {
        users = userResult;
      } else if (userResult && Array.isArray(userResult[0])) {
        users = userResult[0];
      }

      if (users && users.length > 0 && !users[0].isbanned) {
        req.user = {
          id: users[0].id,
          user_id: users[0].id,
          username: users[0].username,
          email: users[0].email,
          role: users[0].role || 'user',
          membership_stage: users[0].membership_stage,
          is_member: users[0].is_member,
          // Survey permissions for optional auth
          can_submit_surveys: true,
          can_admin_surveys: ['admin', 'super_admin'].includes(users[0].role || 'user'),
          can_approve_surveys: ['admin', 'super_admin'].includes(users[0].role || 'user'),
          can_export_survey_data: users[0].role === 'super_admin'
        };
        console.log('✅ Optional auth succeeded for:', users[0].username);
      } else {
        req.user = null;
        console.log('⚠️ Optional auth: user not found or banned');
      }
    } catch (tokenError) {
      req.user = null;
      console.log('⚠️ Optional auth failed:', tokenError.message);
    }
    
    next();
  } catch (error) {
    console.error('⚠️ Optional auth error:', error);
    req.user = null;
    next();
  }
};

// ===============================================
// ENHANCED ROLE-BASED AUTHORIZATION
// ===============================================
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      const userRole = req.user.role || 'user';
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      if (!roles.includes(userRole)) {
        console.log('❌ Insufficient permissions:', {
          userRole,
          requiredRoles: roles,
          user: req.user.username,
          endpoint: req.originalUrl
        });
        
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `Requires one of: ${roles.join(', ')}`,
          required: roles,
          current: userRole,
          timestamp: new Date().toISOString()
        });
      }

      console.log('✅ Role authorization successful:', userRole);
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// ===============================================
// ENHANCED MEMBERSHIP-BASED AUTHORIZATION
// ===============================================
export const requireMembershipStage = (allowedStages) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      const userStage = req.user.membership_stage || 'none';
      const stages = Array.isArray(allowedStages) ? allowedStages : [allowedStages];
      
      if (!stages.includes(userStage)) {
        console.log('❌ Insufficient membership level:', {
          userStage,
          requiredStages: stages,
          user: req.user.username
        });
        
        return res.status(403).json({
          success: false,
          error: 'Membership level insufficient',
          message: `Requires: ${stages.join(' or ')}`,
          required: stages,
          current: userStage,
          timestamp: new Date().toISOString()
        });
      }

      console.log('✅ Membership authorization successful:', userStage);
      next();
    } catch (error) {
      console.error('Membership authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Membership authorization failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};


// ===============================================
// ENHANCED MEMBERSHIP-BASED AUTHORIZATION
// ===============================================
export const requireMembership = (allowedStages) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      const userStage = req.user.membership_stage || 'none';
      const stages = Array.isArray(allowedStages) ? allowedStages : [allowedStages];
      
      if (!stages.includes(userStage)) {
        console.log('❌ Insufficient membership level:', {
          userStage,
          requiredStages: stages,
          user: req.user.username
        });
        
        return res.status(403).json({
          success: false,
          error: 'Membership level insufficient',
          message: `Requires: ${stages.join(' or ')}`,
          required: stages,
          current: userStage,
          timestamp: new Date().toISOString()
        });
      }

      console.log('✅ Membership authorization successful:', userStage);
      next();
    } catch (error) {
      console.error('Membership authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Membership authorization failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};



// ===============================================
// ENHANCED CONTENT ACCESS CONTROL
// ===============================================
export const requireContentAccess = (contentType) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      const { membership_stage, role } = req.user;
      
      // Admin and super_admin have access to everything
      if (['admin', 'super_admin'].includes(role)) {
        console.log('✅ Admin access granted for:', contentType);
        return next();
      }

      // Content access rules based on membership stage
      const accessRules = {
        'towncrier': ['pre_member', 'member'],
        'iko': ['member'],
        'basic': ['applicant', 'pre_member', 'member'],
        'classes': ['pre_member', 'member'],
        'admin': ['admin', 'super_admin'],
        // ✅ NEW: Survey access rules
        'surveys': ['applicant', 'pre_member', 'member'], // General surveys available to all members
        'survey_admin': ['admin', 'super_admin'], // Survey administration
        'survey_export': ['super_admin'] // Data export
      };

      const allowedStages = accessRules[contentType];
      
      if (!allowedStages || !allowedStages.includes(membership_stage)) {
        console.log('❌ Content access denied:', {
          contentType,
          userStage: membership_stage,
          allowedStages,
          user: req.user.username
        });
        
        return res.status(403).json({
          success: false,
          error: `Access denied to ${contentType} content`,
          required_membership: allowedStages,
          current_membership: membership_stage,
          upgrade_info: getUpgradeInfo(membership_stage, contentType),
          timestamp: new Date().toISOString()
        });
      }

      console.log('✅ Content access granted for:', contentType);
      next();
    } catch (error) {
      console.error('Content access error:', error);
      res.status(500).json({
        success: false,
        error: 'Content access check failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// ===============================================
// ADMIN AUTHORIZATION SHORTCUTS
// ===============================================
export const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      errorType: 'authorization_error',
      timestamp: new Date().toISOString()
    });
  }
  console.log('✅ Admin access granted to:', req.user.username);
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Super admin access required',
      errorType: 'authorization_error',
      timestamp: new Date().toISOString()
    });
  }
  console.log('✅ Super admin access granted to:', req.user.username);
  next();
};

// Legacy authorization function for backward compatibility
export const authorize = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Authorization failed. No user found.',
          errorType: 'authorization_error',
          timestamp: new Date().toISOString()
        });
      }

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          success: false,
          error: 'Authorization failed. Insufficient permissions.',
          errorType: 'authorization_error',
          requiredRoles: roles,
          userRole: user.role,
          timestamp: new Date().toISOString()
        });
      }

      next();
    } catch (error) {
      console.error('Error in authorize middleware:', error.message);
      res.status(403).json({ 
        success: false,
        error: 'Authorization failed.',
        errorType: 'authorization_error',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// ===============================================
// ✅ NEW: SURVEY-SPECIFIC MIDDLEWARE FUNCTIONS
// ===============================================

/**
 * Middleware to check if user can submit surveys
 */
export const canSubmitSurveys = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required for survey submission',
      timestamp: new Date().toISOString()
    });
  }
  
  // All authenticated users can submit surveys
  if (req.user.can_submit_surveys) {
    console.log('✅ User authorized for survey submission:', req.user.username);
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Survey submission not available for this account',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware to check if user can access survey admin features
 */
export const canAdminSurveys = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required for survey administration',
      timestamp: new Date().toISOString()
    });
  }
  
  if (req.user.can_admin_surveys) {
    console.log('✅ User authorized for survey administration:', req.user.username);
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Survey administration requires admin privileges',
      required_role: 'admin or super_admin',
      current_role: req.user.role,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware to check if user can approve/reject surveys
 */
export const canApproveSurveys = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required for survey approval',
      timestamp: new Date().toISOString()
    });
  }
  
  if (req.user.can_approve_surveys) {
    console.log('✅ User authorized for survey approval:', req.user.username);
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Survey approval requires admin privileges',
      required_role: 'admin or super_admin',
      current_role: req.user.role,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware to check if user can export survey data
 */
export const canExportSurveyData = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required for data export',
      timestamp: new Date().toISOString()
    });
  }
  
  if (req.user.can_export_survey_data) {
    console.log('✅ User authorized for survey data export:', req.user.username);
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Survey data export requires super admin privileges',
      required_role: 'super_admin',
      current_role: req.user.role,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// OWNERSHIP-BASED AUTHORIZATION
// ===============================================
export const requireOwnershipOrAdmin = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      const { role, id: currentUserId } = req.user;
      
      // Admins can access anything
      if (['admin', 'super_admin'].includes(role)) {
        console.log('✅ Admin ownership bypass for:', req.user.username);
        return next();
      }

      // Check if user owns the resource
      const resourceUserId = req.params[resourceUserIdField] || 
                           req.body[resourceUserIdField] || 
                           req.query[resourceUserIdField];

      if (parseInt(resourceUserId) === currentUserId) {
        console.log('✅ Resource ownership verified for:', req.user.username);
        return next();
      }

      console.log('❌ Resource ownership failed:', {
        currentUserId,
        resourceUserId,
        field: resourceUserIdField
      });

      res.status(403).json({
        success: false,
        error: 'Access denied - can only access your own resources',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        error: 'Ownership check failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// ===============================================
// RATE LIMITING MIDDLEWARE
// ===============================================
export const rateLimit = (maxRequests = 10, windowMs = 60000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    try {
      const key = req.user?.id || req.ip;
      const now = Date.now();
      
      if (!requests.has(key)) {
        requests.set(key, []);
      }
      
      const userRequests = requests.get(key);
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: Math.ceil(windowMs / 1000),
          timestamp: new Date().toISOString()
        });
      }
      
      validRequests.push(now);
      requests.set(key, validRequests);
      
      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next(); // Continue on error
    }
  };
};

// ===============================================
// CACHING MIDDLEWARE
// ===============================================
export const cacheMiddleware = (duration = 300) => {
  const cache = new Map();
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < duration * 1000) {
      console.log('✅ Cache hit for:', key);
      return res.json(cached.data);
    }
    
    const originalSend = res.json;
    res.json = function(data) {
      cache.set(key, { data, timestamp: Date.now() });
      console.log('💾 Cached response for:', key);
      originalSend.call(this, data);
    };
    
    next();
  };
};

// ===============================================
// AUDIT LOGGING MIDDLEWARE
// ===============================================
export const auditLog = (action) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        // Log the action using your existing audit_logs table structure
        await db.query(
          'INSERT INTO audit_logs (user_id, action, resource, details, ip_address, user_agent, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
          [
            req.user.id,
            action,
            req.originalUrl,
            JSON.stringify({
              method: req.method,
              url: req.originalUrl,
              timestamp: new Date().toISOString(),
              userId: req.user.id,
              username: req.user.username,
              survey_action: action.includes('survey') // Flag survey-related actions
            }),
            req.ip || req.connection?.remoteAddress,
            req.get('User-Agent')
          ]
        );
        console.log('📝 Audit log created for:', action);
      }
      next();
    } catch (error) {
      console.error('Audit log error:', error);
      next(); // Continue on error
    }
  };
};

// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Helper function to get upgrade information
 */
function getUpgradeInfo(currentStage, contentType) {
  const upgradeMap = {
    'none': {
      'towncrier': 'Apply for initial membership to access Towncrier content',
      'iko': 'Apply for initial membership first, then upgrade to full member',
      'classes': 'Apply for initial membership to join classes',
      'surveys': 'Apply for initial membership to access advanced survey features',
      'survey_admin': 'Admin role required for survey administration'
    },
    'applicant': {
      'towncrier': 'Wait for application approval to access Towncrier content',
      'iko': 'Get approved as pre-member first, then apply for full membership',
      'classes': 'Wait for application approval to join classes',
      'surveys': 'All survey features available to applicants',
      'survey_admin': 'Admin role required for survey administration'
    },
    'pre_member': {
      'iko': 'Apply for full membership to access Iko content',
      'surveys': 'All survey features available to pre-members',
      'survey_admin': 'Admin role required for survey administration'
    },
    'member': {
      'surveys': 'All survey features available to full members',
      'survey_admin': 'Admin role required for survey administration'
    }
  };
  
  return upgradeMap[currentStage]?.[contentType] || 'Contact support for upgrade information';
}

// ===============================================
// COMPREHENSIVE DEFAULT EXPORT
// ===============================================
export default {
  // Main authentication
  authenticate,
  authenticateToken,
  optionalAuth,
  
  // Role-based authorization
  requireRole,
  requireMembership,
  requireContentAccess,
  
  // Admin shortcuts
  requireAdmin,
  requireSuperAdmin,
  authorize,
  
  // ✅ NEW: Survey-specific middleware
  canSubmitSurveys,
  canAdminSurveys,
  canApproveSurveys,
  canExportSurveyData,
  
  // Ownership and security
  requireOwnershipOrAdmin,
  rateLimit,
  auditLog,
  
  // Utility
  cacheMiddleware
};

// ===============================================
// SURVEY INTEGRATION LOGGING
// ===============================================

if (process.env.NODE_ENV === 'development') {
  console.log('✅ Enhanced authentication middleware loaded with survey system support');
  console.log('📊 Survey-specific middleware functions available:');
  console.log('   • canSubmitSurveys - Check survey submission permissions');
  console.log('   • canAdminSurveys - Check survey admin permissions'); 
  console.log('   • canApproveSurveys - Check survey approval permissions');
  console.log('   • canExportSurveyData - Check data export permissions');
  console.log('🔗 Survey system fully integrated with existing authentication');
  console.log('🔄 All existing functionality preserved and enhanced');
}







kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk


// ikootaapi/services/authServices.js
// ENHANCED & REORGANIZED AUTHENTICATION SERVICES
// Aligned with new database schema and reorganized architecture

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { sendEmail } from '../utils/email.js';
import { sendSMS } from '../utils/sms.js';

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

const generateApplicationTicket = (username, email, type = 'INITIAL') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const prefix = type === 'FULL' ? 'FMA' : 'APP';
    return `${prefix}-${username.substr(0, 3).toUpperCase()}-${timestamp}-${random}`.toUpperCase();
};

const generateConverseId = () => {
    const prefix = 'OTO#';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    try {
        for (let i = 0; i < 6; i++) {
            result += chars[crypto.randomInt(0, chars.length)];
        }
    } catch (error) {
        console.warn('⚠️ Crypto not available, using Math.random fallback');
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    
    return prefix + result;
};

const ensureUniqueConverseId = async () => {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        const candidateId = generateConverseId();
        
        try {
            const [existingUsers] = await db.query('SELECT id FROM users WHERE converse_id = ?', [candidateId]);
            
            if (!existingUsers || existingUsers.length === 0) {
                console.log('✅ Generated unique converse ID:', candidateId);
                return candidateId;
            }
            
            console.log('⚠️ Converse ID collision, retrying...', candidateId);
            attempts++;
        } catch (error) {
            console.error('❌ Error checking converse ID uniqueness:', error);
            return candidateId;
        }
    }
    
    console.warn('⚠️ Max attempts reached, using last generated ID');
    return generateConverseId();
};

// ===============================================
// MAIN AUTHENTICATION SERVICES
// ===============================================

/**
 * Register user with verification
 * Enhanced version with proper transaction handling
 */
export const registerUserService = async (userData) => {
    const { username, email, password, phone, verificationCode, verificationMethod = 'email' } = userData;
    
    try {
        console.log('🔍 registerUserService called for:', { username, email, verificationMethod });
        
        // Input validation
        if (!username || !email || !password || !verificationCode) {
            throw new CustomError('All required fields must be provided', 400);
        }
        
        // Check for existing users
        const existingUsers = await db.query('SELECT email, username FROM users WHERE email = ? OR username = ?', [email, username]);
        
        if (existingUsers && existingUsers.length > 0) {
            const existing = existingUsers[0];
            if (existing.email === email) {
                throw new CustomError('User with this email already exists', 409);
            }
            if (existing.username === username) {
                throw new CustomError('Username is already taken', 409);
            }
        }
        
        // Verify verification code
        const verificationTarget = verificationMethod === 'email' ? email : phone;
        const verificationRows = await db.query(`
            SELECT id, code, method, expiresAt
            FROM verification_codes 
            WHERE ${verificationMethod === 'email' ? 'email' : 'phone'} = ? 
                AND code = ? 
                AND method = ? 
                AND expiresAt > NOW()
            ORDER BY createdAt DESC
            LIMIT 1
        `, [verificationTarget, verificationCode.trim(), verificationMethod]);
        
        if (!verificationRows || verificationRows.length === 0) {
            throw new CustomError('Invalid or expired verification code', 400);
        }
        
        console.log('✅ Verification code validated');
        
        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Generate identifiers
        const applicationTicket = generateApplicationTicket(username, email);
        const converseId = await ensureUniqueConverseId();
        
        console.log('🔍 Creating user with identifiers:', { applicationTicket, converseId });
        
        // Insert user
        const insertResult = await db.query(`
            INSERT INTO users (
                username, email, password_hash, phone, application_ticket, converse_id,
                verification_method, is_verified, role, is_member, membership_stage,
                full_membership_status, application_status, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'user', 'applied', 'none', 'not_applied', 'not_submitted', NOW(), NOW())
        `, [username, email, passwordHash, phone || null, applicationTicket, converseId, verificationMethod]);
        
        const userId = insertResult.insertId;
        
        if (!userId) {
            throw new Error('Failed to create user - no ID returned');
        }
        
        console.log('✅ User created with ID:', userId);
        
        // Clean up verification codes
        await db.query(`
            DELETE FROM verification_codes 
            WHERE ${verificationMethod === 'email' ? 'email' : 'phone'} = ?
        `, [verificationTarget]);
        
        console.log('✅ Registration completed successfully');
        
        // Send welcome email
        try {
            await sendEmail(email, 'Welcome to Ikoota', `
                Welcome ${username}!
                
                Your account has been created successfully.
                Application Ticket: ${applicationTicket}
                
                Next step: Complete your application survey to be considered for membership.
                
                Best regards,
                The Ikoota Team
            `);
        } catch (emailError) {
            console.warn('⚠️ Welcome email failed:', emailError);
        }
        
        return {
            userId,
            username,
            email,
            applicationTicket,
            converseId,
            membershipStage: 'none',
            isMember: 'applied'
        };
        
    } catch (error) {
        console.error('❌ registerUserService error:', error);
        throw error;
    }
};

/**
 * Enhanced login service with comprehensive user data
 */
export const loginUserService = async (email, password) => {
    try {
        console.log('🔍 loginUserService called for:', email);
        
        if (!email || !password) {
            throw new CustomError('Email and password are required', 400);
        }
        
        // Get user from database with all necessary fields
        const users = await db.query(`
            SELECT 
                id, username, email, password_hash, role, is_member, membership_stage,
                is_verified, isbanned, application_ticket, converse_id, 
                full_membership_status, application_status, phone, createdAt, updatedAt
            FROM users 
            WHERE email = ?
        `, [email]);
        
        if (!users || users.length === 0) {
            console.log('❌ No user found with email:', email);
            throw new CustomError('Invalid credentials', 401);
        }
        
        const user = users[0];
        
        // Security checks
        if (user.isbanned) {
            console.log('❌ User is banned:', email);
            throw new CustomError('Account is banned', 403);
        }
        
        if (!user.password_hash) {
            console.log('❌ No password hash found for user:', email);
            throw new CustomError('Invalid account configuration', 500);
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            console.log('❌ Invalid password for user:', email);
            throw new CustomError('Invalid credentials', 401);
        }
        
        console.log('✅ Password verified successfully');
        
        // Update last login
        try {
            await db.query('UPDATE users SET updatedAt = NOW() WHERE id = ?', [user.id]);
        } catch (updateError) {
            console.warn('⚠️ Failed to update last login:', updateError);
        }
        
        // Create JWT payload
        const tokenPayload = {
            user_id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            is_member: user.is_member,
            membership_stage: user.membership_stage,
            is_verified: user.is_verified,
            full_membership_status: user.full_membership_status,
            application_status: user.application_status,
            converse_id: user.converse_id,
            application_ticket: user.application_ticket
        };
        
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        console.log('✅ Login successful for user:', {
            id: user.id,
            email: user.email,
            role: user.role,
            membership_stage: user.membership_stage
        });
        
        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                is_member: user.is_member,
                membership_stage: user.membership_stage,
                is_verified: user.is_verified,
                full_membership_status: user.full_membership_status,
                application_status: user.application_status,
                converse_id: user.converse_id,
                application_ticket: user.application_ticket
            }
        };
        
    } catch (error) {
        console.error('❌ loginUserService error:', error);
        throw error;
    }
};

/**
 * Send verification code service
 */
export const sendVerificationCodeService = async (email, phone, method = 'email') => {
    try {
        console.log('🔍 sendVerificationCodeService called:', { email, phone, method });
        
        if (!email && !phone) {
            throw new CustomError('Email or phone number is required', 400);
        }
        
        if (!['email', 'phone'].includes(method)) {
            throw new CustomError('Invalid verification method', 400);
        }
        
        // Generate 6-digit code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Clean up expired codes
        const target = method === 'email' ? email : phone;
        await db.query(`
            DELETE FROM verification_codes 
            WHERE ${method === 'email' ? 'email' : 'phone'} = ? 
            AND expiresAt < NOW()
        `, [target]);
        
        // Insert new verification code
        await db.query(`
            INSERT INTO verification_codes (email, phone, code, method, expiresAt, createdAt) 
            VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW())
        `, [email || null, phone || null, verificationCode, method]);
        
        console.log('✅ Verification code stored in database');
        
        // Send verification code
        if (method === 'email' && email) {
            await sendEmail(email, 'Verification Code', `Your Ikoota verification code is: ${verificationCode}. Valid for 10 minutes.`);
            console.log('✅ Verification email sent');
        } else if (method === 'phone' && phone) {
            await sendSMS(phone, `Your Ikoota verification code is: ${verificationCode}. Valid for 10 minutes.`);
            console.log('✅ Verification SMS sent');
        }
        
        return {
            success: true,
            method,
            target,
            expiresIn: 600,
            ...(process.env.NODE_ENV === 'development' && { devCode: verificationCode })
        };
        
    } catch (error) {
        console.error('❌ sendVerificationCodeService error:', error);
        throw error;
    }
};

/**
 * Password reset request service
 */
export const sendPasswordResetService = async (email) => {
    try {
        console.log('🔍 sendPasswordResetService called for:', email);
        
        if (!email) {
            throw new CustomError('Email is required', 400);
        }
        
        // Check if user exists
        const users = await db.query('SELECT id, email, username FROM users WHERE email = ?', [email]);
        
        if (!users || users.length === 0) {
            // For security, don't reveal if email exists
            console.log('⚠️ Password reset requested for non-existent email:', email);
            return { success: true, message: 'If account exists, reset email will be sent' };
        }
        
        const user = users[0];
        
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour
        
        // Store reset token
        await db.query(`
            UPDATE users 
            SET resetToken = ?, resetTokenExpiry = ?, updatedAt = NOW() 
            WHERE email = ?
        `, [resetToken, resetTokenExpiry, email]);
        
        // Send reset email
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        
        await sendEmail(email, 'Password Reset Request', `
            Hello ${user.username},
            
            You requested a password reset for your Ikoota account.
            
            Click the link below to reset your password:
            ${resetLink}
            
            This link will expire in 1 hour.
            
            If you didn't request this reset, please ignore this email.
            
            Best regards,
            The Ikoota Team
        `);
        
        console.log('✅ Password reset email sent for:', email);
        
        return {
            success: true,
            message: 'Password reset email sent',
            resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
        };
        
    } catch (error) {
        console.error('❌ sendPasswordResetService error:', error);
        throw error;
    }
};

/**
 * Password reset service
 */
export const resetPasswordService = async (token, newPassword) => {
    try {
        console.log('🔍 resetPasswordService called with token');
        
        if (!token || !newPassword) {
            throw new CustomError('Token and new password are required', 400);
        }
        
        if (newPassword.length < 8) {
            throw new CustomError('Password must be at least 8 characters long', 400);
        }
        
        // Find user with valid reset token
        const users = await db.query(`
            SELECT id, email, username, resetToken, resetTokenExpiry 
            FROM users 
            WHERE resetToken = ? AND resetTokenExpiry > ?
        `, [token, Date.now()]);
        
        if (!users || users.length === 0) {
            throw new CustomError('Invalid or expired reset token', 400);
        }
        
        const user = users[0];
        
        // Hash new password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);
        
        // Update password and clear reset token
        await db.query(`
            UPDATE users 
            SET password_hash = ?, resetToken = NULL, resetTokenExpiry = NULL, updatedAt = NOW()
            WHERE id = ?
        `, [passwordHash, user.id]);
        
        console.log('✅ Password reset successful for user:', user.email);
        
        // Send confirmation email
        try {
            await sendEmail(user.email, 'Password Reset Successful', `
                Hello ${user.username},
                
                Your password has been successfully reset.
                
                If you didn't make this change, please contact our support team immediately.
                
                Best regards,
                The Ikoota Team
            `);
        } catch (emailError) {
            console.warn('⚠️ Confirmation email failed:', emailError);
        }
        
        return {
            success: true,
            message: 'Password reset successful',
            userId: user.id
        };
        
    } catch (error) {
        console.error('❌ resetPasswordService error:', error);
        throw error;
    }
};

/**
 * Verify reset token service
 */
export const verifyResetTokenService = async (token) => {
    try {
        console.log('🔍 verifyResetTokenService called');
        
        if (!token) {
            throw new CustomError('Reset token is required', 400);
        }
        
        // Check if token is valid and not expired
        const users = await db.query(`
            SELECT id, email, username, resetTokenExpiry,
                   TIMESTAMPDIFF(SECOND, NOW(), FROM_UNIXTIME(resetTokenExpiry/1000)) as seconds_until_expiry
            FROM users 
            WHERE resetToken = ? AND resetTokenExpiry > ?
        `, [token, Date.now()]);
        
        if (!users || users.length === 0) {
            throw new CustomError('Invalid or expired reset token', 400);
        }
        
        const user = users[0];
        const minutesRemaining = Math.floor(user.seconds_until_expiry / 60);
        
        console.log('✅ Reset token verified for user:', user.email);
        
        return {
            valid: true,
            email: user.email,
            username: user.username,
            expiresIn: minutesRemaining > 0 ? `${minutesRemaining} minutes` : 'Less than 1 minute'
        };
        
    } catch (error) {
        console.error('❌ verifyResetTokenService error:', error);
        throw error;
    }
};

/**
 * Get user by ID service
 */
export const getUserByIdService = async (userId) => {
    try {
        console.log('🔍 getUserByIdService called for ID:', userId);
        
        if (!userId) {
            throw new CustomError('User ID is required', 400);
        }
        
        const users = await db.query(`
            SELECT 
                id, username, email, role, is_member, membership_stage,
                is_verified, isbanned, application_ticket, converse_id,
                full_membership_status, application_status, phone, 
                createdAt, updatedAt
            FROM users 
            WHERE id = ?
        `, [userId]);
        
        if (!users || users.length === 0) {
            throw new CustomError('User not found', 404);
        }
        
        const user = users[0];
        
        // Remove sensitive information
        delete user.password_hash;
        delete user.resetToken;
        delete user.resetTokenExpiry;
        
        console.log('✅ User retrieved:', { id: user.id, email: user.email });
        
        return user;
        
    } catch (error) {
        console.error('❌ getUserByIdService error:', error);
        throw error;
    }
};

/**
 * Update user verification status
 */
export const updateUserVerificationService = async (email, isVerified = true) => {
    try {
        console.log('🔍 updateUserVerificationService called for:', email);
        
        if (!email) {
            throw new CustomError('Email is required', 400);
        }
        
        const result = await db.query(`
            UPDATE users 
            SET is_verified = ?, updatedAt = NOW() 
            WHERE email = ?
        `, [isVerified ? 1 : 0, email]);
        
        if (result.affectedRows === 0) {
            throw new CustomError('User not found', 404);
        }
        
        console.log('✅ User verification status updated for:', email);
        
        return {
            success: true,
            email,
            isVerified,
            updatedAt: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ updateUserVerificationService error:', error);
        throw error;
    }
};

/**
 * Generate verification code utility
 */
export const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Validate JWT token service
 */
export const validateTokenService = async (token) => {
    try {
        if (!token) {
            throw new CustomError('Token is required', 400);
        }
        
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get fresh user data
        const user = await getUserByIdService(decoded.user_id);
        
        if (user.isbanned) {
            throw new CustomError('User account is banned', 403);
        }
        
        return {
            valid: true,
            user,
            decoded
        };
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new CustomError('Invalid token', 401);
        } else if (error.name === 'TokenExpiredError') {
            throw new CustomError('Token expired', 401);
        } else {
            throw error;
        }
    }
};

/**
 * Cleanup expired verification codes
 */
export const cleanupExpiredCodesService = async () => {
    try {
        console.log('🔍 cleanupExpiredCodesService called');
        
        const result = await db.query(`
            DELETE FROM verification_codes 
            WHERE expiresAt < NOW()
        `);
        
        const deletedCount = result.affectedRows || 0;
        
        console.log(`✅ Cleaned up ${deletedCount} expired verification codes`);
        
        return {
            success: true,
            deletedCount,
            cleanedAt: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ cleanupExpiredCodesService error:', error);
        throw error;
    }
};

/**
 * Get authentication statistics
 */
export const getAuthStatsService = async () => {
    try {
        console.log('🔍 getAuthStatsService called');
        
        // User statistics
        const userStats = await db.query(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_users,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
                SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as super_admin_users,
                SUM(CASE WHEN isbanned = 1 THEN 1 ELSE 0 END) as banned_users,
                SUM(CASE WHEN DATE(createdAt) = CURDATE() THEN 1 ELSE 0 END) as new_users_today,
                SUM(CASE WHEN DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_users_week,
                SUM(CASE WHEN DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_users_month
            FROM users
        `);
        
        // Verification code statistics
        const verificationStats = await db.query(`
            SELECT 
                COUNT(*) as pending_verifications,
                SUM(CASE WHEN method = 'email' THEN 1 ELSE 0 END) as email_verifications,
                SUM(CASE WHEN method = 'phone' THEN 1 ELSE 0 END) as phone_verifications,
                SUM(CASE WHEN expiresAt < NOW() THEN 1 ELSE 0 END) as expired_codes,
                SUM(CASE WHEN DATE(createdAt) = CURDATE() THEN 1 ELSE 0 END) as codes_sent_today
            FROM verification_codes
        `);
        
        // Membership statistics
        const membershipStats = await db.query(`
            SELECT 
                SUM(CASE WHEN membership_stage = 'none' THEN 1 ELSE 0 END) as stage_none,
                SUM(CASE WHEN membership_stage = 'applicant' THEN 1 ELSE 0 END) as stage_applicant,
                SUM(CASE WHEN membership_stage = 'pre_member' THEN 1 ELSE 0 END) as stage_pre_member,
                SUM(CASE WHEN membership_stage = 'member' THEN 1 ELSE 0 END) as stage_member,
                SUM(CASE WHEN is_member = 'applied' THEN 1 ELSE 0 END) as status_applied,
                SUM(CASE WHEN is_member = 'pending' THEN 1 ELSE 0 END) as status_pending,
                SUM(CASE WHEN is_member = 'pre_member' THEN 1 ELSE 0 END) as status_pre_member,
                SUM(CASE WHEN is_member = 'member' THEN 1 ELSE 0 END) as status_member
            FROM users
        `);
        
        console.log('✅ Authentication statistics retrieved');
        
        return {
            users: userStats[0],
            verifications: verificationStats[0],
            membership: membershipStats[0],
            generatedAt: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ getAuthStatsService error:', error);
        throw error;
    }
};

// ===============================================
// LEGACY COMPATIBILITY SERVICES
// ===============================================

/**
 * Legacy send password reset email or SMS
 * @deprecated Use sendPasswordResetService instead
 */
export const sendPasswordResetEmailOrSMS = async (emailOrPhone) => {
    try {
        console.log('⚠️ DEPRECATED: sendPasswordResetEmailOrSMS called - use sendPasswordResetService instead');
        
        const isEmail = emailOrPhone.includes('@');
        
        if (isEmail) {
            return await sendPasswordResetService(emailOrPhone);
        } else {
            // For phone-based reset, we'd need SMS implementation
            throw new CustomError('Phone-based password reset not yet implemented', 501);
        }
        
    } catch (error) {
        console.error('❌ sendPasswordResetEmailOrSMS error:', error);
        throw error;
    }
};

/**
 * Legacy update password
 * @deprecated Use resetPasswordService instead
 */
export const updatePassword = async (emailOrPhone, newPassword) => {
    try {
        console.log('⚠️ DEPRECATED: updatePassword called - use resetPasswordService instead');
        
        const isEmail = emailOrPhone.includes('@');
        
        // Find user
        const users = await db.query(`
            SELECT id, email, username 
            FROM users 
            WHERE ${isEmail ? 'email' : 'phone'} = ?
        `, [emailOrPhone]);
        
        if (!users || users.length === 0) {
            throw new CustomError('User not found', 404);
        }
        
        const user = users[0];
        
        // Hash new password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);
        
        // Update password
        await db.query(`
            UPDATE users 
            SET password_hash = ?, resetToken = NULL, resetTokenExpiry = NULL, updatedAt = NOW()
            WHERE id = ?
        `, [passwordHash, user.id]);
        
        console.log('✅ Password updated for user:', user.email);
        
        return {
            success: true,
            message: 'Password updated successfully',
            userId: user.id
        };
        
    } catch (error) {
        console.error('❌ updatePassword error:', error);
        throw error;
    }
};

/**
 * Legacy verify reset code
 * @deprecated Use verifyResetTokenService instead
 */
export const verifyResetCode = async (emailOrPhone, verificationCode) => {
    try {
        console.log('⚠️ DEPRECATED: verifyResetCode called - use verifyResetTokenService instead');
        
        const isEmail = emailOrPhone.includes('@');
        
        // Find user
        const users = await db.query(`
            SELECT id, email, username, verification_code, codeExpiry 
            FROM users 
            WHERE ${isEmail ? 'email' : 'phone'} = ?
        `, [emailOrPhone]);
        
        if (!users || users.length === 0) {
            throw new CustomError('User not found', 404);
        }
        
        const user = users[0];
        
        if (user.verification_code !== verificationCode || user.codeExpiry < Date.now()) {
            throw new CustomError('Invalid or expired verification code', 400);
        }
        
        // Clear verification code
        await db.query(`
            UPDATE users 
            SET verification_code = NULL, codeExpiry = NULL, updatedAt = NOW()
            WHERE id = ?
        `, [user.id]);
        
        console.log('✅ Reset code verified for user:', user.email);
        
        return {
            success: true,
            message: 'Verification code validated',
            userId: user.id
        };
        
    } catch (error) {
        console.error('❌ verifyResetCode error:', error);
        throw error;
    }
};

// ===============================================
// EXPORT ALL SERVICES
// ===============================================

export default {
    // Main services
    registerUserService,
    loginUserService,
    sendVerificationCodeService,
    sendPasswordResetService,
    resetPasswordService,
    verifyResetTokenService,
    getUserByIdService,
    updateUserVerificationService,
    validateTokenService,
    cleanupExpiredCodesService,
    getAuthStatsService,
    
    // Utility functions
    generateVerificationCode,
    generateApplicationTicket,
    generateConverseId,
    ensureUniqueConverseId,
    
    // Legacy compatibility
    sendPasswordResetEmailOrSMS,
    updatePassword,
    verifyResetCode
};



