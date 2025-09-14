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
                membership_stage,
                initial_application_status,
                full_membership_appl_status,
                createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'user', 'none', 'not_applied', 'not_applied', NOW())
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
            initial_application_status: 'not_applied',
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
                initial_application_status: 'not_applied',
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
                    initial_application_status: 'not_applied',
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
                membership_stage,
                initial_application_status,
                full_membership_appl_status,
                is_verified,
                isbanned,
                application_ticket,
                converse_id,
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
            membership_stage: user.membership_stage,
            initial_application_status: user.initial_application_status
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
            initial_application_status: user.initial_application_status || 'not_applied',
            full_membership_appl_status: user.full_membership_appl_status || 'not_applied',
            role: user.role || 'user',
            converse_id: user.converse_id,
            application_ticket: user.application_ticket,
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
        const membershipStage = user.membership_stage?.toLowerCase();
        const initialAppStatus = user.initial_application_status?.toLowerCase();
        
        console.log('🔍 Determining redirect for user:', {
            role,
            membershipStage,
            initialAppStatus
        });
        
        if (role === 'admin' || role === 'super_admin') {
            redirectTo = '/admin';
            console.log('👑 Admin user - redirecting to admin panel');
        } else if (membershipStage === 'member') {
            redirectTo = '/iko';
            console.log('💎 Full member - redirecting to Iko Chat');
        } else if (membershipStage === 'pre_member') {
            redirectTo = '/towncrier';
            console.log('👤 Pre-member - redirecting to Towncrier');
        } else if (membershipStage === 'applicant' || initialAppStatus === 'submitted' || initialAppStatus === 'under_review') {
            redirectTo = '/applicationsurvey';
            console.log('📝 Applicant - redirecting to application survey');
        } else if (membershipStage === 'none' && initialAppStatus === 'not_applied') {
            redirectTo = '/applicationsurvey';
            console.log('🆕 New user - redirecting to application survey');
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
                initial_application_status: user.initial_application_status || 'not_applied',
                full_membership_appl_status: user.full_membership_appl_status || 'not_applied',
                role: user.role || 'user',
                converse_id: user.converse_id,
                application_ticket: user.application_ticket
            },
            // Also include nested data format for compatibility
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    membership_stage: user.membership_stage || 'none',
                    initial_application_status: user.initial_application_status || 'not_applied',
                    full_membership_appl_status: user.full_membership_appl_status || 'not_applied',
                    role: user.role || 'user',
                    converse_id: user.converse_id,
                    application_ticket: user.application_ticket
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
            SET is_verified = 1, membership_stage = 'applicant', initial_application_status = 'submitted', updatedAt = NOW()
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
                initial_application_status: req.user.initial_application_status,
                full_membership_appl_status: req.user.full_membership_appl_status,
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
                initial_application_status: req.user.initial_application_status,
                full_membership_appl_status: req.user.full_membership_appl_status,
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
            INSERT INTO users (username, email, password_hash, phone, application_ticket, converse_id, role, membership_stage, initial_application_status, is_verified) 
            VALUES (?, ?, ?, ?, ?, ?, 'user', 'none', 'not_applied', 0)
        `, [username, email, passwordHash, phone, applicationTicket, converseId]);
        
        const userId = result.insertId;
        
        // Generate token
        const tokenPayload = { 
            user_id: userId, 
            email, 
            username,
            membership_stage: 'none',
            initial_application_status: 'not_applied',
            full_membership_appl_status: 'not_applied',
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
    SELECT id, username, email, password_hash, role, membership_stage, initial_application_status, full_membership_appl_status, isbanned
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
            membership_stage: user.membership_stage,
            initial_application_status: user.initial_application_status,
            full_membership_appl_status: user.full_membership_appl_status
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
                membership_stage: user.membership_stage,
                initial_application_status: user.initial_application_status,
                full_membership_appl_status: user.full_membership_appl_status
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


