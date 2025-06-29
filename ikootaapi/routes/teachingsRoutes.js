import express from 'express';
import { uploadMiddleware, uploadToS3 } from '../middlewares/upload.middleware.js';
import {
  createTeaching,
  fetchAllTeachings,
  fetchTeachingsByUserId,
  editTeaching,
  removeTeaching,
  fetchTeachingsByIds,
  fetchTeachingByPrefixedId,
  searchTeachingsController,
  fetchTeachingStats,
} from '../controllers/teachingsControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /teachings - Fetch all teachings with optional pagination and filtering
router.get('/', authenticate, fetchAllTeachings);

// GET /teachings/search - Search teachings (dedicated search endpoint)
router.get('/search', authenticate, searchTeachingsController);

// GET /teachings/stats - Get teaching statistics
router.get('/stats', authenticate, fetchTeachingStats);

// GET /teachings/user - Fetch teachings by user_id
router.get('/user', authenticate, fetchTeachingsByUserId);

// GET /teachings/ids - Fetch teachings by multiple IDs
router.get('/ids', authenticate, fetchTeachingsByIds);

// GET /teachings/prefixed/:prefixedId - Fetch teaching by prefixed ID or numeric ID
router.get('/prefixed/:prefixedId', authenticate, fetchTeachingByPrefixedId);

// GET /teachings/:id - Fetch single teaching by ID (alternative endpoint)
router.get('/:id', authenticate, fetchTeachingByPrefixedId);

// POST /teachings - Create a new teaching
router.post('/', authenticate, uploadMiddleware, uploadToS3, createTeaching);

// PUT /teachings/:id - Update a teaching by ID
router.put('/:id', authenticate, uploadMiddleware, uploadToS3, editTeaching);

// DELETE /teachings/:id - Delete a teaching by ID
router.delete('/:id', authenticate, removeTeaching);

export default router;