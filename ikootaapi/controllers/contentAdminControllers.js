// ikootaapi/controllers/contentAdminControllers.js
// EXTRACTED from adminControllers.js + ENHANCED for unified content management
// Handles admin operations for chats, teachings, comments across /api/content/admin/*

import {
  getPendingContentService,
  approveContentService,
  rejectContentService,
  manageContentService,
  deleteContentService,
  updateCommentStatusService,
  getReportsService,
  getAllReportsService,
  getAuditLogsService
} from '../services/contentAdminServices.js';

import {
  getAllChats,
  updateChatById,
  deleteChatById,
  getChatStats
} from '../services/chatServices.js';

import {
  getAllTeachings,
  updateTeachingById,
  deleteTeachingById,
  getTeachingStats,
  searchTeachings
} from '../services/teachingsServices.js';

import {
  getAllComments,
  updateCommentById,
  deleteCommentById,
  getCommentStats
} from '../services/commentServices.js';

import db from '../config/db.js';

import { validateChatData } from '../utils/contentValidation.js';
import { formatErrorResponse } from '../utils/errorHelpers.js';
import { normalizeContentItem } from '../utils/contentHelpers.js';

// ============================================================================
// UNIFIED CONTENT ADMIN CONTROLLERS
// Extracted from adminControllers.js and enhanced for content management
// ============================================================================

/**
 * ✅ GET /api/content/admin/pending - Get pending content across all types
 * EXTRACTED from adminControllers.js + ENHANCED
 */
export const getPendingContent = async (req, res) => {
  try {
    console.log('🔍 getPendingContent endpoint called');
    
    const requestingUser = req.user;

    // Authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    const { page = 1, limit = 50, content_type } = req.query;

    // ✅ ENHANCED: Use the existing service but add filtering
    let pendingContent = await getPendingContentService();
    
    // Filter by content type if specified
    if (content_type) {
      pendingContent = pendingContent.filter(item => item.content_type === content_type);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedContent = pendingContent.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      content: paginatedContent, // Keep 'content' key for compatibility
      data: paginatedContent,     // Also provide 'data' key for consistency
      count: paginatedContent.length,
      total: pendingContent.length,
      breakdown: {
        chats: pendingContent.filter(c => c.content_type === 'chat').length,
        teachings: pendingContent.filter(c => c.content_type === 'teaching').length
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(pendingContent.length / limit)
      }
    });
    
  } catch (error) {
    console.error('Error in getPendingContent:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while fetching pending content.',
      message: error.message
    });
  }
};

/**
 * ✅ GET/POST /api/content/admin/manage - Manage content (bulk operations)
 * EXTRACTED from adminControllers.js + ENHANCED
 */
export const manageContent = async (req, res) => {
  try {
    console.log('🔍 manageContent called');
    
    const requestingUser = req.user;

    // Authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    const { method } = req;
    
    // Check if this is a bulk action request
    if (method === 'POST') {
      const { action, contentIds, options = {} } = req.body;
      
      if (!action || !contentIds || !Array.isArray(contentIds)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Action and contentIds array are required'
        });
      }

      const result = await manageContentService(action, contentIds, options);
      
      res.status(200).json({
        success: true,
        message: `Content ${action} completed successfully`,
        result,
        affected_count: contentIds.length
      });
    } else {
      // GET request - return all content for management
      const { content_type, approval_status, page = 1, limit = 50 } = req.query;
      
      let content = await manageContentService(); // Get all content
      
      // Apply filters
      if (content_type) {
        content = content.filter(item => item.content_type === content_type);
      }
      if (approval_status) {
        content = content.filter(item => item.approval_status === approval_status);
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedContent = content.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        content: paginatedContent, // Keep for compatibility
        data: paginatedContent,    // Also provide for consistency
        count: paginatedContent.length,
        total: content.length,
        filters: { content_type, approval_status },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(content.length / limit)
        }
      });
    }
    
  } catch (error) {
    console.error('Error in manageContent:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while managing content.',
      message: error.message
    });
  }
};

/**
 * ✅ POST /api/content/admin/:id/approve - Approve content
 * EXTRACTED from adminControllers.js + ENHANCED
 */
export const approveContent = async (req, res) => {
  try {
    const contentId = req.params.id;
    const { contentType, adminNotes, content_type } = req.body;
    const requestingUser = req.user;

    console.log('🔍 approveContent called for ID:', contentId);

    // Authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: 'Content ID required',
        message: 'Please provide a valid content ID'
      });
    }

    // ✅ ENHANCED: Support both contentType and content_type for compatibility
    const finalContentType = contentType || content_type || 'teaching';
    const finalAdminNotes = adminNotes || `Approved by ${requestingUser.username || 'admin'}`;

    await approveContentService(contentId, finalContentType, finalAdminNotes);
    
    res.status(200).json({ 
      success: true,
      message: 'Content approved successfully',
      content_id: contentId,
      content_type: finalContentType,
      reviewed_by: requestingUser.username || requestingUser.id
    });
    
  } catch (error) {
    console.error('Error in approveContent:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while approving the content.',
      message: error.message
    });
  }
};

/**
 * ✅ POST /api/content/admin/:id/reject - Reject content  
 * EXTRACTED from adminControllers.js + ENHANCED
 */
export const rejectContent = async (req, res) => {
  try {
    const contentId = req.params.id;
    const { contentType, adminNotes, content_type, reason } = req.body;
    const requestingUser = req.user;

    console.log('🔍 rejectContent called for ID:', contentId);

    // Authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: 'Content ID required',
        message: 'Please provide a valid content ID'
      });
    }

    // ✅ ENHANCED: Support multiple note formats and require rejection reason
    const finalContentType = contentType || content_type || 'teaching';
    const finalAdminNotes = adminNotes || reason || 'Rejected by admin - no reason provided';

    await rejectContentService(contentId, finalContentType, finalAdminNotes);
    
    res.status(200).json({ 
      success: true,
      message: 'Content rejected successfully',
      content_id: contentId,
      content_type: finalContentType,
      rejection_reason: finalAdminNotes,
      reviewed_by: requestingUser.username || requestingUser.id
    });
    
  } catch (error) {
    console.error('Error in rejectContent:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while rejecting the content.',
      message: error.message
    });
  }
};

/**
 * ✅ DELETE /api/content/admin/:contentType/:id - Delete specific content
 * NEW - Enhanced deletion with content type routing
 */
export const deleteContent = async (req, res) => {
  try {
    const { contentType, id } = req.params;
    const requestingUser = req.user;

    console.log('🔍 deleteContent called:', contentType, id);

    // Authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    if (!contentType || !id) {
      return res.status(400).json({
        success: false,
        error: 'Content type and ID required',
        message: 'Please specify both content type and content ID'
      });
    }

    // Validate content type
    const validContentTypes = ['chat', 'teaching', 'comment'];
    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid content type',
        message: `Content type must be one of: ${validContentTypes.join(', ')}`
      });
    }

    // Use the existing service
    const result = await deleteContentService(parseInt(id), contentType);

    res.status(200).json({
      success: true,
      message: `${contentType} deleted successfully`,
      content_type: contentType,
      content_id: parseInt(id),
      deleted_by: requestingUser.username || requestingUser.id,
      result
    });
    
  } catch (error) {
    console.error('Error in deleteContent:', error.message);
    res.status(500).json({
      success: false,
      error: 'An error occurred while deleting content.',
      message: error.message
    });
  }
};

/**
 * ✅ GET /api/content/admin/chats - Get all chats for admin management
 * NEW - Content type specific admin endpoints
 */
export const getChatsForAdmin = async (req, res) => {
  try {
    const requestingUser = req.user;

    // Authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    const { approval_status, page = 1, limit = 50, user_id } = req.query;

    const filters = { approval_status, user_id, page, limit };
    const chats = await getAllChats(filters);

    res.status(200).json({
      success: true,
      data: chats,
      content_type: 'chat',
      count: chats.length,
      filters
    });

  } catch (error) {
    console.error('Error in getChatsForAdmin:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch chats for admin'
    });
  }
};

/**
 * ✅ GET /api/content/admin/teachings - Get all teachings for admin management  
 * NEW - Content type specific admin endpoints
 */
export const getTeachingsForAdmin = async (req, res) => {
  try {
    const requestingUser = req.user;

    // Authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    const { approval_status, page = 1, limit = 50, user_id } = req.query;

    const filters = { approval_status, user_id, page, limit };
    const teachings = await getAllTeachings(filters);

    res.status(200).json({
      success: true,
      data: teachings,
      content_type: 'teaching',
      count: teachings.length,
      filters
    });

  } catch (error) {
    console.error('Error in getTeachingsForAdmin:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch teachings for admin'
    });
  }
};

/**
 * ✅ GET /api/content/admin/comments - Get all comments for admin management
 * NEW - Content type specific admin endpoints  
 */
export const getCommentsForAdmin = async (req, res) => {
  try {
    const requestingUser = req.user;

    // Authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    const { page = 1, limit = 50, user_id } = req.query;

    const filters = { user_id, page, limit };
    const comments = await getAllComments(filters);

    res.status(200).json({
      success: true,
      data: comments,
      content_type: 'comment',
      count: comments.length,
      filters
    });

  } catch (error) {
    console.error('Error in getCommentsForAdmin:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch comments for admin'
    });
  }
};

/**
 * ✅ PUT /api/content/admin/:contentType/:id - Update content status
 * NEW - Unified content status update
 */
export const updateContentStatus = async (req, res) => {
  try {
    const { contentType, id } = req.params;
    const { approval_status, admin_notes } = req.body;
    const requestingUser = req.user;

    // Authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    if (!contentType || !id) {
      return res.status(400).json({
        success: false,
        error: 'Content type and ID required',
        message: 'Please specify both content type and content ID'
      });
    }

    const updateData = {
      approval_status,
      admin_notes,
      reviewed_by: requestingUser.id,
      reviewedAt: new Date()
    };

    let updatedContent;

    switch (contentType) {
      case 'chat':
        updatedContent = await updateChatById(parseInt(id), updateData);
        break;
      case 'teaching':
        updatedContent = await updateTeachingById(parseInt(id), updateData);
        break;
      case 'comment':
        updatedContent = await updateCommentById(parseInt(id), updateData);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid content type',
          message: 'Content type must be chat, teaching, or comment'
        });
    }

    res.status(200).json({
      success: true,
      data: updatedContent,
      message: `${contentType} status updated successfully`,
      updated_by: requestingUser.username || requestingUser.id
    });

  } catch (error) {
    console.error('Error in updateContentStatus:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to update content status'
    });
  }
};

/**
 * ✅ GET /api/content/admin/reports - Get content reports
 * EXTRACTED from adminControllers.js + ENHANCED
 */
export const getReports = async (req, res) => {
  try {
    console.log('🔍 getReports endpoint called');
    
    const requestingUser = req.user;

    // Authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    const { status = 'all', page = 1, limit = 50 } = req.query;

    let reports;
    if (status === 'all') {
      reports = await getAllReportsService();
    } else {
      reports = await getReportsService(); // Gets pending by default
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedReports = reports.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      reports: paginatedReports, // Keep for compatibility
      data: paginatedReports,    // Also provide for consistency
      count: paginatedReports.length,
      total: reports.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(reports.length / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching reports:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while fetching reports.',
      message: error.message
    });
  }
};

/**
 * ✅ PUT /api/content/admin/reports/:reportId/status - Update report status
 * EXTRACTED from adminControllers.js + ENHANCED
 */
export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes, admin_notes } = req.body;
    const requestingUser = req.user;

    console.log('🔍 updateReportStatus called for report:', reportId);

    // Authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    if (!reportId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Report ID and status required',
        message: 'Please provide both report ID and new status'
      });
    }

    // ✅ ENHANCED: Support both adminNotes and admin_notes for compatibility
    const finalAdminNotes = adminNotes || admin_notes || '';

    const query = `
      UPDATE reports 
      SET status = ?, admin_notes = ?, updatedAt = NOW(), reviewed_by = ?
      WHERE id = ?
    `;
    
    const [result] = await db.query(query, [status, finalAdminNotes, requestingUser.id, reportId]);
    
    res.status(200).json({
      success: true,
      message: 'Report status updated successfully',
      report_id: reportId,
      new_status: status,
      reviewed_by: requestingUser.username || requestingUser.id,
      result
    });
    
  } catch (error) {
    console.error('Error updating report status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status',
      error: error.message
    });
  }
};

/**
 * ✅ GET /api/content/admin/audit-logs - Get audit logs
 * EXTRACTED from adminControllers.js + ENHANCED
 */
export const getAuditLogs = async (req, res) => {
  try {
    console.log('🔍 getAuditLogs endpoint called');
    
    const requestingUser = req.user;

    // Authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    const { page = 1, limit = 100, action, resource } = req.query;

    let auditLogs = await getAuditLogsService();

    // Apply filters
    if (action) {
      auditLogs = auditLogs.filter(log => log.action?.toLowerCase().includes(action.toLowerCase()));
    }
    if (resource) {
      auditLogs = auditLogs.filter(log => log.resource?.toLowerCase().includes(resource.toLowerCase()));
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLogs = auditLogs.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      auditLogs: paginatedLogs, // Keep for compatibility  
      data: paginatedLogs,      // Also provide for consistency
      count: paginatedLogs.length,
      total: auditLogs.length,
      filters: { action, resource },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(auditLogs.length / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching audit logs:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while fetching audit logs.',
      message: error.message
    });
  }
};

/**
 * ✅ POST /api/content/admin/notifications/send - Send notification
 * NEW - Content-related notification system
 */
export const sendNotification = async (req, res) => {
  try {
    const { userId, message, type, content_id, content_type } = req.body;
    const requestingUser = req.user;

    console.log('🔍 sendNotification called for user:', userId);

    // Authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'User ID and message required',
        message: 'Please provide both user ID and notification message'
      });
    }

    // TODO: Implement actual notification logic
    // This could integrate with your email/SMS services
    console.log('📧 Notification would be sent:', {
      to: userId,
      message,
      type: type || 'content_update',
      content_id,
      content_type,
      from: requestingUser.id
    });

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      notification: {
        recipient: userId,
        type: type || 'content_update',
        content_id,
        content_type,
        sent_by: requestingUser.username || requestingUser.id,
        sent_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error sending notification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

/**
 * ✅ GET /api/content/admin/stats - Get content statistics
 * NEW - Comprehensive content analytics for admin dashboard
 */
export const getContentStats = async (req, res) => {
  try {
    const requestingUser = req.user;

    // Authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    const { timeframe = '30days' } = req.query;

    // Get stats from each content service
    const [chatStats, teachingStats, commentStats] = await Promise.all([
      getChatStats({ timeframe }),
      getTeachingStats({ timeframe }), 
      getCommentStats({ timeframe })
    ]);

    const combinedStats = {
      summary: {
        total_chats: chatStats.total_chats || 0,
        total_teachings: teachingStats.total_teachings || 0,
        total_comments: commentStats.total_comments || 0,
        pending_content: (chatStats.pending_chats || 0) + (teachingStats.pending_teachings || 0),
        flagged_content: chatStats.flagged_chats || 0
      },
      by_type: {
        chats: chatStats,
        teachings: teachingStats,
        comments: commentStats
      },
      timeframe
    };

    res.status(200).json({
      success: true,
      data: combinedStats,
      generated_at: new Date().toISOString(),
      generated_by: requestingUser.username || requestingUser.id
    });

  } catch (error) {
    console.error('Error in getContentStats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch content statistics'
    });
  }
};

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * ✅ POST /api/content/admin/bulk-manage - Bulk content management
 * NEW - Enhanced bulk operations
 */
export const bulkManageContent = async (req, res) => {
  try {
    const { action, items, options = {} } = req.body;
    const requestingUser = req.user;

    // Authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    if (!action || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Action and items array are required'
      });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        const { content_type, content_id } = item;
        
        switch (action) {
          case 'approve':
            await approveContentService(content_id, content_type, options.admin_notes);
            break;
          case 'reject':
            await rejectContentService(content_id, content_type, options.admin_notes);
            break;
          case 'delete':
            await deleteContentService(content_id, content_type);
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }

        results.push({
          content_id,
          content_type,
          status: 'success',
          action
        });
        successCount++;

      } catch (itemError) {
        results.push({
          content_id: item.content_id,
          content_type: item.content_type,
          status: 'error',
          error: itemError.message
        });
        errorCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk ${action} completed`,
      summary: {
        total_items: items.length,
        successful: successCount,
        failed: errorCount
      },
      results,
      performed_by: requestingUser.username || requestingUser.id
    });

  } catch (error) {
    console.error('Error in bulkManageContent:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to perform bulk operation'
    });
  }
};

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

// export {
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
//   // getReports,
//   // updateReportStatus,
//   // getAuditLogs,
  
//   // Utility functions
//   // sendNotification,
//   // getContentStats,
//   // bulkManageContent
// };
