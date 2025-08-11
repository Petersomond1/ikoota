// ikootaapi/routes/contentRoutes.js - UPDATED
// Integration with new contentAdminControllers.js
// Unified content management with proper admin separation

import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { uploadMiddleware, uploadToS3 } from '../middlewares/upload.middleware.js';

// ===============================================
// IMPORT INDIVIDUAL CONTENT CONTROLLERS
// ===============================================

// Chat Controllers
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
  fetchCombinedContent
} from '../controllers/chatControllers.js';

// Teaching Controllers
import {
  createTeaching,
  fetchAllTeachings,
  fetchTeachingsByUserId,
  editTeaching,
  removeTeaching,
  fetchTeachingsByIds,
  fetchTeachingByPrefixedId,
  searchTeachingsController,
  fetchTeachingStats
} from '../controllers/teachingsControllers.js';

// Comment Controllers
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
} from '../controllers/commentsControllers.js';

// ===============================================
// IMPORT NEW CONTENT ADMIN CONTROLLERS
// ===============================================

import {
  // Main content admin functions
  getPendingContent,
  manageContent,
  approveContent,
  rejectContent,
  deleteContent,
  
  // Content type specific admin functions
  getChatsForAdmin,
  getTeachingsForAdmin,
  getCommentsForAdmin,
  updateContentStatus,
  
  // Reports and audit functions
  getReports,
  updateReportStatus,
  getAuditLogs,
  
  // Utility functions
  sendNotification,
  getContentStats,
  bulkManageContent
} from '../controllers/contentAdminControllers.js';

const router = express.Router();

// ===============================================
// CHATS ENDPOINTS - /api/content/chats/*
// ===============================================

// GET /content/chats - Fetch all chats
router.get('/chats', fetchAllChats);

// GET /content/chats/user - Fetch chats by user_id
router.get('/chats/user', authenticate, fetchChatsByUserId);

// GET /content/chats/ids - Fetch chats by multiple IDs
router.get('/chats/ids', authenticate, fetchChatsByIds);

// GET /content/chats/prefixed/:prefixedId - Fetch chat by prefixed ID
router.get('/chats/prefixed/:prefixedId', authenticate, fetchChatByPrefixedId);

// GET /content/chats/combinedcontent - Combined content endpoint
router.get('/chats/combinedcontent', authenticate, fetchCombinedContent);

// GET /content/chats/:userId1/:userId2 - Get chat history between users
router.get('/chats/:userId1/:userId2', authenticate, getChatHistory);

// POST /content/chats - Create new chat
router.post('/chats', authenticate, uploadMiddleware, uploadToS3, createChat);

// POST /content/chats/:chatId/comments - Add comment to chat
router.post('/chats/:chatId/comments', authenticate, uploadMiddleware, uploadToS3, addCommentToChat);

// PUT /content/chats/:id - Update chat
router.put('/chats/:id', authenticate, uploadMiddleware, uploadToS3, editChat);

// DELETE /content/chats/:id - Delete chat
router.delete('/chats/:id', authenticate, removeChat);

// ===============================================
// TEACHINGS ENDPOINTS - /api/content/teachings/*
// ===============================================

// GET /content/teachings - Fetch all teachings
router.get('/teachings', fetchAllTeachings);

// GET /content/teachings/search - Search teachings
router.get('/teachings/search', authenticate, searchTeachingsController);

// GET /content/teachings/stats - Get teaching statistics
router.get('/teachings/stats', authenticate, fetchTeachingStats);

// GET /content/teachings/user - Fetch teachings by user_id
router.get('/teachings/user', authenticate, fetchTeachingsByUserId);

// GET /content/teachings/ids - Fetch teachings by multiple IDs
router.get('/teachings/ids', authenticate, fetchTeachingsByIds);

// GET /content/teachings/prefixed/:prefixedId - Fetch teaching by prefixed ID
router.get('/teachings/prefixed/:prefixedId', authenticate, fetchTeachingByPrefixedId);

// GET /content/teachings/:id - Fetch single teaching by ID
router.get('/teachings/:id', authenticate, fetchTeachingByPrefixedId);

// POST /content/teachings - Create new teaching
router.post('/teachings', authenticate, uploadMiddleware, uploadToS3, createTeaching);

// PUT /content/teachings/:id - Update teaching
router.put('/teachings/:id', authenticate, uploadMiddleware, uploadToS3, editTeaching);

// DELETE /content/teachings/:id - Delete teaching
router.delete('/teachings/:id', authenticate, removeTeaching);

// ===============================================
// COMMENTS ENDPOINTS - /api/content/comments/*
// ===============================================

// GET /content/comments/all - Fetch all comments
router.get('/comments/all', authenticate, fetchAllComments);

// GET /content/comments/stats - Get comment statistics
router.get('/comments/stats', authenticate, fetchCommentStats);

// GET /content/comments/parent-comments - Fetch parent content with comments
router.get('/comments/parent-comments', authenticate, fetchParentChatsAndTeachingsWithComments);

// GET /content/comments/user/:user_id - Fetch comments by user
router.get('/comments/user/:user_id', authenticate, fetchCommentsByUserId);

// POST /content/comments/upload - Upload files for comments
router.post('/comments/upload', authenticate, uploadMiddleware, uploadToS3, uploadCommentFiles);

// POST /content/comments - Create new comment
router.post('/comments', authenticate, uploadMiddleware, uploadToS3, createComment);

// GET /content/comments/:commentId - Get specific comment
router.get('/comments/:commentId', authenticate, fetchCommentById);

// PUT /content/comments/:commentId - Update comment
router.put('/comments/:commentId', authenticate, uploadMiddleware, uploadToS3, updateComment);

// DELETE /content/comments/:commentId - Delete comment
router.delete('/comments/:commentId', authenticate, deleteComment);

// ===============================================
// ADMIN CONTENT ENDPOINTS - /api/content/admin/*
// ✅ UPDATED TO USE NEW contentAdminControllers
// ===============================================

// Apply admin authentication to all admin routes
router.use('/admin/*', authenticate, authorize(['admin', 'super_admin']));

// ===== MAIN ADMIN CONTENT MANAGEMENT =====

// GET /content/admin/pending - Get pending content across all types
router.get('/admin/pending', getPendingContent);

// GET/POST /content/admin/manage - Manage content (bulk operations)
router.get('/admin/manage', manageContent);
router.post('/admin/manage', manageContent);

// POST /content/admin/bulk-manage - Enhanced bulk operations
router.post('/admin/bulk-manage', bulkManageContent);

// POST /content/admin/:id/approve - Approve content
router.post('/admin/:id/approve', approveContent);

// POST /content/admin/:id/reject - Reject content
router.post('/admin/:id/reject', rejectContent);

// DELETE /content/admin/:contentType/:id - Delete specific content
router.delete('/admin/:contentType/:id', deleteContent);

// ===== CONTENT TYPE SPECIFIC ADMIN ENDPOINTS =====

// GET /content/admin/chats - Get all chats for admin management
router.get('/admin/chats', getChatsForAdmin);

// GET /content/admin/teachings - Get all teachings for admin management
router.get('/admin/teachings', getTeachingsForAdmin);

// GET /content/admin/comments - Get all comments for admin management
router.get('/admin/comments', getCommentsForAdmin);

// PUT /content/admin/:contentType/:id - Update content status
router.put('/admin/:contentType/:id', updateContentStatus);

// ===== REPORTS AND AUDIT =====

// GET /content/admin/reports - Get content reports
router.get('/admin/reports', getReports);

// PUT /content/admin/reports/:reportId/status - Update report status
router.put('/admin/reports/:reportId/status', updateReportStatus);

// GET /content/admin/audit-logs - Get audit logs
router.get('/admin/audit-logs', getAuditLogs);

// ===== ADMIN UTILITIES =====

// POST /content/admin/notifications/send - Send notification
router.post('/admin/notifications/send', sendNotification);

// GET /content/admin/stats - Get content statistics
router.get('/admin/stats', getContentStats);

// ===============================================
// LEGACY COMPATIBILITY ROUTES
// ✅ MAINTAINED FOR BACKWARD COMPATIBILITY
// ===============================================

// Legacy /chats routes
router.use('/chats-legacy', (req, res, next) => {
  console.log('🔄 Legacy /chats route accessed');
  req.url = req.url.replace('/chats-legacy', '/chats');
  next();
});

// Legacy /teachings routes  
router.use('/teachings-legacy', (req, res, next) => {
  console.log('🔄 Legacy /teachings route accessed');
  req.url = req.url.replace('/teachings-legacy', '/teachings');
  next();
});

// Legacy /comments routes
router.use('/comments-legacy', (req, res, next) => {
  console.log('🔄 Legacy /comments route accessed');
  req.url = req.url.replace('/comments-legacy', '/comments');
  next();
});

// Legacy /messages route mapped to teachings
router.get('/messages', (req, res, next) => {
  console.log('🔄 Legacy /messages route accessed, mapping to teachings');
  req.url = '/teachings';
  req.query.legacy_messages = 'true';
  fetchAllTeachings(req, res, next);
});

// ADD THIS AS A NEW ROUTE IN contentRoutes.js (in the legacy compatibility section)

// Legacy /messages route mapped to teachings
router.get('/messages', async (req, res) => {
  try {
    console.log('Legacy /api/messages endpoint accessed, mapping to teachings');
    
    // Map query parameters
    const { status, page = 1, limit = 50, user_id } = req.query;
    
    // Map status to approval_status
    let approval_status;
    if (status) {
      switch (status.toLowerCase()) {
        case 'pending':
          approval_status = 'pending';
          break;
        case 'approved':
          approval_status = 'approved';
          break;
        case 'rejected':
          approval_status = 'rejected';
          break;
        default:
          approval_status = status;
      }
    }

    const filters = {
      approval_status,
      user_id,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    // Import getAllTeachings at the top of the file if not already imported
    const { getAllTeachings } = await import('../services/teachingsServices.js');
    const teachings = await getAllTeachings(filters);
    
    // Return in format expected by frontend
    res.status(200).json({
      success: true,
      data: teachings,
      count: teachings.length,
      message: 'Messages endpoint mapped to teachings',
      filters
    });

  } catch (error) {
    console.error('Error in legacy messages endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch messages (teachings)'
    });
  }
});

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler for content routes
router.use('*', (req, res) => {
  console.log(`❌ Content route not found: ${req.method} ${req.path}`);
  
  res.status(404).json({
    success: false,
    error: 'Content route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      chats: [
        'GET /chats - Get all chats',
        'GET /chats/user - Get user chats',
        'GET /chats/combinedcontent - Combined content',
        'POST /chats - Create chat',
        'PUT /chats/:id - Update chat',
        'DELETE /chats/:id - Delete chat'
      ],
      teachings: [
        'GET /teachings - Get all teachings',
        'GET /teachings/search - Search teachings',
        'GET /teachings/stats - Teaching statistics',
        'POST /teachings - Create teaching',
        'PUT /teachings/:id - Update teaching',
        'DELETE /teachings/:id - Delete teaching'
      ],
      comments: [
        'GET /comments/all - Get all comments',
        'GET /comments/stats - Comment statistics',
        'POST /comments - Create comment',
        'PUT /comments/:id - Update comment',
        'DELETE /comments/:id - Delete comment'
      ],
      admin: [
        'GET /admin/pending - Pending content',
        'GET /admin/chats - Admin chat management',
        'GET /admin/teachings - Admin teaching management',
        'GET /admin/comments - Admin comment management',
        'GET /admin/reports - Content reports',
        'GET /admin/audit-logs - Audit logs',
        'GET /admin/stats - Content statistics',
        'POST /admin/bulk-manage - Bulk operations'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Global error handler
router.use((error, req, res, next) => {
  console.error('❌ Content route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.username || 'unauthenticated',
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Content management error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// DEVELOPMENT LOGGING
// ===============================================

if (process.env.NODE_ENV === 'development') {
  console.log('📚 Content routes loaded with enhanced admin management:');
  console.log('   ✅ Individual content controllers: chats, teachings, comments');
  console.log('   ✅ Unified admin controllers: contentAdminControllers.js');
  console.log('   ✅ Separated services: content services + contentAdminServices.js');
  console.log('   ✅ Backward compatibility maintained');
  console.log('   ✅ Enhanced admin bulk operations');
  console.log('   ✅ Comprehensive error handling');
}

export default router;
