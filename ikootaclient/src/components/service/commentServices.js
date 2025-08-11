//ikootaclient\src\components\service\commentServices.js
import api from './api.js';

export const postComment = async ({ chatId, userId, comment, mediaData }) => {
    try {
      const response = await api.post("/content/comments", {
        userId,
        chatId,
        comment,
        media: mediaData, // Send structured media data
      });
     
      return response.data;

    } catch (error) {
      console.error("Error posting comment:", error.response?.data || error.message);
      throw error;
    }
  };

export const getCommentData = async (commentId) => {
    try {
      const response = await api.get(`/content/comments/${commentId}`);
     
      return response.data;
    } catch (error) {
      console.error("Error fetching comment data:", error.response?.data || error.message);
      throw error;
    }
  };
  
