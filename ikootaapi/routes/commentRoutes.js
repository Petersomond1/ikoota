import express from 'express';
import { uploadMiddleware, uploadToS3 } from '../middlewares/upload.middleware.js';
import {
  createComment,
  uploadCommentFiles,
  fetchParentChatsAndTeachingsWithComments,
  fetchCommentsByParentIds,
  fetchCommentsByUserId,
} from '../controllers/commentControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Create a new comment
router.post('/', authenticate, uploadMiddleware, uploadToS3, createComment);

// Fetch parent chats and teachings along with their comments
router.get('/parent-comments', authenticate, fetchParentChatsAndTeachingsWithComments);

// Fetch comments using parents chatIds and teachingIds
router.get('/comments', authenticate, fetchCommentsByParentIds);

// Fetch comments by user_id
router.get('/user/:user_id', authenticate, fetchCommentsByUserId);

// Optional: Separate route for file uploads only
router.post('/upload', authenticate, uploadMiddleware, uploadToS3, uploadCommentFiles);

export default router;