// ikootaapi/routes/userAdminRoutes.js
// ADMIN USER MANAGEMENT ROUTES
// Administrative control over user accounts and permissions
// *** MERGED WITH IDENTITY ADMIN ROUTES ***

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

// ✅ Admin User Controller Imports
import {
  // User Management
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  searchUsers,
  exportUserData,
  
  // User Permissions & Actions
  updateUserRole,
  grantPostingRights,
  banUser,
  unbanUser,
  
  // ID Generation
  generateBulkIds,
  generateConverseId,
  generateClassIdForAdmin,
  
  // Identity Management
  maskUserIdentity,
  
  // Mentors Management
  getMentors,
  assignMentorRole,
  removeMentorRole,
  
  // Testing
  testAdminRoutes
} from '../controllers/userAdminControllers.js';

// ✅ MERGED: Identity Admin Controller Imports
import {
  // Core Identity Operations
  maskUserIdentity as maskUserIdentityAdvanced,
  unmaskUserIdentity,
  getIdentityAuditTrail,
  getIdentityOverview,
  searchMaskedIdentities,
  generateBulkConverseIds,
  verifyIdentityIntegrity,
  getMentorAnalytics,
  bulkAssignMentors,
  getIdentityDashboard,
  exportIdentityData,
  manageMentorAssignment,
  generateUniqueConverseId,
  getCompleteUserIdentity,
  updateMaskingSettings
} from '../controllers/identityAdminControllers.js';

import { getUserStats } from '../controllers/userStatusControllers.js';

const router = express.Router();

// ===============================================
// APPLY ADMIN AUTHENTICATION TO ALL ROUTES
// ===============================================
router.use(authenticate);
router.use(authorize(['admin', 'super_admin']));

// ===============================================
// USER MANAGEMENT
// ===============================================

// GET /admin/users - Get all users with pagination and filters
router.get('/', getAllUsers);

// GET /admin/users/search - Search users
router.get('/search', searchUsers);

// GET /admin/users/stats - Get user statistics
router.get('/stats', getUserStats);

// GET /admin/users/:id - Get specific user
router.get('/:id', getUserById);

// POST /admin/users/create - Create new user
router.post('/create', createUser);

// PUT /admin/users/:id - Update user
router.put('/:id', updateUser);

// DELETE /admin/users/:id - Delete user (super admin only)
router.delete('/:id', authorize(['super_admin']), deleteUser);

// ===============================================
// USER PERMISSIONS & ROLES
// ===============================================

// PUT /admin/users/role - Update user role
router.put('/role', updateUserRole);

// POST /admin/users/grant-posting-rights - Grant posting rights
router.post('/grant-posting-rights', grantPostingRights);

// POST /admin/users/ban - Ban user
router.post('/ban', banUser);

// POST /admin/users/unban - Unban user  
router.post('/unban', unbanUser);

// ===============================================
// ID GENERATION
// ===============================================

// POST /admin/users/generate-bulk-ids - Generate bulk IDs
router.post('/generate-bulk-ids', generateBulkIds);

// POST /admin/users/generate-converse-id - Generate converse ID
router.post('/generate-converse-id', generateConverseId);

// POST /admin/users/generate-class-id - Generate class ID
router.post('/generate-class-id', generateClassIdForAdmin);

// ✅ MERGED: Advanced ID Generation from Identity Admin
// POST /admin/users/generate-unique-converse-id - Generate unique converse ID
router.post('/generate-unique-converse-id', generateUniqueConverseId);

// POST /admin/users/generate-bulk-converse-ids - Generate bulk converse IDs
router.post('/generate-bulk-converse-ids', generateBulkConverseIds);

// ===============================================
// IDENTITY MANAGEMENT (MERGED FROM IDENTITY ADMIN)
// ===============================================

// POST /admin/users/mask-identity - Mask user identity (basic)
router.post('/mask-identity', maskUserIdentity);

// POST /admin/users/mask-identity-advanced - Mask user identity (advanced)
router.post('/mask-identity-advanced', maskUserIdentityAdvanced);

// POST /admin/users/unmask-identity - Unmask user identity (Super Admin only)
router.post('/unmask-identity', authorize(['super_admin']), unmaskUserIdentity);

// GET /admin/users/identity-audit-trail - Get identity masking audit trail (Super Admin)
router.get('/identity-audit-trail', authorize(['super_admin']), getIdentityAuditTrail);

// GET /admin/users/identity-overview - Get identity system overview (Super Admin)
router.get('/identity-overview', authorize(['super_admin']), getIdentityOverview);

// GET /admin/users/verify-identity-integrity - Verify identity system integrity (Super Admin)
router.get('/verify-identity-integrity', authorize(['super_admin']), verifyIdentityIntegrity);

// GET /admin/users/identity-dashboard - Get identity management dashboard
router.get('/identity-dashboard', getIdentityDashboard);

// GET /admin/users/search-masked-identities - Search masked identities (Super Admin)
router.get('/search-masked-identities', authorize(['super_admin']), searchMaskedIdentities);

// GET /admin/users/:userId/complete-identity - Get complete user identity (Super Admin)
router.get('/:userId/complete-identity', authorize(['super_admin']), getCompleteUserIdentity);

// PUT /admin/users/masking-settings - Update identity masking settings (Super Admin)
router.put('/masking-settings', authorize(['super_admin']), updateMaskingSettings);

// GET /admin/users/export-identity-data - Export identity data (Super Admin)
router.get('/export-identity-data', authorize(['super_admin']), exportIdentityData);

// ===============================================
// MENTOR ASSIGNMENT MANAGEMENT (MERGED & ENHANCED)
// ===============================================

// GET /admin/users/mentors - Get all mentors
router.get('/mentors', getMentors);

// GET /admin/users/mentor-analytics - Get mentor assignment analytics
router.get('/mentor-analytics', getMentorAnalytics);

// POST /admin/users/mentors/assign - Assign mentor role
router.post('/mentors/assign', assignMentorRole);

// POST /admin/users/bulk-assign-mentors - Bulk assign mentors to mentees
router.post('/bulk-assign-mentors', bulkAssignMentors);

// PUT /admin/users/mentor-assignments/:menteeConverseId - Manage mentor assignments
router.put('/mentor-assignments/:menteeConverseId', manageMentorAssignment);

// DELETE /admin/users/mentors/:id/remove - Remove mentor role
router.delete('/mentors/:id/remove', removeMentorRole);

// ===============================================
// DATA EXPORT (ENHANCED)
// ===============================================

// GET /admin/users/export - Export user data (super admin only)
router.get('/export', authorize(['super_admin']), exportUserData);

// GET /admin/users/export/csv - Export users as CSV
router.get('/export/csv', authorize(['super_admin']), (req, res, next) => {
  req.exportFormat = 'csv';
  exportUserData(req, res, next);
});

// GET /admin/users/export/json - Export users as JSON
router.get('/export/json', authorize(['super_admin']), (req, res, next) => {
  req.exportFormat = 'json';
  exportUserData(req, res, next);
});

// ===============================================
// SYSTEM HEALTH & MONITORING (MERGED FROM IDENTITY ADMIN)
// ===============================================

// GET /admin/users/identity-health - Identity system health check
router.get('/identity-health', async (req, res) => {
  try {
    const healthMetrics = {
      encryptionStatus: process.env.IDENTITY_ENCRYPTION_KEY ? 'active' : 'missing',
      databaseConnection: 'checking...',
      timestamp: new Date().toISOString()
    };
    
    // Test database connection
    try {
      await db.query('SELECT 1');
      healthMetrics.databaseConnection = 'healthy';
    } catch (dbError) {
      healthMetrics.databaseConnection = 'error';
      healthMetrics.dbError = dbError.message;
    }
    
    res.status(200).json({
      success: true,
      message: 'Identity system health check',
      health: healthMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
});

// GET /admin/users/identity-stats - Quick identity statistics
router.get('/identity-stats', async (req, res) => {
  try {
    const maskedCount = await db.query('SELECT COUNT(*) as count FROM users WHERE is_identity_masked = 1');
    const mentorCount = await db.query('SELECT COUNT(DISTINCT mentor_converse_id) as count FROM mentors WHERE is_active = 1');
    const unassignedCount = await db.query('SELECT COUNT(*) as count FROM users WHERE is_member = "granted" AND mentor_id IS NULL');
    
    res.status(200).json({
      success: true,
      stats: {
        totalMaskedUsers: maskedCount[0]?.count || 0,
        totalMentors: mentorCount[0]?.count || 0,
        unassignedMembers: unassignedCount[0]?.count || 0,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get identity stats',
      details: error.message
    });
  }
});

// ===============================================
// LEGACY COMPATIBILITY ROUTES (MERGED)
// ===============================================

// POST /admin/users/mask-identity-legacy - Legacy route (maps to new structure)
router.post('/mask-identity-legacy', (req, res, next) => {
  console.log('🔄 Legacy identity masking route accessed - redirecting to new structure');
  maskUserIdentityAdvanced(req, res, next);
});

// ===============================================
// TESTING ENDPOINTS
// ===============================================

// GET /admin/users/test - Admin user management test
router.get('/test', testAdminRoutes);

// ===============================================
// TESTING ENDPOINTS (Development Only) - MERGED
// ===============================================

if (process.env.NODE_ENV === 'development') {
  // Test identity admin functionality merged into user admin
  router.get('/test-identity', (req, res) => {
    res.json({
      success: true,
      message: 'Identity admin routes merged into user admin routes successfully!',
      timestamp: new Date().toISOString(),
      admin: {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        converseId: req.user?.converse_id
      },
      mergedOperations: [
        'POST /mask-identity-advanced - Advanced user identity masking',
        'POST /unmask-identity - Unmask user identity (Super Admin)',
        'GET /identity-audit-trail - View audit trail (Super Admin)',
        'GET /identity-overview - System overview (Super Admin)',
        'GET /search-masked-identities - Search identities (Super Admin)',
        'POST /generate-unique-converse-id - Generate unique converse ID',
        'POST /bulk-assign-mentors - Bulk mentor assignment',
        'GET /mentor-analytics - Enhanced mentor analytics',
        'GET /identity-dashboard - Identity management dashboard',
        'GET /export-identity-data - Export identity data (Super Admin)',
        'GET /identity-health - Identity system health check',
        'GET /identity-stats - Identity system statistics'
      ],
      endpoint: '/api/admin/users/test-identity'
    });
  });
}

// ===============================================
// ERROR HANDLING (ENHANCED)
// ===============================================

// 404 handler for admin user routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Admin user route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      userManagement: [
        'GET / - Get all users',
        'GET /search - Search users',
        'GET /stats - User statistics',
        'GET /:id - Get specific user',
        'POST /create - Create new user',
        'PUT /:id - Update user',
        'DELETE /:id - Delete user (super admin)'
      ],
      permissions: [
        'PUT /role - Update user role',
        'POST /grant-posting-rights - Grant posting rights',
        'POST /ban - Ban user',
        'POST /unban - Unban user'
      ],
      idGeneration: [
        'POST /generate-bulk-ids - Generate bulk IDs',
        'POST /generate-converse-id - Generate converse ID',
        'POST /generate-class-id - Generate class ID',
        'POST /generate-unique-converse-id - Generate unique converse ID (merged)',
        'POST /generate-bulk-converse-ids - Generate bulk converse IDs (merged)'
      ],
      identityManagement: [
        'POST /mask-identity - Basic identity masking',
        'POST /mask-identity-advanced - Advanced identity masking (merged)',
        'POST /unmask-identity - Unmask identity (Super Admin, merged)',
        'GET /identity-audit-trail - Audit trail (Super Admin, merged)',
        'GET /identity-overview - System overview (Super Admin, merged)',
        'GET /verify-identity-integrity - Integrity check (Super Admin, merged)',
        'GET /identity-dashboard - Identity dashboard (merged)',
        'GET /search-masked-identities - Search identities (Super Admin, merged)',
        'GET /:userId/complete-identity - Complete identity (Super Admin, merged)',
        'PUT /masking-settings - Masking settings (Super Admin, merged)',
        'GET /export-identity-data - Export identity data (Super Admin, merged)'
      ],
      mentorManagement: [
        'GET /mentors - Get all mentors',
        'GET /mentor-analytics - Mentor analytics (enhanced)',
        'POST /mentors/assign - Assign mentor role',
        'POST /bulk-assign-mentors - Bulk assign mentors (merged)',
        'PUT /mentor-assignments/:menteeConverseId - Manage assignments (merged)',
        'DELETE /mentors/:id/remove - Remove mentor role'
      ],
      dataExport: [
        'GET /export - Export user data (super admin)',
        'GET /export/csv - Export as CSV (super admin)',
        'GET /export/json - Export as JSON (super admin)'
      ],
      systemMonitoring: [
        'GET /identity-health - Identity system health (merged)',
        'GET /identity-stats - Identity statistics (merged)'
      ],
      testing: [
        'GET /test - Admin user routes test',
        'GET /test-identity - Merged identity admin test (development)'
      ],
      legacy: [
        'POST /mask-identity-legacy - Legacy identity masking (merged)'
      ]
    },
    adminNote: 'All routes require admin or super_admin role',
    mergedNote: 'Identity admin routes have been merged into user admin routes',
    accessLevels: {
      admin: 'Can mask identities, generate IDs, manage mentors, view dashboards',
      super_admin: 'Can unmask identities, view audit trails, export data, modify system settings'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handler
router.use((error, req, res, next) => {
  console.error('❌ Admin user route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.username || 'unauthenticated',
    userRole: req.user?.role,
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Admin user operation error',
    path: req.path,
    method: req.method,
    userRole: req.user?.role,
    timestamp: new Date().toISOString(),
    help: {
      documentation: '/api/info',
      adminRoutes: '/api/admin/users/',
      identityRoutes: 'Now merged into /api/admin/users/',
      support: 'Contact system administrator'
    }
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('🔐 Admin user routes loaded: management, permissions, ID generation, export, mentors');
  console.log('🆔 Identity admin routes merged: masking, unmasking, mentor management, audit trails');
}

export default router;














// // ikootaapi/routes/userAdminRoutes.js
// // ADMIN USER MANAGEMENT ROUTES
// // Administrative control over user accounts and permissions

// import express from 'express';
// import { authenticate, authorize } from '../middleware/auth.js';

// // ✅ Admin User Controller Imports
// import {
//   // User Management
//   getAllUsers,
//   getUserById,
//   createUser,
//   updateUser,
//   deleteUser,
//   searchUsers,
//   exportUserData,
  
//   // User Permissions & Actions
//   updateUserRole,
//   grantPostingRights,
//   banUser,
//   unbanUser,
  
//   // ID Generation
//   generateBulkIds,
//   generateConverseId,
//   generateClassIdForAdmin,
  
//   // Identity Management
//   maskUserIdentity,
  
//   // Mentors Management
//   getMentors,
//   assignMentorRole,
//   removeMentorRole,
  
//   // Testing
//   testAdminRoutes
// } from '../controllers/userAdminControllers.js';
// import { getUserStats } from '../controllers/userStatusControllers.js';
// const router = express.Router();

// // ===============================================
// // APPLY ADMIN AUTHENTICATION TO ALL ROUTES
// // ===============================================
// router.use(authenticate);
// router.use(authorize(['admin', 'super_admin']));

// // ===============================================
// // USER MANAGEMENT
// // ===============================================

// // GET /admin/users - Get all users with pagination and filters
// router.get('/', getAllUsers);

// // GET /admin/users/search - Search users
// router.get('/search', searchUsers);

// // GET /admin/users/stats - Get user statistics
// router.get('/stats', getUserStats);

// // GET /admin/users/:id - Get specific user
// router.get('/:id', getUserById);

// // From defunt enhanced\admin.routes.js 
// // Get specific user by ID (real database)
// router.get('/users/:userId', AdminController.getUserById);

// // POST /admin/users/create - Create new user
// router.post('/create', createUser);

// // PUT /admin/users/:id - Update user
// router.put('/:id', updateUser);

// // DELETE /admin/users/:id - Delete user (super admin only)
// router.delete('/:id', authorize(['super_admin']), deleteUser);

// // ===============================================
// // USER PERMISSIONS & ROLES
// // ===============================================

// // PUT /admin/users/role - Update user role
// router.put('/role', updateUserRole);

// // POST /admin/users/grant-posting-rights - Grant posting rights
// router.post('/grant-posting-rights', grantPostingRights);

// // POST /admin/users/ban - Ban user
// router.post('/ban', banUser);

// // POST /admin/users/unban - Unban user  
// router.post('/unban', unbanUser);

// // ===============================================
// // ID GENERATION
// // ===============================================

// // POST /admin/users/generate-bulk-ids - Generate bulk IDs
// router.post('/generate-bulk-ids', generateBulkIds);

// // POST /admin/users/generate-converse-id - Generate converse ID
// router.post('/generate-converse-id', generateConverseId);

// // POST /admin/users/generate-class-id - Generate class ID
// router.post('/generate-class-id', generateClassIdForAdmin);

// // ===============================================
// // IDENTITY MANAGEMENT
// // ===============================================

// // POST /admin/users/mask-identity - Mask user identity
// router.post('/mask-identity', maskUserIdentity);

// // ===============================================
// // DATA EXPORT
// // ===============================================

// // GET /admin/users/export - Export user data (super admin only)
// router.get('/export', authorize(['super_admin']), exportUserData);

// // GET /admin/users/export/csv - Export users as CSV
// router.get('/export/csv', authorize(['super_admin']), (req, res, next) => {
//   req.exportFormat = 'csv';
//   exportUserData(req, res, next);
// });

// // GET /admin/users/export/json - Export users as JSON
// router.get('/export/json', authorize(['super_admin']), (req, res, next) => {
//   req.exportFormat = 'json';
//   exportUserData(req, res, next);
// });

// // ===============================================
// // MENTORS MANAGEMENT
// // ===============================================

// // GET /admin/users/mentors - Get all mentors
// router.get('/mentors', getMentors);

// // POST /admin/users/mentors/assign - Assign mentor role
// router.post('/mentors/assign', assignMentorRole);

// // DELETE /admin/users/mentors/:id/remove - Remove mentor role
// router.delete('/mentors/:id/remove', removeMentorRole);

// // ===============================================
// // TESTING ENDPOINTS
// // ===============================================

// // GET /admin/users/test - Admin user management test
// router.get('/test', testAdminRoutes);

// // ===============================================
// // ERROR HANDLING
// // ===============================================

// // 404 handler for admin user routes
// router.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: 'Admin user route not found',
//     path: req.path,
//     method: req.method,
//     availableRoutes: {
//       userManagement: [
//         'GET / - Get all users',
//         'GET /search - Search users',
//         'GET /stats - User statistics',
//         'GET /:id - Get specific user',
//         'POST /create - Create new user',
//         'PUT /:id - Update user',
//         'DELETE /:id - Delete user (super admin)'
//       ],
//       permissions: [
//         'PUT /role - Update user role',
//         'POST /grant-posting-rights - Grant posting rights',
//         'POST /ban - Ban user',
//         'POST /unban - Unban user'
//       ],
//       idGeneration: [
//         'POST /generate-bulk-ids - Generate bulk IDs',
//         'POST /generate-converse-id - Generate converse ID',
//         'POST /generate-class-id - Generate class ID'
//       ],
//       identity: [
//         'POST /mask-identity - Mask user identity'
//       ],
//       dataExport: [
//         'GET /export - Export user data (super admin)',
//         'GET /export/csv - Export as CSV (super admin)',
//         'GET /export/json - Export as JSON (super admin)'
//       ],
//       mentors: [
//         'GET /mentors - Get all mentors',
//         'POST /mentors/assign - Assign mentor role',
//         'DELETE /mentors/:id/remove - Remove mentor role'
//       ],
//       testing: [
//         'GET /test - Admin user routes test'
//       ]
//     },
//     adminNote: 'All routes require admin or super_admin role',
//     timestamp: new Date().toISOString()
//   });
// });

// // Error handler
// router.use((error, req, res, next) => {
//   console.error('❌ Admin user route error:', {
//     error: error.message,
//     path: req.path,
//     method: req.method,
//     user: req.user?.username || 'unauthenticated',
//     userRole: req.user?.role,
//     timestamp: new Date().toISOString()
//   });
  
//   res.status(error.statusCode || 500).json({
//     success: false,
//     error: error.message || 'Admin user operation error',
//     path: req.path,
//     method: req.method,
//     userRole: req.user?.role,
//     timestamp: new Date().toISOString()
//   });
// });

// if (process.env.NODE_ENV === 'development') {
//   console.log('🔐 Admin user routes loaded: management, permissions, ID generation, export, mentors');
// }

// export default router;