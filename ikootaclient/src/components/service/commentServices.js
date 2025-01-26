import api from './api.js';

export const postComment = async ({ chatId, userId, comment, mediaData }) => {
    try {
      const response = await api.post("/comments", {
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
  
