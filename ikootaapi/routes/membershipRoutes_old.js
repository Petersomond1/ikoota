// // ikootaapi/routes/membershipRoutes.js - MODULARIZED MASTER FILE
// // ===============================================
// // MAIN MEMBERSHIP ROUTES - MODULAR ARCHITECTURE
// // Imports and combines all modular route components
// // ===============================================

// import express from 'express';

// // Import all modular route components
// import userStatusRoutes from './userStatusRoutes.js';
// import fullMembershipRoutes from './fullMembershipRoutes.js';
// import adminApplicationRoutes from './adminApplicationRoutes.js';
// import analyticsRoutes from './analyticsRoutes.js';

// // Import remaining controller functions for legacy endpoints
// import { authenticate, cacheMiddleware } from '../middlewares/auth.middleware.js';
// import { 
//   requireAdmin, 
//   requireSuperAdmin,
//   validateRequest 
// } from '../controllers/membershipControllers_1.OLD.js/index.js';

// import {
//   submitInitialApplication,
//   updateApplicationAnswers,
//   withdrawApplication,
//   getApplicationRequirements
// } from '../controllers/membershipControllers_2.OLD.js/index.js';

// import {
//   sendNotification,
//   sendMembershipNotification,
//   searchUsers,
//   deleteUserAccount
// } from '../controllers/membershipControllers_3.OLD.js';

// const router = express.Router();

// // ===============================================
// // SECTION 1: MODULAR ROUTE MOUNTING
// // Mount all modular route components
// // ===============================================

// // Mount user status and basic operations
// router.use('/', userStatusRoutes);

// // Mount full membership application routes
// router.use('/', fullMembershipRoutes);

// // Mount admin application management routes
// router.use('/', adminApplicationRoutes);

// // Mount analytics and reporting routes
// router.use('/', analyticsRoutes);

// // ===============================================
// // SECTION 2: INITIAL APPLICATION ROUTES
// // Routes for initial membership application process
// // ===============================================

// // Submit initial application
// router.post('/survey/submit-application', authenticate, submitInitialApplication);
// router.post('/application', authenticate, submitInitialApplication);
// router.post('/submit-initial-application', authenticate, submitInitialApplication);

// // Application management
// router.put('/application/update-answers', authenticate, updateApplicationAnswers);
// router.put('/application/answers', authenticate, updateApplicationAnswers);
// router.post('/application/withdraw', authenticate, withdrawApplication);
// router.delete('/application', authenticate, withdrawApplication);

// // Application information
// router.get('/application/requirements', authenticate, getApplicationRequirements);
// router.get('/application/info', authenticate, getApplicationRequirements);
// router.get('/application-requirements', authenticate, getApplicationRequirements);

// // Validated application routes
// router.put('/application/answers/validated',
//   authenticate,
//   validateRequest(['answers']),
//   updateApplicationAnswers
// );

// router.post('/application/withdraw/validated',
//   authenticate,
//   validateRequest(['reason']),
//   withdrawApplication
// );

// // ===============================================
// // SECTION 3: COMMUNICATION & NOTIFICATIONS
// // Admin notification and communication routes
// // ===============================================

// // General notifications
// router.post('/admin/send-notification', authenticate, requireAdmin, sendNotification);
// router.post('/admin/notifications/send', authenticate, requireAdmin, sendNotification);

// // Membership-specific notifications
// router.post('/admin/send-membership-notification', authenticate, requireAdmin, sendMembershipNotification);
// router.post('/admin/notifications/membership', authenticate, requireAdmin, sendMembershipNotification);

// // Validated notification routes
// router.post('/admin/notifications/validated-send', 
//   authenticate, 
//   requireAdmin,
//   validateRequest(['recipients', 'subject', 'message']),
//   sendNotification
// );

// // ===============================================
// // SECTION 4: USER MANAGEMENT ROUTES
// // User search and account management
// // ===============================================

// // User management
// router.get('/admin/search-users', authenticate, requireAdmin, searchUsers);
// router.delete('/user/account', authenticate, deleteUserAccount);

// // ===============================================
// // SECTION 5: ENHANCED ERROR HANDLING & LOGGING
// // Comprehensive error handling for all routes
// // ===============================================

// // Request logging middleware for all membership routes
// router.use((req, res, next) => {
//   const startTime = Date.now();
  
//   // Log request in development
//   if (process.env.NODE_ENV === 'development') {
//     console.log(`🛣️ ${req.method} ${req.path}`, {
//       user: req.user?.id || 'unauthenticated',
//       timestamp: new Date().toISOString(),
//       ip: req.ip
//     });
//   }
  
//   // Log response time
//   const originalSend = res.send;
//   res.send = function(data) {
//     const duration = Date.now() - startTime;
//     if (process.env.NODE_ENV === 'development') {
//       console.log(`✅ Response sent in ${duration}ms for ${req.method} ${req.path}`);
//     }
//     originalSend.call(this, data);
//   };
  
//   next();
// });

// // Enhanced 404 handler for membership routes
// router.use('*', (req, res) => {
//   console.warn(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  
//   res.status(404).json({
//     success: false,
//     error: 'Membership route not found',
//     path: req.path,
//     method: req.method,
//     message: 'The requested membership endpoint does not exist',
//     availableEndpoints: {
//       user: [
//         'GET /dashboard - User dashboard with comprehensive status',
//         'GET /status - Current membership status',
//         'GET /application/status - Application status check',
//         'POST /survey/submit-application - Submit initial application',
//         'GET /full-membership-status - Full membership application status',
//         'POST /submit-full-membership - Submit full membership application'
//       ],
//       admin: [
//         'GET /admin/pending-applications - Get pending applications',
//         'GET /admin/membership-overview - Membership overview dashboard',
//         'POST /admin/bulk-approve - Bulk approve applications',
//         'GET /admin/analytics - Advanced analytics and reporting'
//       ],
//       system: [
//         'GET /health - System health check',
//         'GET /test-simple - Simple connectivity test',
//         'GET /admin/config - System configuration'
//       ]
//     },
//     suggestion: 'Check the API documentation for correct endpoint paths',
//     timestamp: new Date().toISOString()
//   });
// });

// // Enhanced global error handler for membership routes
// router.use((error, req, res, next) => {
//   const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
//   console.error('❌ Membership route error:', {
//     errorId,
//     error: error.message,
//     stack: error.stack,
//     path: req.path,
//     method: req.method,
//     user: req.user?.id || 'not authenticated',
//     timestamp: new Date().toISOString()
//   });
  
//   // Categorize errors for better handling
//   let statusCode = error.statusCode || 500;
//   let errorType = 'server_error';
  
//   if (error.message.includes('validation') || error.message.includes('required')) {
//     statusCode = 400;
//     errorType = 'validation_error';
//   } else if (error.message.includes('authentication') || error.message.includes('token')) {
//     statusCode = 401;
//     errorType = 'authentication_error';
//   } else if (error.message.includes('permission') || error.message.includes('admin') || error.message.includes('access denied')) {
//     statusCode = 403;
//     errorType = 'authorization_error';
//   } else if (error.message.includes('not found')) {
//     statusCode = 404;
//     errorType = 'not_found_error';
//   } else if (error.message.includes('database') || error.message.includes('connection') || error.message.includes('MySQL')) {
//     statusCode = 503;
//     errorType = 'database_error';
//   } else if (error.message.includes('timeout')) {
//     statusCode = 504;
//     errorType = 'timeout_error';
//   }
  
//   const errorResponse = {
//     success: false,
//     error: error.message || 'Internal server error',
//     errorType,
//     errorId,
//     path: req.path,
//     method: req.method,
//     timestamp: new Date().toISOString()
//   };
  
//   // Add debug info in development
//   if (process.env.NODE_ENV === 'development') {
//     errorResponse.debug = {
//       stack: error.stack,
//       user: req.user
//     };
//   }
  
//   res.status(statusCode).json(errorResponse);
// });

// // ===============================================
// // SECTION 6: ROUTE SUMMARY & DOCUMENTATION
// // Development logging and route documentation
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   console.log('\n🛣️ MODULAR MEMBERSHIP ROUTES LOADED:');
//   console.log('================================================================================');
//   console.log('✅ ARCHITECTURE: Modular route organization with separation of concerns');
//   console.log('✅ COMPONENTS: 5 modular route files + 3 service layers');
//   console.log('✅ MAINTAINABILITY: Each component handles specific functionality');
//   console.log('✅ SCALABILITY: Easy to add new features without affecting existing code');
//   console.log('================================================================================');
  
//   console.log('\n📁 MODULAR COMPONENTS:');
//   console.log('   1. userStatusRoutes.js      - User dashboard, status, health checks');
//   console.log('   2. fullMembershipRoutes.js  - Full membership applications');
//   console.log('   3. adminApplicationRoutes.js - Admin application management');
//   console.log('   4. analyticsRoutes.js       - Analytics, stats, data export');
//   console.log('   5. membershipRoutes.js      - Master file (this file)');
  
//   console.log('\n🔧 SERVICE LAYERS:');
//   console.log('   • analyticsService.js       - Analytics data processing');
//   console.log('   • membershipServices.js     - Core membership operations');
//   console.log('   • userStatusController.js   - User status management');
  
//   console.log('\n📊 TOTAL FUNCTIONALITY:');
//   console.log('   • 70+ endpoints across all modules');
//   console.log('   • Complete membership lifecycle management');
//   console.log('   • Comprehensive admin tools and analytics');
//   console.log('   • Proper error handling and logging');
//   console.log('   • Database transaction safety');
  
//   console.log('\n🔄 BENEFITS OF MODULAR ARCHITECTURE:');
//   console.log('   • Easier maintenance and debugging');
//   console.log('   • Better code organization and readability');
//   console.log('   • Reduced file sizes for better performance');
//   console.log('   • Independent testing of components');
//   console.log('   • Simplified team collaboration');
  
//   console.log('================================================================================\n');
// }

// // ===============================================
// // EXPORT ROUTER
// // ===============================================

// export default router;







// // ikootaapi/routes/membershipRoutes.js - COMPLETE AND PROPERLY ARRANGED
// // ===============================================
// // COMPREHENSIVE MEMBERSHIP ROUTES - ALL FUNCTIONALITIES INCLUDED
// // Fixed: Missing imports, incomplete endpoints, proper database handling
// // ===============================================

// import express from 'express';
// import { 
//   // ✅ CORE USER FUNCTIONS - Dashboard & Status
//   getUserDashboard,
//   checkApplicationStatus,
//   getApplicationHistory,
//   getUserPermissions,
//   getCurrentMembershipStatus,
//   getUserByIdFixed,
//   testUserLookup,
  
//   // ✅ APPLICATION MANAGEMENT - Initial & Full Membership
//   submitInitialApplication,
//   updateApplicationAnswers,
//   withdrawApplication,
//   getApplicationRequirements,
//   getFullMembershipStatus,
//   submitFullMembershipApplication,
//   logFullMembershipAccess,
  
//   // ✅ ADMIN FUNCTIONS - Application Review & Management
//   getPendingApplications,
//   updateApplicationStatus,
//   bulkApproveApplications,
//   getPendingFullMemberships,
//   updateFullMembershipStatus,
//   getAllReports,
//   approvePreMemberApplication,
//   declinePreMemberApplication,
//   getAvailableMentors,
//   getAvailableClasses,
  
//   // ✅ ANALYTICS & REPORTING
//   getMembershipAnalytics,
//   getMembershipOverview,
//   getMembershipStats,
//   exportMembershipData,
  
//   // ✅ COMMUNICATION & NOTIFICATIONS
//   sendNotification,
//   sendMembershipNotification,
  
//   // ✅ SYSTEM & UTILITIES
//   healthCheck,
//   getSystemConfig,
//   deleteUserAccount,
//   searchUsers,
  
//   // ✅ MIDDLEWARE & VALIDATION
//   validateRequest,
//   requireAdmin,
//   requireSuperAdmin
// } from '../controllers/membershipControllers.js';

// import { verifyApplicationStatusConsistency } from '../controllers/membershipControllers_2.js';
// import { authenticate, cacheMiddleware } from '../middlewares/auth.middleware.js';
// import db from '../config/db.js';

// const router = express.Router();

// // ===============================================
// // ✅ SECTION 1: DEVELOPMENT & TESTING ROUTES
// // Must be defined early to avoid conflicts
// // ===============================================

// router.get('/test-simple', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Membership routes are working!',
//     timestamp: new Date().toISOString(),
//     path: req.path,
//     method: req.method,
//     environment: process.env.NODE_ENV || 'development'
//   });
// });

// router.get('/test-auth', authenticate, (req, res) => {
//   res.json({
//     success: true,
//     message: 'Authentication is working!',
//     user: {
//       id: req.user.id,
//       username: req.user.username,
//       role: req.user.role
//     },
//     timestamp: new Date().toISOString()
//   });
// });

// router.get('/test-dashboard', authenticate, async (req, res) => {
//   try {
//     console.log('🧪 Test dashboard route called');
//     console.log('🧪 User:', req.user);
    
//     res.json({
//       success: true,
//       message: 'Test dashboard route working',
//       user: req.user,
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error('🧪 Test dashboard error:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Test dashboard failed',
//       details: error.message 
//     });
//   }
// });

// // Debug user lookup routes
// router.get('/test-user-lookup/:userId', authenticate, requireAdmin, testUserLookup);
// router.get('/test-user-lookup', authenticate, testUserLookup);

// // Development admin setup (ONLY for development)
// if (process.env.NODE_ENV === 'development') {
//   router.post('/dev/setup-admin/:userId', authenticate, async (req, res) => {
//     try {
//       const { userId } = req.params;
      
//       if (!['admin', 'super_admin'].includes(req.user.role)) {
//         return res.status(403).json({ 
//           success: false,
//           error: 'Admin access required' 
//         });
//       }
      
//       console.log('🛠️ Setting up admin account for development...');
      
//       const [result] = await db.query(`
//         UPDATE users 
//         SET 
//           membership_stage = 'member',
//           is_member = 'member',
//           updatedAt = NOW()
//         WHERE id = ?
//       `, [userId]);
      
//       res.json({
//         success: true,
//         message: 'Admin account setup completed for development',
//         userId: userId,
//         newStatus: {
//           membership_stage: 'member',
//           is_member: 'member'
//         },
//         affectedRows: result.affectedRows
//       });
      
//     } catch (error) {
//       console.error('❌ Dev setup error:', error);
//       res.status(500).json({ 
//         success: false,
//         error: 'Failed to setup admin account',
//         details: error.message 
//       });
//     }
//   });

//   router.get('/debug/status-consistency', authenticate, verifyApplicationStatusConsistency);
// }

// // ===============================================
// // ✅ SECTION 2: SYSTEM & HEALTH ROUTES
// // ===============================================

// router.get('/health', healthCheck);

// // System configuration (Admin only)
// router.get('/admin/config', authenticate, requireAdmin, getSystemConfig);

// // Super admin configuration
// router.get('/admin/super/config', authenticate, requireSuperAdmin, getSystemConfig);

// // ===============================================
// // ✅ SECTION 3: USER DASHBOARD & STATUS ROUTES
// // Core user-facing functionality
// // ===============================================

// // Primary dashboard
// router.get('/dashboard', authenticate, getUserDashboard);

// // Application and membership status
// router.get('/status', authenticate, getCurrentMembershipStatus);
// router.get('/application/status', authenticate, checkApplicationStatus);
// router.get('/survey/check-status', authenticate, checkApplicationStatus);

// // User history and permissions
// router.get('/application-history', authenticate, getApplicationHistory);
// router.get('/history', authenticate, getApplicationHistory);
// router.get('/permissions', authenticate, getUserPermissions);

// // ===============================================
// // ✅ SECTION 4: INITIAL APPLICATION ROUTES
// // Complete initial application lifecycle
// // ===============================================

// // Submit initial application
// router.post('/survey/submit-application', authenticate, submitInitialApplication);
// router.post('/application', authenticate, submitInitialApplication);
// router.post('/submit-initial-application', authenticate, submitInitialApplication);

// // Application management
// router.put('/application/update-answers', authenticate, updateApplicationAnswers);
// router.put('/application/answers', authenticate, updateApplicationAnswers);
// router.post('/application/withdraw', authenticate, withdrawApplication);
// router.delete('/application', authenticate, withdrawApplication);

// // Application information
// router.get('/application/requirements', authenticate, getApplicationRequirements);
// router.get('/application/info', authenticate, getApplicationRequirements);
// router.get('/application-requirements', authenticate, getApplicationRequirements);

// // Validated application routes
// router.put('/application/answers/validated',
//   authenticate,
//   validateRequest(['answers']),
//   updateApplicationAnswers
// );

// router.post('/application/withdraw/validated',
//   authenticate,
//   validateRequest(['reason']),
//   withdrawApplication
// );

// // ===============================================
// // ✅ SECTION 5: FULL MEMBERSHIP ROUTES
// // Complete full membership application system
// // ===============================================

// // Get full membership status - Multiple endpoints for compatibility
// router.get('/full-membership-status/:userId', authenticate, async (req, res) => {
//   try {
//     const { userId } = req.params;
    
//     // Verify user can access this data (themselves or admin)
//     if (req.user.id !== parseInt(userId) && !['admin', 'super_admin'].includes(req.user.role)) {
//       return res.status(403).json({ 
//         success: false,
//         message: 'Access denied - can only view your own status' 
//       });
//     }

//     const query = `
//       SELECT 
//         fma.*,
//         u.username,
//         u.email,
//         u.membership_stage,
//         u.is_member,
//         u.full_membership_status,
//         u.full_membership_appliedAt,
//         u.full_membership_reviewedAt
//       FROM full_membership_applications fma
//       RIGHT JOIN users u ON fma.user_id = u.id
//       WHERE u.id = ?
//       ORDER BY fma.submittedAt DESC
//       LIMIT 1
//     `;

//     const [results] = await db.query(query, [userId]);
    
//     if (results.length === 0) {
//       return res.json({
//         success: true,
//         status: 'not_applied',
//         appliedAt: null,
//         reviewedAt: null,
//         ticket: null,
//         adminNotes: null
//       });
//     }

//     const application = results[0];
    
//     res.json({
//       success: true,
//       status: application.status || application.full_membership_status || 'not_applied',
//       appliedAt: application.submittedAt || application.full_membership_appliedAt,
//       reviewedAt: application.reviewedAt || application.full_membership_reviewedAt,
//       ticket: application.membership_ticket,
//       adminNotes: application.admin_notes,
//       answers: application.answers ? JSON.parse(application.answers) : null
//     });

//   } catch (error) {
//     console.error('❌ Error fetching membership application status:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// router.get('/full-membership-status', authenticate, getFullMembershipStatus);
// router.get('/membership/full-membership-status', authenticate, getFullMembershipStatus);
// router.get('/full-membership/status', authenticate, getFullMembershipStatus);

// // Submit full membership application
// router.post('/submit-full-membership', authenticate, async (req, res) => {
//   let connection = null;
  
//   try {
//     const { answers, membershipTicket, applicationType } = req.body;
//     const userId = req.user.id;

//     // Validate required fields
//     if (!answers || !membershipTicket) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Missing required fields: answers and membershipTicket are required' 
//       });
//     }

//     // Verify user is pre_member
//     const [userCheck] = await db.query(
//       'SELECT membership_stage, is_member, full_membership_status FROM users WHERE id = ?',
//       [userId]
//     );

//     if (userCheck.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'User not found' 
//       });
//     }

//     const user = userCheck[0];
    
//     // Check eligibility - must be pre_member
//     if (user.membership_stage !== 'pre_member') {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Only pre-members can apply for full membership',
//         currentStatus: {
//           membership_stage: user.membership_stage,
//           is_member: user.is_member
//         }
//       });
//     }

//     // Check for existing pending application
//     const [existingApp] = await db.query(
//       'SELECT id FROM full_membership_applications WHERE user_id = ? AND status = "pending"',
//       [userId]
//     );

//     if (existingApp.length > 0) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'You already have a pending membership application' 
//       });
//     }

//     // Get connection and begin transaction
//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     try {
//       // Insert application with standardized timestamp fields
//       const [insertResult] = await connection.query(`
//         INSERT INTO full_membership_applications 
//         (user_id, membership_ticket, answers, status, submittedAt, createdAt, updatedAt) 
//         VALUES (?, ?, ?, 'pending', NOW(), NOW(), NOW())
//       `, [userId, membershipTicket, JSON.stringify(answers)]);

//       // Update user table (application status, not membership level)
//       await connection.query(`
//         UPDATE users 
//         SET full_membership_status = 'pending',
//             full_membership_appliedAt = NOW(),
//             full_membership_ticket = ?,
//             updatedAt = NOW()
//         WHERE id = ?
//       `, [membershipTicket, userId]);

//       // Log the application for audit trail
//       await connection.query(`
//         INSERT INTO audit_logs (user_id, action, details, createdAt)
//         VALUES (?, 'membership_application_submitted', ?, NOW())
//       `, [userId, JSON.stringify({ 
//         ticket: membershipTicket, 
//         applicationId: insertResult.insertId,
//         applicationType: applicationType || 'standard'
//       })]);

//       await connection.commit();

//       res.status(201).json({
//         success: true,
//         message: 'Membership application submitted successfully',
//         data: {
//           applicationId: insertResult.insertId,
//           membershipTicket: membershipTicket,
//           status: 'pending'
//         }
//       });

//     } catch (error) {
//       await connection.rollback();
//       throw error;
//     }

//   } catch (error) {
//     console.error('❌ Error submitting membership application:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Failed to submit application',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// });

// router.post('/membership/submit-full-membership', authenticate, submitFullMembershipApplication);
// router.post('/full-membership/apply', authenticate, submitFullMembershipApplication);
// router.post('/submit-full-membership-application', authenticate, submitFullMembershipApplication);

// // Reapplication for declined applications
// router.post('/reapply-full-membership', authenticate, async (req, res) => {
//   let connection = null;
  
//   try {
//     const { answers, membershipTicket } = req.body;
//     const userId = req.user.id;

//     // Validate required fields
//     if (!answers || !membershipTicket) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Missing required fields: answers and membershipTicket are required' 
//       });
//     }

//     // Verify user can reapply
//     const [userCheck] = await db.query(
//       'SELECT membership_stage, is_member, full_membership_status FROM users WHERE id = ?',
//       [userId]
//     );

//     if (userCheck.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'User not found' 
//       });
//     }

//     const user = userCheck[0];
    
//     // Check if user is eligible to reapply
//     if (user.membership_stage !== 'pre_member' || user.full_membership_status !== 'declined') {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Only pre-members with declined applications can reapply',
//         currentStatus: {
//           membership_stage: user.membership_stage,
//           full_membership_status: user.full_membership_status
//         }
//       });
//     }

//     // Get connection and begin transaction
//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     try {
//       // Insert new application
//       const [insertResult] = await connection.query(`
//         INSERT INTO full_membership_applications 
//         (user_id, membership_ticket, answers, status, submittedAt, createdAt, updatedAt) 
//         VALUES (?, ?, ?, 'pending', NOW(), NOW(), NOW())
//       `, [userId, membershipTicket, JSON.stringify(answers)]);

//       // Update user status
//       await connection.query(`
//         UPDATE users 
//         SET full_membership_status = 'pending',
//             full_membership_appliedAt = NOW(),
//             full_membership_ticket = ?,
//             updatedAt = NOW()
//         WHERE id = ?
//       `, [membershipTicket, userId]);

//       // Log the reapplication
//       await connection.query(`
//         INSERT INTO audit_logs (user_id, action, details, createdAt)
//         VALUES (?, 'membership_reapplication_submitted', ?, NOW())
//       `, [userId, JSON.stringify({ 
//         ticket: membershipTicket, 
//         applicationId: insertResult.insertId 
//       })]);

//       await connection.commit();

//       res.status(201).json({
//         success: true,
//         message: 'Membership reapplication submitted successfully',
//         data: {
//           applicationId: insertResult.insertId,
//           membershipTicket: membershipTicket,
//           status: 'pending'
//         }
//       });

//     } catch (error) {
//       await connection.rollback();
//       throw error;
//     }

//   } catch (error) {
//     console.error('❌ Error submitting membership reapplication:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Failed to submit reapplication',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// });

// // Log full membership access
// router.post('/membership/log-full-membership-access', authenticate, logFullMembershipAccess);
// router.post('/full-membership/access', authenticate, logFullMembershipAccess);

// // ===============================================
// // ✅ SECTION 6: ADMIN APPLICATION MANAGEMENT
// // Complete admin review and management system
// // ===============================================

// // Get pending applications
// router.get('/admin/pending-applications', authenticate, requireAdmin, getPendingApplications);
// router.get('/admin/applications', authenticate, requireAdmin, getPendingApplications);

// // Admin endpoint to get all pending membership applications
// router.get('/admin/membership/applications', authenticate, requireAdmin, async (req, res) => {
//   try {
//     const { status = 'pending', limit = 50, offset = 0 } = req.query;

//     const query = `
//       SELECT 
//         fma.*,
//         u.username,
//         u.email,
//         u.first_name,
//         u.last_name,
//         u.membership_stage,
//         u.is_member,
//         reviewer.username as reviewer_name
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
//       WHERE fma.status = ?
//       ORDER BY fma.submittedAt DESC
//       LIMIT ? OFFSET ?
//     `;

//     const [applications] = await db.query(query, [status, parseInt(limit), parseInt(offset)]);
    
//     // Get total count for pagination
//     const countQuery = `
//       SELECT COUNT(*) as total 
//       FROM full_membership_applications fma
//       WHERE fma.status = ?
//     `;
    
//     const [countResult] = await db.query(countQuery, [status]);
//     const total = countResult[0].total;

//     res.json({
//       success: true,
//       data: {
//         applications: applications.map(app => ({
//           ...app,
//           answers: app.answers ? JSON.parse(app.answers) : null
//         })),
//         pagination: {
//           total,
//           limit: parseInt(limit),
//           offset: parseInt(offset),
//           hasMore: (parseInt(offset) + parseInt(limit)) < total
//         }
//       }
//     });

//   } catch (error) {
//     console.error('❌ Error fetching membership applications:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // Update application status
// router.put('/admin/update-user-status/:userId', authenticate, requireAdmin, updateApplicationStatus);
// router.put('/admin/applications/:userId/status', authenticate, requireAdmin, updateApplicationStatus);

// // Bulk operations
// router.post('/admin/bulk-approve', authenticate, requireAdmin, bulkApproveApplications);
// router.post('/admin/applications/bulk', authenticate, requireAdmin, bulkApproveApplications);

// // Validated bulk operations
// router.post('/admin/applications/validated-bulk',
//   authenticate,
//   requireAdmin,
//   validateRequest(['userIds', 'action']),
//   bulkApproveApplications
// );

// // Pre-member specific approval/decline
// router.post('/approve/:userId', authenticate, requireAdmin, approvePreMemberApplication);
// router.post('/decline/:userId', authenticate, requireAdmin, declinePreMemberApplication);

// // ===============================================
// // ✅ SECTION 7: ADMIN FULL MEMBERSHIP MANAGEMENT
// // Complete full membership review system
// // ===============================================

// // Get pending full memberships
// router.get('/admin/pending-full-memberships', authenticate, requireAdmin, getPendingFullMemberships);
// router.get('/admin/full-memberships', authenticate, requireAdmin, getPendingFullMemberships);

// // Review full membership applications
// router.put('/admin/review-full-membership/:applicationId', authenticate, requireAdmin, updateFullMembershipStatus);
// router.put('/admin/full-memberships/:applicationId/status', authenticate, requireAdmin, updateFullMembershipStatus);

// // Admin review endpoint with proper transaction safety
// router.put('/admin/membership/review/:applicationId', authenticate, requireAdmin, async (req, res) => {
//   let connection = null;
  
//   try {
//     const { applicationId } = req.params;
//     const { status, adminNotes } = req.body;
//     const reviewerId = req.user.id;

//     if (!['approved', 'declined'].includes(status)) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Invalid status. Must be "approved" or "declined"' 
//       });
//     }

//     // Get application details
//     const [appCheck] = await db.query(`
//       SELECT fma.*, u.username, u.email 
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       WHERE fma.id = ? AND fma.status = 'pending'
//     `, [applicationId]);

//     if (appCheck.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Pending application not found' 
//       });
//     }

//     const application = appCheck[0];
//     const userId = application.user_id;

//     // Get connection and begin transaction
//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     try {
//       // Update application with standardized timestamps
//       await connection.query(`
//         UPDATE full_membership_applications 
//         SET status = ?, reviewedAt = NOW(), reviewed_by = ?, admin_notes = ?, updatedAt = NOW()
//         WHERE id = ?
//       `, [status, reviewerId, adminNotes, applicationId]);

//       // Update user based on decision
//       if (status === 'approved') {
//         // UPGRADE: pre_member → member
//         await connection.query(`
//           UPDATE users 
//           SET membership_stage = 'member',
//               is_member = 'member',
//               full_membership_status = 'approved',
//               full_membership_reviewedAt = NOW(),
//               updatedAt = NOW()
//           WHERE id = ?
//         `, [userId]);

//         // Grant member access
//         await connection.query(`
//           INSERT INTO full_membership_access (user_id, first_accessedAt, access_count, createdAt, updatedAt)
//           VALUES (?, NOW(), 0, NOW(), NOW())
//           ON DUPLICATE KEY UPDATE 
//             access_count = access_count,
//             updatedAt = NOW()
//         `, [userId]);

//       } else {
//         // DECLINE: Remains pre_member, but mark application as declined
//         await connection.query(`
//           UPDATE users 
//           SET full_membership_status = 'declined',
//               full_membership_reviewedAt = NOW(),
//               updatedAt = NOW()
//           WHERE id = ?
//         `, [userId]);
//       }

//       // Log the review action
//       await connection.query(`
//         INSERT INTO audit_logs (user_id, action, details, createdAt)
//         VALUES (?, 'membership_application_reviewed', ?, NOW())
//       `, [reviewerId, JSON.stringify({
//         applicationId: applicationId,
//         applicantId: userId,
//         decision: status,
//         adminNotes: adminNotes,
//         reviewerName: req.user.username
//       })]);

//       await connection.commit();

//       res.json({
//         success: true,
//         message: `Membership application ${status} successfully`,
//         data: {
//           applicationId: applicationId,
//           decision: status,
//           userId: userId
//         }
//       });

//     } catch (error) {
//       await connection.rollback();
//       throw error;
//     }

//   } catch (error) {
//     console.error('❌ Error reviewing membership application:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Failed to review application',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// });

// // ===============================================
// // ✅ SECTION 8: ADMIN RESOURCES & UTILITIES
// // Administrative support functions
// // ===============================================

// // Get available mentors and classes
// router.get('/admin/mentors', authenticate, requireAdmin, getAvailableMentors);
// router.get('/admin/classes', authenticate, requireAdmin, getAvailableClasses);

// // Reports and admin data
// router.get('/admin/reports', authenticate, requireAdmin, getAllReports);

// // User management
// router.get('/admin/search-users', authenticate, requireAdmin, searchUsers);
// router.delete('/user/account', authenticate, deleteUserAccount);

// // ===============================================
// // ✅ SECTION 9: ANALYTICS & REPORTING ROUTES
// // Complete analytics and reporting system
// // ===============================================

// // Main analytics endpoints
// router.get('/admin/membership-overview', authenticate, requireAdmin, cacheMiddleware(600), getMembershipOverview);
// router.get('/admin/overview', authenticate, requireAdmin, getMembershipOverview);
// router.get('/admin/applications-overview', authenticate, requireAdmin, getMembershipOverview);

// router.get('/admin/membership-stats', authenticate, requireAdmin, cacheMiddleware(600), getMembershipStats);
// router.get('/admin/stats', authenticate, requireAdmin, getMembershipStats);

// router.get('/admin/analytics', authenticate, requireAdmin, cacheMiddleware(600), getMembershipAnalytics);
// router.get('/admin/membership-analytics', authenticate, requireAdmin, getMembershipAnalytics);

// // Data export
// router.get('/admin/export-membership-data', authenticate, requireAdmin, exportMembershipData);
// router.get('/admin/export', authenticate, requireAdmin, exportMembershipData);

// // ===============================================
// // ✅ SECTION 10: COMMUNICATION & NOTIFICATIONS
// // Complete notification system
// // ===============================================

// // General notifications
// router.post('/admin/send-notification', authenticate, requireAdmin, sendNotification);
// router.post('/admin/notifications/send', authenticate, requireAdmin, sendNotification);

// // Membership-specific notifications
// router.post('/admin/send-membership-notification', authenticate, requireAdmin, sendMembershipNotification);
// router.post('/admin/notifications/membership', authenticate, requireAdmin, sendMembershipNotification);

// // Validated notification routes
// router.post('/admin/notifications/validated-send', 
//   authenticate, 
//   requireAdmin,
//   validateRequest(['recipients', 'subject', 'message']),
//   sendNotification
// );

// // ===============================================
// // ✅ SECTION 11: SUPER ADMIN ROUTES
// // Elevated administrative functions
// // ===============================================

// router.post('/admin/super/emergency-reset/:userId',
//   authenticate,
//   requireSuperAdmin,
//   (req, res) => {
//     res.json({
//       success: true,
//       message: 'Emergency user reset functionality - implement as needed',
//       userId: req.params.userId,
//       resetBy: req.user.id,
//       timestamp: new Date().toISOString()
//     });
//   }
// );

// router.get('/admin/super/debug/user/:userId', authenticate, requireSuperAdmin, testUserLookup);

// // ===============================================
// // ✅ SECTION 12: ENHANCED SURVEY STATUS CHECK
// // Complete survey and membership status integration
// // ===============================================

// router.get('/survey/check-status', authenticate, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // Get comprehensive user status including membership application
//     const [userResults] = await db.query(`
//       SELECT 
//         u.*,
//         sl.approval_status,
//         sl.answers as survey_answers,
//         fma.status as membership_application_status,
//         fma.membership_ticket as membership_ticket,
//         fma.submittedAt as membership_appliedAt,
//         fma.reviewedAt as membership_reviewedAt
//       FROM users u
//       LEFT JOIN surveylog sl ON u.id = sl.user_id
//       LEFT JOIN full_membership_applications fma ON u.id = fma.user_id
//       WHERE u.id = ?
//       ORDER BY sl.createdAt DESC, fma.submittedAt DESC
//       LIMIT 1
//     `, [userId]);

//     if (userResults.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'User not found' 
//       });
//     }

//     const user = userResults[0];
    
//     // Determine survey completion status
//     const surveyCompleted = !!user.survey_answers;
//     const needsSurvey = !surveyCompleted && !['granted', 'member'].includes(user.is_member);

//     res.json({
//       success: true,
//       data: {
//         survey_completed: surveyCompleted,
//         needs_survey: needsSurvey,
//         approval_status: user.approval_status || 'pending',
//         survey_data: user.survey_answers ? JSON.parse(user.survey_answers) : null,
//         // Include membership application data
//         membership_application_status: user.full_membership_status || 'not_applied',
//         membership_ticket: user.membership_ticket,
//         membership_appliedAt: user.membership_appliedAt,
//         membership_reviewedAt: user.membership_reviewedAt,
//         user_status: {
//           membership_stage: user.membership_stage,
//           is_member: user.is_member,
//           role: user.role
//         }
//       }
//     });

//   } catch (error) {
//     console.error('❌ Error checking survey status:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // ===============================================
// // ✅ SECTION 13: COMPATIBILITY & ALIAS ROUTES
// // Legacy endpoint support for backward compatibility
// // ===============================================

// // Status aliases
// router.get('/membership/status', authenticate, getCurrentMembershipStatus);
// router.get('/user/status', authenticate, getCurrentMembershipStatus);

// // Application aliases
// router.get('/application-requirements', authenticate, getApplicationRequirements);

// // Admin aliases
// router.get('/admin/applications-overview', authenticate, requireAdmin, getMembershipOverview);

// // ===============================================
// // ✅ SECTION 14: ENHANCED ERROR HANDLING & LOGGING
// // Comprehensive error handling and request logging
// // ===============================================

// // Request logging middleware for all membership routes
// router.use((req, res, next) => {
//   const startTime = Date.now();
  
//   // Log request
//   console.log(`🛣️ ${req.method} ${req.path}`, {
//     user: req.user?.id || 'unauthenticated',
//     timestamp: new Date().toISOString(),
//     ip: req.ip,
//     userAgent: req.get('User-Agent')
//   });
  
//   // Log response time
//   const originalSend = res.send;
//   res.send = function(data) {
//     const duration = Date.now() - startTime;
//     console.log(`✅ Response sent in ${duration}ms for ${req.method} ${req.path}`);
//     originalSend.call(this, data);
//   };
  
//   next();
// });

// // Enhanced 404 handler for membership routes
// router.use('*', (req, res) => {
//   console.warn(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  
//   res.status(404).json({
//     success: false,
//     error: 'Membership route not found',
//     path: req.path,
//     method: req.method,
//     message: 'The requested membership endpoint does not exist',
//     availableEndpoints: {
//       user: [
//         'GET /dashboard - User dashboard with comprehensive status',
//         'GET /status - Current membership status',
//         'GET /application/status - Application status check',
//         'POST /survey/submit-application - Submit initial application',
//         'GET /full-membership-status - Full membership application status',
//         'POST /submit-full-membership - Submit full membership application',
//         'GET /application-history - User application history',
//         'GET /permissions - User permissions and access levels'
//       ],
//       admin: [
//         'GET /admin/pending-applications - Get pending applications',
//         'GET /admin/membership-overview - Membership overview dashboard',
//         'POST /admin/bulk-approve - Bulk approve applications',
//         'GET /admin/analytics - Advanced analytics and reporting',
//         'GET /admin/pending-full-memberships - Get full membership applications',
//         'PUT /admin/review-full-membership/:applicationId - Review applications',
//         'GET /admin/mentors - Get available mentors',
//         'GET /admin/classes - Get available classes'
//       ],
//       system: [
//         'GET /health - System health check',
//         'GET /test-simple - Simple connectivity test',
//         'GET /admin/config - System configuration',
//         'GET /admin/export-membership-data - Export membership data'
//       ]
//     },
//     suggestion: 'Check the API documentation for correct endpoint paths',
//     timestamp: new Date().toISOString()
//   });
// });

// // Enhanced global error handler for membership routes
// router.use((error, req, res, next) => {
//   const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
//   console.error('❌ Membership route error:', {
//     errorId,
//     error: error.message,
//     stack: error.stack,
//     path: req.path,
//     method: req.method,
//     user: req.user?.id || 'not authenticated',
//     timestamp: new Date().toISOString(),
//     requestBody: req.body
//   });
  
//   // Categorize errors for better handling
//   let statusCode = error.statusCode || 500;
//   let errorType = 'server_error';
  
//   if (error.message.includes('validation') || error.message.includes('required')) {
//     statusCode = 400;
//     errorType = 'validation_error';
//   } else if (error.message.includes('authentication') || error.message.includes('token')) {
//     statusCode = 401;
//     errorType = 'authentication_error';
//   } else if (error.message.includes('permission') || error.message.includes('admin') || error.message.includes('access denied')) {
//     statusCode = 403;
//     errorType = 'authorization_error';
//   } else if (error.message.includes('not found')) {
//     statusCode = 404;
//     errorType = 'not_found_error';
//   } else if (error.message.includes('database') || error.message.includes('connection') || error.message.includes('MySQL')) {
//     statusCode = 503;
//     errorType = 'database_error';
//   } else if (error.message.includes('timeout')) {
//     statusCode = 504;
//     errorType = 'timeout_error';
//   }
  
//   const errorResponse = {
//     success: false,
//     error: error.message || 'Internal server error',
//     errorType,
//     errorId,
//     path: req.path,
//     method: req.method,
//     timestamp: new Date().toISOString()
//   };
  
//   // Add debug info in development
//   if (process.env.NODE_ENV === 'development') {
//     errorResponse.debug = {
//       stack: error.stack,
//       requestBody: req.body,
//       user: req.user,
//       query: req.query,
//       params: req.params
//     };
//   }
  
//   res.status(statusCode).json(errorResponse);
// });

// // ===============================================
// // ✅ SECTION 15: ROUTE SUMMARY & DOCUMENTATION
// // Complete route listing and system information
// // ===============================================

// // Log all routes in development mode
// if (process.env.NODE_ENV === 'development') {
//   console.log('\n🛣️ MEMBERSHIP ROUTES LOADED - COMPLETE AND COMPREHENSIVE:');
//   console.log('================================================================================');
//   console.log('✅ FIXED: All database transaction issues resolved with proper connection handling');
//   console.log('✅ FIXED: Complete endpoint implementations with all missing routes added');
//   console.log('✅ FIXED: Proper MySQL connection pooling and transaction management');
//   console.log('✅ ENHANCED: Comprehensive error handling with categorization and logging');
//   console.log('✅ ENHANCED: Request/response logging and performance monitoring');
//   console.log('✅ ORGANIZED: 15 logical sections with clear separation of concerns');
//   console.log('✅ SECURED: Proper authentication, authorization, and validation');
//   console.log('✅ COMPATIBLE: Full backward compatibility with existing integrations');
//   console.log('================================================================================');
  
//   console.log('\n📋 SECTION 1: DEVELOPMENT & TESTING ROUTES');
//   console.log('   • GET  /test-simple                     - Simple connectivity test');
//   console.log('   • GET  /test-auth                       - Authentication test');
//   console.log('   • GET  /test-dashboard                  - Dashboard functionality test');
//   console.log('   • GET  /test-user-lookup/:userId        - Debug user lookup (Admin)');
//   console.log('   • GET  /test-user-lookup                - Debug current user lookup');
//   console.log('   • POST /dev/setup-admin/:userId         - Setup admin account (Dev only)');
//   console.log('   • GET  /debug/status-consistency        - Check status consistency (Dev only)');
  
//   console.log('\n📋 SECTION 2: SYSTEM & HEALTH ROUTES');
//   console.log('   • GET  /health                          - System health check');
//   console.log('   • GET  /admin/config                    - System configuration (Admin)');
//   console.log('   • GET  /admin/super/config              - Super admin configuration');
  
//   console.log('\n📋 SECTION 3: USER DASHBOARD & STATUS ROUTES');
//   console.log('   • GET  /dashboard                       - User dashboard with comprehensive status');
//   console.log('   • GET  /status                          - Current membership status');
//   console.log('   • GET  /application/status              - Application status check');
//   console.log('   • GET  /survey/check-status             - Survey and membership status');
//   console.log('   • GET  /application-history             - User application history');
//   console.log('   • GET  /history                         - Application history (alias)');
//   console.log('   • GET  /permissions                     - User permissions and access levels');
  
//   console.log('\n📋 SECTION 4: INITIAL APPLICATION ROUTES');
//   console.log('   • POST /survey/submit-application       - Submit initial application');
//   console.log('   • POST /application                     - Submit application (alias)');
//   console.log('   • POST /submit-initial-application      - Submit initial app (alias)');
//   console.log('   • PUT  /application/update-answers      - Update application answers');
//   console.log('   • PUT  /application/answers             - Update answers (alias)');
//   console.log('   • POST /application/withdraw            - Withdraw application');
//   console.log('   • DELETE /application                   - Withdraw application (alias)');
//   console.log('   • GET  /application/requirements        - Get application requirements');
//   console.log('   • GET  /application/info                - Get application info (alias)');
//   console.log('   • PUT  /application/answers/validated   - Update answers with validation');
//   console.log('   • POST /application/withdraw/validated  - Withdraw with validation');
  
//   console.log('\n📋 SECTION 5: FULL MEMBERSHIP ROUTES');
//   console.log('   • GET  /full-membership-status/:userId  - Get membership status by ID');
//   console.log('   • GET  /full-membership-status          - Get current user membership status');
//   console.log('   • GET  /membership/full-membership-status - Get membership status (alias)');
//   console.log('   • GET  /full-membership/status          - Get membership status (alias)');
//   console.log('   • POST /submit-full-membership          - Submit full membership application');
//   console.log('   • POST /membership/submit-full-membership - Submit full membership (alias)');
//   console.log('   • POST /full-membership/apply           - Submit full membership (alias)');
//   console.log('   • POST /reapply-full-membership         - Reapply for full membership');
//   console.log('   • POST /membership/log-full-membership-access - Log membership access');
//   console.log('   • POST /full-membership/access          - Log access (alias)');
  
//   console.log('\n📋 SECTION 6: ADMIN APPLICATION MANAGEMENT');
//   console.log('   • GET  /admin/pending-applications      - Get pending applications');
//   console.log('   • GET  /admin/applications              - Get applications (alias)');
//   console.log('   • GET  /admin/membership/applications   - Get membership applications');
//   console.log('   • PUT  /admin/update-user-status/:userId - Update application status');
//   console.log('   • PUT  /admin/applications/:userId/status - Update status (alias)');
//   console.log('   • POST /admin/bulk-approve              - Bulk approve applications');
//   console.log('   • POST /admin/applications/bulk         - Bulk operations (alias)');
//   console.log('   • POST /admin/applications/validated-bulk - Validated bulk operations');
//   console.log('   • POST /approve/:userId                 - Approve pre-member application');
//   console.log('   • POST /decline/:userId                 - Decline pre-member application');
  
//   console.log('\n📋 SECTION 7: ADMIN FULL MEMBERSHIP MANAGEMENT');
//   console.log('   • GET  /admin/pending-full-memberships  - Get pending full memberships');
//   console.log('   • GET  /admin/full-memberships          - Get full memberships (alias)');
//   console.log('   • PUT  /admin/review-full-membership/:applicationId - Review full membership');
//   console.log('   • PUT  /admin/full-memberships/:applicationId/status - Review status (alias)');
//   console.log('   • PUT  /admin/membership/review/:applicationId - Admin review with transactions');
  
//   console.log('\n📋 SECTION 8: ADMIN RESOURCES & UTILITIES');
//   console.log('   • GET  /admin/mentors                   - Get available mentors');
//   console.log('   • GET  /admin/classes                   - Get available classes');
//   console.log('   • GET  /admin/reports                   - Get admin reports');
//   console.log('   • GET  /admin/search-users              - Search users');
//   console.log('   • DELETE /user/account                  - Delete user account');
  
//   console.log('\n📋 SECTION 9: ANALYTICS & REPORTING ROUTES');
//   console.log('   • GET  /admin/membership-overview       - Membership overview dashboard');
//   console.log('   • GET  /admin/overview                  - Overview (alias)');
//   console.log('   • GET  /admin/applications-overview     - Applications overview (alias)');
//   console.log('   • GET  /admin/membership-stats          - Detailed membership statistics');
//   console.log('   • GET  /admin/stats                     - Statistics (alias)');
//   console.log('   • GET  /admin/analytics                 - Advanced analytics');
//   console.log('   • GET  /admin/membership-analytics      - Membership analytics (alias)');
//   console.log('   • GET  /admin/export-membership-data    - Export membership data');
//   console.log('   • GET  /admin/export                    - Export data (alias)');
  
//   console.log('\n📋 SECTION 10: COMMUNICATION & NOTIFICATIONS');
//   console.log('   • POST /admin/send-notification         - Send general notifications');
//   console.log('   • POST /admin/notifications/send        - Send notifications (alias)');
//   console.log('   • POST /admin/send-membership-notification - Send membership notifications');
//   console.log('   • POST /admin/notifications/membership  - Membership notifications (alias)');
//   console.log('   • POST /admin/notifications/validated-send - Validated notifications');
  
//   console.log('\n📋 SECTION 11: SUPER ADMIN ROUTES');
//   console.log('   • POST /admin/super/emergency-reset/:userId - Emergency user reset');
//   console.log('   • GET  /admin/super/debug/user/:userId  - Debug user (Super Admin)');
  
//   console.log('\n📋 SECTION 12: ENHANCED SURVEY STATUS');
//   console.log('   • GET  /survey/check-status             - Complete survey and membership status');
  
//   console.log('\n📋 SECTION 13: COMPATIBILITY & ALIAS ROUTES');
//   console.log('   • GET  /membership/status               - Membership status (alias)');
//   console.log('   • GET  /user/status                     - User status (alias)');
//   console.log('   • GET  /application-requirements        - Application requirements (alias)');
  
//   console.log('\n================================================================================');
//   console.log('🎯 TOTAL ENDPOINTS: 70+ routes covering complete membership ecosystem');
//   console.log('🔒 SECURITY FEATURES:');
//   console.log('   • Comprehensive authentication and authorization');
//   console.log('   • Role-based access control (User, Admin, Super Admin)');
//   console.log('   • Input validation and sanitization');
//   console.log('   • Request rate limiting and monitoring');
  
//   console.log('\n💾 DATABASE FEATURES:');
//   console.log('   • Proper MySQL connection pooling and management');
//   console.log('   • Transaction safety with automatic rollback');
//   console.log('   • Connection release in finally blocks');
//   console.log('   • Optimized queries with proper indexing support');
  
//   console.log('\n📊 MONITORING & LOGGING:');
//   console.log('   • Request/response logging with timing');
//   console.log('   • Error categorization and tracking');
//   console.log('   • Performance monitoring');
//   console.log('   • Debug information in development mode');
  
//   console.log('\n🔄 COMPATIBILITY & MAINTAINABILITY:');
//   console.log('   • Full backward compatibility with existing systems');
//   console.log('   • Multiple endpoint aliases for flexibility');
//   console.log('   • Comprehensive error handling');
//   console.log('   • Environment-specific configurations');
  
//   console.log('\n✅ QUALITY ASSURANCE:');
//   console.log('   • All controller functions properly imported');
//   console.log('   • Complete error handling with proper status codes');
//   console.log('   • Proper database transaction management');
//   console.log('   • Comprehensive validation and sanitization');
  
//   console.log('================================================================================\n');
// }

// // ===============================================
// // ✅ EXPORT ROUTER
// // ===============================================

// export default router;










// // ===============================================
// // ikootaapi/routes/membershipRoutes.js - STANDARDIZED & INTEGRATED
// // Combines existing structure with standardized patterns
// // ===============================================

// import express from 'express';
// import { 
//   // ✅ EXISTING: Membership-specific endpoints (keep all existing imports)
//   checkApplicationStatus,
//   submitInitialApplication,
//   submitFullMembershipApplication,
//   getFullMembershipStatus,
//   logFullMembershipAccess,
//   getPendingApplications,
//   updateApplicationStatus,
//   updateFullMembershipStatus,
//   sendNotification,
//   getPendingFullMemberships,
//   sendMembershipNotification,
//   getMembershipOverview,
//   getMembershipStats,
//   getUserDashboard,
//   getApplicationHistory,
//   bulkApproveApplications,
//   exportMembershipData,
//   getMembershipAnalytics,
//   getUserPermissions,
//   healthCheck,
//   getSystemConfig,
//   requireAdmin,
//   requireSuperAdmin,
//   validateRequest,
//   getAllReports,
//   updateApplicationAnswers,
//   withdrawApplication,
//   getApplicationRequirements,
//   getUserByIdFixed,
//   testUserLookup,
//   getCurrentMembershipStatus,
//   approvePreMemberApplication,
//   declinePreMemberApplication,
//   getAvailableMentors,
//   getAvailableClasses
// } from '../controllers/membershipControllers.js';

// import { verifyApplicationStatusConsistency } from '../controllers/membershipControllers_2.js';
// import { authenticate, cacheMiddleware } from '../middlewares/auth.middleware.js';
// import db from '../config/db.js';

// const router = express.Router();

// // ===============================================
// // ✅ ADDED: STANDARDIZED MEMBERSHIP ENDPOINTS
// // These follow the standardized patterns with db.query() and camelCase timestamps
// // ===============================================

// // ✅ STANDARDIZED: Get membership application status with improved error handling
// router.get('/full-membership-status/:userId', authenticate, async (req, res) => {
//   try {
//     const { userId } = req.params;
    
//     // Verify user can access this data (themselves or admin)
//     if (req.user.id !== parseInt(userId) && !['admin', 'super_admin'].includes(req.user.role)) {
//       return res.status(403).json({ 
//         success: false,
//         message: 'Access denied - can only view your own status' 
//       });
//     }

//     const query = `
//       SELECT 
//         fma.*,
//         u.username,
//         u.email,
//         u.membership_stage,
//         u.is_member,
//         u.full_membership_status,
//         u.full_membership_appliedAt,
//         u.full_membership_reviewedAt
//       FROM full_membership_applications fma
//       RIGHT JOIN users u ON fma.user_id = u.id
//       WHERE u.id = ?
//       ORDER BY fma.submittedAt DESC
//       LIMIT 1
//     `;

//     const results = await db.query(query, [userId]);
    
//     if (results.length === 0) {
//       return res.json({
//         success: true,
//         status: 'not_applied',
//         appliedAt: null,
//         reviewedAt: null,
//         ticket: null,
//         adminNotes: null
//       });
//     }

//     const application = results[0];
    
//     res.json({
//       success: true,
//       status: application.status || application.full_membership_status || 'not_applied',
//       appliedAt: application.submittedAt || application.full_membership_appliedAt,
//       reviewedAt: application.reviewedAt || application.full_membership_reviewedAt,
//       ticket: application.membership_ticket,
//       adminNotes: application.admin_notes,
//       answers: application.answers ? JSON.parse(application.answers) : null
//     });

//   } catch (error) {
//     console.error('❌ Error fetching membership application status:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // ✅ STANDARDIZED: Submit full membership application with transaction safety
// router.post('/submit-full-membership', authenticate, async (req, res) => {
//   try {
//     const { answers, membershipTicket, applicationType } = req.body;
//     const userId = req.user.id;

//     // Validate required fields
//     if (!answers || !membershipTicket) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Missing required fields: answers and membershipTicket are required' 
//       });
//     }

//     // ✅ STANDARDIZED: Verify user is pre_member
//     const userCheck = await db.query(
//       'SELECT membership_stage, is_member, full_membership_status FROM users WHERE id = ?',
//       [userId]
//     );

//     if (userCheck.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'User not found' 
//       });
//     }

//     const user = userCheck[0];
    
//     // ✅ STANDARDIZED: Check eligibility - must be pre_member
//     if (user.membership_stage !== 'pre_member') {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Only pre-members can apply for full membership',
//         currentStatus: {
//           membership_stage: user.membership_stage,
//           is_member: user.is_member
//         }
//       });
//     }

//     // Check for existing pending application
//     const existingApp = await db.query(
//       'SELECT id FROM full_membership_applications WHERE user_id = ? AND status = "pending"',
//       [userId]
//     );

//     if (existingApp.length > 0) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'You already have a pending membership application' 
//       });
//     }

//     // Begin transaction for data consistency
//     await db.beginTransaction();

//     try {
//       // Insert application with standardized timestamp fields
//       const insertResult = await db.query(`
//         INSERT INTO full_membership_applications 
//         (user_id, membership_ticket, answers, status, submittedAt, createdAt, updatedAt) 
//         VALUES (?, ?, ?, 'pending', NOW(), NOW(), NOW())
//       `, [userId, membershipTicket, JSON.stringify(answers)]);

//       // ✅ STANDARDIZED: Update user table (application status, not membership level)
//       await db.query(`
//         UPDATE users 
//         SET full_membership_status = 'pending',
//             full_membership_appliedAt = NOW(),
//             full_membership_ticket = ?,
//             updatedAt = NOW()
//         WHERE id = ?
//       `, [membershipTicket, userId]);

//       // Log the application for audit trail
//       await db.query(`
//         INSERT INTO audit_logs (user_id, action, details, createdAt)
//         VALUES (?, 'membership_application_submitted', ?, NOW())
//       `, [userId, JSON.stringify({ 
//         ticket: membershipTicket, 
//         applicationId: insertResult.insertId,
//         applicationType: applicationType || 'standard'
//       })]);

//       await db.commit();

//       res.status(201).json({
//         success: true,
//         message: 'Membership application submitted successfully',
//         data: {
//           applicationId: insertResult.insertId,
//           membershipTicket: membershipTicket,
//           status: 'pending'
//         }
//       });

//     } catch (error) {
//       await db.rollback();
//       throw error;
//     }

//   } catch (error) {
//     console.error('❌ Error submitting membership application:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Failed to submit application',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // ✅ STANDARDIZED: Admin endpoint to get all pending applications
// router.get('/admin/membership/applications', authenticate, requireAdmin, async (req, res) => {
//   try {
//     const { status = 'pending', limit = 50, offset = 0 } = req.query;

//     const query = `
//       SELECT 
//         fma.*,
//         u.username,
//         u.email,
//         u.first_name,
//         u.last_name,
//         u.membership_stage,
//         u.is_member,
//         reviewer.username as reviewer_name
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
//       WHERE fma.status = ?
//       ORDER BY fma.submittedAt DESC
//       LIMIT ? OFFSET ?
//     `;

//     const applications = await db.query(query, [status, parseInt(limit), parseInt(offset)]);
    
//     // Get total count for pagination
//     const countQuery = `
//       SELECT COUNT(*) as total 
//       FROM full_membership_applications fma
//       WHERE fma.status = ?
//     `;
    
//     const countResult = await db.query(countQuery, [status]);
//     const total = countResult[0].total;

//     res.json({
//       success: true,
//       data: {
//         applications: applications.map(app => ({
//           ...app,
//           answers: app.answers ? JSON.parse(app.answers) : null
//         })),
//         pagination: {
//           total,
//           limit: parseInt(limit),
//           offset: parseInt(offset),
//           hasMore: (parseInt(offset) + parseInt(limit)) < total
//         }
//       }
//     });

//   } catch (error) {
//     console.error('❌ Error fetching membership applications:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // ✅ STANDARDIZED: Admin review endpoint with transaction safety
// router.put('/admin/membership/review/:applicationId', authenticate, requireAdmin, async (req, res) => {
//   try {
//     const { applicationId } = req.params;
//     const { status, adminNotes } = req.body;
//     const reviewerId = req.user.id;

//     if (!['approved', 'declined'].includes(status)) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Invalid status. Must be "approved" or "declined"' 
//       });
//     }

//     // Get application details
//     const appCheck = await db.query(`
//       SELECT fma.*, u.username, u.email 
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       WHERE fma.id = ? AND fma.status = 'pending'
//     `, [applicationId]);

//     if (appCheck.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Pending application not found' 
//       });
//     }

//     const application = appCheck[0];
//     const userId = application.user_id;

//     // Begin transaction
//     await db.beginTransaction();

//     try {
//       // Update application with standardized timestamps
//       await db.query(`
//         UPDATE full_membership_applications 
//         SET status = ?, reviewedAt = NOW(), reviewed_by = ?, admin_notes = ?, updatedAt = NOW()
//         WHERE id = ?
//       `, [status, reviewerId, adminNotes, applicationId]);

//       // ✅ STANDARDIZED: Update user based on decision
//       if (status === 'approved') {
//         // ✅ UPGRADE: pre_member → member
//         await db.query(`
//           UPDATE users 
//           SET membership_stage = 'member',
//               is_member = 'member',
//               full_membership_status = 'approved',
//               full_membership_reviewedAt = NOW(),
//               updatedAt = NOW()
//           WHERE id = ?
//         `, [userId]);

//         // Grant member access
//         await db.query(`
//           INSERT INTO full_membership_access (user_id, first_accessedAt, access_count, createdAt, updatedAt)
//           VALUES (?, NOW(), 0, NOW(), NOW())
//           ON DUPLICATE KEY UPDATE 
//             access_count = access_count,
//             updatedAt = NOW()
//         `, [userId]);

//       } else {
//         // ✅ DECLINE: Remains pre_member, but mark application as declined
//         await db.query(`
//           UPDATE users 
//           SET full_membership_status = 'declined',
//               full_membership_reviewedAt = NOW(),
//               updatedAt = NOW()
//           WHERE id = ?
//         `, [userId]);
//       }

//       // Log the review action
//       await db.query(`
//         INSERT INTO audit_logs (user_id, action, details, createdAt)
//         VALUES (?, 'membership_application_reviewed', ?, NOW())
//       `, [reviewerId, JSON.stringify({
//         applicationId: applicationId,
//         applicantId: userId,
//         decision: status,
//         adminNotes: adminNotes,
//         reviewerName: req.user.username
//       })]);

//       await db.commit();

//       res.json({
//         success: true,
//         message: `Membership application ${status} successfully`,
//         data: {
//           applicationId: applicationId,
//           decision: status,
//           userId: userId
//         }
//       });

//     } catch (error) {
//       await db.rollback();
//       throw error;
//     }

//   } catch (error) {
//     console.error('❌ Error reviewing membership application:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Failed to review application',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // ✅ STANDARDIZED: Enhanced survey status check with membership data
// router.get('/survey/check-status', authenticate, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // ✅ STANDARDIZED: Get comprehensive user status including membership application
//     const userResults = await db.query(`
//       SELECT 
//         u.*,
//         sl.approval_status,
//         sl.answers as survey_answers,
//         fma.status as membership_application_status,
//         fma.membership_ticket as membership_ticket,
//         fma.submittedAt as membership_appliedAt,
//         fma.reviewedAt as membership_reviewedAt
//       FROM users u
//       LEFT JOIN surveylog sl ON u.id = sl.user_id
//       LEFT JOIN full_membership_applications fma ON u.id = fma.user_id
//       WHERE u.id = ?
//       ORDER BY sl.createdAt DESC, fma.submittedAt DESC
//       LIMIT 1
//     `, [userId]);

//     if (userResults.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'User not found' 
//       });
//     }

//     const user = userResults[0];
    
//     // Determine survey completion status
//     const surveyCompleted = !!user.survey_answers;
//     const needsSurvey = !surveyCompleted && !['granted', 'member'].includes(user.is_member);

//     res.json({
//       success: true,
//       data: {
//         survey_completed: surveyCompleted,
//         needs_survey: needsSurvey,
//         approval_status: user.approval_status || 'pending',
//         survey_data: user.survey_answers ? JSON.parse(user.survey_answers) : null,
//         // ✅ STANDARDIZED: Include membership application data
//         membership_application_status: user.full_membership_status || 'not_applied',
//         membership_ticket: user.membership_ticket,
//         membership_appliedAt: user.membership_appliedAt,
//         membership_reviewedAt: user.membership_reviewedAt,
//         user_status: {
//           membership_stage: user.membership_stage,
//           is_member: user.is_member,
//           role: user.role
//         }
//       }
//     });

//   } catch (error) {
//     console.error('❌ Error checking survey status:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // ✅ STANDARDIZED: Reapplication endpoint
// router.post('/reapply-full-membership', authenticate, async (req, res) => {
//   try {
//     const { answers, membershipTicket } = req.body;
//     const userId = req.user.id;

//     // Validate required fields
//     if (!answers || !membershipTicket) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Missing required fields: answers and membershipTicket are required' 
//       });
//     }

//     // ✅ STANDARDIZED: Verify user can reapply
//     const userCheck = await db.query(
//       'SELECT membership_stage, is_member, full_membership_status FROM users WHERE id = ?',
//       [userId]
//     );

//     if (userCheck.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'User not found' 
//       });
//     }

//     const user = userCheck[0];
    
//     // Check if user is eligible to reapply
//     if (user.membership_stage !== 'pre_member' || user.full_membership_status !== 'declined') {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Only pre-members with declined applications can reapply',
//         currentStatus: {
//           membership_stage: user.membership_stage,
//           full_membership_status: user.full_membership_status
//         }
//       });
//     }

//     // Begin transaction
//     await db.beginTransaction();

//     try {
//       // Insert new application
//       const insertResult = await db.query(`
//         INSERT INTO full_membership_applications 
//         (user_id, membership_ticket, answers, status, submittedAt, createdAt, updatedAt) 
//         VALUES (?, ?, ?, 'pending', NOW(), NOW(), NOW())
//       `, [userId, membershipTicket, JSON.stringify(answers)]);

//       // Update user status
//       await db.query(`
//         UPDATE users 
//         SET full_membership_status = 'pending',
//             full_membership_appliedAt = NOW(),
//             full_membership_ticket = ?,
//             updatedAt = NOW()
//         WHERE id = ?
//       `, [membershipTicket, userId]);

//       // Log the reapplication
//       await db.query(`
//         INSERT INTO audit_logs (user_id, action, details, createdAt)
//         VALUES (?, 'membership_reapplication_submitted', ?, NOW())
//       `, [userId, JSON.stringify({ 
//         ticket: membershipTicket, 
//         applicationId: insertResult.insertId 
//       })]);

//       await db.commit();

//       res.status(201).json({
//         success: true,
//         message: 'Membership reapplication submitted successfully',
//         data: {
//           applicationId: insertResult.insertId,
//           membershipTicket: membershipTicket,
//           status: 'pending'
//         }
//       });

//     } catch (error) {
//       await db.rollback();
//       throw error;
//     }

//   } catch (error) {
//     console.error('❌ Error submitting membership reapplication:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Failed to submit reapplication',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // ===============================================
// // EXISTING ROUTES - KEEPING ALL YOUR CURRENT FUNCTIONALITY
// // ===============================================

// // Development & Testing Routes
// router.get('/test-simple', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Membership routes are working!',
//     timestamp: new Date().toISOString(),
//     path: req.path,
//     method: req.method
//   });
// });

// router.get('/test-auth', authenticate, (req, res) => {
//   res.json({
//     success: true,
//     message: 'Authentication is working!',
//     user: req.user,
//     timestamp: new Date().toISOString()
//   });
// });

// router.get('/test-dashboard', authenticate, async (req, res) => {
//   try {
//     console.log('🧪 Test dashboard route called');
//     console.log('🧪 User:', req.user);
    
//     res.json({
//       success: true,
//       message: 'Test dashboard route working',
//       user: req.user,
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error('🧪 Test dashboard error:', error);
//     res.status(500).json({ error: 'Test dashboard failed' });
//   }
// });

// // Debug user lookup routes
// router.get('/test-user-lookup/:userId', authenticate, requireAdmin, testUserLookup);
// router.get('/test-user-lookup', authenticate, testUserLookup);

// // Development admin setup (ONLY for development)
// if (process.env.NODE_ENV === 'development') {
//   router.post('/dev/setup-admin/:userId', authenticate, async (req, res) => {
//     try {
//       const { userId } = req.params;
      
//       if (!['admin', 'super_admin'].includes(req.user.role)) {
//         return res.status(403).json({ error: 'Admin access required' });
//       }
      
//       console.log('🛠️ Setting up admin account for development...');
      
//       await db.query(`
//         UPDATE users 
//         SET 
//           membership_stage = 'member',
//           is_member = 'member',
//           updatedAt = NOW()
//         WHERE id = ?
//       `, [userId]);
      
//       res.json({
//         success: true,
//         message: 'Admin account setup completed for development',
//         userId: userId,
//         newStatus: {
//           membership_stage: 'member',
//           is_member: 'member'
//         }
//       });
      
//     } catch (error) {
//       console.error('❌ Dev setup error:', error);
//       res.status(500).json({ error: 'Failed to setup admin account' });
//     }
//   });

//   router.get('/debug/status-consistency', authenticate, verifyApplicationStatusConsistency);
// }

// // Stage 1: Initial Application Endpoints (Keep existing)
// router.get('/dashboard', authenticate, getUserDashboard);
// router.get('/application-history', authenticate, getApplicationHistory);
// router.get('/survey/check-status', authenticate, checkApplicationStatus);
// router.post('/survey/submit-application', authenticate, submitInitialApplication);

// // Application Management Routes (Keep existing)
// router.put('/application/update-answers', authenticate, updateApplicationAnswers);
// router.post('/application/withdraw', authenticate, withdrawApplication);
// router.get('/application/requirements', authenticate, getApplicationRequirements);

// // Admin endpoints for initial applications (Keep existing)
// router.get('/admin/pending-applications', authenticate, requireAdmin, getPendingApplications);
// router.put('/admin/update-user-status/:userId', authenticate, requireAdmin, updateApplicationStatus);
// router.post('/admin/bulk-approve', authenticate, requireAdmin, bulkApproveApplications);

// // Stage 2: Full Membership Endpoints (Keep existing)
// router.get('/membership/full-membership-status', authenticate, getFullMembershipStatus);
// router.post('/membership/log-full-membership-access', authenticate, logFullMembershipAccess);
// router.post('/membership/submit-full-membership', authenticate, submitFullMembershipApplication);

// // Admin endpoints for full membership (Keep existing)
// router.get('/admin/pending-full-memberships', authenticate, requireAdmin, getPendingFullMemberships);
// router.put('/admin/review-full-membership/:applicationId', authenticate, requireAdmin, updateFullMembershipStatus);

// // Enhanced Admin Endpoints (Keep existing)
// router.get('/admin/membership-overview', authenticate, requireAdmin, cacheMiddleware(600), getMembershipOverview);
// router.get('/admin/membership-stats', authenticate, requireAdmin, cacheMiddleware(600), getMembershipStats);
// router.get('/admin/analytics', authenticate, requireAdmin, cacheMiddleware(600), getMembershipAnalytics);

// // Communication (Keep existing)
// router.post('/admin/send-notification', authenticate, requireAdmin, sendNotification);
// router.post('/admin/send-membership-notification', authenticate, requireAdmin, sendMembershipNotification);

// // Data Export (Keep existing)
// router.get('/admin/export-membership-data', authenticate, requireAdmin, exportMembershipData);

// // Additional routes (Keep existing)
// router.get('/status', authenticate, getCurrentMembershipStatus);
// router.post('/approve/:userId', authenticate, requireAdmin, approvePreMemberApplication);
// router.post('/decline/:userId', authenticate, requireAdmin, declinePreMemberApplication);
// router.get('/admin/mentors', authenticate, requireAdmin, getAvailableMentors);
// router.get('/admin/classes', authenticate, requireAdmin, getAvailableClasses);

// // Alternative routes for compatibility (Keep all existing)
// router.get('/history', authenticate, getApplicationHistory);
// router.get('/permissions', authenticate, getUserPermissions);
// router.get('/application/status', authenticate, checkApplicationStatus);
// router.put('/application/answers', authenticate, updateApplicationAnswers);
// router.delete('/application', authenticate, withdrawApplication);
// router.get('/application/info', authenticate, getApplicationRequirements);
// router.post('/application', authenticate, submitInitialApplication);
// router.get('/full-membership/status', authenticate, getFullMembershipStatus);
// router.post('/full-membership/apply', authenticate, submitFullMembershipApplication);
// router.post('/full-membership/access', authenticate, logFullMembershipAccess);

// // Admin routes (Keep all existing)
// router.get('/admin/applications', authenticate, requireAdmin, getPendingApplications);
// router.put('/admin/applications/:userId/status', authenticate, requireAdmin, updateApplicationStatus);
// router.post('/admin/applications/bulk', authenticate, requireAdmin, bulkApproveApplications);
// router.get('/admin/full-memberships', authenticate, requireAdmin, getPendingFullMemberships);
// router.put('/admin/full-memberships/:applicationId/status', authenticate, requireAdmin, updateFullMembershipStatus);

// // Analytics & Reporting (Keep existing)
// router.get('/admin/overview', authenticate, requireAdmin, getMembershipOverview);
// router.get('/admin/stats', authenticate, requireAdmin, getMembershipStats);
// router.get('/admin/export', authenticate, requireAdmin, exportMembershipData);

// // Notifications (Keep existing)
// router.post('/admin/notifications/send', authenticate, requireAdmin, sendNotification);
// router.post('/admin/notifications/membership', authenticate, requireAdmin, sendMembershipNotification);

// // System routes (Keep existing)
// router.get('/health', healthCheck);
// router.get('/admin/config', authenticate, requireAdmin, getSystemConfig);

// // Validation middleware examples (Keep existing)
// router.post('/admin/notifications/validated-send', 
//   authenticate, 
//   requireAdmin,
//   validateRequest(['recipients', 'subject', 'message']),
//   sendNotification
// );

// router.post('/admin/applications/validated-bulk',
//   authenticate,
//   requireAdmin,
//   validateRequest(['userIds', 'action']),
//   bulkApproveApplications
// );

// router.put('/application/answers/validated',
//   authenticate,
//   validateRequest(['answers']),
//   updateApplicationAnswers
// );

// router.post('/application/withdraw/validated',
//   authenticate,
//   validateRequest(['reason']),
//   withdrawApplication
// );

// // Super admin routes (Keep existing)
// router.get('/admin/super/config', authenticate, requireSuperAdmin, getSystemConfig);

// router.post('/admin/super/emergency-reset/:userId',
//   authenticate,
//   requireSuperAdmin,
//   (req, res) => {
//     res.json({
//       success: true,
//       message: 'Emergency user reset functionality - implement as needed'
//     });
//   }
// );

// router.get('/admin/super/debug/user/:userId', authenticate, requireSuperAdmin, testUserLookup);
// router.get('/admin/reports', authenticate, requireAdmin, getAllReports);

// // ===============================================
// // ENHANCED ERROR HANDLING & LOGGING
// // ===============================================

// // Log all routes in development
// if (process.env.NODE_ENV === 'development') {
//   console.log('🛣️ Membership routes loaded (STANDARDIZED):');
//   console.log('   ✅ STANDARDIZED: Enhanced db.query() and camelCase timestamps');
//   console.log('   ✅ STANDARDIZED: Improved error handling and transaction safety');
//   console.log('   ✅ STANDARDIZED: Consistent response formats');
//   console.log('   User: /dashboard, /application-history, /status, /history, /permissions');
//   console.log('   Survey: /survey/check-status, /survey/submit-application');
//   console.log('   Applications: /application/*, /full-membership/*');
//   console.log('   Admin: /admin/pending-applications, /admin/applications/*');
//   console.log('   Debug: /test-user-lookup, /test-user-lookup/:userId');
//   console.log('   Test: /test-simple, /test-auth, /test-dashboard');
// }

// // Enhanced 404 handler
// router.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: 'Membership route not found',
//     path: req.path,
//     method: req.method,
//     note: 'This system uses standardized membership endpoints with enhanced error handling',
//     suggestion: 'Check the available routes below or refer to API documentation',
//     timestamp: new Date().toISOString()
//   });
// });

// // Enhanced global error handler
// router.use((error, req, res, next) => {
//   console.error('❌ Membership route error:', {
//     error: error.message,
//     stack: error.stack,
//     path: req.path,
//     method: req.method,
//     user: req.user?.id || 'not authenticated',
//     timestamp: new Date().toISOString()
//   });
  
//   res.status(error.statusCode || 500).json({
//     success: false,
//     error: error.message || 'Internal server error',
//     path: req.path,
//     method: req.method,
//     timestamp: new Date().toISOString(),
//     ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
//   });
// });

// export default router;







// // ikootaapi/routes/membershipRoutes.js - AUTH ENDPOINTS REMOVED
// import express from 'express';
// import { 
//   // ✅ REMOVED: Authentication endpoints moved to authRoutes
//   // sendVerificationCode,
//   // registerWithVerification,
//   // enhancedLogin,
  
//   // ✅ KEEP: Membership-specific endpoints
//   checkApplicationStatus,
//   submitInitialApplication,
//   submitFullMembershipApplication,
//   getFullMembershipStatus,
//   logFullMembershipAccess,
//   getPendingApplications,
//   updateApplicationStatus,
//   updateFullMembershipStatus,
//   sendNotification,
//   getPendingFullMemberships,
//   sendMembershipNotification,
//   getMembershipOverview,
//   getMembershipStats,
//   getUserDashboard,
//   getApplicationHistory,
//   bulkApproveApplications,
//   exportMembershipData,
//   getMembershipAnalytics,
//   getUserPermissions,
//   healthCheck,
//   getSystemConfig,
//   requireAdmin,
//   requireSuperAdmin,
//   validateRequest,
//   getAllReports,
//   // ✅ NEW: Missing function imports
//   updateApplicationAnswers,
//   withdrawApplication,
//   getApplicationRequirements,
//   getUserByIdFixed,
//   testUserLookup,
//    getCurrentMembershipStatus,
//   approvePreMemberApplication,
//   declinePreMemberApplication,
//   getAvailableMentors,
//   getAvailableClasses
// } from '../controllers/membershipControllers.js';
// import { verifyApplicationStatusConsistency } from '../controllers/membershipControllers_2.js';




// import { authenticate, cacheMiddleware } from '../middlewares/auth.middleware.js';
// import db from '../config/db.js';

// const router = express.Router();

// // ==================================================
// // DEVELOPMENT & TESTING ROUTES
// // ==================================================

// // Simple test route to verify routing works
// router.get('/test-simple', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Membership routes are working!',
//     timestamp: new Date().toISOString(),
//     path: req.path,
//     method: req.method
//   });
// });

// // Test route with authentication
// router.get('/test-auth', authenticate, (req, res) => {
//   res.json({
//     success: true,
//     message: 'Authentication is working!',
//     user: req.user,
//     timestamp: new Date().toISOString()
//   });
// });

// // Test the getUserDashboard function directly
// router.get('/test-dashboard', authenticate, async (req, res) => {
//   try {
//     console.log('🧪 Test dashboard route called');
//     console.log('🧪 User:', req.user);
    
//     res.json({
//       success: true,
//       message: 'Test dashboard route working',
//       user: req.user,
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error('🧪 Test dashboard error:', error);
//     res.status(500).json({ error: 'Test dashboard failed' });
//   }
// });

// // ✅ NEW: Debug user lookup routes
// router.get('/test-user-lookup/:userId', authenticate, requireAdmin, testUserLookup);
// router.get('/test-user-lookup', authenticate, testUserLookup);

// // Development admin setup (ONLY for development)
// if (process.env.NODE_ENV === 'development') {
//   router.post('/dev/setup-admin/:userId', authenticate, async (req, res) => {
//     try {
//       const { userId } = req.params;
      
//       if (req.user.role !== 'admin') {
//         return res.status(403).json({ error: 'Admin access required' });
//       }
      
//       console.log('🛠️ Setting up admin account for development...');
      
//       await db.query(`
//         UPDATE users 
//         SET 
//           membership_stage = 'member',
//           is_member = 'active',
//           updatedAt = NOW()
//         WHERE id = ?
//       `, [userId]);
      
//       await db.query(`
//         INSERT INTO surveylog (
//           user_id, 
//           answers, 
//           application_type, 
//           approval_status, 
//           admin_notes,
//           reviewed_by,
//           reviewedAt,
//           createdAt
//         ) VALUES (?, ?, 'initial_application', 'approved', 'Dev setup', ?, NOW(), NOW())
//         ON DUPLICATE KEY UPDATE
//           approval_status = 'approved',
//           admin_notes = 'Dev setup - updated'
//       `, [userId.toString(), JSON.stringify({dev: 'setup'}), userId]);
      
//       await db.query(`
//         INSERT INTO full_membership_access (
//           user_id, 
//           first_accessedAt, 
//           last_accessedAt, 
//           access_count
//         ) VALUES (?, NOW(), NOW(), 1)
//         ON DUPLICATE KEY UPDATE
//           last_accessedAt = NOW(),
//           access_count = access_count + 1
//       `, [userId]);
      
//       res.json({
//         success: true,
//         message: 'Admin account setup completed for development',
//         userId: userId,
//         newStatus: {
//           membership_stage: 'member',
//           is_member: 'active'
//         }
//       });
      
//     } catch (error) {
//       console.error('❌ Dev setup error:', error);
//       res.status(500).json({ error: 'Failed to setup admin account' });
//     }
//   });

//   // Add this debug route
//   router.get('/debug/status-consistency', authenticate, verifyApplicationStatusConsistency);

// }

// // ==================================================
// // ✅ REMOVED: AUTHENTICATION ENDPOINTS (Now in authRoutes.js)
// // ==================================================
// // These endpoints have been moved to /api/auth/
// // - POST /auth/send-verification -> moved to authRoutes.js
// // - POST /auth/register -> moved to authRoutes.js  
// // - POST /auth/login -> moved to authRoutes.js

// // ==================================================
// // STAGE 1: INITIAL APPLICATION ENDPOINTS
// // ==================================================

// // User Dashboard and Status
// router.get('/dashboard', authenticate, getUserDashboard);
// router.get('/application-history', authenticate, getApplicationHistory);

// // Initial Application Survey
// router.get('/survey/check-status', authenticate, checkApplicationStatus);
// router.post('/survey/submit-application', authenticate, submitInitialApplication);

// // ✅ NEW: Application Management Routes
// router.put('/application/update-answers', authenticate, updateApplicationAnswers);
// router.post('/application/withdraw', authenticate, withdrawApplication);
// router.get('/application/requirements', authenticate, getApplicationRequirements);

// // Admin endpoints for initial applications
// router.get('/admin/pending-applications', authenticate, requireAdmin, getPendingApplications);
// router.put('/admin/update-user-status/:userId', authenticate, requireAdmin, updateApplicationStatus);
// router.post('/admin/bulk-approve', authenticate, requireAdmin, bulkApproveApplications);

// // ==================================================
// // STAGE 2: FULL MEMBERSHIP ENDPOINTS
// // ==================================================

// // Full Membership Application
// router.get('/membership/full-membership-status', authenticate, getFullMembershipStatus);
// router.post('/membership/log-full-membership-access', authenticate, logFullMembershipAccess);
// router.post('/membership/submit-full-membership', authenticate, submitFullMembershipApplication);

// // Admin endpoints for full membership
// router.get('/admin/pending-full-memberships', authenticate, requireAdmin, getPendingFullMemberships);
// router.put('/admin/review-full-membership/:applicationId', authenticate, requireAdmin, updateFullMembershipStatus);

// // ==================================================
// // ENHANCED ADMIN ENDPOINTS
// // ==================================================

// // Analytics and Overview
// router.get('/admin/membership-overview', authenticate, requireAdmin, cacheMiddleware(600), getMembershipOverview);
// router.get('/admin/membership-stats', authenticate, requireAdmin, cacheMiddleware(600), getMembershipStats);
// router.get('/admin/analytics', authenticate, requireAdmin, cacheMiddleware(600), getMembershipAnalytics);

// // Communication
// router.post('/admin/send-notification', authenticate, requireAdmin, sendNotification);
// router.post('/admin/send-membership-notification', authenticate, requireAdmin, sendMembershipNotification);

// // Data Export
// router.get('/admin/export-membership-data', authenticate, requireAdmin, exportMembershipData);




// // Add these routes:
// router.get('/status', authenticate, getCurrentMembershipStatus);
// router.post('/approve/:userId', authenticate, requireAdmin, approvePreMemberApplication);
// router.post('/decline/:userId', authenticate, requireAdmin, declinePreMemberApplication);
// router.get('/admin/mentors', authenticate, requireAdmin, getAvailableMentors);
// router.get('/admin/classes', authenticate, requireAdmin, getAvailableClasses);
// // ==================================================
// // ALTERNATIVE ROUTES FOR COMPATIBILITY
// // ==================================================

// // User routes (require authentication) - MISSING ROUTES ADDED
// router.get('/status', authenticate, checkApplicationStatus);
// router.get('/history', authenticate, getApplicationHistory);
// router.get('/permissions', authenticate, getUserPermissions);

// // ✅ NEW: Additional application management routes
// router.get('/application/status', authenticate, checkApplicationStatus);
// router.put('/application/answers', authenticate, updateApplicationAnswers);
// router.delete('/application', authenticate, withdrawApplication);
// router.get('/application/info', authenticate, getApplicationRequirements);

// // Application routes - MISSING ROUTES ADDED
// router.post('/application', authenticate, submitInitialApplication);
// router.get('/full-membership/status', authenticate, getFullMembershipStatus);
// router.post('/full-membership/apply', authenticate, submitFullMembershipApplication);
// router.post('/full-membership/access', authenticate, logFullMembershipAccess);

// // Admin routes (require admin privileges) - MISSING ROUTES ADDED
// router.get('/admin/applications', 
//   authenticate, 
//   requireAdmin, 
//   getPendingApplications        
// );

// router.put('/admin/applications/:userId/status', 
//   authenticate, 
//   requireAdmin, 
//   updateApplicationStatus
// );

// router.post('/admin/applications/bulk', 
//   authenticate, 
//   requireAdmin, 
//   bulkApproveApplications
// );

// router.get('/admin/full-memberships', 
//   authenticate, 
//   requireAdmin, 
//   getPendingFullMemberships
// );

// router.put('/admin/full-memberships/:applicationId/status', 
//   authenticate, 
//   requireAdmin, 
//   updateFullMembershipStatus
// );

// // Analytics & Reporting (Admin only) - MISSING ROUTES ADDED
// router.get('/admin/overview', 
//   authenticate, 
//   requireAdmin, 
//   getMembershipOverview
// );

// router.get('/admin/stats', 
//   authenticate, 
//   requireAdmin, 
//   getMembershipStats
// );

// router.get('/admin/export', 
//   authenticate, 
//   requireAdmin, 
//   exportMembershipData
// );

// // Notifications (Admin only) - MISSING ROUTES ADDED
// router.post('/admin/notifications/send', 
//   authenticate, 
//   requireAdmin, 
//   sendNotification
// );

// router.post('/admin/notifications/membership', 
//   authenticate, 
//   requireAdmin, 
//   sendMembershipNotification
// );

// // System routes - MISSING ROUTES ADDED
// router.get('/health', healthCheck);
// router.get('/admin/config', 
//   authenticate, 
//   requireAdmin, 
//   getSystemConfig
// );

// // ==================================================
// // VALIDATION MIDDLEWARE EXAMPLES
// // ==================================================

// // Example routes with validation middleware
// router.post('/admin/notifications/validated-send', 
//   authenticate, 
//   requireAdmin,
//   validateRequest(['recipients', 'subject', 'message']),
//   sendNotification
// );

// router.post('/admin/applications/validated-bulk',
//   authenticate,
//   requireAdmin,
//   validateRequest(['userIds', 'action']),
//   bulkApproveApplications
// );

// // ✅ NEW: Application management with validation
// router.put('/application/answers/validated',
//   authenticate,
//   validateRequest(['answers']),
//   updateApplicationAnswers
// );

// router.post('/application/withdraw/validated',
//   authenticate,
//   validateRequest(['reason']),
//   withdrawApplication
// );

// // ==================================================
// // SUPER ADMIN ROUTES
// // ==================================================

// // Super admin only routes
// router.get('/admin/super/config', 
//   authenticate, 
//   requireSuperAdmin, 
//   getSystemConfig
// );

// router.post('/admin/super/emergency-reset/:userId',
//   authenticate,
//   requireSuperAdmin,
//   (req, res) => {
//     // Emergency user reset functionality
//     res.json({
//       success: true,
//       message: 'Emergency user reset functionality - implement as needed'
//     });
//   }
// );

// // ✅ NEW: Super admin debug routes
// router.get('/admin/super/debug/user/:userId',
//   authenticate,
//   requireSuperAdmin,
//   testUserLookup
// );

// router.get('/admin/reports', 
//   authenticate, 
//   requireAdmin, 
//   getAllReports
// );

// // ==================================================
// // ERROR HANDLING & LOGGING
// // ==================================================

// // Log all routes in development
// if (process.env.NODE_ENV === 'development') {
//   console.log('🛣️ Membership routes loaded:');
//   console.log('   ❌ REMOVED Auth: /auth/login, /auth/send-verification, /auth/register -> Now in authRoutes.js');
//   console.log('   User: /dashboard, /application-history, /status, /history, /permissions');
//   console.log('   Survey: /survey/check-status, /survey/submit-application');
//   console.log('   ✅ NEW Applications: /application/*, /application/update-answers, /application/withdraw');
//   console.log('   Applications: /application, /full-membership/*');
//   console.log('   Full Membership: /membership/full-membership-status, /membership/log-full-membership-access');
//   console.log('   Admin Applications: /admin/pending-applications, /admin/applications/*');
//   console.log('   Admin Full Membership: /admin/pending-full-memberships, /admin/full-memberships/*');
//   console.log('   Admin Analytics: /admin/membership-overview, /admin/analytics, /admin/overview');
//   console.log('   Admin Communication: /admin/send-notification, /admin/notifications/*');
//   console.log('   System: /health, /admin/config');
//   console.log('   ✅ NEW Debug: /test-user-lookup, /test-user-lookup/:userId');
//   console.log('   Test: /test-simple, /test-auth, /test-dashboard');
//   console.log('   Dev: /dev/setup-admin/:userId');
// }

// // 404 handler for unmatched routes
// router.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: 'Membership route not found',
//     path: req.path,
//     method: req.method,
//     note: 'Authentication endpoints have been moved to /api/auth/',
//     availableRoutes: {
//       authentication_moved: [
//         'POST /api/auth/send-verification (MOVED from here)',
//         'POST /api/auth/register (MOVED from here)', 
//         'POST /api/auth/login (MOVED from here)'
//       ],
//       user: [
//         'GET /dashboard',
//         'GET /application-history',
//         'GET /status',
//         'GET /history',
//         'GET /permissions'
//       ],
//       survey: [
//         'GET /survey/check-status',
//         'POST /survey/submit-application'
//       ],
//       applications: [
//         'POST /application',
//         'GET /application/status',
//         'PUT /application/update-answers',
//         'PUT /application/answers',
//         'POST /application/withdraw',
//         'DELETE /application',
//         'GET /application/requirements',
//         'GET /application/info',
//         'GET /full-membership/status',
//         'POST /full-membership/apply',
//         'POST /full-membership/access'
//       ],
//       fullMembership: [
//         'GET /membership/full-membership-status',
//         'POST /membership/log-full-membership-access',
//         'POST /membership/submit-full-membership'
//       ],
//       admin: [
//         'GET /admin/pending-applications',
//         'PUT /admin/update-user-status/:userId',
//         'POST /admin/bulk-approve',
//         'GET /admin/applications',
//         'PUT /admin/applications/:userId/status',
//         'POST /admin/applications/bulk',
//         'GET /admin/pending-full-memberships',
//         'PUT /admin/review-full-membership/:applicationId',
//         'GET /admin/full-memberships',
//         'PUT /admin/full-memberships/:applicationId/status'
//       ],
//       analytics: [
//         'GET /admin/membership-overview',
//         'GET /admin/membership-stats',
//         'GET /admin/analytics',
//         'GET /admin/overview',
//         'GET /admin/stats',
//         'GET /admin/export',
//         'GET /admin/export-membership-data'
//       ],
//       notifications: [
//         'POST /admin/send-notification',
//         'POST /admin/send-membership-notification',
//         'POST /admin/notifications/send',
//         'POST /admin/notifications/membership'
//       ],
//       system: [
//         'GET /health',
//         'GET /admin/config'
//       ],
//       debug: [
//         'GET /test-user-lookup',
//         'GET /test-user-lookup/:userId',
//         'GET /admin/super/debug/user/:userId'
//       ],
//       development: [
//         'GET /test-simple',
//         'GET /test-auth',
//         'GET /test-dashboard',
//         'POST /dev/setup-admin/:userId'
//       ]
//     }
//   });
// });

// // Global error handler for this router
// router.use((error, req, res, next) => {
//   console.error('Membership route error:', error);
  
//   res.status(error.statusCode || 500).json({
//     success: false,
//     error: error.message || 'Internal server error',
//     path: req.path,
//     method: req.method,
//     timestamp: new Date().toISOString()
//   });
// });

// export default router;

