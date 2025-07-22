//ikootaapi/routes/adminRoutes.js - Complete and properly organized routes

import express from 'express';
import {
  // User Management Controllers
  getUsers,
  updateUserById,
  updateUser,
  banUser,
  unbanUser,
  manageUsers,
  grantPostingRights,
  deleteUser,
  createUser,
  
  // Content Management Controllers
  getPendingContent,
  manageContent,
  approveContent,
  rejectContent,
  
  // Reports Controllers
  getReports,
  updateReportStatus,
  
  // Mentors Controllers
  getMentors,
  
  // Audit Logs Controllers
  getAuditLogs,
  
  // Utility Controllers
  sendNotification,
  exportUserData,
  maskUserIdentity
} from '../controllers/adminControllers.js';

import { authenticate, authorize, cacheMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ===== MIDDLEWARE - Apply to all admin routes =====
router.use(authenticate);
router.use(authorize(['admin', 'super_admin']));

// ===== USER MANAGEMENT ROUTES =====

// GET /api/admin/users - Get all users
router.get('/users', cacheMiddleware(600), getUsers);

// PUT /api/admin/users/:id - Update user by ID (isblocked, isbanned)
router.put('/users/:id', updateUserById);

// POST /api/admin/users/update - Update user (rating, userclass, etc.)
router.post('/users/update', updateUser);

// Alternative route for updating user with ID in params
router.put('/update-user/:id', updateUser);

// POST /api/admin/users/ban - Ban user
router.post('/users/ban', banUser);

// POST /api/admin/users/unban - Unban user
router.post('/users/unban', unbanUser);

// POST /api/admin/users/grant - Grant posting rights
router.post('/users/grant', grantPostingRights);

// GET /api/admin/users/manage - Get all users for management
router.get('/users/manage', manageUsers);

// POST /api/admin/users/manage - Bulk user actions
router.post('/users/manage', manageUsers);

// POST /api/admin/create-user - Create new user
router.post('/create-user', createUser);

// DELETE /api/admin/delete-user/:id - Delete user
router.delete('/delete-user/:id', deleteUser);

// POST /api/admin/mask-identity - Mask user identity
router.post('/mask-identity', maskUserIdentity);

// ===== CONTENT MANAGEMENT ROUTES =====

// GET /api/admin/content/pending - Get pending content
router.get('/content/pending', getPendingContent);

// GET /api/admin/content - Get all content for management
router.get('/content', manageContent);

// POST /api/admin/content/manage - Bulk content actions
router.post('/content/manage', manageContent);

// POST /api/admin/content/approve/:id - Approve content
router.post('/content/approve/:id', approveContent);

// POST /api/admin/content/reject/:id - Reject content
router.post('/content/reject/:id', rejectContent);

// ===== REPORTS MANAGEMENT ROUTES =====

// GET /api/admin/reports - Get all reports
router.get('/reports', cacheMiddleware(600), getReports);

// PUT /api/admin/update-report/:reportId - Update report status
router.put('/update-report/:reportId', updateReportStatus);

// ===== MENTORS MANAGEMENT ROUTES =====

// GET /api/admin/mentors - Get all mentors
router.get('/mentors', getMentors);

// ===== AUDIT LOGS ROUTES =====

// GET /api/admin/audit-logs - Get audit logs
router.get('/audit-logs', getAuditLogs);

// ===== UTILITY ROUTES =====

// POST /api/admin/send-notification - Send notification to user
router.post('/send-notification', sendNotification);

// GET /api/admin/export-users - Export user data
router.get('/export-users', exportUserData);

// ===== LEGACY COMPATIBILITY ROUTES =====
// These routes maintain compatibility with existing frontend calls

// Alternative routes for content management
router.get('/pending-content', getPendingContent);
router.post('/approve-content/:id', approveContent);
router.post('/reject-content/:id', rejectContent);

// Alternative routes for user management
router.post('/ban-user/:id', (req, res) => {
  req.body.userId = req.params.id;
  banUser(req, res);
});

router.post('/unban-user/:id', (req, res) => {
  req.body.userId = req.params.id;
  unbanUser(req, res);
});

router.post('/grant-posting-rights/:id', (req, res) => {
  req.body.userId = req.params.id;
  grantPostingRights(req, res);
});

// ===== ERROR HANDLING MIDDLEWARE =====
router.use((error, req, res, next) => {
  console.error('❌ Admin routes error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

export default router;

