// ikootaapi/services/commentServices.js - CORRECTED to match your db.js pattern
import axios from 'axios';
import db from '../config/db.js'; // ✅ Your custom wrapper
import CustomError from "../utils/CustomError.js";
import { uploadFileToS3 } from '../config/s3.js';

// ✅ CORRECTED: Using your actual db pattern
export const createCommentService = async ({ user_id, chat_id, teaching_id, comment, media }) => {
  const connection = await db.getConnection(); // ✅ Your pattern
  try {
    await connection.beginTransaction();
    console.log("Creating comment for:", user_id, chat_id, teaching_id, comment, media);
    
    // ✅ CORRECTED: For connections, you still need to destructure
    const [result] = await connection.query(
      `INSERT INTO comments (user_id, chat_id, teaching_id, comment, media_url1, media_type1, media_url2, media_type2, media_url3, media_type3)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        chat_id,
        teaching_id,
        comment,
        media[0]?.url || null,
        media[0]?.type || null,
        media[1]?.url || null,
        media[1]?.type || null,
        media[2]?.url || null,
        media[2]?.type || null,
      ]
    );

    await connection.commit();
    console.log(`Comment created successfully: ID ${result.insertId}`);
    
    return { id: result.insertId };
  } catch (error) {
    await connection.rollback();
    console.error('Error in createCommentService:', error);
    throw new CustomError(error.message);
  } finally {
    connection.release();
  }
};

// ✅ Working uploadCommentService - keep as is
export const uploadCommentService = async (files) => {
  try {
    const uploadedFiles = await Promise.all(files.map(async (file) => {
      const { url, type } = await uploadFileToS3(file);
      return { url, type };
    }));

    return uploadedFiles;
  } catch (error) {
    throw new CustomError(error.message);
  }
};

// ✅ CORRECTED: Using your db.query() wrapper (no destructuring needed)
export const getCommentsByUserId = async (user_id) => {
  try {
    const comments = await db.query( // ✅ Your wrapper handles destructuring
      'SELECT * FROM comments WHERE user_id = ? ORDER BY createdAt DESC', 
      [user_id]
    );
    console.log('✅ DEBUG - getCommentsByUserId result:', comments);
    return comments;
  } catch (error) {
    console.error('Error in getCommentsByUserId:', error);
    throw new CustomError(error.message);
  }
};

// ✅ Working getChatAndTeachingIdsFromComments - keep as is
export const getChatAndTeachingIdsFromComments = (comments) => {
  try {
    console.log('✅ DEBUG - getChatAndTeachingIdsFromComments input:', comments);
    
    if (!Array.isArray(comments)) {
      console.log('❌ DEBUG - Comments is not an array:', typeof comments);
      return { chatIds: [], teachingIds: [] };
    }

    const chatIds = [];
    const teachingIds = [];

    comments.forEach(comment => {
      if (comment.chat_id && !chatIds.includes(comment.chat_id)) {
        chatIds.push(comment.chat_id);
      }
      if (comment.teaching_id && !teachingIds.includes(comment.teaching_id)) {
        teachingIds.push(comment.teaching_id);
      }
    });

    console.log('✅ DEBUG - Extracted IDs:', { chatIds, teachingIds });
    return { chatIds, teachingIds };
  } catch (error) {
    console.error('Error in getChatAndTeachingIdsFromComments:', error);
    return { chatIds: [], teachingIds: [] };
  }
};

export const getParentChatsAndTeachingsWithComments = async (chatIds, teachingIds) => {
  try {
    console.log('✅ DEBUG - getParentChatsAndTeachingsWithComments called with:', { chatIds, teachingIds });
    
    let chatsBody = [];
    let teachingBody = [];
    let comments = [];

    // ✅ FIXED: Proper IN clause handling for arrays
    if (chatIds.length > 0) {
      // Create placeholders for the IN clause
      const placeholders = chatIds.map(() => '?').join(',');
      const chats = await db.query(
        `SELECT *, prefixed_id FROM chats WHERE id IN (${placeholders}) ORDER BY updatedAt DESC`, 
        chatIds  // Pass array items directly, not wrapped in array
      );
      chatsBody = chats;
      console.log('✅ DEBUG - Fetched chats:', chatsBody);
    }

    if (teachingIds.length > 0) {
      // Create placeholders for the IN clause
      const placeholders = teachingIds.map(() => '?').join(',');
      const teachings = await db.query(
        `SELECT *, prefixed_id FROM teachings WHERE id IN (${placeholders}) ORDER BY updatedAt DESC`, 
        teachingIds  // Pass array items directly, not wrapped in array
      );
      teachingBody = teachings;
      console.log('✅ DEBUG - Fetched teachings:', teachingBody);
    }
      
    // Get all comments for both chats and teachings
    if (chatIds.length > 0 || teachingIds.length > 0) {
      let commentQuery = 'SELECT * FROM comments WHERE ';
      let queryParams = [];
      let conditions = [];

      if (chatIds.length > 0) {
        const chatPlaceholders = chatIds.map(() => '?').join(',');
        conditions.push(`chat_id IN (${chatPlaceholders})`);
        queryParams.push(...chatIds);  // Spread the array items
      }

      if (teachingIds.length > 0) {
        const teachingPlaceholders = teachingIds.map(() => '?').join(',');
        conditions.push(`teaching_id IN (${teachingPlaceholders})`);
        queryParams.push(...teachingIds);  // Spread the array items
      }

      commentQuery += conditions.join(' OR ') + ' ORDER BY createdAt DESC';
      console.log('✅ DEBUG - Comment query:', commentQuery);
      console.log('✅ DEBUG - Comment params:', queryParams);
      
      const allComments = await db.query(commentQuery, queryParams);
      comments = allComments;
      console.log('✅ DEBUG - Fetched all comments:', comments);
    }

    const result = {
      chats: chatsBody,
      teachings: teachingBody,
      comments: comments
    };
    
    console.log('✅ DEBUG - Final result from getParentChatsAndTeachingsWithComments:', result);
    return result;
  } catch (error) {
    console.error("Error fetching parent chats and teachings with comments:", error);
    throw new CustomError("Internal Server Error");
  }
};

// ✅ CORRECTED: Using your db.query() wrapper
export const getCommentsByParentIds = async (chatIds, teachingIds) => {
  try {
    // Handle both string and array inputs
    const chatIdArray = chatIds ? 
      (typeof chatIds === 'string' ? chatIds.split(',').map(id => parseInt(id)) : chatIds) : [];
    const teachingIdArray = teachingIds ? 
      (typeof teachingIds === 'string' ? teachingIds.split(',').map(id => parseInt(id)) : teachingIds) : [];

    if (chatIdArray.length === 0 && teachingIdArray.length === 0) {
      return [];
    }

    // ✅ FIXED: Proper IN clause handling
    let queryParts = [];
    let queryParams = [];

    if (chatIdArray.length > 0) {
      const chatPlaceholders = chatIdArray.map(() => '?').join(',');
      queryParts.push(`chat_id IN (${chatPlaceholders})`);
      queryParams.push(...chatIdArray);
    }

    if (teachingIdArray.length > 0) {
      const teachingPlaceholders = teachingIdArray.map(() => '?').join(',');
      queryParts.push(`teaching_id IN (${teachingPlaceholders})`);
      queryParams.push(...teachingIdArray);
    }

    const query = `SELECT * FROM comments WHERE ${queryParts.join(' OR ')} ORDER BY createdAt DESC`;
    console.log('✅ DEBUG - getCommentsByParentIds query:', query);
    console.log('✅ DEBUG - getCommentsByParentIds params:', queryParams);

    const comments = await db.query(query, queryParams);
    return comments;
  } catch (error) {
    console.error('Error in getCommentsByParentIds:', error);
    throw new CustomError(error.message);
  }
};

// ✅ CORRECTED: Using your db.query() wrapper
export const getAllComments = async () => {
  try {
    const comments = await db.query( // ✅ Your wrapper handles destructuring
      'SELECT * FROM comments ORDER BY createdAt DESC'
    );
    return comments;
  } catch (error) {
    console.error('Error in getAllComments:', error);
    throw new CustomError(error.message);
  }
};

// ✅ CORRECTED: Using your db.query() wrapper
export const getCommentById = async (commentId) => {
  try {
    if (!commentId) {
      throw new CustomError('Comment ID is required', 400);
    }

    const comments = await db.query( // ✅ Your wrapper handles destructuring
      `SELECT c.*, u.username, u.email,
              ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
              t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id,
              CASE 
                WHEN c.chat_id IS NOT NULL THEN 'chat'
                WHEN c.teaching_id IS NOT NULL THEN 'teaching'
                ELSE 'unknown'
              END as content_type
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN chats ch ON c.chat_id = ch.id
       LEFT JOIN teachings t ON c.teaching_id = t.id
       WHERE c.id = ?`, 
      [commentId]
    );
    
    if (comments.length === 0) {
      throw new CustomError('Comment not found', 404);
    }

    return comments[0];
  } catch (error) {
    console.error('Error in getCommentById:', error);
    throw new CustomError(error.message || 'Failed to fetch comment');
  }
};

// ✅ CORRECTED: Using your db.query() wrapper
export const updateCommentById = async (commentId, updateData) => {
  try {
    const { comment, media = [] } = updateData;

    if (!commentId) {
      throw new CustomError('Comment ID is required', 400);
    }

    if (!comment || comment.trim().length === 0) {
      throw new CustomError('Comment text is required', 400);
    }

    const [media1, media2, media3] = media.slice(0, 3);

    const result = await db.query( // ✅ Your wrapper handles destructuring
      `UPDATE comments 
       SET comment = ?, 
           media_url1 = ?, media_type1 = ?,
           media_url2 = ?, media_type2 = ?,
           media_url3 = ?, media_type3 = ?,
           updatedAt = NOW()
       WHERE id = ?`,
      [
        comment.trim(),
        media1?.url || null, media1?.type || null,
        media2?.url || null, media2?.type || null,
        media3?.url || null, media3?.type || null,
        commentId
      ]
    );

    if (result.affectedRows === 0) {
      throw new CustomError('Failed to update comment', 500);
    }

    // Return updated comment
    return await getCommentById(commentId);
  } catch (error) {
    console.error('Error in updateCommentById:', error);
    throw new CustomError(error.message || 'Failed to update comment');
  }
};

// ✅ CORRECTED: Using your db.query() wrapper
export const deleteCommentById = async (commentId) => {
  try {
    if (!commentId) {
      throw new CustomError('Comment ID is required', 400);
    }

    const result = await db.query('DELETE FROM comments WHERE id = ?', [commentId]); // ✅ Your wrapper

    if (result.affectedRows === 0) {
      throw new CustomError('Comment not found', 404);
    }

    console.log(`Comment ${commentId} deleted successfully`);
    return { deleted: true, commentId };
  } catch (error) {
    console.error('Error in deleteCommentById:', error);
    throw new CustomError(error.message || 'Failed to delete comment');
  }
};

// ✅ CORRECTED: Using your db.query() wrapper
export const getCommentStats = async (filters = {}) => {
  try {
    const { user_id, startDate, endDate } = filters;

    let whereConditions = [];
    let params = [];

    if (user_id) {
      whereConditions.push('user_id = ?');
      params.push(user_id);
    }

    if (startDate) {
      whereConditions.push('createdAt >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('createdAt <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const rows = await db.query( // ✅ Your wrapper handles destructuring
      `SELECT 
         COUNT(*) as total_comments,
         COUNT(CASE WHEN chat_id IS NOT NULL THEN 1 END) as chat_comments,
         COUNT(CASE WHEN teaching_id IS NOT NULL THEN 1 END) as teaching_comments,
         COUNT(DISTINCT user_id) as unique_commenters,
         COUNT(CASE WHEN media_url1 IS NOT NULL OR media_url2 IS NOT NULL OR media_url3 IS NOT NULL THEN 1 END) as comments_with_media,
         MIN(createdAt) as first_comment,
         MAX(createdAt) as latest_comment
       FROM comments ${whereClause}`,
      params
    );

    return rows[0];
  } catch (error) {
    console.error('Error in getCommentStats:', error);
    throw new CustomError('Failed to get comment statistics');
  }
};


// // ikootaapi/services/commentServices.js
// import axios from 'axios';
// import db from '../config/db.js';
// import CustomError from "../utils/CustomError.js";
// import { uploadFileToS3 } from '../config/s3.js';

// // Working createCommentService - keep the core functionality, add minor enhancements
// export const createCommentService = async ({ user_id, chat_id, teaching_id, comment, media }) => {
//   const connection = await db.getConnection();
//   try {
//     await connection.beginTransaction();
//     console.log("Creating comment for:", user_id, chat_id, teaching_id, comment, media);
    
//     // Insert comment into the database
//     const result = await connection.query(
//       `INSERT INTO comments (user_id, chat_id, teaching_id, comment, media_url1, media_type1, media_url2, media_type2, media_url3, media_type3)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         user_id,
//         chat_id,
//         teaching_id,
//         comment,
//         media[0]?.url || null,
//         media[0]?.type || null,
//         media[1]?.url || null,
//         media[1]?.type || null,
//         media[2]?.url || null,
//         media[2]?.type || null,
//       ]
//     );

//     await connection.commit();
//     console.log(`Comment created successfully: ID ${result.insertId}`);
    
//     return { id: result.insertId };
//   } catch (error) {
//     await connection.rollback();
//     console.error('Error in createCommentService:', error);
//     throw new CustomError(error.message);
//   } finally {
//     connection.release();
//   }
// };

// // Working uploadCommentService - keep as is
// export const uploadCommentService = async (files) => {
//   try {
//     const uploadedFiles = await Promise.all(files.map(async (file) => {
//       const { url, type } = await uploadFileToS3(file);
//       return { url, type };
//     }));

//     return uploadedFiles;
//   } catch (error) {
//     throw new CustomError(error.message);
//   }
// };

// // Working getCommentsByUserId - keep simple, add basic enhancements
// export const getCommentsByUserId = async (user_id) => {
//   try {
//     const comments = await db.query(
//       'SELECT * FROM comments WHERE user_id = ? ORDER BY createdAt DESC', 
//       [user_id]
//     );
//     return comments;
//   } catch (error) {
//     console.error('Error in getCommentsByUserId:', error);
//     throw new CustomError(error.message);
//   }
// };

// // Working getChatAndTeachingIdsFromComments - keep as is, add safety checks
// export const getChatAndTeachingIdsFromComments = (comments) => {
//   try {
//     if (!Array.isArray(comments)) {
//       return { chatIds: [], teachingIds: [] };
//     }

//     const chatIds = [];
//     const teachingIds = [];

//     comments.forEach(comment => {
//       if (comment.chat_id && !chatIds.includes(comment.chat_id)) {
//         chatIds.push(comment.chat_id);
//       }
//       if (comment.teaching_id && !teachingIds.includes(comment.teaching_id)) {
//         teachingIds.push(comment.teaching_id);
//       }
//     });

//     return { chatIds, teachingIds };
//   } catch (error) {
//     console.error('Error in getChatAndTeachingIdsFromComments:', error);
//     return { chatIds: [], teachingIds: [] };
//   }
// };

// // Working getParentChatsAndTeachingsWithComments - keep working version with minor enhancements
// export const getParentChatsAndTeachingsWithComments = async (chatIds, teachingIds) => {
//   try {
//     let chatsBody = [];
//     let teachingBody = [];
//     let comments = [];

//     if (chatIds.length > 0) {
//       const [chats] = await db.query(
//         'SELECT *, prefixed_id FROM chats WHERE id IN (?) ORDER BY updatedAt DESC', 
//         [chatIds]
//       );
//       chatsBody = chats;
//     }

//     if (teachingIds.length > 0) {
//       const [teachings] = await db.query(
//         'SELECT *, prefixed_id FROM teachings WHERE id IN (?) ORDER BY updatedAt DESC', 
//         [teachingIds]
//       );
//       teachingBody = teachings;
//     }
      
//     // Get all comments for both chats and teachings
//     if (chatIds.length > 0 || teachingIds.length > 0) {
//       let commentQuery = 'SELECT * FROM comments WHERE ';
//       let queryParams = [];
//       let conditions = [];

//       if (chatIds.length > 0) {
//         conditions.push('chat_id IN (?)');
//         queryParams.push(chatIds);
//       }

//       if (teachingIds.length > 0) {
//         conditions.push('teaching_id IN (?)');
//         queryParams.push(teachingIds);
//       }

//       commentQuery += conditions.join(' OR ') + ' ORDER BY createdAt DESC';
//       const [allComments] = await db.query(commentQuery, queryParams);
//       comments = allComments;
//     }

//     return {
//       chats: chatsBody,
//       teachings: teachingBody,
//       comments: comments
//     };
//   } catch (error) {
//     console.error("Error fetching parent chats and teachings with comments:", error);
//     throw new CustomError("Internal Server Error");
//   }
// };

// // Working getCommentsByParentIds - enhanced with better validation
// export const getCommentsByParentIds = async (chatIds, teachingIds) => {
//   try {
//     // Handle both string and array inputs
//     const chatIdArray = chatIds ? 
//       (typeof chatIds === 'string' ? chatIds.split(',') : chatIds) : [];
//     const teachingIdArray = teachingIds ? 
//       (typeof teachingIds === 'string' ? teachingIds.split(',') : teachingIds) : [];

//     if (chatIdArray.length === 0 && teachingIdArray.length === 0) {
//       return [];
//     }

//     const comments = await db.query(
//       'SELECT * FROM comments WHERE chat_id IN (?) OR teaching_id IN (?) ORDER BY createdAt DESC',
//       [chatIdArray, teachingIdArray]
//     );
//     return comments;
//   } catch (error) {
//     console.error('Error in getCommentsByParentIds:', error);
//     throw new CustomError(error.message);
//   }
// };

// // Working getAllComments - keep simple with basic enhancements
// export const getAllComments = async () => {
//   try {
//     const comments = await db.query(
//       'SELECT * FROM comments ORDER BY createdAt DESC'
//     );
//     return comments;
//   } catch (error) {
//     console.error('Error in getAllComments:', error);
//     throw new CustomError(error.message);
//   }
// };

// // Simple getCommentById - basic version that works
// export const getCommentById = async (commentId) => {
//   try {
//     if (!commentId) {
//       throw new CustomError('Comment ID is required', 400);
//     }

//     const comments = await db.query(
//       `SELECT c.*, u.username, u.email,
//               ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
//               t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id,
//               CASE 
//                 WHEN c.chat_id IS NOT NULL THEN 'chat'
//                 WHEN c.teaching_id IS NOT NULL THEN 'teaching'
//                 ELSE 'unknown'
//               END as content_type
//        FROM comments c
//        LEFT JOIN users u ON c.user_id = u.id
//        LEFT JOIN chats ch ON c.chat_id = ch.id
//        LEFT JOIN teachings t ON c.teaching_id = t.id
//        WHERE c.id = ?`, 
//       [commentId]
//     );
    
//     if (comments.length === 0) {
//       throw new CustomError('Comment not found', 404);
//     }

//     return comments[0];
//   } catch (error) {
//     console.error('Error in getCommentById:', error);
//     throw new CustomError(error.message || 'Failed to fetch comment');
//   }
// };

// // Simple updateCommentById - basic version that works
// export const updateCommentById = async (commentId, updateData) => {
//   try {
//     const { comment, media = [] } = updateData;

//     if (!commentId) {
//       throw new CustomError('Comment ID is required', 400);
//     }

//     if (!comment || comment.trim().length === 0) {
//       throw new CustomError('Comment text is required', 400);
//     }

//     const [media1, media2, media3] = media.slice(0, 3);

//     const result = await db.query(
//       `UPDATE comments 
//        SET comment = ?, 
//            media_url1 = ?, media_type1 = ?,
//            media_url2 = ?, media_type2 = ?,
//            media_url3 = ?, media_type3 = ?,
//            updatedAt = NOW()
//        WHERE id = ?`,
//       [
//         comment.trim(),
//         media1?.url || null, media1?.type || null,
//         media2?.url || null, media2?.type || null,
//         media3?.url || null, media3?.type || null,
//         commentId
//       ]
//     );

//     if (result.affectedRows === 0) {
//       throw new CustomError('Failed to update comment', 500);
//     }

//     // Return updated comment
//     return await getCommentById(commentId);
//   } catch (error) {
//     console.error('Error in updateCommentById:', error);
//     throw new CustomError(error.message || 'Failed to update comment');
//   }
// };

// // Simple deleteCommentById - basic version that works
// export const deleteCommentById = async (commentId) => {
//   try {
//     if (!commentId) {
//       throw new CustomError('Comment ID is required', 400);
//     }

//     const result = await db.query('DELETE FROM comments WHERE id = ?', [commentId]);

//     if (result.affectedRows === 0) {
//       throw new CustomError('Comment not found', 404);
//     }

//     console.log(`Comment ${commentId} deleted successfully`);
//     return { deleted: true, commentId };
//   } catch (error) {
//     console.error('Error in deleteCommentById:', error);
//     throw new CustomError(error.message || 'Failed to delete comment');
//   }
// };

// // Simple getCommentStats - basic version that works
// export const getCommentStats = async (filters = {}) => {
//   try {
//     const { user_id, startDate, endDate } = filters;

//     let whereConditions = [];
//     let params = [];

//     if (user_id) {
//       whereConditions.push('user_id = ?');
//       params.push(user_id);
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

//     const rows = await db.query(
//       `SELECT 
//          COUNT(*) as total_comments,
//          COUNT(CASE WHEN chat_id IS NOT NULL THEN 1 END) as chat_comments,
//          COUNT(CASE WHEN teaching_id IS NOT NULL THEN 1 END) as teaching_comments,
//          COUNT(DISTINCT user_id) as unique_commenters,
//          COUNT(CASE WHEN media_url1 IS NOT NULL OR media_url2 IS NOT NULL OR media_url3 IS NOT NULL THEN 1 END) as comments_with_media,
//          MIN(createdAt) as first_comment,
//          MAX(createdAt) as latest_comment
//        FROM comments ${whereClause}`,
//       params
//     );

//     return rows[0];
//   } catch (error) {
//     console.error('Error in getCommentStats:', error);
//     throw new CustomError('Failed to get comment statistics');
//   }
// };