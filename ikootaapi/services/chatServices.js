import pool from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// Fetch all chats
export const getAllChats = async () => {
  const [rows] = await pool.query('SELECT * FROM chats ORDER BY updatedAt DESC');
  return rows;
};

// Fetch chats by user_id
export const getChatsByUserId = async (user_id) => {
  const [rows] = await pool.query('SELECT * FROM chats WHERE user_id = ? ORDER BY updatedAt DESC', [user_id]);
  return rows;
};



// Add a new chat
export const createChatService = async (chatData) => {
  const { title, created_by, audience, summary, text, approval_status, is_flagged } = chatData;

  const [media1, media2, media3] = chatData.media || [];

  const sql = `
    INSERT INTO chats (title, created_by, audience, summary, text, approval_status, media_url1, media_type1, media_url2, media_type2, media_url3, media_type3, is_flagged)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(sql, [
    title,
    created_by,
    audience,
    summary,
    text,
    approval_status || 'pending',
    is_flagged || 0,
    media1?.url || null,
    media1?.type || null,
    media2?.url || null,
    media2?.type || null,
    media3?.url || null,
    media3?.type || null,
  ]);

  if (result.affectedRows === 0) throw new CustomError("Failed to add chat", 500);

  return { id: result.insertId, ...chatData };
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
  const [result] = await pool.query(sql, [
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
  const [rows] = await pool.query(sql, [userId1, userId2, userId2, userId1]);
  return rows;
};

export const addCommentToChatService = async (chatId, commentData) => {
  const { user_id, comment, media } = commentData;

  const [media1, media2, media3] = media || [];

  const sql = `
    INSERT INTO comments (user_id, chat_id, comment, media_url1, media_type1, media_url2, media_type2, media_url3, media_type3)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(sql, [
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
  const [result] = await pool.query('DELETE FROM chats WHERE id = ?', [id]);

  if (result.affectedRows === 0) throw new CustomError('Chat not found', 404);
};

// Fetch chats by a list of IDs
export const getChatsByIds = async (ids) => {
  try {
  const [rows] = await pool.query('SELECT * FROM chats WHERE id IN (?) ORDER BY updatedAt DESC', [ids]);
  return rows;
} catch (error) {
  throw new CustomError(error.message);
}
};

// export const getChatsByIds = async (ids) => {
//   try {
//     const [chats] = await pool.query('SELECT * FROM chats WHERE id IN (?)', [ids]);
//     return chats;
//   } catch (error) {
//     throw new CustomError(error.message);
//   }
// };

