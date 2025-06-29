// ikootaapi/routes/commentRoutes.js
import express from 'express';
import { uploadMiddleware, uploadToS3 } from '../middlewares/upload.middleware.js';
import {
  createComment,
  uploadCommentFiles,
  fetchParentChatsAndTeachingsWithComments,
  fetchCommentsByParentIds,
  fetchCommentsByUserId,
  fetchAllComments,
  fetchCommentStats,
  fetchCommentById,
  updateComment,
  deleteComment
} from '../controllers/commentControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Routes in order of specificity (most specific first)

// GET /comments/stats - Get comment statistics (admin only)
router.get('/stats', authenticate, fetchCommentStats);

// GET /comments/all - Fetch all comments (admin only)
router.get('/all', authenticate, fetchAllComments);

// GET /comments/parent-comments - Fetch parent chats and teachings with comments
router.get('/parent-comments', authenticate, fetchParentChatsAndTeachingsWithComments);

// GET /comments/comments - Fetch comments using parent IDs (legacy route)
router.get('/comments', authenticate, fetchCommentsByParentIds);

// GET /comments/user/:user_id - Fetch comments by user_id
router.get('/user/:user_id', authenticate, fetchCommentsByUserId);

// POST /comments/upload - Upload files for comments
router.post('/upload', authenticate, uploadMiddleware, uploadToS3, uploadCommentFiles);

// POST /comments - Create a new comment
router.post('/', authenticate, uploadMiddleware, uploadToS3, createComment);

// GET /comments/:commentId - Get specific comment by ID (must be after other GET routes)
router.get('/:commentId', authenticate, fetchCommentById);

// PUT /comments/:commentId - Update a comment
router.put('/:commentId', authenticate, uploadMiddleware, uploadToS3, updateComment);

// DELETE /comments/:commentId - Delete a comment
router.delete('/:commentId', authenticate, deleteComment);

export default router;