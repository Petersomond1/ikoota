//ikootaclient\src\components\service\commentServices.js
// Enhanced comment services with FormData support and better error handling

import api from './api.js';

// ✅ Enhanced postComment - supports both JSON and FormData
export const postComment = async (commentData) => {
  try {
    console.log('🔄 postComment service called with:', commentData);
    
    // Handle different input formats
    let requestData;
    let config = {};
    
    if (commentData instanceof FormData) {
      // FormData for file uploads
      requestData = commentData;
      config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      console.log('📤 Sending FormData to API');
    } else {
      // JSON data for simple comments
      requestData = commentData;
      config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      console.log('📤 Sending JSON to API');
    }

    const response = await api.post("/content/comments", requestData, config);
    
    console.log('✅ Comment posted successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error posting comment:", error.response?.data || error.message);
    
    // Enhanced error handling
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to post comment';
    
    throw new Error(errorMessage);
  }
};

// ✅ Enhanced postCommentWithFiles - specifically for file uploads
export const postCommentWithFiles = async ({ 
  user_id, 
  chat_id, 
  teaching_id, 
  comment, 
  files = [] 
}) => {
  try {
    console.log('🔄 postCommentWithFiles called');
    
    const formData = new FormData();
    formData.append("user_id", user_id);
    formData.append("comment", comment);
    
    if (chat_id) formData.append("chat_id", chat_id);
    if (teaching_id) formData.append("teaching_id", teaching_id);
    
    // Add files
    files.forEach((file, index) => {
      formData.append(`media${index + 1}`, file);
    });
    
    return await postComment(formData);
  } catch (error) {
    console.error("❌ Error in postCommentWithFiles:", error);
    throw error;
  }
};

// ✅ Upload comment files separately
export const uploadCommentFiles = async (files) => {
  try {
    console.log('🔄 uploadCommentFiles service called');
    
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }
    
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await api.post("/content/comments/upload", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ Files uploaded successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error uploading files:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to upload files');
  }
};

// ✅ Existing getCommentData (keep as is)
export const getCommentData = async (commentId) => {
  try {
    const response = await api.get(`/content/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching comment data:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ New: Get all comments
export const getAllComments = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/content/comments/all?${params}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching all comments:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ New: Update comment
export const updateComment = async (commentId, updateData) => {
  try {
    const response = await api.put(`/content/comments/${commentId}`, updateData);
    return response.data;
  } catch (error) {
    console.error("Error updating comment:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ New: Delete comment  
export const deleteComment = async (commentId, softDelete = false) => {
  try {
    const response = await api.delete(`/content/comments/${commentId}?soft_delete=${softDelete}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting comment:", error.response?.data || error.message);
    throw error;
  }
};