// ikootaapi/controllers/commentControllers.js
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
} from "../services/old.commentServices.js";
import dotenv from 'dotenv';

dotenv.config();

// Fixed createComment - enhanced response but backwards compatible
export const createComment = async (req, res) => {
  try {
    const { chat_id, teaching_id, comment } = req.body;
    const { user_id } = req.user;

    console.log('createcomment req body:', req.body);
    console.log('createcomment req user:', req.user);

    if ((!chat_id && !teaching_id) || !comment || !user_id) {
      return res.status(400).json({ 
        success: false,
        error: "User ID, Chat ID or Teaching ID, and Comment are required." 
      });
    }

    // Process uploaded files
    const files = req.uploadedFiles || [];
    console.log("req.uploadedFiles:", req.uploadedFiles);
    console.log("files:", files);
    const media = files.map((file, index) => ({
      url: file.url,
      type: file.type || `media${index + 1}`,
    }));

    const newComment = await createCommentService({
      user_id,
      chat_id: chat_id || null,
      teaching_id: teaching_id || null,
      comment,
      media,
    });

    // Keep backwards compatibility
    res.status(201).json({
      id: newComment.id,
      message: "Comment created successfully.",
      success: true
    });
  } catch (error) {
    console.log('createComment error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Fixed uploadCommentFiles - backwards compatible
export const uploadCommentFiles = async (req, res) => {
  try {
    const files = req.files;
    const uploadedFiles = await uploadCommentService(files);

    res.status(201).json({ 
      uploadedFiles, 
      message: "Files uploaded successfully.",
      success: true
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// FIXED: Keep original structure that frontend expects
export const fetchParentChatsAndTeachingsWithComments = async (req, res) => {
  const { user_id } = req.query;
  try {
    console.log("Fetching comments for user:", user_id);
    const comments = await getCommentsByUserId(user_id);
    
    const { chatIds, teachingIds } = getChatAndTeachingIdsFromComments(comments);
    
    const data = await getParentChatsAndTeachingsWithComments(chatIds, teachingIds);
    const { chats, teachings } = data;

    // Keep original response structure that frontend expects
    res.status(200).json({
      chats,
      teachings,
      comments, // Frontend expects this at root level
      // Add enhanced info without breaking frontend
      _meta: {
        success: true,
        count: {
          chats: chats?.length || 0,
          teachings: teachings?.length || 0,
          comments: comments?.length || 0
        }
      }
    });
  } catch (error) {
    console.log("fetchParentChatsAndTeachingsWithComments error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// FIXED: Keep original structure that frontend expects
export const fetchCommentsByParentIds = async (req, res) => {
  const { chatIds, teachingIds } = req.query;
  try {
    const comments = await getCommentsByParentIds(chatIds, teachingIds);
    
    // Keep original response structure
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// FIXED: Keep original structure that frontend expects
export const fetchCommentsByUserId = async (req, res) => {
  const { user_id } = req.params;
  try {
    const comments = await getCommentsByUserId(user_id);
    
    // Keep original response structure
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// FIXED: Keep original structure that frontend expects
export const fetchAllComments = async (req, res) => {
  try {
    const comments = await getAllComments();
    
    // Keep original response structure
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching comments', 
      error: error.message 
    });
  }
};

// Enhanced fetchCommentStats - this is new so can use enhanced format
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

    const { user_id, startDate, endDate } = req.query;
    const filters = { user_id, startDate, endDate };

    const stats = await getCommentStats(filters);

    res.status(200).json({
      success: true,
      data: stats,
      filters
    });

  } catch (error) {
    console.error('Error in fetchCommentStats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch comment statistics'
    });
  }
};

// Enhanced fetchCommentById - new endpoint can use enhanced format
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

    // Basic authorization check - users can view their own comments
    if (comment.user_id !== requestingUser.user_id && !['admin', 'super_admin'].includes(requestingUser.role)) {
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
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch comment'
    });
  }
};

// Enhanced updateComment - new endpoint can use enhanced format
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

    // Authorization check
    if (existingComment.user_id !== requestingUser.user_id && !['admin', 'super_admin'].includes(requestingUser.role)) {
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
    const media = files.map((file, index) => ({
      url: file.url,
      type: file.type || `media${index + 1}`,
    }));

    const updateData = {
      comment: comment.trim(),
      media
    };

    const updatedComment = await updateCommentById(commentId, updateData);

    res.status(200).json({
      success: true,
      data: updatedComment,
      message: 'Comment updated successfully'
    });

  } catch (error) {
    console.error('Error in updateComment:', error);
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      message: 'Failed to update comment'
    });
  }
};

// Enhanced deleteComment - new endpoint can use enhanced format
export const deleteComment = async (req, res) => {
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

    // Get existing comment to check ownership
    const existingComment = await getCommentById(commentId);

    // Authorization check
    if (existingComment.user_id !== requestingUser.user_id && !['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own comments'
      });
    }

    const result = await deleteCommentById(commentId);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteComment:', error);
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      message: 'Failed to delete comment'
    });
  }
};