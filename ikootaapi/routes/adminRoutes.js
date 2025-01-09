import express from 'express';
import {
  getPendingContent,
  approveContent,
  rejectContent,
  manageUsers,
  manageContent,
  banUser,
  unbanUser,
  grantPostingRights,
  updateUser
} from '../controllers/adminControllers.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get all pending content for approval
router.get('/content/pending', authenticate, authorize('admin'), getPendingContent);

// Approve content
router.post('/content/approve/:id', authenticate, authorize('admin'), approveContent);

// Reject content
router.post('/content/reject/:id', authenticate, authorize('admin'), rejectContent);

// Manage content (e.g., view, delete, approve, reject)
router.get('/content', authenticate, authorize('admin'), manageContent);

// Manage users (e.g., view, deactivate, or delete)
router.get('/users', authenticate, authorize('admin'), manageUsers);

// Ban user
router.post('/user/ban', authenticate, authorize('admin'), banUser);

// Unban user
router.post('/user/unban', authenticate, authorize('admin'), unbanUser);

// Grant posting rights to user
router.post('/user/grant', authenticate, authorize('admin'), grantPostingRights);

// Update user details
router.post('/user/update', authenticate, authorize('admin'), updateUser);

export default router;