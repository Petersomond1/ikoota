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






// // ikootaapi/services/authServices.js
// import bcrypt from 'bcrypt';
// import CustomError from '../utils/CustomError.js';
// import { sendEmail } from '../utils/email.js';
// import jwt from 'jsonwebtoken';
// import crypto from 'crypto';
// import db from '../config/db.js';
// import { sendSMS } from '../utils/sms.js';

// export const registerUserService = async (userData) => {
//     const { username, email, password, phone } = userData;
//     try {
//         const existingUser = await db.query('SELECT * FROM users WHERE email = ?', [email]);
//         if (existingUser.length > 0) {
//             return { error: true, message: 'User already exists' };
//         }
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

       
//     const sql = 'INSERT INTO users (username, email, password_hash, phone, role, is_member) VALUES (?, ?, ?, ?, ?, ?)';
//     console.log(username, email, hashedPassword, phone);
//     const result = await db.query(sql, [username, email, hashedPassword, phone, false, false]);

//         const subject = 'Welcome to Our Platform!';
//         const text = `Hello ${username},\n\nWelcome to our platform! We're glad to have you. Please proceed with choosing your class on the form page.`;
//         await sendEmail(email, subject, text);

//         return result.insertId;
//     } catch (error) {
//         throw new CustomError('uncompleted request failed', 500, error);
//     }
// };



// export const loginUserService = async (email, password) => {
//     const sql = 'SELECT * FROM users WHERE email = ?';
//     const user = await db.query(sql, [email]);

//     if (user.length === 0) {
//         throw new CustomError('Invalid credentials', 401);
//     }

//     const isMatch = await bcrypt.compare(password, user[0].password_hash);
//     if (!isMatch) {
//         throw new CustomError('Invalid credentials', 401);
//     }

//     const payload = {
//         user_id: user[0].id,
//         email: user[0].email,
//         role:user[0].role,
//         isVerified: user[0].isVerified,
//         isConfirmed: user[0].isConfirmed,
//     };
//     const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

//     return token; // Return the token to the controller for setting the cookie during login
// };

// export const sendPasswordResetEmail = async (email) => {
//     const sql = 'SELECT * FROM users WHERE email = ?';
//     const user = await db.query(sql, [email]);

//     if (user.length === 0) {
//         throw new CustomError('User not found', 404);
//     }

//     const token = crypto.randomBytes(20).toString('hex'); // Generate a random token for password reset different from the JWT token
//     await db.query('UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?', [token, Date.now() + 3600000, email]);

//     const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
//     const subject = 'Password Reset Request';
//     const text = `To reset your password, please click the link below:\n\n${resetLink}`;
//     await sendEmail(email, subject, text);
// };



// // Generate a random verification code
// export const generateVerificationCode = () => {
//     return crypto.randomBytes(3).toString('hex').toUpperCase(); // Generates a 6-character alphanumeric code
//   };
  
//   // Send password reset link via email or SMS
//   export const sendPasswordResetEmailOrSMS = async (emailOrPhone) => {
//     let user;
//     const isEmail = emailOrPhone.includes('@');
  
//     if (isEmail) {
//       user = await db.query('SELECT * FROM users WHERE email = ?', [emailOrPhone]);
//     } else {
//       user = await db.query('SELECT * FROM users WHERE phone = ?', [emailOrPhone]);
//     }
  
//     if (user.length === 0) {
//       throw new CustomError('User not found', 404);
//     }
  
//     const token = crypto.randomBytes(20).toString('hex');
//     const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
//     const expiryTime = Date.now() + 3600000; // 1 hour
  
//     await db.query('UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?', [token, expiryTime, user[0].id]);
  
//     if (isEmail) {
//       const subject = 'Password Reset Request';
//       const text = `To reset your password, please click the link below:\n\n${resetLink}`;
//       await sendEmail(emailOrPhone, subject, text);
//     } else {
//       const message = `To reset your password, click the link: ${resetLink}`;
//       await sendSMS(emailOrPhone, message);
//     }
//   };
  
//   // Update the user's password
//   export const updatePassword = async (emailOrPhone, newPassword) => {
//     const isEmail = emailOrPhone.includes('@');
//     const user = isEmail
//       ? await db.query('SELECT * FROM users WHERE email = ?', [emailOrPhone])
//       : await db.query('SELECT * FROM users WHERE phone = ?', [emailOrPhone]);
  
//     if (user.length === 0) {
//       throw new CustomError('User not found', 404);
//     }
  
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(newPassword, salt);
  
//     await db.query('UPDATE users SET password_hash = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?', [
//       hashedPassword,
//       user[0].id,
//     ]);
//   };
  


//   // Verify the code sent to the alternate medium
//   export const verifyResetCode = async (emailOrPhone, verificationCode) => {
//     const isEmail = emailOrPhone.includes('@');
//     const user = isEmail
//       ? await db.query('SELECT * FROM users WHERE email = ?', [emailOrPhone])
//       : await db.query('SELECT * FROM users WHERE phone = ?', [emailOrPhone]);
  
//     if (user.length === 0) {
//       throw new CustomError('User not found', 404);
//     }
  
//     if (user[0].verificationCode !== verificationCode || user[0].codeExpiry < Date.now()) {
//       throw new CustomError('Invalid or expired verification code', 400);
//     }
  
//     await db.query('UPDATE users SET verificationCode = NULL, codeExpiry = NULL WHERE id = ?', [user[0].id]);
//   };
