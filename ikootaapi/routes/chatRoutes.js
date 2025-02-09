import express from 'express';
import { uploadMiddleware, uploadToS3 } from '../middlewares/upload.middleware.js';
import {
  fetchAllChats,
  fetchChatsByUserId,
  createChat,
  addCommentToChat,
  getChatHistory,
  editChat,
  removeChat,
} from '../controllers/chatControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Fetch all chats
router.get('/', authenticate, fetchAllChats);

// Fetch chats by user_id
router.get('/user', authenticate, fetchChatsByUserId);

// Create new chat
router.post('/', authenticate, uploadMiddleware, uploadToS3, createChat);

// Add comment to specific chat
router.post('/:chatId/comments', authenticate, uploadMiddleware, uploadToS3, addCommentToChat);

// Get chat history between two users
router.get('/:userId1/:userId2', authenticate, getChatHistory);

// Update a chat by ID
router.put('/:id', authenticate, editChat);

// Delete a chat by ID
router.delete('/:id', authenticate, removeChat);

export default router;