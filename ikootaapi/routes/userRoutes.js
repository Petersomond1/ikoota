import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/userControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, getUserProfile);

// Update user profile
router.put('/profile', authenticate, updateUserProfile);

/* set properties of users like class_Id, is_member, role, isbanned, isblocked, mentor_id */


export default router;