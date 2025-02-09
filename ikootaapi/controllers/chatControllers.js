// ikootaapi/controllers/chatControllers.js

import {
  getAllChats,
  getChatsByUserId,
  createChatService,
  getChatHistoryService,
  updateChatById,
  deleteChatById,
  addCommentToChatService,
} from '../services/chatServices.js';


export const fetchAllChats = async (req, res) => {
  try {
    const chats = await getAllChats();
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const fetchChatsByUserId = async (req, res) => {
  const { user_id } = req.query;
  try {
    const chats = await getChatsByUserId(user_id);
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const createChat = async (req, res) => {
  try {
    const { title, created_by, audience, summary, text, is_flagged } = req.body;
    const files = req.uploadedFiles || [];
    const media = files.map((file) => ({
      url: file.url,
      type: file.type,
    }));

    const newChat = await createChatService({
      title,
      created_by,
      audience,
      summary,
      text,
      is_flagged,
      media,
    });

    res.status(201).json({ id: newChat.id, message: "Chat created successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getChatHistory = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const chatHistory = await getChatHistoryService(userId1, userId2);
    res.status(200).json(chatHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



export const editChat = async (req, res) => {
  try {
    const { id } = req.params;
    const data = {
      ...req.body,
      media: req.uploadedFiles || [],
    };

    const updatedChat = await updateChatById(id, data);
    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const removeChat = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteChatById(id);
    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const addCommentToChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const commentData = req.body;
    const comment = await addCommentToChatService(chatId, commentData);
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};