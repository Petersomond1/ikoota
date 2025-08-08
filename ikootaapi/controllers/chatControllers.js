// ikootaapi/controllers/chatsControllers.js
import {
  getAllChats,
  getChatsByUserId,
  createChatService,
  getChatHistoryService,
  updateChatById,
  deleteChatById,
  addCommentToChatService,
  getChatsByIds,
  getChatByPrefixedId,
  getCombinedContent,
} from '../services/chatServices.js';

import { validateChatData } from '../utils/contentValidation.js';
import { formatErrorResponse } from '../utils/errorHelpers.js';
import { normalizeContentItem } from '../utils/contentHelpers.js';

// ✅ FIXED: Enhanced fetchAllChats with consistent response format
export const fetchAllChats = async (req, res) => {
  try {
    const { page = 1, limit = 50, user_id, approval_status } = req.query;
    
    // Build filters object
    const filters = {};
    if (user_id) filters.user_id = user_id;
    if (approval_status) filters.approval_status = approval_status;
    
    const chats = await getAllChats(filters);
    
    res.status(200).json({
      success: true,
      data: chats,
      count: chats.length,
      filters
    });
  } catch (error) {
    console.error('Error in fetchAllChats:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch chats'
    });
  }
};

// ✅ FIXED: Enhanced fetchChatsByUserId with validation
export const fetchChatsByUserId = async (req, res) => {
  try {
    const { user_id } = req.query;
    const requestingUserId = req.user?.user_id || req.user?.id;

    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required',
        message: 'Please provide a valid user ID'
      });
    }

    const chats = await getChatsByUserId(user_id);
    
    res.status(200).json({
      success: true,
      data: chats,
      count: chats.length,
      user_id
    });
  } catch (error) {
    console.error('Error in fetchChatsByUserId:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch user chats'
    });
  }
};

// ✅ FIXED: Enhanced fetchChatByPrefixedId
export const fetchChatByPrefixedId = async (req, res) => {
  try {
    const { prefixedId } = req.params;
    
    if (!prefixedId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chat identifier is required',
        message: 'Please provide a valid chat ID or prefixed ID'
      });
    }

    const chat = await getChatByPrefixedId(prefixedId);
    
    if (!chat) {
      return res.status(404).json({ 
        success: false, 
        error: 'Chat not found',
        message: `No chat found with identifier: ${prefixedId}`
      });
    }
    
    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Error in fetchChatByPrefixedId:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch chat'
    });
  }
};

// ✅ FIXED: Enhanced fetchChatsByIds with better validation
export const fetchChatsByIds = async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ 
        success: false, 
        error: 'IDs parameter is required',
        message: 'Please provide comma-separated chat IDs'
      });
    }

    const idArray = ids.split(',').map(id => id.trim()).filter(Boolean);
    
    if (idArray.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid IDs are required',
        message: 'Please provide at least one valid chat ID'
      });
    }

    const chats = await getChatsByIds(idArray);
    
    res.status(200).json({
      success: true,
      data: chats,
      count: chats.length,
      requested_ids: idArray
    });
  } catch (error) {
    console.error('Error in fetchChatsByIds:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch chats by IDs'
    });
  }
};

// ✅ FIXED: Enhanced createChat with comprehensive validation
export const createChat = async (req, res) => {
  try {
    const { title, audience, summary, text, is_flagged } = req.body;
    const requestingUser = req.user;

    // Enhanced validation
    if (!title || !text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields',
        message: 'Title and text content are required'
      });
    }

    if (!requestingUser?.user_id && !requestingUser?.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required',
        message: 'User authentication is required'
      });
    }

    // Use converse_id (char(10)) for chats as per database schema
    const user_id = requestingUser.converse_id || requestingUser.user_id || requestingUser.id;

    const files = req.uploadedFiles || [];
    const media = files.map((file) => ({
      url: file.url,
      type: file.type,
    }));

    const newChat = await createChatService({
      title: title.trim(),
      user_id, // char(10) converse_id
      audience: audience?.trim(),
      summary: summary?.trim(),
      text: text.trim(),
      is_flagged: Boolean(is_flagged),
      media,
    });

    res.status(201).json({ 
      success: true,
      data: newChat,
      message: "Chat created successfully" 
    });
  } catch (error) {
    console.error('Error in createChat:', error);
    
    if (error.message.includes('required')) {
      return res.status(400).json({ 
        success: false, 
        error: error.message,
        message: 'Validation failed'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to create chat'
    });
  }
};

// ✅ FIXED: Enhanced getChatHistory
export const getChatHistory = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    
    if (!userId1 || !userId2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both user IDs are required',
        message: 'Please provide valid user IDs for chat history'
      });
    }

    const chatHistory = await getChatHistoryService(userId1, userId2);
    
    res.status(200).json({
      success: true,
      data: chatHistory,
      participants: [userId1, userId2]
    });
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch chat history'
    });
  }
};

// ✅ FIXED: Enhanced editChat
export const editChat = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid chat ID',
        message: 'Please provide a valid numeric chat ID'
      });
    }

    const files = req.uploadedFiles || [];
    const media = files.map((file) => ({
      url: file.url,
      type: file.type,
    }));

    const data = {
      ...req.body,
      media,
    };

    const updatedChat = await updateChatById(parseInt(id), data);
    
    res.status(200).json({
      success: true,
      data: updatedChat,
      message: 'Chat updated successfully'
    });
  } catch (error) {
    console.error('Error in editChat:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to update chat'
    });
  }
};

// ✅ FIXED: Enhanced removeChat
export const removeChat = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid chat ID',
        message: 'Please provide a valid numeric chat ID'
      });
    }

    const result = await deleteChatById(parseInt(id));
    
    res.status(200).json({ 
      success: true, 
      message: 'Chat deleted successfully',
      deleted_id: result.prefixed_id
    });
  } catch (error) {
    console.error('Error in removeChat:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to delete chat'
    });
  }
};

// ✅ ENHANCED: addCommentToChat
export const addCommentToChat = async (req, res) => {
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

    if (!requestingUser?.user_id && !requestingUser?.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required',
        message: 'User authentication is required'
      });
    }

    const commentData = {
      ...req.body,
      user_id: requestingUser.converse_id || requestingUser.user_id || requestingUser.id,
      chat_id: parseInt(chatId)
    };

    const comment = await addCommentToChatService(parseInt(chatId), commentData);
    
    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error in addCommentToChat:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to add comment'
    });
  }
};

// ✅ ENHANCED: fetchCombinedContent with better error handling
export const fetchCombinedContent = async (req, res) => {
  try {
    console.log('Fetching combined content...');
    
    const { page = 1, limit = 50, user_id, approval_status } = req.query;
    
    const filters = { page, limit, user_id, approval_status };
    const content = await getCombinedContent(filters);
    
    console.log(`Found ${content.length} total content items`);
    
    res.status(200).json({
      success: true,
      data: content,
      count: content.length,
      breakdown: {
        chats: content.filter(c => c.content_type === 'chat').length,
        teachings: content.filter(c => c.content_type === 'teaching').length
      },
      filters
    });
  } catch (error) {
    console.error('Error in fetchCombinedContent:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Failed to fetch combined content'
    });
  }
};