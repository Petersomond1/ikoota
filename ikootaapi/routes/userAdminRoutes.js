// ikootaapi/routes/userAdminRoutes.js
// ADMIN USER MANAGEMENT ROUTES
// Administrative control over user accounts and permissions

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

// ===============================================
// IDENTITY MANAGEMENT
// ===============================================

// POST /admin/users/mask-identity - Mask user identity
router.post('/mask-identity', maskUserIdentity);

// ===============================================
// DATA EXPORT
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
// MENTORS MANAGEMENT
// ===============================================

// GET /admin/users/mentors - Get all mentors
router.get('/mentors', getMentors);

// POST /admin/users/mentors/assign - Assign mentor role
router.post('/mentors/assign', assignMentorRole);

// DELETE /admin/users/mentors/:id/remove - Remove mentor role
router.delete('/mentors/:id/remove', removeMentorRole);

// ===============================================
// TESTING ENDPOINTS
// ===============================================

// GET /admin/users/test - Admin user management test
router.get('/test', testAdminRoutes);

// ===============================================
// ERROR HANDLING
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
        'POST /generate-class-id - Generate class ID'
      ],
      identity: [
        'POST /mask-identity - Mask user identity'
      ],
      dataExport: [
        'GET /export - Export user data (super admin)',
        'GET /export/csv - Export as CSV (super admin)',
        'GET /export/json - Export as JSON (super admin)'
      ],
      mentors: [
        'GET /mentors - Get all mentors',
        'POST /mentors/assign - Assign mentor role',
        'DELETE /mentors/:id/remove - Remove mentor role'
      ],
      testing: [
        'GET /test - Admin user routes test'
      ]
    },
    adminNote: 'All routes require admin or super_admin role',
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
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('🔐 Admin user routes loaded: management, permissions, ID generation, export, mentors');
}

export default router;