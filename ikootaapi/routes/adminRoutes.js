// Fixed adminRoutes.js:
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
import { authenticate, authorize, cacheMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// User Management Routes
router.get('/users', authenticate, authorize(['admin', 'super_admin']), cacheMiddleware(600), getUsers);
router.put('/users/:id', authenticate, authorize('admin'), updateUserById);
router.post('/users/update', authenticate, authorize('admin'), updateUser);
router.post('/users/ban', authenticate, authorize('admin'), banUser);
router.post('/users/unban', authenticate, authorize('admin'), unbanUser);
router.post('/users/grant', authenticate, authorize('admin'), grantPostingRights);

// Content Management Routes
router.get('/content/pending', authenticate, authorize('admin'), getPendingContent);
router.get('/content', authenticate, authorize('admin'), manageContent);
router.post('/content/approve/:id', authenticate, authorize('admin'), approveContent);
router.post('/content/reject/:id', authenticate, authorize('admin'), rejectContent);

// System Management Routes
router.get('/reports', authenticate, authorize('admin'), cacheMiddleware(600), getReports);
router.get('/audit-logs', authenticate, authorize('admin'), getAuditLogs);

export default router;