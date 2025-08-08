// File: ikootaapi/routes/adminUserRoutes.js
// ADMIN USER ROUTES - ADMIN USER & APPLICATION MANAGEMENT

import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

// Import membership middleware
import { 
  canReviewApplications,
  validateApplicationReview,
  logMembershipAction 
} from '../middlewares/membershipMiddleware.js';

// Import existing middleware
import { 
  requireAdmin, 
  requireSuperAdmin 
} from '../controllers/membershipControllers_1.OLD.js';

// Import updated controllers
import {
  getAllPendingMembershipApplications,
  reviewMembershipApplication,
  setupDevAdmin,
  getSystemConfig,
  emergencyUserReset,
  getApplicationStats
} from '../controllers/adminApplicationController.js';

// Import existing controller functions
import {
  getPendingApplications,
  updateApplicationStatus,
  bulkApproveApplications,
  approvePreMemberApplication,
  declinePreMemberApplication,
  getAvailableMentors,
  getAvailableClasses,
  testUserLookup
} from '../controllers/old.membershipControllers.OLD.js';

// Import admin controllers
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
  exportUserData,
  maskUserIdentity
} from '../controllers/adminControllers.js';

import { verifyApplicationStatusConsistency } from '../controllers/old.membershipControllers_2.OLD.js';

const adminUserRouter = express.Router();

// ===== BASIC MIDDLEWARE =====
adminUserRouter.use(authenticate);
adminUserRouter.use(requireAdmin);

// ===============================================
// USER MANAGEMENT ROUTES
// ===============================================

// GET /admin/users - Get all users
adminUserRouter.get('/', getUsers);

// PUT /admin/users/:id - Update user by ID
adminUserRouter.put('/:id', updateUserById);

// POST /admin/users/update - Update user
adminUserRouter.post('/update', updateUser);

// POST /admin/users/create - Create new user
adminUserRouter.post('/create', createUser);

// DELETE /admin/users/:id - Delete user (super admin only)
adminUserRouter.delete('/:id', requireSuperAdmin, deleteUser);

// POST /admin/users/ban - Ban user
adminUserRouter.post('/ban', banUser);

// POST /admin/users/unban - Unban user
adminUserRouter.post('/unban', unbanUser);

// POST /admin/users/grant-posting-rights - Grant posting rights
adminUserRouter.post('/grant-posting-rights', grantPostingRights);

// POST /admin/users/mask-identity - Mask user identity
adminUserRouter.post('/mask-identity', maskUserIdentity);

// GET /admin/users/manage - Get all users for management
adminUserRouter.get('/manage', manageUsers);

// POST /admin/users/manage - Bulk user actions
adminUserRouter.post('/manage', manageUsers);

// GET /admin/users/search - Search users
adminUserRouter.get('/search', async (req, res) => {
  // Implement user search functionality
  res.json({ message: 'User search endpoint - implement with search controller' });
});

// GET /admin/users/export - Export user data
adminUserRouter.get('/export', exportUserData);

// ===============================================
// APPLICATION REVIEW ROUTES
// ===============================================

// Get pending applications with middleware protection
adminUserRouter.get('/applications/pending',
  canReviewApplications,
  logMembershipAction('view_pending_applications'),
  getAllPendingMembershipApplications
);

adminUserRouter.get('/applications',
  canReviewApplications,
  logMembershipAction('view_applications'),
  getAllPendingMembershipApplications
);

// Application statistics with access control
adminUserRouter.get('/applications/stats',
  canReviewApplications,
  logMembershipAction('view_application_stats'),
  getApplicationStats
);

// Update application status - Multiple endpoints for compatibility
adminUserRouter.put('/applications/:userId/status', updateApplicationStatus);

// Pre-member specific approval/decline
adminUserRouter.post('/applications/:userId/approve', approvePreMemberApplication);
adminUserRouter.post('/applications/:userId/decline', declinePreMemberApplication);

// Bulk operations
adminUserRouter.post('/applications/bulk-approve', bulkApproveApplications);

// ===============================================
// SYSTEM CONFIGURATION ROUTES
// ===============================================

// System configuration (Admin only)
adminUserRouter.get('/config', getSystemConfig);
adminUserRouter.get('/config/super', requireSuperAdmin, getSystemConfig);

// ===============================================
// SUPER ADMIN ROUTES
// ===============================================

adminUserRouter.post('/super/emergency-reset/:userId', requireSuperAdmin, emergencyUserReset);
adminUserRouter.get('/super/debug/user/:userId', requireSuperAdmin, testUserLookup);

// ===============================================
// DEVELOPMENT ROUTES
// ===============================================

if (process.env.NODE_ENV === 'development') {
  adminUserRouter.post('/dev/setup-admin/:userId', setupDevAdmin);
  adminUserRouter.get('/debug/status-consistency', verifyApplicationStatusConsistency);
  adminUserRouter.get('/test-user-lookup/:userId', testUserLookup);
  adminUserRouter.get('/test-user-lookup', testUserLookup);
}

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler for admin user routes
adminUserRouter.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Admin user route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      users: [
        'GET / - Get all users',
        'PUT /:id - Update user by ID',
        'POST /create - Create new user',
        'DELETE /:id - Delete user (super admin)',
        'POST /ban - Ban user',
        'POST /unban - Unban user',
        'GET /export - Export user data'
      ],
      applications: [
        'GET /applications/pending - Get pending applications',
        'GET /applications/stats - Get application statistics',
        'PUT /applications/:userId/status - Update application status',
        'POST /applications/:userId/approve - Approve application',
        'POST /applications/bulk-approve - Bulk approve applications'
      ],
      system: [
        'GET /config - Get system configuration',
        'GET /config/super - Get super admin configuration'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Global error handler for admin user routes
adminUserRouter.use((error, req, res, next) => {
  console.error('❌ Admin user route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.username,
    timestamp: new Date().toISOString()
  });
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('👨‍💼 Admin user routes loaded with user management and application review');
}

export default adminUserRouter;
