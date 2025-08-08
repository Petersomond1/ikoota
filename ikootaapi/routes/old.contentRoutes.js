// 1. CONTENT ROUTES - COMMUNITY CONTENT MANAGEMENT
// File: ikootaapi/routes/contentRoutes.js
// ===============================================

import express from 'express';
import { uploadMiddleware, uploadToS3 } from '../middlewares/upload.middleware.js';
import { authenticate, cacheMiddleware } from '../middlewares/auth.middleware.js';

// Import teachings controllers
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
} from '../controllers/old.teachingsControllers.js';

// Import chat controllers
import {
  fetchAllChats,
  fetchChatsByUserId,
  createChat,
  addCommentToChat,
  getChatHistory,
  editChat,
  removeChat,
  fetchChatsByIds,
  fetchChatByPrefixedId,
  fetchCombinedContent,
} from '../controllers/old.chatControllers.js';

// Import comment controllers
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
} from '../controllers/old.commentControllers.js';

// Import class controllers
import {
  getClasses,
  postClass,
  putClass,
  assignUserToClass,
  getClassContent
} from '../controllers/old.classControllers.js';

const contentRouter = express.Router();

// ===============================================
// TEACHINGS/CONTENT ROUTES
// ===============================================

// GET /content/teachings - Fetch all teachings with optional pagination and filtering
contentRouter.get('/teachings', authenticate, fetchAllTeachings);

// GET /content/teachings/search - Search teachings (dedicated search endpoint)
contentRouter.get('/teachings/search', authenticate, cacheMiddleware(120), searchTeachingsController);

// GET /content/teachings/stats - Get teaching statistics
contentRouter.get('/teachings/stats', authenticate, cacheMiddleware(120), fetchTeachingStats);

// GET /content/teachings/user - Fetch teachings by user_id
contentRouter.get('/teachings/user', authenticate, fetchTeachingsByUserId);

// GET /content/teachings/ids - Fetch teachings by multiple IDs
contentRouter.get('/teachings/ids', authenticate, fetchTeachingsByIds);

// GET /content/teachings/prefixed/:prefixedId - Fetch teaching by prefixed ID or numeric ID
contentRouter.get('/teachings/prefixed/:prefixedId', authenticate, fetchTeachingByPrefixedId);

// GET /content/teachings/:id - Fetch single teaching by ID (alternative endpoint)
contentRouter.get('/teachings/:id', authenticate, fetchTeachingByPrefixedId);

// POST /content/teachings - Create a new teaching
contentRouter.post('/teachings', authenticate, uploadMiddleware, uploadToS3, createTeaching);

// PUT /content/teachings/:id - Update a teaching by ID
contentRouter.put('/teachings/:id', authenticate, uploadMiddleware, uploadToS3, editTeaching);

// DELETE /content/teachings/:id - Delete a teaching by ID
contentRouter.delete('/teachings/:id', authenticate, removeTeaching);

// ===============================================
// CHAT ROUTES
// ===============================================

// GET /content/chats - Fetch all chats
contentRouter.get('/chats', authenticate, fetchAllChats);

// GET /content/chats/user - Fetch chats by user_id
contentRouter.get('/chats/user', authenticate, fetchChatsByUserId);

// GET /content/chats/ids - Fetch chats by IDs
contentRouter.get('/chats/ids', authenticate, fetchChatsByIds);

// GET /content/chats/prefixed/:prefixedId - NEW routes for prefixed IDs
contentRouter.get('/chats/prefixed/:prefixedId', authenticate, fetchChatByPrefixedId);

// GET /content/chats/combinedcontent - Combined content endpoint
contentRouter.get('/chats/combinedcontent', authenticate, fetchCombinedContent);

// GET /content/chats/:userId1/:userId2 - Get chat history between two users
contentRouter.get('/chats/:userId1/:userId2', authenticate, getChatHistory);

// POST /content/chats - Create new chat
contentRouter.post('/chats', authenticate, uploadMiddleware, uploadToS3, createChat);

// POST /content/chats/:chatId/comments - Add comment to specific chat
contentRouter.post('/chats/:chatId/comments', authenticate, uploadMiddleware, uploadToS3, addCommentToChat);

// PUT /content/chats/:id - Update a chat by ID
contentRouter.put('/chats/:id', authenticate, editChat);

// DELETE /content/chats/:id - Delete a chat by ID
contentRouter.delete('/chats/:id', authenticate, removeChat);

// ===============================================
// COMMENTS ROUTES
// ===============================================

// GET /content/comments/stats - Get comment statistics (admin only)
contentRouter.get('/comments/stats', authenticate, fetchCommentStats);

// GET /content/comments/all - Fetch all comments (admin only)
contentRouter.get('/comments/all', authenticate, fetchAllComments);

// GET /content/comments/parent-comments - Fetch parent chats and teachings with comments
contentRouter.get('/comments/parent-comments', authenticate, fetchParentChatsAndTeachingsWithComments);

// GET /content/comments/comments - Fetch comments using parent IDs (legacy route)
contentRouter.get('/comments/comments', authenticate, fetchCommentsByParentIds);

// GET /content/comments/user/:user_id - Fetch comments by user_id
contentRouter.get('/comments/user/:user_id', authenticate, fetchCommentsByUserId);

// POST /content/comments/upload - Upload files for comments
contentRouter.post('/comments/upload', authenticate, uploadMiddleware, uploadToS3, uploadCommentFiles);

// POST /content/comments - Create a new comment
contentRouter.post('/comments', authenticate, uploadMiddleware, uploadToS3, createComment);

// GET /content/comments/:commentId - Get specific comment by ID (must be after other GET routes)
contentRouter.get('/comments/:commentId', authenticate, fetchCommentById);

// PUT /content/comments/:commentId - Update a comment
contentRouter.put('/comments/:commentId', authenticate, uploadMiddleware, uploadToS3, updateComment);

// DELETE /content/comments/:commentId - Delete a comment
contentRouter.delete('/comments/:commentId', authenticate, deleteComment);

// ===============================================
// CLASSES ROUTES
// ===============================================

// GET /content/classes - Fetch all classes
contentRouter.get('/classes', getClasses);

// POST /content/classes - Create a new class
contentRouter.post('/classes', postClass);

// PUT /content/classes/:id - Update an existing class
contentRouter.put('/classes/:id', putClass);

// POST /content/classes/assign - Assign user to class
contentRouter.post('/classes/assign', authenticate, assignUserToClass);

// GET /content/classes/:classId/content - Get content for a specific class
contentRouter.get('/classes/:classId/content', authenticate, getClassContent);

// GET /content/classes/:classId/participants - Get class participants
contentRouter.get('/classes/:classId/participants', authenticate, async (req, res) => {
  // This would integrate with class participant controller
  res.json({ message: 'Class participants endpoint - implement with class controller' });
});

// POST /content/classes/:id/join - Join a class
contentRouter.post('/classes/:id/join', authenticate, async (req, res) => {
  // This would integrate with class joining controller
  res.json({ message: 'Join class endpoint - implement with class controller' });
});

// POST /content/classes/:id/leave - Leave a class
contentRouter.post('/classes/:id/leave', authenticate, async (req, res) => {
  // This would integrate with class leaving controller
  res.json({ message: 'Leave class endpoint - implement with class controller' });
});

// ===============================================
// CONTENT CATEGORIES ROUTES
// ===============================================

// GET /content/categories - Get all content categories
contentRouter.get('/categories', authenticate, async (req, res) => {
  // This would integrate with categories controller
  res.json({ message: 'Content categories endpoint - implement with categories controller' });
});

// GET /content/teachings/categories - Get teaching categories (alias)
contentRouter.get('/teachings/categories', authenticate, async (req, res) => {
  // This would integrate with categories controller
  res.json({ message: 'Teaching categories endpoint - implement with categories controller' });
});

// ===============================================
// CONTENT INTERACTION ROUTES
// ===============================================

// POST /content/comments/:id/like - Like a comment
contentRouter.post('/comments/:id/like', authenticate, async (req, res) => {
  // This would integrate with like/reaction controller
  res.json({ message: 'Like comment endpoint - implement with reaction controller' });
});

// ===============================================
// ERROR HANDLING
// ===============================================

// Enhanced 404 handler for content routes
contentRouter.use('*', (req, res) => {
  console.warn(`❌ 404 - Content route not found: ${req.method} ${req.path}`);
  
  res.status(404).json({
    success: false,
    error: 'Content route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: {
      teachings: [
        'GET /teachings - Get all teachings',
        'GET /teachings/search - Search teachings',
        'GET /teachings/stats - Get teaching statistics',
        'POST /teachings - Create new teaching',
        'PUT /teachings/:id - Update teaching',
        'DELETE /teachings/:id - Delete teaching'
      ],
      chats: [
        'GET /chats - Get all chats',
        'GET /chats/user - Get user chats',
        'POST /chats - Create new chat',
        'PUT /chats/:id - Update chat',
        'DELETE /chats/:id - Delete chat'
      ],
      comments: [
        'GET /comments/all - Get all comments',
        'GET /comments/stats - Get comment statistics',
        'POST /comments - Create new comment',
        'PUT /comments/:id - Update comment',
        'DELETE /comments/:id - Delete comment'
      ],
      classes: [
        'GET /classes - Get all classes',
        'POST /classes - Create new class',
        'PUT /classes/:id - Update class',
        'POST /classes/assign - Assign user to class',
        'POST /classes/:id/join - Join class'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Enhanced global error handler for content routes
contentRouter.use((error, req, res, next) => {
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  console.error('❌ Content route error:', {
    errorId,
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.id || 'not authenticated',
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    errorId,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('📚 Content routes loaded with teachings, chats, comments, and classes');
}

export default contentRouter;