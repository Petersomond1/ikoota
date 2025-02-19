import express from 'express';
import { uploadMiddleware, uploadToS3 } from '../middlewares/upload.middleware.js';
import {
  createTeaching,
  fetchAllTeachings,
  fetchTeachingsByUserId,
  editTeaching,
  removeTeaching,
  fetchTeachingsByIds, // New controller function
} from '../controllers/teachingsControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Fetch all teachings
router.get('/', authenticate, fetchAllTeachings);

// Fetch teachings by user_id
router.get('/user', authenticate, fetchTeachingsByUserId);

// Fetch teachings by IDs
router.get('/ids', authenticate, fetchTeachingsByIds); // New route

// Create a new teaching through uploadToS3
router.post("/", authenticate, uploadMiddleware, uploadToS3, createTeaching);

// Update a teaching by ID
router.put('/:id', authenticate, editTeaching);

// Delete a teaching by ID
router.delete('/:id', authenticate, removeTeaching);

export default router;