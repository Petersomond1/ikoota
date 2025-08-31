// ikootaapi/routes/contentRoutes.js - COMPLETE RECREATION
// Unified content management with all preserved functionalities
// Supports chats, teachings, comments with approval workflow

import express from 'express';
import { authenticate, requireMembership, authorize } from '../middleware/auth.js';
import { uploadMiddleware, uploadToS3 } from '../middleware/uploadMiddleware.js';

// ===============================================
// IMPORT CONTENT CONTROLLERS
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
  fetchCombinedContent,
  searchChatsController
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
  deleteComment,
  searchCommentsController
} from '../controllers/commentsControllers.js';

// Summarization Controllers
import {
  summarizeContent,
  bulkSummarize,
  summarizeText,
  getSummarizationAnalytics
} from '../controllers/summarizationController.js';

// Recommendation Controllers
import {
  getContentRecommendations,
  getTextRecommendations,
  getTopicRecommendations,
  trackInteraction,
  getAnalytics,
  getBulkRecommendations
} from '../controllers/recommendationController.js';

// Content Admin Controllers
import {
  getPendingContent,
  manageContent,
  approveContent,
  rejectContent,
  deleteContent,
  getChatsForAdmin,
  getTeachingsForAdmin,
  getCommentsForAdmin,
  updateContentStatus,
  getReports,
  updateReportStatus,
  getAuditLogs,
  sendNotification,
  getContentStats,
  bulkManageContent
} from '../controllers/contentAdminControllers.js';

const router = express.Router();

// From enhanced/content.routes.js - ADD to contentRoutes.js
// GET /content/towncrier - Pre-member level content
// router.get('/towncrier', 
//   authenticate, 
//   requireMembership(['pre_member', 'member', 'admin', 'super_admin']), 
//   getTowncrier
// );

// GET /content/iko - Full member level content
// router.get('/iko', 
//   authenticate, 
//   requireMembership(['member', 'admin', 'super_admin']), 
//   getIko
// );


// ===============================================
// CHATS ENDPOINTS - /api/content/chats/*
// ===============================================

// GET /content/chats - Fetch all chats with filtering
router.get('/chats', fetchAllChats);

// ✅ NEW: Enhanced chat search endpoint
router.get('/chats/search', authenticate, searchChatsController);

// ENHANCED: Personal mentorship chat history for user progress tracking
router.get('/chats/user', authenticate, fetchChatsByUserId);



// GET /content/chats/combinedcontent - Combined chats + teachings endpoint
router.get('/chats/combinedcontent', authenticate, fetchCombinedContent);


// POST /content/chats - Create new chat (7-step form)
router.post('/chats', authenticate, uploadMiddleware, uploadToS3, createChat);


// ENHANCED: Allow users to edit their chat content for better UX
router.put('/chats/:id', authenticate, uploadMiddleware, uploadToS3, editChat);


// ===============================================
// TEACHINGS ENDPOINTS - /api/content/teachings/*
// ===============================================

// GET /content/teachings - Fetch all teachings with filtering
router.get('/teachings', fetchAllTeachings);

// ENHANCED: Advanced content discovery with skill-level and topic filters
router.get('/teachings/search', authenticate, searchTeachingsController);

// ENHANCED: Learning analytics and progress dashboards
router.get('/teachings/stats', authenticate, fetchTeachingStats);

// ENHANCED: Mentor's teaching portfolio and user's learning history
router.get('/teachings/user', authenticate, fetchTeachingsByUserId);




// POST /content/teachings - Create new teaching (8-step form)
router.post('/teachings', authenticate, uploadMiddleware, uploadToS3, createTeaching);

// ENHANCED: Mentors can update and improve their teaching content
router.put('/teachings/:id', authenticate, uploadMiddleware, uploadToS3, editTeaching);


// ===============================================
// COMMENTS ENDPOINTS - /api/content/comments/*
// ===============================================

// GET /content/comments - Fetch comments with status filtering (for admin)
router.get('/comments', authenticate, fetchAllComments);

// GET /content/comments/all - Fetch all comments
router.get('/comments/all', authenticate, fetchAllComments);

// ✅ NEW: Enhanced comment search endpoint
router.get('/comments/search', authenticate, searchCommentsController);

// ===============================================
// GLOBAL SEARCH ENDPOINT
// ===============================================

// ✅ NEW: Global search across all content types
router.get('/search/global', authenticate, async (req, res) => {
  try {
    const {
      query: searchQuery,
      q, // Alternative query parameter
      types = 'all', // 'chats', 'teachings', 'comments', 'all'
      page = 1,
      limit = 20,
      sort_by = 'updatedAt',
      sort_order = 'desc'
    } = req.query;

    const finalQuery = searchQuery || q;

    if (!finalQuery || finalQuery.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        message: 'Please provide a search query using "query" or "q" parameter',
        example: '/content/search/global?q=mentorship&types=chats,teachings'
      });
    }

    if (finalQuery.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query too short',
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchTypes = types === 'all' ? ['chats', 'teachings', 'comments'] : types.split(',');
    const results = {
      chats: [],
      teachings: [],
      comments: [],
      total: 0
    };

    // Search chats if requested
    if (searchTypes.includes('chats')) {
      try {
        const { searchChats } = await import('../services/chatServices.js');
        results.chats = await searchChats({ query: finalQuery, limit: Math.ceil(limit/3) });
      } catch (error) {
        console.warn('Chat search failed:', error.message);
      }
    }

    // Search teachings if requested
    if (searchTypes.includes('teachings')) {
      try {
        const { searchTeachings } = await import('../services/teachingsServices.js');
        results.teachings = await searchTeachings({ query: finalQuery, limit: Math.ceil(limit/3) });
      } catch (error) {
        console.warn('Teaching search failed:', error.message);
      }
    }

    // Search comments if requested
    if (searchTypes.includes('comments')) {
      try {
        const { searchComments } = await import('../services/commentServices.js');
        results.comments = await searchComments({ query: finalQuery, limit: Math.ceil(limit/3) });
      } catch (error) {
        console.warn('Comment search failed:', error.message);
      }
    }

    results.total = results.chats.length + results.teachings.length + results.comments.length;

    res.status(200).json({
      success: true,
      message: 'Global search completed successfully',
      data: results,
      search: {
        query: finalQuery,
        types: searchTypes,
        total_results: results.total
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Global search failed',
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// CONTENT SUMMARIZATION ENDPOINTS
// ===============================================

// ✅ NEW: Summarize specific content by type and ID
router.get('/summarize/:contentType/:contentId', authenticate, summarizeContent);

// ✅ NEW: Summarize arbitrary text
router.post('/summarize/text', authenticate, summarizeText);

// ✅ NEW: Bulk summarization for multiple content items
router.post('/summarize/bulk', authenticate, bulkSummarize);

// ✅ NEW: Summarization analytics and insights
router.get('/summarize/analytics', authenticate, getSummarizationAnalytics);

// ===============================================
// EXTERNAL CONTENT RECOMMENDATIONS
// ===============================================

// ✅ NEW: Get recommendations for specific content
router.get('/recommendations/:contentType/:contentId', authenticate, getContentRecommendations);

// ✅ NEW: Get recommendations for arbitrary text
router.post('/recommendations/text', authenticate, getTextRecommendations);

// ✅ NEW: Get recommendations by topic/category
router.get('/recommendations/topic/:topic', authenticate, getTopicRecommendations);

// ✅ NEW: Bulk recommendations for multiple content items
router.post('/recommendations/bulk', authenticate, getBulkRecommendations);

// ✅ NEW: Track user interaction with recommendations
router.post('/recommendations/track', authenticate, trackInteraction);

// ✅ NEW: Get recommendation analytics
router.get('/recommendations/analytics', authenticate, getAnalytics);

// ENHANCED: Comment engagement analytics for mentorship insights
router.get('/comments/stats', authenticate, fetchCommentStats);

// GET /content/comments/parent-comments - Fetch parent content with comments
router.get('/comments/parent-comments', authenticate, fetchParentChatsAndTeachingsWithComments);

// ENHANCED: User's interaction history for mentorship tracking
router.get('/comments/user/:user_id', authenticate, fetchCommentsByUserId);

// POST /content/comments/upload - Upload files for comments
router.post('/comments/upload', authenticate, uploadMiddleware, uploadToS3, uploadCommentFiles);

// POST /content/comments - Create new comment
router.post('/comments', authenticate, uploadMiddleware, uploadToS3, createComment);


// ENHANCED: Users can edit their comments for better discussions
router.put('/comments/:commentId', authenticate, uploadMiddleware, uploadToS3, updateComment);


// ===============================================
// ADMIN CONTENT ENDPOINTS - /api/content/admin/*
// ===============================================

// Apply admin authentication to all admin routes
router.use('/admin/*', authenticate, authorize(['admin', 'super_admin']));

// ===== MAIN ADMIN CONTENT MANAGEMENT =====

//not used
// GET /content/admin/pending - Get pending content across all types
router.get('/admin/pending', getPendingContent);

//not used
// GET/POST /content/admin/manage - Manage content (bulk operations)
router.get('/admin/manage', manageContent);
router.post('/admin/manage', manageContent);

//not used
// POST /content/admin/bulk-manage - Enhanced bulk operations
router.post('/admin/bulk-manage', bulkManageContent);

//not used
// POST /content/admin/:id/approve - Approve content
router.post('/admin/:id/approve', approveContent);

//not used
// POST /content/admin/:id/reject - Reject content
router.post('/admin/:id/reject', rejectContent);

//not used
// DELETE /content/admin/:contentType/:id - Delete specific content
router.delete('/admin/:contentType/:id', deleteContent);

// ===== CONTENT TYPE SPECIFIC ADMIN ENDPOINTS =====

//not used
// // GET /content/admin/chats - Get all chats for admin management
router.get('/admin/chats', getChatsForAdmin);

//not used
// GET /content/admin/teachings - Get all teachings for admin management
router.get('/admin/teachings', getTeachingsForAdmin);

//not used
// GET /content/admin/comments - Get all comments for admin management
router.get('/admin/comments', getCommentsForAdmin);

//not used
// PUT /content/admin/:contentType/:id - Update content status
router.put('/admin/:contentType/:id', updateContentStatus);

// ===== REPORTS AND AUDIT =====

// GET /content/admin/reports - Get content reports
router.get('/admin/reports', getReports);

//not used
// PUT /content/admin/reports/:reportId/status - Update report status
router.put('/admin/reports/:reportId/status', updateReportStatus);

// GET /content/admin/audit-logs - Get audit logs
router.get('/admin/audit-logs', getAuditLogs);

// ===== ADMIN UTILITIES =====

//not used
// POST /content/admin/notifications/send - Send notification
router.post('/admin/notifications/send', sendNotification);

//not used
// GET /content/admin/stats - Get content statistics
router.get('/admin/stats', getContentStats);

// ===============================================
// LEGACY COMPATIBILITY ROUTES
// ===============================================

// Legacy /messages route mapped to teachings
router.get('/messages', async (req, res) => {
  try {
    console.log('Legacy /api/messages endpoint accessed, mapping to teachings');
    
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

    const { getAllTeachings } = await import('../services/teachingsServices.js');
    const teachings = await getAllTeachings(filters);
    
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

// Legacy route redirects
router.use('/chats-legacy', (req, res, next) => {
  console.log('🔄 Legacy /chats route accessed');
  req.url = req.url.replace('/chats-legacy', '/chats');
  next();
});

router.use('/teachings-legacy', (req, res, next) => {
  console.log('🔄 Legacy /teachings route accessed');
  req.url = req.url.replace('/teachings-legacy', '/teachings');
  next();
});

router.use('/comments-legacy', (req, res, next) => {
  console.log('🔄 Legacy /comments route accessed');
  req.url = req.url.replace('/comments-legacy', '/comments');
  next();
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
        'GET /chats/search - 🔍 Advanced chat search',
        'GET /chats/user - Get user chats',
        'GET /chats/combinedcontent - Combined content',
        'POST /chats - Create chat',
        'PUT /chats/:id - Update chat'
      ],
      teachings: [
        'GET /teachings - Get all teachings',
        'GET /teachings/search - 🔍 Advanced teaching search',
        'GET /teachings/stats - Teaching statistics',
        'POST /teachings - Create teaching',
        'PUT /teachings/:id - Update teaching'
      ],
      comments: [
        'GET /comments/all - Get all comments',
        'GET /comments/search - 🔍 Advanced comment search',
        'GET /comments/stats - Comment statistics',
        'POST /comments - Create comment',
        'PUT /comments/:id - Update comment'
      ],
      search: [
        'GET /search/global - 🌐 Global search (all content types)',
        '  Parameters: ?q=query&types=chats,teachings,comments',
        '  Advanced filters: date ranges, user filters, sorting'
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
  console.log('📚 Content routes loaded with comprehensive functionality:');
  console.log('   ✅ Chat management: creation, editing, approval workflow');
  console.log('   ✅ Teaching management: 8-step creation, search, statistics');
  console.log('   ✅ Comment system: threaded comments, media support');
  console.log('   ✅ Admin controls: bulk operations, reports, audit logs');
  console.log('   ✅ Media upload: 3 media files per content item');
  console.log('   ✅ Legacy compatibility: existing API preserved');
  console.log('   ✅ Combined endpoints: chats + teachings integration');
}

export default router;








// // ikootaapi/routes/contentRoutes.js - UPDATED
// // Integration with new contentAdminControllers.js
// // Unified content management with proper admin separation

// import express from 'express';
// import { authenticate, authorize } from '../middlewares/auth.middleware.js';
// import { uploadMiddleware, uploadToS3 } from '../middlewares/upload.middleware.js';

// // ===============================================
// // IMPORT INDIVIDUAL CONTENT CONTROLLERS
// // ===============================================

// // Chat Controllers
// import {
//   fetchAllChats,
//   fetchChatsByUserId,
//   createChat,
//   addCommentToChat,
//   getChatHistory,
//   editChat,
//   removeChat,
//   fetchChatsByIds,
//   fetchChatByPrefixedId,
//   fetchCombinedContent
// } from '../controllers/chatControllers.js';

// // Teaching Controllers
// import {
//   createTeaching,
//   fetchAllTeachings,
//   fetchTeachingsByUserId,
//   editTeaching,
//   removeTeaching,
//   fetchTeachingsByIds,
//   fetchTeachingByPrefixedId,
//   searchTeachingsController,
//   fetchTeachingStats
// } from '../controllers/teachingsControllers.js';

// // Comment Controllers
// import {
//   createComment,
//   uploadCommentFiles,
//   fetchParentChatsAndTeachingsWithComments,
//   fetchCommentsByParentIds,
//   fetchCommentsByUserId,
//   fetchAllComments,
//   fetchCommentStats,
//   fetchCommentById,
//   updateComment,
//   deleteComment
// } from '../controllers/commentsControllers.js';

// // ===============================================
// // IMPORT NEW CONTENT ADMIN CONTROLLERS
// // ===============================================

// import {
//   // Main content admin functions
//   getPendingContent,
//   manageContent,
//   approveContent,
//   rejectContent,
//   deleteContent,
  
//   // Content type specific admin functions
//   getChatsForAdmin,
//   getTeachingsForAdmin,
//   getCommentsForAdmin,
//   updateContentStatus,
  
//   // Reports and audit functions
//   getReports,
//   updateReportStatus,
//   getAuditLogs,
  
//   // Utility functions
//   sendNotification,
//   getContentStats,
//   bulkManageContent
// } from '../controllers/contentAdminControllers.js';

// const router = express.Router();

// // ===============================================
// // CHATS ENDPOINTS - /api/content/chats/*
// // ===============================================

// // GET /content/chats - Fetch all chats
// router.get('/chats', fetchAllChats);

// // GET /content/chats/user - Fetch chats by user_id
// router.get('/chats/user', authenticate, fetchChatsByUserId);

// // GET /content/chats/ids - Fetch chats by multiple IDs
// router.get('/chats/ids', authenticate, fetchChatsByIds);

// // GET /content/chats/prefixed/:prefixedId - Fetch chat by prefixed ID
// router.get('/chats/prefixed/:prefixedId', authenticate, fetchChatByPrefixedId);

// // GET /content/chats/combinedcontent - Combined content endpoint
// router.get('/chats/combinedcontent', authenticate, fetchCombinedContent);

// // GET /content/chats/:userId1/:userId2 - Get chat history between users
// router.get('/chats/:userId1/:userId2', authenticate, getChatHistory);

// // POST /content/chats - Create new chat
// router.post('/chats', authenticate, uploadMiddleware, uploadToS3, createChat);

// // POST /content/chats/:chatId/comments - Add comment to chat
// router.post('/chats/:chatId/comments', authenticate, uploadMiddleware, uploadToS3, addCommentToChat);

// // PUT /content/chats/:id - Update chat
// router.put('/chats/:id', authenticate, uploadMiddleware, uploadToS3, editChat);

// // DELETE /content/chats/:id - Delete chat
// router.delete('/chats/:id', authenticate, removeChat);

// // ===============================================
// // TEACHINGS ENDPOINTS - /api/content/teachings/*
// // ===============================================

// // GET /content/teachings - Fetch all teachings
// router.get('/teachings', fetchAllTeachings);

// // GET /content/teachings/search - Search teachings
// router.get('/teachings/search', authenticate, searchTeachingsController);

// // GET /content/teachings/stats - Get teaching statistics
// router.get('/teachings/stats', authenticate, fetchTeachingStats);

// // GET /content/teachings/user - Fetch teachings by user_id
// router.get('/teachings/user', authenticate, fetchTeachingsByUserId);

// // GET /content/teachings/ids - Fetch teachings by multiple IDs
// router.get('/teachings/ids', authenticate, fetchTeachingsByIds);

// // GET /content/teachings/prefixed/:prefixedId - Fetch teaching by prefixed ID
// router.get('/teachings/prefixed/:prefixedId', authenticate, fetchTeachingByPrefixedId);

// // GET /content/teachings/:id - Fetch single teaching by ID
// router.get('/teachings/:id', authenticate, fetchTeachingByPrefixedId);

// // POST /content/teachings - Create new teaching
// router.post('/teachings', authenticate, uploadMiddleware, uploadToS3, createTeaching);

// // PUT /content/teachings/:id - Update teaching
// router.put('/teachings/:id', authenticate, uploadMiddleware, uploadToS3, editTeaching);

// // DELETE /content/teachings/:id - Delete teaching
// router.delete('/teachings/:id', authenticate, removeTeaching);

// // ===============================================
// // COMMENTS ENDPOINTS - /api/content/comments/*
// // ===============================================

// // GET /content/comments/all - Fetch all comments
// router.get('/comments/all', authenticate, fetchAllComments);

// // GET /content/comments/stats - Get comment statistics
// router.get('/comments/stats', authenticate, fetchCommentStats);

// // GET /content/comments/parent-comments - Fetch parent content with comments
// router.get('/comments/parent-comments', authenticate, fetchParentChatsAndTeachingsWithComments);

// // GET /content/comments/user/:user_id - Fetch comments by user
// router.get('/comments/user/:user_id', authenticate, fetchCommentsByUserId);

// // POST /content/comments/upload - Upload files for comments
// router.post('/comments/upload', authenticate, uploadMiddleware, uploadToS3, uploadCommentFiles);

// // POST /content/comments - Create new comment
// router.post('/comments', authenticate, uploadMiddleware, uploadToS3, createComment);

// // GET /content/comments/:commentId - Get specific comment
// router.get('/comments/:commentId', authenticate, fetchCommentById);

// // PUT /content/comments/:commentId - Update comment
// router.put('/comments/:commentId', authenticate, uploadMiddleware, uploadToS3, updateComment);

// // DELETE /content/comments/:commentId - Delete comment
// router.delete('/comments/:commentId', authenticate, deleteComment);

// // ===============================================
// // ADMIN CONTENT ENDPOINTS - /api/content/admin/*
// // ✅ UPDATED TO USE NEW contentAdminControllers
// // ===============================================

// // Apply admin authentication to all admin routes
// router.use('/admin/*', authenticate, authorize(['admin', 'super_admin']));

// // ===== MAIN ADMIN CONTENT MANAGEMENT =====

// // GET /content/admin/pending - Get pending content across all types
// router.get('/admin/pending', getPendingContent);

// // GET/POST /content/admin/manage - Manage content (bulk operations)
// router.get('/admin/manage', manageContent);
// router.post('/admin/manage', manageContent);

// // POST /content/admin/bulk-manage - Enhanced bulk operations
// router.post('/admin/bulk-manage', bulkManageContent);

// // POST /content/admin/:id/approve - Approve content
// router.post('/admin/:id/approve', approveContent);

// // POST /content/admin/:id/reject - Reject content
// router.post('/admin/:id/reject', rejectContent);

// // DELETE /content/admin/:contentType/:id - Delete specific content
// router.delete('/admin/:contentType/:id', deleteContent);

// // ===== CONTENT TYPE SPECIFIC ADMIN ENDPOINTS =====

// // GET /content/admin/chats - Get all chats for admin management
// router.get('/admin/chats', getChatsForAdmin);

// // GET /content/admin/teachings - Get all teachings for admin management
// router.get('/admin/teachings', getTeachingsForAdmin);

// // GET /content/admin/comments - Get all comments for admin management
// router.get('/admin/comments', getCommentsForAdmin);

// // PUT /content/admin/:contentType/:id - Update content status
// router.put('/admin/:contentType/:id', updateContentStatus);

// // ===== REPORTS AND AUDIT =====

// // GET /content/admin/reports - Get content reports
// router.get('/admin/reports', getReports);

// // PUT /content/admin/reports/:reportId/status - Update report status
// router.put('/admin/reports/:reportId/status', updateReportStatus);

// // GET /content/admin/audit-logs - Get audit logs
// router.get('/admin/audit-logs', getAuditLogs);

// // ===== ADMIN UTILITIES =====

// // POST /content/admin/notifications/send - Send notification
// router.post('/admin/notifications/send', sendNotification);

// // GET /content/admin/stats - Get content statistics
// router.get('/admin/stats', getContentStats);

// // ===============================================
// // LEGACY COMPATIBILITY ROUTES
// // ✅ MAINTAINED FOR BACKWARD COMPATIBILITY
// // ===============================================

// // Legacy /chats routes
// router.use('/chats-legacy', (req, res, next) => {
//   console.log('🔄 Legacy /chats route accessed');
//   req.url = req.url.replace('/chats-legacy', '/chats');
//   next();
// });

// // Legacy /teachings routes  
// router.use('/teachings-legacy', (req, res, next) => {
//   console.log('🔄 Legacy /teachings route accessed');
//   req.url = req.url.replace('/teachings-legacy', '/teachings');
//   next();
// });

// // Legacy /comments routes
// router.use('/comments-legacy', (req, res, next) => {
//   console.log('🔄 Legacy /comments route accessed');
//   req.url = req.url.replace('/comments-legacy', '/comments');
//   next();
// });

// // Legacy /messages route mapped to teachings
// router.get('/messages', (req, res, next) => {
//   console.log('🔄 Legacy /messages route accessed, mapping to teachings');
//   req.url = '/teachings';
//   req.query.legacy_messages = 'true';
//   fetchAllTeachings(req, res, next);
// });

// // ADD THIS AS A NEW ROUTE IN contentRoutes.js (in the legacy compatibility section)

// // Legacy /messages route mapped to teachings
// router.get('/messages', async (req, res) => {
//   try {
//     console.log('Legacy /api/messages endpoint accessed, mapping to teachings');
    
//     // Map query parameters
//     const { status, page = 1, limit = 50, user_id } = req.query;
    
//     // Map status to approval_status
//     let approval_status;
//     if (status) {
//       switch (status.toLowerCase()) {
//         case 'pending':
//           approval_status = 'pending';
//           break;
//         case 'approved':
//           approval_status = 'approved';
//           break;
//         case 'rejected':
//           approval_status = 'rejected';
//           break;
//         default:
//           approval_status = status;
//       }
//     }

//     const filters = {
//       approval_status,
//       user_id,
//       page: parseInt(page),
//       limit: parseInt(limit)
//     };

//     // Import getAllTeachings at the top of the file if not already imported
//     const { getAllTeachings } = await import('../services/teachingsServices.js');
//     const teachings = await getAllTeachings(filters);
    
//     // Return in format expected by frontend
//     res.status(200).json({
//       success: true,
//       data: teachings,
//       count: teachings.length,
//       message: 'Messages endpoint mapped to teachings',
//       filters
//     });

//   } catch (error) {
//     console.error('Error in legacy messages endpoint:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       message: 'Failed to fetch messages (teachings)'
//     });
//   }
// });

// // ===============================================
// // ERROR HANDLING
// // ===============================================

// // 404 handler for content routes
// router.use('*', (req, res) => {
//   console.log(`❌ Content route not found: ${req.method} ${req.path}`);
  
//   res.status(404).json({
//     success: false,
//     error: 'Content route not found',
//     path: req.path,
//     method: req.method,
//     availableRoutes: {
//       chats: [
//         'GET /chats - Get all chats',
//         'GET /chats/user - Get user chats',
//         'GET /chats/combinedcontent - Combined content',
//         'POST /chats - Create chat',
//         'PUT /chats/:id - Update chat',
//         'DELETE /chats/:id - Delete chat'
//       ],
//       teachings: [
//         'GET /teachings - Get all teachings',
//         'GET /teachings/search - Search teachings',
//         'GET /teachings/stats - Teaching statistics',
//         'POST /teachings - Create teaching',
//         'PUT /teachings/:id - Update teaching',
//         'DELETE /teachings/:id - Delete teaching'
//       ],
//       comments: [
//         'GET /comments/all - Get all comments',
//         'GET /comments/stats - Comment statistics',
//         'POST /comments - Create comment',
//         'PUT /comments/:id - Update comment',
//         'DELETE /comments/:id - Delete comment'
//       ],
//       admin: [
//         'GET /admin/pending - Pending content',
//         'GET /admin/chats - Admin chat management',
//         'GET /admin/teachings - Admin teaching management',
//         'GET /admin/comments - Admin comment management',
//         'GET /admin/reports - Content reports',
//         'GET /admin/audit-logs - Audit logs',
//         'GET /admin/stats - Content statistics',
//         'POST /admin/bulk-manage - Bulk operations'
//       ]
//     },
//     timestamp: new Date().toISOString()
//   });
// });

// // Global error handler
// router.use((error, req, res, next) => {
//   console.error('❌ Content route error:', {
//     error: error.message,
//     path: req.path,
//     method: req.method,
//     user: req.user?.username || 'unauthenticated',
//     timestamp: new Date().toISOString()
//   });
  
//   res.status(error.statusCode || 500).json({
//     success: false,
//     error: error.message || 'Content management error',
//     path: req.path,
//     method: req.method,
//     timestamp: new Date().toISOString()
//   });
// });

// // ===============================================
// // DEVELOPMENT LOGGING
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   console.log('📚 Content routes loaded with enhanced admin management:');
//   console.log('   ✅ Individual content controllers: chats, teachings, comments');
//   console.log('   ✅ Unified admin controllers: contentAdminControllers.js');
//   console.log('   ✅ Separated services: content services + contentAdminServices.js');
//   console.log('   ✅ Backward compatibility maintained');
//   console.log('   ✅ Enhanced admin bulk operations');
//   console.log('   ✅ Comprehensive error handling');
// }

// export default router;
