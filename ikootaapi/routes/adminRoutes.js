import express from 'express';
import {
  updateUserColumns,
  getPendingContent,
  approveContent,
  rejectContent,
  manageUsers,
  manageContent,
  banUser,
  unbanUser,
  grantPostingRights,
  updateUser,

  getUsers,
  updateUserById,
  getReports,
  getAuditLogs,
} from '../controllers/adminControllers.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Route to update user columns
router.put('/update-user/:id', authenticate, authorize('admin'), updateUserColumns);

// Manage users (e.g., view, deactivate, or delete)
router.get('/users', authenticate, authorize(['super_admin','admin']), manageUsers);

// Update user details
router.post('/user/update', authenticate, authorize('admin'), updateUser);

// Get all pending content for approval
router.get('/content/pending', authenticate, authorize('admin'), getPendingContent);

// Approve content
router.post('/content/approve/:id', authenticate, authorize('admin'), approveContent);

// Reject content
router.post('/content/reject/:id', authenticate, authorize('admin'), rejectContent);

// Manage content (e.g., view, delete, approve, reject)
router.get('/content', authenticate, authorize('admin'), manageContent);

// Ban user
router.post('/user/ban', authenticate, authorize('admin'), banUser);

// Unban user
router.post('/user/unban', authenticate, authorize('admin'), unbanUser);

// Grant posting rights to user
router.post('/user/grant', authenticate, authorize('admin'), grantPostingRights);

// GET /admin/users - Include isblocked, isbanned, and is_flagged
router.get('/users', authenticate, authorize(['admin', 'super_admin']), getUsers);

// PUT /admin/update-user/:id - Update isblocked and isbanned
router.put('/update-user/:id', authenticate, authorize('admin'), updateUserById);

// GET /admin/reports - Fetch reports for admin review
router.get('/reports', authenticate, authorize('admin'), getReports);

// GET /admin/audit-logs - Fetch audit logs for monitoring
router.get('/audit-logs', authenticate, authorize('admin'), getAuditLogs);


export default router;