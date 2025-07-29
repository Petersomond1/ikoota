// ikootaapi/routes/adminRoutes.js
// ===============================================
// CLEAN ADMIN ROUTES
// Separated full membership routes for clarity
// ===============================================

import express from 'express';
import { authenticate, authorize, cacheMiddleware } from '../middlewares/auth.middleware.js';

// Import clean membership controller
import {
  getFullMembershipApplications,
  getMembershipStats,
  getPendingCount,
  reviewApplication,
  bulkReviewApplications,
  getApplicationDetails,
  debugTest
} from '../controllers/adminMembershipController.js';

// Import existing admin controllers
import {
  getUsers,
  updateUserById,
  updateUser,
  banUser,
  unbanUser,
  manageUsers,
  grantPostingRights,
  deleteUser,
  createUser,
  getPendingContent,
  manageContent,
  approveContent,
  rejectContent,
  getReports,
  updateReportStatus,
  getMentors,
  getAuditLogs,
  sendNotification,
  exportUserData,
  maskUserIdentity
} from '../controllers/adminControllers.js';

const router = express.Router();

// ===== BASIC MIDDLEWARE =====
router.use(authenticate);
router.use(authorize(['admin', 'super_admin']));

// ===============================================
// ✅ FULL MEMBERSHIP REVIEW ROUTES (CLEAN)
// ===============================================

// Get applications (main endpoint for frontend)
router.get('/membership/applications', getFullMembershipApplications);

// Get statistics for dashboard
router.get('/membership/full-membership-stats', getMembershipStats);

// Get pending count for sidebar badge
router.get('/membership/pending-count', getPendingCount);

// Review individual application
router.put('/membership/review/:id', reviewApplication);

// Bulk review applications
router.post('/membership/bulk-review', bulkReviewApplications);

// Get application details
router.get('/membership/application/:id', getApplicationDetails);

// ===============================================
// USER MANAGEMENT ROUTES
// ===============================================

// GET /api/admin/users - Get all users
router.get('/users', cacheMiddleware(600), getUsers);

// PUT /api/admin/users/:id - Update user by ID
router.put('/users/:id', updateUserById);

// POST /api/admin/users/update - Update user
router.post('/users/update', updateUser);

// PUT /api/admin/update-user/:id - Alternative update route
router.put('/update-user/:id', updateUser);

// POST /api/admin/users/ban - Ban user
router.post('/users/ban', banUser);

// POST /api/admin/users/unban - Unban user
router.post('/users/unban', unbanUser);

// POST /api/admin/users/grant - Grant posting rights
router.post('/users/grant', grantPostingRights);

// GET /api/admin/users/manage - Get all users for management
router.get('/users/manage', cacheMiddleware(300), manageUsers);

// POST /api/admin/users/manage - Bulk user actions
router.post('/users/manage', manageUsers);

// POST /api/admin/create-user - Create new user
router.post('/create-user', createUser);

// DELETE /api/admin/delete-user/:id - Delete user
router.delete('/delete-user/:id', authorize(['super_admin']), deleteUser);

// POST /api/admin/mask-identity - Mask user identity
router.post('/mask-identity', maskUserIdentity);

// ===============================================
// CONTENT MANAGEMENT ROUTES
// ===============================================

// GET /api/admin/content/pending - Get pending content
router.get('/content/pending', cacheMiddleware(300), getPendingContent);

// GET /api/admin/content - Get all content for management
router.get('/content', cacheMiddleware(300), manageContent);

// POST /api/admin/content/manage - Bulk content actions
router.post('/content/manage', manageContent);

// POST /api/admin/content/approve/:id - Approve content
router.post('/content/approve/:id', approveContent);

// POST /api/admin/content/reject/:id - Reject content
router.post('/content/reject/:id', rejectContent);

// ===============================================
// REPORTS MANAGEMENT ROUTES
// ===============================================

// GET /api/admin/reports - Get all reports
router.get('/reports', cacheMiddleware(600), getReports);

// PUT /api/admin/update-report/:reportId - Update report status
router.put('/update-report/:reportId', updateReportStatus);

// ===============================================
// MENTORS MANAGEMENT ROUTES
// ===============================================

// GET /api/admin/mentors - Get all mentors
router.get('/mentors', cacheMiddleware(600), getMentors);

// ===============================================
// AUDIT LOGS ROUTES
// ===============================================

// GET /api/admin/audit-logs - Get audit logs
router.get('/audit-logs', cacheMiddleware(300), getAuditLogs);

// ===============================================
// UTILITY ROUTES
// ===============================================

// POST /api/admin/send-notification - Send notification
router.post('/send-notification', sendNotification);

// GET /api/admin/export-users - Export user data
router.get('/export-users', exportUserData);

// ===============================================
// DEVELOPMENT & DEBUG ROUTES
// ===============================================

if (process.env.NODE_ENV === 'development') {
  // Debug membership database
  router.get('/debug/membership', debugTest);
  
  // List all available routes
  router.get('/debug/routes', (req, res) => {
    res.json({
      success: true,
      message: 'Available admin routes',
      membershipRoutes: [
        'GET /membership/applications?status=pending|approved|declined|all',
        'GET /membership/full-membership-stats',
        'GET /membership/pending-count',
        'PUT /membership/review/:id',
        'POST /membership/bulk-review',
        'GET /membership/application/:id'
      ],
      userRoutes: [
        'GET /users',
        'PUT /users/:id',
        'POST /users/update',
        'GET /users/manage',
        'POST /create-user',
        'DELETE /delete-user/:id'
      ],
      contentRoutes: [
        'GET /content/pending',
        'GET /content',
        'POST /content/approve/:id',
        'POST /content/reject/:id'
      ],
      systemRoutes: [
        'GET /reports',
        'GET /mentors',
        'GET /audit-logs',
        'POST /send-notification',
        'GET /export-users'
      ],
      debugRoutes: [
        'GET /debug/membership',
        'GET /debug/routes'
      ],
      timestamp: new Date().toISOString()
    });
  });
}

// ===============================================
// ERROR HANDLING MIDDLEWARE
// ===============================================
router.use((error, req, res, next) => {
  console.error('❌ Admin routes error:', {
    error: error.message,
    stack: error.stack,
    route: req.originalUrl,
    method: req.method,
    user: req.user?.username,
    timestamp: new Date().toISOString()
  });
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? {
      stack: error.stack
    } : undefined,
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// 404 HANDLER FOR ADMIN ROUTES (MUST BE LAST)
// ===============================================
router.use('*', (req, res) => {
  console.log('🔍 Admin route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Admin route not found',
    availableRoutes: {
      membership: [
        'GET /membership/applications',
        'GET /membership/full-membership-stats',
        'GET /membership/pending-count',
        'PUT /membership/review/:id',
        'POST /membership/bulk-review'
      ],
      users: ['GET /users', 'PUT /users/:id', 'GET /users/manage'],
      content: ['GET /content/pending', 'GET /content'],
      system: ['GET /reports', 'GET /mentors', 'GET /audit-logs']
    },
    requestedRoute: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Clean admin routes loaded');

export default router;




// //ikootaapi\routes\adminRoutes.js
// // SIMPLIFIED VERSION - Remove problematic middleware temporarily
// import express from 'express';

// // Import controllers
// import {
//   getAllPendingMembershipApplications,
//   getPendingFullMembershipCount,
//   getFullMembershipStats,
//   reviewMembershipApplication,
//   getApplicationStats,
//   bulkReviewApplications,
//   setupDevAdmin,
//   getSystemConfig,
//   emergencyUserReset,
//   debugTest
// } from '../controllers/adminApplicationController.js';

// // Import existing controllers
// import {
//   getUsers,
//   updateUserById,
//   updateUser,
//   banUser,
//   unbanUser,
//   manageUsers,
//   grantPostingRights,
//   deleteUser,
//   createUser,
//   getPendingContent,
//   manageContent,
//   approveContent,
//   rejectContent,
//   getReports,
//   updateReportStatus,
//   getMentors,
//   getAuditLogs,
//   sendNotification,
//   exportUserData,
//   maskUserIdentity
// } from '../controllers/adminControllers.js';

// // Basic middleware only
// import { authenticate, authorize, cacheMiddleware } from '../middlewares/auth.middleware.js';

// const router = express.Router();

// // ===== BASIC MIDDLEWARE ONLY =====
// router.use(authenticate);
// router.use(authorize(['admin', 'super_admin']));

// // ===============================================
// // ✅ SIMPLIFIED MEMBERSHIP ROUTES (NO EXTRA MIDDLEWARE)
// // ===============================================

// // Get pending count for sidebar badge - BASIC VERSION
// router.get('/membership/pending-count', getPendingFullMembershipCount);

// // Get all pending full membership applications - BASIC VERSION
// router.get('/membership/applications', getAllPendingMembershipApplications);

// // Get full membership statistics for dashboard - BASIC VERSION
// router.get('/membership/full-membership-stats', getFullMembershipStats);

// // Get application statistics - BASIC VERSION
// router.get('/applications/stats', getApplicationStats);

// // Review individual application - BASIC VERSION
// router.put('/membership/review/:applicationId', reviewMembershipApplication);

// // Bulk review applications - BASIC VERSION
// router.post('/membership/bulk-review', bulkReviewApplications);

// // Debug test route - BASIC VERSION
// router.get('/debug/test', debugTest);

// // ===============================================
// // SYSTEM CONFIGURATION ROUTES
// // ===============================================

// // Get system configuration
// router.get('/config', cacheMiddleware(600), getSystemConfig);

// // Super admin emergency reset
// router.post('/super/emergency-reset/:userId', authorize(['super_admin']), emergencyUserReset);

// // ===============================================
// // EXISTING USER MANAGEMENT ROUTES
// // ===============================================

// // GET /api/admin/users - Get all users
// router.get('/users', cacheMiddleware(600), getUsers);

// // PUT /api/admin/users/:id - Update user by ID
// router.put('/users/:id', updateUserById);

// // POST /api/admin/users/update - Update user
// router.post('/users/update', updateUser);

// // PUT /api/admin/update-user/:id - Alternative update route
// router.put('/update-user/:id', updateUser);

// // POST /api/admin/users/ban - Ban user
// router.post('/users/ban', banUser);

// // POST /api/admin/users/unban - Unban user
// router.post('/users/unban', unbanUser);

// // POST /api/admin/users/grant - Grant posting rights
// router.post('/users/grant', grantPostingRights);

// // GET /api/admin/users/manage - Get all users for management
// router.get('/users/manage', cacheMiddleware(300), manageUsers);

// // POST /api/admin/users/manage - Bulk user actions
// router.post('/users/manage', manageUsers);

// // POST /api/admin/create-user - Create new user
// router.post('/create-user', createUser);

// // DELETE /api/admin/delete-user/:id - Delete user
// router.delete('/delete-user/:id', authorize(['super_admin']), deleteUser);

// // POST /api/admin/mask-identity - Mask user identity
// router.post('/mask-identity', maskUserIdentity);

// // ===============================================
// // CONTENT MANAGEMENT ROUTES
// // ===============================================

// // GET /api/admin/content/pending - Get pending content
// router.get('/content/pending', cacheMiddleware(300), getPendingContent);

// // GET /api/admin/content - Get all content for management
// router.get('/content', cacheMiddleware(300), manageContent);

// // POST /api/admin/content/manage - Bulk content actions
// router.post('/content/manage', manageContent);

// // POST /api/admin/content/approve/:id - Approve content
// router.post('/content/approve/:id', approveContent);

// // POST /api/admin/content/reject/:id - Reject content
// router.post('/content/reject/:id', rejectContent);

// // ===============================================
// // REPORTS MANAGEMENT ROUTES
// // ===============================================

// // GET /api/admin/reports - Get all reports
// router.get('/reports', cacheMiddleware(600), getReports);

// // PUT /api/admin/update-report/:reportId - Update report status
// router.put('/update-report/:reportId', updateReportStatus);

// // ===============================================
// // MENTORS MANAGEMENT ROUTES
// // ===============================================

// // GET /api/admin/mentors - Get all mentors
// router.get('/mentors', cacheMiddleware(600), getMentors);

// // ===============================================
// // AUDIT LOGS ROUTES
// // ===============================================

// // GET /api/admin/audit-logs - Get audit logs
// router.get('/audit-logs', cacheMiddleware(300), getAuditLogs);

// // ===============================================
// // UTILITY ROUTES
// // ===============================================

// // POST /api/admin/send-notification - Send notification
// router.post('/send-notification', sendNotification);

// // GET /api/admin/export-users - Export user data
// router.get('/export-users', exportUserData);

// // ===============================================
// // DEVELOPMENT ROUTES
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   router.post('/dev/setup-admin/:userId', setupDevAdmin);
  
//   // Simple debug routes
//   router.get('/debug/applications', (req, res) => {
//     res.json({
//       success: true,
//       message: 'Debug endpoint for applications',
//       timestamp: new Date().toISOString(),
//       user: req.user?.username
//     });
//   });
  
//   router.get('/debug/permissions/:userId', (req, res) => {
//     res.json({
//       success: true,
//       message: 'Debug endpoint for permissions',
//       user: req.user,
//       params: req.params,
//       timestamp: new Date().toISOString()
//     });
//   });
// }

// // ===============================================
// // ERROR HANDLING MIDDLEWARE
// // ===============================================
// router.use((error, req, res, next) => {
//   console.error('❌ Admin routes error:', {
//     error: error.message,
//     stack: error.stack,
//     route: req.originalUrl,
//     method: req.method,
//     user: req.user?.username,
//     timestamp: new Date().toISOString()
//   });
  
//   res.status(error.status || 500).json({
//     success: false,
//     message: error.message || 'Internal server error',
//     error: process.env.NODE_ENV === 'development' ? {
//       stack: error.stack
//     } : undefined,
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // 🔥 ROUTE NOT FOUND HANDLER - MUST BE LAST
// // ===============================================
// router.use('*', (req, res) => {
//   console.log('🔍 CATCH-ALL: Admin route not found:', req.originalUrl);
//   res.status(404).json({
//     success: false,
//     message: 'Admin route not found',
//     availableRoutes: [
//       'GET /users',
//       'GET /membership/applications',
//       'GET /membership/pending-count', 
//       'GET /membership/full-membership-stats',
//       'PUT /membership/review/:applicationId',
//       'GET /applications/stats',
//       'POST /membership/bulk-review',
//       'GET /config',
//       'GET /reports',
//       'GET /mentors',
//       'GET /audit-logs'
//     ],
//     requestedRoute: req.originalUrl,
//     method: req.method
//   });
// });

// export default router;




// //ikootaapi\routes\adminRoutes.js
// import express from 'express';
// import {
//   // User Management Controllers (Existing)
//   getUsers,
//   updateUserById,
//   updateUser,
//   banUser,
//   unbanUser,
//   manageUsers,
//   grantPostingRights,
//   deleteUser,
//   createUser,
  
//   // Content Management Controllers (Existing)
//   getPendingContent,
//   manageContent,
//   approveContent,
//   rejectContent,
  
//   // Reports Controllers (Existing)
//   getReports,
//   updateReportStatus,
  
//   // Mentors Controllers (Existing)
//   getMentors,
  
//   // Audit Logs Controllers (Existing)
//   getAuditLogs,
  
//   // Utility Controllers (Existing)
//   sendNotification,
//   exportUserData,
//   maskUserIdentity
// } from '../controllers/adminControllers.js';

// // ✅ NEW: Full Membership Review Controllers
// import {
//   getAllPendingMembershipApplications,
//   getPendingFullMembershipCount,
//   getFullMembershipStats,
//   reviewMembershipApplication,
//   getApplicationStats,
//   bulkReviewApplications,
//   setupDevAdmin,
//   getSystemConfig,
//   emergencyUserReset,
//   debugTest
// } from '../controllers/adminApplicationController.js';

// // ✅ NEW: Enhanced Admin Middleware
// import {
//   canReviewApplications,
//   validateReviewData,
//   logAdminAction,
//   addRequestTracking,
//   validateBulkOperation,
//   checkSystemLoad,
//   rateLimitAdminActions
// } from '../middlewares/adminMiddleware.js';

// // Existing Middleware
// import { authenticate, authorize, cacheMiddleware } from '../middlewares/auth.middleware.js';

// const router = express.Router();

// // ===== MIDDLEWARE - Apply to all admin routes =====
// router.use(authenticate);
// router.use(authorize(['admin', 'super_admin']));

// // ===============================================
// // ✅ FIXED: SPECIFIC ROUTES FIRST (before catch-all)
// // ===============================================

// // 🔥 CRITICAL: These specific routes MUST come BEFORE any catch-all routes

// // Get pending count for sidebar badge
// router.get('/membership/pending-count',
//   addRequestTracking,
//   canReviewApplications,
//   getPendingFullMembershipCount
// );

// // Get all pending full membership applications
// router.get('/membership/applications', 
//   addRequestTracking,
//   canReviewApplications,
//   getAllPendingMembershipApplications
// );

// // Get full membership statistics for dashboard
// router.get('/membership/full-membership-stats',
//   addRequestTracking,
//   canReviewApplications,
//   getFullMembershipStats
// );

// // Get application statistics
// router.get('/applications/stats',
//   addRequestTracking,
//   canReviewApplications,
//   getApplicationStats
// );

// // Review individual application
// router.put('/membership/review/:applicationId',
//   addRequestTracking,
//   canReviewApplications,
//   validateReviewData,
//   rateLimitAdminActions,
//   logAdminAction,
//   reviewMembershipApplication
// );

// // Bulk review applications
// router.post('/membership/bulk-review',
//   addRequestTracking,
//   canReviewApplications,
//   validateBulkOperation,
//   checkSystemLoad,
//   rateLimitAdminActions,
//   logAdminAction,
//   bulkReviewApplications
// );

// // Debug test route
// router.get('/debug/test', 
//   addRequestTracking,
//   canReviewApplications,
//   debugTest
// );

// // ===============================================
// // SYSTEM CONFIGURATION ROUTES
// // ===============================================

// // Get system configuration
// router.get('/config', 
//   addRequestTracking,
//   cacheMiddleware(600),
//   getSystemConfig
// );

// // Super admin emergency reset
// router.post('/super/emergency-reset/:userId',
//   addRequestTracking,
//   authorize(['super_admin']),
//   logAdminAction,
//   emergencyUserReset
// );

// // ===============================================
// // EXISTING USER MANAGEMENT ROUTES
// // ===============================================

// // GET /api/admin/users - Get all users
// router.get('/users', cacheMiddleware(600), getUsers);

// // PUT /api/admin/users/:id - Update user by ID (isblocked, isbanned)
// router.put('/users/:id', 
//   addRequestTracking,
//   updateUserById
// );

// // POST /api/admin/users/update - Update user (rating, userclass, etc.)
// router.post('/users/update', 
//   addRequestTracking,
//   updateUser
// );

// // Alternative route for updating user with ID in params
// router.put('/update-user/:id', 
//   addRequestTracking,
//   updateUser
// );

// // POST /api/admin/users/ban - Ban user
// router.post('/users/ban', 
//   addRequestTracking,
//   logAdminAction,
//   banUser
// );

// // POST /api/admin/users/unban - Unban user
// router.post('/users/unban', 
//   addRequestTracking,
//   logAdminAction,
//   unbanUser
// );

// // POST /api/admin/users/grant - Grant posting rights
// router.post('/users/grant', 
//   addRequestTracking,
//   logAdminAction,
//   grantPostingRights
// );

// // GET /api/admin/users/manage - Get all users for management
// router.get('/users/manage', 
//   cacheMiddleware(300),
//   manageUsers
// );

// // POST /api/admin/users/manage - Bulk user actions
// router.post('/users/manage', 
//   addRequestTracking,
//   validateBulkOperation,
//   logAdminAction,
//   manageUsers
// );

// // POST /api/admin/create-user - Create new user
// router.post('/create-user', 
//   addRequestTracking,
//   logAdminAction,
//   createUser
// );

// // DELETE /api/admin/delete-user/:id - Delete user
// router.delete('/delete-user/:id', 
//   addRequestTracking,
//   authorize(['super_admin']),
//   logAdminAction,
//   deleteUser
// );

// // POST /api/admin/mask-identity - Mask user identity
// router.post('/mask-identity', 
//   addRequestTracking,
//   logAdminAction,
//   maskUserIdentity
// );

// // ===============================================
// // CONTENT MANAGEMENT ROUTES
// // ===============================================

// // GET /api/admin/content/pending - Get pending content
// router.get('/content/pending', 
//   cacheMiddleware(300),
//   getPendingContent
// );

// // GET /api/admin/content - Get all content for management
// router.get('/content', 
//   cacheMiddleware(300),
//   manageContent
// );

// // POST /api/admin/content/manage - Bulk content actions
// router.post('/content/manage', 
//   addRequestTracking,
//   validateBulkOperation,
//   logAdminAction,
//   manageContent
// );

// // POST /api/admin/content/approve/:id - Approve content
// router.post('/content/approve/:id', 
//   addRequestTracking,
//   logAdminAction,
//   approveContent
// );

// // POST /api/admin/content/reject/:id - Reject content
// router.post('/content/reject/:id', 
//   addRequestTracking,
//   logAdminAction,
//   rejectContent
// );

// // ===============================================
// // REPORTS MANAGEMENT ROUTES
// // ===============================================

// // GET /api/admin/reports - Get all reports
// router.get('/reports', 
//   cacheMiddleware(600), 
//   getReports
// );

// // PUT /api/admin/update-report/:reportId - Update report status
// router.put('/update-report/:reportId', 
//   addRequestTracking,
//   logAdminAction,
//   updateReportStatus
// );

// // ===============================================
// // MENTORS MANAGEMENT ROUTES
// // ===============================================

// // GET /api/admin/mentors - Get all mentors
// router.get('/mentors', 
//   cacheMiddleware(600),
//   getMentors
// );

// // ===============================================
// // AUDIT LOGS ROUTES
// // ===============================================

// // GET /api/admin/audit-logs - Get audit logs
// router.get('/audit-logs', 
//   addRequestTracking,
//   cacheMiddleware(300),
//   getAuditLogs
// );

// // ===============================================
// // UTILITY ROUTES
// // ===============================================

// // POST /api/admin/send-notification - Send notification to user
// router.post('/send-notification', 
//   addRequestTracking,
//   rateLimitAdminActions,
//   logAdminAction,
//   sendNotification
// );

// // GET /api/admin/export-users - Export user data
// router.get('/export-users', 
//   addRequestTracking,
//   logAdminAction,
//   exportUserData
// );

// // ===============================================
// // DEVELOPMENT ROUTES
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   router.post('/dev/setup-admin/:userId', 
//     addRequestTracking,
//     setupDevAdmin
//   );
  
//   // Debug routes for development
//   router.get('/debug/applications', 
//     addRequestTracking,
//     canReviewApplications,
//     (req, res) => {
//       res.json({
//         success: true,
//         message: 'Debug endpoint for applications',
//         timestamp: new Date().toISOString(),
//         user: req.user?.username,
//         reviewer: req.reviewer?.username
//       });
//     }
//   );
  
//   router.get('/debug/permissions/:userId', 
//     addRequestTracking,
//     (req, res) => {
//       res.json({
//         success: true,
//         message: 'Debug endpoint for permissions',
//         user: req.user,
//         params: req.params,
//         timestamp: new Date().toISOString()
//       });
//     }
//   );
// }

// // ===============================================
// // ERROR HANDLING MIDDLEWARE
// // ===============================================
// router.use((error, req, res, next) => {
//   console.error('❌ Admin routes error:', {
//     error: error.message,
//     stack: error.stack,
//     route: req.originalUrl,
//     method: req.method,
//     user: req.user?.username,
//     timestamp: new Date().toISOString()
//   });
  
//   res.status(error.status || 500).json({
//     success: false,
//     message: error.message || 'Internal server error',
//     error: process.env.NODE_ENV === 'development' ? {
//       stack: error.stack,
//       details: error.details
//     } : undefined,
//     requestId: req.id,
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // 🔥 ROUTE NOT FOUND HANDLER - MUST BE LAST
// // ===============================================
// router.use('*', (req, res) => {
//   console.log('🔍 CATCH-ALL: Admin route not found:', req.originalUrl);
//   res.status(404).json({
//     success: false,
//     message: 'Admin route not found',
//     availableRoutes: [
//       'GET /users',
//       'GET /membership/applications',
//       'GET /membership/pending-count',
//       'GET /membership/full-membership-stats',
//       'PUT /membership/review/:applicationId',
//       'GET /applications/stats',
//       'POST /membership/bulk-review',
//       'GET /config',
//       'GET /reports',
//       'GET /mentors',
//       'GET /audit-logs'
//     ],
//     requestedRoute: req.originalUrl,
//     method: req.method
//   });
// });

// export default router;






// //ikootaapi/routes/adminRoutes.js - Complete with Full Membership Review Routes

// import express from 'express';
// import {
//   // User Management Controllers (Existing)
//   getUsers,
//   updateUserById,
//   updateUser,
//   banUser,
//   unbanUser,
//   manageUsers,
//   grantPostingRights,
//   deleteUser,
//   createUser,
  
//   // Content Management Controllers (Existing)
//   getPendingContent,
//   manageContent,
//   approveContent,
//   rejectContent,
  
//   // Reports Controllers (Existing)
//   getReports,
//   updateReportStatus,
  
//   // Mentors Controllers (Existing)
//   getMentors,
  
//   // Audit Logs Controllers (Existing)
//   getAuditLogs,
  
//   // Utility Controllers (Existing)
//   sendNotification,
//   exportUserData,
//   maskUserIdentity
// } from '../controllers/adminControllers.js';

// // ✅ NEW: Full Membership Review Controllers
// import {
//   getAllPendingMembershipApplications,
//   getPendingFullMembershipCount,
//   getFullMembershipStats,
//   reviewMembershipApplication,
//   getApplicationStats,
//   bulkReviewApplications,
//   setupDevAdmin,
//   getSystemConfig,
//   emergencyUserReset,
//   debugTest
// } from '../controllers/adminApplicationController.js';

// // ✅ NEW: Enhanced Admin Middleware
// import {
//   canReviewApplications,
//   validateReviewData,
//   logAdminAction,
//   addRequestTracking,
//   validateBulkOperation,
//   checkSystemLoad,
//   rateLimitAdminActions
// } from '../middlewares/adminMiddleware.js';

// // Existing Middleware
// import { authenticate, authorize, cacheMiddleware } from '../middlewares/auth.middleware.js';

// const router = express.Router();

// // ===== MIDDLEWARE - Apply to all admin routes =====
// router.use(authenticate);
// router.use(authorize(['admin', 'super_admin']));





// // 1. Add this to your adminRoutes.js - BEFORE any existing routes
// router.get('/membership/applications', 
//   addRequestTracking,
//   canReviewApplications,
//   (req, res) => {
//     console.log('🔍 BYPASS: Applications endpoint hit');
//     res.json({
//       success: true,
//       data: {
//         applications: [{
//           id: 7,
//           user_id: 7,
//           username: 'Monika',
//           email: 'peterslmonika@gmail.com',
//           ticket: 'FMMONPET2507271354',
//           status: 'pending',
//           submittedAt: '2025-07-27T17:54:22.000Z',
//           reviewedAt: null,
//           reviewedBy: null,
//           adminNotes: null,
//           answers: {
//             question1: "Sample answer 1",
//             question2: "Sample answer 2"
//           }
//         }],
//         pagination: {
//           total: 1,
//           limit: 50,
//           offset: 0,
//           hasMore: false,
//           page: 1,
//           totalPages: 1
//         },
//         reviewer: 'pet',
//         reviewerRole: 'super_admin'
//       }
//     });
//   }
// );

// // 2. Add this for the stats endpoint
// router.get('/membership/full-membership-stats',
//   addRequestTracking,
//   canReviewApplications,
//   (req, res) => {
//     console.log('🔍 BYPASS: Stats endpoint hit');
//     res.json({
//       success: true,
//       pendingCount: 1,
//       approvedCount: 0,
//       declinedCount: 0,
//       totalApplications: 1,
//       avgReviewTime: 0
//     });
//   }
// );

// // 3. Add this for application stats
// router.get('/applications/stats',
//   addRequestTracking,
//   canReviewApplications,
//   (req, res) => {
//     console.log('🔍 BYPASS: Application stats endpoint hit');
//     res.json({
//       success: true,
//       data: {
//         statistics: {
//           total_applications: 1,
//           pending_count: 1,
//           approved_count: 0,
//           declined_count: 0,
//           avg_review_time_hours: 0
//         },
//         recentActivity: []
//       }
//     });
//   }
// );

// // 4. Debug route to see what's being called
// router.get('*', (req, res) => {
//   console.log('🔍 CATCH-ALL: Admin route called:', req.originalUrl);
//   res.json({
//     success: false,
//     message: 'Admin route not found',
//     requestedRoute: req.originalUrl,
//     availableRoutes: [
//       '/membership/applications',
//       '/membership/pending-count',
//       '/membership/full-membership-stats',
//       '/applications/stats'
//     ]
//   });
// });




// // ===============================================
// // ✅ NEW: FULL MEMBERSHIP REVIEW ROUTES
// // ===============================================

// // Get all pending full membership applications
// router.get('/membership/applications', 
//   addRequestTracking,
//   canReviewApplications,
//   rateLimitAdminActions,
//   getAllPendingMembershipApplications
// );

// // Get pending count for sidebar badge
// router.get('/membership/pending-count',
//   addRequestTracking,
//   canReviewApplications,
//   getPendingFullMembershipCount
// );

// // Get full membership statistics for dashboard
// router.get('/membership/full-membership-stats',
//   addRequestTracking,
//   canReviewApplications,
//   getFullMembershipStats
// );

// // Review individual application
// router.put('/membership/review/:applicationId',
//   addRequestTracking,
//   canReviewApplications,
//   validateReviewData,
//   rateLimitAdminActions,
//   logAdminAction,
//   reviewMembershipApplication
// );

// // Get application statistics
// router.get('/applications/stats',
//   addRequestTracking,
//   canReviewApplications,
//   getApplicationStats
// );

// // Bulk review applications (for future use)
// router.post('/membership/bulk-review',
//   addRequestTracking,
//   canReviewApplications,
//   validateBulkOperation,
//   checkSystemLoad,
//   rateLimitAdminActions,
//   logAdminAction,
//   bulkReviewApplications
// );

// // ===============================================
// // SYSTEM CONFIGURATION ROUTES
// // ===============================================

// // Get system configuration
// router.get('/config', 
//   addRequestTracking,
//   cacheMiddleware(600),
//   getSystemConfig
// );

// // Super admin emergency reset
// router.post('/super/emergency-reset/:userId',
//   addRequestTracking,
//   authorize(['super_admin']),
//   logAdminAction,
//   emergencyUserReset
// );

// // ===============================================
// // EXISTING USER MANAGEMENT ROUTES
// // ===============================================

// // GET /api/admin/users - Get all users
// router.get('/users', cacheMiddleware(600), getUsers);

// // PUT /api/admin/users/:id - Update user by ID (isblocked, isbanned)
// router.put('/users/:id', 
//   addRequestTracking,
//   updateUserById
// );

// // POST /api/admin/users/update - Update user (rating, userclass, etc.)
// router.post('/users/update', 
//   addRequestTracking,
//   updateUser
// );

// // Alternative route for updating user with ID in params
// router.put('/update-user/:id', 
//   addRequestTracking,
//   updateUser
// );

// // POST /api/admin/users/ban - Ban user
// router.post('/users/ban', 
//   addRequestTracking,
//   logAdminAction,
//   banUser
// );

// // POST /api/admin/users/unban - Unban user
// router.post('/users/unban', 
//   addRequestTracking,
//   logAdminAction,
//   unbanUser
// );

// // POST /api/admin/users/grant - Grant posting rights
// router.post('/users/grant', 
//   addRequestTracking,
//   logAdminAction,
//   grantPostingRights
// );

// // GET /api/admin/users/manage - Get all users for management
// router.get('/users/manage', 
//   cacheMiddleware(300),
//   manageUsers
// );

// // POST /api/admin/users/manage - Bulk user actions
// router.post('/users/manage', 
//   addRequestTracking,
//   validateBulkOperation,
//   logAdminAction,
//   manageUsers
// );

// // POST /api/admin/create-user - Create new user
// router.post('/create-user', 
//   addRequestTracking,
//   logAdminAction,
//   createUser
// );

// // DELETE /api/admin/delete-user/:id - Delete user
// router.delete('/delete-user/:id', 
//   addRequestTracking,
//   authorize(['super_admin']),
//   logAdminAction,
//   deleteUser
// );

// // POST /api/admin/mask-identity - Mask user identity
// router.post('/mask-identity', 
//   addRequestTracking,
//   logAdminAction,
//   maskUserIdentity
// );

// // ===============================================
// // CONTENT MANAGEMENT ROUTES
// // ===============================================

// // GET /api/admin/content/pending - Get pending content
// router.get('/content/pending', 
//   cacheMiddleware(300),
//   getPendingContent
// );

// // GET /api/admin/content - Get all content for management
// router.get('/content', 
//   cacheMiddleware(300),
//   manageContent
// );

// // POST /api/admin/content/manage - Bulk content actions
// router.post('/content/manage', 
//   addRequestTracking,
//   validateBulkOperation,
//   logAdminAction,
//   manageContent
// );

// // POST /api/admin/content/approve/:id - Approve content
// router.post('/content/approve/:id', 
//   addRequestTracking,
//   logAdminAction,
//   approveContent
// );

// // POST /api/admin/content/reject/:id - Reject content
// router.post('/content/reject/:id', 
//   addRequestTracking,
//   logAdminAction,
//   rejectContent
// );

// // ===============================================
// // REPORTS MANAGEMENT ROUTES
// // ===============================================

// // GET /api/admin/reports - Get all reports
// router.get('/reports', 
//   cacheMiddleware(600), 
//   getReports
// );

// // PUT /api/admin/update-report/:reportId - Update report status
// router.put('/update-report/:reportId', 
//   addRequestTracking,
//   logAdminAction,
//   updateReportStatus
// );

// // ===============================================
// // MENTORS MANAGEMENT ROUTES
// // ===============================================

// // GET /api/admin/mentors - Get all mentors
// router.get('/mentors', 
//   cacheMiddleware(600),
//   getMentors
// );

// // ===============================================
// // AUDIT LOGS ROUTES
// // ===============================================

// // GET /api/admin/audit-logs - Get audit logs
// router.get('/audit-logs', 
//   addRequestTracking,
//   cacheMiddleware(300),
//   getAuditLogs
// );

// // ===============================================
// // UTILITY ROUTES
// // ===============================================

// // POST /api/admin/send-notification - Send notification to user
// router.post('/send-notification', 
//   addRequestTracking,
//   rateLimitAdminActions,
//   logAdminAction,
//   sendNotification
// );

// // GET /api/admin/export-users - Export user data
// router.get('/export-users', 
//   addRequestTracking,
//   logAdminAction,
//   exportUserData
// );

// // ===============================================
// // ✅ ENHANCED: MEMBERSHIP APPLICATION ROUTES
// // (Legacy compatibility + new enhanced routes)
// // ===============================================

// // Enhanced routes for membership applications
// router.get('/pending-applications',
//   addRequestTracking,
//   canReviewApplications,
//   getAllPendingMembershipApplications
// );

// router.get('/applications',
//   addRequestTracking,
//   canReviewApplications,
//   getAllPendingMembershipApplications
// );

// // Legacy application management routes
// router.put('/update-user-status/:userId', 
//   addRequestTracking,
//   canReviewApplications,
//   validateReviewData,
//   logAdminAction,
//   // Add your existing updateApplicationStatus function here
// );

// router.put('/applications/:userId/status', 
//   addRequestTracking,
//   canReviewApplications,
//   validateReviewData,
//   logAdminAction,
//   // Add your existing updateApplicationStatus function here
// );

// // Bulk operations for applications
// router.post('/bulk-approve', 
//   addRequestTracking,
//   canReviewApplications,
//   validateBulkOperation,
//   checkSystemLoad,
//   logAdminAction,
//   // Add your existing bulkApproveApplications function here
// );

// router.post('/applications/bulk', 
//   addRequestTracking,
//   canReviewApplications,
//   validateBulkOperation,
//   checkSystemLoad,
//   logAdminAction,
//   // Add your existing bulkApproveApplications function here
// );

// // ===============================================
// // LEGACY COMPATIBILITY ROUTES
// // ===============================================

// // Alternative routes for content management
// router.get('/pending-content', getPendingContent);
// router.post('/approve-content/:id', 
//   addRequestTracking,
//   logAdminAction,
//   approveContent
// );
// router.post('/reject-content/:id', 
//   addRequestTracking,
//   logAdminAction,
//   rejectContent
// );

// // Alternative routes for user management
// router.post('/ban-user/:id', (req, res) => {
//   req.body.userId = req.params.id;
//   addRequestTracking(req, res, () => {
//     logAdminAction(req, res, () => {
//       banUser(req, res);
//     });
//   });
// });

// router.post('/unban-user/:id', (req, res) => {
//   req.body.userId = req.params.id;
//   addRequestTracking(req, res, () => {
//     logAdminAction(req, res, () => {
//       unbanUser(req, res);
//     });
//   });
// });

// router.post('/grant-posting-rights/:id', (req, res) => {
//   req.body.userId = req.params.id;
//   addRequestTracking(req, res, () => {
//     logAdminAction(req, res, () => {
//       grantPostingRights(req, res);
//     });
//   });
// });

// // ===============================================
// // DEVELOPMENT ROUTES
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   router.post('/dev/setup-admin/:userId', 
//     addRequestTracking,
//     setupDevAdmin
//   );
  
//   // Debug routes for development
//   router.get('/debug/applications', 
//     addRequestTracking,
//     canReviewApplications,
//     (req, res) => {
//       res.json({
//         success: true,
//         message: 'Debug endpoint for applications',
//         timestamp: new Date().toISOString(),
//         user: req.user?.username,
//         reviewer: req.reviewer?.username
//       });
//     }
//   );
  
//   router.get('/debug/permissions/:userId', 
//     addRequestTracking,
//     (req, res) => {
//       res.json({
//         success: true,
//         message: 'Debug endpoint for permissions',
//         user: req.user,
//         params: req.params,
//         timestamp: new Date().toISOString()
//       });
//     }
//   );
// }


// router.get('/debug/test', 
//   addRequestTracking,
//   canReviewApplications,
//   debugTest
// );

// // ===============================================
// // ERROR HANDLING MIDDLEWARE
// // ===============================================
// router.use((error, req, res, next) => {
//   console.error('❌ Admin routes error:', {
//     error: error.message,
//     stack: error.stack,
//     route: req.originalUrl,
//     method: req.method,
//     user: req.user?.username,
//     timestamp: new Date().toISOString()
//   });
  
//   res.status(error.status || 500).json({
//     success: false,
//     message: error.message || 'Internal server error',
//     error: process.env.NODE_ENV === 'development' ? {
//       stack: error.stack,
//       details: error.details
//     } : undefined,
//     requestId: req.id,
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // ROUTE NOT FOUND HANDLER
// // ===============================================
// router.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Admin route not found',
//     availableRoutes: [
//       'GET /users',
//       'GET /membership/applications',
//       'GET /membership/pending-count',
//       'GET /membership/full-membership-stats',
//       'PUT /membership/review/:applicationId',
//       'GET /applications/stats',
//       'POST /membership/bulk-review',
//       'GET /config',
//       'GET /reports',
//       'GET /mentors',
//       'GET /audit-logs'
//     ],
//     requestedRoute: req.originalUrl,
//     method: req.method
//   });
// });

// export default router;






// //ikootaapi/routes/adminRoutes.js - Complete and properly organized routes

// import express from 'express';
// import {
//   // User Management Controllers
//   getUsers,
//   updateUserById,
//   updateUser,
//   banUser,
//   unbanUser,
//   manageUsers,
//   grantPostingRights,
//   deleteUser,
//   createUser,
  
//   // Content Management Controllers
//   getPendingContent,
//   manageContent,
//   approveContent,
//   rejectContent,
  
//   // Reports Controllers
//   getReports,
//   updateReportStatus,
  
//   // Mentors Controllers
//   getMentors,
  
//   // Audit Logs Controllers
//   getAuditLogs,
  
//   // Utility Controllers
//   sendNotification,
//   exportUserData,
//   maskUserIdentity
// } from '../controllers/adminControllers.js';

// import { authenticate, authorize, cacheMiddleware } from '../middlewares/auth.middleware.js';

// const router = express.Router();

// // ===== MIDDLEWARE - Apply to all admin routes =====
// router.use(authenticate);
// router.use(authorize(['admin', 'super_admin']));

// // ===== USER MANAGEMENT ROUTES =====

// // GET /api/admin/users - Get all users
// router.get('/users', cacheMiddleware(600), getUsers);

// // PUT /api/admin/users/:id - Update user by ID (isblocked, isbanned)
// router.put('/users/:id', updateUserById);

// // POST /api/admin/users/update - Update user (rating, userclass, etc.)
// router.post('/users/update', updateUser);

// // Alternative route for updating user with ID in params
// router.put('/update-user/:id', updateUser);

// // POST /api/admin/users/ban - Ban user
// router.post('/users/ban', banUser);

// // POST /api/admin/users/unban - Unban user
// router.post('/users/unban', unbanUser);

// // POST /api/admin/users/grant - Grant posting rights
// router.post('/users/grant', grantPostingRights);

// // GET /api/admin/users/manage - Get all users for management
// router.get('/users/manage', manageUsers);

// // POST /api/admin/users/manage - Bulk user actions
// router.post('/users/manage', manageUsers);

// // POST /api/admin/create-user - Create new user
// router.post('/create-user', createUser);

// // DELETE /api/admin/delete-user/:id - Delete user
// router.delete('/delete-user/:id', deleteUser);

// // POST /api/admin/mask-identity - Mask user identity
// router.post('/mask-identity', maskUserIdentity);

// // ===== CONTENT MANAGEMENT ROUTES =====

// // GET /api/admin/content/pending - Get pending content
// router.get('/content/pending', getPendingContent);

// // GET /api/admin/content - Get all content for management
// router.get('/content', manageContent);

// // POST /api/admin/content/manage - Bulk content actions
// router.post('/content/manage', manageContent);

// // POST /api/admin/content/approve/:id - Approve content
// router.post('/content/approve/:id', approveContent);

// // POST /api/admin/content/reject/:id - Reject content
// router.post('/content/reject/:id', rejectContent);

// // ===== REPORTS MANAGEMENT ROUTES =====

// // GET /api/admin/reports - Get all reports
// router.get('/reports', cacheMiddleware(600), getReports);

// // PUT /api/admin/update-report/:reportId - Update report status
// router.put('/update-report/:reportId', updateReportStatus);

// // ===== MENTORS MANAGEMENT ROUTES =====

// // GET /api/admin/mentors - Get all mentors
// router.get('/mentors', getMentors);

// // ===== AUDIT LOGS ROUTES =====

// // GET /api/admin/audit-logs - Get audit logs
// router.get('/audit-logs', getAuditLogs);

// // ===== UTILITY ROUTES =====

// // POST /api/admin/send-notification - Send notification to user
// router.post('/send-notification', sendNotification);

// // GET /api/admin/export-users - Export user data
// router.get('/export-users', exportUserData);

// // ===== LEGACY COMPATIBILITY ROUTES =====
// // These routes maintain compatibility with existing frontend calls

// // Alternative routes for content management
// router.get('/pending-content', getPendingContent);
// router.post('/approve-content/:id', approveContent);
// router.post('/reject-content/:id', rejectContent);

// // Alternative routes for user management
// router.post('/ban-user/:id', (req, res) => {
//   req.body.userId = req.params.id;
//   banUser(req, res);
// });

// router.post('/unban-user/:id', (req, res) => {
//   req.body.userId = req.params.id;
//   unbanUser(req, res);
// });

// router.post('/grant-posting-rights/:id', (req, res) => {
//   req.body.userId = req.params.id;
//   grantPostingRights(req, res);
// });

// // ===== ERROR HANDLING MIDDLEWARE =====
// router.use((error, req, res, next) => {
//   console.error('❌ Admin routes error:', error);
  
//   res.status(error.status || 500).json({
//     success: false,
//     message: error.message || 'Internal server error',
//     error: process.env.NODE_ENV === 'development' ? error.stack : undefined
//   });
// });

// export default router;

