// ikootaapi/controllers/membershipControllers.js
// ==================================================
// MAIN MEMBERSHIP CONTROLLERS - UNIFIED EXPORTS
// ==================================================

// Import all functions from the three modular files
import {
  // Utility functions
  generateApplicationTicket,
  getUserById,
  executeQuery,
  validateStageTransition,
  convertToCSV,
  successResponse,
  errorResponse,
  
  // Authentication & Registration
  enhancedLogin,
  sendVerificationCode,
  registerWithVerification,
  
  // Middleware helpers
  validateRequest,
  requireAdmin,
  requireSuperAdmin
} from './membershipControllers_1.js';

import {
  // User Dashboard & Status
  getUserDashboard,
  checkApplicationStatus,
  getApplicationHistory,
  getUserPermissions,
  
  // Application Management
  submitInitialApplication,
  updateApplicationAnswers,
  withdrawApplication,
  getApplicationRequirements,
  
  // Full Membership
  getFullMembershipStatus,
  submitFullMembershipApplication,
  logFullMembershipAccess
} from './membershipControllers_2.js';

import {
  // Admin Functions
  getPendingApplications,
  updateApplicationStatus,
  bulkApproveApplications,
  getPendingFullMemberships,
  updateFullMembershipStatus,
  
  // Analytics & Reporting
  getMembershipAnalytics,
  getMembershipOverview,
  getMembershipStats,
  exportMembershipData,
  
  // Notifications
  sendNotification,
  sendMembershipNotification,
  
  // System Functions
  healthCheck,
  getSystemConfig,
  deleteUserAccount,
  searchUsers,
  getAllReports,
} from './membershipControllers_3.js';

// ==================================================
// RE-EXPORT ALL FUNCTIONS FOR ROUTES
// ==================================================

// Authentication & Registration
export {
  enhancedLogin,
  sendVerificationCode,
  registerWithVerification
};

// User Dashboard & Status  
export {
  getUserDashboard,
  checkApplicationStatus,
  getApplicationHistory,
  getUserPermissions
};

// Application Management
export {
  submitInitialApplication,
  updateApplicationAnswers,
  withdrawApplication,
  getApplicationRequirements,
  
};

// Full Membership
export {
  getFullMembershipStatus,
  submitFullMembershipApplication,
  logFullMembershipAccess
};

// Admin Functions
export {
  getPendingApplications,
  updateApplicationStatus,
  bulkApproveApplications,
  getPendingFullMemberships,
  updateFullMembershipStatus,
   getAllReports,
};

// Analytics & Reporting
export {
  getMembershipAnalytics,
  getMembershipOverview,
  getMembershipStats,
  exportMembershipData
};

// Notifications
export {
  sendNotification,
  sendMembershipNotification
};

// System Functions
export {
  healthCheck,
  getSystemConfig,
  deleteUserAccount,
  searchUsers
};

// Middleware helpers
export {
  validateRequest,
  requireAdmin,
  requireSuperAdmin
};

// Utility functions (for internal use)
export {
  generateApplicationTicket,
  getUserById,
  executeQuery,
  validateStageTransition,
  convertToCSV,
  successResponse,
  errorResponse
};

// ==================================================
// DEFAULT EXPORT FOR BACKWARD COMPATIBILITY
// ==================================================

export default {
  // Authentication & Registration
  enhancedLogin,
  sendVerificationCode,
  registerWithVerification,
  
  // User Dashboard & Status
  getUserDashboard,
  checkApplicationStatus,
  getApplicationHistory,
  getUserPermissions,
  
  // Application Management
  submitInitialApplication,
  updateApplicationAnswers,
  withdrawApplication,
  getApplicationRequirements,
  
  // Full Membership
  getFullMembershipStatus,
  submitFullMembershipApplication,
  logFullMembershipAccess,
  
  // Admin Functions
  getPendingApplications,
  updateApplicationStatus,
  bulkApproveApplications,
  getPendingFullMemberships,
  updateFullMembershipStatus,
  getAllReports,
  
  // Analytics & Reporting
  getMembershipAnalytics,
  getMembershipOverview,
  getMembershipStats,
  exportMembershipData,
  
  // Notifications
  sendNotification,
  sendMembershipNotification,
  
  // System Functions
  healthCheck,
  getSystemConfig,
  deleteUserAccount,
  searchUsers,
  
  // Middleware helpers
  validateRequest,
  requireAdmin,
  requireSuperAdmin,
  
  // Utility functions
  generateApplicationTicket,
  getUserById,
  executeQuery,
  validateStageTransition,
  convertToCSV,
  successResponse,
  errorResponse
};







// // ikootaapi/controllers/membershipControllers.js
// // ==================================================
// // Complete Membership Controllers Implementation
// // Part 1: Imports, Utilities, and Helper Functions
// // ==================================================

// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import db from '../config/db.js';
// import { sendEmail, sendSMS } from '../utils/notifications.js';
// import CustomError from '../utils/CustomError.js';





// // =============================================================================
// // UTILITY FUNCTIONS
// // =============================================================================

// /**
//  * Generate application ticket with consistent format
//  */
// // const generateApplicationTicket = (username, email, type = 'INITIAL') => {
// //   const timestamp = Date.now().toString(36);
// //   const random = Math.random().toString(36).substr(2, 5);
// //   const prefix = type === 'FULL' ? 'FMA' : 'APP';
// //   return `${prefix}-${username.substr(0, 3).toUpperCase()}-${timestamp}-${random}`.toUpperCase();
// // };

// /**
//  * Standardized database query executor with proper error handling
//  */
// const executeQuery = async (query, params = []) => {
//   try {
//     const [results] = await db.query(query, params);
//     return results;
//   } catch (error) {
//     console.error('Database query error:', error);
//     console.error('Query:', query);
//     console.error('Params:', params);
//     throw new CustomError('Database operation failed', 500);
//   }
// };

// /**
//  * Get user by ID with error handling
//  */
// // const getUserById = async (userId) => {
// //   const users = await executeQuery(
// //     'SELECT * FROM users WHERE id = ?',
// //     [userId]
// //   );
  
// //   if (!users || users.length === 0) {
// //     throw new CustomError('User not found', 404);
// //   }
  
// //   return users[0];
// // };

// /**
//  * Validate membership stage transitions
//  */
// // const validateStageTransition = (currentStage, newStage) => {
// //   const validTransitions = {
// //     'none': ['applicant'],
// //     'applicant': ['pre_member', 'applicant'], // Can stay applicant if rejected
// //     'pre_member': ['member'],
// //     'member': ['member'] // Members stay members
// //   };
  
// //   return validTransitions[currentStage]?.includes(newStage) || false;
// // };

// /**
//  * Helper function to convert data to CSV
//  */
// // const convertToCSV = (data) => {
// //   if (!data.length) return '';
  
// //   const headers = Object.keys(data[0]).join(',');
// //   const rows = data.map(row => 
// //     Object.values(row).map(value => {
// //       if (value === null || value === undefined) return '';
// //       if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
// //       if (value instanceof Date) return `"${value.toISOString()}"`;
// //       return value;
// //     }).join(',')
// //   );
  
// //   return [headers, ...rows].join('\n');
// // };

// /**
//  * Standardized success response
//  */
// // const successResponse = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
// //   return res.status(statusCode).json({
// //     success: true,
// //     message,
// //     ...data
// //   });
// // };

// /**
//  * Standardized error response
//  */
// // const errorResponse = (res, error, statusCode = 500) => {
// //   console.error('Error occurred:', error);
// //   return res.status(statusCode).json({
// //     success: false,
// //     error: error.message || 'An error occurred',
// //     details: process.env.NODE_ENV === 'development' ? error.stack : undefined
// //   });
// // };

// // ==================================================
// // Part 2: AUTHENTICATION & REGISTRATION FUNCTIONS
// // ==================================================

// /**
//  * Enhanced login with comprehensive membership status
//  */
// // export const enhancedLogin = async (req, res) => {
// //   try {
// //     const { identifier, password } = req.body;
    
// //     if (!identifier || !password) {
// //       throw new CustomError('Email/username and password are required', 400);
// //     }
    
// //     // Get user with membership information
// //     const users = await executeQuery(`
// //       SELECT u.*, 
// //              COALESCE(sl.approval_status, 'not_submitted') as initial_application_status,
// //              sl.createdAt as initial_application_date,
// //              fma.first_accessed_at as full_membership_accessed,
// //              CASE WHEN fma.user_id IS NOT NULL THEN 1 ELSE 0 END as has_accessed_full_membership
// //       FROM users u
// //       LEFT JOIN surveylog sl ON u.id = CAST(sl.user_id AS UNSIGNED) 
// //         AND sl.application_type = 'initial_application'
// //       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
// //       WHERE u.email = ? OR u.username = ?
// //       GROUP BY u.id
// //     `, [identifier, identifier]);
    
// //     if (!users || users.length === 0) {
// //       throw new CustomError('Invalid credentials', 401);
// //     }

// //     const user = users[0];

// //     // Verify password
// //     const isValidPassword = await bcrypt.compare(password, user.password_hash);
// //     if (!isValidPassword) {
// //       throw new CustomError('Invalid credentials', 401);
// //     }

// //     // Generate JWT token
// //     const token = jwt.sign(
// //       { 
// //         user_id: user.id, 
// //         username: user.username, 
// //         email: user.email,
// //         membership_stage: user.membership_stage,
// //         is_member: user.is_member,
// //         role: user.role
// //       },
// //       process.env.JWT_SECRET,
// //       { expiresIn: '7d' }
// //     );

// //     // Smart redirect logic
// //     let redirectTo = '/';
    
// //     if (user.role === 'admin' || user.role === 'super_admin') {
// //       redirectTo = '/admin';
// //     } else if (user.membership_stage === 'member' && user.is_member === 'active') {
// //       redirectTo = '/iko';
// //     } else if (user.membership_stage === 'pre_member') {
// //       redirectTo = '/towncrier';
// //     } else if (user.membership_stage === 'applicant') {
// //       if (user.initial_application_status === 'not_submitted') {
// //         redirectTo = '/application-survey';
// //       } else if (user.initial_application_status === 'pending') {
// //         redirectTo = '/pending-verification';
// //       } else if (user.initial_application_status === 'approved') {
// //         redirectTo = '/approved-verification';
// //       }
// //     } else {
// //       redirectTo = '/dashboard';
// //     }

// //     return successResponse(res, {
// //       token,
// //       user: {
// //         id: user.id,
// //         username: user.username,
// //         email: user.email,
// //         membership_stage: user.membership_stage,
// //         is_member: user.is_member,
// //         role: user.role
// //       },
// //       redirectTo
// //     }, 'Login successful');

// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// /**
//  * Send verification code for registration
//  */
// // export const sendVerificationCode = async (req, res) => {
// //   try {
// //     const { email, phone, type = 'email' } = req.body;
    
// //     if (!email && !phone) {
// //       throw new CustomError('Email or phone number is required', 400);
// //     }
    
// //     // Generate 6-digit verification code
// //     const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
// //     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
// //     // Store verification code
// //     await executeQuery(`
// //       INSERT INTO verification_codes (email, phone, code, type, expires_at, created_at) 
// //       VALUES (?, ?, ?, ?, ?, NOW())
// //       ON DUPLICATE KEY UPDATE 
// //         code = VALUES(code), 
// //         expires_at = VALUES(expires_at), 
// //         attempts = 0,
// //         created_at = NOW()
// //     `, [email || null, phone || null, verificationCode, type, expiresAt]);
    
// //     // Send verification code
// //     try {
// //       if (type === 'email' && email) {
// //         await sendEmail(email, 'verification_code', {
// //           VERIFICATION_CODE: verificationCode,
// //           EXPIRES_IN: '10 minutes'
// //         });
// //       } else if (type === 'sms' && phone) {
// //         await sendSMS(phone, `Your Ikoota verification code is: ${verificationCode}. Valid for 10 minutes.`);
// //       }
// //     } catch (notificationError) {
// //       console.error('Notification sending failed:', notificationError);
// //       // Don't fail the entire request if notification fails
// //     }
    
// //     return successResponse(res, {
// //       expiresIn: 600 // 10 minutes in seconds
// //     }, `Verification code sent to ${type === 'email' ? email : phone}`);
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// /**
//  * Register with verification
//  */
// // export const registerWithVerification = async (req, res) => {
// //   try {
// //     const { 
// //       username, 
// //       email, 
// //       password, 
// //       phone, 
// //       verificationCode, 
// //       verificationType = 'email' 
// //     } = req.body;
    
// //     // Validate required fields
// //     if (!username || !email || !password || !verificationCode) {
// //       throw new CustomError('All fields are required', 400);
// //     }
    
// //     // Verify the verification code
// //     const verificationTarget = verificationType === 'email' ? email : phone;
// //     const verificationResults = await executeQuery(`
// //       SELECT * FROM verification_codes 
// //       WHERE ${verificationType === 'email' ? 'email' : 'phone'} = ? 
// //         AND code = ? 
// //         AND type = ? 
// //         AND expires_at > NOW() 
// //         AND attempts < 3
// //     `, [verificationTarget, verificationCode, verificationType]);
    
// //     if (!verificationResults || verificationResults.length === 0) {
// //       throw new CustomError('Invalid or expired verification code', 400);
// //     }
    
// //     // Check if user already exists
// //     const existingUsers = await executeQuery(
// //       'SELECT id FROM users WHERE email = ? OR username = ?',
// //       [email, username]
// //     );
    
// //     if (existingUsers && existingUsers.length > 0) {
// //       throw new CustomError('User with this email or username already exists', 409);
// //     }
    
// //     await db.beginTransaction();
    
// //     try {
// //       // Hash password
// //       const saltRounds = 12;
// //       const passwordHash = await bcrypt.hash(password, saltRounds);
      
// //       // Generate application ticket
// //       const applicationTicket = generateApplicationTicket(username, email);
      
// //       // Create user
// //       const result = await executeQuery(`
// //         INSERT INTO users (
// //           username, 
// //           email, 
// //           password_hash, 
// //           phone, 
// //           membership_stage, 
// //           is_member, 
// //           application_ticket,
// //           createdAt
// //         ) VALUES (?, ?, ?, ?, 'none', 'pending', ?, NOW())
// //       `, [username, email, passwordHash, phone || null, applicationTicket]);
      
// //       const userId = result.insertId;
      
// //       // Delete used verification code
// //       await executeQuery(`
// //         DELETE FROM verification_codes 
// //         WHERE ${verificationType === 'email' ? 'email' : 'phone'} = ? AND code = ?
// //       `, [verificationTarget, verificationCode]);
      
// //       await db.commit();
      
// //       // Generate JWT token
// //       const token = jwt.sign(
// //         { 
// //           user_id: userId, 
// //           username, 
// //           email,
// //           membership_stage: 'none',
// //           is_member: 'pending',
// //           role: 'user'
// //         },
// //         process.env.JWT_SECRET,
// //         { expiresIn: '7d' }
// //       );
      
// //       // Send welcome email (non-blocking)
// //       try {
// //         await sendEmail(email, 'welcome_registration', {
// //           USERNAME: username,
// //           APPLICATION_TICKET: applicationTicket
// //         });
// //       } catch (emailError) {
// //         console.error('Welcome email failed:', emailError);
// //       }
      
// //       return successResponse(res, {
// //         token,
// //         user: {
// //           id: userId,
// //           username,
// //           email,
// //           membership_stage: 'none',
// //           application_ticket: applicationTicket
// //         },
// //         redirectTo: '/application-survey'
// //       }, 'Registration successful', 201);
      
// //     } catch (error) {
// //       await db.rollback();
// //       throw error;
// //     }
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };




// // ==================================================
// // Part 3: USER DASHBOARD & STATUS FUNCTIONS
// // ==================================================

// /**
//  * Enhanced user dashboard with comprehensive data
//  */
// // export const getUserDashboard = async (req, res) => {
// //   try {
// //     const userId = req.user.user_id || req.user.id;
// //     const userRole = req.user.role;
    
// //     if (!userId) {
// //       throw new CustomError('User ID not found', 401);
// //     }
    
// //     // Get comprehensive user data
// //     const user = await getUserById(userId);
    
// //     // Handle empty is_member for admin users
// //     let memberStatus = user.is_member;
// //     if (!memberStatus || memberStatus === '' || memberStatus === null) {
// //       if (userRole === 'admin' || userRole === 'super_admin') {
// //         memberStatus = 'active';
// //         // Update in database
// //         await executeQuery(
// //           'UPDATE users SET is_member = ? WHERE id = ?',
// //           ['active', userId]
// //         );
// //       } else {
// //         memberStatus = 'pending';
// //       }
// //     }
    
// //     // Get application status
// //     const applications = await executeQuery(`
// //       SELECT 
// //         application_type,
// //         approval_status,
// //         createdAt as submitted_at,
// //         reviewed_at,
// //         admin_notes
// //       FROM surveylog 
// //       WHERE CAST(user_id AS UNSIGNED) = ?
// //       ORDER BY createdAt DESC
// //     `, [userId]);
    
// //     // Get recent activities (notifications, updates, etc.)
// //     const recentActivities = await executeQuery(`
// //       SELECT 
// //         'application' as type,
// //         'Application status updated' as message,
// //         reviewed_at as date
// //       FROM surveylog 
// //       WHERE CAST(user_id AS UNSIGNED) = ? AND reviewed_at IS NOT NULL
// //       ORDER BY reviewed_at DESC
// //       LIMIT 5
// //     `, [userId]);
    
// //     // Create status object
// //     const status = {
// //       id: user.id,
// //       username: user.username,
// //       email: user.email,
// //       role: user.role,
// //       membership_stage: user.membership_stage || 'none',
// //       is_member: memberStatus,
// //       initial_application_status: applications.find(app => app.application_type === 'initial_application')?.approval_status || 'not_submitted',
// //       full_membership_application_status: applications.find(app => app.application_type === 'full_membership')?.approval_status || 'not_submitted',
// //       has_accessed_full_membership: user.membership_stage === 'member',
// //       user_created: user.createdAt
// //     };
    
// //     // Define quick actions based on user status
// //     const quickActions = [];
    
// //     if (user.role === 'admin' || user.role === 'super_admin') {
// //       quickActions.push(
// //         { type: 'primary', text: 'Admin Panel', link: '/admin' },
// //         { type: 'info', text: 'User Management', link: '/admin/users' },
// //         { type: 'success', text: 'Applications', link: '/admin/applications' }
// //       );
// //     } else {
// //       quickActions.push({ type: 'primary', text: 'View Profile', link: '/profile' });
      
// //       if (user.membership_stage === 'member') {
// //         quickActions.push({ type: 'success', text: 'Iko Chat', link: '/iko' });
// //       } else if (user.membership_stage === 'pre_member') {
// //         quickActions.push({ type: 'info', text: 'Towncrier', link: '/towncrier' });
// //         quickActions.push({ type: 'warning', text: 'Apply for Full Membership', link: '/full-membership' });
// //       } else if (status.initial_application_status === 'not_submitted') {
// //         quickActions.push({ type: 'warning', text: 'Submit Application', link: '/application-survey' });
// //       }
// //     }
    
// //     quickActions.push({ type: 'secondary', text: 'Settings', link: '/settings' });
    
// //     return successResponse(res, {
// //       membershipStatus: status,
// //       recentActivities: recentActivities.map(activity => ({
// //         type: activity.type,
// //         message: activity.message,
// //         date: activity.date?.toISOString() || new Date().toISOString()
// //       })),
// //       notifications: [{
// //         type: 'system',
// //         message: `Welcome back, ${user.username}!`,
// //         date: new Date().toISOString()
// //       }],
// //       quickActions
// //     });
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// /**
//  * Check application status with detailed information
//  */
// // export const checkApplicationStatus = async (req, res) => {
// //   try {
// //     const userId = req.user.id || req.user.user_id;
    
// //     if (!userId) {
// //       throw new CustomError('User authentication required', 401);
// //     }

// //     // Get user data
// //     const user = await getUserById(userId);

// //     // Get application details
// //     const applications = await executeQuery(`
// //       SELECT 
// //         sl.application_type,
// //         sl.approval_status,
// //         sl.createdAt as submitted_at,
// //         sl.reviewed_at,
// //         sl.admin_notes,
// //         sl.application_ticket,
// //         reviewer.username as reviewed_by
// //       FROM surveylog sl
// //       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
// //       WHERE CAST(sl.user_id AS UNSIGNED) = ?
// //       ORDER BY sl.createdAt DESC
// //     `, [userId]);

// //     // Determine current application status
// //     const initialApp = applications.find(app => app.application_type === 'initial_application');
// //     const fullApp = applications.find(app => app.application_type === 'full_membership');

// //     let applicationStatus = 'not_submitted';
// //     let canSubmitApplication = true;
// //     let nextSteps = [];

// //     // Determine status based on membership stage and applications
// //     if (user.membership_stage === 'none') {
// //       applicationStatus = 'not_submitted';
// //       canSubmitApplication = true;
// //       nextSteps = [
// //         'Complete your initial application survey',
// //         'Submit required information',
// //         'Wait for admin review (3-5 business days)'
// //       ];
// //     } else if (user.membership_stage === 'applicant') {
// //       applicationStatus = initialApp?.approval_status || 'pending';
// //       canSubmitApplication = false;
// //       nextSteps = [
// //         'Your application is under review',
// //         'You will receive an email notification once reviewed',
// //         'Check back in 3-5 business days'
// //       ];
// //     } else if (user.membership_stage === 'pre_member') {
// //       applicationStatus = 'approved';
// //       canSubmitApplication = false;
// //       nextSteps = [
// //         'Congratulations! Your initial application was approved',
// //         'You now have access to Towncrier content',
// //         'Consider applying for full membership when eligible'
// //       ];
// //     } else if (user.membership_stage === 'member') {
// //       applicationStatus = 'approved';
// //       canSubmitApplication = false;
// //       nextSteps = [
// //         'Welcome! You are now a full member',
// //         'Access all member benefits and resources',
// //         'Participate in member-exclusive activities'
// //       ];
// //     }

// //     // Calculate progress percentage
// //     let progressPercentage = 0;
// //     switch (user.membership_stage) {
// //       case 'none':
// //         progressPercentage = 0;
// //         break;
// //       case 'applicant':
// //         progressPercentage = 25;
// //         break;
// //       case 'pre_member':
// //         progressPercentage = 50;
// //         break;
// //       case 'member':
// //         progressPercentage = 100;
// //         break;
// //     }

// //     return successResponse(res, {
// //       currentStatus: {
// //         membership_stage: user.membership_stage || 'none',
// //         initial_application_status: applicationStatus,
// //         full_membership_application_status: fullApp?.approval_status || 'not_submitted',
// //         is_member: user.is_member,
// //         progressPercentage
// //       },
// //       applicationDetails: initialApp || null,
// //       nextSteps,
// //       canSubmitApplication,
// //       timeline: {
// //         registered: user.createdAt,
// //         initialSubmitted: initialApp?.submitted_at || null,
// //         initialReviewed: initialApp?.reviewed_at || null,
// //         fullMembershipAccessed: user.membership_stage === 'member' ? user.createdAt : null,
// //         fullMembershipSubmitted: fullApp?.submitted_at || null
// //       }
// //     });

// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// /**
//  * Get application history for user
//  */
// // export const getApplicationHistory = async (req, res) => {
// //   try {
// //     const userId = req.user.id || req.user.user_id;
    
// //     // Get application history
// //     const history = await executeQuery(`
// //       SELECT 
// //         sl.application_type,
// //         sl.approval_status,
// //         sl.createdAt as submitted_at,
// //         sl.reviewed_at,
// //         sl.admin_notes,
// //         reviewer.username as reviewed_by,
// //         sl.application_ticket as ticket
// //       FROM surveylog sl
// //       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
// //       WHERE CAST(sl.user_id AS UNSIGNED) = ?
// //       ORDER BY sl.createdAt DESC
// //     `, [userId]);

// //     // Get review history if available
// //     const reviews = await executeQuery(`
// //       SELECT 
// //         mrh.application_type,
// //         mrh.previous_status,
// //         mrh.new_status,
// //         mrh.review_notes,
// //         mrh.action_taken,
// //         mrh.reviewed_at,
// //         reviewer.username as reviewer_name
// //       FROM membership_review_history mrh
// //       LEFT JOIN users reviewer ON mrh.reviewer_id = reviewer.id
// //       WHERE mrh.user_id = ?
// //       ORDER BY mrh.reviewed_at DESC
// //     `, [userId]);

// //     return successResponse(res, {
// //       applications: history,
// //       reviews
// //     });
// //   } catch (error) {
// //     return errorResponse(res, error);
// //   }
// // };

// /**
//  * Get user's current membership stage and permissions
//  */
// // export const getUserPermissions = async (req, res) => {
// //   try {
// //     const userId = req.user.id || req.user.user_id;
    
// //     const user = await getUserById(userId);
    
// //     // Define permissions based on membership stage and role
// //     const permissions = {
// //       canAccessTowncrier: ['pre_member', 'member'].includes(user.membership_stage) || ['admin', 'super_admin'].includes(user.role),
// //       canAccessIko: user.membership_stage === 'member' || ['admin', 'super_admin'].includes(user.role),
// //       canSubmitInitialApplication: user.membership_stage === 'none' || (user.membership_stage === 'applicant' && user.is_member === 'rejected'),
// //       canSubmitFullMembershipApplication: user.membership_stage === 'pre_member',
// //       canAccessAdmin: ['admin', 'super_admin'].includes(user.role),
// //       canManageUsers: user.role === 'super_admin',
// //       canReviewApplications: ['admin', 'super_admin'].includes(user.role)
// //     };
    
// //     return successResponse(res, {
// //       user: {
// //         id: user.id,
// //         username: user.username,
// //         email: user.email,
// //         membership_stage: user.membership_stage,
// //         is_member: user.is_member,
// //         role: user.role
// //       },
// //       permissions
// //     });
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };




// // ==================================================
// // Part 4: APPLICATION MANAGEMENT FUNCTIONS
// // ==================================================

// /**
//  * Submit initial application with enhanced validation
//  */
// // export const submitInitialApplication = async (req, res) => {
// //   try {
// //     const { answers, applicationTicket } = req.body;
// //     const userId = req.user.id || req.user.user_id;

// //     // Validation
// //     if (!answers || !Array.isArray(answers) || answers.length === 0) {
// //       throw new CustomError('Application answers are required', 400);
// //     }

// //     if (!userId) {
// //       throw new CustomError('User authentication required', 401);
// //     }

// //     // Get current user
// //     const user = await getUserById(userId);

// //     // Check if user can submit application
// //     if (user.membership_stage !== 'none' && user.membership_stage !== 'applicant') {
// //       throw new CustomError('Cannot submit application in current membership stage', 400);
// //     }

// //     // Check for existing applications
// //     const existingApplications = await executeQuery(`
// //       SELECT approval_status 
// //       FROM surveylog 
// //       WHERE CAST(user_id AS UNSIGNED) = ? 
// //         AND application_type = 'initial_application'
// //       ORDER BY createdAt DESC
// //       LIMIT 1
// //     `, [userId]);

// //     if (existingApplications.length > 0) {
// //       const existing = existingApplications[0];
// //       if (existing.approval_status === 'pending') {
// //         throw new CustomError('You already have a pending application', 400);
// //       }
// //       if (existing.approval_status === 'approved') {
// //         throw new CustomError('You already have an approved application', 400);
// //       }
// //     }

// //     await db.beginTransaction();

// //     try {
// //       // Generate ticket if not provided
// //       const finalTicket = applicationTicket || generateApplicationTicket(user.username, user.email);

// //       // Insert survey response
// //       await executeQuery(
// //         `INSERT INTO surveylog (user_id, answers, application_type, approval_status, application_ticket, createdAt) 
// //          VALUES (?, ?, 'initial_application', 'pending', ?, NOW())`,
// //         [userId.toString(), JSON.stringify(answers), finalTicket]
// //       );

// //       // Update user status to applicant
// //       await executeQuery(
// //         'UPDATE users SET membership_stage = ?, is_member = ?, application_ticket = ? WHERE id = ?',
// //         ['applicant', 'pending', finalTicket, userId]
// //       );

// //       await db.commit();

// //       // Send confirmation email (non-blocking)
// //       try {
// //         await sendEmail(user.email, 'initial_application_submitted', {
// //           USERNAME: user.username,
// //           APPLICATION_TICKET: finalTicket,
// //           SUBMISSION_DATE: new Date().toLocaleDateString()
// //         });
// //       } catch (emailError) {
// //         console.error('Confirmation email failed:', emailError);
// //       }

// //       return successResponse(res, {
// //         applicationTicket: finalTicket,
// //         nextSteps: [
// //           'Your application is now under review',
// //           'You will receive an email notification within 3-5 business days',
// //           'Check your dashboard for status updates'
// //         ]
// //       }, 'Application submitted successfully', 201);

// //     } catch (error) {
// //       await db.rollback();
// //       throw error;
// //     }

// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// /**
//  * Get full membership status and eligibility
//  */
// // export const getFullMembershipStatus = async (req, res) => {
// //   try {
// //     const userId = req.user.id || req.user.user_id;
    
// //     const user = await getUserById(userId);
    
// //     // Get full membership application details if exists
// //     const fullMembershipApps = await executeQuery(`
// //       SELECT 
// //         sl.answers,
// //         sl.approval_status,
// //         sl.createdAt as submitted_at,
// //         sl.reviewed_at,
// //         sl.admin_notes,
// //         reviewer.username as reviewed_by
// //       FROM surveylog sl
// //       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
// //       WHERE CAST(sl.user_id AS UNSIGNED) = ? AND sl.application_type = 'full_membership'
// //       ORDER BY sl.createdAt DESC
// //       LIMIT 1
// //     `, [userId]);
    
// //     // Check eligibility for full membership
// //     const isEligible = user.membership_stage === 'pre_member';
// //     const currentApp = fullMembershipApps[0] || null;
    
// //     // Get requirements and benefits
// //     const requirements = [
// //       'Completed initial membership application',
// //       'Active participation for at least 30 days',
// //       'Attended at least 2 community events',
// //       'Good standing with community guidelines'
// //     ];
    
// //     const benefits = [
// //       'Access to exclusive member events',
// //       'Voting rights in community decisions',
// //       'Advanced class access',
// //       'Mentorship opportunities',
// //       'Priority support'
// //     ];
    
// //     return successResponse(res, {
// //       currentStatus: {
// //         membership_stage: user.membership_stage,
// //         is_member: user.is_member,
// //         full_membership_application_status: currentApp?.approval_status || 'not_submitted'
// //       },
// //       fullMembershipApplication: currentApp,
// //       eligibility: {
// //         isEligible,
// //         canApply: isEligible && (!currentApp || currentApp.approval_status === 'rejected'),
// //         requirements,
// //         benefits
// //       },
// //       nextSteps: isEligible ? [
// //         'Review full membership benefits',
// //         'Complete full membership application',
// //         'Submit required documentation'
// //       ] : [
// //         'Complete initial membership process first'
// //       ]
// //     });
    
// //   } catch (error) {
// //     return errorResponse(res, error);
// //   }
// // };

// /**
//  * Submit full membership application
//  */
// // export const submitFullMembershipApplication = async (req, res) => {
// //   try {
// //     const { answers, additionalDocuments } = req.body;
// //     const userId = req.user.id || req.user.user_id;
    
// //     // Validate input
// //     if (!answers || !Array.isArray(answers) || answers.length === 0) {
// //       throw new CustomError('Application answers are required', 400);
// //     }
    
// //     const user = await getUserById(userId);
    
// //     // Check eligibility
// //     if (user.membership_stage !== 'pre_member') {
// //       throw new CustomError('Not eligible for full membership application', 403);
// //     }
    
// //     // Check for existing application
// //     const existingApps = await executeQuery(`
// //       SELECT approval_status FROM surveylog 
// //       WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = 'full_membership'
// //       ORDER BY createdAt DESC LIMIT 1
// //     `, [userId]);
    
// //     if (existingApps.length > 0 && existingApps[0].approval_status === 'pending') {
// //       throw new CustomError('Full membership application already submitted', 400);
// //     }
    
// //     await db.beginTransaction();
    
// //     try {
// //       // Generate application ticket
// //       const applicationTicket = generateApplicationTicket(user.username, user.email, 'FULL');
      
// //       // Submit application
// //       await executeQuery(`
// //         INSERT INTO surveylog (
// //           user_id, 
// //           answers, 
// //           application_type, 
// //           approval_status, 
// //           application_ticket,
// //           additional_data,
// //           createdAt
// //         ) VALUES (?, ?, 'full_membership', 'pending', ?, ?, NOW())
// //       `, [
// //         userId.toString(), 
// //         JSON.stringify(answers), 
// //         applicationTicket,
// //         JSON.stringify({ additionalDocuments: additionalDocuments || [] })
// //       ]);
      
// //       await db.commit();
      
// //       // Send confirmation email
// //       try {
// //         await sendEmail(user.email, 'full_membership_application_submitted', {
// //           USERNAME: user.username,
// //           APPLICATION_TICKET: applicationTicket,
// //           SUBMISSION_DATE: new Date().toLocaleDateString()
// //         });
// //       } catch (emailError) {
// //         console.error('Confirmation email failed:', emailError);
// //       }
      
// //       return successResponse(res, {
// //         applicationTicket,
// //         nextSteps: [
// //           'Your application is now under review',
// //           'Review process typically takes 5-7 business days',
// //           'You will receive email notification once reviewed',
// //           'Continue participating in community activities'
// //         ]
// //       }, 'Full membership application submitted successfully', 201);
      
// //     } catch (error) {
// //       await db.rollback();
// //       throw error;
// //     }
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// /**
//  * Log full membership access
//  */
// // export const logFullMembershipAccess = async (req, res) => {
// //   try {
// //     const userId = req.user.id || req.user.user_id;
    
// //     // Insert or update access log
// //     await executeQuery(`
// //       INSERT INTO full_membership_access (user_id, first_accessed_at, last_accessed_at, access_count)
// //       VALUES (?, NOW(), NOW(), 1)
// //       ON DUPLICATE KEY UPDATE 
// //         last_accessed_at = NOW(),
// //         access_count = access_count + 1
// //     `, [userId]);
    
// //     // Get updated access info
// //     const accessInfo = await executeQuery(`
// //       SELECT first_accessed_at, last_accessed_at, access_count
// //       FROM full_membership_access
// //       WHERE user_id = ?
// //     `, [userId]);
    
// //     return successResponse(res, {
// //       accessInfo: accessInfo[0] || null
// //     }, 'Access logged successfully');
    
// //   } catch (error) {
// //     return errorResponse(res, error);
// //   }
// // };

// /**
//  * Update application answers (before submission)
//  */
// export const updateApplicationAnswers = async (req, res) => {
//   try {
//     const { answers, applicationType = 'initial_application' } = req.body;
//     const userId = req.user.id || req.user.user_id;
    
//     if (!answers || !Array.isArray(answers)) {
//       throw new CustomError('Valid answers array is required', 400);
//     }
    
//     // Check if application exists and is still pending
//     const applications = await executeQuery(`
//       SELECT id, approval_status 
//       FROM surveylog 
//       WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
//       ORDER BY createdAt DESC LIMIT 1
//     `, [userId, applicationType]);
    
//     if (!applications.length) {
//       throw new CustomError('No application found to update', 404);
//     }
    
//     const application = applications[0];
    
//     if (application.approval_status !== 'pending') {
//       throw new CustomError('Cannot update application that has already been reviewed', 400);
//     }
    
//     // Update application answers
//     await executeQuery(`
//       UPDATE surveylog 
//       SET answers = ?, updated_at = NOW()
//       WHERE id = ?
//     `, [JSON.stringify(answers), application.id]);
    
//     return successResponse(res, {
//       applicationId: application.id,
//       updatedAnswers: answers.length
//     }, 'Application answers updated successfully');
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Withdraw application (user can withdraw pending applications)
//  */
// // export const withdrawApplication = async (req, res) => {
// //   try {
// //     const { applicationType = 'initial_application', reason } = req.body;
// //     const userId = req.user.id || req.user.user_id;
    
// //     // Check if application exists and is pending
// //     const applications = await executeQuery(`
// //       SELECT id, approval_status 
// //       FROM surveylog 
// //       WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
// //       ORDER BY createdAt DESC LIMIT 1
// //     `, [userId, applicationType]);
    
// //     if (!applications.length) {
// //       throw new CustomError('No application found to withdraw', 404);
// //     }
    
// //     const application = applications[0];
    
// //     if (application.approval_status !== 'pending') {
// //       throw new CustomError('Can only withdraw pending applications', 400);
// //     }
    
// //     await db.beginTransaction();
    
// //     try {
// //       // Update application status to withdrawn
// //       await executeQuery(`
// //         UPDATE surveylog 
// //         SET approval_status = 'withdrawn', admin_notes = ?, reviewed_at = NOW()
// //         WHERE id = ?
// //       `, [reason || 'Withdrawn by user', application.id]);
      
// //       // If withdrawing initial application, reset user status
// //       if (applicationType === 'initial_application') {
// //         await executeQuery(`
// //           UPDATE users 
// //           SET membership_stage = 'none', is_member = 'pending'
// //           WHERE id = ?
// //         `, [userId]);
// //       }
      
// //       await db.commit();
      
// //       return successResponse(res, {
// //         applicationId: application.id,
// //         applicationType
// //       }, 'Application withdrawn successfully');
      
// //     } catch (error) {
// //       await db.rollback();
// //       throw error;
// //     }
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// export const withdrawApplication = async (req, res) => {
//   try {
//     const { applicationType = 'initial_application', reason } = req.body;
//     const userId = req.user.id || req.user.user_id;
        
//     // Check if application exists and is pending
//     const applications = await executeQuery(`
//       SELECT id, approval_status 
//       FROM surveylog 
//       WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
//       ORDER BY createdAt DESC LIMIT 1
//     `, [userId, applicationType]);
        
//     if (!applications.length) {
//       throw new CustomError('No application found to withdraw', 404);
//     }
        
//     const application = applications[0];
        
//     if (application.approval_status !== 'pending') {
//       throw new CustomError('Can only withdraw pending applications', 400);
//     }
        
//     const result = await db.transaction(async (connection) => {
//       // Update application status to withdrawn
//       await connection.execute(`
//         UPDATE surveylog 
//         SET approval_status = 'withdrawn', admin_notes = ?, reviewed_at = NOW()
//         WHERE id = ?
//       `, [reason || 'Withdrawn by user', application.id]);
            
//       // If withdrawing initial application, reset user status
//       if (applicationType === 'initial_application') {
//         await connection.execute(`
//           UPDATE users 
//           SET membership_stage = 'none', is_member = 'pending'
//           WHERE id = ?
//         `, [userId]);
//       }
            
//       return {
//         applicationId: application.id,
//         applicationType
//       };
//     });
        
//     return successResponse(res, result, 'Application withdrawn successfully');
        
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };


// /**
//  * Get application requirements and guidelines
//  */
// export const getApplicationRequirements = async (req, res) => {
//   try {
//     const { type = 'initial' } = req.query;
    
//     let requirements, guidelines, estimatedTime;
    
//     if (type === 'initial') {
//       requirements = [
//         'Valid email address for verification',
//         'Complete personal information',
//         'Answer all application questions',
//         'Agree to community guidelines',
//         'Provide reason for joining'
//       ];
      
//       guidelines = [
//         'Be honest and thorough in your responses',
//         'Provide specific examples where requested',
//         'Review your answers before submission',
//         'Application processing takes 3-5 business days',
//         'You will receive email notification of decision'
//       ];
      
//       estimatedTime = '10-15 minutes';
//     } else {
//       requirements = [
//         'Must be an approved pre-member',
//         'Active participation for at least 30 days',
//         'Good standing with community guidelines',
//         'Complete full membership questionnaire',
//         'Provide references if requested'
//       ];
      
//       guidelines = [
//         'Demonstrate your commitment to the community',
//         'Show examples of your participation and contributions',
//         'Be prepared for potential interview process',
//         'Full membership review takes 5-7 business days',
//         'Decision will be communicated via email'
//       ];
      
//       estimatedTime = '20-30 minutes';
//     }
    
//     return successResponse(res, {
//       applicationType: type,
//       requirements,
//       guidelines,
//       estimatedTime,
//       supportContact: 'support@ikoota.com'
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Get application form questions
//  */
// export const getApplicationQuestions = async (req, res) => {
//   try {
//     const { type = 'initial' } = req.query;
//     const userId = req.user.id || req.user.user_id;
    
//     let questions;
    
//     if (type === 'initial') {
//       questions = [
//         {
//           id: 1,
//           type: 'text',
//           question: 'Why do you want to join our community?',
//           required: true,
//           maxLength: 500,
//           placeholder: 'Please explain your motivation and what you hope to gain...'
//         },
//         {
//           id: 2,
//           type: 'textarea',
//           question: 'Tell us about your background and interests.',
//           required: true,
//           maxLength: 1000,
//           placeholder: 'Share relevant experience, skills, or interests...'
//         },
//         {
//           id: 3,
//           type: 'select',
//           question: 'How did you hear about us?',
//           required: true,
//           options: [
//             'Social media',
//             'Friend/colleague referral',
//             'Web search',
//             'Advertisement',
//             'Event/conference',
//             'Other'
//           ]
//         },
//         {
//           id: 4,
//           type: 'radio',
//           question: 'What is your primary area of interest?',
//           required: true,
//           options: [
//             'Technology',
//             'Business',
//             'Arts & Culture',
//             'Science',
//             'Education',
//             'Social Impact'
//           ]
//         },
//         {
//           id: 5,
//           type: 'checkbox',
//           question: 'I agree to the community guidelines and terms of service',
//           required: true,
//           link: '/terms-and-guidelines'
//         }
//       ];
//     } else {
//       questions = [
//         {
//           id: 1,
//           type: 'textarea',
//           question: 'Describe your contributions to the community as a pre-member.',
//           required: true,
//           maxLength: 1000,
//           placeholder: 'Detail your participation, interactions, and contributions...'
//         },
//         {
//           id: 2,
//           type: 'textarea',
//           question: 'What additional value would you bring as a full member?',
//           required: true,
//           maxLength: 800,
//           placeholder: 'Explain how you would contribute more as a full member...'
//         },
//         {
//           id: 3,
//           type: 'text',
//           question: 'What are your long-term goals within the community?',
//           required: true,
//           maxLength: 500,
//           placeholder: 'Share your vision and aspirations...'
//         },
//         {
//           id: 4,
//           type: 'select',
//           question: 'Which committee or working group interests you most?',
//           required: false,
//           options: [
//             'Events & Programs',
//             'Community Outreach',
//             'Technology & Innovation',
//             'Content & Education',
//             'Member Relations',
//             'Strategic Planning'
//           ]
//         },
//         {
//           id: 5,
//           type: 'textarea',
//           question: 'Do you have any suggestions for improving our community?',
//           required: false,
//           maxLength: 600,
//           placeholder: 'Share constructive feedback and ideas...'
//         }
//       ];
//     }
    
//     // Check if user has already submitted this type of application
//     const existingApp = await executeQuery(`
//       SELECT id, approval_status, answers 
//       FROM surveylog 
//       WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
//       ORDER BY createdAt DESC LIMIT 1
//     `, [userId, type === 'initial' ? 'initial_application' : 'full_membership']);
    
//     let previousAnswers = null;
//     if (existingApp.length > 0 && existingApp[0].answers) {
//       try {
//         previousAnswers = JSON.parse(existingApp[0].answers);
//       } catch (parseError) {
//         console.error('Error parsing previous answers:', parseError);
//       }
//     }
    
//     return successResponse(res, {
//       applicationType: type,
//       questions,
//       previousAnswers,
//       canEdit: existingApp.length === 0 || existingApp[0].approval_status === 'rejected',
//       existingStatus: existingApp.length > 0 ? existingApp[0].approval_status : null
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Validate application answers before submission
//  */
// export const validateApplicationAnswers = async (req, res) => {
//   try {
//     const { answers, applicationType = 'initial_application' } = req.body;
    
//     if (!answers || !Array.isArray(answers)) {
//       throw new CustomError('Answers array is required', 400);
//     }
    
//     const errors = [];
//     const warnings = [];
    
//     // Basic validation
//     answers.forEach((answer, index) => {
//       if (!answer.questionId) {
//         errors.push(`Answer ${index + 1}: Missing question ID`);
//       }
      
//       if (answer.required && (!answer.value || answer.value.trim() === '')) {
//         errors.push(`Question ${answer.questionId}: Required field cannot be empty`);
//       }
      
//       if (answer.maxLength && answer.value && answer.value.length > answer.maxLength) {
//         errors.push(`Question ${answer.questionId}: Answer exceeds maximum length of ${answer.maxLength} characters`);
//       }
      
//       if (answer.value && answer.value.length < 10 && answer.type === 'textarea') {
//         warnings.push(`Question ${answer.questionId}: Answer seems too brief for a detailed response`);
//       }
//     });
    
//     return successResponse(res, {
//       valid: errors.length === 0,
//       errors,
//       warnings,
//       answerCount: answers.length
//     }, errors.length === 0 ? 'Application answers are valid' : 'Validation failed');
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };


// // ==================================================
// // Part 5: ADMIN FUNCTIONS - APPLICATION MANAGEMENT
// // ==================================================

// /**
//  * Get pending applications with advanced filtering
//  */
// // export const getPendingApplications = async (req, res) => {
// //   try {
// //     const { 
// //       page = 1, 
// //       limit = 20, 
// //       status = 'pending', 
// //       stage = 'initial',
// //       sortBy = 'submitted_at',
// //       sortOrder = 'ASC',
// //       search = ''
// //     } = req.query;
    
// //     const offset = (page - 1) * limit;
// //     const applicationType = stage === 'initial' ? 'initial_application' : 'full_membership';
    
// //     // Build search conditions
// //     let searchClause = '';
// //     let searchParams = [];
    
// //     if (search) {
// //       searchClause = 'AND (u.username LIKE ? OR u.email LIKE ?)';
// //       searchParams = [`%${search}%`, `%${search}%`];
// //     }
    
// //     // Get applications with user details
// //     const applications = await executeQuery(`
// //       SELECT 
// //         u.id as user_id,
// //         u.username,
// //         u.email,
// //         u.phone,
// //         u.membership_stage,
// //         sl.id as application_id,
// //         sl.answers,
// //         sl.createdAt as submitted_at,
// //         sl.application_ticket,
// //         sl.additional_data,
// //         DATEDIFF(NOW(), sl.createdAt) as days_pending,
// //         fma.first_accessed_at,
// //         fma.access_count
// //       FROM surveylog sl
// //       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
// //       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
// //       WHERE sl.approval_status = ? 
// //         AND sl.application_type = ?
// //         ${searchClause}
// //       ORDER BY ${sortBy} ${sortOrder}
// //       LIMIT ? OFFSET ?
// //     `, [status, applicationType, ...searchParams, parseInt(limit), offset]);

// //     // Get total count for pagination
// //     const countResult = await executeQuery(`
// //       SELECT COUNT(*) as total
// //       FROM surveylog sl
// //       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
// //       WHERE sl.approval_status = ? 
// //         AND sl.application_type = ?
// //         ${searchClause}
// //     `, [status, applicationType, ...searchParams]);

// //     return successResponse(res, {
// //       applications,
// //       pagination: {
// //         page: parseInt(page),
// //         limit: parseInt(limit),
// //         total: countResult[0].total,
// //         totalPages: Math.ceil(countResult[0].total / limit)
// //       },
// //       filters: { status, stage, sortBy, sortOrder, search }
// //     });
// //   } catch (error) {
// //     return errorResponse(res, error);
// //   }
// // };

// /**
//  * Update application status (Admin)
//  */
// // export const updateApplicationStatus = async (req, res) => {
// //   try {
// //     const { userId } = req.params;
// //     const { status, adminNotes, notifyUser = true, applicationType = 'initial_application' } = req.body;
// //     const reviewerId = req.user.user_id || req.user.id;
    
// //     if (!['approved', 'rejected', 'pending'].includes(status)) {
// //       throw new CustomError('Invalid status', 400);
// //     }
    
// //     // Validate stage transition
// //     const user = await getUserById(userId);
// //     let newStage = user.membership_stage;
// //     let memberStatus = user.is_member;
    
// //     if (applicationType === 'initial_application') {
// //       if (status === 'approved') {
// //         newStage = 'pre_member';
// //         memberStatus = 'granted';
// //       } else if (status === 'rejected') {
// //         newStage = 'applicant';
// //         memberStatus = 'rejected';
// //       }
// //     } else if (applicationType === 'full_membership') {
// //       if (status === 'approved') {
// //         newStage = 'member';
// //         memberStatus = 'active';
// //       }
// //     }
    
// //     // Validate transition
// //     if (!validateStageTransition(user.membership_stage, newStage)) {
// //       throw new CustomError('Invalid membership stage transition', 400);
// //     }
    
// //     await db.beginTransaction();
    
// //     try {
// //       // Update surveylog
// //       await executeQuery(`
// //         UPDATE surveylog 
// //         SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
// //         WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
// //         ORDER BY createdAt DESC LIMIT 1
// //       `, [status, adminNotes, reviewerId, userId, applicationType]);
      
// //       // Update user status
// //       await executeQuery(`
// //         UPDATE users 
// //         SET membership_stage = ?, is_member = ?
// //         WHERE id = ?
// //       `, [newStage, memberStatus, userId]);
      
// //       // Log the review action
// //       await executeQuery(`
// //         INSERT INTO membership_review_history 
// //         (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
// //         VALUES (?, ?, ?, ?, ?, ?, NOW())
// //       `, [userId, applicationType, 'pending', status, adminNotes, reviewerId]);
      
// //       await db.commit();
      
// //       // Send notification if requested
// //       if (notifyUser) {
// //         try {
// //           const emailTemplate = status === 'approved' ? 
// //             `${applicationType}_approved` : `${applicationType}_rejected`;
          
// //           await sendEmail(user.email, emailTemplate, {
// //             USERNAME: user.username,
// //             ADMIN_NOTES: adminNotes || '',
// //             REVIEW_DATE: new Date().toLocaleDateString()
// //           });
// //         } catch (emailError) {
// //           console.error('Notification email failed:', emailError);
// //         }
// //       }
      
// //       return successResponse(res, {
// //         newStatus: {
// //           membership_stage: newStage,
// //           approval_status: status,
// //           is_member: memberStatus
// //         }
// //       }, `Application ${status} successfully`);
      
// //     } catch (error) {
// //       await db.rollback();
// //       throw error;
// //     }
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// /**
//  * Bulk approve applications
//  */
// // export const bulkApproveApplications = async (req, res) => {
// //   try {
// //     const { userIds, action, adminNotes, applicationType = 'initial_application' } = req.body;
// //     const reviewerId = req.user.user_id || req.user.id;
    
// //     if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
// //       throw new CustomError('User IDs are required', 400);
// //     }
    
// //     if (!['approve', 'reject'].includes(action)) {
// //       throw new CustomError('Invalid action', 400);
// //     }
    
// //     if (userIds.length > 100) {
// //       throw new CustomError('Maximum 100 applications can be processed at once', 400);
// //     }
    
// //     const status = action === 'approve' ? 'approved' : 'rejected';
    
// //     await db.beginTransaction();
    
// //     try {
// //       const processedUsers = [];
      
// //       for (const userId of userIds) {
// //         const user = await getUserById(userId);
        
// //         let newStage = user.membership_stage;
// //         let memberStatus = user.is_member;
        
// //         if (applicationType === 'initial_application') {
// //           if (status === 'approved') {
// //             newStage = 'pre_member';
// //             memberStatus = 'granted';
// //           } else {
// //             newStage = 'applicant';
// //             memberStatus = 'rejected';
// //           }
// //         } else if (applicationType === 'full_membership') {
// //           if (status === 'approved') {
// //             newStage = 'member';
// //             memberStatus = 'active';
// //           }
// //         }
        
// //         // Validate transition
// //         if (!validateStageTransition(user.membership_stage, newStage)) {
// //           console.warn(`Invalid transition for user ${userId}: ${user.membership_stage} -> ${newStage}`);
// //           continue; // Skip this user
// //         }
        
// //         // Update surveylog
// //         await executeQuery(`
// //           UPDATE surveylog 
// //           SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
// //           WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
// //           ORDER BY createdAt DESC LIMIT 1
// //         `, [status, adminNotes, reviewerId, userId, applicationType]);
        
// //         // Update user status
// //         await executeQuery(`
// //           UPDATE users 
// //           SET membership_stage = ?, is_member = ?
// //           WHERE id = ?
// //         `, [newStage, memberStatus, userId]);
        
// //         // Log review
// //         await executeQuery(`
// //           INSERT INTO membership_review_history 
// //           (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
// //           VALUES (?, ?, ?, ?, ?, ?, NOW())
// //         `, [userId, applicationType, 'pending', status, adminNotes, reviewerId]);
        
// //         processedUsers.push({
// //           userId,
// //           username: user.username,
// //           email: user.email,
// //           newStatus: { membership_stage: newStage, is_member: memberStatus }
// //         });
// //       }
      
// //       await db.commit();
      
// //       // Send notification emails (non-blocking)
// //       const emailTemplate = status === 'approved' ? 
// //         `${applicationType}_approved` : `${applicationType}_rejected`;
        
// //       const emailPromises = processedUsers.map(user => 
// //         sendEmail(user.email, emailTemplate, {
// //           USERNAME: user.username,
// //           ADMIN_NOTES: adminNotes || '',
// //           REVIEW_DATE: new Date().toLocaleDateString()
// //         }).catch(err => console.error('Email failed for', user.email, err))
// //       );
      
// //       // Don't wait for emails to complete
// //       Promise.allSettled(emailPromises);
      
// //       return successResponse(res, {
// //         processedCount: processedUsers.length,
// //         requestedCount: userIds.length,
// //         processedUsers
// //       }, `Successfully ${action}ed ${processedUsers.length} out of ${userIds.length} applications`);
      
// //     } catch (error) {
// //       await db.rollback();
// //       throw error;
// //     }
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// /**
//  * Get pending full memberships (Admin)
//  */
// // export const getPendingFullMemberships = async (req, res) => {
// //   try {
// //     const { 
// //       page = 1, 
// //       limit = 20, 
// //       sortBy = 'submitted_at', 
// //       sortOrder = 'ASC',
// //       search = ''
// //     } = req.query;
    
// //     const offset = (page - 1) * limit;
    
// //     let searchClause = '';
// //     let searchParams = [];
    
// //     if (search) {
// //       searchClause = 'AND (u.username LIKE ? OR u.email LIKE ?)';
// //       searchParams = [`%${search}%`, `%${search}%`];
// //     }
    
// //     const applications = await executeQuery(`
// //       SELECT 
// //         u.id as user_id,
// //         u.username,
// //         u.email,
// //         sl.id as application_id,
// //         sl.answers,
// //         sl.createdAt as submitted_at,
// //         sl.application_ticket,
// //         sl.additional_data,
// //         fma.first_accessed_at,
// //         fma.access_count,
// //         DATEDIFF(NOW(), sl.createdAt) as days_pending
// //       FROM surveylog sl
// //       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
// //       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
// //       WHERE sl.application_type = 'full_membership' 
// //         AND sl.approval_status = 'pending'
// //         ${searchClause}
// //       ORDER BY ${sortBy} ${sortOrder}
// //       LIMIT ? OFFSET ?
// //     `, [...searchParams, parseInt(limit), offset]);
    
// //     const countResult = await executeQuery(`
// //       SELECT COUNT(*) as total
// //       FROM surveylog sl
// //       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
// //       WHERE sl.application_type = 'full_membership' 
// //         AND sl.approval_status = 'pending'
// //         ${searchClause}
// //     `, searchParams);
    
// //     return successResponse(res, {
// //       applications,
// //       pagination: {
// //         page: parseInt(page),
// //         limit: parseInt(limit),
// //         total: countResult[0].total,
// //         totalPages: Math.ceil(countResult[0].total / limit)
// //       }
// //     });
    
// //   } catch (error) {
// //     return errorResponse(res, error);
// //   }
// // };

// /**
//  * Update full membership status (Admin)
//  */
// // export const updateFullMembershipStatus = async (req, res) => {
// //   try {
// //     const { applicationId } = req.params;
// //     const { status, adminNotes, notifyUser = true } = req.body;
// //     const reviewerId = req.user.user_id || req.user.id;
    
// //     if (!['approved', 'rejected'].includes(status)) {
// //       throw new CustomError('Invalid status', 400);
// //     }
    
// //     // Get application details
// //     const applications = await executeQuery(`
// //       SELECT CAST(user_id AS UNSIGNED) as user_id 
// //       FROM surveylog 
// //       WHERE id = ? AND application_type = 'full_membership'
// //     `, [applicationId]);
    
// //     if (!applications || applications.length === 0) {
// //       throw new CustomError('Application not found', 404);
// //     }
    
// //     const userId = applications[0].user_id;
// //     const user = await getUserById(userId);
    
// //     await db.beginTransaction();
    
// //     try {
// //       // Update surveylog
// //       await executeQuery(`
// //         UPDATE surveylog 
// //         SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
// //         WHERE id = ?
// //       `, [status, adminNotes, reviewerId, applicationId]);
      
// //       // Update user to full member if approved
// //       if (status === 'approved') {
// //         await executeQuery(`
// //           UPDATE users 
// //           SET membership_stage = 'member', is_member = 'active'
// //           WHERE id = ?
// //         `, [userId]);
// //       }
      
// //       // Log the review
// //       await executeQuery(`
// //         INSERT INTO membership_review_history 
// //         (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
// //         VALUES (?, 'full_membership', 'pending', ?, ?, ?, NOW())
// //       `, [userId, status, adminNotes, reviewerId]);
      
// //       await db.commit();
      
// //       // Send notification
// //       if (notifyUser) {
// //         try {
// //           const emailTemplate = status === 'approved' ? 'full_membership_approved' : 'full_membership_rejected';
          
// //           await sendEmail(user.email, emailTemplate, {
// //             USERNAME: user.username,
// //             ADMIN_NOTES: adminNotes || '',
// //             REVIEW_DATE: new Date().toLocaleDateString()
// //           });
// //         } catch (emailError) {
// //           console.error('Notification email failed:', emailError);
// //         }
// //       }
      
// //       return successResponse(res, {}, `Full membership application ${status} successfully`);
      
// //     } catch (error) {
// //       await db.rollback();
// //       throw error;
// //     }
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// /**
//  * Get application details by ID (Admin)
//  */
// export const getApplicationDetails = async (req, res) => {
//   try {
//     const { applicationId } = req.params;
    
//     // Get application with user details
//     const applications = await executeQuery(`
//       SELECT 
//         sl.*,
//         u.username,
//         u.email,
//         u.phone,
//         u.membership_stage,
//         u.is_member,
//         u.createdAt as user_registered,
//         reviewer.username as reviewed_by_username,
//         reviewer.email as reviewed_by_email
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
//       WHERE sl.id = ?
//     `, [applicationId]);
    
//     if (!applications || applications.length === 0) {
//       throw new CustomError('Application not found', 404);
//     }
    
//     const application = applications[0];
    
//     // Get review history for this application
//     const reviewHistory = await executeQuery(`
//       SELECT 
//         mrh.*,
//         reviewer.username as reviewer_name
//       FROM membership_review_history mrh
//       LEFT JOIN users reviewer ON mrh.reviewer_id = reviewer.id
//       WHERE mrh.user_id = ? AND mrh.application_type = ?
//       ORDER BY mrh.reviewed_at DESC
//     `, [application.user_id, application.application_type]);
    
//     return successResponse(res, {
//       application,
//       reviewHistory
//     });
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Get admin dashboard summary
//  */
// export const getAdminDashboardSummary = async (req, res) => {
//   try {
//     // Get pending applications count
//     const pendingStats = await executeQuery(`
//       SELECT 
//         application_type,
//         COUNT(*) as count
//       FROM surveylog 
//       WHERE approval_status = 'pending'
//       GROUP BY application_type
//     `);
    
//     // Get recent activity (last 7 days)
//     const recentActivity = await executeQuery(`
//       SELECT 
//         sl.application_type,
//         sl.approval_status,
//         sl.createdAt,
//         sl.reviewed_at,
//         u.username,
//         reviewer.username as reviewed_by
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
//       WHERE sl.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
//          OR sl.reviewed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
//       ORDER BY COALESCE(sl.reviewed_at, sl.createdAt) DESC
//       LIMIT 20
//     `);
    
//     // Get membership distribution
//     const membershipDistribution = await executeQuery(`
//       SELECT 
//         membership_stage,
//         COUNT(*) as count
//       FROM users
//       GROUP BY membership_stage
//     `);
    
//     // Get processing time stats
//     const processingStats = await executeQuery(`
//       SELECT 
//         application_type,
//         AVG(DATEDIFF(reviewed_at, createdAt)) as avg_days,
//         COUNT(*) as total_processed
//       FROM surveylog
//       WHERE reviewed_at IS NOT NULL
//         AND reviewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//       GROUP BY application_type
//     `);
    
//     return successResponse(res, {
//       pendingApplications: pendingStats.reduce((acc, stat) => {
//         acc[stat.application_type] = stat.count;
//         return acc;
//       }, {}),
//       recentActivity,
//       membershipDistribution,
//       processingStats
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Search users (Admin)
//  */
// export const searchUsers = async (req, res) => {
//   try {
//     const { 
//       query = '', 
//       membershipStage = '', 
//       role = '', 
//       page = 1, 
//       limit = 20 
//     } = req.query;
    
//     const offset = (page - 1) * limit;
    
//     let whereClause = 'WHERE 1=1';
//     let queryParams = [];
    
//     if (query) {
//       whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)';
//       queryParams.push(`%${query}%`, `%${query}%`);
//     }
    
//     if (membershipStage) {
//       whereClause += ' AND u.membership_stage = ?';
//       queryParams.push(membershipStage);
//     }
    
//     if (role) {
//       whereClause += ' AND u.role = ?';
//       queryParams.push(role);
//     }
    
//     const users = await executeQuery(`
//       SELECT 
//         u.id,
//         u.username,
//         u.email,
//         u.phone,
//         u.membership_stage,
//         u.is_member,
//         u.role,
//         u.createdAt,
//         COALESCE(initial_app.approval_status, 'not_submitted') as initial_status,
//         COALESCE(full_app.approval_status, 'not_submitted') as full_status
//       FROM users u
//       LEFT JOIN surveylog initial_app ON u.id = CAST(initial_app.user_id AS UNSIGNED) 
//         AND initial_app.application_type = 'initial_application'
//       LEFT JOIN surveylog full_app ON u.id = CAST(full_app.user_id AS UNSIGNED) 
//         AND full_app.application_type = 'full_membership'
//       ${whereClause}
//       ORDER BY u.createdAt DESC
//       LIMIT ? OFFSET ?
//     `, [...queryParams, parseInt(limit), offset]);
    
//     const countResult = await executeQuery(`
//       SELECT COUNT(*) as total
//       FROM users u
//       ${whereClause}
//     `, queryParams);
    
//     return successResponse(res, {
//       users,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: countResult[0].total,
//         totalPages: Math.ceil(countResult[0].total / limit)
//       }
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Update user role (Super Admin only)
//  */
// export const updateUserRole = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { role } = req.body;
//     const adminId = req.user.user_id || req.user.id;
    
//     // Validate role
//     if (!['user', 'admin', 'super_admin'].includes(role)) {
//       throw new CustomError('Invalid role', 400);
//     }
    
//     // Get current user details
//     const user = await getUserById(userId);
    
//     // Prevent self-demotion from super_admin
//     if (adminId === parseInt(userId) && req.user.role === 'super_admin' && role !== 'super_admin') {
//       throw new CustomError('Cannot demote yourself from super admin', 400);
//     }
    
//     // Update user role
//     await executeQuery(`
//       UPDATE users 
//       SET role = ? 
//       WHERE id = ?
//     `, [role, userId]);
    
//     // Log the role change
//     await executeQuery(`
//       INSERT INTO membership_review_history 
//       (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
//       VALUES (?, 'role_change', ?, ?, ?, ?, NOW())
//     `, [userId, user.role, role, `Role changed from ${user.role} to ${role}`, adminId]);
    
//     return successResponse(res, {
//       userId,
//       oldRole: user.role,
//       newRole: role
//     }, `User role updated successfully`);
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Get application by ID with user details
//  */
// // export const getApplicationById = async (req, res) => {
// //   try {
// //     const { applicationId } = req.params;
    
// //     const applications = await executeQuery(`
// //       SELECT 
// //         sl.*,
// //         u.username,
// //         u.email,
// //         u.membership_stage,
// //         u.is_member,
// //         reviewer.username as reviewed_by_name
// //       FROM surveylog sl
// //       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
// //       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
// //       WHERE sl.id = ?
// //     `, [applicationId]);
    
// //     if (!applications || applications.length === 0) {
// //       throw new CustomError('Application not found', 404);
// //     }
    
// //     return successResponse(res, {
// //       application: applications[0]
// //     });
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// // /**
// //  * Reset user password (admin function)
// //  */
// // export const resetUserPassword = async (req, res) => {
// //   try {
// //     const { userId } = req.params;
// //     const { newPassword } = req.body;
// //     const adminId = req.user.user_id || req.user.id;
    
// //     if (!newPassword || newPassword.length < 8) {
// //       throw new CustomError('New password must be at least 8 characters long', 400);
// //     }
    
// //     // Get user
// //     const user = await getUserById(userId);
    
// //     // Hash new password
// //     const saltRounds = 12;
// //     const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
// //     // Update password
// //     await executeQuery(`
// //       UPDATE users 
// //       SET password_hash = ?, updatedAt = NOW()
// //       WHERE id = ?
// //     `, [passwordHash, userId]);
    
// //     // Log the password reset
// //     await executeQuery(`
// //       INSERT INTO membership_review_history 
// //       (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
// //       VALUES (?, 'password_reset', 'active', 'active', 'Password reset by admin', ?, NOW())
// //     `, [userId, adminId]);
    
// //     // Send notification email
// //     try {
// //       await sendEmail(user.email, 'password_reset_admin', {
// //         USERNAME: user.username,
// //         RESET_DATE: new Date().toLocaleDateString()
// //       });
// //     } catch (emailError) {
// //       console.error('Password reset notification failed:', emailError);
// //     }
    
// //     return successResponse(res, {}, 'Password reset successfully');
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// // /**
// //  * Get user activity log
// //  */
// // export const getUserActivity = async (req, res) => {
// //   try {
// //     const { userId } = req.params;
// //     const { page = 1, limit = 20 } = req.query;
// //     const offset = (page - 1) * limit;
    
// //     // Get user activity from various sources
// //     const activities = await executeQuery(`
// //       SELECT 
// //         'application' as type,
// //         CONCAT('Application ', approval_status) as action,
// //         createdAt as timestamp,
// //         application_type as details
// //       FROM surveylog 
// //       WHERE CAST(user_id AS UNSIGNED) = ?
      
// //       UNION ALL
      
// //       SELECT 
// //         'review' as type,
// //         CONCAT('Status changed from ', previous_status, ' to ', new_status) as action,
// //         reviewed_at as timestamp,
// //         review_notes as details
// //       FROM membership_review_history
// //       WHERE user_id = ?
      
// //       UNION ALL
      
// //       SELECT 
// //         'access' as type,
// //         'Full membership accessed' as action,
// //         last_accessed_at as timestamp,
// //         CONCAT('Access count: ', access_count) as details
// //       FROM full_membership_access
// //       WHERE user_id = ?
      
// //       ORDER BY timestamp DESC
// //       LIMIT ? OFFSET ?
// //     `, [userId, userId, userId, parseInt(limit), offset]);
    
// //     const countResult = await executeQuery(`
// //       SELECT 
// //         (SELECT COUNT(*) FROM surveylog WHERE CAST(user_id AS UNSIGNED) = ?) +
// //         (SELECT COUNT(*) FROM membership_review_history WHERE user_id = ?) +
// //         (SELECT COUNT(*) FROM full_membership_access WHERE user_id = ?) as total
// //     `, [userId, userId, userId]);
    
// //     return successResponse(res, {
// //       activities,
// //       pagination: {
// //         page: parseInt(page),
// //         limit: parseInt(limit),
// //         total: countResult[0].total,
// //         totalPages: Math.ceil(countResult[0].total / limit)
// //       }
// //     });
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// // /**
// //  * Get application statistics for dashboard
// //  */
// // export const getApplicationStats = async (req, res) => {
// //   try {
// //     const stats = await executeQuery(`
// //       SELECT 
// //         application_type,
// //         approval_status,
// //         COUNT(*) as count
// //       FROM surveylog
// //       GROUP BY application_type, approval_status
// //     `);
    
// //     const timeStats = await executeQuery(`
// //       SELECT 
// //         DATE(createdAt) as date,
// //         COUNT(*) as submissions
// //       FROM surveylog
// //       WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
// //       GROUP BY DATE(createdAt)
// //       ORDER BY date ASC
// //     `);
    
// //     return successResponse(res, {
// //       statusBreakdown: stats,
// //       submissionTrends: timeStats
// //     });
    
// //   } catch (error) {
// //     return errorResponse(res, error);
// //   }
// // };

// //part 444444444444444444444444444444444444444444444444 

// // ==================================================
// // Part 6: ANALYTICS, REPORTING & SYSTEM FUNCTIONS
// // ==================================================

// /**
//  * Get comprehensive membership analytics
//  */
// // export const getMembershipAnalytics = async (req, res) => {
// //   try {
// //     const { period = '30d', detailed = false } = req.query;
    
// //     // Get basic membership statistics
// //     const membershipStats = await executeQuery(`
// //       SELECT 
// //         COUNT(*) as total_users,
// //         COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as total_applicants,
// //         COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as total_pre_members,
// //         COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as total_members,
// //         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month,
// //         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week
// //       FROM users
// //     `);
    
// //     // Get conversion funnel data
// //     const funnelData = await executeQuery(`
// //       SELECT 
// //         COUNT(*) as total_registrations,
// //         COUNT(CASE WHEN membership_stage != 'none' THEN 1 END) as started_application,
// //         COUNT(CASE WHEN membership_stage = 'pre_member' OR membership_stage = 'member' THEN 1 END) as approved_initial,
// //         COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members
// //       FROM users
// //     `);
    
// //     // Get time-series data for the chart
// //     const periodDays = period === '30d' ? 30 : period === '7d' ? 7 : 90;
// //     const timeSeriesData = await executeQuery(`
// //       SELECT 
// //         DATE(createdAt) as date,
// //         COUNT(*) as registrations,
// //         COUNT(CASE WHEN membership_stage = 'pre_member' OR membership_stage = 'member' THEN 1 END) as approvals
// //       FROM users 
// //       WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
// //       GROUP BY DATE(createdAt)
// //       ORDER BY date ASC
// //     `, [periodDays]);
    
// //     // Get application processing stats
// //     const processingStats = await executeQuery(`
// //       SELECT 
// //         application_type,
// //         COUNT(*) as total_applications,
// //         COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
// //         COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected,
// //         COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending,
// //         AVG(CASE WHEN reviewed_at IS NOT NULL THEN DATEDIFF(reviewed_at, createdAt) END) as avg_processing_days
// //       FROM surveylog
// //       GROUP BY application_type
// //     `);
    
// //     let detailedAnalytics = {};
// //     if (detailed === 'true') {
// //       // Get detailed breakdown by various factors
// //       const roleBreakdown = await executeQuery(`
// //         SELECT 
// //           role,
// //           COUNT(*) as count,
// //           COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members
// //         FROM users
// //         GROUP BY role
// //       `);
      
// //       const monthlyTrends = await executeQuery(`
// //         SELECT 
// //           YEAR(createdAt) as year,
// //           MONTH(createdAt) as month,
// //           COUNT(*) as registrations,
// //           COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as conversions
// //         FROM users
// //         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
// //         GROUP BY YEAR(createdAt), MONTH(createdAt)
// //         ORDER BY year DESC, month DESC
// //       `);
      
// //       detailedAnalytics = { 
// //         roleBreakdown,
// //         monthlyTrends
// //       };
// //     }
    
// //     return successResponse(res, {
// //       overview: membershipStats[0],
// //       conversionFunnel: funnelData[0],
// //       timeSeries: timeSeriesData,
// //       processingStats,
// //       ...detailedAnalytics
// //     });
// //   } catch (error) {
// //     return errorResponse(res, error);
// //   }
// // };

// /**
//  * Get membership overview for admin dashboard
//  */
// // export const getMembershipOverview = async (req, res) => {
// //   try {
// //     // Get comprehensive overview data
// //     const overview = await executeQuery(`
// //       SELECT 
// //         u.id,
// //         u.username,
// //         u.email,
// //         u.membership_stage,
// //         u.is_member,
// //         u.role,
// //         u.createdAt as user_created,
        
// //         -- Initial Application Info
// //         COALESCE(initial_app.approval_status, 'not_submitted') as initial_status,
// //         initial_app.createdAt as initial_submitted,
// //         initial_app.reviewed_at as initial_reviewed,
// //         initial_reviewer.username as initial_reviewer,
        
// //         -- Full Membership Info  
// //         COALESCE(full_app.approval_status, 'not_submitted') as full_status,
// //         full_app.createdAt as full_submitted,
// //         full_app.reviewed_at as full_reviewed,
// //         full_reviewer.username as full_reviewer,
        
// //         -- Access Info
// //         fma.first_accessed_at as full_membership_accessed,
// //         fma.access_count
        
// //       FROM users u
// //       LEFT JOIN surveylog initial_app ON u.id = CAST(initial_app.user_id AS UNSIGNED) 
// //         AND initial_app.application_type = 'initial_application'
// //       LEFT JOIN users initial_reviewer ON initial_app.reviewed_by = initial_reviewer.id
// //       LEFT JOIN surveylog full_app ON u.id = CAST(full_app.user_id AS UNSIGNED) 
// //         AND full_app.application_type = 'full_membership'  
// //       LEFT JOIN users full_reviewer ON full_app.reviewed_by = full_reviewer.id
// //       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
// //       ORDER BY u.createdAt DESC
// //       LIMIT 100
// //     `);
    
// //     // Get summary statistics
// //     const summary = await executeQuery(`
// //       SELECT 
// //         COUNT(*) as total_users,
// //         COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as applicants,
// //         COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as pre_members,
// //         COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members,
// //         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month,
// //         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week
// //       FROM users
// //     `);
    
// //     return successResponse(res, {
// //       overview,
// //       summary: summary[0]
// //     });
    
// //   } catch (error) {
// //     return errorResponse(res, error);
// //   }
// // };

// /**
//  * Get detailed membership statistics
//  */
// // export const getMembershipStats = async (req, res) => {
// //   try {
// //     // Get comprehensive statistics
// //     const membershipStats = await executeQuery(`
// //       SELECT 
// //         COUNT(*) as total_users,
// //         COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as total_applicants,
// //         COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as total_pre_members,
// //         COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as total_members,
        
// //         -- Application stats
// //         (SELECT COUNT(*) FROM surveylog WHERE application_type = 'initial_application') as submitted_initial_applications,
// //         (SELECT COUNT(*) FROM surveylog WHERE application_type = 'initial_application' AND approval_status = 'pending') as pending_initial_applications,
// //         (SELECT COUNT(*) FROM surveylog WHERE application_type = 'full_membership') as submitted_full_applications,
// //         (SELECT COUNT(*) FROM surveylog WHERE application_type = 'full_membership' AND approval_status = 'pending') as pending_full_applications
        
// //       FROM users
// //     `);
    
// //     // Get registration trends
// //     const registrationTrends = await executeQuery(`
// //       SELECT 
// //         DATE(createdAt) as date,
// //         COUNT(*) as registrations
// //       FROM users 
// //       WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
// //       GROUP BY DATE(createdAt)
// //       ORDER BY date ASC
// //     `);
    
// //     // Get approval rates
// //     const approvalRates = await executeQuery(`
// //       SELECT 
// //         application_type,
// //         COUNT(*) as total_applications,
// //         COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
// //         COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected,
// //         COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending,
// //         ROUND(COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) * 100.0 / COUNT(*), 2) as approval_rate
// //       FROM surveylog
// //       GROUP BY application_type
// //     `);
    
// //     // Get processing time stats
// //     const processingTimes = await executeQuery(`
// //       SELECT 
// //         application_type,
// //         AVG(DATEDIFF(reviewed_at, createdAt)) as avg_processing_days,
// //         MIN(DATEDIFF(reviewed_at, createdAt)) as min_processing_days,
// //         MAX(DATEDIFF(reviewed_at, createdAt)) as max_processing_days
// //       FROM surveylog
// //       WHERE reviewed_at IS NOT NULL
// //       GROUP BY application_type
// //     `);
    
// //     return successResponse(res, {
// //       membershipStats: membershipStats[0],
// //       registrationTrends,
// //       approvalRates,
// //       processingTimes
// //     });
    
// //   } catch (error) {
// //     return errorResponse(res, error);
// //   }
// // };

// /**
//  * Export membership data
//  */
// // export const exportMembershipData = async (req, res) => {
// //   try {
// //     const { format = 'csv', filters = {} } = req.query;
    
// //     // Get comprehensive membership data
// //     const membershipData = await executeQuery(`
// //       SELECT 
// //         u.id,
// //         u.username,
// //         u.email,
// //         u.phone,
// //         u.membership_stage,
// //         u.is_member,
// //         u.role,
// //         u.createdAt as user_created,
// //         COALESCE(initial_app.approval_status, 'not_submitted') as initial_status,
// //         initial_app.createdAt as initial_submitted,
// //         initial_app.reviewed_at as initial_reviewed,
// //         COALESCE(full_app.approval_status, 'not_submitted') as full_status,
// //         full_app.createdAt as full_submitted,
// //         full_app.reviewed_at as full_reviewed
// //       FROM users u
// //       LEFT JOIN surveylog initial_app ON u.id = CAST(initial_app.user_id AS UNSIGNED) 
// //         AND initial_app.application_type = 'initial_application'
// //       LEFT JOIN surveylog full_app ON u.id = CAST(full_app.user_id AS UNSIGNED) 
// //         AND full_app.application_type = 'full_membership'
// //       ORDER BY u.createdAt DESC
// //     `);
    
// //     if (format === 'csv') {
// //       // Convert to CSV format
// //       const csv = convertToCSV(membershipData);
// //       res.setHeader('Content-Type', 'text/csv');
// //       res.setHeader('Content-Disposition', 'attachment; filename="membership_data.csv"');
// //       res.send(csv);
// //     } else {
// //       return successResponse(res, {
// //         data: membershipData,
// //         exportedAt: new Date().toISOString(),
// //         totalRecords: membershipData.length
// //       });
// //     }
// //   } catch (error) {
// //     return errorResponse(res, error);
// //   }
// // };

// /**
//  * Send notification to users (Admin)
//  */
// // export const sendNotification = async (req, res) => {
// //   try {
// //     const { 
// //       recipients, // array of user IDs or 'all'
// //       subject,
// //       message,
// //       type = 'email', // 'email', 'sms', 'both'
// //       priority = 'normal' // 'low', 'normal', 'high'
// //     } = req.body;
    
// //     if (!subject || !message) {
// //       throw new CustomError('Subject and message are required', 400);
// //     }
    
// //     let userList = [];
    
// //     if (recipients === 'all') {
// //       userList = await executeQuery('SELECT id, username, email, phone FROM users');
// //     } else if (Array.isArray(recipients)) {
// //       const placeholders = recipients.map(() => '?').join(',');
// //       userList = await executeQuery(
// //         `SELECT id, username, email, phone FROM users WHERE id IN (${placeholders})`,
// //         recipients
// //       );
// //     } else {
// //       throw new CustomError('Invalid recipients format', 400);
// //     }
    
// //     let successCount = 0;
// //     const sendPromises = [];
    
// //     for (const user of userList) {
// //       if ((type === 'email' || type === 'both') && user.email) {
// //         sendPromises.push(
// //           sendEmail(user.email, 'admin_notification', {
// //             USERNAME: user.username,
// //             SUBJECT: subject,
// //             MESSAGE: message,
// //             PRIORITY: priority
// //           }).then(() => successCount++).catch(err => console.error('Email failed for', user.email, err))
// //         );
// //       }
      
// //       if ((type === 'sms' || type === 'both') && user.phone) {
// //         sendPromises.push(
// //           sendSMS(user.phone, `${subject}: ${message}`)
// //             .then(() => successCount++).catch(err => console.error('SMS failed for', user.phone, err))
// //         );
// //       }
// //     }
    
// //     await Promise.allSettled(sendPromises);
    
// //     return successResponse(res, {
// //       sentCount: userList.length,
// //       successCount
// //     }, `Notification sent to ${userList.length} users`);
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// /**
//  * Send membership-specific notification (Admin)
//  */
// // export const sendMembershipNotification = async (req, res) => {
// //   try {
// //     const { 
// //       membershipStage, // 'applicant', 'pre_member', 'member'
// //       subject,
// //       message,
// //       type = 'email'
// //     } = req.body;
    
// //     if (!membershipStage || !subject || !message) {
// //       throw new CustomError('Membership stage, subject and message are required', 400);
// //     }
    
// //     const users = await executeQuery(`
// //       SELECT id, username, email, phone 
// //       FROM users 
// //       WHERE membership_stage = ?
// //     `, [membershipStage]);
    
// //     let successCount = 0;
// //     const sendPromises = [];
    
// //     for (const user of users) {
// //       if (type === 'email' && user.email) {
// //         sendPromises.push(
// //           sendEmail(user.email, 'membership_notification', {
// //             USERNAME: user.username,
// //             SUBJECT: subject,
// //             MESSAGE: message,
// //             MEMBERSHIP_STAGE: membershipStage
// //           }).then(() => successCount++).catch(err => console.error('Email failed for', user.email, err))
// //         );
// //       }
      
// //       if (type === 'sms' && user.phone) {
// //         sendPromises.push(
// //           sendSMS(user.phone, `${subject}: ${message}`)
// //             .then(() => successCount++).catch(err => console.error('SMS failed for', user.phone, err))
// //         );
// //       }
// //     }
    
// //     await Promise.allSettled(sendPromises);
    
// //     return successResponse(res, {
// //       sentCount: users.length,
// //       successCount
// //     }, `Membership notification sent to ${users.length} ${membershipStage}s`);
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// /**
//  * Health check endpoint for membership system
//  */
// // export const healthCheck = async (req, res) => {
// //   try {
// //     // Check database connectivity
// //     await executeQuery('SELECT 1 as health_check');
    
// //     // Get basic system stats
// //     const stats = await executeQuery(`
// //       SELECT 
// //         COUNT(*) as total_users,
// //         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as new_users_24h,
// //         (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_applications
// //       FROM users
// //     `);
    
// //     return successResponse(res, {
// //       status: 'healthy',
// //       timestamp: new Date().toISOString(),
// //       stats: stats[0],
// //       version: '2.0.0'
// //     });
    
// //   } catch (error) {
// //     return res.status(503).json({
// //       success: false,
// //       status: 'unhealthy',
// //       error: error.message,
// //       timestamp: new Date().toISOString()
// //     });
// //   }
// // };

// /**
//  * Get system configuration (Admin only)
//  */
// // export const getSystemConfig = async (req, res) => {
// //   try {
// //     const userRole = req.user.role;
    
// //     if (!['admin', 'super_admin'].includes(userRole)) {
// //       throw new CustomError('Insufficient permissions', 403);
// //     }
    
// //     // Get various system configurations
// //     const config = {
// //       membershipStages: ['none', 'applicant', 'pre_member', 'member'],
// //       memberStatuses: ['pending', 'granted', 'rejected', 'active'],
// //       userRoles: ['user', 'admin', 'super_admin'],
// //       applicationTypes: ['initial_application', 'full_membership'],
// //       approvalStatuses: ['not_submitted', 'pending', 'approved', 'rejected'],
// //       notificationTypes: ['email', 'sms', 'both'],
// //       systemLimits: {
// //         maxBulkOperations: 100,
// //         maxExportRecords: 10000,
// //         sessionTimeout: '7d',
// //         verificationCodeExpiry: '10m'
// //       },
// //       features: {
// //         emailNotifications: true,
// //         smsNotifications: true,
// //         bulkOperations: true,
// //         dataExport: true,
// //         analytics: true
// //       }
// //     };
    
// //     return successResponse(res, { config });
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };



// // =============================================================================
// // MIDDLEWARE HELPERS
// // =============================================================================

// /**
//  * Validate request parameters
//  */
// // export const validateRequest = (requiredFields) => {
// //   return (req, res, next) => {
// //     const missingFields = requiredFields.filter(field => !req.body[field]);
    
// //     if (missingFields.length > 0) {
// //       return errorResponse(res, 
// //         new CustomError(`Missing required fields: ${missingFields.join(', ')}`, 400), 
// //         400
// //       );
// //     }
    
// //     next();
// //   };
// // };

// /**
//  * Validate admin permissions
//  */
// // export const requireAdmin = (req, res, next) => {
// //   const userRole = req.user?.role;
  
// //   if (!['admin', 'super_admin'].includes(userRole)) {
// //     return errorResponse(res, 
// //       new CustomError('Administrative privileges required', 403), 
// //       403
// //     );
// //   }
  
// //   next();
// // };

// /**
//  * Validate super admin permissions
//  */
// // export const requireSuperAdmin = (req, res, next) => {
// //   const userRole = req.user?.role;
  
// //   if (userRole !== 'super_admin') {
// //     return errorResponse(res, 
// //       new CustomError('Super administrative privileges required', 403), 
// //       403
// //     );
// //   }
  
// //   next();
// // };

// // =============================================================================
// // ADDITIONAL UTILITY FUNCTIONS (MISSING FROM ROUTES)
// // =============================================================================

// /**
//  * Get application by ID with user details
//  */
// export const getApplicationById = async (req, res) => {
//   try {
//     const { applicationId } = req.params;
    
//     const applications = await executeQuery(`
//       SELECT 
//         sl.*,
//         u.username,
//         u.email,
//         u.membership_stage,
//         u.is_member,
//         reviewer.username as reviewed_by_name
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
//       WHERE sl.id = ?
//     `, [applicationId]);
    
//     if (!applications || applications.length === 0) {
//       throw new CustomError('Application not found', 404);
//     }
    
//     return successResponse(res, {
//       application: applications[0]
//     });
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Get user profile (for authenticated user)
//  */
// export const getUserProfile = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user.user_id;
//     const user = await getUserById(userId);
    
//     // Remove sensitive information
//     const { password_hash, ...userProfile } = user;
    
//     return successResponse(res, {
//       profile: userProfile
//     });
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Update user profile
//  */
// export const updateUserProfile = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user.user_id;
//     const { username, email, phone, bio } = req.body;
    
//     // Basic validation
//     if (!username || !email) {
//       throw new CustomError('Username and email are required', 400);
//     }
    
//     // Check if username/email is already taken by another user
//     const existingUsers = await executeQuery(`
//       SELECT id FROM users 
//       WHERE (username = ? OR email = ?) AND id != ?
//     `, [username, email, userId]);
    
//     if (existingUsers.length > 0) {
//       throw new CustomError('Username or email already taken', 409);
//     }
    
//     // Update user profile
//     await executeQuery(`
//       UPDATE users 
//       SET username = ?, email = ?, phone = ?, bio = ?, updatedAt = NOW()
//       WHERE id = ?
//     `, [username, email, phone || null, bio || null, userId]);
    
//     // Get updated user data
//     const updatedUser = await getUserById(userId);
//     const { password_hash, ...userProfile } = updatedUser;
    
//     return successResponse(res, {
//       profile: userProfile
//     }, 'Profile updated successfully');
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Change user password
//  */
// export const changePassword = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user.user_id;
//     const { currentPassword, newPassword } = req.body;
    
//     if (!currentPassword || !newPassword) {
//       throw new CustomError('Current password and new password are required', 400);
//     }
    
//     if (newPassword.length < 8) {
//       throw new CustomError('New password must be at least 8 characters long', 400);
//     }
    
//     // Get current user
//     const user = await getUserById(userId);
    
//     // Verify current password
//     const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
//     if (!isValidPassword) {
//       throw new CustomError('Current password is incorrect', 400);
//     }
    
//     // Hash new password
//     const saltRounds = 12;
//     const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
//     // Update password
//     await executeQuery(`
//       UPDATE users 
//       SET password_hash = ?, updatedAt = NOW()
//       WHERE id = ?
//     `, [newPasswordHash, userId]);
    
//     return successResponse(res, {}, 'Password changed successfully');
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Delete user account (self-deletion)
//  */
// // export const deleteUserAccount = async (req, res) => {
// //   try {
// //     const userId = req.user.id || req.user.user_id;
// //     const { password, reason } = req.body;
    
// //     if (!password) {
// //       throw new CustomError('Password confirmation required', 400);
// //     }
    
// //     // Get current user
// //     const user = await getUserById(userId);
    
// //     // Verify password
// //     const isValidPassword = await bcrypt.compare(password, user.password_hash);
// //     if (!isValidPassword) {
// //       throw new CustomError('Password is incorrect', 400);
// //     }
    
// //     await db.beginTransaction();
    
// //     try {
// //       // Log the deletion
// //       await executeQuery(`
// //         INSERT INTO user_deletion_log (user_id, username, email, reason, deleted_at)
// //         VALUES (?, ?, ?, ?, NOW())
// //       `, [userId, user.username, user.email, reason || 'User requested deletion']);
      
// //       // Delete related data
// //       await executeQuery('DELETE FROM surveylog WHERE CAST(user_id AS UNSIGNED) = ?', [userId]);
// //       await executeQuery('DELETE FROM full_membership_access WHERE user_id = ?', [userId]);
// //       await executeQuery('DELETE FROM membership_review_history WHERE user_id = ?', [userId]);
      
// //       // Delete user
// //       await executeQuery('DELETE FROM users WHERE id = ?', [userId]);
      
// //       await db.commit();
      
// //       return successResponse(res, {}, 'Account deleted successfully');
      
// //     } catch (error) {
// //       await db.rollback();
// //       throw error;
// //     }
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// export const deleteUserAccount = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user.user_id;
//     const { password, reason } = req.body;
        
//     if (!password) {
//       throw new CustomError('Password confirmation required', 400);
//     }
        
//     // Get current user
//     const user = await getUserById(userId);
        
//     // Verify password
//     const isValidPassword = await bcrypt.compare(password, user.password_hash);
//     if (!isValidPassword) {
//       throw new CustomError('Password is incorrect', 400);
//     }
        
//     const result = await db.transaction(async (connection) => {
//       // Log the deletion
//       await connection.execute(`
//         INSERT INTO user_deletion_log (user_id, username, email, reason, deleted_at)
//         VALUES (?, ?, ?, ?, NOW())
//       `, [userId, user.username, user.email, reason || 'User requested deletion']);
            
//       // Delete related data
//       await connection.execute('DELETE FROM surveylog WHERE CAST(user_id AS UNSIGNED) = ?', [userId]);
//       await connection.execute('DELETE FROM full_membership_access WHERE user_id = ?', [userId]);
//       await connection.execute('DELETE FROM membership_review_history WHERE user_id = ?', [userId]);
            
//       // Delete user
//       await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
            
//       return { deleted: true };
//     });
        
//     return successResponse(res, {}, 'Account deleted successfully');
        
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };


// /**
//  * Reset password (admin function)
//  */
// export const resetUserPassword = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { newPassword } = req.body;
//     const adminId = req.user.user_id || req.user.id;
    
//     if (!newPassword || newPassword.length < 8) {
//       throw new CustomError('New password must be at least 8 characters long', 400);
//     }
    
//     // Get user
//     const user = await getUserById(userId);
    
//     // Hash new password
//     const saltRounds = 12;
//     const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
//     // Update password
//     await executeQuery(`
//       UPDATE users 
//       SET password_hash = ?, updatedAt = NOW()
//       WHERE id = ?
//     `, [passwordHash, userId]);
    
//     // Log the password reset
//     await executeQuery(`
//       INSERT INTO membership_review_history 
//       (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
//       VALUES (?, 'password_reset', 'active', 'active', 'Password reset by admin', ?, NOW())
//     `, [userId, adminId]);
    
//     // Send notification email
//     try {
//       await sendEmail(user.email, 'password_reset_admin', {
//         USERNAME: user.username,
//         RESET_DATE: new Date().toLocaleDateString()
//       });
//     } catch (emailError) {
//       console.error('Password reset notification failed:', emailError);
//     }
    
//     return successResponse(res, {}, 'Password reset successfully');
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Get application statistics for dashboard
//  */
// export const getApplicationStats = async (req, res) => {
//   try {
//     const stats = await executeQuery(`
//       SELECT 
//         application_type,
//         approval_status,
//         COUNT(*) as count
//       FROM surveylog
//       GROUP BY application_type, approval_status
//     `);
    
//     const timeStats = await executeQuery(`
//       SELECT 
//         DATE(createdAt) as date,
//         COUNT(*) as submissions
//       FROM surveylog
//       WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//       GROUP BY DATE(createdAt)
//       ORDER BY date ASC
//     `);
    
//     return successResponse(res, {
//       statusBreakdown: stats,
//       submissionTrends: timeStats
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Get user activity log
//  */
// export const getUserActivity = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { page = 1, limit = 20 } = req.query;
//     const offset = (page - 1) * limit;
    
//     // Get user activity from various sources
//     const activities = await executeQuery(`
//       SELECT 
//         'application' as type,
//         CONCAT('Application ', approval_status) as action,
//         createdAt as timestamp,
//         application_type as details
//       FROM surveylog 
//       WHERE CAST(user_id AS UNSIGNED) = ?
      
//       UNION ALL
      
//       SELECT 
//         'review' as type,
//         CONCAT('Status changed from ', previous_status, ' to ', new_status) as action,
//         reviewed_at as timestamp,
//         review_notes as details
//       FROM membership_review_history
//       WHERE user_id = ?
      
//       UNION ALL
      
//       SELECT 
//         'access' as type,
//         'Full membership accessed' as action,
//         last_accessed_at as timestamp,
//         CONCAT('Access count: ', access_count) as details
//       FROM full_membership_access
//       WHERE user_id = ?
      
//       ORDER BY timestamp DESC
//       LIMIT ? OFFSET ?
//     `, [userId, userId, userId, parseInt(limit), offset]);
    
//     const countResult = await executeQuery(`
//       SELECT 
//         (SELECT COUNT(*) FROM surveylog WHERE CAST(user_id AS UNSIGNED) = ?) +
//         (SELECT COUNT(*) FROM membership_review_history WHERE user_id = ?) +
//         (SELECT COUNT(*) FROM full_membership_access WHERE user_id = ?) as total
//     `, [userId, userId, userId]);
    
//     return successResponse(res, {
//       activities,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: countResult[0].total,
//         totalPages: Math.ceil(countResult[0].total / limit)
//       }
//     });
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Verify user email
//  */
// export const verifyEmail = async (req, res) => {
//   try {
//     const { verificationCode } = req.body;
//     const userId = req.user.id || req.user.user_id;
    
//     if (!verificationCode) {
//       throw new CustomError('Verification code is required', 400);
//     }
    
//     // Check verification code
//     const user = await getUserById(userId);
//     const verificationResults = await executeQuery(`
//       SELECT * FROM verification_codes 
//       WHERE email = ? AND code = ? AND expires_at > NOW()
//     `, [user.email, verificationCode]);
    
//     if (!verificationResults || verificationResults.length === 0) {
//       throw new CustomError('Invalid or expired verification code', 400);
//     }
    
//     // Update user as verified
//     await executeQuery(`
//       UPDATE users 
//       SET email_verified = 1, updatedAt = NOW()
//       WHERE id = ?
//     `, [userId]);
    
//     // Delete verification code
//     await executeQuery(`
//       DELETE FROM verification_codes WHERE email = ? AND code = ?
//     `, [user.email, verificationCode]);
    
//     return successResponse(res, {}, 'Email verified successfully');
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };



// // =============================================================================
// // FINAL EXPORTS
// // =============================================================================

// // export default {
// //   // Authentication & Registration
// //   enhancedLogin,
// //   sendVerificationCode,
// //   registerWithVerification,
  
// //   // User Dashboard & Status
// //   getUserDashboard,
// //   checkApplicationStatus,
// //   getApplicationHistory,
// //   getUserPermissions,
// //   getUserProfile,
// //   updateUserProfile,
// //   changePassword,
// //   deleteUserAccount,
// //   verifyEmail,
  
// //   // Application Management
// //   submitInitialApplication,
// //   updateApplicationAnswers,
// //   withdrawApplication,
// //   getApplicationRequirements,
// //   getApplicationQuestions,
// //   validateApplicationAnswers,
  
// //   // Full Membership
// //   getFullMembershipStatus,
// //   submitFullMembershipApplication,
// //   logFullMembershipAccess,
  
// //   // Admin - Application Management
// //   getPendingApplications,
// //   updateApplicationStatus,
// //   bulkApproveApplications,
// //   getPendingFullMemberships,
// //   updateFullMembershipStatus,
// //   getApplicationDetails,
// //   getApplicationById,
// //   getAdminDashboardSummary,
// //   searchUsers,
// //   updateUserRole,
// //   resetUserPassword,
// //   getUserActivity,
// //   getApplicationStats,
  
// //   // Admin - Analytics & Reporting
// //   getMembershipAnalytics,
// //   getMembershipOverview,
// //   getMembershipStats,
// //   exportMembershipData,
  
// //   // Notifications
// //   sendNotification,
// //   sendMembershipNotification,
  
// //   // System
// //   healthCheck,
// //   getSystemConfig,
  
// //   // Middleware helpers
// //   validateRequest,
// //   requireAdmin,
// //   requireSuperAdmin
// // };







// // ikootaapi/controllers/membershipControllers.js
// // ==================================================
// // FIXED VERSION - Proper Database Result Handling
// // ==================================================

// // import bcrypt from 'bcryptjs';
// // import jwt from 'jsonwebtoken';
// // import db from '../config/db.js';
// // import { sendEmail, sendSMS } from '../utils/notifications.js';
// // import CustomError from '../utils/CustomError.js';

// // =============================================================================
// // UTILITY FUNCTIONS (FIXED)
// // =============================================================================

// /**
//  * Generate application ticket with consistent format
//  */
// const generateApplicationTicket = (username, email, type = 'INITIAL') => {
//   const timestamp = Date.now().toString(36);
//   const random = Math.random().toString(36).substr(2, 5);
//   const prefix = type === 'FULL' ? 'FMA' : 'APP';
//   return `${prefix}-${username.substr(0, 3).toUpperCase()}-${timestamp}-${random}`.toUpperCase();
// };

// /**
//  * FIXED: Get user by ID with proper error handling
//  */
// // const getUserById = async (userId) => {
// //   try {
// //     const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    
// //     if (!users || users.length === 0) {
// //       throw new CustomError('User not found', 404);
// //     }
    
// //     return users[0];
// //   } catch (error) {
// //     console.error('Database query error in getUserById:', error);
// //     throw new CustomError('Database operation failed', 500);
// //   }
// // };

// export const getUserById = async (userId) => {
//   try {
//     console.log('🔍 getUserById called with userId:', userId);
    
//     // Try the query and log the full result
//     const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
//     console.log('🔍 Raw DB result:', result);
//     console.log('🔍 Result type:', typeof result);
//     console.log('🔍 Result length:', result.length);
//     console.log('🔍 Result[0]:', result[0]);
//     console.log('🔍 Result[0] type:', typeof result[0]);
    
//     // Handle different possible result structures
//     let users;
//     if (Array.isArray(result) && result.length > 0) {
//       if (Array.isArray(result[0])) {
//         users = result[0]; // MySQL2 format: [rows, fields]
//         console.log('✅ Using MySQL2 format: result[0]');
//       } else {
//         users = result; // Direct array format
//         console.log('✅ Using direct array format: result');
//       }
//     } else {
//       console.log('❌ Unexpected result structure');
//       throw new CustomError('Unexpected database result structure', 500);
//     }
    
//     console.log('🔍 Final users array:', users);
//     console.log('🔍 Users length:', users.length);
    
//     if (!users || users.length === 0) {
//       console.log('❌ No users found');
//       throw new CustomError('User not found', 404);
//     }
    
//     const user = users[0];
//     console.log('✅ User extracted:', user);
//     console.log('✅ User ID:', user.id, 'Username:', user.username);
    
//     return user;
//   } catch (error) {
//     console.error('❌ Database query error in getUserById:', error);
//     throw new CustomError('Database operation failed: ' + error.message, 500);
//   }
// };


// /**
//  * Validate membership stage transitions
//  */
// const validateStageTransition = (currentStage, newStage) => {
//   const validTransitions = {
//     'none': ['applicant'],
//     'applicant': ['pre_member', 'applicant'], // Can stay applicant if rejected
//     'pre_member': ['member'],
//     'member': ['member'] // Members stay members
//   };
  
//   return validTransitions[currentStage]?.includes(newStage) || false;
// };

// /**
//  * Helper function to convert data to CSV
//  */
// const convertToCSV = (data) => {
//   if (!data.length) return '';
  
//   const headers = Object.keys(data[0]).join(',');
//   const rows = data.map(row => 
//     Object.values(row).map(value => {
//       if (value === null || value === undefined) return '';
//       if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
//       if (value instanceof Date) return `"${value.toISOString()}"`;
//       return value;
//     }).join(',')
//   );
  
//   return [headers, ...rows].join('\n');
// };

// /**
//  * Standardized success response
//  */
// const successResponse = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
//   return res.status(statusCode).json({
//     success: true,
//     message,
//     ...data
//   });
// };

// /**
//  * Standardized error response
//  */
// const errorResponse = (res, error, statusCode = 500) => {
//   console.error('Error occurred:', error);
//   return res.status(statusCode).json({
//     success: false,
//     error: error.message || 'An error occurred',
//     details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//   });
// };

// // ==================================================
// // AUTHENTICATION & REGISTRATION FUNCTIONS (FIXED)
// // ==================================================

// /**
//  * FIXED: Enhanced login with comprehensive membership status
//  */
// export const enhancedLogin = async (req, res) => {
//   try {
//     const { identifier, password } = req.body;
    
//     if (!identifier || !password) {
//       throw new CustomError('Email/username and password are required', 400);
//     }
    
//     // Get user with membership information
//     const [users] = await db.query(`
//       SELECT u.*, 
//              COALESCE(sl.approval_status, 'not_submitted') as initial_application_status,
//              sl.createdAt as initial_application_date,
//              fma.first_accessed_at as full_membership_accessed,
//              CASE WHEN fma.user_id IS NOT NULL THEN 1 ELSE 0 END as has_accessed_full_membership
//       FROM users u
//       LEFT JOIN surveylog sl ON u.id = CAST(sl.user_id AS UNSIGNED) 
//         AND sl.application_type = 'initial_application'
//       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
//       WHERE u.email = ? OR u.username = ?
//       GROUP BY u.id
//     `, [identifier, identifier]);
    
//     if (!users || users.length === 0) {
//       throw new CustomError('Invalid credentials', 401);
//     }

//     const user = users[0];

//     // Verify password
//     const isValidPassword = await bcrypt.compare(password, user.password_hash);
//     if (!isValidPassword) {
//       throw new CustomError('Invalid credentials', 401);
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { 
//         user_id: user.id, 
//         username: user.username, 
//         email: user.email,
//         membership_stage: user.membership_stage,
//         is_member: user.is_member,
//         role: user.role
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     // Smart redirect logic
//     let redirectTo = '/';
    
//     if (user.role === 'admin' || user.role === 'super_admin') {
//       redirectTo = '/admin';
//     } else if (user.membership_stage === 'member' && user.is_member === 'active') {
//       redirectTo = '/iko';
//     } else if (user.membership_stage === 'pre_member') {
//       redirectTo = '/towncrier';
//     } else if (user.membership_stage === 'applicant') {
//       if (user.initial_application_status === 'not_submitted') {
//         redirectTo = '/application-survey';
//       } else if (user.initial_application_status === 'pending') {
//         redirectTo = '/pending-verification';
//       } else if (user.initial_application_status === 'approved') {
//         redirectTo = '/approved-verification';
//       }
//     } else {
//       redirectTo = '/dashboard';
//     }

//     return successResponse(res, {
//       token,
//       user: {
//         id: user.id,
//         username: user.username,
//         email: user.email,
//         membership_stage: user.membership_stage,
//         is_member: user.is_member,
//         role: user.role
//       },
//       redirectTo
//     }, 'Login successful');

//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Send verification code for registration
//  */
// export const sendVerificationCode = async (req, res) => {
//   try {
//     const { email, phone, type = 'email' } = req.body;
    
//     if (!email && !phone) {
//       throw new CustomError('Email or phone number is required', 400);
//     }
    
//     // Generate 6-digit verification code
//     const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
//     // Store verification code
//     await db.query(`
//       INSERT INTO verification_codes (email, phone, code, type, expires_at, created_at) 
//       VALUES (?, ?, ?, ?, ?, NOW())
//       ON DUPLICATE KEY UPDATE 
//         code = VALUES(code), 
//         expires_at = VALUES(expires_at), 
//         attempts = 0,
//         created_at = NOW()
//     `, [email || null, phone || null, verificationCode, type, expiresAt]);
    
//     // Send verification code
//     try {
//       if (type === 'email' && email) {
//         await sendEmail(email, 'verification_code', {
//           VERIFICATION_CODE: verificationCode,
//           EXPIRES_IN: '10 minutes'
//         });
//       } else if (type === 'sms' && phone) {
//         await sendSMS(phone, `Your Ikoota verification code is: ${verificationCode}. Valid for 10 minutes.`);
//       }
//     } catch (notificationError) {
//       console.error('Notification sending failed:', notificationError);
//       // Don't fail the entire request if notification fails
//     }
    
//     return successResponse(res, {
//       expiresIn: 600 // 10 minutes in seconds
//     }, `Verification code sent to ${type === 'email' ? email : phone}`);
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Register with verification
//  */
// // export const registerWithVerification = async (req, res) => {
// //   try {
// //     const { 
// //       username, 
// //       email, 
// //       password, 
// //       phone, 
// //       verificationCode, 
// //       verificationType = 'email' 
// //     } = req.body;
    
// //     // Validate required fields
// //     if (!username || !email || !password || !verificationCode) {
// //       throw new CustomError('All fields are required', 400);
// //     }
    
// //     // Verify the verification code
// //     const verificationTarget = verificationType === 'email' ? email : phone;
// //     const [verificationResults] = await db.query(`
// //       SELECT * FROM verification_codes 
// //       WHERE ${verificationType === 'email' ? 'email' : 'phone'} = ? 
// //         AND code = ? 
// //         AND type = ? 
// //         AND expires_at > NOW() 
// //         AND attempts < 3
// //     `, [verificationTarget, verificationCode, verificationType]);
    
// //     if (!verificationResults || verificationResults.length === 0) {
// //       throw new CustomError('Invalid or expired verification code', 400);
// //     }
    
// //     // Check if user already exists
// //     const [existingUsers] = await db.query(
// //       'SELECT id FROM users WHERE email = ? OR username = ?',
// //       [email, username]
// //     );
    
// //     if (existingUsers && existingUsers.length > 0) {
// //       throw new CustomError('User with this email or username already exists', 409);
// //     }
    
// //     await db.beginTransaction();
    
// //     try {
// //       // Hash password
// //       const saltRounds = 12;
// //       const passwordHash = await bcrypt.hash(password, saltRounds);
      
// //       // Generate application ticket
// //       const applicationTicket = generateApplicationTicket(username, email);
      
// //       // Create user
// //       const [result] = await db.query(`
// //         INSERT INTO users (
// //           username, 
// //           email, 
// //           password_hash, 
// //           phone, 
// //           membership_stage, 
// //           is_member, 
// //           application_ticket,
// //           createdAt
// //         ) VALUES (?, ?, ?, ?, 'none', 'pending', ?, NOW())
// //       `, [username, email, passwordHash, phone || null, applicationTicket]);
      
// //       const userId = result.insertId;
      
// //       // Delete used verification code
// //       await db.query(`
// //         DELETE FROM verification_codes 
// //         WHERE ${verificationType === 'email' ? 'email' : 'phone'} = ? AND code = ?
// //       `, [verificationTarget, verificationCode]);
      
// //       await db.commit();
      
// //       // Generate JWT token
// //       const token = jwt.sign(
// //         { 
// //           user_id: userId, 
// //           username, 
// //           email,
// //           membership_stage: 'none',
// //           is_member: 'pending',
// //           role: 'user'
// //         },
// //         process.env.JWT_SECRET,
// //         { expiresIn: '7d' }
// //       );
      
// //       // Send welcome email (non-blocking)
// //       try {
// //         await sendEmail(email, 'welcome_registration', {
// //           USERNAME: username,
// //           APPLICATION_TICKET: applicationTicket
// //         });
// //       } catch (emailError) {
// //         console.error('Welcome email failed:', emailError);
// //       }
      
// //       return successResponse(res, {
// //         token,
// //         user: {
// //           id: userId,
// //           username,
// //           email,
// //           membership_stage: 'none',
// //           application_ticket: applicationTicket
// //         },
// //         redirectTo: '/application-survey'
// //       }, 'Registration successful', 201);
      
// //     } catch (error) {
// //       await db.rollback();
// //       throw error;
// //     }
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// // ==================================================
// // USER DASHBOARD & STATUS FUNCTIONS (FIXED)
// // ==================================================

// export const registerWithVerification = async (req, res) => {
//   try {
//     const {
//        username,
//        email,
//        password,
//        phone,
//        verificationCode,
//        verificationType = 'email'
//      } = req.body;
        
//     // Validate required fields
//     if (!username || !email || !password || !verificationCode) {
//       throw new CustomError('All fields are required', 400);
//     }
        
//     // Verify the verification code
//     const verificationTarget = verificationType === 'email' ? email : phone;
//     const [verificationResults] = await db.query(`
//       SELECT * FROM verification_codes 
//       WHERE ${verificationType === 'email' ? 'email' : 'phone'} = ? 
//         AND code = ? 
//         AND type = ? 
//         AND expires_at > NOW() 
//         AND attempts < 3
//     `, [verificationTarget, verificationCode, verificationType]);
        
//     if (!verificationResults || verificationResults.length === 0) {
//       throw new CustomError('Invalid or expired verification code', 400);
//     }
        
//     // Check if user already exists
//     const [existingUsers] = await db.query(
//       'SELECT id FROM users WHERE email = ? OR username = ?',
//       [email, username]
//     );
        
//     if (existingUsers && existingUsers.length > 0) {
//       throw new CustomError('User with this email or username already exists', 409);
//     }
        
//     const result = await db.transaction(async (connection) => {
//       // Hash password
//       const saltRounds = 12;
//       const passwordHash = await bcrypt.hash(password, saltRounds);
            
//       // Generate application ticket
//       const applicationTicket = generateApplicationTicket(username, email);
            
//       // Create user
//       const [insertResult] = await connection.execute(`
//         INSERT INTO users (
//           username, 
//           email, 
//           password_hash, 
//           phone, 
//           membership_stage, 
//           is_member, 
//           application_ticket,
//           createdAt
//         ) VALUES (?, ?, ?, ?, 'none', 'pending', ?, NOW())
//       `, [username, email, passwordHash, phone || null, applicationTicket]);
            
//       const userId = insertResult.insertId;
            
//       // Delete used verification code
//       await connection.execute(`
//         DELETE FROM verification_codes 
//         WHERE ${verificationType === 'email' ? 'email' : 'phone'} = ? AND code = ?
//       `, [verificationTarget, verificationCode]);
            
//       return {
//         userId,
//         username,
//         email,
//         applicationTicket
//       };
//     });
        
//     // Generate JWT token
//     const token = jwt.sign(
//       {
//          user_id: result.userId,
//          username: result.username,
//          email: result.email,
//         membership_stage: 'none',
//         is_member: 'pending',
//         role: 'user'
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );
        
//     // Send welcome email (non-blocking)
//     try {
//       await sendEmail(result.email, 'welcome_registration', {
//         USERNAME: result.username,
//         APPLICATION_TICKET: result.applicationTicket
//       });
//     } catch (emailError) {
//       console.error('Welcome email failed:', emailError);
//     }
        
//     return successResponse(res, {
//       token,
//       user: {
//         id: result.userId,
//         username: result.username,
//         email: result.email,
//         membership_stage: 'none',
//         application_ticket: result.applicationTicket
//       },
//       redirectTo: '/application-survey'
//     }, 'Registration successful', 201);
        
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };


// /**
//  * FIXED: Enhanced user dashboard with comprehensive data
//  */
// // export const getUserDashboard = async (req, res) => {
// //   try {
// //     const userId = req.user.user_id || req.user.id;
// //     const userRole = req.user.role;
    
// //     console.log('🎯 getUserDashboard called for userId:', userId, 'role:', userRole);
    
// //     if (!userId) {
// //       throw new CustomError('User ID not found', 401);
// //     }
    
// //     // Get comprehensive user data
// //     const user = await getUserById(userId);
    
// //     console.log('✅ User found:', user);
    
// //     // Handle empty is_member for admin users
// //     let memberStatus = user.is_member;
// //     if (!memberStatus || memberStatus === '' || memberStatus === null) {
// //       if (userRole === 'admin' || userRole === 'super_admin') {
// //         memberStatus = 'active';
// //         // Update in database
// //         await db.query(
// //           'UPDATE users SET is_member = ? WHERE id = ?',
// //           ['active', userId]
// //         );
// //         console.log('🔧 Fixed empty is_member for admin user');
// //       } else {
// //         memberStatus = 'pending';
// //       }
// //     }
    
// //     // Get application status
// //     const [applications] = await db.query(`
// //       SELECT 
// //         application_type,
// //         approval_status,
// //         createdAt as submitted_at,
// //         reviewed_at,
// //         admin_notes
// //       FROM surveylog 
// //       WHERE CAST(user_id AS UNSIGNED) = ?
// //       ORDER BY createdAt DESC
// //     `, [userId]);
    
// //     // Get recent activities (notifications, updates, etc.)
// //     const [recentActivities] = await db.query(`
// //       SELECT 
// //         'application' as type,
// //         'Application status updated' as message,
// //         reviewed_at as date
// //       FROM surveylog 
// //       WHERE CAST(user_id AS UNSIGNED) = ? AND reviewed_at IS NOT NULL
// //       ORDER BY reviewed_at DESC
// //       LIMIT 5
// //     `, [userId]);
    
// //     // Create status object
// //     const status = {
// //       id: user.id,
// //       username: user.username,
// //       email: user.email,
// //       role: user.role,
// //       membership_stage: user.membership_stage || 'none',
// //       is_member: memberStatus,
// //       initial_application_status: applications.find(app => app.application_type === 'initial_application')?.approval_status || 'not_submitted',
// //       full_membership_application_status: applications.find(app => app.application_type === 'full_membership')?.approval_status || 'not_submitted',
// //       has_accessed_full_membership: user.membership_stage === 'member',
// //       user_created: user.createdAt
// //     };
    
// //     // Define quick actions based on user status
// //     const quickActions = [];
    
// //     if (user.role === 'admin' || user.role === 'super_admin') {
// //       quickActions.push(
// //         { type: 'primary', text: 'Admin Panel', link: '/admin' },
// //         { type: 'info', text: 'User Management', link: '/admin/users' },
// //         { type: 'success', text: 'Applications', link: '/admin/applications' }
// //       );
// //     } else {
// //       quickActions.push({ type: 'primary', text: 'View Profile', link: '/profile' });
      
// //       if (user.membership_stage === 'member') {
// //         quickActions.push({ type: 'success', text: 'Iko Chat', link: '/iko' });
// //       } else if (user.membership_stage === 'pre_member') {
// //         quickActions.push({ type: 'info', text: 'Towncrier', link: '/towncrier' });
// //         quickActions.push({ type: 'warning', text: 'Apply for Full Membership', link: '/full-membership' });
// //       } else if (status.initial_application_status === 'not_submitted') {
// //         quickActions.push({ type: 'warning', text: 'Submit Application', link: '/application-survey' });
// //       }
// //     }
    
// //     quickActions.push({ type: 'secondary', text: 'Settings', link: '/settings' });
    
// //     console.log('✅ Sending dashboard response');
    
// //     return successResponse(res, {
// //       membershipStatus: status,
// //       recentActivities: recentActivities.map(activity => ({
// //         type: activity.type,
// //         message: activity.message,
// //         date: activity.date?.toISOString() || new Date().toISOString()
// //       })),
// //       notifications: [{
// //         type: 'system',
// //         message: `Welcome back, ${user.username}!`,
// //         date: new Date().toISOString()
// //       }],
// //       quickActions
// //     });
    
// //   } catch (error) {
// //     console.error('❌ getUserDashboard error:', error);
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// export const getUserDashboard = async (req, res) => {
//   try {
//     const userId = req.user.user_id || req.user.id;
//     const userRole = req.user.role;
    
//     console.log('🎯 getUserDashboard called for userId:', userId, 'role:', userRole);
    
//     if (!userId) {
//       throw new CustomError('User ID not found', 401);
//     }
    
//     // Try direct database query first to debug
//     console.log('🔍 Attempting direct database query...');
//     const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
//     console.log('🔍 Direct query result:', result);
    
//     // Handle the result properly
//     let user;
//     if (Array.isArray(result) && result.length > 0) {
//       if (Array.isArray(result[0]) && result[0].length > 0) {
//         user = result[0][0]; // MySQL2 format: [rows, fields]
//         console.log('✅ Using MySQL2 format: result[0][0]');
//       } else if (result[0] && typeof result[0] === 'object') {
//         user = result[0]; // Direct format
//         console.log('✅ Using direct format: result[0]');
//       }
//     }
    
//     console.log('✅ User extracted:', user);
    
//     if (!user || !user.id) {
//       console.error('❌ No valid user data found');
//       return res.status(404).json({ error: 'User not found' });
//     }
    
//     // Handle empty is_member for admin users
//     let memberStatus = user.is_member;
//     if (!memberStatus || memberStatus === '' || memberStatus === null) {
//       if (userRole === 'admin' || userRole === 'super_admin') {
//         memberStatus = 'active';
//         // Update in database
//         await db.query(
//           'UPDATE users SET is_member = ? WHERE id = ?',
//           ['active', userId]
//         );
//         console.log('🔧 Fixed empty is_member for admin user');
//       } else {
//         memberStatus = 'pending';
//       }
//     }
    
//     // Create status object
//     const status = {
//       id: user.id,
//       username: user.username,
//       email: user.email,
//       role: user.role,
//       membership_stage: user.membership_stage || 'none',
//       is_member: memberStatus,
//       initial_application_status: 'approved', // Simplified for testing
//       full_membership_application_status: 'approved',
//       has_accessed_full_membership: true,
//       user_created: user.createdAt
//     };
    
//     // Define quick actions based on user status
//     const quickActions = [];
    
//     if (user.role === 'admin' || user.role === 'super_admin') {
//       quickActions.push(
//         { type: 'primary', text: 'Admin Panel', link: '/admin' },
//         { type: 'info', text: 'User Management', link: '/admin/users' },
//         { type: 'success', text: 'Applications', link: '/admin/applications' }
//       );
//     } else {
//       quickActions.push({ type: 'primary', text: 'View Profile', link: '/profile' });
      
//       if (user.membership_stage === 'member') {
//         quickActions.push({ type: 'success', text: 'Iko Chat', link: '/iko' });
//       } else if (user.membership_stage === 'pre_member') {
//         quickActions.push({ type: 'info', text: 'Towncrier', link: '/towncrier' });
//         quickActions.push({ type: 'warning', text: 'Apply for Full Membership', link: '/full-membership' });
//       } else {
//         quickActions.push({ type: 'warning', text: 'Submit Application', link: '/application-survey' });
//       }
//     }
    
//     quickActions.push({ type: 'secondary', text: 'Settings', link: '/settings' });
    
//     console.log('✅ Sending dashboard response');
    
//     return res.status(200).json({
//       success: true,
//       message: 'Dashboard data retrieved successfully',
//       membershipStatus: status,
//       recentActivities: [],
//       notifications: [{
//         type: 'system',
//         message: `Welcome back, ${user.username}!`,
//         date: new Date().toISOString()
//       }],
//       quickActions
//     });
    
//   } catch (error) {
//     console.error('❌ getUserDashboard error:', error);
//     return res.status(500).json({
//       success: false,
//       error: error.message || 'An error occurred',
//       details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// };


// /**
//  * FIXED: Check application status with detailed information
//  */
// export const checkApplicationStatus = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user.user_id;
    
//     console.log('🔍 checkApplicationStatus called for userId:', userId);
    
//     if (!userId) {
//       throw new CustomError('User authentication required', 401);
//     }

//     // Get user data
//     const user = await getUserById(userId);
    
//     console.log('👤 User found:', user);

//     // Get application details
//     const [applications] = await db.query(`
//       SELECT 
//         sl.application_type,
//         sl.approval_status,
//         sl.createdAt as submitted_at,
//         sl.reviewed_at,
//         sl.admin_notes,
//         sl.application_ticket,
//         reviewer.username as reviewed_by
//       FROM surveylog sl
//       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
//       WHERE CAST(sl.user_id AS UNSIGNED) = ?
//       ORDER BY sl.createdAt DESC
//     `, [userId]);

//     console.log('📋 Applications found:', applications);

//     // Determine current application status
//     const initialApp = applications.find(app => app.application_type === 'initial_application');
//     const fullApp = applications.find(app => app.application_type === 'full_membership');

//     let applicationStatus = 'not_submitted';
//     let canSubmitApplication = true;
//     let nextSteps = [];

//     // Determine status based on membership stage and applications
//     if (user.membership_stage === 'none') {
//       applicationStatus = 'not_submitted';
//       canSubmitApplication = true;
//       nextSteps = [
//         'Complete your initial application survey',
//         'Submit required information',
//         'Wait for admin review (3-5 business days)'
//       ];
//     } else if (user.membership_stage === 'applicant') {
//       applicationStatus = initialApp?.approval_status || 'pending';
//       canSubmitApplication = false;
//       nextSteps = [
//         'Your application is under review',
//         'You will receive an email notification once reviewed',
//         'Check back in 3-5 business days'
//       ];
//     } else if (user.membership_stage === 'pre_member') {
//       applicationStatus = 'approved';
//       canSubmitApplication = false;
//       nextSteps = [
//         'Congratulations! Your initial application was approved',
//         'You now have access to Towncrier content',
//         'Consider applying for full membership when eligible'
//       ];
//     } else if (user.membership_stage === 'member') {
//       applicationStatus = 'approved';
//       canSubmitApplication = false;
//       nextSteps = [
//         'Welcome! You are now a full member',
//         'Access all member benefits and resources',
//         'Participate in member-exclusive activities'
//       ];
//     }

//     // Calculate progress percentage
//     let progressPercentage = 0;
//     switch (user.membership_stage) {
//       case 'none':
//         progressPercentage = 0;
//         break;
//       case 'applicant':
//         progressPercentage = 25;
//         break;
//       case 'pre_member':
//         progressPercentage = 50;
//         break;
//       case 'member':
//         progressPercentage = 100;
//         break;
//     }

//     const response = {
//       currentStatus: {
//         membership_stage: user.membership_stage || 'none',
//         initial_application_status: applicationStatus,
//         full_membership_application_status: fullApp?.approval_status || 'not_submitted',
//         is_member: user.is_member,
//         progressPercentage
//       },
//       applicationDetails: initialApp || null,
//       nextSteps,
//       canSubmitApplication,
//       timeline: {
//         registered: user.createdAt,
//         initialSubmitted: initialApp?.submitted_at || null,
//         initialReviewed: initialApp?.reviewed_at || null,
//         fullMembershipAccessed: user.membership_stage === 'member' ? user.createdAt : null,
//         fullMembershipSubmitted: fullApp?.submitted_at || null
//       }
//     };

//     console.log('✅ Sending checkApplicationStatus response:', response);
//     return successResponse(res, response);

//   } catch (error) {
//     console.error('❌ checkApplicationStatus error:', error);
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * FIXED: Submit initial application with enhanced validation
//  */
// // export const submitInitialApplication = async (req, res) => {
// //   try {
// //     console.log('🎯 submitInitialApplication called!');
// //     console.log('📝 Request body:', req.body);
// //     console.log('👤 User:', req.user);

// //     const { answers, applicationTicket } = req.body;
// //     const userId = req.user.id || req.user.user_id;

// //     console.log('🔍 Extracted userId:', userId);

// //     // Validation
// //     if (!answers || !Array.isArray(answers) || answers.length === 0) {
// //       console.error('❌ Invalid answers provided');
// //       throw new CustomError('Application answers are required', 400);
// //     }

// //     if (!userId) {
// //       console.error('❌ No user ID found');
// //       throw new CustomError('User authentication required', 401);
// //     }

// //     // Get current user
// //     const user = await getUserById(userId);
    
// //     console.log('✅ User found:', user);

// //     // Check if user can submit application
// //     if (user.membership_stage !== 'none' && user.membership_stage !== 'applicant') {
// //       throw new CustomError('Cannot submit application in current membership stage', 400);
// //     }

// //     // Check for existing applications
// //     const [existingApplications] = await db.query(`
// //       SELECT approval_status 
// //       FROM surveylog 
// //       WHERE CAST(user_id AS UNSIGNED) = ? 
// //         AND application_type = 'initial_application'
// //       ORDER BY createdAt DESC
// //       LIMIT 1
// //     `, [userId]);

// //     if (existingApplications.length > 0) {
// //       const existing = existingApplications[0];
// //       if (existing.approval_status === 'pending') {
// //         throw new CustomError('You already have a pending application', 400);
// //       }
// //       if (existing.approval_status === 'approved') {
// //         throw new CustomError('You already have an approved application', 400);
// //       }
// //     }

// //     await db.beginTransaction();

// //     try {
// //       // Generate ticket if not provided
// //       const finalTicket = applicationTicket || generateApplicationTicket(user.username, user.email);

// //       console.log('📋 Inserting application with ticket:', finalTicket);

// //       // Insert survey response
// //       const [insertResult] = await db.query(
// //         `INSERT INTO surveylog (user_id, answers, application_type, approval_status, application_ticket, createdAt) 
// //          VALUES (?, ?, 'initial_application', 'pending', ?, NOW())`,
// //         [userId.toString(), JSON.stringify(answers), finalTicket]
// //       );

// //       console.log('✅ Application inserted with ID:', insertResult.insertId);

// //       // Update user status to applicant
// //       await db.query(
// //         'UPDATE users SET membership_stage = ?, is_member = ?, application_ticket = ? WHERE id = ?',
// //         ['applicant', 'pending', finalTicket, userId]
// //       );

// //       console.log('✅ User status updated');

// //       await db.commit();

// //       // Send confirmation email (non-blocking)
// //       try {
// //         await sendEmail(user.email, 'initial_application_submitted', {
// //           USERNAME: user.username,
// //           APPLICATION_TICKET: finalTicket,
// //           SUBMISSION_DATE: new Date().toLocaleDateString()
// //         });
// //         console.log('📧 Confirmation email sent');
// //       } catch (emailError) {
// //         console.error('📧 Confirmation email failed:', emailError);
// //       }

// //       const response = {
// //         success: true,
// //         applicationTicket: finalTicket,
// //         nextSteps: [
// //           'Your application is now under review',
// //           'You will receive an email notification within 3-5 business days',
// //           'Check your dashboard for status updates'
// //         ]
// //       };

// //       console.log('✅ Sending success response:', response);
// //       return successResponse(res, response, 'Application submitted successfully', 201);

// //     } catch (error) {
// //       await db.rollback();
// //       throw error;
// //     }

// //   } catch (error) {
// //     console.error('❌ submitInitialApplication error:', error);
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };




// // export const submitInitialApplication = async (req, res) => {
// //   try {
// //     console.log('🎯 submitInitialApplication called!');
// //     console.log('📝 Request body:', req.body);
// //     console.log('👤 User:', req.user);

// //     const { answers, applicationTicket } = req.body;
// //     const userId = req.user.id || req.user.user_id;

// //     console.log('🔍 Extracted userId:', userId);

// //     // Validation
// //     if (!answers || !Array.isArray(answers) || answers.length === 0) {
// //       console.error('❌ Invalid answers provided');
// //       throw new CustomError('Application answers are required', 400);
// //     }

// //     if (!userId) {
// //       console.error('❌ No user ID found');
// //       throw new CustomError('User authentication required', 401);
// //     }

// //     // Get current user with direct query
// //     console.log('🔍 Getting user from database...');
// //     const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
// //     console.log('🔍 User query result:', result);
    
// //     let user;
// //     if (Array.isArray(result) && result.length > 0) {
// //       if (Array.isArray(result[0]) && result[0].length > 0) {
// //         user = result[0][0]; // MySQL2 format
// //       } else if (result[0] && typeof result[0] === 'object') {
// //         user = result[0]; // Direct format
// //       }
// //     }
    
// //     console.log('✅ User found:', user);

// //     if (!user) {
// //       throw new CustomError('User not found', 404);
// //     }

// //     // Check if user can submit application
// //     if (user.membership_stage !== 'none' && user.membership_stage !== 'applicant' && !user.membership_stage) {
// //       console.log('🔧 User membership_stage is:', user.membership_stage, '- allowing application');
// //       // Allow submission for users without a membership_stage set
// //     }

// //     // Check for existing applications
// //     const [existingApplications] = await db.query(`
// //       SELECT approval_status 
// //       FROM surveylog 
// //       WHERE CAST(user_id AS UNSIGNED) = ? 
// //         AND application_type = 'initial_application'
// //       ORDER BY createdAt DESC
// //       LIMIT 1
// //     `, [userId]);

// //     if (existingApplications.length > 0) {
// //       const existing = existingApplications[0];
// //       if (existing.approval_status === 'pending') {
// //         throw new CustomError('You already have a pending application', 400);
// //       }
// //       if (existing.approval_status === 'approved') {
// //         throw new CustomError('You already have an approved application', 400);
// //       }
// //     }

// //     await db.beginTransaction();

// //     try {
// //       // Generate ticket if not provided
// //       const timestamp = Date.now().toString(36);
// //       const random = Math.random().toString(36).substr(2, 5);
// //       const finalTicket = applicationTicket || `APP-${user.username.substr(0, 3).toUpperCase()}-${timestamp}-${random}`.toUpperCase();

// //       console.log('📋 Inserting application with ticket:', finalTicket);

// //       // Insert survey response
// //       const [insertResult] = await db.query(
// //         `INSERT INTO surveylog (user_id, answers, application_type, approval_status, application_ticket, createdAt) 
// //          VALUES (?, ?, 'initial_application', 'pending', ?, NOW())`,
// //         [userId.toString(), JSON.stringify(answers), finalTicket]
// //       );

// //       console.log('✅ Application inserted with ID:', insertResult.insertId);

// //       // Update user status to applicant
// //       await db.query(
// //         'UPDATE users SET membership_stage = ?, is_member = ?, application_ticket = ? WHERE id = ?',
// //         ['applicant', 'pending', finalTicket, userId]
// //       );

// //       console.log('✅ User status updated');

// //       await db.commit();

// //       const response = {
// //         success: true,
// //         message: 'Application submitted successfully',
// //         applicationTicket: finalTicket,
// //         nextSteps: [
// //           'Your application is now under review',
// //           'You will receive an email notification within 3-5 business days',
// //           'Check your dashboard for status updates'
// //         ]
// //       };

// //       console.log('✅ Sending success response:', response);
// //       return res.status(201).json(response);

// //     } catch (error) {
// //       await db.rollback();
// //       throw error;
// //     }

// //   } catch (error) {
// //     console.error('❌ submitInitialApplication error:', error);
// //     return res.status(500).json({
// //       success: false,
// //       error: error.message || 'An error occurred',
// //       details: process.env.NODE_ENV === 'development' ? error.stack : undefined
// //     });
// //   }
// // };

// // async function submitInitialApplication(req, res) {
// //   try {
// //     console.log('🎯 submitInitialApplication called!');
// //     console.log('📝 Request body:', req.body);

// //     const { answers, applicationTicket } = req.body;
// //     const user = req.user;
    
// //     console.log('👤 User:', user);
    
// //     if (!user || !user.id) {
// //       return res.status(401).json({ error: 'User not authenticated' });
// //     }

// //     const userId = user.id;
// //     console.log('🔍 Extracted userId:', userId);

// //     const result = await db.transaction(async (connection) => {
// //       // Get user details
// //       const [userRows] = await connection.execute(
// //         'SELECT * FROM users WHERE id = ?',
// //         [userId]
// //       );

// //       if (userRows.length === 0) {
// //         throw new Error('User not found');
// //       }

// //       const userData = userRows[0];
// //       console.log('✅ User found:', userData);

// //       // Insert application
// //       const insertQuery = `
// //         INSERT INTO applications (
// //           user_id, application_type, answers, application_ticket,
// //           approval_status, submitted_at
// //         ) VALUES (?, ?, ?, ?, ?, NOW())
// //       `;

// //       const [insertResult] = await connection.execute(insertQuery, [
// //         userId,
// //         'initial_application',
// //         JSON.stringify(answers),
// //         applicationTicket,
// //         'pending'
// //       ]);

// //       // Update user record
// //       const updateQuery = `
// //         UPDATE users 
// //         SET application_ticket = ?, membership_stage = ?
// //         WHERE id = ?
// //       `;

// //       await connection.execute(updateQuery, [
// //         applicationTicket,
// //         'application_submitted',
// //         userId
// //       ]);

// //       return {
// //         applicationId: insertResult.insertId,
// //         applicationTicket,
// //         userId
// //       };
// //     });

// //     console.log('✅ Application submitted successfully:', result);
    
// //     res.json({
// //       success: true,
// //       message: 'Application submitted successfully',
// //       data: result
// //     });

// //   } catch (error) {
// //     console.error('❌ submitInitialApplication error:', error);
// //     res.status(500).json({ 
// //       error: 'Failed to submit application',
// //       details: error.message 
// //     });
// //   }
// // }

// export async function submitInitialApplication(req, res) {
//   try {
//     console.log('🎯 submitInitialApplication called!');
//     console.log('📝 Request body:', req.body);

//     const { answers, applicationTicket } = req.body;
//     const user = req.user;
    
//     console.log('👤 User:', user);
    
//     if (!user || !user.id) {
//       return res.status(401).json({ error: 'User not authenticated' });
//     }

//     const userId = user.id;
//     console.log('🔍 Extracted userId:', userId);

//     const result = await db.transaction(async (connection) => {
//       // Get user details
//       const [userRows] = await connection.execute(
//         'SELECT * FROM users WHERE id = ?',
//         [userId]
//       );

//       if (userRows.length === 0) {
//         throw new Error('User not found');
//       }

//       const userData = userRows[0];
//       console.log('✅ User found:', userData);

//       // Insert application
//       const insertQuery = `
//         INSERT INTO applications (
//           user_id, application_type, answers, application_ticket,
//           approval_status, submitted_at
//         ) VALUES (?, ?, ?, ?, ?, NOW())
//       `;

//       const [insertResult] = await connection.execute(insertQuery, [
//         userId,
//         'initial_application',
//         JSON.stringify(answers),
//         applicationTicket,
//         'pending'
//       ]);

//       // Update user record
//       const updateQuery = `
//         UPDATE users 
//         SET application_ticket = ?, membership_stage = ?
//         WHERE id = ?
//       `;

//       await connection.execute(updateQuery, [
//         applicationTicket,
//         'application_submitted',
//         userId
//       ]);

//       return {
//         applicationId: insertResult.insertId,
//         applicationTicket,
//         userId
//       };
//     });

//     console.log('✅ Application submitted successfully:', result);
    
//     res.json({
//       success: true,
//       message: 'Application submitted successfully',
//       data: result
//     });

//   } catch (error) {
//     console.error('❌ submitInitialApplication error:', error);
//     res.status(500).json({ 
//       error: 'Failed to submit application',
//       details: error.message 
//     });
//   }
// }


// /**
//  * Get application history for user
//  */
// export const getApplicationHistory = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user.user_id;
    
//     // Get application history
//     const [history] = await db.query(`
//       SELECT 
//         sl.application_type,
//         sl.approval_status,
//         sl.createdAt as submitted_at,
//         sl.reviewed_at,
//         sl.admin_notes,
//         reviewer.username as reviewed_by,
//         sl.application_ticket as ticket
//       FROM surveylog sl
//       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
//       WHERE CAST(sl.user_id AS UNSIGNED) = ?
//       ORDER BY sl.createdAt DESC
//     `, [userId]);

//     // Get review history if available
//     const [reviews] = await db.query(`
//       SELECT 
//         mrh.application_type,
//         mrh.previous_status,
//         mrh.new_status,
//         mrh.review_notes,
//         mrh.action_taken,
//         mrh.reviewed_at,
//         reviewer.username as reviewer_name
//       FROM membership_review_history mrh
//       LEFT JOIN users reviewer ON mrh.reviewer_id = reviewer.id
//       WHERE mrh.user_id = ?
//       ORDER BY mrh.reviewed_at DESC
//     `, [userId]);

//     return successResponse(res, {
//       applications: history,
//       reviews
//     });
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Get user's current membership stage and permissions
//  */
// export const getUserPermissions = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user.user_id;
    
//     const user = await getUserById(userId);
    
//     // Define permissions based on membership stage and role
//     const permissions = {
//       canAccessTowncrier: ['pre_member', 'member'].includes(user.membership_stage) || ['admin', 'super_admin'].includes(user.role),
//       canAccessIko: user.membership_stage === 'member' || ['admin', 'super_admin'].includes(user.role),
//       canSubmitInitialApplication: user.membership_stage === 'none' || (user.membership_stage === 'applicant' && user.is_member === 'rejected'),
//       canSubmitFullMembershipApplication: user.membership_stage === 'pre_member',
//       canAccessAdmin: ['admin', 'super_admin'].includes(user.role),
//       canManageUsers: user.role === 'super_admin',
//       canReviewApplications: ['admin', 'super_admin'].includes(user.role)
//     };
    
//     return successResponse(res, {
//       user: {
//         id: user.id,
//         username: user.username,
//         email: user.email,
//         membership_stage: user.membership_stage,
//         is_member: user.is_member,
//         role: user.role
//       },
//       permissions
//     });
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Get full membership status and eligibility
//  */
// export const getFullMembershipStatus = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user.user_id;
    
//     const user = await getUserById(userId);
    
//     // Get full membership application details if exists
//     const [fullMembershipApps] = await db.query(`
//       SELECT 
//         sl.answers,
//         sl.approval_status,
//         sl.createdAt as submitted_at,
//         sl.reviewed_at,
//         sl.admin_notes,
//         reviewer.username as reviewed_by
//       FROM surveylog sl
//       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
//       WHERE CAST(sl.user_id AS UNSIGNED) = ? AND sl.application_type = 'full_membership'
//       ORDER BY sl.createdAt DESC
//       LIMIT 1
//     `, [userId]);
    
//     // Check eligibility for full membership
//     const isEligible = user.membership_stage === 'pre_member';
//     const currentApp = fullMembershipApps[0] || null;
    
//     // Get requirements and benefits
//     const requirements = [
//       'Completed initial membership application',
//       'Active participation for at least 30 days',
//       'Attended at least 2 community events',
//       'Good standing with community guidelines'
//     ];
    
//     const benefits = [
//       'Access to exclusive member events',
//       'Voting rights in community decisions',
//       'Advanced class access',
//       'Mentorship opportunities',
//       'Priority support'
//     ];
    
//     return successResponse(res, {
//       currentStatus: {
//         membership_stage: user.membership_stage,
//         is_member: user.is_member,
//         full_membership_application_status: currentApp?.approval_status || 'not_submitted'
//       },
//       fullMembershipApplication: currentApp,
//       eligibility: {
//         isEligible,
//         canApply: isEligible && (!currentApp || currentApp.approval_status === 'rejected'),
//         requirements,
//         benefits
//       },
//       nextSteps: isEligible ? [
//         'Review full membership benefits',
//         'Complete full membership application',
//         'Submit required documentation'
//       ] : [
//         'Complete initial membership process first'
//       ]
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Submit full membership application
//  */
// // export const submitFullMembershipApplication = async (req, res) => {
// //   try {
// //     const { answers, additionalDocuments } = req.body;
// //     const userId = req.user.id || req.user.user_id;
    
// //     // Validate input
// //     if (!answers || !Array.isArray(answers) || answers.length === 0) {
// //       throw new CustomError('Application answers are required', 400);
// //     }
    
// //     const user = await getUserById(userId);
    
// //     // Check eligibility
// //     if (user.membership_stage !== 'pre_member') {
// //       throw new CustomError('Not eligible for full membership application', 403);
// //     }
    
// //     // Check for existing application
// //     const [existingApps] = await db.query(`
// //       SELECT approval_status FROM surveylog 
// //       WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = 'full_membership'
// //       ORDER BY createdAt DESC LIMIT 1
// //     `, [userId]);
    
// //     if (existingApps.length > 0 && existingApps[0].approval_status === 'pending') {
// //       throw new CustomError('Full membership application already submitted', 400);
// //     }
    
// //     await db.beginTransaction();
    
// //     try {
// //       // Generate application ticket
// //       const applicationTicket = generateApplicationTicket(user.username, user.email, 'FULL');
      
// //       // Submit application
// //       await db.query(`
// //         INSERT INTO surveylog (
// //           user_id, 
// //           answers, 
// //           application_type, 
// //           approval_status, 
// //           application_ticket,
// //           additional_data,
// //           createdAt
// //         ) VALUES (?, ?, 'full_membership', 'pending', ?, ?, NOW())
// //       `, [
// //         userId.toString(), 
// //         JSON.stringify(answers), 
// //         applicationTicket,
// //         JSON.stringify({ additionalDocuments: additionalDocuments || [] })
// //       ]);
      
// //       await db.commit();
      
// //       // Send confirmation email
// //       try {
// //         await sendEmail(user.email, 'full_membership_application_submitted', {
// //           USERNAME: user.username,
// //           APPLICATION_TICKET: applicationTicket,
// //           SUBMISSION_DATE: new Date().toLocaleDateString()
// //         });
// //       } catch (emailError) {
// //         console.error('Confirmation email failed:', emailError);
// //       }
      
// //       return successResponse(res, {
// //         applicationTicket,
// //         nextSteps: [
// //           'Your application is now under review',
// //           'Review process typically takes 5-7 business days',
// //           'You will receive email notification once reviewed',
// //           'Continue participating in community activities'
// //         ]
// //       }, 'Full membership application submitted successfully', 201);
      
// //     } catch (error) {
// //       await db.rollback();
// //       throw error;
// //     }
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// export const submitFullMembershipApplication = async (req, res) => {
//   try {
//     const { answers, additionalDocuments } = req.body;
//     const userId = req.user.id || req.user.user_id;
        
//     // Validate input
//     if (!answers || !Array.isArray(answers) || answers.length === 0) {
//       throw new CustomError('Application answers are required', 400);
//     }
        
//     const user = await getUserById(userId);
        
//     // Check eligibility
//     if (user.membership_stage !== 'pre_member') {
//       throw new CustomError('Not eligible for full membership application', 403);
//     }
        
//     // Check for existing application
//     const [existingApps] = await db.query(`
//       SELECT approval_status FROM surveylog 
//       WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = 'full_membership'
//       ORDER BY createdAt DESC LIMIT 1
//     `, [userId]);
        
//     if (existingApps.length > 0 && existingApps[0].approval_status === 'pending') {
//       throw new CustomError('Full membership application already submitted', 400);
//     }
        
//     const result = await db.transaction(async (connection) => {
//       // Generate application ticket
//       const applicationTicket = generateApplicationTicket(user.username, user.email, 'FULL');
            
//       // Submit application
//       await connection.execute(`
//         INSERT INTO surveylog (
//           user_id, 
//           answers, 
//           application_type, 
//           approval_status, 
//           application_ticket,
//           additional_data,
//           createdAt
//         ) VALUES (?, ?, 'full_membership', 'pending', ?, ?, NOW())
//       `, [
//         userId.toString(), 
//         JSON.stringify(answers), 
//         applicationTicket,
//         JSON.stringify({ additionalDocuments: additionalDocuments || [] })
//       ]);
            
//       return { applicationTicket };
//     });
        
//     // Send confirmation email
//     try {
//       await sendEmail(user.email, 'full_membership_application_submitted', {
//         USERNAME: user.username,
//         APPLICATION_TICKET: result.applicationTicket,
//         SUBMISSION_DATE: new Date().toLocaleDateString()
//       });
//     } catch (emailError) {
//       console.error('Confirmation email failed:', emailError);
//     }
        
//     return successResponse(res, {
//       applicationTicket: result.applicationTicket,
//       nextSteps: [
//         'Your application is now under review',
//         'Review process typically takes 5-7 business days',
//         'You will receive email notification once reviewed',
//         'Continue participating in community activities'
//       ]
//     }, 'Full membership application submitted successfully', 201);
        
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };


// /**
//  * Log full membership access
//  */
// export const logFullMembershipAccess = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user.user_id;
    
//     // Insert or update access log
//     await db.query(`
//       INSERT INTO full_membership_access (user_id, first_accessed_at, last_accessed_at, access_count)
//       VALUES (?, NOW(), NOW(), 1)
//       ON DUPLICATE KEY UPDATE 
//         last_accessed_at = NOW(),
//         access_count = access_count + 1
//     `, [userId]);
    
//     // Get updated access info
//     const [accessInfo] = await db.query(`
//       SELECT first_accessed_at, last_accessed_at, access_count
//       FROM full_membership_access
//       WHERE user_id = ?
//     `, [userId]);
    
//     return successResponse(res, {
//       accessInfo: accessInfo[0] || null
//     }, 'Access logged successfully');
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// // ==================================================
// // ADMIN FUNCTIONS (ESSENTIAL ONES)
// // ==================================================

// /**
//  * Get pending applications with advanced filtering
//  */
// export const getPendingApplications = async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 20, 
//       status = 'pending', 
//       stage = 'initial',
//       sortBy = 'submitted_at',
//       sortOrder = 'ASC',
//       search = ''
//     } = req.query;
    
//     const offset = (page - 1) * limit;
//     const applicationType = stage === 'initial' ? 'initial_application' : 'full_membership';
    
//     // Build search conditions
//     let searchClause = '';
//     let searchParams = [];
    
//     if (search) {
//       searchClause = 'AND (u.username LIKE ? OR u.email LIKE ?)';
//       searchParams = [`%${search}%`, `%${search}%`];
//     }
    
//     // Get applications with user details
//     const [applications] = await db.query(`
//       SELECT 
//         u.id as user_id,
//         u.username,
//         u.email,
//         u.phone,
//         u.membership_stage,
//         sl.id as application_id,
//         sl.answers,
//         sl.createdAt as submitted_at,
//         sl.application_ticket,
//         sl.additional_data,
//         DATEDIFF(NOW(), sl.createdAt) as days_pending,
//         fma.first_accessed_at,
//         fma.access_count
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
//       WHERE sl.approval_status = ? 
//         AND sl.application_type = ?
//         ${searchClause}
//       ORDER BY ${sortBy} ${sortOrder}
//       LIMIT ? OFFSET ?
//     `, [status, applicationType, ...searchParams, parseInt(limit), offset]);

//     // Get total count for pagination
//     const [countResult] = await db.query(`
//       SELECT COUNT(*) as total
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       WHERE sl.approval_status = ? 
//         AND sl.application_type = ?
//         ${searchClause}
//     `, [status, applicationType, ...searchParams]);

//     return successResponse(res, {
//       applications,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: countResult[0].total,
//         totalPages: Math.ceil(countResult[0].total / limit)
//       },
//       filters: { status, stage, sortBy, sortOrder, search }
//     });
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Update application status (Admin)
//  */
// // export const updateApplicationStatus = async (req, res) => {
// //   try {
// //     const { userId } = req.params;
// //     const { status, adminNotes, notifyUser = true, applicationType = 'initial_application' } = req.body;
// //     const reviewerId = req.user.user_id || req.user.id;
    
// //     if (!['approved', 'rejected', 'pending'].includes(status)) {
// //       throw new CustomError('Invalid status', 400);
// //     }
    
// //     // Validate stage transition
// //     const user = await getUserById(userId);
// //     let newStage = user.membership_stage;
// //     let memberStatus = user.is_member;
    
// //     if (applicationType === 'initial_application') {
// //       if (status === 'approved') {
// //         newStage = 'pre_member';
// //         memberStatus = 'granted';
// //       } else if (status === 'rejected') {
// //         newStage = 'applicant';
// //         memberStatus = 'rejected';
// //       }
// //     } else if (applicationType === 'full_membership') {
// //       if (status === 'approved') {
// //         newStage = 'member';
// //         memberStatus = 'active';
// //       }
// //     }
    
// //     // Validate transition
// //     if (!validateStageTransition(user.membership_stage, newStage)) {
// //       throw new CustomError('Invalid membership stage transition', 400);
// //     }
    
// //     await db.beginTransaction();
    
// //     try {
// //       // Update surveylog
// //       await db.query(`
// //         UPDATE surveylog 
// //         SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
// //         WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
// //         ORDER BY createdAt DESC LIMIT 1
// //       `, [status, adminNotes, reviewerId, userId, applicationType]);
      
// //       // Update user status
// //       await db.query(`
// //         UPDATE users 
// //         SET membership_stage = ?, is_member = ?
// //         WHERE id = ?
// //       `, [newStage, memberStatus, userId]);
      
// //       // Log the review action
// //       await db.query(`
// //         INSERT INTO membership_review_history 
// //         (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
// //         VALUES (?, ?, ?, ?, ?, ?, NOW())
// //       `, [userId, applicationType, 'pending', status, adminNotes, reviewerId]);
      
// //       await db.commit();
      
// //       // Send notification if requested
// //       if (notifyUser) {
// //         try {
// //           const emailTemplate = status === 'approved' ? 
// //             `${applicationType}_approved` : `${applicationType}_rejected`;
          
// //           await sendEmail(user.email, emailTemplate, {
// //             USERNAME: user.username,
// //             ADMIN_NOTES: adminNotes || '',
// //             REVIEW_DATE: new Date().toLocaleDateString()
// //           });
// //         } catch (emailError) {
// //           console.error('Notification email failed:', emailError);
// //         }
// //       }
      
// //       return successResponse(res, {
// //         newStatus: {
// //           membership_stage: newStage,
// //           approval_status: status,
// //           is_member: memberStatus
// //         }
// //       }, `Application ${status} successfully`);
      
// //     } catch (error) {
// //       await db.rollback();
// //       throw error;
// //     }
    
// //   } catch (error) {
// //     return errorResponse(res, error, error.statusCode || 500);
// //   }
// // };

// // ==================================================
// // ANALYTICS & SYSTEM FUNCTIONS (ESSENTIAL)
// // ==================================================




// /**
//  * Get membership analytics
//  */
// export const getMembershipAnalytics = async (req, res) => {
//   try {
//     const { period = '30d', detailed = false } = req.query;
    
//     // Get basic membership statistics
//     const [membershipStats] = await db.query(`
//       SELECT 
//         COUNT(*) as total_users,
//         COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as total_applicants,
//         COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as total_pre_members,
//         COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as total_members,
//         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month,
//         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week
//       FROM users
//     `);
    
//     // Get conversion funnel data
//     const [funnelData] = await db.query(`
//       SELECT 
//         COUNT(*) as total_registrations,
//         COUNT(CASE WHEN membership_stage != 'none' THEN 1 END) as started_application,
//         COUNT(CASE WHEN membership_stage = 'pre_member' OR membership_stage = 'member' THEN 1 END) as approved_initial,
//         COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members
//       FROM users
//     `);
    
//     return successResponse(res, {
//       overview: membershipStats[0],
//       conversionFunnel: funnelData[0]
//     });
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Get membership overview for admin dashboard
//  */
// export const getMembershipOverview = async (req, res) => {
//   try {
//     // Get comprehensive overview data
//     const [overview] = await db.query(`
//       SELECT 
//         u.id,
//         u.username,
//         u.email,
//         u.membership_stage,
//         u.is_member,
//         u.role,
//         u.createdAt as user_created
//       FROM users u
//       ORDER BY u.createdAt DESC
//       LIMIT 100
//     `);
    
//     // Get summary statistics
//     const [summary] = await db.query(`
//       SELECT 
//         COUNT(*) as total_users,
//         COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as applicants,
//         COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as pre_members,
//         COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members,
//         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month,
//         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week
//       FROM users
//     `);
    
//     return successResponse(res, {
//       overview,
//       summary: summary[0]
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Get detailed membership statistics
//  */
// export const getMembershipStats = async (req, res) => {
//   try {
//     // Get comprehensive statistics
//     const [membershipStats] = await db.query(`
//       SELECT 
//         COUNT(*) as total_users,
//         COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as total_applicants,
//         COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as total_pre_members,
//         COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as total_members,
        
//         -- Application stats
//         (SELECT COUNT(*) FROM surveylog WHERE application_type = 'initial_application') as submitted_initial_applications,
//         (SELECT COUNT(*) FROM surveylog WHERE application_type = 'initial_application' AND approval_status = 'pending') as pending_initial_applications,
//         (SELECT COUNT(*) FROM surveylog WHERE application_type = 'full_membership') as submitted_full_applications,
//         (SELECT COUNT(*) FROM surveylog WHERE application_type = 'full_membership' AND approval_status = 'pending') as pending_full_applications
        
//       FROM users
//     `);
    
//     return successResponse(res, {
//       membershipStats: membershipStats[0]
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Health check endpoint for membership system
//  */
// export const healthCheck = async (req, res) => {
//   try {
//     // Check database connectivity
//     await db.query('SELECT 1 as health_check');
    
//     // Get basic system stats
//     const [stats] = await db.query(`
//       SELECT 
//         COUNT(*) as total_users,
//         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as new_users_24h,
//         (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_applications
//       FROM users
//     `);
    
//     return successResponse(res, {
//       status: 'healthy',
//       timestamp: new Date().toISOString(),
//       stats: stats[0],
//       version: '2.0.0'
//     });
    
//   } catch (error) {
//     return res.status(503).json({
//       success: false,
//       status: 'unhealthy',
//       error: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// };

// /**
//  * Get system configuration (Admin only)
//  */
// export const getSystemConfig = async (req, res) => {
//   try {
//     const userRole = req.user.role;
    
//     if (!['admin', 'super_admin'].includes(userRole)) {
//       throw new CustomError('Insufficient permissions', 403);
//     }
    
//     // Get various system configurations
//     const config = {
//       membershipStages: ['none', 'applicant', 'pre_member', 'member'],
//       memberStatuses: ['pending', 'granted', 'rejected', 'active'],
//       userRoles: ['user', 'admin', 'super_admin'],
//       applicationTypes: ['initial_application', 'full_membership'],
//       approvalStatuses: ['not_submitted', 'pending', 'approved', 'rejected'],
//       notificationTypes: ['email', 'sms', 'both'],
//       systemLimits: {
//         maxBulkOperations: 100,
//         maxExportRecords: 10000,
//         sessionTimeout: '7d',
//         verificationCodeExpiry: '10m'
//       },
//       features: {
//         emailNotifications: true,
//         smsNotifications: true,
//         bulkOperations: true,
//         dataExport: true,
//         analytics: true
//       }
//     };
    
//     return successResponse(res, { config });
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// // ==================================================
// // MIDDLEWARE HELPERS
// // ==================================================

// /**
//  * Validate request parameters
//  */
// export const validateRequest = (requiredFields) => {
//   return (req, res, next) => {
//     const missingFields = requiredFields.filter(field => !req.body[field]);
    
//     if (missingFields.length > 0) {
//       return errorResponse(res, 
//         new CustomError(`Missing required fields: ${missingFields.join(', ')}`, 400), 
//         400
//       );
//     }
    
//     next();
//   };
// };

// /**
//  * Validate admin permissions
//  */
// export const requireAdmin = (req, res, next) => {
//   const userRole = req.user?.role;
  
//   if (!['admin', 'super_admin'].includes(userRole)) {
//     return errorResponse(res, 
//       new CustomError('Administrative privileges required', 403), 
//       403
//     );
//   }
  
//   next();
// };

// /**
//  * Validate super admin permissions
//  */
// export const requireSuperAdmin = (req, res, next) => {
//   const userRole = req.user?.role;
  
//   if (userRole !== 'super_admin') {
//     return errorResponse(res, 
//       new CustomError('Super administrative privileges required', 403), 
//       403
//     );
//   }
  
//   next();
// };

// // ==================================================
// // PLACEHOLDER FUNCTIONS FOR MISSING ROUTES
// // ==================================================

// // Add placeholder functions for any missing routes
// export const bulkApproveApplications = async (req, res) => {
//   return successResponse(res, { message: 'Bulk approve functionality - implement as needed' });
// };

// export const getPendingFullMemberships = async (req, res) => {
//   return successResponse(res, { applications: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
// };

// export const updateFullMembershipStatus = async (req, res) => {
//   return successResponse(res, { message: 'Full membership status updated' });
// };

// export const exportMembershipData = async (req, res) => {
//   return successResponse(res, { data: [], exportedAt: new Date().toISOString(), totalRecords: 0 });
// };

// export const sendNotification = async (req, res) => {
//   return successResponse(res, { message: 'Notification sent' });
// };

// export const sendMembershipNotification = async (req, res) => {
//   return successResponse(res, { message: 'Membership notification sent' });
//  };

// // Default export with all functions
//  export default {
//   // Authentication & Registration
//   enhancedLogin,
//   sendVerificationCode,
//   registerWithVerification,
  
//   // User Dashboard & Status
//   getUserDashboard,
//   checkApplicationStatus,
//   getApplicationHistory,
//   getUserPermissions,
  
//   // Application Management
//   submitInitialApplication,
//   getFullMembershipStatus,
//   submitFullMembershipApplication,
//   logFullMembershipAccess,
  
//   // Admin Functions
//   getPendingApplications,
//   updateApplicationStatus,
//   bulkApproveApplications,
//   getPendingFullMemberships,
//   updateFullMembershipStatus,
  
//   // Analytics & Reporting
//   getMembershipAnalytics,
//   getMembershipOverview,
//   getMembershipStats,
//   exportMembershipData,
  
//   // Notifications
//   sendNotification,
//   sendMembershipNotification,
  
//   // System
//   healthCheck,
//   getSystemConfig,
  
//   // Middleware helpers
//   validateRequest,
//   requireAdmin,
//   requireSuperAdmin
// };

//new new new new nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn

// // ikootaapi/controllers/membershipControllers.js
// // ==================================================
// // Complete Membership Controllers Implementation
// // Part 1: Imports, Utilities, and Helper Functions
// // ==================================================

// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import db from '../config/db.js';
// import { sendEmail, sendSMS } from '../utils/notifications.js';
// import CustomError from '../utils/CustomError.js';

// // =============================================================================
// // UTILITY FUNCTIONS
// // =============================================================================

// /**
//  * Generate application ticket with consistent format
//  */
// const generateApplicationTicket = (username, email, type = 'INITIAL') => {
//   const timestamp = Date.now().toString(36);
//   const random = Math.random().toString(36).substr(2, 5);
//   const prefix = type === 'FULL' ? 'FMA' : 'APP';
//   return `${prefix}-${username.substr(0, 3).toUpperCase()}-${timestamp}-${random}`.toUpperCase();
// };

// /**
//  * Standardized database query executor with proper error handling
//  */
// const executeQuery = async (query, params = []) => {
//   try {
//     const [results] = await db.query(query, params);
//     return results;
//   } catch (error) {
//     console.error('Database query error:', error);
//     console.error('Query:', query);
//     console.error('Params:', params);
//     throw new CustomError('Database operation failed', 500);
//   }
// };

// /**
//  * Get user by ID with error handling
//  */
// const getUserById = async (userId) => {
//   const users = await executeQuery(
//     'SELECT * FROM users WHERE id = ?',
//     [userId]
//   );
  
//   if (!users || users.length === 0) {
//     throw new CustomError('User not found', 404);
//   }
  
//   return users[0];
// };

// /**
//  * Validate membership stage transitions
//  */
// const validateStageTransition = (currentStage, newStage) => {
//   const validTransitions = {
//     'none': ['applicant'],
//     'applicant': ['pre_member', 'applicant'], // Can stay applicant if rejected
//     'pre_member': ['member'],
//     'member': ['member'] // Members stay members
//   };
  
//   return validTransitions[currentStage]?.includes(newStage) || false;
// };

// /**
//  * Helper function to convert data to CSV
//  */
// const convertToCSV = (data) => {
//   if (!data.length) return '';
  
//   const headers = Object.keys(data[0]).join(',');
//   const rows = data.map(row => 
//     Object.values(row).map(value => {
//       if (value === null || value === undefined) return '';
//       if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
//       if (value instanceof Date) return `"${value.toISOString()}"`;
//       return value;
//     }).join(',')
//   );
  
//   return [headers, ...rows].join('\n');
// };

// /**
//  * Standardized success response
//  */
// const successResponse = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
//   return res.status(statusCode).json({
//     success: true,
//     message,
//     ...data
//   });
// };

// /**
//  * Standardized error response
//  */
// const errorResponse = (res, error, statusCode = 500) => {
//   console.error('Error occurred:', error);
//   return res.status(statusCode).json({
//     success: false,
//     error: error.message || 'An error occurred',
//     details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//   });
// };


// // ==================================================
// // Part 2: AUTHENTICATION & REGISTRATION FUNCTIONS
// // ==================================================

// /**
//  * Enhanced login with comprehensive membership status
//  */
// export const enhancedLogin = async (req, res) => {
//   try {
//     const { identifier, password } = req.body;
    
//     if (!identifier || !password) {
//       throw new CustomError('Email/username and password are required', 400);
//     }
    
//     // Get user with membership information
//     const users = await executeQuery(`
//       SELECT u.*, 
//              COALESCE(sl.approval_status, 'not_submitted') as initial_application_status,
//              sl.createdAt as initial_application_date,
//              fma.first_accessed_at as full_membership_accessed,
//              CASE WHEN fma.user_id IS NOT NULL THEN 1 ELSE 0 END as has_accessed_full_membership
//       FROM users u
//       LEFT JOIN surveylog sl ON u.id = CAST(sl.user_id AS UNSIGNED) 
//         AND sl.application_type = 'initial_application'
//       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
//       WHERE u.email = ? OR u.username = ?
//       GROUP BY u.id
//     `, [identifier, identifier]);
    
//     if (!users || users.length === 0) {
//       throw new CustomError('Invalid credentials', 401);
//     }

//     const user = users[0];

//     // Verify password
//     const isValidPassword = await bcrypt.compare(password, user.password_hash);
//     if (!isValidPassword) {
//       throw new CustomError('Invalid credentials', 401);
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { 
//         user_id: user.id, 
//         username: user.username, 
//         email: user.email,
//         membership_stage: user.membership_stage,
//         is_member: user.is_member,
//         role: user.role
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     // Smart redirect logic
//     let redirectTo = '/';
    
//     if (user.role === 'admin' || user.role === 'super_admin') {
//       redirectTo = '/admin';
//     } else if (user.membership_stage === 'member' && user.is_member === 'active') {
//       redirectTo = '/iko';
//     } else if (user.membership_stage === 'pre_member') {
//       redirectTo = '/towncrier';
//     } else if (user.membership_stage === 'applicant') {
//       if (user.initial_application_status === 'not_submitted') {
//         redirectTo = '/application-survey';
//       } else if (user.initial_application_status === 'pending') {
//         redirectTo = '/pending-verification';
//       } else if (user.initial_application_status === 'approved') {
//         redirectTo = '/approved-verification';
//       }
//     } else {
//       redirectTo = '/dashboard';
//     }

//     return successResponse(res, {
//       token,
//       user: {
//         id: user.id,
//         username: user.username,
//         email: user.email,
//         membership_stage: user.membership_stage,
//         is_member: user.is_member,
//         role: user.role
//       },
//       redirectTo
//     }, 'Login successful');

//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Send verification code for registration
//  */
// export const sendVerificationCode = async (req, res) => {
//   try {
//     const { email, phone, type = 'email' } = req.body;
    
//     if (!email && !phone) {
//       throw new CustomError('Email or phone number is required', 400);
//     }
    
//     // Generate 6-digit verification code
//     const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
//     // Store verification code
//     await executeQuery(`
//       INSERT INTO verification_codes (email, phone, code, type, expires_at, created_at) 
//       VALUES (?, ?, ?, ?, ?, NOW())
//       ON DUPLICATE KEY UPDATE 
//         code = VALUES(code), 
//         expires_at = VALUES(expires_at), 
//         attempts = 0,
//         created_at = NOW()
//     `, [email || null, phone || null, verificationCode, type, expiresAt]);
    
//     // Send verification code
//     try {
//       if (type === 'email' && email) {
//         await sendEmail(email, 'verification_code', {
//           VERIFICATION_CODE: verificationCode,
//           EXPIRES_IN: '10 minutes'
//         });
//       } else if (type === 'sms' && phone) {
//         await sendSMS(phone, `Your Ikoota verification code is: ${verificationCode}. Valid for 10 minutes.`);
//       }
//     } catch (notificationError) {
//       console.error('Notification sending failed:', notificationError);
//       // Don't fail the entire request if notification fails
//     }
    
//     return successResponse(res, {
//       expiresIn: 600 // 10 minutes in seconds
//     }, `Verification code sent to ${type === 'email' ? email : phone}`);
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Register with verification
//  */
// export const registerWithVerification = async (req, res) => {
//   try {
//     const { 
//       username, 
//       email, 
//       password, 
//       phone, 
//       verificationCode, 
//       verificationType = 'email' 
//     } = req.body;
    
//     // Validate required fields
//     if (!username || !email || !password || !verificationCode) {
//       throw new CustomError('All fields are required', 400);
//     }
    
//     // Verify the verification code
//     const verificationTarget = verificationType === 'email' ? email : phone;
//     const verificationResults = await executeQuery(`
//       SELECT * FROM verification_codes 
//       WHERE ${verificationType === 'email' ? 'email' : 'phone'} = ? 
//         AND code = ? 
//         AND type = ? 
//         AND expires_at > NOW() 
//         AND attempts < 3
//     `, [verificationTarget, verificationCode, verificationType]);
    
//     if (!verificationResults || verificationResults.length === 0) {
//       throw new CustomError('Invalid or expired verification code', 400);
//     }
    
//     // Check if user already exists
//     const existingUsers = await executeQuery(
//       'SELECT id FROM users WHERE email = ? OR username = ?',
//       [email, username]
//     );
    
//     if (existingUsers && existingUsers.length > 0) {
//       throw new CustomError('User with this email or username already exists', 409);
//     }
    
//     await db.beginTransaction();
    
//     try {
//       // Hash password
//       const saltRounds = 12;
//       const passwordHash = await bcrypt.hash(password, saltRounds);
      
//       // Generate application ticket
//       const applicationTicket = generateApplicationTicket(username, email);
      
//       // Create user
//       const result = await executeQuery(`
//         INSERT INTO users (
//           username, 
//           email, 
//           password_hash, 
//           phone, 
//           membership_stage, 
//           is_member, 
//           application_ticket,
//           createdAt
//         ) VALUES (?, ?, ?, ?, 'none', 'pending', ?, NOW())
//       `, [username, email, passwordHash, phone || null, applicationTicket]);
      
//       const userId = result.insertId;
      
//       // Delete used verification code
//       await executeQuery(`
//         DELETE FROM verification_codes 
//         WHERE ${verificationType === 'email' ? 'email' : 'phone'} = ? AND code = ?
//       `, [verificationTarget, verificationCode]);
      
//       await db.commit();
      
//       // Generate JWT token
//       const token = jwt.sign(
//         { 
//           user_id: userId, 
//           username, 
//           email,
//           membership_stage: 'none',
//           is_member: 'pending',
//           role: 'user'
//         },
//         process.env.JWT_SECRET,
//         { expiresIn: '7d' }
//       );
      
//       // Send welcome email (non-blocking)
//       try {
//         await sendEmail(email, 'welcome_registration', {
//           USERNAME: username,
//           APPLICATION_TICKET: applicationTicket
//         });
//       } catch (emailError) {
//         console.error('Welcome email failed:', emailError);
//       }
      
//       return successResponse(res, {
//         token,
//         user: {
//           id: userId,
//           username,
//           email,
//           membership_stage: 'none',
//           application_ticket: applicationTicket
//         },
//         redirectTo: '/application-survey'
//       }, 'Registration successful', 201);
      
//     } catch (error) {
//       await db.rollback();
//       throw error;
//     }
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };



// // ==================================================
// // Part 3: USER DASHBOARD & STATUS FUNCTIONS
// // ==================================================

// /**
//  * Enhanced user dashboard with comprehensive data
//  */
// export const getUserDashboard = async (req, res) => {
//   try {
//     const userId = req.user.user_id || req.user.id;
//     const userRole = req.user.role;
    
//     if (!userId) {
//       throw new CustomError('User ID not found', 401);
//     }
    
//     // Get comprehensive user data
//     const user = await getUserById(userId);
    
//     // Handle empty is_member for admin users
//     let memberStatus = user.is_member;
//     if (!memberStatus || memberStatus === '' || memberStatus === null) {
//       if (userRole === 'admin' || userRole === 'super_admin') {
//         memberStatus = 'active';
//         // Update in database
//         await executeQuery(
//           'UPDATE users SET is_member = ? WHERE id = ?',
//           ['active', userId]
//         );
//       } else {
//         memberStatus = 'pending';
//       }
//     }
    
//     // Get application status
//     const applications = await executeQuery(`
//       SELECT 
//         application_type,
//         approval_status,
//         createdAt as submitted_at,
//         reviewed_at,
//         admin_notes
//       FROM surveylog 
//       WHERE CAST(user_id AS UNSIGNED) = ?
//       ORDER BY createdAt DESC
//     `, [userId]);
    
//     // Get recent activities (notifications, updates, etc.)
//     const recentActivities = await executeQuery(`
//       SELECT 
//         'application' as type,
//         'Application status updated' as message,
//         reviewed_at as date
//       FROM surveylog 
//       WHERE CAST(user_id AS UNSIGNED) = ? AND reviewed_at IS NOT NULL
//       ORDER BY reviewed_at DESC
//       LIMIT 5
//     `, [userId]);
    
//     // Create status object
//     const status = {
//       id: user.id,
//       username: user.username,
//       email: user.email,
//       role: user.role,
//       membership_stage: user.membership_stage || 'none',
//       is_member: memberStatus,
//       initial_application_status: applications.find(app => app.application_type === 'initial_application')?.approval_status || 'not_submitted',
//       full_membership_application_status: applications.find(app => app.application_type === 'full_membership')?.approval_status || 'not_submitted',
//       has_accessed_full_membership: user.membership_stage === 'member',
//       user_created: user.createdAt
//     };
    
//     // Define quick actions based on user status
//     const quickActions = [];
    
//     if (user.role === 'admin' || user.role === 'super_admin') {
//       quickActions.push(
//         { type: 'primary', text: 'Admin Panel', link: '/admin' },
//         { type: 'info', text: 'User Management', link: '/admin/users' },
//         { type: 'success', text: 'Applications', link: '/admin/applications' }
//       );
//     } else {
//       quickActions.push({ type: 'primary', text: 'View Profile', link: '/profile' });
      
//       if (user.membership_stage === 'member') {
//         quickActions.push({ type: 'success', text: 'Iko Chat', link: '/iko' });
//       } else if (user.membership_stage === 'pre_member') {
//         quickActions.push({ type: 'info', text: 'Towncrier', link: '/towncrier' });
//         quickActions.push({ type: 'warning', text: 'Apply for Full Membership', link: '/full-membership' });
//       } else if (status.initial_application_status === 'not_submitted') {
//         quickActions.push({ type: 'warning', text: 'Submit Application', link: '/application-survey' });
//       }
//     }
    
//     quickActions.push({ type: 'secondary', text: 'Settings', link: '/settings' });
    
//     return successResponse(res, {
//       membershipStatus: status,
//       recentActivities: recentActivities.map(activity => ({
//         type: activity.type,
//         message: activity.message,
//         date: activity.date?.toISOString() || new Date().toISOString()
//       })),
//       notifications: [{
//         type: 'system',
//         message: `Welcome back, ${user.username}!`,
//         date: new Date().toISOString()
//       }],
//       quickActions
//     });
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Check application status with detailed information
//  */
// export const checkApplicationStatus = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user.user_id;
    
//     if (!userId) {
//       throw new CustomError('User authentication required', 401);
//     }

//     // Get user data
//     const user = await getUserById(userId);

//     // Get application details
//     const applications = await executeQuery(`
//       SELECT 
//         sl.application_type,
//         sl.approval_status,
//         sl.createdAt as submitted_at,
//         sl.reviewed_at,
//         sl.admin_notes,
//         sl.application_ticket,
//         reviewer.username as reviewed_by
//       FROM surveylog sl
//       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
//       WHERE CAST(sl.user_id AS UNSIGNED) = ?
//       ORDER BY sl.createdAt DESC
//     `, [userId]);

//     // Determine current application status
//     const initialApp = applications.find(app => app.application_type === 'initial_application');
//     const fullApp = applications.find(app => app.application_type === 'full_membership');

//     let applicationStatus = 'not_submitted';
//     let canSubmitApplication = true;
//     let nextSteps = [];

//     // Determine status based on membership stage and applications
//     if (user.membership_stage === 'none') {
//       applicationStatus = 'not_submitted';
//       canSubmitApplication = true;
//       nextSteps = [
//         'Complete your initial application survey',
//         'Submit required information',
//         'Wait for admin review (3-5 business days)'
//       ];
//     } else if (user.membership_stage === 'applicant') {
//       applicationStatus = initialApp?.approval_status || 'pending';
//       canSubmitApplication = false;
//       nextSteps = [
//         'Your application is under review',
//         'You will receive an email notification once reviewed',
//         'Check back in 3-5 business days'
//       ];
//     } else if (user.membership_stage === 'pre_member') {
//       applicationStatus = 'approved';
//       canSubmitApplication = false;
//       nextSteps = [
//         'Congratulations! Your initial application was approved',
//         'You now have access to Towncrier content',
//         'Consider applying for full membership when eligible'
//       ];
//     } else if (user.membership_stage === 'member') {
//       applicationStatus = 'approved';
//       canSubmitApplication = false;
//       nextSteps = [
//         'Welcome! You are now a full member',
//         'Access all member benefits and resources',
//         'Participate in member-exclusive activities'
//       ];
//     }

//     // Calculate progress percentage
//     let progressPercentage = 0;
//     switch (user.membership_stage) {
//       case 'none':
//         progressPercentage = 0;
//         break;
//       case 'applicant':
//         progressPercentage = 25;
//         break;
//       case 'pre_member':
//         progressPercentage = 50;
//         break;
//       case 'member':
//         progressPercentage = 100;
//         break;
//     }

//     return successResponse(res, {
//       currentStatus: {
//         membership_stage: user.membership_stage || 'none',
//         initial_application_status: applicationStatus,
//         full_membership_application_status: fullApp?.approval_status || 'not_submitted',
//         is_member: user.is_member,
//         progressPercentage
//       },
//       applicationDetails: initialApp || null,
//       nextSteps,
//       canSubmitApplication,
//       timeline: {
//         registered: user.createdAt,
//         initialSubmitted: initialApp?.submitted_at || null,
//         initialReviewed: initialApp?.reviewed_at || null,
//         fullMembershipAccessed: user.membership_stage === 'member' ? user.createdAt : null,
//         fullMembershipSubmitted: fullApp?.submitted_at || null
//       }
//     });

//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Get application history for user
//  */
// export const getApplicationHistory = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user.user_id;
    
//     // Get application history
//     const history = await executeQuery(`
//       SELECT 
//         sl.application_type,
//         sl.approval_status,
//         sl.createdAt as submitted_at,
//         sl.reviewed_at,
//         sl.admin_notes,
//         reviewer.username as reviewed_by,
//         sl.application_ticket as ticket
//       FROM surveylog sl
//       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
//       WHERE CAST(sl.user_id AS UNSIGNED) = ?
//       ORDER BY sl.createdAt DESC
//     `, [userId]);

//     // Get review history if available
//     const reviews = await executeQuery(`
//       SELECT 
//         mrh.application_type,
//         mrh.previous_status,
//         mrh.new_status,
//         mrh.review_notes,
//         mrh.action_taken,
//         mrh.reviewed_at,
//         reviewer.username as reviewer_name
//       FROM membership_review_history mrh
//       LEFT JOIN users reviewer ON mrh.reviewer_id = reviewer.id
//       WHERE mrh.user_id = ?
//       ORDER BY mrh.reviewed_at DESC
//     `, [userId]);

//     return successResponse(res, {
//       applications: history,
//       reviews
//     });
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Get user's current membership stage and permissions
//  */
// export const getUserPermissions = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user.user_id;
    
//     const user = await getUserById(userId);
    
//     // Define permissions based on membership stage and role
//     const permissions = {
//       canAccessTowncrier: ['pre_member', 'member'].includes(user.membership_stage) || ['admin', 'super_admin'].includes(user.role),
//       canAccessIko: user.membership_stage === 'member' || ['admin', 'super_admin'].includes(user.role),
//       canSubmitInitialApplication: user.membership_stage === 'none' || (user.membership_stage === 'applicant' && user.is_member === 'rejected'),
//       canSubmitFullMembershipApplication: user.membership_stage === 'pre_member',
//       canAccessAdmin: ['admin', 'super_admin'].includes(user.role),
//       canManageUsers: user.role === 'super_admin',
//       canReviewApplications: ['admin', 'super_admin'].includes(user.role)
//     };
    
//     return successResponse(res, {
//       user: {
//         id: user.id,
//         username: user.username,
//         email: user.email,
//         membership_stage: user.membership_stage,
//         is_member: user.is_member,
//         role: user.role
//       },
//       permissions
//     });
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// // ==================================================
// // Part 4: APPLICATION MANAGEMENT FUNCTIONS
// // ==================================================

// /**
//  * Submit initial application with enhanced validation
//  */
// export const submitInitialApplication = async (req, res) => {
//   try {
//     const { answers, applicationTicket } = req.body;
//     const userId = req.user.id || req.user.user_id;

//     // Validation
//     if (!answers || !Array.isArray(answers) || answers.length === 0) {
//       throw new CustomError('Application answers are required', 400);
//     }

//     if (!userId) {
//       throw new CustomError('User authentication required', 401);
//     }

//     // Get current user
//     const user = await getUserById(userId);

//     // Check if user can submit application
//     if (user.membership_stage !== 'none' && user.membership_stage !== 'applicant') {
//       throw new CustomError('Cannot submit application in current membership stage', 400);
//     }

//     // Check for existing applications
//     const existingApplications = await executeQuery(`
//       SELECT approval_status 
//       FROM surveylog 
//       WHERE CAST(user_id AS UNSIGNED) = ? 
//         AND application_type = 'initial_application'
//       ORDER BY createdAt DESC
//       LIMIT 1
//     `, [userId]);

//     if (existingApplications.length > 0) {
//       const existing = existingApplications[0];
//       if (existing.approval_status === 'pending') {
//         throw new CustomError('You already have a pending application', 400);
//       }
//       if (existing.approval_status === 'approved') {
//         throw new CustomError('You already have an approved application', 400);
//       }
//     }

//     await db.beginTransaction();

//     try {
//       // Generate ticket if not provided
//       const finalTicket = applicationTicket || generateApplicationTicket(user.username, user.email);

//       // Insert survey response
//       await executeQuery(
//         `INSERT INTO surveylog (user_id, answers, application_type, approval_status, application_ticket, createdAt) 
//          VALUES (?, ?, 'initial_application', 'pending', ?, NOW())`,
//         [userId.toString(), JSON.stringify(answers), finalTicket]
//       );

//       // Update user status to applicant
//       await executeQuery(
//         'UPDATE users SET membership_stage = ?, is_member = ?, application_ticket = ? WHERE id = ?',
//         ['applicant', 'pending', finalTicket, userId]
//       );

//       await db.commit();

//       // Send confirmation email (non-blocking)
//       try {
//         await sendEmail(user.email, 'initial_application_submitted', {
//           USERNAME: user.username,
//           APPLICATION_TICKET: finalTicket,
//           SUBMISSION_DATE: new Date().toLocaleDateString()
//         });
//       } catch (emailError) {
//         console.error('Confirmation email failed:', emailError);
//       }

//       return successResponse(res, {
//         applicationTicket: finalTicket,
//         nextSteps: [
//           'Your application is now under review',
//           'You will receive an email notification within 3-5 business days',
//           'Check your dashboard for status updates'
//         ]
//       }, 'Application submitted successfully', 201);

//     } catch (error) {
//       await db.rollback();
//       throw error;
//     }

//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Get full membership status and eligibility
//  */
// export const getFullMembershipStatus = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user.user_id;
    
//     const user = await getUserById(userId);
    
//     // Get full membership application details if exists
//     const fullMembershipApps = await executeQuery(`
//       SELECT 
//         sl.answers,
//         sl.approval_status,
//         sl.createdAt as submitted_at,
//         sl.reviewed_at,
//         sl.admin_notes,
//         reviewer.username as reviewed_by
//       FROM surveylog sl
//       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
//       WHERE CAST(sl.user_id AS UNSIGNED) = ? AND sl.application_type = 'full_membership'
//       ORDER BY sl.createdAt DESC
//       LIMIT 1
//     `, [userId]);
    
//     // Check eligibility for full membership
//     const isEligible = user.membership_stage === 'pre_member';
//     const currentApp = fullMembershipApps[0] || null;
    
//     // Get requirements and benefits
//     const requirements = [
//       'Completed initial membership application',
//       'Active participation for at least 30 days',
//       'Attended at least 2 community events',
//       'Good standing with community guidelines'
//     ];
    
//     const benefits = [
//       'Access to exclusive member events',
//       'Voting rights in community decisions',
//       'Advanced class access',
//       'Mentorship opportunities',
//       'Priority support'
//     ];
    
//     return successResponse(res, {
//       currentStatus: {
//         membership_stage: user.membership_stage,
//         is_member: user.is_member,
//         full_membership_application_status: currentApp?.approval_status || 'not_submitted'
//       },
//       fullMembershipApplication: currentApp,
//       eligibility: {
//         isEligible,
//         canApply: isEligible && (!currentApp || currentApp.approval_status === 'rejected'),
//         requirements,
//         benefits
//       },
//       nextSteps: isEligible ? [
//         'Review full membership benefits',
//         'Complete full membership application',
//         'Submit required documentation'
//       ] : [
//         'Complete initial membership process first'
//       ]
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Submit full membership application
//  */
// export const submitFullMembershipApplication = async (req, res) => {
//   try {
//     const { answers, additionalDocuments } = req.body;
//     const userId = req.user.id || req.user.user_id;
    
//     // Validate input
//     if (!answers || !Array.isArray(answers) || answers.length === 0) {
//       throw new CustomError('Application answers are required', 400);
//     }
    
//     const user = await getUserById(userId);
    
//     // Check eligibility
//     if (user.membership_stage !== 'pre_member') {
//       throw new CustomError('Not eligible for full membership application', 403);
//     }
    
//     // Check for existing application
//     const existingApps = await executeQuery(`
//       SELECT approval_status FROM surveylog 
//       WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = 'full_membership'
//       ORDER BY createdAt DESC LIMIT 1
//     `, [userId]);
    
//     if (existingApps.length > 0 && existingApps[0].approval_status === 'pending') {
//       throw new CustomError('Full membership application already submitted', 400);
//     }
    
//     await db.beginTransaction();
    
//     try {
//       // Generate application ticket
//       const applicationTicket = generateApplicationTicket(user.username, user.email, 'FULL');
      
//       // Submit application
//       await executeQuery(`
//         INSERT INTO surveylog (
//           user_id, 
//           answers, 
//           application_type, 
//           approval_status, 
//           application_ticket,
//           additional_data,
//           createdAt
//         ) VALUES (?, ?, 'full_membership', 'pending', ?, ?, NOW())
//       `, [
//         userId.toString(), 
//         JSON.stringify(answers), 
//         applicationTicket,
//         JSON.stringify({ additionalDocuments: additionalDocuments || [] })
//       ]);
      
//       await db.commit();
      
//       // Send confirmation email
//       try {
//         await sendEmail(user.email, 'full_membership_application_submitted', {
//           USERNAME: user.username,
//           APPLICATION_TICKET: applicationTicket,
//           SUBMISSION_DATE: new Date().toLocaleDateString()
//         });
//       } catch (emailError) {
//         console.error('Confirmation email failed:', emailError);
//       }
      
//       return successResponse(res, {
//         applicationTicket,
//         nextSteps: [
//           'Your application is now under review',
//           'Review process typically takes 5-7 business days',
//           'You will receive email notification once reviewed',
//           'Continue participating in community activities'
//         ]
//       }, 'Full membership application submitted successfully', 201);
      
//     } catch (error) {
//       await db.rollback();
//       throw error;
//     }
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Log full membership access
//  */
// export const logFullMembershipAccess = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user.user_id;
    
//     // Insert or update access log
//     await executeQuery(`
//       INSERT INTO full_membership_access (user_id, first_accessed_at, last_accessed_at, access_count)
//       VALUES (?, NOW(), NOW(), 1)
//       ON DUPLICATE KEY UPDATE 
//         last_accessed_at = NOW(),
//         access_count = access_count + 1
//     `, [userId]);
    
//     // Get updated access info
//     const accessInfo = await executeQuery(`
//       SELECT first_accessed_at, last_accessed_at, access_count
//       FROM full_membership_access
//       WHERE user_id = ?
//     `, [userId]);
    
//     return successResponse(res, {
//       accessInfo: accessInfo[0] || null
//     }, 'Access logged successfully');
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Update application answers (before submission)
//  */
// export const updateApplicationAnswers = async (req, res) => {
//   try {
//     const { answers, applicationType = 'initial_application' } = req.body;
//     const userId = req.user.id || req.user.user_id;
    
//     if (!answers || !Array.isArray(answers)) {
//       throw new CustomError('Valid answers array is required', 400);
//     }
    
//     // Check if application exists and is still pending
//     const applications = await executeQuery(`
//       SELECT id, approval_status 
//       FROM surveylog 
//       WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
//       ORDER BY createdAt DESC LIMIT 1
//     `, [userId, applicationType]);
    
//     if (!applications.length) {
//       throw new CustomError('No application found to update', 404);
//     }
    
//     const application = applications[0];
    
//     if (application.approval_status !== 'pending') {
//       throw new CustomError('Cannot update application that has already been reviewed', 400);
//     }
    
//     // Update application answers
//     await executeQuery(`
//       UPDATE surveylog 
//       SET answers = ?, updated_at = NOW()
//       WHERE id = ?
//     `, [JSON.stringify(answers), application.id]);
    
//     return successResponse(res, {
//       applicationId: application.id,
//       updatedAnswers: answers.length
//     }, 'Application answers updated successfully');
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Withdraw application (user can withdraw pending applications)
//  */
// export const withdrawApplication = async (req, res) => {
//   try {
//     const { applicationType = 'initial_application', reason } = req.body;
//     const userId = req.user.id || req.user.user_id;
    
//     // Check if application exists and is pending
//     const applications = await executeQuery(`
//       SELECT id, approval_status 
//       FROM surveylog 
//       WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
//       ORDER BY createdAt DESC LIMIT 1
//     `, [userId, applicationType]);
    
//     if (!applications.length) {
//       throw new CustomError('No application found to withdraw', 404);
//     }
    
//     const application = applications[0];
    
//     if (application.approval_status !== 'pending') {
//       throw new CustomError('Can only withdraw pending applications', 400);
//     }
    
//     await db.beginTransaction();
    
//     try {
//       // Update application status to withdrawn
//       await executeQuery(`
//         UPDATE surveylog 
//         SET approval_status = 'withdrawn', admin_notes = ?, reviewed_at = NOW()
//         WHERE id = ?
//       `, [reason || 'Withdrawn by user', application.id]);
      
//       // If withdrawing initial application, reset user status
//       if (applicationType === 'initial_application') {
//         await executeQuery(`
//           UPDATE users 
//           SET membership_stage = 'none', is_member = 'pending'
//           WHERE id = ?
//         `, [userId]);
//       }
      
//       await db.commit();
      
//       return successResponse(res, {
//         applicationId: application.id,
//         applicationType
//       }, 'Application withdrawn successfully');
      
//     } catch (error) {
//       await db.rollback();
//       throw error;
//     }
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Get application requirements and guidelines
//  */
// export const getApplicationRequirements = async (req, res) => {
//   try {
//     const { type = 'initial' } = req.query;
    
//     let requirements, guidelines, estimatedTime;
    
//     if (type === 'initial') {
//       requirements = [
//         'Valid email address for verification',
//         'Complete personal information',
//         'Answer all application questions',
//         'Agree to community guidelines',
//         'Provide reason for joining'
//       ];
      
//       guidelines = [
//         'Be honest and thorough in your responses',
//         'Provide specific examples where requested',
//         'Review your answers before submission',
//         'Application processing takes 3-5 business days',
//         'You will receive email notification of decision'
//       ];
      
//       estimatedTime = '10-15 minutes';
//     } else {
//       requirements = [
//         'Must be an approved pre-member',
//         'Active participation for at least 30 days',
//         'Good standing with community guidelines',
//         'Complete full membership questionnaire',
//         'Provide references if requested'
//       ];
      
//       guidelines = [
//         'Demonstrate your commitment to the community',
//         'Show examples of your participation and contributions',
//         'Be prepared for potential interview process',
//         'Full membership review takes 5-7 business days',
//         'Decision will be communicated via email'
//       ];
      
//       estimatedTime = '20-30 minutes';
//     }
    
//     return successResponse(res, {
//       applicationType: type,
//       requirements,
//       guidelines,
//       estimatedTime,
//       supportContact: 'support@ikoota.com'
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Get application form questions
//  */
// export const getApplicationQuestions = async (req, res) => {
//   try {
//     const { type = 'initial' } = req.query;
//     const userId = req.user.id || req.user.user_id;
    
//     let questions;
    
//     if (type === 'initial') {
//       questions = [
//         {
//           id: 1,
//           type: 'text',
//           question: 'Why do you want to join our community?',
//           required: true,
//           maxLength: 500,
//           placeholder: 'Please explain your motivation and what you hope to gain...'
//         },
//         {
//           id: 2,
//           type: 'textarea',
//           question: 'Tell us about your background and interests.',
//           required: true,
//           maxLength: 1000,
//           placeholder: 'Share relevant experience, skills, or interests...'
//         },
//         {
//           id: 3,
//           type: 'select',
//           question: 'How did you hear about us?',
//           required: true,
//           options: [
//             'Social media',
//             'Friend/colleague referral',
//             'Web search',
//             'Advertisement',
//             'Event/conference',
//             'Other'
//           ]
//         },
//         {
//           id: 4,
//           type: 'radio',
//           question: 'What is your primary area of interest?',
//           required: true,
//           options: [
//             'Technology',
//             'Business',
//             'Arts & Culture',
//             'Science',
//             'Education',
//             'Social Impact'
//           ]
//         },
//         {
//           id: 5,
//           type: 'checkbox',
//           question: 'I agree to the community guidelines and terms of service',
//           required: true,
//           link: '/terms-and-guidelines'
//         }
//       ];
//     } else {
//       questions = [
//         {
//           id: 1,
//           type: 'textarea',
//           question: 'Describe your contributions to the community as a pre-member.',
//           required: true,
//           maxLength: 1000,
//           placeholder: 'Detail your participation, interactions, and contributions...'
//         },
//         {
//           id: 2,
//           type: 'textarea',
//           question: 'What additional value would you bring as a full member?',
//           required: true,
//           maxLength: 800,
//           placeholder: 'Explain how you would contribute more as a full member...'
//         },
//         {
//           id: 3,
//           type: 'text',
//           question: 'What are your long-term goals within the community?',
//           required: true,
//           maxLength: 500,
//           placeholder: 'Share your vision and aspirations...'
//         },
//         {
//           id: 4,
//           type: 'select',
//           question: 'Which committee or working group interests you most?',
//           required: false,
//           options: [
//             'Events & Programs',
//             'Community Outreach',
//             'Technology & Innovation',
//             'Content & Education',
//             'Member Relations',
//             'Strategic Planning'
//           ]
//         },
//         {
//           id: 5,
//           type: 'textarea',
//           question: 'Do you have any suggestions for improving our community?',
//           required: false,
//           maxLength: 600,
//           placeholder: 'Share constructive feedback and ideas...'
//         }
//       ];
//     }
    
//     // Check if user has already submitted this type of application
//     const existingApp = await executeQuery(`
//       SELECT id, approval_status, answers 
//       FROM surveylog 
//       WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
//       ORDER BY createdAt DESC LIMIT 1
//     `, [userId, type === 'initial' ? 'initial_application' : 'full_membership']);
    
//     let previousAnswers = null;
//     if (existingApp.length > 0 && existingApp[0].answers) {
//       try {
//         previousAnswers = JSON.parse(existingApp[0].answers);
//       } catch (parseError) {
//         console.error('Error parsing previous answers:', parseError);
//       }
//     }
    
//     return successResponse(res, {
//       applicationType: type,
//       questions,
//       previousAnswers,
//       canEdit: existingApp.length === 0 || existingApp[0].approval_status === 'rejected',
//       existingStatus: existingApp.length > 0 ? existingApp[0].approval_status : null
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Validate application answers before submission
//  */
// export const validateApplicationAnswers = async (req, res) => {
//   try {
//     const { answers, applicationType = 'initial_application' } = req.body;
    
//     if (!answers || !Array.isArray(answers)) {
//       throw new CustomError('Answers array is required', 400);
//     }
    
//     const errors = [];
//     const warnings = [];
    
//     // Get questions to validate against
//     const questionsResponse = await getApplicationQuestions({
//       query: { type: applicationType === 'initial_application' ? 'initial' : 'full' },
//       user: req.user
//     });
    
//     // Basic validation
//     answers.forEach((answer, index) => {
//       if (!answer.questionId) {
//         errors.push(`Answer ${index + 1}: Missing question ID`);
//       }
      
//       if (answer.required && (!answer.value || answer.value.trim() === '')) {
//         errors.push(`Question ${answer.questionId}: Required field cannot be empty`);
//       }
      
//       if (answer.maxLength && answer.value && answer.value.length > answer.maxLength) {
//         errors.push(`Question ${answer.questionId}: Answer exceeds maximum length of ${answer.maxLength} characters`);
//       }
      
//       if (answer.value && answer.value.length < 10 && answer.type === 'textarea') {
//         warnings.push(`Question ${answer.questionId}: Answer seems too brief for a detailed response`);
//       }
//     });
    
//     return successResponse(res, {
//       valid: errors.length === 0,
//       errors,
//       warnings,
//       answerCount: answers.length
//     }, errors.length === 0 ? 'Application answers are valid' : 'Validation failed');
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };


// // ==================================================
// // Part 5: ADMIN FUNCTIONS - APPLICATION MANAGEMENT
// // ==================================================

// /**
//  * Get pending applications with advanced filtering
//  */
// export const getPendingApplications = async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 20, 
//       status = 'pending', 
//       stage = 'initial',
//       sortBy = 'submitted_at',
//       sortOrder = 'ASC',
//       search = ''
//     } = req.query;
    
//     const offset = (page - 1) * limit;
//     const applicationType = stage === 'initial' ? 'initial_application' : 'full_membership';
    
//     // Build search conditions
//     let searchClause = '';
//     let searchParams = [];
    
//     if (search) {
//       searchClause = 'AND (u.username LIKE ? OR u.email LIKE ?)';
//       searchParams = [`%${search}%`, `%${search}%`];
//     }
    
//     // Get applications with user details
//     const applications = await executeQuery(`
//       SELECT 
//         u.id as user_id,
//         u.username,
//         u.email,
//         u.phone,
//         u.membership_stage,
//         sl.id as application_id,
//         sl.answers,
//         sl.createdAt as submitted_at,
//         sl.application_ticket,
//         sl.additional_data,
//         DATEDIFF(NOW(), sl.createdAt) as days_pending,
//         fma.first_accessed_at,
//         fma.access_count
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
//       WHERE sl.approval_status = ? 
//         AND sl.application_type = ?
//         ${searchClause}
//       ORDER BY ${sortBy} ${sortOrder}
//       LIMIT ? OFFSET ?
//     `, [status, applicationType, ...searchParams, parseInt(limit), offset]);

//     // Get total count for pagination
//     const countResult = await executeQuery(`
//       SELECT COUNT(*) as total
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       WHERE sl.approval_status = ? 
//         AND sl.application_type = ?
//         ${searchClause}
//     `, [status, applicationType, ...searchParams]);

//     return successResponse(res, {
//       applications,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: countResult[0].total,
//         totalPages: Math.ceil(countResult[0].total / limit)
//       },
//       filters: { status, stage, sortBy, sortOrder, search }
//     });
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Update application status (Admin)
//  */
// export const updateApplicationStatus = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { status, adminNotes, notifyUser = true, applicationType = 'initial_application' } = req.body;
//     const reviewerId = req.user.user_id || req.user.id;
    
//     if (!['approved', 'rejected', 'pending'].includes(status)) {
//       throw new CustomError('Invalid status', 400);
//     }
    
//     // Validate stage transition
//     const user = await getUserById(userId);
//     let newStage = user.membership_stage;
//     let memberStatus = user.is_member;
    
//     if (applicationType === 'initial_application') {
//       if (status === 'approved') {
//         newStage = 'pre_member';
//         memberStatus = 'granted';
//       } else if (status === 'rejected') {
//         newStage = 'applicant';
//         memberStatus = 'rejected';
//       }
//     } else if (applicationType === 'full_membership') {
//       if (status === 'approved') {
//         newStage = 'member';
//         memberStatus = 'active';
//       }
//     }
    
//     // Validate transition
//     if (!validateStageTransition(user.membership_stage, newStage)) {
//       throw new CustomError('Invalid membership stage transition', 400);
//     }
    
//     await db.beginTransaction();
    
//     try {
//       // Update surveylog
//       await executeQuery(`
//         UPDATE surveylog 
//         SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
//         WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
//         ORDER BY createdAt DESC LIMIT 1
//       `, [status, adminNotes, reviewerId, userId, applicationType]);
      
//       // Update user status
//       await executeQuery(`
//         UPDATE users 
//         SET membership_stage = ?, is_member = ?
//         WHERE id = ?
//       `, [newStage, memberStatus, userId]);
      
//       // Log the review action
//       await executeQuery(`
//         INSERT INTO membership_review_history 
//         (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
//         VALUES (?, ?, ?, ?, ?, ?, NOW())
//       `, [userId, applicationType, 'pending', status, adminNotes, reviewerId]);
      
//       await db.commit();
      
//       // Send notification if requested
//       if (notifyUser) {
//         try {
//           const emailTemplate = status === 'approved' ? 
//             `${applicationType}_approved` : `${applicationType}_rejected`;
          
//           await sendEmail(user.email, emailTemplate, {
//             USERNAME: user.username,
//             ADMIN_NOTES: adminNotes || '',
//             REVIEW_DATE: new Date().toLocaleDateString()
//           });
//         } catch (emailError) {
//           console.error('Notification email failed:', emailError);
//         }
//       }
      
//       return successResponse(res, {
//         newStatus: {
//           membership_stage: newStage,
//           approval_status: status,
//           is_member: memberStatus
//         }
//       }, `Application ${status} successfully`);
      
//     } catch (error) {
//       await db.rollback();
//       throw error;
//     }
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Bulk approve applications
//  */
// export const bulkApproveApplications = async (req, res) => {
//   try {
//     const { userIds, action, adminNotes, applicationType = 'initial_application' } = req.body;
//     const reviewerId = req.user.user_id || req.user.id;
    
//     if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
//       throw new CustomError('User IDs are required', 400);
//     }
    
//     if (!['approve', 'reject'].includes(action)) {
//       throw new CustomError('Invalid action', 400);
//     }
    
//     if (userIds.length > 100) {
//       throw new CustomError('Maximum 100 applications can be processed at once', 400);
//     }
    
//     const status = action === 'approve' ? 'approved' : 'rejected';
    
//     await db.beginTransaction();
    
//     try {
//       const processedUsers = [];
      
//       for (const userId of userIds) {
//         const user = await getUserById(userId);
        
//         let newStage = user.membership_stage;
//         let memberStatus = user.is_member;
        
//         if (applicationType === 'initial_application') {
//           if (status === 'approved') {
//             newStage = 'pre_member';
//             memberStatus = 'granted';
//           } else {
//             newStage = 'applicant';
//             memberStatus = 'rejected';
//           }
//         } else if (applicationType === 'full_membership') {
//           if (status === 'approved') {
//             newStage = 'member';
//             memberStatus = 'active';
//           }
//         }
        
//         // Validate transition
//         if (!validateStageTransition(user.membership_stage, newStage)) {
//           console.warn(`Invalid transition for user ${userId}: ${user.membership_stage} -> ${newStage}`);
//           continue; // Skip this user
//         }
        
//         // Update surveylog
//         await executeQuery(`
//           UPDATE surveylog 
//           SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
//           WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = ?
//           ORDER BY createdAt DESC LIMIT 1
//         `, [status, adminNotes, reviewerId, userId, applicationType]);
        
//         // Update user status
//         await executeQuery(`
//           UPDATE users 
//           SET membership_stage = ?, is_member = ?
//           WHERE id = ?
//         `, [newStage, memberStatus, userId]);
        
//         // Log review
//         await executeQuery(`
//           INSERT INTO membership_review_history 
//           (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
//           VALUES (?, ?, ?, ?, ?, ?, NOW())
//         `, [userId, applicationType, 'pending', status, adminNotes, reviewerId]);
        
//         processedUsers.push({
//           userId,
//           username: user.username,
//           email: user.email,
//           newStatus: { membership_stage: newStage, is_member: memberStatus }
//         });
//       }
      
//       await db.commit();
      
//       // Send notification emails (non-blocking)
//       const emailTemplate = status === 'approved' ? 
//         `${applicationType}_approved` : `${applicationType}_rejected`;
        
//       const emailPromises = processedUsers.map(user => 
//         sendEmail(user.email, emailTemplate, {
//           USERNAME: user.username,
//           ADMIN_NOTES: adminNotes || '',
//           REVIEW_DATE: new Date().toLocaleDateString()
//         }).catch(err => console.error('Email failed for', user.email, err))
//       );
      
//       // Don't wait for emails to complete
//       Promise.allSettled(emailPromises);
      
//       return successResponse(res, {
//         processedCount: processedUsers.length,
//         requestedCount: userIds.length,
//         processedUsers
//       }, `Successfully ${action}ed ${processedUsers.length} out of ${userIds.length} applications`);
      
//     } catch (error) {
//       await db.rollback();
//       throw error;
//     }
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Get pending full memberships (Admin)
//  */
// export const getPendingFullMemberships = async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 20, 
//       sortBy = 'submitted_at', 
//       sortOrder = 'ASC',
//       search = ''
//     } = req.query;
    
//     const offset = (page - 1) * limit;
    
//     let searchClause = '';
//     let searchParams = [];
    
//     if (search) {
//       searchClause = 'AND (u.username LIKE ? OR u.email LIKE ?)';
//       searchParams = [`%${search}%`, `%${search}%`];
//     }
    
//     const applications = await executeQuery(`
//       SELECT 
//         u.id as user_id,
//         u.username,
//         u.email,
//         sl.id as application_id,
//         sl.answers,
//         sl.createdAt as submitted_at,
//         sl.application_ticket,
//         sl.additional_data,
//         fma.first_accessed_at,
//         fma.access_count,
//         DATEDIFF(NOW(), sl.createdAt) as days_pending
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
//       WHERE sl.application_type = 'full_membership' 
//         AND sl.approval_status = 'pending'
//         ${searchClause}
//       ORDER BY ${sortBy} ${sortOrder}
//       LIMIT ? OFFSET ?
//     `, [...searchParams, parseInt(limit), offset]);
    
//     const countResult = await executeQuery(`
//       SELECT COUNT(*) as total
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       WHERE sl.application_type = 'full_membership' 
//         AND sl.approval_status = 'pending'
//         ${searchClause}
//     `, searchParams);
    
//     return successResponse(res, {
//       applications,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: countResult[0].total,
//         totalPages: Math.ceil(countResult[0].total / limit)
//       }
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Update full membership status (Admin)
//  */
// export const updateFullMembershipStatus = async (req, res) => {
//   try {
//     const { applicationId } = req.params;
//     const { status, adminNotes, notifyUser = true } = req.body;
//     const reviewerId = req.user.user_id || req.user.id;
    
//     if (!['approved', 'rejected'].includes(status)) {
//       throw new CustomError('Invalid status', 400);
//     }
    
//     // Get application details
//     const applications = await executeQuery(`
//       SELECT CAST(user_id AS UNSIGNED) as user_id 
//       FROM surveylog 
//       WHERE id = ? AND application_type = 'full_membership'
//     `, [applicationId]);
    
//     if (!applications || applications.length === 0) {
//       throw new CustomError('Application not found', 404);
//     }
    
//     const userId = applications[0].user_id;
//     const user = await getUserById(userId);
    
//     await db.beginTransaction();
    
//     try {
//       // Update surveylog
//       await executeQuery(`
//         UPDATE surveylog 
//         SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
//         WHERE id = ?
//       `, [status, adminNotes, reviewerId, applicationId]);
      
//       // Update user to full member if approved
//       if (status === 'approved') {
//         await executeQuery(`
//           UPDATE users 
//           SET membership_stage = 'member', is_member = 'active'
//           WHERE id = ?
//         `, [userId]);
//       }
      
//       // Log the review
//       await executeQuery(`
//         INSERT INTO membership_review_history 
//         (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
//         VALUES (?, 'full_membership', 'pending', ?, ?, ?, NOW())
//       `, [userId, status, adminNotes, reviewerId]);
      
//       await db.commit();
      
//       // Send notification
//       if (notifyUser) {
//         try {
//           const emailTemplate = status === 'approved' ? 'full_membership_approved' : 'full_membership_rejected';
          
//           await sendEmail(user.email, emailTemplate, {
//             USERNAME: user.username,
//             ADMIN_NOTES: adminNotes || '',
//             REVIEW_DATE: new Date().toLocaleDateString()
//           });
//         } catch (emailError) {
//           console.error('Notification email failed:', emailError);
//         }
//       }
      
//       return successResponse(res, {}, `Full membership application ${status} successfully`);
      
//     } catch (error) {
//       await db.rollback();
//       throw error;
//     }
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Get application details by ID (Admin)
//  */
// export const getApplicationDetails = async (req, res) => {
//   try {
//     const { applicationId } = req.params;
    
//     // Get application with user details
//     const applications = await executeQuery(`
//       SELECT 
//         sl.*,
//         u.username,
//         u.email,
//         u.phone,
//         u.membership_stage,
//         u.is_member,
//         u.createdAt as user_registered,
//         reviewer.username as reviewed_by_username,
//         reviewer.email as reviewed_by_email
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
//       WHERE sl.id = ?
//     `, [applicationId]);
    
//     if (!applications || applications.length === 0) {
//       throw new CustomError('Application not found', 404);
//     }
    
//     const application = applications[0];
    
//     // Get review history for this application
//     const reviewHistory = await executeQuery(`
//       SELECT 
//         mrh.*,
//         reviewer.username as reviewer_name
//       FROM membership_review_history mrh
//       LEFT JOIN users reviewer ON mrh.reviewer_id = reviewer.id
//       WHERE mrh.user_id = ? AND mrh.application_type = ?
//       ORDER BY mrh.reviewed_at DESC
//     `, [application.user_id, application.application_type]);
    
//     return successResponse(res, {
//       application,
//       reviewHistory
//     });
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Get admin dashboard summary
//  */
// export const getAdminDashboardSummary = async (req, res) => {
//   try {
//     // Get pending applications count
//     const pendingStats = await executeQuery(`
//       SELECT 
//         application_type,
//         COUNT(*) as count
//       FROM surveylog 
//       WHERE approval_status = 'pending'
//       GROUP BY application_type
//     `);
    
//     // Get recent activity (last 7 days)
//     const recentActivity = await executeQuery(`
//       SELECT 
//         sl.application_type,
//         sl.approval_status,
//         sl.createdAt,
//         sl.reviewed_at,
//         u.username,
//         reviewer.username as reviewed_by
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
//       WHERE sl.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
//          OR sl.reviewed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
//       ORDER BY COALESCE(sl.reviewed_at, sl.createdAt) DESC
//       LIMIT 20
//     `);
    
//     // Get membership distribution
//     const membershipDistribution = await executeQuery(`
//       SELECT 
//         membership_stage,
//         COUNT(*) as count
//       FROM users
//       GROUP BY membership_stage
//     `);
    
//     // Get processing time stats
//     const processingStats = await executeQuery(`
//       SELECT 
//         application_type,
//         AVG(DATEDIFF(reviewed_at, createdAt)) as avg_days,
//         COUNT(*) as total_processed
//       FROM surveylog
//       WHERE reviewed_at IS NOT NULL
//         AND reviewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//       GROUP BY application_type
//     `);
    
//     return successResponse(res, {
//       pendingApplications: pendingStats.reduce((acc, stat) => {
//         acc[stat.application_type] = stat.count;
//         return acc;
//       }, {}),
//       recentActivity,
//       membershipDistribution,
//       processingStats
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Search users (Admin)
//  */
// export const searchUsers = async (req, res) => {
//   try {
//     const { 
//       query = '', 
//       membershipStage = '', 
//       role = '', 
//       page = 1, 
//       limit = 20 
//     } = req.query;
    
//     const offset = (page - 1) * limit;
    
//     let whereClause = 'WHERE 1=1';
//     let queryParams = [];
    
//     if (query) {
//       whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)';
//       queryParams.push(`%${query}%`, `%${query}%`);
//     }
    
//     if (membershipStage) {
//       whereClause += ' AND u.membership_stage = ?';
//       queryParams.push(membershipStage);
//     }
    
//     if (role) {
//       whereClause += ' AND u.role = ?';
//       queryParams.push(role);
//     }
    
//     const users = await executeQuery(`
//       SELECT 
//         u.id,
//         u.username,
//         u.email,
//         u.phone,
//         u.membership_stage,
//         u.is_member,
//         u.role,
//         u.createdAt,
//         COALESCE(initial_app.approval_status, 'not_submitted') as initial_status,
//         COALESCE(full_app.approval_status, 'not_submitted') as full_status
//       FROM users u
//       LEFT JOIN surveylog initial_app ON u.id = CAST(initial_app.user_id AS UNSIGNED) 
//         AND initial_app.application_type = 'initial_application'
//       LEFT JOIN surveylog full_app ON u.id = CAST(full_app.user_id AS UNSIGNED) 
//         AND full_app.application_type = 'full_membership'
//       ${whereClause}
//       ORDER BY u.createdAt DESC
//       LIMIT ? OFFSET ?
//     `, [...queryParams, parseInt(limit), offset]);
    
//     const countResult = await executeQuery(`
//       SELECT COUNT(*) as total
//       FROM users u
//       ${whereClause}
//     `, queryParams);
    
//     return successResponse(res, {
//       users,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: countResult[0].total,
//         totalPages: Math.ceil(countResult[0].total / limit)
//       }
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Update user role (Super Admin only)
//  */
// export const updateUserRole = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { role } = req.body;
//     const adminId = req.user.user_id || req.user.id;
    
//     // Validate role
//     if (!['user', 'admin', 'super_admin'].includes(role)) {
//       throw new CustomError('Invalid role', 400);
//     }
    
//     // Get current user details
//     const user = await getUserById(userId);
    
//     // Prevent self-demotion from super_admin
//     if (adminId === parseInt(userId) && req.user.role === 'super_admin' && role !== 'super_admin') {
//       throw new CustomError('Cannot demote yourself from super admin', 400);
//     }
    
//     // Update user role
//     await executeQuery(`
//       UPDATE users 
//       SET role = ? 
//       WHERE id = ?
//     `, [role, userId]);
    
//     // Log the role change
//     await executeQuery(`
//       INSERT INTO membership_review_history 
//       (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
//       VALUES (?, 'role_change', ?, ?, ?, ?, NOW())
//     `, [userId, user.role, role, `Role changed from ${user.role} to ${role}`, adminId]);
    
//     return successResponse(res, {
//       userId,
//       oldRole: user.role,
//       newRole: role
//     }, `User role updated successfully`);
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };



// // ==================================================
// // Part 6: ANALYTICS, REPORTING & SYSTEM FUNCTIONS
// // ==================================================

// /**
//  * Get comprehensive membership analytics
//  */
// export const getMembershipAnalytics = async (req, res) => {
//   try {
//     const { period = '30d', detailed = false } = req.query;
    
//     // Get basic membership statistics
//     const membershipStats = await executeQuery(`
//       SELECT 
//         COUNT(*) as total_users,
//         COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as total_applicants,
//         COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as total_pre_members,
//         COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as total_members,
//         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month,
//         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week
//       FROM users
//     `);
    
//     // Get conversion funnel data
//     const funnelData = await executeQuery(`
//       SELECT 
//         COUNT(*) as total_registrations,
//         COUNT(CASE WHEN membership_stage != 'none' THEN 1 END) as started_application,
//         COUNT(CASE WHEN membership_stage = 'pre_member' OR membership_stage = 'member' THEN 1 END) as approved_initial,
//         COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members
//       FROM users
//     `);
    
//     // Get time-series data for the chart
//     const periodDays = period === '30d' ? 30 : period === '7d' ? 7 : 90;
//     const timeSeriesData = await executeQuery(`
//       SELECT 
//         DATE(createdAt) as date,
//         COUNT(*) as registrations,
//         COUNT(CASE WHEN membership_stage = 'pre_member' OR membership_stage = 'member' THEN 1 END) as approvals
//       FROM users 
//       WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
//       GROUP BY DATE(createdAt)
//       ORDER BY date ASC
//     `, [periodDays]);
    
//     // Get application processing stats
//     const processingStats = await executeQuery(`
//       SELECT 
//         application_type,
//         COUNT(*) as total_applications,
//         COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
//         COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected,
//         COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending,
//         AVG(CASE WHEN reviewed_at IS NOT NULL THEN DATEDIFF(reviewed_at, createdAt) END) as avg_processing_days
//       FROM surveylog
//       GROUP BY application_type
//     `);
    
//     let detailedAnalytics = {};
//     if (detailed === 'true') {
//       // Get detailed breakdown by various factors
//       const roleBreakdown = await executeQuery(`
//         SELECT 
//           role,
//           COUNT(*) as count,
//           COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members
//         FROM users
//         GROUP BY role
//       `);
      
//       const monthlyTrends = await executeQuery(`
//         SELECT 
//           YEAR(createdAt) as year,
//           MONTH(createdAt) as month,
//           COUNT(*) as registrations,
//           COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as conversions
//         FROM users
//         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
//         GROUP BY YEAR(createdAt), MONTH(createdAt)
//         ORDER BY year DESC, month DESC
//       `);
      
//       detailedAnalytics = { 
//         roleBreakdown,
//         monthlyTrends
//       };
//     }
    
//     return successResponse(res, {
//       overview: membershipStats[0],
//       conversionFunnel: funnelData[0],
//       timeSeries: timeSeriesData,
//       processingStats,
//       ...detailedAnalytics
//     });
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Get membership overview for admin dashboard
//  */
// export const getMembershipOverview = async (req, res) => {
//   try {
//     // Get comprehensive overview data
//     const overview = await executeQuery(`
//       SELECT 
//         u.id,
//         u.username,
//         u.email,
//         u.membership_stage,
//         u.is_member,
//         u.role,
//         u.createdAt as user_created,
        
//         -- Initial Application Info
//         COALESCE(initial_app.approval_status, 'not_submitted') as initial_status,
//         initial_app.createdAt as initial_submitted,
//         initial_app.reviewed_at as initial_reviewed,
//         initial_reviewer.username as initial_reviewer,
        
//         -- Full Membership Info  
//         COALESCE(full_app.approval_status, 'not_submitted') as full_status,
//         full_app.createdAt as full_submitted,
//         full_app.reviewed_at as full_reviewed,
//         full_reviewer.username as full_reviewer,
        
//         -- Access Info
//         fma.first_accessed_at as full_membership_accessed,
//         fma.access_count
        
//       FROM users u
//       LEFT JOIN surveylog initial_app ON u.id = CAST(initial_app.user_id AS UNSIGNED) 
//         AND initial_app.application_type = 'initial_application'
//       LEFT JOIN users initial_reviewer ON initial_app.reviewed_by = initial_reviewer.id
//       LEFT JOIN surveylog full_app ON u.id = CAST(full_app.user_id AS UNSIGNED) 
//         AND full_app.application_type = 'full_membership'  
//       LEFT JOIN users full_reviewer ON full_app.reviewed_by = full_reviewer.id
//       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
//       ORDER BY u.createdAt DESC
//       LIMIT 100
//     `);
    
//     // Get summary statistics
//     const summary = await executeQuery(`
//       SELECT 
//         COUNT(*) as total_users,
//         COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as applicants,
//         COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as pre_members,
//         COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members,
//         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month,
//         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week
//       FROM users
//     `);
    
//     return successResponse(res, {
//       overview,
//       summary: summary[0]
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Get detailed membership statistics
//  */
// export const getMembershipStats = async (req, res) => {
//   try {
//     // Get comprehensive statistics
//     const membershipStats = await executeQuery(`
//       SELECT 
//         COUNT(*) as total_users,
//         COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as total_applicants,
//         COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as total_pre_members,
//         COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as total_members,
        
//         -- Application stats
//         (SELECT COUNT(*) FROM surveylog WHERE application_type = 'initial_application') as submitted_initial_applications,
//         (SELECT COUNT(*) FROM surveylog WHERE application_type = 'initial_application' AND approval_status = 'pending') as pending_initial_applications,
//         (SELECT COUNT(*) FROM surveylog WHERE application_type = 'full_membership') as submitted_full_applications,
//         (SELECT COUNT(*) FROM surveylog WHERE application_type = 'full_membership' AND approval_status = 'pending') as pending_full_applications
        
//       FROM users
//     `);
    
//     // Get registration trends
//     const registrationTrends = await executeQuery(`
//       SELECT 
//         DATE(createdAt) as date,
//         COUNT(*) as registrations
//       FROM users 
//       WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//       GROUP BY DATE(createdAt)
//       ORDER BY date ASC
//     `);
    
//     // Get approval rates
//     const approvalRates = await executeQuery(`
//       SELECT 
//         application_type,
//         COUNT(*) as total_applications,
//         COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
//         COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected,
//         COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending,
//         ROUND(COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) * 100.0 / COUNT(*), 2) as approval_rate
//       FROM surveylog
//       GROUP BY application_type
//     `);
    
//     // Get processing time stats
//     const processingTimes = await executeQuery(`
//       SELECT 
//         application_type,
//         AVG(DATEDIFF(reviewed_at, createdAt)) as avg_processing_days,
//         MIN(DATEDIFF(reviewed_at, createdAt)) as min_processing_days,
//         MAX(DATEDIFF(reviewed_at, createdAt)) as max_processing_days
//       FROM surveylog
//       WHERE reviewed_at IS NOT NULL
//       GROUP BY application_type
//     `);
    
//     return successResponse(res, {
//       membershipStats: membershipStats[0],
//       registrationTrends,
//       approvalRates,
//       processingTimes
//     });
    
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Export membership data
//  */
// export const exportMembershipData = async (req, res) => {
//   try {
//     const { format = 'csv', filters = {} } = req.query;
    
//     // Get comprehensive membership data
//     const membershipData = await executeQuery(`
//       SELECT 
//         u.id,
//         u.username,
//         u.email,
//         u.phone,
//         u.membership_stage,
//         u.is_member,
//         u.role,
//         u.createdAt as user_created,
//         COALESCE(initial_app.approval_status, 'not_submitted') as initial_status,
//         initial_app.createdAt as initial_submitted,
//         initial_app.reviewed_at as initial_reviewed,
//         COALESCE(full_app.approval_status, 'not_submitted') as full_status,
//         full_app.createdAt as full_submitted,
//         full_app.reviewed_at as full_reviewed
//       FROM users u
//       LEFT JOIN surveylog initial_app ON u.id = CAST(initial_app.user_id AS UNSIGNED) 
//         AND initial_app.application_type = 'initial_application'
//       LEFT JOIN surveylog full_app ON u.id = CAST(full_app.user_id AS UNSIGNED) 
//         AND full_app.application_type = 'full_membership'
//       ORDER BY u.createdAt DESC
//     `);
    
//     if (format === 'csv') {
//       // Convert to CSV format
//       const csv = convertToCSV(membershipData);
//       res.setHeader('Content-Type', 'text/csv');
//       res.setHeader('Content-Disposition', 'attachment; filename="membership_data.csv"');
//       res.send(csv);
//     } else {
//       return successResponse(res, {
//         data: membershipData,
//         exportedAt: new Date().toISOString(),
//         totalRecords: membershipData.length
//       });
//     }
//   } catch (error) {
//     return errorResponse(res, error);
//   }
// };

// /**
//  * Send notification to users (Admin)
//  */
// export const sendNotification = async (req, res) => {
//   try {
//     const { 
//       recipients, // array of user IDs or 'all'
//       subject,
//       message,
//       type = 'email', // 'email', 'sms', 'both'
//       priority = 'normal' // 'low', 'normal', 'high'
//     } = req.body;
    
//     if (!subject || !message) {
//       throw new CustomError('Subject and message are required', 400);
//     }
    
//     let userList = [];
    
//     if (recipients === 'all') {
//       userList = await executeQuery('SELECT id, username, email, phone FROM users');
//     } else if (Array.isArray(recipients)) {
//       const placeholders = recipients.map(() => '?').join(',');
//       userList = await executeQuery(
//         `SELECT id, username, email, phone FROM users WHERE id IN (${placeholders})`,
//         recipients
//       );
//     } else {
//       throw new CustomError('Invalid recipients format', 400);
//     }
    
//     let successCount = 0;
//     const sendPromises = [];
    
//     for (const user of userList) {
//       if ((type === 'email' || type === 'both') && user.email) {
//         sendPromises.push(
//           sendEmail(user.email, 'admin_notification', {
//             USERNAME: user.username,
//             SUBJECT: subject,
//             MESSAGE: message,
//             PRIORITY: priority
//           }).then(() => successCount++).catch(err => console.error('Email failed for', user.email, err))
//         );
//       }
      
//       if ((type === 'sms' || type === 'both') && user.phone) {
//         sendPromises.push(
//           sendSMS(user.phone, `${subject}: ${message}`)
//             .then(() => successCount++).catch(err => console.error('SMS failed for', user.phone, err))
//         );
//       }
//     }
    
//     await Promise.allSettled(sendPromises);
    
//     return successResponse(res, {
//       sentCount: userList.length,
//       successCount
//     }, `Notification sent to ${userList.length} users`);
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Send membership-specific notification (Admin)
//  */
// export const sendMembershipNotification = async (req, res) => {
//   try {
//     const { 
//       membershipStage, // 'applicant', 'pre_member', 'member'
//       subject,
//       message,
//       type = 'email'
//     } = req.body;
    
//     if (!membershipStage || !subject || !message) {
//       throw new CustomError('Membership stage, subject and message are required', 400);
//     }
    
//     const users = await executeQuery(`
//       SELECT id, username, email, phone 
//       FROM users 
//       WHERE membership_stage = ?
//     `, [membershipStage]);
    
//     let successCount = 0;
//     const sendPromises = [];
    
//     for (const user of users) {
//       if (type === 'email' && user.email) {
//         sendPromises.push(
//           sendEmail(user.email, 'membership_notification', {
//             USERNAME: user.username,
//             SUBJECT: subject,
//             MESSAGE: message,
//             MEMBERSHIP_STAGE: membershipStage
//           }).then(() => successCount++).catch(err => console.error('Email failed for', user.email, err))
//         );
//       }
      
//       if (type === 'sms' && user.phone) {
//         sendPromises.push(
//           sendSMS(user.phone, `${subject}: ${message}`)
//             .then(() => successCount++).catch(err => console.error('SMS failed for', user.phone, err))
//         );
//       }
//     }
    
//     await Promise.allSettled(sendPromises);
    
//     return successResponse(res, {
//       sentCount: users.length,
//       successCount
//     }, `Membership notification sent to ${users.length} ${membershipStage}s`);
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// /**
//  * Health check endpoint for membership system
//  */
// export const healthCheck = async (req, res) => {
//   try {
//     // Check database connectivity
//     await executeQuery('SELECT 1 as health_check');
    
//     // Get basic system stats
//     const stats = await executeQuery(`
//       SELECT 
//         COUNT(*) as total_users,
//         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as new_users_24h,
//         (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_applications
//       FROM users
//     `);
    
//     return successResponse(res, {
//       status: 'healthy',
//       timestamp: new Date().toISOString(),
//       stats: stats[0],
//       version: '2.0.0'
//     });
    
//   } catch (error) {
//     return res.status(503).json({
//       success: false,
//       status: 'unhealthy',
//       error: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// };

// /**
//  * Get system configuration (Admin only)
//  */
// export const getSystemConfig = async (req, res) => {
//   try {
//     const userRole = req.user.role;
    
//     if (!['admin', 'super_admin'].includes(userRole)) {
//       throw new CustomError('Insufficient permissions', 403);
//     }
    
//     // Get various system configurations
//     const config = {
//       membershipStages: ['none', 'applicant', 'pre_member', 'member'],
//       memberStatuses: ['pending', 'granted', 'rejected', 'active'],
//       userRoles: ['user', 'admin', 'super_admin'],
//       applicationTypes: ['initial_application', 'full_membership'],
//       approvalStatuses: ['not_submitted', 'pending', 'approved', 'rejected'],
//       notificationTypes: ['email', 'sms', 'both'],
//       systemLimits: {
//         maxBulkOperations: 100,
//         maxExportRecords: 10000,
//         sessionTimeout: '7d',
//         verificationCodeExpiry: '10m'
//       },
//       features: {
//         emailNotifications: true,
//         smsNotifications: true,
//         bulkOperations: true,
//         dataExport: true,
//         analytics: true
//       }
//     };
    
//     return successResponse(res, { config });
    
//   } catch (error) {
//     return errorResponse(res, error, error.statusCode || 500);
//   }
// };

// // =============================================================================
// // MIDDLEWARE HELPERS
// // =============================================================================

// /**
//  * Validate request parameters
//  */
// export const validateRequest = (requiredFields) => {
//   return (req, res, next) => {
//     const missingFields = requiredFields.filter(field => !req.body[field]);
    
//     if (missingFields.length > 0) {
//       return errorResponse(res, 
//         new CustomError(`Missing required fields: ${missingFields.join(', ')}`, 400), 
//         400
//       );
//     }
    
//     next();
//   };
// };

// /**
//  * Validate admin permissions
//  */
// export const requireAdmin = (req, res, next) => {
//   const userRole = req.user?.role;
  
//   if (!['admin', 'super_admin'].includes(userRole)) {
//     return errorResponse(res, 
//       new CustomError('Administrative privileges required', 403), 
//       403
//     );
//   }
  
//   next();
// };

// /**
//  * Validate super admin permissions
//  */
// export const requireSuperAdmin = (req, res, next) => {
//   const userRole = req.user?.role;
  
//   if (userRole !== 'super_admin') {
//     return errorResponse(res, 
//       new CustomError('Super administrative privileges required', 403), 
//       403
//     );
//   }
  
//   next();
// };

// // =============================================================================
// // FINAL EXPORTS - Add this at the end
// // =============================================================================

// export default {
//   // Authentication & Registration
//   enhancedLogin,
//   sendVerificationCode,
//   registerWithVerification,
  
//   // User Dashboard & Status
//   getUserDashboard,
//   checkApplicationStatus,
//   getApplicationHistory,
//   getUserPermissions,
  
//   // Application Management
//   submitInitialApplication,
  
//   // Full Membership
//   getFullMembershipStatus,
//   submitFullMembershipApplication,
//   logFullMembershipAccess,
  
//   // Admin - Application Management
//   getPendingApplications,
//   updateApplicationStatus,
//   bulkApproveApplications,
//   getPendingFullMemberships,
//   updateFullMembershipStatus,
  
//   // Admin - Analytics & Reporting
//   getMembershipAnalytics,
//   getMembershipOverview,
//   getMembershipStats,
//   exportMembershipData,
  
//   // Notifications
//   sendNotification,
//   sendMembershipNotification,
  
//   // System
//   healthCheck,
//   getSystemConfig,
  
//   // Middleware helpers
//   validateRequest,
//   requireAdmin,
//   requireSuperAdmin
// };

// //  working old version 
// // ikootaapi/controllers/membershipControllers.js
// // ==================================================

// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import db from '../config/db.js';
// import { sendEmail, sendSMS } from '../utils/notifications.js';
// import CustomError from '../utils/CustomError.js';

// // Utility function to generate application ticket
// const generateApplicationTicket = (username, email) => {
//   const timestamp = Date.now().toString(36);
//   const random = Math.random().toString(36).substr(2, 5);
//   return `APP-${username.substr(0, 3).toUpperCase()}-${timestamp}-${random}`.toUpperCase();
// };

// // Replace the enhancedLogin function in your membershipControllers.js with this:

// export const enhancedLogin = async (req, res) => {
//   try {
//     const { identifier, password } = req.body;
    
//     // Single optimized query to get user with membership status
//     const [users] = await db.query(`
//       SELECT u.*, 
//              COALESCE(sl.approval_status, 'not_submitted') as initial_application_status,
//              sl.createdAt as initial_application_date,
//              fma.first_accessed_at as full_membership_accessed,
//              COUNT(fma.user_id) > 0 as has_accessed_full_membership
//       FROM users u
//       LEFT JOIN surveylog sl ON u.id = CAST(sl.user_id AS UNSIGNED) AND sl.application_type = 'initial_application'
//       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
//       WHERE u.email = ? OR u.username = ?
//       GROUP BY u.id
//     `, [identifier, identifier]);
    
//     if (!users || users.length === 0) {
//       throw new CustomError('Invalid credentials', 401);
//     }

//     const user = users[0];

//     // Verify password
//     const isValidPassword = await bcrypt.compare(password, user.password_hash);
//     if (!isValidPassword) {
//       throw new CustomError('Invalid credentials', 401);
//     }

//     // Generate JWT token with CURRENT user data
//     const token = jwt.sign(
//       { 
//         user_id: user.id, 
//         username: user.username, 
//         email: user.email,
//         membership_stage: user.membership_stage,
//         is_member: user.is_member,
//         role: user.role
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     // Fixed Smart redirect logic - using correct routes
//     let redirectTo = '/';
    
//     // For admins, always go to admin dashboard
//     if (user.role === 'admin' || user.role === 'super_admin') {
//       redirectTo = '/admin';
//     } else if (user.membership_stage === 'member' && user.is_member === 'member') {
//       // Full members go to Iko chat
//       redirectTo = '/iko';
//     } else if (user.membership_stage === 'pre_member') {
//       // Pre-members go to Towncrier only
//       redirectTo = '/towncrier';
//     } else if (user.membership_stage === 'applicant' && user.initial_application_status === 'not_submitted') {
//       redirectTo = '/applicationsurvey';
//     } else if (user.membership_stage === 'applicant' && user.initial_application_status === 'pending') {
//       redirectTo = '/pending-verification';
//     } else if (user.membership_stage === 'applicant' && user.initial_application_status === 'approved') {
//       redirectTo = '/approved-verification';
//     } else {
//       // Default for any edge cases
//       redirectTo = '/';
//     }

//     res.json({
//       message: 'Login successful',
//       token,
//       user: {
//         id: user.id,
//         username: user.username,
//         email: user.email,
//         membership_stage: user.membership_stage,
//         is_member: user.is_member,
//         role: user.role
//       },
//       redirectTo
//     });
//   } catch (error) {
//     res.status(error.statusCode || 500).json({ 
//       error: error.message || 'Login failed' 
//     });
//   }
// };

// // Replace your getUserDashboard function with this debug version:

// export const getUserDashboard = async (req, res) => {
//   console.log('🎯 getUserDashboard called!');
//   console.log('🔍 req.user:', req.user);
  
//   try {
//     const userId = req.user.user_id || req.user.id;
//     const userRole = req.user.role;
    
//     console.log('🎯 Extracted userId:', userId, 'role:', userRole);
    
//     if (!userId) {
//       console.error('❌ No user ID found in request');
//       return res.status(401).json({ error: 'User ID not found' });
//     }
    
//     // Get basic user info directly
//     console.log('🔍 Getting user from database...');
//     const dbResult = await db.query(
//       'SELECT id, username, email, role, membership_stage, is_member, createdAt FROM users WHERE id = ?',
//       [userId]
//     );
    
//     console.log('🔍 Full DB result structure:', dbResult);
//     console.log('🔍 DB result type:', typeof dbResult);
//     console.log('🔍 DB result length:', dbResult.length);
//     console.log('🔍 DB result[0]:', dbResult[0]);
//     console.log('🔍 DB result[0] type:', typeof dbResult[0]);
//     console.log('🔍 DB result[0] length:', dbResult[0]?.length);
    
//     // Try different ways to access the data
//     let userData = null;
    
//     if (Array.isArray(dbResult) && dbResult.length > 0) {
//       if (Array.isArray(dbResult[0]) && dbResult[0].length > 0) {
//         userData = dbResult[0][0]; // Nested array structure
//         console.log('✅ Using nested array access: dbResult[0][0]');
//       } else {
//         userData = dbResult[0]; // Direct array structure
//         console.log('✅ Using direct array access: dbResult[0]');
//       }
//     } else {
//       userData = dbResult; // Direct object structure
//       console.log('✅ Using direct object access: dbResult');
//     }
    
//     console.log('🔍 Final userData:', userData);
    
//     if (!userData || !userData.id) {
//       console.error('❌ No valid user data found');
//       return res.status(404).json({ error: 'User not found' });
//     }
    
//     console.log('✅ User extracted successfully:', userData);
    
//     // Handle the correct ENUM values for is_member
//     let memberStatus = userData.is_member;
//     if (!memberStatus || memberStatus === '' || memberStatus === null) {
//       if (userRole === 'admin' || userRole === 'super_admin') {
//         memberStatus = 'member'; // Use 'member' instead of 'active'
//         console.log('🔧 Fixed empty is_member for admin user');
//       } else {
//         memberStatus = 'pending';
//       }
//     }
    
//     // Create a simple status object
//     const status = {
//       id: userData.id,
//       username: userData.username,
//       email: userData.email,
//       role: userData.role,
//       membership_stage: userData.membership_stage || 'member',
//       is_member: memberStatus,
//       initial_application_status: 'approved',
//       full_membership_application_status: 'approved',
//       has_accessed_full_membership: true,
//       user_created: userData.createdAt
//     };
    
//     console.log('✅ Status created:', status);
    
//     const response = {
//       membershipStatus: status,
//       recentActivities: [],
//       notifications: [{
//         type: 'system',
//         message: 'Welcome to the admin dashboard',
//         date: new Date().toISOString()
//       }],
//       quickActions: [
//         { type: 'primary', text: 'View Profile', link: '/profile' },
//         { type: 'info', text: 'Admin Panel', link: '/admin' },
//         { type: 'success', text: 'Iko Chat', link: '/iko' },
//         { type: 'secondary', text: 'Settings', link: '/settings' }
//       ]
//     };
    
//     console.log('✅ Sending response:', response);
//     res.json(response);
    
//   } catch (error) {
//     console.error('❌ getUserDashboard error:', error);
//     res.status(500).json({ 
//       error: 'Failed to load dashboard',
//       details: error.message 
//     });
//   }
// };


// // NEW: Application History
// export const getApplicationHistory = async (req, res) => {
//   try {
//     const userId = req.user.id;
    
//     const [history] = await db.query(`
//       SELECT 
//         sl.application_type,
//         sl.approval_status,
//         sl.createdAt as submitted_at,
//         sl.reviewed_at,
//         sl.admin_notes,
//         reviewer.username as reviewed_by,
//         sl.application_ticket as ticket
//       FROM surveylog sl
//       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
//       WHERE CAST(sl.user_id AS UNSIGNED) = ?
//       ORDER BY sl.createdAt DESC
//     `, [userId]);

//     // Get review history
//     const [reviews] = await db.query(`
//       SELECT 
//         mrh.application_type,
//         mrh.previous_status,
//         mrh.new_status,
//         mrh.review_notes,
//         mrh.action_taken,
//         mrh.reviewed_at,
//         reviewer.username as reviewer_name
//       FROM membership_review_history mrh
//       LEFT JOIN users reviewer ON mrh.reviewer_id = reviewer.id
//       WHERE mrh.user_id = ?
//       ORDER BY mrh.reviewed_at DESC
//     `, [userId]);

//     res.json({
//       applications: history,
//       reviews
//     });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to get application history' });
//   }
// };

// // ENHANCED: Optimized Pending Applications with Filters
// export const getPendingApplications = async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 20, 
//       status = 'pending', 
//       stage = 'initial',
//       sortBy = 'submitted_at',
//       sortOrder = 'ASC',
//       search = ''
//     } = req.query;
    
//     const offset = (page - 1) * limit;
    
//     // Build dynamic WHERE clause
//     let whereClause = 'WHERE sl.approval_status = ? AND sl.application_type = ?';
//     let queryParams = [status, stage === 'initial' ? 'initial_application' : 'full_membership'];
    
//     if (search) {
//       whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)';
//       queryParams.push(`%${search}%`, `%${search}%`);
//     }
    
//     // Use the pending applications view for better performance
//     const viewName = stage === 'initial' ? 'pending_initial_applications' : 'pending_full_memberships';
    
//     const [applications] = await db.query(`
//       SELECT * FROM ${viewName}
//       ${search ? `WHERE username LIKE ? OR email LIKE ?` : ''}
//       ORDER BY ${sortBy} ${sortOrder}
//       LIMIT ? OFFSET ?
//     `, search ? [`%${search}%`, `%${search}%`, parseInt(limit), offset] : [parseInt(limit), offset]);

//     const [countResult] = await db.query(`
//       SELECT COUNT(*) as total FROM ${viewName}
//       ${search ? `WHERE username LIKE ? OR email LIKE ?` : ''}
//     `, search ? [`%${search}%`, `%${search}%`] : []);

//     res.json({
//       applications,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: countResult[0].total,
//         totalPages: Math.ceil(countResult[0].total / limit)
//       },
//       filters: { status, stage, sortBy, sortOrder, search }
//     });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to get pending applications' });
//   }
// };

// // NEW: Bulk Approve Applications
// export const bulkApproveApplications = async (req, res) => {
//   try {
//     const { userIds, action, adminNotes } = req.body;
//     const reviewerId = req.user.id;
    
//     if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
//       throw new CustomError('User IDs are required', 400);
//     }
    
//     if (!['approve', 'reject'].includes(action)) {
//       throw new CustomError('Invalid action', 400);
//     }
    
//     const status = action === 'approve' ? 'approved' : 'rejected';
//     const newStage = action === 'approve' ? 'pre_member' : 'applicant';
//     const newMemberStatus = action === 'approve' ? 'granted' : 'rejected';
    
//     // Use transaction for bulk operations
//     await db.beginTransaction();
    
//     try {
//       // Update surveylog entries
//       const placeholders = userIds.map(() => '?').join(',');
//       await db.query(`
//         UPDATE surveylog 
//         SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
//         WHERE CAST(user_id AS UNSIGNED) IN (${placeholders}) AND application_type = 'initial_application'
//       `, [status, adminNotes, reviewerId, ...userIds]);
      
//       // Update user statuses
//       await db.query(`
//         UPDATE users 
//         SET membership_stage = ?, is_member = ?
//         WHERE id IN (${placeholders})
//       `, [newStage, newMemberStatus, ...userIds]);
      
//       // Get user details for notifications
//       const [users] = await db.query(`
//         SELECT id, username, email FROM users WHERE id IN (${placeholders})
//       `, userIds);
      
//       // Send notification emails
//       const emailTemplate = action === 'approve' ? 'initial_application_approved' : 'initial_application_rejected';
//       const emailPromises = users.map(user => 
//         sendEmail(user.email, emailTemplate, {
//           USERNAME: user.username,
//           ADMIN_NOTES: adminNotes || '',
//           REVIEW_DATE: new Date().toLocaleDateString()
//         })
//       );
      
//       await Promise.all(emailPromises);
//       await db.commit();
      
//       res.json({
//         message: `Successfully ${action}ed ${userIds.length} applications`,
//         processedCount: userIds.length
//       });
//     } catch (error) {
//       await db.rollback();
//       throw error;
//     }
//   } catch (error) {
//     res.status(error.statusCode || 500).json({
//       error: error.message || 'Failed to process bulk applications'
//     });
//   }
// };

// // NEW: Enhanced Membership Analytics
// export const getMembershipAnalytics = async (req, res) => {
//   try {
//     const { period = '30d', detailed = false } = req.query;
    
//     // Get data from the membership_stats view
//     const [statsData] = await db.query('SELECT * FROM membership_stats');
    
//     // Get conversion funnel data
//     const [funnelData] = await db.query(`
//       SELECT 
//         COUNT(*) as total_registrations,
//         COUNT(CASE WHEN membership_stage != 'none' THEN 1 END) as started_application,
//         COUNT(CASE WHEN membership_stage = 'pre_member' OR membership_stage = 'member' THEN 1 END) as approved_initial,
//         COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members
//       FROM users
//     `);
    
//     // Get time-series data for the chart
//     const [timeSeriesData] = await db.query(`
//       SELECT 
//         DATE(createdAt) as date,
//         COUNT(*) as registrations,
//         COUNT(CASE WHEN membership_stage = 'pre_member' OR membership_stage = 'member' THEN 1 END) as approvals
//       FROM users 
//       WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//       GROUP BY DATE(createdAt)
//       ORDER BY date ASC
//     `);
    
//     let detailedAnalytics = {};
//     if (detailed === 'true') {
//       // Get detailed breakdown by demographics, classes, etc.
//       const [classBreakdown] = await db.query(`
//         SELECT 
//           c.class_type,
//           COUNT(DISTINCT ucm.user_id) as member_count
//         FROM user_class_memberships ucm
//         JOIN classes c ON ucm.class_id = c.class_id
//         JOIN users u ON ucm.user_id = u.id
//         WHERE u.membership_stage IN ('pre_member', 'member')
//         GROUP BY c.class_type
//       `);
      
//       detailedAnalytics = { classBreakdown };
//     }
    
//     res.json({
//       overview: statsData,
//       conversionFunnel: funnelData[0],
//       timeSeries: timeSeriesData,
//       ...detailedAnalytics
//     });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to get membership analytics' });
//   }
// };

// // NEW: Export Membership Data
// export const exportMembershipData = async (req, res) => {
//   try {
//     const { format = 'csv', filters = {} } = req.query;
    
//     // Use the admin_membership_overview view for comprehensive data
//     const [membershipData] = await db.query(`
//       SELECT 
//         id,
//         username,
//         email,
//         membership_stage,
//         initial_status,
//         initial_approval_status,
//         initial_submitted,
//         full_application_status,
//         full_submitted,
//         user_created
//       FROM admin_membership_overview
//       ORDER BY user_created DESC
//     `);
    
//     if (format === 'csv') {
//       // Convert to CSV format
//       const csv = convertToCSV(membershipData);
//       res.setHeader('Content-Type', 'text/csv');
//       res.setHeader('Content-Disposition', 'attachment; filename="membership_data.csv"');
//       res.send(csv);
//     } else {
//       res.json({
//         data: membershipData,
//         exportedAt: new Date().toISOString(),
//         totalRecords: membershipData.length
//       });
//     }
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to export membership data' });
//   }
// };

// // Helper function to convert data to CSV
// const convertToCSV = (data) => {
//   if (!data.length) return '';
  
//   const headers = Object.keys(data[0]).join(',');
//   const rows = data.map(row => 
//     Object.values(row).map(value => 
//       typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
//     ).join(',')
//   );
  
//   return [headers, ...rows].join('\n');
// };

// // // ENHANCED: Submit Initial Application with better validation
// // export const submitInitialApplication = async (req, res) => {
// //   try {
// //     const { answers, applicationTicket } = req.body;
// //     const userId = req.user.id;

// //     // Enhanced validation
// //     if (!answers || !Array.isArray(answers) || answers.length === 0) {
// //       throw new CustomError('Application answers are required', 400);
// //     }

// //     // Check if already submitted using the membership status procedure
// //     const [statusResult] = await db.query('CALL GetCompleteMembershipStatus(?)', [userId]);
// //     const status = statusResult[0][0];
    
// //     if (status.initial_application_status !== 'not_submitted') {
// //       throw new CustomError('Application already submitted', 400);
// //     }

// //     // Insert survey response with proper user_id handling
// //     await db.query(
// //       `INSERT INTO surveylog (user_id, answers, application_type, approval_status, createdAt) 
// //        VALUES (?, ?, 'initial_application', 'pending', NOW())`,
// //       [userId.toString(), JSON.stringify(answers)]
// //     );

// //     // Update user with application ticket if provided
// //     if (applicationTicket) {
// //       await db.query(
// //         'UPDATE users SET application_ticket = ? WHERE id = ?',
// //         [applicationTicket, userId]
// //       );
// //     }

// //     // Send confirmation email
// //     const [user] = await db.query('SELECT username, email FROM users WHERE id = ?', [userId]);
// //     await sendEmail(user[0].email, 'initial_application_submitted', {
// //       USERNAME: user[0].username,
// //       APPLICATION_TICKET: applicationTicket || 'AUTO-GENERATED',
// //       SUBMISSION_DATE: new Date().toLocaleDateString()
// //     });

// //     res.status(201).json({
// //       message: 'Application submitted successfully',
// //       applicationTicket: applicationTicket || 'AUTO-GENERATED',
// //       nextSteps: [
// //         'Your application is now under review',
// //         'You will receive an email notification within 3-5 business days',
// //         'Check your dashboard for status updates'
// //       ]
// //     });
// //   } catch (error) {
// //     res.status(error.statusCode || 500).json({ 
// //       error: error.message || 'Failed to submit application' 
// //     });
// //   }
// // };


// export const submitInitialApplication = async (req, res) => {
//   try {
//     console.log('🎯 submitInitialApplication called!');
//     console.log('📝 Request body:', req.body);
//     console.log('👤 User:', req.user);

//     const { answers, applicationTicket } = req.body;
//     const userId = req.user.id || req.user.user_id;

//     console.log('🔍 Extracted userId:', userId);

//     // Basic validation
//     if (!answers || !Array.isArray(answers) || answers.length === 0) {
//       console.error('❌ Invalid answers provided');
//       return res.status(400).json({ 
//         error: 'Application answers are required'
//       });
//     }

//     if (!userId) {
//       console.error('❌ No user ID found');
//       return res.status(401).json({ 
//         error: 'User authentication required'
//       });
//     }

//     // Check if user already has a pending/approved application (simplified check)
//     const [existingApplications] = await db.query(`
//       SELECT id, approval_status 
//       FROM surveylog 
//       WHERE CAST(user_id AS UNSIGNED) = ? 
//         AND application_type = 'initial_application'
//       LIMIT 1
//     `, [userId]);

//     if (existingApplications && existingApplications.length > 0) {
//       const existing = existingApplications[0];
//       if (existing.approval_status === 'pending') {
//         return res.status(400).json({ 
//           error: 'You already have a pending application'
//         });
//       }
//       if (existing.approval_status === 'approved') {
//         return res.status(400).json({ 
//           error: 'You already have an approved application'
//         });
//       }
//     }

//     console.log('✅ Validation passed, inserting application...');

//     // Insert survey response
//     const insertResult = await db.query(
//       `INSERT INTO surveylog (user_id, answers, application_type, approval_status, application_ticket, createdAt) 
//        VALUES (?, ?, 'initial_application', 'pending', ?, NOW())`,
//       [userId.toString(), JSON.stringify(answers), applicationTicket || null]
//     );

//     console.log('✅ Application inserted with ID:', insertResult[0]?.insertId);

//     // Update user status to applicant (if not already)
//     await db.query(
//       'UPDATE users SET membership_stage = ?, is_member = ? WHERE id = ?',
//       ['applicant', 'pending', userId]
//     );

//     console.log('✅ User status updated');

//     // Try to send email (but don't fail if it doesn't work)
//     try {
//       const [user] = await db.query('SELECT username, email FROM users WHERE id = ?', [userId]);
//       if (user && user[0]) {
//         // Note: This will only work if you have email service configured
//         console.log('📧 Would send email to:', user[0].email);
//       }
//     } catch (emailError) {
//       console.log('📧 Email not sent (service not configured):', emailError.message);
//     }

//     const response = {
//       success: true,
//       message: 'Application submitted successfully',
//       applicationTicket: applicationTicket || 'AUTO-GENERATED',
//       nextSteps: [
//         'Your application is now under review',
//         'You will receive an email notification within 3-5 business days',
//         'Check your dashboard for status updates'
//       ]
//     };

//     console.log('✅ Sending success response:', response);
//     res.status(201).json(response);

//   } catch (error) {
//     console.error('❌ submitInitialApplication error:', error);
//     res.status(500).json({ 
//       error: 'Failed to submit application',
//       details: error.message 
//     });
//   }
// };


// // export const checkApplicationStatus = async (req, res) => {
// //   try {
// //     const userId = req.user.id;
    
// //     // Use the stored procedure to get complete membership status
// //     const [membershipData] = await db.query('CALL GetCompleteMembershipStatus(?)', [userId]);
// //     const status = membershipData[0][0];

// //     // Get the latest application details from surveylog
// //     const [applicationDetails] = await db.query(`
// //       SELECT 
// //         sl.application_type,
// //         sl.approval_status,
// //         sl.createdAt as submitted_at,
// //         sl.reviewed_at,
// //         sl.admin_notes,
// //         sl.application_ticket,
// //         reviewer.username as reviewed_by
// //       FROM surveylog sl
// //       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
// //       WHERE CAST(sl.user_id AS UNSIGNED) = ?
// //       ORDER BY sl.createdAt DESC
// //       LIMIT 1
// //     `, [userId]);

// //     // Determine next steps based on current status
// //     let nextSteps = [];
// //     let canSubmitApplication = false;
    
// //     if (status.initial_application_status === 'not_submitted') {
// //       nextSteps = [
// //         'Complete your initial application survey',
// //         'Submit required documentation',
// //         'Wait for admin review (3-5 business days)'
// //       ];
// //       canSubmitApplication = true;
// //     } else if (status.initial_application_status === 'pending') {
// //       nextSteps = [
// //         'Your application is under review',
// //         'You will receive an email notification once reviewed',
// //         'Check back in 3-5 business days'
// //       ];
// //     } else if (status.initial_application_status === 'approved') {
// //       if (status.membership_stage === 'pre_member' && !status.has_accessed_full_membership) {
// //         nextSteps = [
// //           'Congratulations! Your initial application was approved',
// //           'Learn about full membership benefits',
// //           'Access your pre-member dashboard'
// //         ];
// //       } else if (status.full_membership_application_status === 'not_submitted') {
// //         nextSteps = [
// //           'You are eligible for full membership',
// //           'Submit your full membership application',
// //           'Complete additional requirements if any'
// //         ];
// //       } else if (status.full_membership_application_status === 'pending') {
// //         nextSteps = [
// //           'Your full membership application is under review',
// //           'Final review process is in progress',
// //           'You will be notified of the decision soon'
// //         ];
// //       } else if (status.membership_stage === 'member') {
// //         nextSteps = [
// //           'Welcome! You are now a full member',
// //           'Access all member benefits and resources',
// //           'Participate in member-exclusive activities'
// //         ];
// //       }
// //     } else if (status.initial_application_status === 'rejected') {
// //       nextSteps = [
// //         'Your application was not approved',
// //         'Review admin feedback below',
// //         'You may resubmit after addressing the concerns'
// //       ];
// //       canSubmitApplication = true;
// //     }

// //     // Calculate progress percentage
// //     let progressPercentage = 0;
// //     if (status.membership_stage === 'applicant') {
// //       progressPercentage = status.initial_application_status === 'not_submitted' ? 0 : 25;
// //     } else if (status.membership_stage === 'pre_member') {
// //       progressPercentage = status.full_membership_application_status === 'not_submitted' ? 50 : 75;
// //     } else if (status.membership_stage === 'member') {
// //       progressPercentage = 100;
// //     }

// //     res.json({
// //       success: true,
// //       currentStatus: {
// //         membership_stage: status.membership_stage,
// //         initial_application_status: status.initial_application_status,
// //         full_membership_application_status: status.full_membership_application_status,
// //         is_member: status.is_member,
// //         progressPercentage
// //       },
// //       applicationDetails: applicationDetails[0] || null,
// //       nextSteps,
// //       canSubmitApplication,
// //       timeline: {
// //         registered: status.user_created,
// //         initialSubmitted: status.initial_application_submitted,
// //         initialReviewed: applicationDetails[0]?.reviewed_at || null,
// //         fullMembershipAccessed: status.full_membership_accessed,
// //         fullMembershipSubmitted: status.full_membership_application_submitted
// //       }
// //     });

// //   } catch (error) {
// //     console.error('Error checking application status:', error);
// //     res.status(500).json({ 
// //       success: false,
// //       error: 'Failed to check application status',
// //       message: 'Please try again later or contact support if the issue persists'
// //     });
// //   }
// // };

// export const checkApplicationStatus = async (req, res) => {
//   try {
//     const userId = req.user.id;
    
//     console.log('🔍 checkApplicationStatus called for userId:', userId);
    
//     // Get user's current status
//     const [users] = await db.query(`
//       SELECT 
//         id,
//         username,
//         email,
//         membership_stage,
//         is_member,
//         role,
//         createdAt
//       FROM users 
//       WHERE id = ?
//     `, [userId]);

//     if (!users || users.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'User not found'
//       });
//     }

//     const user = users[0];
//     console.log('👤 User found:', user);

//     // Determine application status based on membership_stage
//     let applicationStatus = 'not_submitted';
//     let canSubmitApplication = true;
//     let nextSteps = [];

//     if (user.membership_stage === 'applicant') {
//       applicationStatus = 'pending';
//       canSubmitApplication = false;
//       nextSteps = [
//         'Your application is under review',
//         'You will receive an email notification once reviewed',
//         'Check back in 3-5 business days'
//       ];
//     } else if (user.membership_stage === 'pre_member') {
//       applicationStatus = 'approved';
//       canSubmitApplication = false;
//       nextSteps = [
//         'Congratulations! Your initial application was approved',
//         'You now have access to Towncrier content',
//         'Work towards full membership eligibility'
//       ];
//     } else if (user.membership_stage === 'member') {
//       applicationStatus = 'approved';
//       canSubmitApplication = false;
//       nextSteps = [
//         'Welcome! You are now a full member',
//         'Access all member benefits and resources',
//         'Participate in member-exclusive activities'
//       ];
//     } else {
//       // Default case - user hasn't submitted application yet
//       applicationStatus = 'not_submitted';
//       canSubmitApplication = true;
//       nextSteps = [
//         'Complete your initial application survey',
//         'Submit required information',
//         'Wait for admin review (3-5 business days)'
//       ];
//     }

//     // Calculate progress percentage
//     let progressPercentage = 0;
//     if (user.membership_stage === 'applicant') {
//       progressPercentage = 25;
//     } else if (user.membership_stage === 'pre_member') {
//       progressPercentage = 50;
//     } else if (user.membership_stage === 'member') {
//       progressPercentage = 100;
//     }

//     // Create response that matches what the frontend expects
//     const response = {
//       success: true,
//       currentStatus: {
//         membership_stage: user.membership_stage || 'none',
//         initial_application_status: applicationStatus,
//         full_membership_application_status: user.membership_stage === 'member' ? 'approved' : 'not_submitted',
//         is_member: user.is_member,
//         progressPercentage
//       },
//       applicationDetails: {
//         application_type: 'initial_application',
//         approval_status: applicationStatus,
//         submitted_at: user.createdAt,
//         reviewed_at: null,
//         admin_notes: null,
//         reviewed_by: null
//       },
//       nextSteps,
//       canSubmitApplication,
//       timeline: {
//         registered: user.createdAt,
//         initialSubmitted: user.createdAt,
//         initialReviewed: null,
//         fullMembershipAccessed: null,
//         fullMembershipSubmitted: null
//       }
//     };

//     console.log('✅ Sending response:', response);
//     res.json(response);

//   } catch (error) {
//     console.error('❌ Error checking application status:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Failed to check application status',
//       message: 'Please try again later or contact support if the issue persists'
//     });
//   }
// };


// // Add these missing functions to your membershipControllers.js file

// // 1. Send Verification Code (SMS/Email)
// export const sendVerificationCode = async (req, res) => {
//   try {
//     const { email, phone, type = 'email' } = req.body;
    
//     if (!email && !phone) {
//       throw new CustomError('Email or phone number is required', 400);
//     }
    
//     // Generate 6-digit verification code
//     const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
//     // Store verification code in database
//     await db.query(`
//       INSERT INTO verification_codes (email, phone, code, type, expires_at, created_at) 
//       VALUES (?, ?, ?, ?, ?, NOW())
//       ON DUPLICATE KEY UPDATE 
//         code = VALUES(code), 
//         expires_at = VALUES(expires_at), 
//         attempts = 0,
//         created_at = NOW()
//     `, [email || null, phone || null, verificationCode, type, expiresAt]);
    
//     // Send verification code
//     if (type === 'email' && email) {
//       await sendEmail(email, 'verification_code', {
//         VERIFICATION_CODE: verificationCode,
//         EXPIRES_IN: '10 minutes'
//       });
//     } else if (type === 'sms' && phone) {
//       await sendSMS(phone, `Your Ikoota verification code is: ${verificationCode}. Valid for 10 minutes.`);
//     }
    
//     res.json({
//       success: true,
//       message: `Verification code sent to ${type === 'email' ? email : phone}`,
//       expiresIn: 600 // 10 minutes in seconds
//     });
    
//   } catch (error) {
//     res.status(error.statusCode || 500).json({
//       error: error.message || 'Failed to send verification code'
//     });
//   }
// };

// // 2. Register with Verification
// export const registerWithVerification = async (req, res) => {
//   try {
//     const { 
//       username, 
//       email, 
//       password, 
//       phone, 
//       verificationCode, 
//       verificationType = 'email' 
//     } = req.body;
    
//     // Validate required fields
//     if (!username || !email || !password || !verificationCode) {
//       throw new CustomError('All fields are required', 400);
//     }
    
//     // Verify the verification code
//     const [verificationResult] = await db.query(`
//       SELECT * FROM verification_codes 
//       WHERE ${verificationType === 'email' ? 'email' : 'phone'} = ? 
//         AND code = ? 
//         AND type = ? 
//         AND expires_at > NOW() 
//         AND attempts < 3
//     `, [verificationType === 'email' ? email : phone, verificationCode, verificationType]);
    
//     if (!verificationResult || verificationResult.length === 0) {
//       throw new CustomError('Invalid or expired verification code', 400);
//     }
    
//     // Check if user already exists
//     const [existingUser] = await db.query(
//       'SELECT id FROM users WHERE email = ? OR username = ?',
//       [email, username]
//     );
    
//     if (existingUser && existingUser.length > 0) {
//       throw new CustomError('User with this email or username already exists', 409);
//     }
    
//     // Hash password
//     const saltRounds = 12;
//     const passwordHash = await bcrypt.hash(password, saltRounds);
    
//     // Generate application ticket
//     const applicationTicket = generateApplicationTicket(username, email);
    
//     // Create user
//     const [result] = await db.query(`
//       INSERT INTO users (
//         username, 
//         email, 
//         password_hash, 
//         phone, 
//         membership_stage, 
//         is_member, 
//         application_ticket,
//         createdAt
//       ) VALUES (?, ?, ?, ?, 'applicant', 'pending', ?, NOW())
//     `, [username, email, passwordHash, phone || null, applicationTicket]);
    
//     const userId = result.insertId;
    
//     // Delete used verification code
//     await db.query(`
//       DELETE FROM verification_codes 
//       WHERE ${verificationType === 'email' ? 'email' : 'phone'} = ? AND code = ?
//     `, [verificationType === 'email' ? email : phone, verificationCode]);
    
//     // Generate JWT token
//     const token = jwt.sign(
//       { 
//         user_id: userId, 
//         username, 
//         email,
//         membership_stage: 'applicant',
//         is_member: 'pending',
//         role: 'user'
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );
    
//     // Send welcome email
//     await sendEmail(email, 'welcome_registration', {
//       USERNAME: username,
//       APPLICATION_TICKET: applicationTicket
//     });
    
//     res.status(201).json({
//       success: true,
//       message: 'Registration successful',
//       token,
//       user: {
//         id: userId,
//         username,
//         email,
//         membership_stage: 'applicant',
//         application_ticket: applicationTicket
//       },
//       redirectTo: '/application-survey'
//     });
    
//   } catch (error) {
//     res.status(error.statusCode || 500).json({
//       error: error.message || 'Registration failed'
//     });
//   }
// };

// // 3. Get Full Membership Status
// export const getFullMembershipStatus = async (req, res) => {
//   try {
//     const userId = req.user.id;
    
//     // Get comprehensive membership status
//     const [membershipData] = await db.query('CALL GetCompleteMembershipStatus(?)', [userId]);
//     const status = membershipData[0][0];
    
//     // Get full membership application details if exists
//     const [fullMembershipApp] = await db.query(`
//       SELECT 
//         sl.answers,
//         sl.approval_status,
//         sl.createdAt as submitted_at,
//         sl.reviewed_at,
//         sl.admin_notes,
//         reviewer.username as reviewed_by
//       FROM surveylog sl
//       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
//       WHERE CAST(sl.user_id AS UNSIGNED) = ? AND sl.application_type = 'full_membership'
//       ORDER BY sl.createdAt DESC
//       LIMIT 1
//     `, [userId]);
    
//     // Check eligibility for full membership
//     const isEligible = status.membership_stage === 'pre_member' && 
//                       status.initial_application_status === 'approved';
    
//     // Get requirements and benefits
//     const requirements = [
//       'Completed initial membership application',
//       'Active participation for at least 30 days',
//       'Attended at least 2 community events',
//       'Good standing with community guidelines'
//     ];
    
//     const benefits = [
//       'Access to exclusive member events',
//       'Voting rights in community decisions',
//       'Advanced class access',
//       'Mentorship opportunities',
//       'Priority support'
//     ];
    
//     res.json({
//       currentStatus: status,
//       fullMembershipApplication: fullMembershipApp[0] || null,
//       eligibility: {
//         isEligible,
//         canApply: isEligible && status.full_membership_application_status === 'not_submitted',
//         requirements,
//         benefits
//       },
//       nextSteps: isEligible ? [
//         'Review full membership benefits',
//         'Complete full membership application',
//         'Submit required documentation'
//       ] : [
//         'Complete initial membership process first'
//       ]
//     });
    
//   } catch (error) {
//     res.status(500).json({
//       error: 'Failed to get full membership status'
//     });
//   }
// };

// // 4. Log Full Membership Access
// export const logFullMembershipAccess = async (req, res) => {
//   try {
//     const userId = req.user.id;
    
//     // Insert or update access log
//     await db.query(`
//       INSERT INTO full_membership_access (user_id, first_accessed_at, last_accessed_at, access_count)
//       VALUES (?, NOW(), NOW(), 1)
//       ON DUPLICATE KEY UPDATE 
//         last_accessed_at = NOW(),
//         access_count = access_count + 1
//     `, [userId]);
    
//     // Get updated access info
//     const [accessInfo] = await db.query(`
//       SELECT first_accessed_at, last_accessed_at, access_count
//       FROM full_membership_access
//       WHERE user_id = ?
//     `, [userId]);
    
//     res.json({
//       success: true,
//       message: 'Access logged successfully',
//       accessInfo: accessInfo[0]
//     });
    
//   } catch (error) {
//     res.status(500).json({
//       error: 'Failed to log access'
//     });
//   }
// };

// // 5. Submit Full Membership Application
// export const submitFullMembershipApplication = async (req, res) => {
//   try {
//     const { answers, additionalDocuments } = req.body;
//     const userId = req.user.id;
    
//     // Validate input
//     if (!answers || !Array.isArray(answers) || answers.length === 0) {
//       throw new CustomError('Application answers are required', 400);
//     }
    
//     // Check eligibility
//     const [membershipData] = await db.query('CALL GetCompleteMembershipStatus(?)', [userId]);
//     const status = membershipData[0][0];
    
//     if (status.membership_stage !== 'pre_member') {
//       throw new CustomError('Not eligible for full membership application', 403);
//     }
    
//     if (status.full_membership_application_status !== 'not_submitted') {
//       throw new CustomError('Full membership application already submitted', 400);
//     }
    
//     // Generate application ticket
//     const [user] = await db.query('SELECT username, email FROM users WHERE id = ?', [userId]);
//     const applicationTicket = generateApplicationTicket(user[0].username + '-FULL', user[0].email);
    
//     // Submit application
//     await db.query(`
//       INSERT INTO surveylog (
//         user_id, 
//         answers, 
//         application_type, 
//         approval_status, 
//         application_ticket,
//         additional_data,
//         createdAt
//       ) VALUES (?, ?, 'full_membership', 'pending', ?, ?, NOW())
//     `, [
//       userId.toString(), 
//       JSON.stringify(answers), 
//       applicationTicket,
//       JSON.stringify({ additionalDocuments: additionalDocuments || [] })
//     ]);
    
//     // Send confirmation email
//     await sendEmail(user[0].email, 'full_membership_application_submitted', {
//       USERNAME: user[0].username,
//       APPLICATION_TICKET: applicationTicket,
//       SUBMISSION_DATE: new Date().toLocaleDateString()
//     });
    
//     res.status(201).json({
//       success: true,
//       message: 'Full membership application submitted successfully',
//       applicationTicket,
//       nextSteps: [
//         'Your application is now under review',
//         'Review process typically takes 5-7 business days',
//         'You will receive email notification once reviewed',
//         'Continue participating in community activities'
//       ]
//     });
    
//   } catch (error) {
//     res.status(error.statusCode || 500).json({
//       error: error.message || 'Failed to submit full membership application'
//     });
//   }
// };

// // 6. Update Application Status (Admin)
// export const updateApplicationStatus = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { status, adminNotes, notifyUser = true } = req.body;
//     const reviewerId = req.user.id;
    
//     if (!['approved', 'rejected', 'pending'].includes(status)) {
//       throw new CustomError('Invalid status', 400);
//     }
    
//     await db.beginTransaction();
    
//     try {
//       // Update surveylog
//       await db.query(`
//         UPDATE surveylog 
//         SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
//         WHERE CAST(user_id AS UNSIGNED) = ? AND application_type = 'initial_application'
//       `, [status, adminNotes, reviewerId, userId]);
      
//       // Update user status
//       const newStage = status === 'approved' ? 'pre_member' : 'applicant';
//       const memberStatus = status === 'approved' ? 'granted' : 'rejected';
      
//       await db.query(`
//         UPDATE users 
//         SET membership_stage = ?, is_member = ?
//         WHERE id = ?
//       `, [newStage, memberStatus, userId]);
      
//       // Log the review action
//       await db.query(`
//         INSERT INTO membership_review_history 
//         (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
//         VALUES (?, 'initial_application', 'pending', ?, ?, ?, NOW())
//       `, [userId, status, adminNotes, reviewerId]);
      
//       // Send notification if requested
//       if (notifyUser) {
//         const [user] = await db.query('SELECT username, email FROM users WHERE id = ?', [userId]);
//         const emailTemplate = status === 'approved' ? 'initial_application_approved' : 'initial_application_rejected';
        
//         await sendEmail(user[0].email, emailTemplate, {
//           USERNAME: user[0].username,
//           ADMIN_NOTES: adminNotes || '',
//           REVIEW_DATE: new Date().toLocaleDateString()
//         });
//       }
      
//       await db.commit();
      
//       res.json({
//         success: true,
//         message: `Application ${status} successfully`,
//         newStatus: {
//           membership_stage: newStage,
//           approval_status: status
//         }
//       });
      
//     } catch (error) {
//       await db.rollback();
//       throw error;
//     }
    
//   } catch (error) {
//     res.status(error.statusCode || 500).json({
//       error: error.message || 'Failed to update application status'
//     });
//   }
// };

// // 7. Get Pending Full Memberships (Admin)
// export const getPendingFullMemberships = async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 20, 
//       sortBy = 'submitted_at', 
//       sortOrder = 'ASC',
//       search = ''
//     } = req.query;
    
//     const offset = (page - 1) * limit;
    
//     let searchClause = '';
//     let searchParams = [];
    
//     if (search) {
//       searchClause = 'WHERE (u.username LIKE ? OR u.email LIKE ?)';
//       searchParams = [`%${search}%`, `%${search}%`];
//     }
    
//     const [applications] = await db.query(`
//       SELECT 
//         u.id as user_id,
//         u.username,
//         u.email,
//         sl.answers,
//         sl.createdAt as submitted_at,
//         sl.application_ticket,
//         sl.additional_data,
//         fma.first_accessed_at,
//         fma.access_count,
//         DATEDIFF(NOW(), sl.createdAt) as days_pending
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
//       ${searchClause}
//         AND sl.application_type = 'full_membership' 
//         AND sl.approval_status = 'pending'
//       ORDER BY ${sortBy} ${sortOrder}
//       LIMIT ? OFFSET ?
//     `, [...searchParams, parseInt(limit), offset]);
    
//     const [countResult] = await db.query(`
//       SELECT COUNT(*) as total
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       ${searchClause}
//         AND sl.application_type = 'full_membership' 
//         AND sl.approval_status = 'pending'
//     `, searchParams);
    
//     res.json({
//       applications,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: countResult[0].total,
//         totalPages: Math.ceil(countResult[0].total / limit)
//       }
//     });
    
//   } catch (error) {
//     res.status(500).json({
//       error: 'Failed to get pending full memberships'
//     });
//   }
// };

// // 8. Update Full Membership Status (Admin)
// export const updateFullMembershipStatus = async (req, res) => {
//   try {
//     const { applicationId } = req.params;
//     const { status, adminNotes, notifyUser = true } = req.body;
//     const reviewerId = req.user.id;
    
//     if (!['approved', 'rejected'].includes(status)) {
//       throw new CustomError('Invalid status', 400);
//     }
    
//     await db.beginTransaction();
    
//     try {
//       // Get application details
//       const [application] = await db.query(`
//         SELECT CAST(user_id AS UNSIGNED) as user_id 
//         FROM surveylog 
//         WHERE id = ? AND application_type = 'full_membership'
//       `, [applicationId]);
      
//       if (!application || application.length === 0) {
//         throw new CustomError('Application not found', 404);
//       }
      
//       const userId = application[0].user_id;
      
//       // Update surveylog
//       await db.query(`
//         UPDATE surveylog 
//         SET approval_status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ?
//         WHERE id = ?
//       `, [status, adminNotes, reviewerId, applicationId]);
      
//       // Update user to full member if approved
//       if (status === 'approved') {
//         await db.query(`
//           UPDATE users 
//           SET membership_stage = 'member', is_member = 'active'
//           WHERE id = ?
//         `, [userId]);
//       }
      
//       // Log the review
//       await db.query(`
//         INSERT INTO membership_review_history 
//         (user_id, application_type, previous_status, new_status, review_notes, reviewer_id, reviewed_at)
//         VALUES (?, 'full_membership', 'pending', ?, ?, ?, NOW())
//       `, [userId, status, adminNotes, reviewerId]);
      
//       // Send notification
//       if (notifyUser) {
//         const [user] = await db.query('SELECT username, email FROM users WHERE id = ?', [userId]);
//         const emailTemplate = status === 'approved' ? 'full_membership_approved' : 'full_membership_rejected';
        
//         await sendEmail(user[0].email, emailTemplate, {
//           USERNAME: user[0].username,
//           ADMIN_NOTES: adminNotes || '',
//           REVIEW_DATE: new Date().toLocaleDateString()
//         });
//       }
      
//       await db.commit();
      
//       res.json({
//         success: true,
//         message: `Full membership application ${status} successfully`
//       });
      
//     } catch (error) {
//       await db.rollback();
//       throw error;
//     }
    
//   } catch (error) {
//     res.status(error.statusCode || 500).json({
//       error: error.message || 'Failed to update full membership status'
//     });
//   }
// };

// // 9. Send Notification (Admin)
// export const sendNotification = async (req, res) => {
//   try {
//     const { 
//       recipients, // array of user IDs or 'all'
//       subject,
//       message,
//       type = 'email', // 'email', 'sms', 'both'
//       priority = 'normal' // 'low', 'normal', 'high'
//     } = req.body;
    
//     if (!subject || !message) {
//       throw new CustomError('Subject and message are required', 400);
//     }
    
//     let userList = [];
    
//     if (recipients === 'all') {
//       const [allUsers] = await db.query('SELECT id, username, email, phone FROM users');
//       userList = allUsers;
//     } else if (Array.isArray(recipients)) {
//       const placeholders = recipients.map(() => '?').join(',');
//       const [selectedUsers] = await db.query(
//         `SELECT id, username, email, phone FROM users WHERE id IN (${placeholders})`,
//         recipients
//       );
//       userList = selectedUsers;
//     } else {
//       throw new CustomError('Invalid recipients format', 400);
//     }
    
//     const sendPromises = [];
    
//     for (const user of userList) {
//       if ((type === 'email' || type === 'both') && user.email) {
//         sendPromises.push(
//           sendEmail(user.email, 'admin_notification', {
//             USERNAME: user.username,
//             SUBJECT: subject,
//             MESSAGE: message,
//             PRIORITY: priority
//           })
//         );
//       }
      
//       if ((type === 'sms' || type === 'both') && user.phone) {
//         sendPromises.push(
//           sendSMS(user.phone, `${subject}: ${message}`)
//         );
//       }
//     }
    
//     await Promise.all(sendPromises);
    
//     res.json({
//       success: true,
//       message: `Notification sent to ${userList.length} users`,
//       sentCount: userList.length
//     });
    
//   } catch (error) {
//     res.status(error.statusCode || 500).json({
//       error: error.message || 'Failed to send notification'
//     });
//   }
// };

// // 10. Send Membership Notification (Admin)
// export const sendMembershipNotification = async (req, res) => {
//   try {
//     const { 
//       membershipStage, // 'applicant', 'pre_member', 'member'
//       subject,
//       message,
//       type = 'email'
//     } = req.body;
    
//     if (!membershipStage || !subject || !message) {
//       throw new CustomError('Membership stage, subject and message are required', 400);
//     }
    
//     const [users] = await db.query(`
//       SELECT id, username, email, phone 
//       FROM users 
//       WHERE membership_stage = ?
//     `, [membershipStage]);
    
//     const sendPromises = [];
    
//     for (const user of users) {
//       if (type === 'email' && user.email) {
//         sendPromises.push(
//           sendEmail(user.email, 'membership_notification', {
//             USERNAME: user.username,
//             SUBJECT: subject,
//             MESSAGE: message,
//             MEMBERSHIP_STAGE: membershipStage
//           })
//         );
//       }
      
//       if (type === 'sms' && user.phone) {
//         sendPromises.push(
//           sendSMS(user.phone, `${subject}: ${message}`)
//         );
//       }
//     }
    
//     await Promise.all(sendPromises);
    
//     res.json({
//       success: true,
//       message: `Membership notification sent to ${users.length} ${membershipStage}s`,
//       sentCount: users.length
//     });
    
//   } catch (error) {
//     res.status(error.statusCode || 500).json({
//       error: error.message || 'Failed to send membership notification'
//     });
//   }
// };

// // 11. Get Membership Overview (Admin)
// export const getMembershipOverview = async (req, res) => {
//   try {
//     // Use the admin_membership_overview view if it exists, otherwise create the query
//     const [overview] = await db.query(`
//       SELECT 
//         u.id,
//         u.username,
//         u.email,
//         u.membership_stage,
//         u.is_member,
//         u.createdAt as user_created,
        
//         -- Initial Application Info
//         COALESCE(initial_app.approval_status, 'not_submitted') as initial_status,
//         initial_app.createdAt as initial_submitted,
//         initial_app.reviewed_at as initial_reviewed,
//         initial_reviewer.username as initial_reviewer,
        
//         -- Full Membership Info  
//         COALESCE(full_app.approval_status, 'not_submitted') as full_status,
//         full_app.createdAt as full_submitted,
//         full_app.reviewed_at as full_reviewed,
//         full_reviewer.username as full_reviewer,
        
//         -- Access Info
//         fma.first_accessed_at as full_membership_accessed,
//         fma.access_count
        
//       FROM users u
//       LEFT JOIN surveylog initial_app ON u.id = CAST(initial_app.user_id AS UNSIGNED) 
//         AND initial_app.application_type = 'initial_application'
//       LEFT JOIN users initial_reviewer ON initial_app.reviewed_by = initial_reviewer.id
//       LEFT JOIN surveylog full_app ON u.id = CAST(full_app.user_id AS UNSIGNED) 
//         AND full_app.application_type = 'full_membership'  
//       LEFT JOIN users full_reviewer ON full_app.reviewed_by = full_reviewer.id
//       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
//       ORDER BY u.createdAt DESC
//     `);
    
//     // Get summary statistics
//     const [stats] = await db.query(`
//       SELECT 
//         COUNT(*) as total_users,
//         COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as applicants,
//         COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as pre_members,
//         COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as full_members,
//         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month,
//         COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week
//       FROM users
//     `);
    
//     res.json({
//       overview,
//       summary: stats[0]
//     });
    
//   } catch (error) {
//     res.status(500).json({
//       error: 'Failed to get membership overview'
//     });
//   }
// };

// // 12. Get Membership Stats (Admin)
// export const getMembershipStats = async (req, res) => {
//   try {
//     // Get comprehensive statistics
//     const [membershipStats] = await db.query(`
//       SELECT 
//         COUNT(*) as total_users,
//         COUNT(CASE WHEN membership_stage = 'applicant' THEN 1 END) as total_applicants,
//         COUNT(CASE WHEN membership_stage = 'pre_member' THEN 1 END) as total_pre_members,
//         COUNT(CASE WHEN membership_stage = 'member' THEN 1 END) as total_members,
        
//         -- Application stats
//         COUNT(CASE WHEN EXISTS(
//           SELECT 1 FROM surveylog sl 
//           WHERE CAST(sl.user_id AS UNSIGNED) = users.id 
//             AND sl.application_type = 'initial_application'
//         ) THEN 1 END) as submitted_initial_applications,
        
//         COUNT(CASE WHEN EXISTS(
//           SELECT 1 FROM surveylog sl 
//           WHERE CAST(sl.user_id AS UNSIGNED) = users.id 
//             AND sl.application_type = 'initial_application' 
//             AND sl.approval_status = 'pending'
//         ) THEN 1 END) as pending_initial_applications,
        
//         COUNT(CASE WHEN EXISTS(
//           SELECT 1 FROM surveylog sl 
//           WHERE CAST(sl.user_id AS UNSIGNED) = users.id 
//             AND sl.application_type = 'full_membership'
//         ) THEN 1 END) as submitted_full_applications,
        
//         COUNT(CASE WHEN EXISTS(
//           SELECT 1 FROM surveylog sl 
//           WHERE CAST(sl.user_id AS UNSIGNED) = users.id 
//             AND sl.application_type = 'full_membership' 
//             AND sl.approval_status = 'pending'
//         ) THEN 1 END) as pending_full_applications
        
//       FROM users
//     `);
    
//     // Get time-based registration stats
//     const [registrationTrends] = await db.query(`
//       SELECT 
//         DATE(createdAt) as date,
//         COUNT(*) as registrations
//       FROM users 
//       WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//       GROUP BY DATE(createdAt)
//       ORDER BY date ASC
//     `);
    
//     // Get approval rates
//     const [approvalRates] = await db.query(`
//       SELECT 
//         application_type,
//         COUNT(*) as total_applications,
//         COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
//         COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected,
//         COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending,
//         ROUND(COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) * 100.0 / COUNT(*), 2) as approval_rate
//       FROM surveylog
//       GROUP BY application_type
//     `);
    
//     // Get processing time stats
//     const [processingTimes] = await db.query(`
//       SELECT 
//         application_type,
//         AVG(DATEDIFF(reviewed_at, createdAt)) as avg_processing_days,
//         MIN(DATEDIFF(reviewed_at, createdAt)) as min_processing_days,
//         MAX(DATEDIFF(reviewed_at, createdAt)) as max_processing_days
//       FROM surveylog
//       WHERE reviewed_at IS NOT NULL
//       GROUP BY application_type
//     `);
    
//     res.json({
//       membershipStats: membershipStats[0],
//       registrationTrends,
//       approvalRates,
//       processingTimes
//     });
    
//   } catch (error) {
//     res.status(500).json({
//       error: 'Failed to get membership statistics'
//     });
//   }
// };


