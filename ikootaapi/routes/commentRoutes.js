import express from 'express';
import { uploadMiddleware, uploadToS3 } from '../middlewares/upload.middleware.js';
import {
  createComment,
  uploadCommentFiles,
} from '../controllers/commentControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Create a new comment
router.post('/', authenticate, uploadMiddleware,
   // .array('media', 3),
     uploadToS3, createComment);

// Optional: Separate route for file uploads only
router.post('/upload', authenticate, uploadMiddleware,
    //.array('media', 3),
     uploadToS3, uploadCommentFiles);

export default router;
