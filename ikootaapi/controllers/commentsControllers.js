// ikootaapi/controllers/commentsControllers.js - COMPLETE RECREATION
// Enhanced comment system with threaded comments and media support

import {
  createCommentService,
  uploadCommentService,
  getCommentsByUserId,
  getChatAndTeachingIdsFromComments,
  getParentChatsAndTeachingsWithComments,
  getCommentsByParentIds,
  getAllComments,
  getCommentStats,
  getCommentById,
  updateCommentById,
  deleteCommentById
} from "../services/commentServices.js";

import { validateCommentData } from '../utils/contentValidation.js';
import { formatErrorResponse } from '../utils/errorHelpers.js';
import { normalizeContentItem } from '../utils/contentHelpers.js';

// ✅ Enhanced createComment with proper user_id handling and validation
export const createComment = async (req, res) => {
  try {
    const { chat_id, teaching_id, comment, parentcomment_id } = req.body;
    const requestingUser = req.user;

    console.log('createComment req body:', req.body);
    console.log('createComment req user:', requestingUser);

    // Validation - must have either chat_id or teaching_id, and comment text
    if ((!chat_id && !teaching_id) || !comment) {
      return res.status(400).json({
        success: false,
        error: "Chat ID or Teaching ID, and Comment are required.",
        message: "Please provide either a chat_id or teaching_id, and comment text",
        required_fields: ["comment", "chat_id OR teaching_id"]
      });
    }

    // Can't comment on both chat and teaching simultaneously
    if (chat_id && teaching_id) {
      return res.status(400).json({
        success: false,
        error: "Cannot comment on both chat and teaching",
        message: "Provide either chat_id or teaching_id, not both"
      });
    }

    if (!requestingUser?.user_id && !requestingUser?.id && !requestingUser?.converse_id) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "User authentication is required"
      });
    }

    // ✅ CRITICAL: Use converse_id (char(10)) for comments as per database schema
    const user_id = requestingUser.converse_id || requestingUser.user_id || requestingUser.id;

    // Validate user_id format for comments (char(10))
    if (!user_id || (typeof user_id === 'string' && user_id.length !== 10)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID format",
        message: "Comments require a valid 10-character converse_id"
      });
    }

    // Validate parent exists if this is a reply
    if (parentcomment_id) {
      try {
        const parentComment = await getCommentById(parentcomment_id);
        if (!parentComment) {
          return res.status(404).json({
            success: false,
            error: "Parent comment not found",
            message: "Cannot reply to non-existent comment"
          });
        }

        // Ensure reply is on same content as parent
        if (chat_id && parentComment.chat_id !== parseInt(chat_id)) {
          return res.status(400).json({
            success: false,
            error: "Comment thread mismatch",
            message: "Reply must be on same chat as parent comment"
          });
        }

        if (teaching_id && parentComment.teaching_id !== parseInt(teaching_id)) {
          return res.status(400).json({
            success: false,
            error: "Comment thread mismatch", 
            message: "Reply must be on same teaching as parent comment"
          });
        }
      } catch (error) {
        console.warn('Error validating parent comment:', error);
      }
    }

    // Process uploaded files (up to 3 media files)
    const files = req.uploadedFiles || [];
    console.log("req.uploadedFiles:", req.uploadedFiles);
    console.log("files:", files);
    
    const media = files.slice(0, 3).map((file, index) => ({
      url: file.url,
      type: file.type || `media${index + 1}`,
    }));

    // Additional validation
    const validationErrors = validateCommentData({
      comment: comment.trim(),
      user_id,
      chat_id: chat_id || null,
      teaching_id: teaching_id || null
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validation_errors: validationErrors
      });
    }

    const newComment = await createCommentService({
      user_id,
      chat_id: chat_id || null,
      teaching_id: teaching_id || null,
      comment: comment.trim(),
      parentcomment_id: parentcomment_id || null,
      media,
    });

    res.status(201).json({
      success: true,
      data: newComment,
      message: "Comment created successfully.",
      comment_type: parentcomment_id ? 'reply' : 'top_level',
      parent_content: chat_id ? 'chat' : 'teaching'
    });
  } catch (error) {
    console.error('createComment error:', error);
    res.status(500).json(formatErrorResponse(error, 'Failed to create comment'));
  }
};

// ✅ Enhanced uploadCommentFiles with proper validation
export const uploadCommentFiles = async (req, res) => {
  try {
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided',
        message: 'Please select files to upload'
      });
    }

    // Limit file count
    if (files.length > 3) {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        message: 'Maximum 3 files allowed per comment'
      });
    }

    const uploadedFiles = await uploadCommentService(files);

    res.status(201).json({
      success: true,
      uploadedFiles, 
      count: uploadedFiles.length,
      message: "Files uploaded successfully."
    });
  } catch (error) {
    console.error('uploadCommentFiles error:', error);
    res.status(500).json(formatErrorResponse(error, 'Failed to upload comment files'));
  }
};

// ✅ Enhanced fetchParentChatsAndTeachingsWithComments - maintains original structure for frontend compatibility
export const fetchParentChatsAndTeachingsWithComments = async (req, res) => {
  const { user_id } = req.query;
  
  try {
    console.log("Fetching comments for user:", user_id);
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        message: 'Please provide a valid user ID'
      });
    }

    const comments = await getCommentsByUserId(user_id);
    
    const { chatIds, teachingIds } = getChatAndTeachingIdsFromComments(comments);
    
    const data = await getParentChatsAndTeachingsWithComments(chatIds, teachingIds);
    const { chats, teachings } = data;

    // ✅ PRESERVED: Keep original response structure that frontend expects
    res.status(200).json({
      success: true, // Added for consistency
      chats,
      teachings,
      comments, // Frontend expects this at root level
      // Add enhanced info without breaking frontend
      _meta: {
        user_id,
        count: {
          chats: chats?.length || 0,
          teachings: teachings?.length || 0,
          comments: comments?.length || 0
        },
        chat_ids: chatIds,
        teaching_ids: teachingIds
      }
    });
  } catch (error) {
    console.log("fetchParentChatsAndTeachingsWithComments error:", error);
    res.status(500).json(formatErrorResponse(error, 'Failed to fetch parent content with comments'));
  }
};

// ✅ Enhanced fetchCommentsByParentIds - maintains original structure
export const fetchCommentsByParentIds = async (req, res) => {
  const { chatIds, teachingIds } = req.query;
  
  try {
    if (!chatIds && !teachingIds) {
      return res.status(400).json({
        success: false,
        error: 'Parent IDs required',
        message: 'Please provide either chatIds or teachingIds'
      });
    }

    const comments = await getCommentsByParentIds(chatIds, teachingIds);
    
    // ✅ PRESERVED: Keep original response structure
    res.status(200).json(comments);
  } catch (error) {
    console.error('fetchCommentsByParentIds error:', error);
    res.status(500).json(formatErrorResponse(error, 'Failed to fetch comments by parent IDs'));
  }
};

// ✅ Enhanced fetchCommentsByUserId - maintains original structure
export const fetchCommentsByUserId = async (req, res) => {
  const { user_id } = req.params;
  
  try {
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        message: 'Please provide a valid user ID'
      });
    }

    // Authorization check - users can only see their own comments unless admin
    const requestingUser = req.user;
    const isAdmin = ['admin', 'super_admin'].includes(requestingUser?.role);
    const requestingUserId = requestingUser?.converse_id || requestingUser?.user_id || requestingUser?.id;
    
    if (!isAdmin && user_id !== requestingUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view your own comments'
      });
    }

    const comments = await getCommentsByUserId(user_id);
    
    // ✅ PRESERVED: Keep original response structure
    res.status(200).json(comments);
  } catch (error) {
    console.error('fetchCommentsByUserId error:', error);
    res.status(500).json(formatErrorResponse(error, 'Failed to fetch user comments'));
  }
};

// ✅ Enhanced fetchAllComments - maintains original structure
export const fetchAllComments = async (req, res) => {
  try {
    const requestingUser = req.user;
    
    // Only admins can view all comments
    const isAdmin = ['admin', 'super_admin'].includes(requestingUser?.role);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin privileges required to view all comments'
      });
    }

    const { page, limit, parent_type, approval_status } = req.query;
    const filters = { page, limit, parent_type, approval_status };
    
    const comments = await getAllComments(filters);
    
    // ✅ PRESERVED: Keep original response structure
    res.status(200).json(comments);
  } catch (error) {
    console.error('fetchAllComments error:', error);
    res.status(500).json(formatErrorResponse(error, 'Failed to fetch all comments'));
  }
};

// ✅ Enhanced fetchCommentStats - new endpoint with enhanced format
export const fetchCommentStats = async (req, res) => {
  try {
    const requestingUser = req.user;

    // Basic authorization check
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can view comment statistics'
      });
    }

    const { user_id, startDate, endDate, timeframe = '30days' } = req.query;
    const filters = { user_id, startDate, endDate, timeframe };

    const stats = await getCommentStats(filters);

    res.status(200).json({
      success: true,
      data: stats,
      filters,
      generated_at: new Date().toISOString(),
      scope: user_id ? 'user_specific' : 'global'
    });

  } catch (error) {
    console.error('Error in fetchCommentStats:', error);
    res.status(500).json(formatErrorResponse(error, 'Failed to fetch comment statistics'));
  }
};

// ✅ Enhanced fetchCommentById - new endpoint with enhanced format
export const fetchCommentById = async (req, res) => {
  try {
    const { commentId } = req.params;
    const requestingUser = req.user;

    if (!commentId) {
      return res.status(400).json({
        success: false,
        error: 'Comment ID required',
        message: 'Please provide a valid comment ID'
      });
    }

    const comment = await getCommentById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
        message: `No comment found with ID: ${commentId}`
      });
    }

    // Basic authorization check - users can view their own comments or if admin
    const userCanView = comment.user_id === requestingUser?.converse_id || 
                       comment.user_id === requestingUser?.user_id ||
                       ['admin', 'super_admin'].includes(requestingUser?.role);

    if (!userCanView) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view your own comments'
      });
    }

    res.status(200).json({
      success: true,
      data: comment
    });

  } catch (error) {
    console.error('Error in fetchCommentById:', error);
    res.status(500).json(formatErrorResponse(error, 'Failed to fetch comment'));
  }
};

// ✅ Enhanced updateComment - new endpoint with enhanced format
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;
    const requestingUser = req.user;

    if (!commentId) {
      return res.status(400).json({
        success: false,
        error: 'Comment ID required',
        message: 'Please provide a valid comment ID'
      });
    }

    // Get existing comment to check ownership
    const existingComment = await getCommentById(commentId);

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
        message: `No comment found with ID: ${commentId}`
      });
    }

    // Authorization check
    const userCanEdit = existingComment.user_id === requestingUser?.converse_id || 
                       existingComment.user_id === requestingUser?.user_id ||
                       ['admin', 'super_admin'].includes(requestingUser?.role);

    if (!userCanEdit) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only update your own comments'
      });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment text required',
        message: 'Please provide comment text'
      });
    }

    // Process uploaded files if any
    const files = req.uploadedFiles || [];
    const media = files.slice(0, 3).map((file, index) => ({
      url: file.url,
      type: file.type || `media${index + 1}`,
    }));

    const updateData = {
      comment: comment.trim(),
      media,
      edited_at: new Date(),
      edited_by: requestingUser?.converse_id || requestingUser?.user_id || requestingUser?.id
    };

    const updatedComment = await updateCommentById(commentId, updateData);

    res.status(200).json({
      success: true,
      data: updatedComment,
      message: 'Comment updated successfully'
    });

  } catch (error) {
    console.error('Error in updateComment:', error);
    res.status(500).json(formatErrorResponse(error, 'Failed to update comment'));
  }
};

// ✅ Enhanced deleteComment - new endpoint with enhanced format  
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { soft_delete = false } = req.query;
    const requestingUser = req.user;

    if (!commentId) {
      return res.status(400).json({
        success: false,
        error: 'Comment ID required',
        message: 'Please provide a valid comment ID'
      });
    }

    // Get existing comment to check ownership
    const existingComment = await getCommentById(commentId);

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
        message: `No comment found with ID: ${commentId}`
      });
    }

    // Authorization check
    const userCanDelete = existingComment.user_id === requestingUser?.converse_id || 
                         existingComment.user_id === requestingUser?.user_id ||
                         ['admin', 'super_admin'].includes(requestingUser?.role);

    if (!userCanDelete) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own comments'
      });
    }

    let result;
    if (soft_delete === 'true' || soft_delete === true) {
      // Soft delete - mark as deleted but keep in database
      result = await updateCommentById(commentId, {
        is_deleted: true,
        deleted_at: new Date(),
        deleted_by: requestingUser?.converse_id || requestingUser?.user_id || requestingUser?.id
      });
    } else {
      // Hard delete
      result = await deleteCommentById(commentId);
    }

    res.status(200).json({
      success: true,
      data: result,
      message: soft_delete ? 'Comment marked as deleted' : 'Comment deleted successfully',
      deletion_type: soft_delete ? 'soft' : 'hard',
      deleted_by: requestingUser?.username || requestingUser?.id
    });

  } catch (error) {
    console.error('Error in deleteComment:', error);
    res.status(500).json(formatErrorResponse(error, 'Failed to delete comment'));
  }
};

// ✅ New: Get comment thread (replies to a comment)
export const getCommentThread = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 20, sort_order = 'asc' } = req.query;

    if (!commentId) {
      return res.status(400).json({
        success: false,
        error: 'Comment ID required',
        message: 'Please provide a valid comment ID'
      });
    }

    // Get the parent comment
    const parentComment = await getCommentById(commentId);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
        message: `No comment found with ID: ${commentId}`
      });
    }

    // Get replies using service function
    const { getCommentReplies } = await import('../services/commentServices.js');
    const replies = await getCommentReplies(commentId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort_order
    });

    res.status(200).json({
      success: true,
      data: {
        parent_comment: parentComment,
        replies: replies,
        reply_count: replies.length
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error in getCommentThread:', error);
    res.status(500).json(formatErrorResponse(error, 'Failed to fetch comment thread'));
  }
};

// ✅ New: Bulk comment operations
export const bulkCommentOperations = async (req, res) => {
  try {
    const { action, comment_ids, options = {} } = req.body;
    const requestingUser = req.user;
    
    // Only admins can perform bulk operations
    const isAdmin = ['admin', 'super_admin'].includes(requestingUser?.role);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin privileges required for bulk operations'
      });
    }

    if (!action || !comment_ids || !Array.isArray(comment_ids)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Action and comment_ids array are required'
      });
    }

    const validActions = ['delete', 'hide', 'approve', 'flag'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: `Action must be one of: ${validActions.join(', ')}`
      });
    }

    const results = [];
    
    for (const commentId of comment_ids) {
      try {
        let result;
        
        switch (action) {
          case 'delete':
            result = await deleteCommentById(commentId);
            break;
            
          case 'hide':
            result = await updateCommentById(commentId, {
              is_hidden: true,
              hidden_by: requestingUser.id,
              hidden_at: new Date(),
              admin_notes: options.reason || 'Hidden by admin'
            });
            break;
            
          case 'approve':
            result = await updateCommentById(commentId, {
              is_approved: true,
              approved_by: requestingUser.id,
              approved_at: new Date()
            });
            break;
            
          case 'flag':
            result = await updateCommentById(commentId, {
              is_flagged: true,
              flagged_by: requestingUser.id,
              flagged_at: new Date(),
              flag_reason: options.flag_reason || 'Flagged by admin'
            });
            break;
        }
        
        results.push({
          comment_id: commentId,
          status: 'success',
          action,
          result
        });
        
      } catch (error) {
        results.push({
          comment_id: commentId,
          status: 'error',
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    res.status(200).json({
      success: true,
      message: `Bulk ${action} completed`,
      summary: {
        total: comment_ids.length,
        successful: successCount,
        failed: errorCount
      },
      results,
      performed_by: requestingUser.username || requestingUser.id
    });
    
  } catch (error) {
    console.error('Error in bulkCommentOperations:', error);
    res.status(500).json(formatErrorResponse(error, 'Failed to perform bulk operations'));
  }
};








// // ikootaapi/controllers/commentsControllers.js - Enhanced version
// import {
//   createCommentService,
//   uploadCommentService,
//   getCommentsByUserId,
//   getChatAndTeachingIdsFromComments,
//   getParentChatsAndTeachingsWithComments,
//   getCommentsByParentIds,
//   getAllComments,
//   getCommentStats,
//   getCommentById,
//   updateCommentById,
//   deleteCommentById
// } from "../services/commentServices.js";

// import { validateChatData } from '../utils/contentValidation.js';
// import { formatErrorResponse } from '../utils/errorHelpers.js';
// import { normalizeContentItem } from '../utils/contentHelpers.js';

// // ✅ FIXED: Enhanced createComment with proper user_id handling
// export const createComment = async (req, res) => {
//   try {
//     const { chat_id, teaching_id, comment } = req.body;
//     const requestingUser = req.user;

//     console.log('createComment req body:', req.body);
//     console.log('createComment req user:', requestingUser);

//     if ((!chat_id && !teaching_id) || !comment) {
//       return res.status(400).json({ 
//         success: false,
//         error: "Chat ID or Teaching ID, and Comment are required.",
//         message: "Please provide either a chat_id or teaching_id, and comment text"
//       });
//     }

//     if (!requestingUser?.user_id && !requestingUser?.id && !requestingUser?.converse_id) {
//       return res.status(401).json({ 
//         success: false,
//         error: "Authentication required",
//         message: "User authentication is required"
//       });
//     }

//     // Use converse_id (char(10)) for comments as per database schema
//     const user_id = requestingUser.converse_id || requestingUser.user_id || requestingUser.id;

//     // Validate user_id format for comments (char(10))
//     if (!user_id || (typeof user_id === 'string' && user_id.length !== 10)) {
//       return res.status(400).json({ 
//         success: false,
//         error: "Invalid user ID format",
//         message: "Comments require a valid 10-character converse_id"
//       });
//     }

//     // Process uploaded files
//     const files = req.uploadedFiles || [];
//     console.log("req.uploadedFiles:", req.uploadedFiles);
//     console.log("files:", files);
//     const media = files.map((file, index) => ({
//       url: file.url,
//       type: file.type || `media${index + 1}`,
//     }));

//     const newComment = await createCommentService({
//       user_id,
//       chat_id: chat_id || null,
//       teaching_id: teaching_id || null,
//       comment: comment.trim(),
//       media,
//     });

//     res.status(201).json({
//       success: true,
//       data: newComment,
//       message: "Comment created successfully."
//     });
//   } catch (error) {
//     console.error('createComment error:', error);
//     res.status(500).json({ 
//       success: false,
//       error: error.message,
//       message: 'Failed to create comment'
//     });
//   }
// };



// // Fixed uploadCommentFiles - backwards compatible
// export const uploadCommentFiles = async (req, res) => {
//   try {
//     const files = req.files;
//     const uploadedFiles = await uploadCommentService(files);

//     res.status(201).json({ 
//       uploadedFiles, 
//       message: "Files uploaded successfully.",
//       success: true
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       error: error.message 
//     });
//   }
// };

// // FIXED: Keep original structure that frontend expects
// export const fetchParentChatsAndTeachingsWithComments = async (req, res) => {
//   const { user_id } = req.query;
//   try {
//     console.log("Fetching comments for user:", user_id);
//     const comments = await getCommentsByUserId(user_id);
    
//     const { chatIds, teachingIds } = getChatAndTeachingIdsFromComments(comments);
    
//     const data = await getParentChatsAndTeachingsWithComments(chatIds, teachingIds);
//     const { chats, teachings } = data;

//     // Keep original response structure that frontend expects
//     res.status(200).json({
//       chats,
//       teachings,
//       comments, // Frontend expects this at root level
//       // Add enhanced info without breaking frontend
//       _meta: {
//         success: true,
//         count: {
//           chats: chats?.length || 0,
//           teachings: teachings?.length || 0,
//           comments: comments?.length || 0
//         }
//       }
//     });
//   } catch (error) {
//     console.log("fetchParentChatsAndTeachingsWithComments error:", error);
//     res.status(500).json({ 
//       success: false,
//       error: error.message 
//     });
//   }
// };

// // FIXED: Keep original structure that frontend expects
// export const fetchCommentsByParentIds = async (req, res) => {
//   const { chatIds, teachingIds } = req.query;
//   try {
//     const comments = await getCommentsByParentIds(chatIds, teachingIds);
    
//     // Keep original response structure
//     res.status(200).json(comments);
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       error: error.message 
//     });
//   }
// };

// // FIXED: Keep original structure that frontend expects
// export const fetchCommentsByUserId = async (req, res) => {
//   const { user_id } = req.params;
//   try {
//     const comments = await getCommentsByUserId(user_id);
    
//     // Keep original response structure
//     res.status(200).json(comments);
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       error: error.message 
//     });
//   }
// };

// // FIXED: Keep original structure that frontend expects
// export const fetchAllComments = async (req, res) => {
//   try {
//     const comments = await getAllComments();
    
//     // Keep original response structure
//     res.status(200).json(comments);
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: 'Error fetching comments', 
//       error: error.message 
//     });
//   }
// };

// // Enhanced fetchCommentStats - this is new so can use enhanced format
// export const fetchCommentStats = async (req, res) => {
//   try {
//     const requestingUser = req.user;

//     // Basic authorization check
//     if (!['admin', 'super_admin'].includes(requestingUser.role)) {
//       return res.status(403).json({
//         success: false,
//         error: 'Access denied',
//         message: 'Only administrators can view comment statistics'
//       });
//     }

//     const { user_id, startDate, endDate } = req.query;
//     const filters = { user_id, startDate, endDate };

//     const stats = await getCommentStats(filters);

//     res.status(200).json({
//       success: true,
//       data: stats,
//       filters
//     });

//   } catch (error) {
//     console.error('Error in fetchCommentStats:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       message: 'Failed to fetch comment statistics'
//     });
//   }
// };

// // Enhanced fetchCommentById - new endpoint can use enhanced format
// export const fetchCommentById = async (req, res) => {
//   try {
//     const { commentId } = req.params;
//     const requestingUser = req.user;

//     if (!commentId) {
//       return res.status(400).json({
//         success: false,
//         error: 'Comment ID required',
//         message: 'Please provide a valid comment ID'
//       });
//     }

//     const comment = await getCommentById(commentId);

//     // Basic authorization check - users can view their own comments
//     if (comment.user_id !== requestingUser.user_id && !['admin', 'super_admin'].includes(requestingUser.role)) {
//       return res.status(403).json({
//         success: false,
//         error: 'Access denied',
//         message: 'You can only view your own comments'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: comment
//     });

//   } catch (error) {
//     console.error('Error in fetchCommentById:', error);
    
//     const statusCode = error.statusCode || 500;
//     res.status(statusCode).json({
//       success: false,
//       error: error.message,
//       message: 'Failed to fetch comment'
//     });
//   }
// };

// // Enhanced updateComment - new endpoint can use enhanced format
// export const updateComment = async (req, res) => {
//   try {
//     const { commentId } = req.params;
//     const { comment } = req.body;
//     const requestingUser = req.user;

//     if (!commentId) {
//       return res.status(400).json({
//         success: false,
//         error: 'Comment ID required',
//         message: 'Please provide a valid comment ID'
//       });
//     }

//     // Get existing comment to check ownership
//     const existingComment = await getCommentById(commentId);

//     // Authorization check
//     if (existingComment.user_id !== requestingUser.user_id && !['admin', 'super_admin'].includes(requestingUser.role)) {
//       return res.status(403).json({
//         success: false,
//         error: 'Access denied',
//         message: 'You can only update your own comments'
//       });
//     }

//     if (!comment || comment.trim().length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'Comment text required',
//         message: 'Please provide comment text'
//       });
//     }

//     // Process uploaded files if any
//     const files = req.uploadedFiles || [];
//     const media = files.map((file, index) => ({
//       url: file.url,
//       type: file.type || `media${index + 1}`,
//     }));

//     const updateData = {
//       comment: comment.trim(),
//       media
//     };

//     const updatedComment = await updateCommentById(commentId, updateData);

//     res.status(200).json({
//       success: true,
//       data: updatedComment,
//       message: 'Comment updated successfully'
//     });

//   } catch (error) {
//     console.error('Error in updateComment:', error);
    
//     const statusCode = error.statusCode || 500;
//     res.status(statusCode).json({
//       success: false,
//       error: error.message,
//       message: 'Failed to update comment'
//     });
//   }
// };

// // Enhanced deleteComment - new endpoint can use enhanced format
// export const deleteComment = async (req, res) => {
//   try {
//     const { commentId } = req.params;
//     const requestingUser = req.user;

//     if (!commentId) {
//       return res.status(400).json({
//         success: false,
//         error: 'Comment ID required',
//         message: 'Please provide a valid comment ID'
//       });
//     }

//     // Get existing comment to check ownership
//     const existingComment = await getCommentById(commentId);

//     // Authorization check
//     if (existingComment.user_id !== requestingUser.user_id && !['admin', 'super_admin'].includes(requestingUser.role)) {
//       return res.status(403).json({
//         success: false,
//         error: 'Access denied',
//         message: 'You can only delete your own comments'
//       });
//     }

//     const result = await deleteCommentById(commentId);

//     res.status(200).json({
//       success: true,
//       data: result,
//       message: 'Comment deleted successfully'
//     });

//   } catch (error) {
//     console.error('Error in deleteComment:', error);
    
//     const statusCode = error.statusCode || 500;
//     res.status(statusCode).json({
//       success: false,
//       error: error.message,
//       message: 'Failed to delete comment'
//     });
//   }
// };