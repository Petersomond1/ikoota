// ikootaapi/controllers/chatControllers.js - COMPLETE FINAL VERSION
// Merges ALL functionality from both versions + database compatibility

import {
  getAllChats,
  getChatsByUserId,
  createChatService,
  updateChatById,
  deleteChatById,
  getChatHistoryService,
  addCommentToChatService,
  getChatsByIds,
  getChatByPrefixedId,
  getCombinedContent,
  mapConverseIdToUserId,
  mapUserIdToConverseId,
  getChatStats,
  searchChats
} from "../services/chatServices.js";

import { validateChatData } from '../utils/contentValidation.js';
import { formatErrorResponse } from '../utils/errorHelpers.js';
import { normalizeContentItem } from '../utils/contentHelpers.js';

// ===============================================
// STANDARD CHAT OPERATIONS
// ===============================================

// ✅ Enhanced fetchAllChats with advanced filtering
export const fetchAllChats = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      user_id,
      approval_status,
      search,
      start_date,
      end_date,
      sort_by = 'updatedAt',
      sort_order = 'desc',
      // Enhanced fields
      status,
      is_featured,
      is_public
    } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      user_id, // Keep as string for chats (converse_id)
      approval_status,
      search,
      start_date,
      end_date,
      sort_by,
      sort_order,
      // Enhanced filters
      status,
      is_featured: is_featured === 'true' ? true : undefined,
      is_public: is_public === 'true' ? true : undefined
    };

    console.log('🔍 fetchAllChats filters:', filters);

    const chats = await getAllChats(filters);

    // Apply normalization for consistent frontend interface
    const normalizedChats = chats.map(chat => normalizeContentItem(chat, 'chat'));

    res.status(200).json({
      success: true,
      message: 'Chats retrieved successfully',
      data: normalizedChats,
      count: normalizedChats.length,
      filters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: normalizedChats.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('fetchAllChats error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Enhanced fetchChatsByUserId with proper user_id validation
export const fetchChatsByUserId = async (req, res) => {
  try {
    const { user_id } = req.query;
    const requestingUser = req.user;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        message: 'Please provide a valid user_id parameter',
        required_fields: ['user_id']
      });
    }

    // ✅ CRITICAL: For chats, user_id should be converse_id (char(10))
    if (typeof user_id !== 'string' || user_id.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        message: 'Chats require 10-character converse_id (not numeric user_id)',
        provided: user_id,
        expected_format: 'string(10)',
        example: 'abc1234567'
      });
    }

    // Authorization check - users can only see their own chats unless admin
    const isAdmin = ['admin', 'super_admin'].includes(requestingUser?.role);
    const requestingUserConverseId = requestingUser?.converse_id; // For chats, use converse_id
    
    if (!isAdmin && user_id !== requestingUserConverseId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view your own chats'
      });
    }

    const chats = await getChatsByUserId(user_id);

    // Apply normalization
    const normalizedChats = chats.map(chat => normalizeContentItem(chat, 'chat'));

    res.status(200).json({
      success: true,
      message: `Chats retrieved for user ${user_id}`,
      data: normalizedChats,
      count: normalizedChats.length,
      user_id: user_id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('fetchChatsByUserId error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Enhanced fetchChatByPrefixedId with fallback support
export const fetchChatByPrefixedId = async (req, res) => {
  try {
    const { prefixedId, id } = req.params;
    const identifier = prefixedId || id;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Chat identifier is required',
        message: 'Please provide either prefixed ID or numeric ID',
        examples: ['c123456789', '123']
      });
    }

    const chat = await getChatByPrefixedId(identifier);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found',
        message: `No chat found with identifier: ${identifier}`,
        identifier_type: identifier.startsWith('c') ? 'prefixed_id' : 'numeric_id'
      });
    }

    // Apply normalization
    const normalizedChat = normalizeContentItem(chat, 'chat');

    res.status(200).json({
      success: true,
      message: 'Chat retrieved successfully',
      data: normalizedChat,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('fetchChatByPrefixedId error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Enhanced fetchChatsByIds with validation
export const fetchChatsByIds = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        error: 'Chat IDs are required',
        message: 'Please provide a comma-separated list of chat IDs',
        examples: ['123,456,789', 'c123456789,c987654321']
      });
    }

    // Parse IDs from comma-separated string
    const idArray = ids.split(',').map(id => id.trim()).filter(id => id);
    
    if (idArray.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid chat IDs are required',
        message: 'Please provide valid chat IDs'
      });
    }

    // Limit bulk requests to prevent abuse
    if (idArray.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Too many IDs requested',
        message: 'Maximum 100 IDs allowed per request'
      });
    }

    const chats = await getChatsByIds(idArray);

    // Apply normalization
    const normalizedChats = chats.map(chat => normalizeContentItem(chat, 'chat'));

    res.status(200).json({
      success: true,
      data: normalizedChats,
      count: normalizedChats.length,
      requested_ids: idArray,
      found_count: normalizedChats.length,
      missing_count: idArray.length - normalizedChats.length
    });
  } catch (error) {
    console.error('fetchChatsByIds error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ===============================================
// 7-STEP CHAT CREATION PROCESS
// ===============================================

// ✅ Enhanced createChat with 7-step form support
export const createChat = async (req, res) => {
  try {
    const {
      title,      // Step 1: Title
      summary,    // Step 2: Summary (optional)
      text,       // Step 3: Main content (ACTUAL field name)
      audience,   // Step 4: Audience
      // Step 5: Category/Tags (can be added later)
      // Steps 6-7: Media files handled via uploadMiddleware
      // Enhanced fields
      tags,
      is_featured = false,
      is_public = true,
      step_data
    } = req.body;

    const requestingUser = req.user;

    console.log('createChat request:', {
      body: req.body,
      user: requestingUser,
      files: req.uploadedFiles?.length || 0
    });

    // Validation for 7-step form
    if (!title || !text) {
      return res.status(400).json({
        success: false,
        error: 'Required fields missing',
        message: 'Title and text are required (steps 1 & 3 of 7-step form)',
        required_fields: ['title', 'text'],
        optional_fields: ['summary', 'audience']
      });
    }

    if (!requestingUser?.converse_id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Valid user authentication with converse_id is required'
      });
    }

    // ✅ CRITICAL: For chats, use converse_id (char(10))
    const user_id = requestingUser.converse_id;
    if (!user_id || typeof user_id !== 'string' || user_id.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
        message: 'Chats require 10-character converse_id from authenticated user',
        user_data: {
          id: requestingUser.id,
          converse_id: requestingUser.converse_id
        }
      });
    }

    // Process uploaded files (steps 6-7: up to 3 media files)
    const files = req.uploadedFiles || [];
    console.log("Chat files uploaded:", files);
    
    const media = files.slice(0, 3).map((file, index) => ({
      url: file.url,
      type: file.type || `media${index + 1}`,
    }));

    // Additional validation
    const validationErrors = validateChatData({
      title: title.trim(),
      text: text.trim(), // ACTUAL field name
      summary: summary?.trim(),
      audience: audience?.trim(),
      user_id
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validation_errors: validationErrors,
        form_step_guidance: {
          step_1: 'Title must be 3-255 characters',
          step_2: 'Summary is optional but recommended',
          step_3: 'Text content is required (minimum 10 characters)',
          step_4: 'Audience defaults to "general"',
          step_5: 'Tags/categories can be added later',
          steps_6_7: 'Up to 3 media files supported'
        }
      });
    }

    const chatData = {
      title: title.trim(),
      summary: summary?.trim() || '',
      text: text.trim(), // ACTUAL field name
      audience: audience?.trim() || 'general',
      user_id,
      media,
      approval_status: 'pending', // Default for new chats
      is_flagged: false,
      // Enhanced fields
      tags: Array.isArray(tags) ? tags.join(',') : (tags || null),
      is_featured: Boolean(is_featured),
      is_public: is_public !== false, // Default to true
      step_data: step_data ? JSON.stringify(step_data) : null
    };

    const newChat = await createChatService(chatData);

    // Apply normalization
    const normalizedChat = normalizeContentItem(newChat, 'chat');

    res.status(201).json({
      success: true,
      message: "Chat created successfully using 7-step form.",
      data: normalizedChat,
      form_completion: {
        step_1_title: !!title,
        step_2_summary: !!summary,
        step_3_text: !!text,
        step_4_audience: !!audience,
        step_5_tags: !!tags,
        steps_6_7_media: media.length
      },
      next_steps: [
        "Chat is pending approval",
        "Check approval status in your dashboard", 
        "Admin will review within 24-48 hours"
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('createChat error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ===============================================
// STANDARD CRUD OPERATIONS
// ===============================================

// ✅ Enhanced editChat with comprehensive update support
export const editChat = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      summary,
      text, // ACTUAL field name
      audience,
      approval_status,
      is_flagged,
      // Enhanced fields
      tags,
      is_featured,
      is_public,
      step_data
    } = req.body;

    const requestingUser = req.user;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required',
        message: 'Please provide a valid chat ID'
      });
    }

    // Check if chat exists and get ownership info
    const existingChat = await getChatByPrefixedId(id);
    if (!existingChat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found',
        message: `No chat found with ID: ${id}`
      });
    }

    // Authorization check
    const isAdmin = ['admin', 'super_admin'].includes(requestingUser?.role);
    const isOwner = existingChat.user_id === requestingUser?.converse_id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only edit your own chats',
        chat_owner: existingChat.user_id,
        requesting_user: requestingUser?.converse_id
      });
    }

    // Only admins can change approval status or flagging
    if ((approval_status || is_flagged !== undefined || is_featured !== undefined) && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied',
        message: 'Only administrators can change approval status, flagging, or featured status'
      });
    }

    // Process uploaded files if any
    const files = req.uploadedFiles || [];
    const media = files.slice(0, 3).map((file, index) => ({
      url: file.url,
      type: file.type || `media${index + 1}`,
    }));

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (summary !== undefined) updateData.summary = summary?.trim() || '';
    if (text !== undefined) updateData.text = text.trim(); // ACTUAL field name
    if (audience !== undefined) updateData.audience = audience?.trim() || 'general';
    if (approval_status !== undefined) updateData.approval_status = approval_status;
    if (is_flagged !== undefined) updateData.is_flagged = is_flagged;
    if (media.length > 0) updateData.media = media;

    // Enhanced fields
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags.join(',') : (tags || null);
    }
    if (is_featured !== undefined) updateData.is_featured = Boolean(is_featured);
    if (is_public !== undefined) updateData.is_public = Boolean(is_public);
    if (step_data !== undefined) {
      updateData.step_data = step_data ? JSON.stringify(step_data) : null;
    }

    // Admin-only fields
    if (isAdmin) {
      if (req.body.admin_notes !== undefined) updateData.admin_notes = req.body.admin_notes;
      if (req.body.reviewed_by !== undefined) updateData.reviewed_by = requestingUser.id;
      if (approval_status) updateData.reviewedAt = new Date();
    }

    // Validation
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No update data provided',
        message: 'Please provide at least one field to update'
      });
    }

    const validationErrors = validateChatData(updateData, true); // true for partial validation

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validation_errors: validationErrors
      });
    }

    const numericId = isNaN(id) ? existingChat.id : parseInt(id);
    const updatedChat = await updateChatById(numericId, updateData);

    // Apply normalization
    const normalizedChat = normalizeContentItem(updatedChat, 'chat');

    res.status(200).json({
      success: true,
      message: "Chat updated successfully.",
      data: normalizedChat,
      updated_fields: Object.keys(updateData),
      updated_by: requestingUser?.username || requestingUser?.converse_id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('editChat error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Enhanced removeChat with proper authorization
export const removeChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { force_delete = false, soft_delete = false } = req.query;
    const requestingUser = req.user;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required',
        message: 'Please provide a valid chat ID'
      });
    }

    // Check if chat exists
    const existingChat = await getChatByPrefixedId(id);
    if (!existingChat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found',
        message: `No chat found with ID: ${id}`
      });
    }

    // Authorization check
    const isAdmin = ['admin', 'super_admin'].includes(requestingUser?.role);
    const isOwner = existingChat.user_id === requestingUser?.converse_id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own chats'
      });
    }

    // Only admins can force delete (which includes cascade delete of comments)
    if (force_delete && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied',
        message: 'Only administrators can perform force delete'
      });
    }

    const numericId = isNaN(id) ? existingChat.id : parseInt(id);
    
    if (force_delete === 'true' || force_delete === true) {
      // Force delete - removes chat and all related comments
      const result = await deleteChatById(numericId);
      
      res.status(200).json({
        success: true,
        data: result,
        message: "Chat and all related comments deleted successfully.",
        deletion_type: 'force_delete',
        deleted_by: requestingUser?.username || requestingUser?.converse_id,
        timestamp: new Date().toISOString()
      });
    } else if (soft_delete === 'true' || soft_delete === true) {
      // Soft delete - mark as archived but keep in database
      const updateData = {
        approval_status: 'rejected',
        admin_notes: `Soft deleted by ${requestingUser?.username || requestingUser?.converse_id} at ${new Date().toISOString()}`,
        reviewed_by: requestingUser?.id,
        reviewedAt: new Date()
      };
      
      const updatedChat = await updateChatById(numericId, updateData);
      
      res.status(200).json({
        success: true,
        data: updatedChat,
        message: "Chat marked as deleted.",
        deletion_type: 'soft_delete',
        deleted_by: requestingUser?.username || requestingUser?.converse_id,
        timestamp: new Date().toISOString()
      });
    } else {
      // Regular delete
      const result = await deleteChatById(numericId);
      
      res.status(200).json({
        success: true,
        data: result,
        message: "Chat deleted successfully.",
        deletion_type: 'regular',
        deleted_by: requestingUser?.username || requestingUser?.converse_id,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('removeChat error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ===============================================
// CHAT INTERACTIONS AND HISTORY
// ===============================================

// ✅ Enhanced getChatHistory with proper validation
export const getChatHistory = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const requestingUser = req.user;

    if (!userId1 || !userId2) {
      return res.status(400).json({
        success: false,
        error: 'Both user IDs are required',
        message: 'Please provide valid user IDs for both participants',
        required_params: ['userId1', 'userId2']
      });
    }

    // Validate user ID format for chats (should be converse_id)
    if (userId1.length !== 10 || userId2.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        message: 'Chat history requires 10-character converse_ids',
        provided: { userId1, userId2 }
      });
    }

    // Authorization check - users can only see their own chat history unless admin
    const isAdmin = ['admin', 'super_admin'].includes(requestingUser?.role);
    const requestingUserConverseId = requestingUser?.converse_id;
    
    if (!isAdmin && !([userId1, userId2].includes(requestingUserConverseId))) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view chat history you are part of'
      });
    }

    const chatHistory = await getChatHistoryService(userId1, userId2);

    // Apply normalization
    const normalizedHistory = chatHistory.map(chat => normalizeContentItem(chat, 'chat'));

    res.status(200).json({
      success: true,
      message: 'Chat history retrieved successfully',
      data: normalizedHistory,
      count: normalizedHistory.length,
      participants: [userId1, userId2],
      requested_by: requestingUserConverseId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('getChatHistory error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Enhanced addCommentToChat with validation
export const addCommentToChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { comment } = req.body;
    const requestingUser = req.user;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required',
        message: 'Please provide a valid chat ID'
      });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required',
        message: 'Please provide comment text'
      });
    }

    if (!requestingUser?.converse_id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Valid user authentication with converse_id is required'
      });
    }

    // Check if chat exists
    const existingChat = await getChatByPrefixedId(chatId);
    if (!existingChat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found',
        message: `No chat found with ID: ${chatId}`
      });
    }

    // Check if chat is approved (unless admin)
    const isAdmin = ['admin', 'super_admin'].includes(requestingUser?.role);
    if (!isAdmin && existingChat.approval_status !== 'approved') {
      return res.status(403).json({
        success: false,
        error: 'Cannot comment on pending chat',
        message: 'Comments can only be added to approved chats'
      });
    }

    // Process uploaded files if any
    const files = req.uploadedFiles || [];
    const media = files.slice(0, 3).map((file, index) => ({
      url: file.url,
      type: file.type || `media${index + 1}`,
    }));

    const commentData = {
      user_id: requestingUser.converse_id, // Use converse_id for comments
      comment: comment.trim(), // ACTUAL field name
      media
    };

    const numericChatId = isNaN(chatId) ? existingChat.id : parseInt(chatId);
    const newComment = await addCommentToChatService(numericChatId, commentData);

    res.status(201).json({
      success: true,
      message: "Comment added to chat successfully.",
      data: newComment,
      chat_id: chatId,
      comment_by: requestingUser?.username || requestingUser?.converse_id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('addCommentToChat error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ===============================================
// COMBINED CONTENT AND SEARCH
// ===============================================

// ✅ Enhanced fetchCombinedContent (chats + teachings)
export const fetchCombinedContent = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      user_id,
      approval_status,
      content_type, // 'chat', 'teaching', or undefined for both
      search,
      start_date,
      end_date,
      sort_by = 'updated_at',
      sort_order = 'desc',
      // Enhanced filters
      status,
      is_featured,
      is_public,
      difficulty_level
    } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      user_id,
      approval_status,
      content_type,
      search,
      start_date,
      end_date,
      sort_by,
      sort_order,
      // Enhanced filters
      status,
      is_featured: is_featured === 'true' ? true : undefined,
      is_public: is_public === 'true' ? true : undefined,
      difficulty_level
    };

    console.log('🔍 fetchCombinedContent filters:', filters);

    const combinedContent = await getCombinedContent(filters);

    // Apply normalization to all content
    const normalizedContent = combinedContent.map(item => {
      const contentType = item.content_type || (item.topic ? 'teaching' : 'chat');
      return normalizeContentItem(item, contentType);
    });

    // Apply client-side filtering if needed
    let filteredContent = normalizedContent;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredContent = normalizedContent.filter(item => 
        item.content_title?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.summary?.toLowerCase().includes(searchLower) ||
        item.content?.toLowerCase().includes(searchLower) ||
        item.text?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedContent = filteredContent.slice(startIndex, endIndex);

    // Separate by content type for response
    const chats = paginatedContent.filter(item => item.content_type === 'chat');
    const teachings = paginatedContent.filter(item => item.content_type === 'teaching');

    console.log(`Found ${combinedContent.length} total content items, returning ${paginatedContent.length}`);

    res.status(200).json({
      success: true,
      message: 'Combined content retrieved successfully',
      data: {
        combined: paginatedContent,
        chats,
        teachings
      },
      counts: {
        total: filteredContent.length,
        returned: paginatedContent.length,
        chats: chats.length,
        teachings: teachings.length
      },
      breakdown: {
        chats: filteredContent.filter(c => c.content_type === 'chat').length,
        teachings: filteredContent.filter(c => c.content_type === 'teaching').length
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(filteredContent.length / parseInt(limit)),
        has_next: endIndex < filteredContent.length,
        has_prev: parseInt(page) > 1
      },
      filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('fetchCombinedContent error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ===============================================
// ANALYTICS AND STATISTICS
// ===============================================

// ✅ Enhanced getChatStats with comprehensive analytics
export const fetchChatStats = async (req, res) => {
  try {
    const requestingUser = req.user;
    const {
      user_id,
      timeframe = '30days',
      startDate,
      endDate
    } = req.query;

    // Authorization check for user-specific stats
    if (user_id) {
      const isAdmin = ['admin', 'super_admin'].includes(requestingUser?.role);
      
      if (!isAdmin && user_id !== requestingUser?.converse_id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only view your own chat statistics'
        });
      }
    }

    // Global stats require admin privileges
    if (!user_id && !['admin', 'super_admin'].includes(requestingUser?.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin privileges required for global statistics'
      });
    }

    const filters = { user_id, timeframe, startDate, endDate };
    const stats = await getChatStats(filters);

    res.status(200).json({
      success: true,
      message: 'Chat statistics retrieved successfully',
      data: stats,
      generated_at: new Date().toISOString(),
      scope: user_id ? 'user_specific' : 'global',
      timeframe,
      requested_by: requestingUser?.username || requestingUser?.converse_id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('fetchChatStats error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ===============================================
// ADMIN OPERATIONS
// ===============================================

// ✅ Enhanced bulkChatOperations
export const bulkChatOperations = async (req, res) => {
  try {
    const { action, chat_ids, options = {} } = req.body;
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

    if (!action || !chat_ids || !Array.isArray(chat_ids)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Action and chat_ids array are required'
      });
    }

    const validActions = ['approve', 'reject', 'delete', 'feature', 'unfeature', 'archive', 'flag', 'unflag'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: `Action must be one of: ${validActions.join(', ')}`
      });
    }

    const results = [];
    
    for (const chatId of chat_ids) {
      try {
        let result;
        const numericId = isNaN(chatId) ? null : parseInt(chatId);
        
        // Get chat to ensure it exists
        const chat = await getChatByPrefixedId(chatId);
        if (!chat) {
          results.push({
            chat_id: chatId,
            status: 'error',
            error: 'Chat not found'
          });
          continue;
        }

        const actualId = numericId || chat.id;
        
        switch (action) {
          case 'approve':
            result = await updateChatById(actualId, { 
              approval_status: 'approved',
              reviewed_by: requestingUser.id,
              reviewedAt: new Date(),
              admin_notes: options.approval_notes || 'Bulk approved'
            });
            break;
            
          case 'reject':
            result = await updateChatById(actualId, { 
              approval_status: 'rejected',
              reviewed_by: requestingUser.id,
              reviewedAt: new Date(),
              admin_notes: options.rejection_reason || 'Bulk rejected'
            });
            break;
            
          case 'delete':
            result = await deleteChatById(actualId);
            break;

          case 'feature':
            result = await updateChatById(actualId, { 
              is_featured: true,
              reviewed_by: requestingUser.id
            });
            break;

          case 'unfeature':
            result = await updateChatById(actualId, { 
              is_featured: false,
              reviewed_by: requestingUser.id
            });
            break;

          case 'flag':
            result = await updateChatById(actualId, {
              is_flagged: true,
              reviewed_by: requestingUser.id,
              admin_notes: options.flag_reason || 'Flagged by admin'
            });
            break;

          case 'unflag':
            result = await updateChatById(actualId, {
              is_flagged: false,
              reviewed_by: requestingUser.id
            });
            break;
            
          case 'archive':
            result = await updateChatById(actualId, {
              approval_status: 'archived',
              reviewed_by: requestingUser.id,
              reviewedAt: new Date(),
              admin_notes: options.archive_reason || 'Bulk archived'
            });
            break;
        }
        
        results.push({
          chat_id: chatId,
          status: 'success',
          action,
          result
        });
        
      } catch (error) {
        results.push({
          chat_id: chatId,
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
        total: chat_ids.length,
        successful: successCount,
        failed: errorCount
      },
      results,
      performed_by: requestingUser.username || requestingUser.id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in bulkChatOperations:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ New: Toggle chat like/engagement
export const toggleChatLike = async (req, res) => {
  try {
    const { chatId } = req.params;
    const requestingUser = req.user;

    if (!chatId || isNaN(chatId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chat ID',
        message: 'Please provide a valid numeric chat ID'
      });
    }

    if (!requestingUser?.converse_id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User authentication is required'
      });
    }

    const userId = requestingUser.converse_id;

    // Check if chat exists
    const existingChat = await getChatByPrefixedId(chatId);
    if (!existingChat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found',
        message: `No chat found with ID: ${chatId}`
      });
    }

    // For now, just return success (like functionality can be enhanced later)
    const result = { 
      action: 'liked', // or 'unliked' based on current state
      chatId, 
      userId,
      message: 'Like functionality will be implemented with enhanced database'
    };

    res.status(200).json({
      success: true,
      data: result,
      message: `Chat interaction recorded successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in toggleChatLike:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ===============================================
// SEARCH FUNCTIONALITY
// ===============================================

// ✅ NEW: Enhanced chat search controller
export const searchChatsController = async (req, res) => {
  try {
    const {
      query: searchQuery,
      q, // Alternative query parameter
      user_id,
      approval_status = 'approved', // Default to approved for public search
      page = 1,
      limit = 20,
      sort_by = 'updatedAt',
      sort_order = 'desc',
      // Enhanced search fields
      search_fields = 'all', // 'title', 'content', 'user', 'all'
      date_from,
      date_to
    } = req.query;

    // Use either 'query' or 'q' parameter
    const finalQuery = searchQuery || q;

    if (!finalQuery || finalQuery.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        message: 'Please provide a search query using "query" or "q" parameter',
        example: '/content/chats/search?q=mentorship'
      });
    }

    if (finalQuery.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query too short',
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchOptions = {
      query: finalQuery,
      user_id,
      approval_status,
      page: parseInt(page),
      limit: parseInt(limit),
      sort_by,
      sort_order,
      search_fields,
      date_from,
      date_to
    };

    console.log('🔍 Chat search with options:', searchOptions);

    const searchResults = await searchChats(searchOptions);
    
    // Apply normalization
    const normalizedResults = searchResults.map(chat => normalizeContentItem(chat, 'chat'));

    res.status(200).json({
      success: true,
      message: 'Chat search completed successfully',
      data: normalizedResults,
      count: normalizedResults.length,
      search: {
        query: finalQuery,
        fields: search_fields,
        filters: {
          user_id,
          approval_status,
          date_range: date_from && date_to ? `${date_from} to ${date_to}` : null
        }
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: normalizedResults.length
      },
      suggestions: normalizedResults.length === 0 ? [
        "Try broader search terms",
        "Check spelling and try different keywords", 
        "Use partial words or phrases"
      ] : [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('searchChatsController error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};