// ==================================================
// CORRECTED: ikootaapi/routes/userRoutes.js
// ==================================================

import express from 'express';
import {
  // Existing user controller functions
  getUserProfile,
  updateUserProfile,
  updateUserRole,
  fetchAllUsers,
  fetchUserStats,
  fetchUserActivity,
  fetchUserById,
  removeUser,
  
  // ✅ ADDED: Import the new admin management functions
  getAllUsers,
  getAllMentors,
  updateUser,
  getMembershipOverview,
  getClasses
} from '../controllers/userControllers.js';

import { 
  authenticate,  
  requireAdmin  
} from '../middlewares/auth.middleware.js';

const router = express.Router();

// ==================================================
// EXISTING USER ROUTES
// ==================================================

// GET /users/profile - Get current user's profile
router.get('/profile', authenticate, getUserProfile);

// PUT /users/profile - Update current user's profile
router.put('/profile', authenticate, updateUserProfile);

// GET /users/stats - Get user statistics (admin only)
router.get('/stats', authenticate, fetchUserStats);

// GET /users - Get all users with filtering (admin only)
router.get('/', authenticate, fetchAllUsers);

// GET /users/:user_id - Get user by ID
router.get('/:user_id', authenticate, fetchUserById);

// GET /users/:user_id/activity - Get user activity
router.get('/:user_id/activity', authenticate, fetchUserActivity);

// PUT /users/role - Update user role and properties (admin only)
router.put('/role', authenticate, updateUserRole);

// PUT /users/:user_id - Update specific user (admin only)
router.put('/:user_id', authenticate, updateUserRole);

// DELETE /users/:user_id - Soft delete user (super admin only)
router.delete('/:user_id', authenticate, removeUser);

// ==================================================
// ✅ CORRECTED: ADMIN USER MANAGEMENT ROUTES
// ==================================================

// Admin Users Management Routes
router.get('/admin/users', 
  authenticate, 
  requireAdmin, 
  getAllUsers  // ✅ FIXED: Use imported function directly
);

router.get('/admin/mentors', 
  authenticate, 
  requireAdmin, 
  getAllMentors  // ✅ FIXED: Use imported function directly
);

router.put('/admin/update-user/:id', 
  authenticate, 
  requireAdmin, 
  updateUser  // ✅ FIXED: Use imported function directly
);

router.get('/admin/membership-overview', 
  authenticate, 
  requireAdmin, 
  getMembershipOverview  // ✅ FIXED: Use imported function directly
);

router.get('/classes', 
  authenticate, 
  getClasses  // ✅ FIXED: Use imported function directly
);

export default router;