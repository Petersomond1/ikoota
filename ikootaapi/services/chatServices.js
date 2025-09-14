// ikootaapi/services/chatServices.js - CORRECTED FOR EXISTING DATABASE
// Compatible with actual field names: text, approval_status, createdAt, media_url1/2/3, etc.

import CustomError from '../utils/CustomError.js';
import db from '../config/db.js';

// ✅ CORRECTED: getAllChats with proper field names
export const getAllChats = async (filters = {}) => {
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
      sort_order = 'desc'
    } = filters;

    let whereConditions = [];
    let params = [];

    // Build WHERE conditions using ACTUAL field names
    if (user_id) {
      whereConditions.push('user_id = ?');
      params.push(user_id);
    }

    if (approval_status) {
      whereConditions.push('approval_status = ?');
      params.push(approval_status);
    }

    if (search) {
      // Use ACTUAL field names: title, text, summary
      whereConditions.push('(title LIKE ? OR text LIKE ? OR summary LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (start_date) {
      whereConditions.push('createdAt >= ?'); // ACTUAL field: createdAt
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('createdAt <= ?'); // ACTUAL field: createdAt
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // Use ACTUAL field names for sorting
    const validSortColumns = ['createdAt', 'updatedAt', 'title', 'approval_status'];
    const finalSortBy = validSortColumns.includes(sort_by) ? sort_by : 'updatedAt';
    const finalSortOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const query = `
      SELECT c.*, 
             c.prefixed_id, 
             'chat' as content_type,
             c.title as content_title,
             c.createdAt as content_createdAt,
             c.updatedAt as content_updatedAt,
             c.text as content_text,
             u.converse_id as converse_id
      FROM chats c
      LEFT JOIN users u ON c.user_id = u.id
      ${whereClause.replace(/\b(createdAt|updatedAt|title|approval_status|status|is_public|is_featured)\b/g, 'c.$1')}
      ORDER BY c.${finalSortBy} ${finalSortOrder}
    `;

    console.log('🔍 getAllChats query:', query);
    console.log('🔍 getAllChats params:', params);

    const rows = await db.query(query, params);
    return rows || [];
  } catch (error) {
    console.error('Error in getAllChats:', error);
    throw new CustomError(`Failed to fetch chats: ${error.message}`);
  }
};

// ✅ CORRECTED: getChatsByUserId with proper field names
export const getChatsByUserId = async (user_id) => {
  try {
    if (!user_id) {
      throw new CustomError('User ID is required', 400);
    }

    const query = `
      SELECT c.*, 
             c.prefixed_id,
             'chat' as content_type,
             c.title as content_title,
             c.createdAt as content_createdAt,
             c.updatedAt as content_updatedAt,
             c.text as content_text,
             u.converse_id as converse_id
      FROM chats c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ? 
      ORDER BY c.updatedAt DESC, c.createdAt DESC
    `;

    const rows = await db.query(query, [user_id]);
    return rows || [];
  } catch (error) {
    console.error('Error in getChatsByUserId:', error);
    throw new CustomError(`Failed to fetch user chats: ${error.message}`);
  }
};

// ✅ CORRECTED: createChatService with proper field names and media structure
export const createChatService = async (chatData) => {
  try {
    const { 
      title, 
      user_id, 
      audience, 
      summary, 
      text,  // ACTUAL field name
      approval_status = 'pending', 
      is_flagged = false,
      media = []
    } = chatData;

    // Validation
    if (!title || !text || !user_id) {
      throw new CustomError('Title, text, and user_id are required', 400);
    }

    if (typeof user_id === 'string' && user_id.length !== 10) {
      throw new CustomError('Invalid user_id format for chats (must be 10-character converse_id)', 400);
    }

    // Process media using ACTUAL individual field structure
    const [media1, media2, media3] = media.slice(0, 3);

    const sql = `
      INSERT INTO chats (
        title, user_id, audience, summary, text, approval_status, is_flagged,
        media_url1, media_type1, media_url2, media_type2, media_url3, media_type3
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      title.trim(),
      user_id,
      audience?.trim() || 'general',
      summary?.trim() || '',
      text.trim(), // ACTUAL field name
      approval_status,
      is_flagged ? 1 : 0,
      media1?.url || null,
      media1?.type || null,
      media2?.url || null,
      media2?.type || null,
      media3?.url || null,
      media3?.type || null,
    ];

    console.log('🔍 createChatService SQL:', sql);
    console.log('🔍 createChatService params:', params);

    const result = await db.query(sql, params);

    if (result.affectedRows === 0) {
      throw new CustomError("Failed to create chat", 500);
    }

    // Get the created record with prefixed_id
    const createdChat = await db.query(
      'SELECT *, prefixed_id FROM chats WHERE id = ?', 
      [result.insertId]
    );
    
    if (!createdChat[0]) {
      throw new CustomError("Failed to retrieve created chat", 500);
    }

    console.log(`✅ Chat created successfully with ID: ${createdChat[0].prefixed_id}`);
    return createdChat[0];
  } catch (error) {
    console.error('Error in createChatService:', error);
    throw new CustomError(error.message || 'Failed to create chat');
  }
};

// ✅ CORRECTED: updateChatById with proper field names
export const updateChatById = async (id, data) => {
  try {
    if (!id) {
      throw new CustomError('Chat ID is required', 400);
    }

    const {
      title,
      summary,
      text, // ACTUAL field name
      audience,
      media = [],
      approval_status,
      is_flagged,
      admin_notes,
      reviewed_by,
      reviewedAt
    } = data;

    // Check if chat exists
    const existingChat = await db.query('SELECT id FROM chats WHERE id = ?', [id]);
    if (!existingChat[0]) {
      throw new CustomError('Chat not found', 404);
    }

    // Process media using ACTUAL individual field structure
    const [media1, media2, media3] = media.slice(0, 3);

    // Build dynamic update query
    const updateFields = [];
    const params = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      params.push(title.trim());
    }

    if (summary !== undefined) {
      updateFields.push('summary = ?');
      params.push(summary?.trim() || '');
    }

    if (text !== undefined) { // ACTUAL field name
      updateFields.push('text = ?');
      params.push(text.trim());
    }

    if (audience !== undefined) {
      updateFields.push('audience = ?');
      params.push(audience?.trim() || 'general');
    }

    if (approval_status !== undefined) {
      updateFields.push('approval_status = ?');
      params.push(approval_status);
    }

    if (is_flagged !== undefined) {
      updateFields.push('is_flagged = ?');
      params.push(is_flagged ? 1 : 0);
    }

    if (admin_notes !== undefined) {
      updateFields.push('admin_notes = ?');
      params.push(admin_notes);
    }

    if (reviewed_by !== undefined) {
      updateFields.push('reviewed_by = ?');
      params.push(reviewed_by);
    }

    if (reviewedAt !== undefined) {
      updateFields.push('reviewedAt = ?'); // ACTUAL field name
      params.push(reviewedAt);
    }

    // Handle media updates using ACTUAL individual fields
    if (media.length > 0 || media1 !== undefined) {
      updateFields.push('media_url1 = ?', 'media_type1 = ?');
      params.push(media1?.url || null, media1?.type || null);
    }

    if (media.length > 1 || media2 !== undefined) {
      updateFields.push('media_url2 = ?', 'media_type2 = ?');
      params.push(media2?.url || null, media2?.type || null);
    }

    if (media.length > 2 || media3 !== undefined) {
      updateFields.push('media_url3 = ?', 'media_type3 = ?');
      params.push(media3?.url || null, media3?.type || null);
    }

    // Always update timestamp using ACTUAL field name
    updateFields.push('updatedAt = NOW()');

    if (updateFields.length === 1) { // Only updatedAt
      throw new CustomError('No fields to update', 400);
    }

    const sql = `
      UPDATE chats 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    params.push(id);

    console.log('🔍 updateChatById SQL:', sql);
    console.log('🔍 updateChatById params:', params);

    const result = await db.query(sql, params);

    if (result.affectedRows === 0) {
      throw new CustomError('Chat not found or no changes made', 404);
    }

    // Return updated chat
    const updatedChat = await db.query(
      'SELECT *, prefixed_id FROM chats WHERE id = ?', 
      [id]
    );

    return updatedChat[0];
  } catch (error) {
    console.error('Error in updateChatById:', error);
    throw new CustomError(error.message || 'Failed to update chat');
  }
};

// ✅ CORRECTED: deleteChatById with cascade handling
export const deleteChatById = async (id) => {
  try {
    if (!id) {
      throw new CustomError('Chat ID is required', 400);
    }

    // Check if chat exists and get prefixed_id for logging
    const existingChat = await db.query('SELECT prefixed_id FROM chats WHERE id = ?', [id]);
    if (!existingChat[0]) {
      throw new CustomError('Chat not found', 404);
    }

    // Delete related comments first (foreign key constraints)
    await db.query('DELETE FROM comments WHERE chat_id = ?', [id]);
    console.log(`✅ Deleted comments for chat ${id}`);

    // Delete the chat
    const result = await db.query('DELETE FROM chats WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      throw new CustomError('Chat not found', 404);
    }

    console.log(`✅ Chat deleted successfully: ${existingChat[0].prefixed_id}`);
    return { deleted: true, prefixed_id: existingChat[0].prefixed_id };
  } catch (error) {
    console.error('Error in deleteChatById:', error);
    throw new CustomError(error.message || 'Failed to delete chat');
  }
};

// ✅ CORRECTED: getChatHistoryService
export const getChatHistoryService = async (userId1, userId2) => {
  try {
    if (!userId1 || !userId2) {
      throw new CustomError('Both user IDs are required', 400);
    }

    const sql = `
      SELECT *, prefixed_id,
             'chat' as content_type,
             title as content_title,
             text as content_text
      FROM chats
      WHERE (user_id = ? AND audience = ?) 
         OR (user_id = ? AND audience = ?)
         OR (user_id = ? AND audience LIKE ?)
         OR (user_id = ? AND audience LIKE ?)
      ORDER BY createdAt ASC
    `;

    const params = [
      userId1, userId2, 
      userId2, userId1,
      userId1, `%${userId2}%`,
      userId2, `%${userId1}%`
    ];

    const rows = await db.query(sql, params);
    return rows || [];
  } catch (error) {
    console.error('Error in getChatHistoryService:', error);
    throw new CustomError(`Failed to get chat history: ${error.message}`);
  }
};

// ✅ CORRECTED: addCommentToChatService with proper field names
export const addCommentToChatService = async (chatId, commentData) => {
  try {
    if (!chatId || !commentData) {
      throw new CustomError('Chat ID and comment data are required', 400);
    }

    const { user_id, comment, media = [] } = commentData; // ACTUAL field name: comment

    if (!user_id || !comment) {
      throw new CustomError('User ID and comment text are required', 400);
    }

    // Validate chat exists
    const existingChat = await db.query('SELECT id FROM chats WHERE id = ?', [chatId]);
    if (!existingChat[0]) {
      throw new CustomError('Chat not found', 404);
    }

    // Process media using ACTUAL individual field structure
    const [media1, media2, media3] = media.slice(0, 3);

    const sql = `
      INSERT INTO comments (
        user_id, chat_id, comment, 
        media_url1, media_type1, media_url2, media_type2, media_url3, media_type3
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      user_id,
      chatId,
      comment.trim(), // ACTUAL field name
      media1?.url || null,
      media1?.type || null,
      media2?.url || null,
      media2?.type || null,
      media3?.url || null,
      media3?.type || null,
    ];

    const result = await db.query(sql, params);

    if (result.affectedRows === 0) {
      throw new CustomError("Failed to add comment", 500);
    }

    // Return created comment
    const createdComment = await db.query('SELECT * FROM comments WHERE id = ?', [result.insertId]);
    return createdComment[0];
  } catch (error) {
    console.error('Error in addCommentToChatService:', error);
    throw new CustomError(error.message || 'Failed to add comment to chat');
  }
};

// ✅ CORRECTED: getChatsByIds supporting both numeric and prefixed IDs
export const getChatsByIds = async (ids) => {
  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new CustomError('Chat IDs array is required', 400);
    }

    // Clean and validate IDs
    const cleanIds = ids.filter(id => id && id.toString().trim());
    if (cleanIds.length === 0) {
      throw new CustomError('Valid chat IDs are required', 400);
    }

    // Check if IDs are prefixed or numeric
    const isNumeric = cleanIds.every(id => !isNaN(id));
    const column = isNumeric ? 'id' : 'prefixed_id';
    
    const placeholders = cleanIds.map(() => '?').join(',');
    const query = `
      SELECT *, prefixed_id,
             'chat' as content_type,
             title as content_title,
             createdAt as content_createdAt,
             updatedAt as content_updatedAt,
             text as content_text
      FROM chats 
      WHERE ${column} IN (${placeholders}) 
      ORDER BY updatedAt DESC, createdAt DESC
    `;
    
    const rows = await db.query(query, cleanIds);
    return rows || [];
  } catch (error) {
    console.error('Error in getChatsByIds:', error);
    throw new CustomError(error.message || 'Failed to fetch chats by IDs');
  }
};

// ✅ CORRECTED: getChatByPrefixedId with fallback to numeric ID
export const getChatByPrefixedId = async (identifier) => {
  try {
    if (!identifier) {
      throw new CustomError('Chat identifier is required', 400);
    }

    // Try prefixed_id first, then fallback to numeric id
    let query, params;
    
    if (identifier.startsWith('c') || identifier.startsWith('C')) {
      // Prefixed ID
      query = `
        SELECT *, prefixed_id,
               'chat' as content_type,
               title as content_title,
               createdAt as content_createdAt,
               updatedAt as content_updatedAt,
               text as content_text
        FROM chats 
        WHERE prefixed_id = ?
      `;
      params = [identifier];
    } else {
      // Numeric ID
      query = `
        SELECT *, prefixed_id,
               'chat' as content_type,
               title as content_title,
               createdAt as content_createdAt,
               updatedAt as content_updatedAt,
               text as content_text
        FROM chats 
        WHERE id = ?
      `;
      params = [parseInt(identifier)];
    }

    const rows = await db.query(query, params);
    return rows[0] || null;
  } catch (error) {
    console.error('Error in getChatByPrefixedId:', error);
    throw new CustomError(`Failed to fetch chat: ${error.message}`);
  }
};

// ✅ CORRECTED: getCombinedContent (chats + teachings) with proper field names
export const getCombinedContent = async (filters = {}) => {
  try {
    console.log('Starting getCombinedContent service...');
    
    const {
      page = 1,
      limit = 50,
      user_id,
      approval_status,
      content_type,
      search,
      start_date,
      end_date,
      sort_by = 'updatedAt',
      sort_order = 'desc'
    } = filters;

    let queries = [];
    let allParams = [];

    // Base WHERE conditions using ACTUAL field names
    let whereConditions = [];
    if (user_id) whereConditions.push('user_id = ?');
    if (approval_status) whereConditions.push('approval_status = ?');
    if (start_date) whereConditions.push('createdAt >= ?'); // ACTUAL field name
    if (end_date) whereConditions.push('createdAt <= ?'); // ACTUAL field name

    const baseParams = [user_id, approval_status, start_date, end_date].filter(Boolean);

    // Get chats if requested
    if (!content_type || content_type === 'chat') {
      let chatWhere = whereConditions.slice();
      let chatParams = baseParams.slice();

      if (search) {
        // Use ACTUAL field names for chats
        chatWhere.push('(title LIKE ? OR text LIKE ? OR summary LIKE ?)');
        const searchTerm = `%${search}%`;
        chatParams.push(searchTerm, searchTerm, searchTerm);
      }

      const chatWhereClause = chatWhere.length > 0 ? `WHERE ${chatWhere.join(' AND ')}` : '';

      queries.push({
        query: `
          SELECT *, 
                 prefixed_id, 
                 'chat' as content_type, 
                 title as content_title, 
                 createdAt as content_createdAt, 
                 updatedAt as content_updatedAt,
                 text as content_text
          FROM chats 
          ${chatWhereClause}
        `,
        params: chatParams
      });
    }
    
    // Get teachings if requested
    if (!content_type || content_type === 'teaching') {
      let teachingWhere = whereConditions.slice();
      let teachingParams = baseParams.slice();

      if (search) {
        // Use ACTUAL field names for teachings
        teachingWhere.push('(topic LIKE ? OR description LIKE ? OR content LIKE ?)');
        const searchTerm = `%${search}%`;
        teachingParams.push(searchTerm, searchTerm, searchTerm);
      }

      const teachingWhereClause = teachingWhere.length > 0 ? `WHERE ${teachingWhere.join(' AND ')}` : '';

      queries.push({
        query: `
          SELECT *, 
                 prefixed_id, 
                 'teaching' as content_type,
                 topic as content_title,
                 createdAt as content_createdAt,
                 updatedAt as content_updatedAt
          FROM teachings
          ${teachingWhereClause}
        `,
        params: teachingParams
      });
    }

    // Execute all queries and combine results
    let allContent = [];
    
    for (const queryObj of queries) {
      try {
        console.log('🔍 Executing query:', queryObj.query);
        console.log('🔍 With params:', queryObj.params);
        
        const results = await db.query(queryObj.query, queryObj.params);
        if (results && Array.isArray(results)) {
          allContent.push(...results);
        }
      } catch (queryError) {
        console.error('❌ Error in individual query:', queryError);
      }
    }

    // Sort combined content using ACTUAL field names
    const validSortColumns = ['createdAt', 'updatedAt', 'content_title'];
    const finalSortBy = validSortColumns.includes(sort_by) ? sort_by : 'updatedAt';
    const isAsc = sort_order.toLowerCase() === 'asc';

    allContent.sort((a, b) => {
      const aValue = a[finalSortBy] || a.content_updatedAt || a.content_createdAt;
      const bValue = b[finalSortBy] || b.content_updatedAt || b.content_createdAt;
      
      if (finalSortBy === 'content_title') {
        return isAsc ? 
          (aValue || '').localeCompare(bValue || '') : 
          (bValue || '').localeCompare(aValue || '');
      } else {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return isAsc ? aDate - bDate : bDate - aDate;
      }
    });
    
    console.log(`✅ Returning ${allContent.length} combined items`);
    return allContent;
    
  } catch (error) {
    console.error('❌ Error in getCombinedContent:', error);
    throw new CustomError(`Failed to get combined content: ${error.message}`);
  }
};

// ✅ Helper functions for user ID mapping (unchanged)
export const mapConverseIdToUserId = async (converse_id) => {
  try {
    if (!converse_id || typeof converse_id !== 'string' || converse_id.length !== 10) {
      throw new CustomError('Valid converse_id required', 400);
    }

    const result = await db.query(`
      SELECT id FROM users WHERE converse_id = ?
    `, [converse_id]);

    if (!result[0]) {
      throw new CustomError('User not found with provided converse_id', 404);
    }

    return result[0].id;
  } catch (error) {
    console.error('Error in mapConverseIdToUserId:', error);
    throw new CustomError(`Failed to map converse_id to user_id: ${error.message}`);
  }
};

export const mapUserIdToConverseId = async (user_id) => {
  try {
    if (!user_id || isNaN(user_id)) {
      throw new CustomError('Valid numeric user_id required', 400);
    }

    const result = await db.query(`
      SELECT converse_id FROM users WHERE id = ?
    `, [parseInt(user_id)]);

    if (!result[0] || !result[0].converse_id) {
      throw new CustomError('Converse_id not found for provided user_id', 404);
    }

    return result[0].converse_id;
  } catch (error) {
    console.error('Error in mapUserIdToConverseId:', error);
    throw new CustomError(`Failed to map user_id to converse_id: ${error.message}`);
  }
};

// ✅ CORRECTED: getChatStats with proper field names
export const getChatStats = async (filters = {}) => {
  try {
    const { user_id, timeframe = '30days', startDate, endDate } = filters;

    let whereConditions = [];
    let params = [];

    if (user_id) {
      whereConditions.push('user_id = ?');
      params.push(user_id);
    }

    // Handle timeframe filtering using ACTUAL field name
    if (timeframe && !startDate && !endDate) {
      const days = parseInt(timeframe.replace('days', '')) || 30;
      whereConditions.push('createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)');
      params.push(days);
    }

    if (startDate) {
      whereConditions.push('createdAt >= ?'); // ACTUAL field name
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('createdAt <= ?'); // ACTUAL field name
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COUNT(*) as total_chats,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_chats,
        COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_chats,
        COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected_chats,
        COUNT(CASE WHEN is_flagged = 1 THEN 1 END) as flagged_chats,
        COUNT(CASE WHEN media_url1 IS NOT NULL OR media_url2 IS NOT NULL OR media_url3 IS NOT NULL THEN 1 END) as chats_with_media,
        MIN(createdAt) as first_chat,
        MAX(updatedAt) as latest_update
      FROM chats ${whereClause}
    `;

    const rows = await db.query(query, params);
    return rows[0] || {
      total_chats: 0,
      unique_users: 0,
      pending_chats: 0,
      approved_chats: 0,
      rejected_chats: 0,
      flagged_chats: 0,
      chats_with_media: 0,
      first_chat: null,
      latest_update: null
    };
  } catch (error) {
    console.error('Error in getChatStats:', error);
    throw new CustomError('Failed to get chat statistics');
  }
};


// //ikootaapi\services\chatServices.js
// import CustomError from '../utils/CustomError.js';
// import db from '../config/db.js';

// // Fetch all chats
// // export const getAllChats = async () => {
// //   const [rows] = await db.query('SELECT * FROM chats ORDER BY updatedAt DESC');
// //   return rows;
// // };

// // Fetch all chats
// export const getAllChats = async () => {
//   const rows = await db.query('SELECT *, prefixed_id FROM chats ORDER BY updatedAt DESC');
//   return rows;
// };

// // // Fetch chats by user_id
// // export const getChatsByUserId = async (user_id) => {
// //   const [rows] = await db.query('SELECT * FROM chats WHERE user_id = ? ORDER BY updatedAt DESC', [user_id]);
// //   return rows;
// // };

// export const getChatsByUserId = async (user_id) => {
//   const rows = await db.query('SELECT *, prefixed_id FROM chats WHERE user_id = ? ORDER BY updatedAt DESC', [user_id]);
//   return rows;
// };

// // NEW: Fetch teaching by prefixed_id
// export const getTeachingByPrefixedId = async (prefixedId) => {
//   const rows = await db.query('SELECT *, prefixed_id FROM teachings WHERE prefixed_id = ?', [prefixedId]);
//   return rows[0] || null;
// };



// // Add a new chat
// // export const createChatService = async (chatData) => {
// //   const { title, created_by, audience, summary, text, approval_status, is_flagged } = chatData;

// //   const [media1, media2, media3] = chatData.media || [];

// //   const sql = `
// //     INSERT INTO chats (title, created_by, audience, summary, text, approval_status, media_url1, media_type1, media_url2, media_type2, media_url3, media_type3, is_flagged)
// //     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
// //   `;
// //   const [result] = await db.query(sql, [
// //     title,
// //     created_by,
// //     audience,
// //     summary,
// //     text,
// //     approval_status || 'pending',
// //     is_flagged || 0,
// //     media1?.url || null,
// //     media1?.type || null,
// //     media2?.url || null,
// //     media2?.type || null,
// //     media3?.url || null,
// //     media3?.type || null,
// //   ]);

// //   if (result.affectedRows === 0) throw new CustomError("Failed to add chat", 500);

// //   return { id: result.insertId, ...chatData };
// // };

// // Updated createChatService to return prefixed_id
// export const createChatService = async (chatData) => {
//   const { title, created_by, audience, summary, text, approval_status, is_flagged } = chatData;
//   const [media1, media2, media3] = chatData.media || [];

//   const sql = `
//     INSERT INTO chats (title, user_id, audience, summary, text, approval_status, media_url1, media_type1, media_url2, media_type2, media_url3, media_type3, is_flagged)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `;
//   const result = await db.query(sql, [
//     title,
//     created_by, // Note: your DB uses user_id but your controller passes created_by
//     audience,
//     summary,
//     text,
//     approval_status || 'pending',
//     media1?.url || null,
//     media1?.type || null,
//     media2?.url || null,
//     media2?.type || null,
//     media3?.url || null,
//     media3?.type || null,
//     is_flagged || 0,
//   ]);

//   if (result.affectedRows === 0) throw new CustomError("Failed to add chat", 500);

//   // Get the created record with prefixed_id
//   const createdChat = await db.query('SELECT *, prefixed_id FROM chats WHERE id = ?', [result.insertId]);
  
//   return createdChat[0];
// };



// export const updateChatById = async (id, data) => {
//   const {
//     title,
//     summary,
//     text,
//     media,
//     approval_status,
//     is_flagged,
//   } = data;

//   const [media1, media2, media3] = media || [];

//   const sql = `
//     UPDATE chats
//     SET title = ?, summary = ?, text = ?, media_url1 = ?, media_type1 = ?, media_url2 = ?, media_type2 = ?, media_url3 = ?, media_type3 = ?, approval_status = ?, is_flagged = ?, updatedAt = NOW()
//     WHERE id = ?
//   `;
//   const result = await db.query(sql, [
//     title,
//     summary,
//     text,
//     is_flagged || 0,
//     media1?.url || null,
//     media1?.type || null,
//     media2?.url || null,
//     media2?.type || null,
//     media3?.url || null,
//     media3?.type || null,
//     approval_status || 'pending',
//     id,
//   ]);

//   if (result.affectedRows === 0) throw new CustomError("Failed to update chat", 500);

//   return { id, ...data };
// };

// export const getChatHistoryService = async (userId1, userId2) => {
//   const sql = `
//     SELECT * FROM chats
//     WHERE (created_by = ? AND audience = ?)
//        OR (created_by = ? AND audience = ?)
//     ORDER BY updatedAt ASC
//   `;
//   const rows = await db.query(sql, [userId1, userId2, userId2, userId1]);
//   return rows;
// };

// export const addCommentToChatService = async (chatId, commentData) => {
//   const { user_id, comment, media } = commentData;

//   const [media1, media2, media3] = media || [];

//   const sql = `
//     INSERT INTO comments (user_id, chat_id, comment, media_url1, media_type1, media_url2, media_type2, media_url3, media_type3)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `;
//   const result = await db.query(sql, [
//     user_id,
//     chatId,
//     comment,
//     media1?.url || null,
//     media1?.type || null,
//     media2?.url || null,
//     media2?.type || null,
//     media3?.url || null,
//     media3?.type || null,
//   ]);

//   if (result.affectedRows === 0) throw new CustomError("Failed to add comment", 500);

//   return { id: result.insertId, ...commentData };
// };

// export const deleteChatById = async (id) => {
//   const [result] = await db.query('DELETE FROM chats WHERE id = ?', [id]);

//   if (result.affectedRows === 0) throw new CustomError('Chat not found', 404);
// };

// // Fetch chats by a list of IDs
// // export const getChatsByIds = async (ids) => {
// //   try {
// //   const [rows] = await db.query('SELECT * FROM chats WHERE id IN (?) ORDER BY updatedAt DESC', [ids]);
// //   return rows;
// // } catch (error) {
// //   throw new CustomError(error.message);
// // }
// // };

// // Fetch chats by IDs (supports both numeric and prefixed IDs)
// export const getChatsByIds = async (ids) => {
//   try {
//     // Check if IDs are prefixed or numeric
//     const isNumeric = ids.every(id => !isNaN(id));
//     const column = isNumeric ? 'id' : 'prefixed_id';
    
//     const rows = await db.query(`SELECT *, prefixed_id FROM chats WHERE ${column} IN (?) ORDER BY updatedAt DESC`, [ids]);
//     return rows;
//   } catch (error) {
//     throw new CustomError(error.message);
//   }
// };

// // Missing getChatByPrefixedId function
// export const getChatByPrefixedId = async (prefixedId) => {
//   try {
//     const rows = await db.query('SELECT *, prefixed_id FROM chats WHERE prefixed_id = ?', [prefixedId]);
//     return rows[0] || null;
//   } catch (error) {
//     throw new CustomError(error.message);
//   }
// };


// // NEW: Combined content service (chats + teachings)
// export const getCombinedContent = async () => {
//   try {
//     console.log('Starting getCombinedContent service...');
    
//     // Get chats - now both createdAt and updatedAt are camelCase (consistent!)
//     const chats = await db.query(`
//       SELECT *, 
//              prefixed_id, 
//              'chat' as content_type, 
//              title as content_title, 
//              createdAt as content_createdAt, 
//              updatedAt as content_updatedAt
//       FROM chats 
//       ORDER BY updatedAt DESC
//     `);
//     console.log(`Found ${chats.length} chats`);
    
//     // Get teachings - both createdAt and updatedAt (camelCase)
//     const teachings = await db.query(`
//       SELECT *, 
//              prefixed_id, 
//              'teaching' as content_type,
//              topic as content_title,
//              createdAt as content_createdAt,
//              updatedAt as content_updatedAt
//       FROM teachings
//       ORDER BY updatedAt DESC
//     `);
//     console.log(`Found ${teachings.length} teachings`);
    
//     // Combine and sort by date (use the latest update time)
//     const combined = [...chats, ...teachings].sort((a, b) => {
//       const aDate = new Date(a.content_updatedAt || a.content_createdAt);
//       const bDate = new Date(b.content_updatedAt || b.content_createdAt);
//       return bDate - aDate; // Most recent first
//     });
    
//     console.log(`Returning ${combined.length} combined items`);
//     return combined;
    
//   } catch (error) {
//     console.error('Detailed error in getCombinedContent:', {
//       message: error.message,
//       code: error.code,
//       sqlState: error.sqlState,
//       errno: error.errno
//     });
//     throw new CustomError(`Failed to get combined content: ${error.message}`);
//   }
// };


// // Function to map converse_id to numeric user.id (helper for teachings)
// export const mapConverseIdToUserId = async (converse_id) => {
//   try {
//     if (!converse_id || typeof converse_id !== 'string' || converse_id.length !== 10) {
//       throw new CustomError('Valid converse_id required', 400);
//     }

//     const result = await db.query(`
//       SELECT id FROM users WHERE converse_id = ?
//     `, [converse_id]);

//     if (!result[0]) {
//       throw new CustomError('User not found with provided converse_id', 404);
//     }

//     return result[0].id;
//   } catch (error) {
//     console.error('Error in mapConverseIdToUserId:', error);
//     throw new CustomError(`Failed to map converse_id to user_id: ${error.message}`);
//   }
// };

// // Function to map numeric user.id to converse_id (helper for chats)
// export const mapUserIdToConverseId = async (user_id) => {
//   try {
//     if (!user_id || isNaN(user_id)) {
//       throw new CustomError('Valid numeric user_id required', 400);
//     }

//     const result = await db.query(`
//       SELECT converse_id FROM users WHERE id = ?
//     `, [parseInt(user_id)]);

//     if (!result[0] || !result[0].converse_id) {
//       throw new CustomError('Converse_id not found for provided user_id', 404);
//     }

//     return result[0].converse_id;
//   } catch (error) {
//     console.error('Error in mapUserIdToConverseId:', error);
//     throw new CustomError(`Failed to map user_id to converse_id: ${error.message}`);
//   }
// };


// // NEW: Get chat statistics
// export const getChatStats = async (filters = {}) => {
//   try {
//     const { user_id, timeframe = '30days', startDate, endDate } = filters;

//     let whereConditions = [];
//     let params = [];

//     if (user_id) {
//       whereConditions.push('user_id = ?');
//       params.push(user_id);
//     }

//     // Handle timeframe filtering
//     if (timeframe && !startDate && !endDate) {
//       const days = parseInt(timeframe.replace('days', '')) || 30;
//       whereConditions.push('createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)');
//       params.push(days);
//     }

//     if (startDate) {
//       whereConditions.push('createdAt >= ?');
//       params.push(startDate);
//     }

//     if (endDate) {
//       whereConditions.push('createdAt <= ?');
//       params.push(endDate);
//     }

//     const whereClause = whereConditions.length > 0 ? 
//       `WHERE ${whereConditions.join(' AND ')}` : '';

//     const query = `
//       SELECT 
//         COUNT(*) as total_chats,
//         COUNT(DISTINCT user_id) as unique_users,
//         COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_chats,
//         COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_chats,
//         COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected_chats,
//         COUNT(CASE WHEN is_flagged = 1 THEN 1 END) as flagged_chats,
//         COUNT(CASE WHEN media_url1 IS NOT NULL OR media_url2 IS NOT NULL OR media_url3 IS NOT NULL THEN 1 END) as chats_with_media,
//         MIN(createdAt) as first_chat,
//         MAX(updatedAt) as latest_update
//       FROM chats ${whereClause}
//     `;

//     const rows = await db.query(query, params);
//     return rows[0];
//   } catch (error) {
//     console.error('Error in getChatStats:', error);
//     throw new CustomError('Failed to get chat statistics');
//   }
// };

// ===============================================
// SEARCH FUNCTIONALITY
// ===============================================

// Enhanced chat search function
export const searchChats = async (searchOptions) => {
  try {
    const {
      query,
      user_id,
      approval_status = 'approved',
      page = 1,
      limit = 20,
      sort_by = 'updatedAt',
      sort_order = 'desc',
      search_fields = 'all',
      date_from,
      date_to
    } = searchOptions;

    if (!query || query.trim().length === 0) {
      throw new CustomError('Search query is required', 400);
    }

    let whereConditions = ['approval_status = ?'];
    let params = [approval_status];

    // Build search conditions based on search_fields
    let searchConditions = [];
    const searchTerm = `%${query.trim()}%`;

    if (search_fields === 'all' || search_fields === 'title') {
      searchConditions.push('title LIKE ?');
      params.push(searchTerm);
    }

    if (search_fields === 'all' || search_fields === 'content') {
      searchConditions.push('text LIKE ?');
      searchConditions.push('summary LIKE ?');
      params.push(searchTerm, searchTerm);
    }

    if (search_fields === 'all' || search_fields === 'user') {
      searchConditions.push('user_id LIKE ?');
      params.push(searchTerm);
    }

    if (searchConditions.length > 0) {
      whereConditions.push(`(${searchConditions.join(' OR ')})`);
    }

    // Additional filters
    if (user_id) {
      whereConditions.push('user_id = ?');
      params.push(user_id);
    }

    if (date_from) {
      whereConditions.push('createdAt >= ?');
      params.push(date_from);
    }

    if (date_to) {
      whereConditions.push('createdAt <= ?');
      params.push(date_to);
    }

    // Build the query
    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * limit;

    const sql = `
      SELECT 
        id,
        title,
        user_id,
        audience,
        summary,
        text,
        approval_status,
        media_url1,
        media_url2, 
        media_url3,
        createdAt,
        updatedAt,
        CONCAT('c', id) as prefixed_id
      FROM chats 
      WHERE ${whereClause}
      ORDER BY ${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const rows = await db.query(sql, params);
    
    // Enhance results with normalized structure
    const enhancedResults = rows.map(row => ({
      ...row,
      content_type: 'chat',
      content_title: row.title,
      content: row.text,
      display_date: row.updatedAt || row.createdAt
    }));

    console.log(`🔍 Chat search found ${enhancedResults.length} results for query: "${query}"`);
    return enhancedResults;

  } catch (error) {
    console.error('Error in searchChats:', error);
    throw error instanceof CustomError ? error : new CustomError('Chat search failed', 500);
  }
};
