import CustomError from '../utils/CustomError.js';
import db from '../config/db.js';

// Fetch all chats
// export const getAllChats = async () => {
//   const [rows] = await db.query('SELECT * FROM chats ORDER BY updatedAt DESC');
//   return rows;
// };

// Fetch all chats
export const getAllChats = async () => {
  const rows = await db.query('SELECT *, prefixed_id FROM chats ORDER BY updatedAt DESC');
  return rows;
};

// // Fetch chats by user_id
// export const getChatsByUserId = async (user_id) => {
//   const [rows] = await db.query('SELECT * FROM chats WHERE user_id = ? ORDER BY updatedAt DESC', [user_id]);
//   return rows;
// };

export const getChatsByUserId = async (user_id) => {
  const rows = await db.query('SELECT *, prefixed_id FROM chats WHERE user_id = ? ORDER BY updatedAt DESC', [user_id]);
  return rows;
};

// NEW: Fetch teaching by prefixed_id
export const getTeachingByPrefixedId = async (prefixedId) => {
  const rows = await db.query('SELECT *, prefixed_id FROM teachings WHERE prefixed_id = ?', [prefixedId]);
  return rows[0] || null;
};



// Add a new chat
// export const createChatService = async (chatData) => {
//   const { title, created_by, audience, summary, text, approval_status, is_flagged } = chatData;

//   const [media1, media2, media3] = chatData.media || [];

//   const sql = `
//     INSERT INTO chats (title, created_by, audience, summary, text, approval_status, media_url1, media_type1, media_url2, media_type2, media_url3, media_type3, is_flagged)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `;
//   const [result] = await db.query(sql, [
//     title,
//     created_by,
//     audience,
//     summary,
//     text,
//     approval_status || 'pending',
//     is_flagged || 0,
//     media1?.url || null,
//     media1?.type || null,
//     media2?.url || null,
//     media2?.type || null,
//     media3?.url || null,
//     media3?.type || null,
//   ]);

//   if (result.affectedRows === 0) throw new CustomError("Failed to add chat", 500);

//   return { id: result.insertId, ...chatData };
// };

// Updated createChatService to return prefixed_id
export const createChatService = async (chatData) => {
  const { title, created_by, audience, summary, text, approval_status, is_flagged } = chatData;
  const [media1, media2, media3] = chatData.media || [];

  const sql = `
    INSERT INTO chats (title, user_id, audience, summary, text, approval_status, media_url1, media_type1, media_url2, media_type2, media_url3, media_type3, is_flagged)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await db.query(sql, [
    title,
    created_by, // Note: your DB uses user_id but your controller passes created_by
    audience,
    summary,
    text,
    approval_status || 'pending',
    media1?.url || null,
    media1?.type || null,
    media2?.url || null,
    media2?.type || null,
    media3?.url || null,
    media3?.type || null,
    is_flagged || 0,
  ]);

  if (result.affectedRows === 0) throw new CustomError("Failed to add chat", 500);

  // Get the created record with prefixed_id
  const createdChat = await db.query('SELECT *, prefixed_id FROM chats WHERE id = ?', [result.insertId]);
  
  return createdChat[0];
};



export const updateChatById = async (id, data) => {
  const {
    title,
    summary,
    text,
    media,
    approval_status,
    is_flagged,
  } = data;

  const [media1, media2, media3] = media || [];

  const sql = `
    UPDATE chats
    SET title = ?, summary = ?, text = ?, media_url1 = ?, media_type1 = ?, media_url2 = ?, media_type2 = ?, media_url3 = ?, media_type3 = ?, approval_status = ?, is_flagged = ?, updatedAt = NOW()
    WHERE id = ?
  `;
  const result = await db.query(sql, [
    title,
    summary,
    text,
    is_flagged || 0,
    media1?.url || null,
    media1?.type || null,
    media2?.url || null,
    media2?.type || null,
    media3?.url || null,
    media3?.type || null,
    approval_status || 'pending',
    id,
  ]);

  if (result.affectedRows === 0) throw new CustomError("Failed to update chat", 500);

  return { id, ...data };
};

export const getChatHistoryService = async (userId1, userId2) => {
  const sql = `
    SELECT * FROM chats
    WHERE (created_by = ? AND audience = ?)
       OR (created_by = ? AND audience = ?)
    ORDER BY updatedAt ASC
  `;
  const rows = await db.query(sql, [userId1, userId2, userId2, userId1]);
  return rows;
};

export const addCommentToChatService = async (chatId, commentData) => {
  const { user_id, comment, media } = commentData;

  const [media1, media2, media3] = media || [];

  const sql = `
    INSERT INTO comments (user_id, chat_id, comment, media_url1, media_type1, media_url2, media_type2, media_url3, media_type3)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await db.query(sql, [
    user_id,
    chatId,
    comment,
    media1?.url || null,
    media1?.type || null,
    media2?.url || null,
    media2?.type || null,
    media3?.url || null,
    media3?.type || null,
  ]);

  if (result.affectedRows === 0) throw new CustomError("Failed to add comment", 500);

  return { id: result.insertId, ...commentData };
};

export const deleteChatById = async (id) => {
  const [result] = await db.query('DELETE FROM chats WHERE id = ?', [id]);

  if (result.affectedRows === 0) throw new CustomError('Chat not found', 404);
};

// Fetch chats by a list of IDs
// export const getChatsByIds = async (ids) => {
//   try {
//   const [rows] = await db.query('SELECT * FROM chats WHERE id IN (?) ORDER BY updatedAt DESC', [ids]);
//   return rows;
// } catch (error) {
//   throw new CustomError(error.message);
// }
// };

// Fetch chats by IDs (supports both numeric and prefixed IDs)
export const getChatsByIds = async (ids) => {
  try {
    // Check if IDs are prefixed or numeric
    const isNumeric = ids.every(id => !isNaN(id));
    const column = isNumeric ? 'id' : 'prefixed_id';
    
    const rows = await db.query(`SELECT *, prefixed_id FROM chats WHERE ${column} IN (?) ORDER BY updatedAt DESC`, [ids]);
    return rows;
  } catch (error) {
    throw new CustomError(error.message);
  }
};

// Missing getChatByPrefixedId function
export const getChatByPrefixedId = async (prefixedId) => {
  try {
    const rows = await db.query('SELECT *, prefixed_id FROM chats WHERE prefixed_id = ?', [prefixedId]);
    return rows[0] || null;
  } catch (error) {
    throw new CustomError(error.message);
  }
};


// NEW: Combined content service (chats + teachings)
export const getCombinedContent = async () => {
  try {
    console.log('Starting getCombinedContent service...');
    
    // Get chats - now both createdAt and updatedAt are camelCase (consistent!)
    const chats = await db.query(`
      SELECT *, 
             prefixed_id, 
             'chat' as content_type, 
             title as content_title, 
             createdAt as content_createdAt, 
             updatedAt as content_updatedAt
      FROM chats 
      ORDER BY updatedAt DESC
    `);
    console.log(`Found ${chats.length} chats`);
    
    // Get teachings - both createdAt and updatedAt (camelCase)
    const teachings = await db.query(`
      SELECT *, 
             prefixed_id, 
             'teaching' as content_type,
             topic as content_title,
             createdAt as content_createdAt,
             updatedAt as content_updatedAt
      FROM teachings
      ORDER BY updatedAt DESC
    `);
    console.log(`Found ${teachings.length} teachings`);
    
    // Combine and sort by date (use the latest update time)
    const combined = [...chats, ...teachings].sort((a, b) => {
      const aDate = new Date(a.content_updatedAt || a.content_createdAt);
      const bDate = new Date(b.content_updatedAt || b.content_createdAt);
      return bDate - aDate; // Most recent first
    });
    
    console.log(`Returning ${combined.length} combined items`);
    return combined;
    
  } catch (error) {
    console.error('Detailed error in getCombinedContent:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      errno: error.errno
    });
    throw new CustomError(`Failed to get combined content: ${error.message}`);
  }
};
