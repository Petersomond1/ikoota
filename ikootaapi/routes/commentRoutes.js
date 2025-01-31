import express from 'express';
import { uploadMiddleware, uploadToS3 } from '../middlewares/upload.middleware.js';
import {
  createComment,
  uploadCommentFiles,
  getComments,
} from '../controllers/commentControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Create a new comment
router.post('/', authenticate, uploadMiddleware, uploadToS3, createComment);

// Fetch comments
router.get('/', authenticate, getComments);

// Optional: Separate route for file uploads only
router.post('/upload', authenticate, uploadMiddleware, uploadToS3, uploadCommentFiles);

export default router;
