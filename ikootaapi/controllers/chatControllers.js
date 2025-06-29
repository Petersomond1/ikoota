// ikootaapi/controllers/chatControllers.js

import {
  getAllChats,
  getChatsByUserId,
  createChatService,
  getChatHistoryService,
  updateChatById,
  deleteChatById,
  addCommentToChatService,
  getChatsByIds, // New service function
  getChatByPrefixedId,    // ADD THIS
  getCombinedContent,    
} from '../services/chatServices.js';


// export const fetchAllChats = async (req, res) => {
//   try {
//     const chats = await getAllChats();
//     res.status(200).json(chats);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


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

// Missing fetchChatByPrefixedId controller
export const fetchChatByPrefixedId = async (req, res) => {
  try {
    const { prefixedId } = req.params;
    const chat = await getChatByPrefixedId(prefixedId);
    
    if (!chat) {
      return res.status(404).json({ 
        success: false,
        error: 'Chat not found' 
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
      error: error.message 
    });
  }
};


// export const fetchChatsByIds = async (req, res) => {
//   const { ids } = req.query;
//   try {
//     const chats = await getChatsByIds(ids.split(','));
//     res.status(200).json(chats);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// Updated fetchChatsByIds to support both numeric and prefixed IDs
export const fetchChatsByIds = async (req, res) => {
  const { ids } = req.query;
  try {
    const idsArray = ids.split(',');
    const chats = await getChatsByIds(idsArray);
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

// NEW: Fetch chat by prefixed ID
// export const fetchChatByPrefixedId = async (req, res) => {
//   try {
//     const { prefixedId } = req.params;
//     const chat = await getChatByPrefixedId(prefixedId);
    
//     if (!chat) {
//       return res.status(404).json({ error: 'Chat not found' });
//     }
    
//     res.status(200).json(chat);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// NEW: Combined content controller
export const fetchCombinedContent = async (req, res) => {
  try {
    console.log('Fetching combined content...'); // Debug log
    
    const content = await getCombinedContent();
    
    console.log(`Found ${content.length} total content items`); // Debug log
    
    res.status(200).json({
      success: true,
      data: content,
      count: content.length,
      chats_count: content.filter(c => c.content_type === 'chat').length,
      teachings_count: content.filter(c => c.content_type === 'teaching').length
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

