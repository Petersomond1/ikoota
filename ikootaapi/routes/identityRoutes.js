// ikootaapi/routes/identityRoutes.js

import express from 'express';
import { 
    maskUserIdentity, 
    unmaskUserIdentity, 
    getClassMembers, 
    getMentees 
} from '../controllers/identityController.js';
import { authenticate, requireSuperAdmin, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Mask user identity (admin only)
router.post('/mask-identity', authenticate, requireAdmin, maskUserIdentity);

// Unmask user identity (super admin only)
router.post('/unmask-identity', authenticate, requireSuperAdmin, unmaskUserIdentity);

// Get class members
router.get('/class/:classId/members', authenticate, getClassMembers);

// Get mentees for a mentor
router.get('/mentor/:mentorConverseId/mentees', authenticate, getMentees);

export default router;