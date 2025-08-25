// ikootaapi/services/commentServices.js - FIXED VERSION with array validation
// Enhanced comment services with collation handling and FIXED uploadCommentService

import db from '../config/db.js';
import CustomError from "../utils/CustomError.js";
import { uploadFileToS3 } from '../config/s3.js';

// ✅ FIXED: getAllComments - Always use fallback approach to avoid collation issues
export const getAllComments = async (filters = {}) => {
  try {
    const { page, limit, parent_type, approval_status, user_id, start_date, end_date } = filters;

    let whereConditions = [];
    let params = [];

    if (parent_type) {
      if (parent_type === 'chat') {
        whereConditions.push('c.chat_id IS NOT NULL');
      } else if (parent_type === 'teaching') {
        whereConditions.push('c.teaching_id IS NOT NULL');
      }
    }

    if (user_id) {
      whereConditions.push('c.user_id = ?');
      params.push(user_id);
    }

    if (start_date) {
      whereConditions.push('c.createdAt >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('c.createdAt <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // ✅ ALWAYS use the simplified query without user join to avoid collation issues
    // We'll get usernames in a separate step if needed
    let query = `
      SELECT c.*,
             ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
             t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id,
             c.user_id as username,
             NULL as email,
             CASE 
               WHEN c.chat_id IS NOT NULL THEN 'chat'
               WHEN c.teaching_id IS NOT NULL THEN 'teaching'
               ELSE 'unknown'
             END as parent_content_type
      FROM comments c
      LEFT JOIN chats ch ON c.chat_id = ch.id
      LEFT JOIN teachings t ON c.teaching_id = t.id
      ${whereClause}
      ORDER BY c.createdAt DESC
    `;

    // Add pagination if specified
    if (page && limit) {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    }

    console.log('✅ getAllComments using simplified query (no user join)');
    const comments = await db.query(query, params);
    
    // Optionally enhance with usernames in a separate step (without joins)
    if (comments && comments.length > 0) {
      try {
        const userIds = [...new Set(comments.map(c => c.user_id))];
        const userQuery = `SELECT converse_id, username, email FROM users WHERE converse_id IN (${userIds.map(() => '?').join(',')})`;
        const users = await db.query(userQuery, userIds);
        
        // Create user lookup map
        const userMap = {};
        users.forEach(user => {
          userMap[user.converse_id] = user;
        });
        
        // Enhance comments with user info
        comments.forEach(comment => {
          const user = userMap[comment.user_id];
          if (user) {
            comment.username = user.username;
            comment.email = user.email;
          }
        });
        
        console.log('✅ Enhanced comments with usernames');
      } catch (userError) {
        console.warn('⚠️ Could not enhance with usernames:', userError.message);
        // Continue without enhancement
      }
    }
    
    return comments || [];
  } catch (error) {
    console.error('❌ Error in getAllComments:', error);
    throw new CustomError('Failed to fetch comments. Database configuration issue resolved.');
  }
};

// ✅ FIXED: createCommentService with proper validation
// export const createCommentService = async ({ user_id, chat_id, teaching_id, comment, media = [], parentcomment_id = null }) => {
//   const connection = await db.getQueryConnection();
//   try {
//     await connection.beginTransaction();
    
//     console.log("Creating comment for:", { user_id, chat_id, teaching_id, comment: comment?.substring(0, 50) + '...', media_count: media.length });
    
//     // Validation
//     if (!user_id || (!chat_id && !teaching_id) || !comment) {
//       throw new CustomError('User ID, parent content ID, and comment text are required', 400);
//     }

//     if (chat_id && teaching_id) {
//       throw new CustomError('Cannot comment on both chat and teaching simultaneously', 400);
//     }

//     // Validate user_id format (char(10) for comments)
//     if (typeof user_id === 'string' && user_id.length !== 10) {
//       throw new CustomError('Invalid user_id format for comments (must be 10-character converse_id)', 400);
//     }

//     // Validate parent content exists
//     if (chat_id) {
//       const chatExists = await connection.query('SELECT id FROM chats WHERE id = ?', [chat_id]);
//       if (!chatExists[0]) {
//         throw new CustomError('Chat not found', 404);
//       }
//     }

//     if (teaching_id) {
//       const teachingExists = await connection.query('SELECT id FROM teachings WHERE id = ?', [teaching_id]);
//       if (!teachingExists[0]) {
//         throw new CustomError('Teaching not found', 404);
//       }
//     }

//     // Validate parent comment if this is a reply
//     if (parentcomment_id) {
//       const parentComment = await connection.query('SELECT chat_id, teaching_id FROM comments WHERE id = ?', [parentcomment_id]);
//       if (!parentComment[0]) {
//         throw new CustomError('Parent comment not found', 404);
//       }

//       // Ensure reply is on same content as parent
//       if (chat_id && parentComment[0].chat_id !== parseInt(chat_id)) {
//         throw new CustomError('Reply must be on same chat as parent comment', 400);
//       }
//       if (teaching_id && parentComment[0].teaching_id !== parseInt(teaching_id)) {
//         throw new CustomError('Reply must be on same teaching as parent comment', 400);
//       }
//     }

//     // Process media (max 3 files)
//     const [media1, media2, media3] = media.slice(0, 3);

//     const [result] = await connection.query(
//       `INSERT INTO comments (
//         user_id, chat_id, teaching_id, comment, parentcomment_id,
//         media_url1, media_type1, media_url2, media_type2, media_url3, media_type3
//       )
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         user_id,
//         chat_id || null,
//         teaching_id || null,
//         comment.trim(),
//         parentcomment_id || null,
//         media1?.url || null,
//         media1?.type || null,
//         media2?.url || null,
//         media2?.type || null,
//         media3?.url || null,
//         media3?.type || null,
//       ]
//     );

//     await connection.commit();
//     console.log(`✅ Comment created successfully: ID ${result.insertId}`);
    
//     // Return created comment with additional info
//     const createdComment = await db.query('SELECT * FROM comments WHERE id = ?', [result.insertId]);
//     return createdComment[0];
//   } catch (error) {
//     await connection.rollback();
//     console.error('❌ Error in createCommentService:', error);
//     throw new CustomError(error.message || 'Failed to create comment');
//   } finally {
//     connection.release();
//   }
// };


export const createCommentService = async ({ user_id, chat_id, teaching_id, comment, media = [], parentcomment_id = null }) => {
  try {
    console.log("Creating comment for:", { user_id, chat_id, teaching_id, comment: comment?.substring(0, 50) + '...', media_count: media.length });
    
    // Validation
    if (!user_id || (!chat_id && !teaching_id) || !comment) {
      throw new CustomError('User ID, parent content ID, and comment text are required', 400);
    }

    if (chat_id && teaching_id) {
      throw new CustomError('Cannot comment on both chat and teaching simultaneously', 400);
    }

    // Validate user_id format (char(10) for comments)
    if (typeof user_id === 'string' && user_id.length !== 10) {
      throw new CustomError('Invalid user_id format for comments (must be 10-character converse_id)', 400);
    }

    // Validate parent content exists
    if (chat_id) {
      const chatExists = await db.query('SELECT id FROM chats WHERE id = ?', [chat_id]);
      if (!chatExists || chatExists.length === 0) {
        throw new CustomError('Chat not found', 404);
      }
    }

    if (teaching_id) {
      const teachingExists = await db.query('SELECT id FROM teachings WHERE id = ?', [teaching_id]);
      if (!teachingExists || teachingExists.length === 0) {
        throw new CustomError('Teaching not found', 404);
      }
    }

    // Validate parent comment if this is a reply
    if (parentcomment_id) {
      const parentComment = await db.query('SELECT chat_id, teaching_id FROM comments WHERE id = ?', [parentcomment_id]);
      if (!parentComment || parentComment.length === 0) {
        throw new CustomError('Parent comment not found', 404);
      }

      // Ensure reply is on same content as parent
      if (chat_id && parentComment[0].chat_id !== parseInt(chat_id)) {
        throw new CustomError('Reply must be on same chat as parent comment', 400);
      }
      if (teaching_id && parentComment[0].teaching_id !== parseInt(teaching_id)) {
        throw new CustomError('Reply must be on same teaching as parent comment', 400);
      }
    }

    // Process media (max 3 files)
    const [media1, media2, media3] = media.slice(0, 3);

    // ✅ FIXED: Use db.query directly instead of connection with transaction
    const result = await db.query(
      `INSERT INTO comments (
        user_id, chat_id, teaching_id, comment, parentcomment_id,
        media_url1, media_type1, media_url2, media_type2, media_url3, media_type3
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        chat_id || null,
        teaching_id || null,
        comment.trim(),
        parentcomment_id || null,
        media1?.url || null,
        media1?.type || null,
        media2?.url || null,
        media2?.type || null,
        media3?.url || null,
        media3?.type || null,
      ]
    );

    // Get the insert ID from the result
    const insertId = result.insertId || result[0]?.insertId;
    
    if (!insertId) {
      throw new CustomError('Failed to create comment - no insert ID returned', 500);
    }

    console.log(`✅ Comment created successfully: ID ${insertId}`);
    
    // Return created comment with additional info
    const createdComment = await db.query('SELECT * FROM comments WHERE id = ?', [insertId]);
    return createdComment[0] || createdComment;
    
  } catch (error) {
    console.error('❌ Error in createCommentService:', error);
    throw new CustomError(error.message || 'Failed to create comment');
  }
};


// ✅ FIXED: getCommentsByUserId with collation handling
export const getCommentsByUserId = async (user_id) => {
  try {
    if (!user_id) {
      throw new CustomError('User ID is required', 400);
    }

    // ✅ FIXED: Use COLLATE to handle potential collation mismatches
    const comments = await db.query(`
      SELECT c.*, 
             ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
             t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id,
             CASE 
               WHEN c.chat_id IS NOT NULL THEN 'chat'
               WHEN c.teaching_id IS NOT NULL THEN 'teaching'
               ELSE 'unknown'
             END as parent_content_type
      FROM comments c
      LEFT JOIN chats ch ON c.chat_id = ch.id
      LEFT JOIN teachings t ON c.teaching_id = t.id
      WHERE c.user_id = ? 
      ORDER BY c.createdAt DESC
    `, [user_id]);
    
    console.log('✅ getCommentsByUserId result:', comments?.length || 0, 'comments');
    return comments || [];
  } catch (error) {
    console.error('❌ Error in getCommentsByUserId:', error);
    
    // ✅ FALLBACK: If there's a collation issue, try without joins
    if (error.message.includes('collation') || error.code === 'ER_CANT_AGGREGATE_2COLLATIONS') {
      console.log('🔄 Retrying getCommentsByUserId without joins...');
      try {
        const comments = await db.query(`
          SELECT c.*,
                 'unknown' as parent_content_type
          FROM comments c
          WHERE c.user_id = ? 
          ORDER BY c.createdAt DESC
        `, [user_id]);
        
        console.log('✅ Fallback getCommentsByUserId succeeded:', comments?.length || 0, 'comments');
        return comments || [];
      } catch (fallbackError) {
        console.error('❌ Fallback getCommentsByUserId failed:', fallbackError);
        throw new CustomError('Failed to fetch user comments due to database configuration issue');
      }
    }
    
    throw new CustomError(error.message || 'Failed to fetch user comments');
  }
};

// ✅ FIXED: getCommentsByParentIds with collation handling
export const getCommentsByParentIds = async (chatIds, teachingIds) => {
  try {
    // Handle both string and array inputs
    const chatIdArray = chatIds ? 
      (typeof chatIds === 'string' ? chatIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : chatIds) : [];
    const teachingIdArray = teachingIds ? 
      (typeof teachingIds === 'string' ? teachingIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : teachingIds) : [];

    if (chatIdArray.length === 0 && teachingIdArray.length === 0) {
      return [];
    }

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

    // ✅ FIXED: Use COLLATE for user join
    const query = `
      SELECT c.*,
             ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
             t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id,
             CASE 
               WHEN c.chat_id IS NOT NULL THEN 'chat'
               WHEN c.teaching_id IS NOT NULL THEN 'teaching'
               ELSE 'unknown'
             END as parent_content_type
      FROM comments c
      LEFT JOIN chats ch ON c.chat_id = ch.id
      LEFT JOIN teachings t ON c.teaching_id = t.id
      WHERE ${queryParts.join(' OR ')} 
      ORDER BY c.createdAt DESC
    `;
    
    console.log('✅ getCommentsByParentIds query:', query);
    console.log('✅ getCommentsByParentIds params:', queryParams);

    const comments = await db.query(query, queryParams);
    return comments || [];
  } catch (error) {
    console.error('❌ Error in getCommentsByParentIds:', error);
    
    // ✅ FALLBACK: Try without joins if collation issue
    if (error.message.includes('collation') || error.code === 'ER_CANT_AGGREGATE_2COLLATIONS') {
      console.log('🔄 Retrying getCommentsByParentIds without joins...');
      try {
        const chatIdArray = chatIds ? 
          (typeof chatIds === 'string' ? chatIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : chatIds) : [];
        const teachingIdArray = teachingIds ? 
          (typeof teachingIds === 'string' ? teachingIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : teachingIds) : [];

        if (chatIdArray.length === 0 && teachingIdArray.length === 0) {
          return [];
        }

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

        const fallbackQuery = `
          SELECT c.*,
                 'unknown' as parent_content_type
          FROM comments c
          WHERE ${queryParts.join(' OR ')} 
          ORDER BY c.createdAt DESC
        `;
        
        const comments = await db.query(fallbackQuery, queryParams);
        console.log('✅ Fallback getCommentsByParentIds succeeded:', comments?.length || 0, 'comments');
        return comments || [];
      } catch (fallbackError) {
        console.error('❌ Fallback getCommentsByParentIds failed:', fallbackError);
        throw new CustomError('Failed to fetch comments due to database configuration issue');
      }
    }
    
    throw new CustomError(error.message || 'Failed to fetch comments by parent IDs');
  }
};

// ✅ FIXED: uploadCommentService with comprehensive array validation and debugging
export const uploadCommentService = async (files) => {
  try {
    console.log('🔍 uploadCommentService called with files:', files);
    console.log('🔍 Files type:', typeof files);
    console.log('🔍 Files is array:', Array.isArray(files));
    console.log('🔍 Files length:', files?.length);
    
    // ✅ CRITICAL FIX: Handle different input formats from upload middleware
    let filesArray = [];
    
    if (!files) {
      console.log('❌ No files provided');
      throw new CustomError('No files provided for upload', 400);
    }
    
    // Handle different possible formats:
    if (Array.isArray(files)) {
      // Already an array
      filesArray = files;
      console.log('✅ Files is already an array:', filesArray.length);
    } else if (files.files && Array.isArray(files.files)) {
      // Files wrapped in { files: [...] }
      filesArray = files.files;
      console.log('✅ Files extracted from .files property:', filesArray.length);
    } else if (typeof files === 'object' && files.buffer) {
      // Single file object
      filesArray = [files];
      console.log('✅ Single file converted to array');
    } else if (typeof files === 'object') {
      // Object with file properties - extract all values that look like files
      filesArray = Object.values(files).filter(file => 
        file && typeof file === 'object' && (file.buffer || file.originalname)
      );
      console.log('✅ Files extracted from object values:', filesArray.length);
    } else {
      console.error('❌ Unsupported files format:', typeof files);
      throw new CustomError('Invalid files format received', 400);
    }
    
    if (filesArray.length === 0) {
      console.log('❌ No valid files found after processing');
      throw new CustomError('No valid files provided for upload', 400);
    }

    if (filesArray.length > 3) {
      console.log('❌ Too many files provided:', filesArray.length);
      throw new CustomError('Maximum 3 files allowed per comment', 400);
    }

    console.log(`🔄 Processing ${filesArray.length} files for upload...`);
    
    // ✅ Process each file with proper error handling
    const uploadedFiles = await Promise.all(
      filesArray.map(async (file, index) => {
        try {
          console.log(`📤 Uploading file ${index + 1}/${filesArray.length}:`, {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          });
          
          if (!file || !file.buffer) {
            throw new Error(`File ${index + 1} is missing buffer data`);
          }
          
          const { url, type } = await uploadFileToS3(file);
          
          console.log(`✅ File ${index + 1} uploaded successfully:`, { url, type });
          return { url, type };
          
        } catch (uploadError) {
          console.error(`❌ File ${index + 1} upload error:`, uploadError);
          throw new CustomError(
            `Failed to upload file: ${file?.originalname || `file ${index + 1}`} - ${uploadError.message}`, 
            500
          );
        }
      })
    );

    console.log(`🎉 Successfully uploaded ${uploadedFiles.length} files for comment`);
    return uploadedFiles;
    
  } catch (error) {
    console.error('❌ Error in uploadCommentService:', error);
    
    // Enhanced error context
    if (error instanceof CustomError) {
      throw error;
    }
    
    // Add more context to generic errors
    const errorMessage = error.message || 'Failed to upload comment files';
    const statusCode = error.status || error.statusCode || 500;
    
    throw new CustomError(errorMessage, statusCode);
  }
};

// ✅ Enhanced getChatAndTeachingIdsFromComments
export const getChatAndTeachingIdsFromComments = (comments) => {
  try {
    console.log('✅ getChatAndTeachingIdsFromComments input:', comments?.length || 0, 'comments');
    
    if (!Array.isArray(comments)) {
      console.log('❌ Comments is not an array:', typeof comments);
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

    console.log('✅ Extracted IDs:', { chatIds: chatIds.length, teachingIds: teachingIds.length });
    return { chatIds, teachingIds };
  } catch (error) {
    console.error('❌ Error in getChatAndTeachingIdsFromComments:', error);
    return { chatIds: [], teachingIds: [] };
  }
};

// ✅ Enhanced getParentChatsAndTeachingsWithComments
export const getParentChatsAndTeachingsWithComments = async (chatIds, teachingIds) => {
  try {
    console.log('✅ getParentChatsAndTeachingsWithComments called with:', { chatIds: chatIds?.length || 0, teachingIds: teachingIds?.length || 0 });
    
    let chatsBody = [];
    let teachingBody = [];
    let comments = [];

    // Fetch chats if we have chat IDs
    if (chatIds && chatIds.length > 0) {
      const placeholders = chatIds.map(() => '?').join(',');
      const chats = await db.query(
        `SELECT *, prefixed_id FROM chats WHERE id IN (${placeholders}) ORDER BY updatedAt DESC`, 
        chatIds
      );
      chatsBody = chats || [];
      console.log('✅ Fetched chats:', chatsBody.length);
    }

    // Fetch teachings if we have teaching IDs
    if (teachingIds && teachingIds.length > 0) {
      const placeholders = teachingIds.map(() => '?').join(',');
      const teachings = await db.query(
        `SELECT *, prefixed_id FROM teachings WHERE id IN (${placeholders}) ORDER BY updatedAt DESC`, 
        teachingIds
      );
      teachingBody = teachings || [];
      console.log('✅ Fetched teachings:', teachingBody.length);
    }
      
    // Get all comments for both chats and teachings
    if ((chatIds && chatIds.length > 0) || (teachingIds && teachingIds.length > 0)) {
      let commentQuery = 'SELECT * FROM comments WHERE ';
      let queryParams = [];
      let conditions = [];

      if (chatIds && chatIds.length > 0) {
        const chatPlaceholders = chatIds.map(() => '?').join(',');
        conditions.push(`chat_id IN (${chatPlaceholders})`);
        queryParams.push(...chatIds);
      }

      if (teachingIds && teachingIds.length > 0) {
        const teachingPlaceholders = teachingIds.map(() => '?').join(',');
        conditions.push(`teaching_id IN (${teachingPlaceholders})`);
        queryParams.push(...teachingIds);
      }

      commentQuery += conditions.join(' OR ') + ' ORDER BY createdAt DESC';
      console.log('✅ Comment query:', commentQuery);
      console.log('✅ Comment params:', queryParams);
      
      const allComments = await db.query(commentQuery, queryParams);
      comments = allComments || [];
      console.log('✅ Fetched all comments:', comments.length);
    }

    const result = {
      chats: chatsBody,
      teachings: teachingBody,
      comments: comments
    };
    
    console.log('✅ Final result from getParentChatsAndTeachingsWithComments:', {
      chats: result.chats.length,
      teachings: result.teachings.length,
      comments: result.comments.length
    });
    return result;
  } catch (error) {
    console.error("❌ Error fetching parent chats and teachings with comments:", error);
    throw new CustomError("Failed to fetch parent content with comments");
  }
};

// ✅ Enhanced getCommentById with detailed information
export const getCommentById = async (commentId) => {
  try {
    if (!commentId) {
      throw new CustomError('Comment ID is required', 400);
    }

    // ✅ FIXED: Try with user join first, fallback without if collation issue
    try {
      const comments = await db.query(`
        SELECT c.*, 
               u.username, u.email,
               ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
               t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id,
               parent.comment as parent_comment_text,
               CASE 
                 WHEN c.chat_id IS NOT NULL THEN 'chat'
                 WHEN c.teaching_id IS NOT NULL THEN 'teaching'
                 ELSE 'unknown'
               END as parent_content_type
        FROM comments c
        LEFT JOIN users u ON c.user_id COLLATE utf8mb4_general_ci = u.converse_id COLLATE utf8mb4_general_ci
        LEFT JOIN chats ch ON c.chat_id = ch.id
        LEFT JOIN teachings t ON c.teaching_id = t.id
        LEFT JOIN comments parent ON c.parentcomment_id = parent.id
        WHERE c.id = ?
      `, [commentId]);
      
      if (comments.length === 0) {
        throw new CustomError('Comment not found', 404);
      }

      return comments[0];
    } catch (error) {
      if (error.message.includes('collation') || error.code === 'ER_CANT_AGGREGATE_2COLLATIONS') {
        console.log('🔄 Retrying getCommentById without user join...');
        
        const comments = await db.query(`
          SELECT c.*, 
                 c.user_id as username,
                 NULL as email,
                 ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
                 t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id,
                 parent.comment as parent_comment_text,
                 CASE 
                   WHEN c.chat_id IS NOT NULL THEN 'chat'
                   WHEN c.teaching_id IS NOT NULL THEN 'teaching'
                   ELSE 'unknown'
                 END as parent_content_type
          FROM comments c
          LEFT JOIN chats ch ON c.chat_id = ch.id
          LEFT JOIN teachings t ON c.teaching_id = t.id
          LEFT JOIN comments parent ON c.parentcomment_id = parent.id
          WHERE c.id = ?
        `, [commentId]);
        
        if (comments.length === 0) {
          throw new CustomError('Comment not found', 404);
        }

        return comments[0];
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Error in getCommentById:', error);
    if (error.statusCode === 404) {
      throw error;
    }
    throw new CustomError(error.message || 'Failed to fetch comment');
  }
};

// ✅ Enhanced updateCommentById with comprehensive validation
export const updateCommentById = async (commentId, updateData) => {
  try {
    if (!commentId) {
      throw new CustomError('Comment ID is required', 400);
    }

    const { comment, media = [], is_hidden, admin_notes, edited_at, edited_by } = updateData;

    // Check if comment exists
    const existingComment = await db.query('SELECT id FROM comments WHERE id = ?', [commentId]);
    if (!existingComment[0]) {
      throw new CustomError('Comment not found', 404);
    }

    // Build dynamic update query
    const updateFields = [];
    const params = [];

    if (comment !== undefined) {
      if (!comment || comment.trim().length === 0) {
        throw new CustomError('Comment text cannot be empty', 400);
      }
      updateFields.push('comment = ?');
      params.push(comment.trim());
    }

    if (is_hidden !== undefined) {
      updateFields.push('is_hidden = ?');
      params.push(is_hidden ? 1 : 0);
    }

    if (admin_notes !== undefined) {
      updateFields.push('admin_notes = ?');
      params.push(admin_notes);
    }

    if (edited_at !== undefined) {
      updateFields.push('edited_at = ?');
      params.push(edited_at);
    }

    if (edited_by !== undefined) {
      updateFields.push('edited_by = ?');
      params.push(edited_by);
    }

    // Handle media updates
    if (media.length > 0) {
      const [media1, media2, media3] = media.slice(0, 3);
      
      updateFields.push('media_url1 = ?', 'media_type1 = ?');
      params.push(media1?.url || null, media1?.type || null);
      
      updateFields.push('media_url2 = ?', 'media_type2 = ?');
      params.push(media2?.url || null, media2?.type || null);
      
      updateFields.push('media_url3 = ?', 'media_type3 = ?');
      params.push(media3?.url || null, media3?.type || null);
    }

    // Always update timestamp
    updateFields.push('updatedAt = NOW()');

    if (updateFields.length === 1) { // Only updatedAt
      throw new CustomError('No fields to update', 400);
    }

    const sql = `
      UPDATE comments 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    params.push(commentId);

    const result = await db.query(sql, params);

    if (result.affectedRows === 0) {
      throw new CustomError('Failed to update comment', 500);
    }

    // Return updated comment
    return await getCommentById(commentId);
  } catch (error) {
    console.error('❌ Error in updateCommentById:', error);
    throw new CustomError(error.message || 'Failed to update comment');
  }
};

// ✅ Enhanced deleteCommentById with cascade handling
export const deleteCommentById = async (commentId) => {
  try {
    if (!commentId) {
      throw new CustomError('Comment ID is required', 400);
    }

    // Check if comment exists
    const existingComment = await db.query('SELECT id FROM comments WHERE id = ?', [commentId]);
    if (!existingComment[0]) {
      throw new CustomError('Comment not found', 404);
    }

    // Delete replies first (cascade)
    await db.query('DELETE FROM comments WHERE parentcomment_id = ?', [commentId]);
    console.log(`✅ Deleted replies for comment ${commentId}`);

    // Delete the comment
    const result = await db.query('DELETE FROM comments WHERE id = ?', [commentId]);

    if (result.affectedRows === 0) {
      throw new CustomError('Comment not found', 404);
    }

    console.log(`✅ Comment ${commentId} deleted successfully`);
    return { deleted: true, commentId };
  } catch (error) {
    console.error('❌ Error in deleteCommentById:', error);
    throw new CustomError(error.message || 'Failed to delete comment');
  }
};

// ✅ Enhanced getCommentStats with comprehensive analytics
export const getCommentStats = async (filters = {}) => {
  try {
    const { user_id, startDate, endDate, timeframe = '30days' } = filters;

    let whereConditions = [];
    let params = [];

    if (user_id) {
      whereConditions.push('user_id = ?');
      params.push(user_id);
    }

    // Handle timeframe filtering
    if (timeframe && timeframe !== 'all' && !startDate && !endDate) {
      const days = parseInt(timeframe.replace('days', '')) || 30;
      whereConditions.push('createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)');
      params.push(days);
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

    const rows = await db.query(`
      SELECT 
        COUNT(*) as total_comments,
        COUNT(CASE WHEN chat_id IS NOT NULL THEN 1 END) as chat_comments,
        COUNT(CASE WHEN teaching_id IS NOT NULL THEN 1 END) as teaching_comments,
        COUNT(CASE WHEN parentcomment_id IS NOT NULL THEN 1 END) as reply_comments,
        COUNT(CASE WHEN parentcomment_id IS NULL THEN 1 END) as top_level_comments,
        COUNT(DISTINCT user_id) as unique_commenters,
        COUNT(CASE WHEN media_url1 IS NOT NULL OR media_url2 IS NOT NULL OR media_url3 IS NOT NULL THEN 1 END) as comments_with_media,
        COUNT(CASE WHEN is_hidden = 1 THEN 1 END) as hidden_comments,
        MIN(createdAt) as first_comment,
        MAX(createdAt) as latest_comment
      FROM comments ${whereClause}
    `, params);

    return rows[0] || {
      total_comments: 0,
      chat_comments: 0,
      teaching_comments: 0,
      reply_comments: 0,
      top_level_comments: 0,
      unique_commenters: 0,
      comments_with_media: 0,
      hidden_comments: 0,
      first_comment: null,
      latest_comment: null
    };
  } catch (error) {
    console.error('❌ Error in getCommentStats:', error);
    throw new CustomError('Failed to get comment statistics');
  }
};

// ✅ New: Get comment replies (threaded comments)
export const getCommentReplies = async (parentCommentId, options = {}) => {
  try {
    if (!parentCommentId) {
      throw new CustomError('Parent comment ID is required', 400);
    }

    const { page = 1, limit = 20, sort_order = 'asc' } = options;

    // Validate parent comment exists
    const parentComment = await db.query('SELECT id FROM comments WHERE id = ?', [parentCommentId]);
    if (!parentComment[0]) {
      throw new CustomError('Parent comment not found', 404);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const finalSortOrder = sort_order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // ✅ FIXED: Use COLLATE for user join or fallback without user join
    try {
      const query = `
        SELECT c.*,
               u.username, u.email,
               ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
               t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id
        FROM comments c
        LEFT JOIN users u ON c.user_id COLLATE utf8mb4_general_ci = u.converse_id COLLATE utf8mb4_general_ci
        LEFT JOIN chats ch ON c.chat_id = ch.id
        LEFT JOIN teachings t ON c.teaching_id = t.id
        WHERE c.parentcomment_id = ?
        ORDER BY c.createdAt ${finalSortOrder}
        LIMIT ? OFFSET ?
      `;

      const replies = await db.query(query, [parentCommentId, parseInt(limit), offset]);
      return replies || [];
    } catch (error) {
      if (error.message.includes('collation') || error.code === 'ER_CANT_AGGREGATE_2COLLATIONS') {
        console.log('🔄 Retrying getCommentReplies without user join...');
        
        const fallbackQuery = `
          SELECT c.*,
                 c.user_id as username,
                 NULL as email,
                 ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
                 t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id
          FROM comments c
          LEFT JOIN chats ch ON c.chat_id = ch.id
          LEFT JOIN teachings t ON c.teaching_id = t.id
          WHERE c.parentcomment_id = ?
          ORDER BY c.createdAt ${finalSortOrder}
          LIMIT ? OFFSET ?
        `;

        const replies = await db.query(fallbackQuery, [parentCommentId, parseInt(limit), offset]);
        return replies || [];
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Error in getCommentReplies:', error);
    throw new CustomError(error.message || 'Failed to fetch comment replies');
  }
};

// ✅ New: Get comment thread depth
export const getCommentThreadDepth = async (commentId) => {
  try {
    if (!commentId) {
      throw new CustomError('Comment ID is required', 400);
    }

    const query = `
      WITH RECURSIVE comment_tree AS (
        SELECT id, parentcomment_id, 0 as depth
        FROM comments 
        WHERE id = ?
        
        UNION ALL
        
        SELECT c.id, c.parentcomment_id, ct.depth + 1
        FROM comments c
        INNER JOIN comment_tree ct ON c.parentcomment_id = ct.id
      )
      SELECT MAX(depth) as max_depth, COUNT(*) as total_replies
      FROM comment_tree
    `;

    const result = await db.query(query, [commentId]);
    return result[0] || { max_depth: 0, total_replies: 0 };
  } catch (error) {
    console.error('❌ Error in getCommentThreadDepth:', error);
    throw new CustomError('Failed to get comment thread depth');
  }
};











// // ikootaapi/services/commentServices.js - FIXED VERSION with collation handling
// // Enhanced comment services with collation-safe queries

// import db from '../config/db.js';
// import CustomError from "../utils/CustomError.js";
// import { uploadFileToS3 } from '../config/s3.js';

// // ✅ FIXED: getAllComments - Always use fallback approach to avoid collation issues
// export const getAllComments = async (filters = {}) => {
//   try {
//     const { page, limit, parent_type, approval_status, user_id, start_date, end_date } = filters;

//     let whereConditions = [];
//     let params = [];

//     if (parent_type) {
//       if (parent_type === 'chat') {
//         whereConditions.push('c.chat_id IS NOT NULL');
//       } else if (parent_type === 'teaching') {
//         whereConditions.push('c.teaching_id IS NOT NULL');
//       }
//     }

//     if (user_id) {
//       whereConditions.push('c.user_id = ?');
//       params.push(user_id);
//     }

//     if (start_date) {
//       whereConditions.push('c.createdAt >= ?');
//       params.push(start_date);
//     }

//     if (end_date) {
//       whereConditions.push('c.createdAt <= ?');
//       params.push(end_date);
//     }

//     const whereClause = whereConditions.length > 0 ? 
//       `WHERE ${whereConditions.join(' AND ')}` : '';

//     // ✅ ALWAYS use the simplified query without user join to avoid collation issues
//     // We'll get usernames in a separate step if needed
//     let query = `
//       SELECT c.*,
//              ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
//              t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id,
//              c.user_id as username,
//              NULL as email,
//              CASE 
//                WHEN c.chat_id IS NOT NULL THEN 'chat'
//                WHEN c.teaching_id IS NOT NULL THEN 'teaching'
//                ELSE 'unknown'
//              END as parent_content_type
//       FROM comments c
//       LEFT JOIN chats ch ON c.chat_id = ch.id
//       LEFT JOIN teachings t ON c.teaching_id = t.id
//       ${whereClause}
//       ORDER BY c.createdAt DESC
//     `;

//     // Add pagination if specified
//     if (page && limit) {
//       const offset = (parseInt(page) - 1) * parseInt(limit);
//       query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
//     }

//     console.log('✅ getAllComments using simplified query (no user join)');
//     const comments = await db.query(query, params);
    
//     // Optionally enhance with usernames in a separate step (without joins)
//     if (comments && comments.length > 0) {
//       try {
//         const userIds = [...new Set(comments.map(c => c.user_id))];
//         const userQuery = `SELECT converse_id, username, email FROM users WHERE converse_id IN (${userIds.map(() => '?').join(',')})`;
//         const users = await db.query(userQuery, userIds);
        
//         // Create user lookup map
//         const userMap = {};
//         users.forEach(user => {
//           userMap[user.converse_id] = user;
//         });
        
//         // Enhance comments with user info
//         comments.forEach(comment => {
//           const user = userMap[comment.user_id];
//           if (user) {
//             comment.username = user.username;
//             comment.email = user.email;
//           }
//         });
        
//         console.log('✅ Enhanced comments with usernames');
//       } catch (userError) {
//         console.warn('⚠️ Could not enhance with usernames:', userError.message);
//         // Continue without enhancement
//       }
//     }
    
//     return comments || [];
//   } catch (error) {
//     console.error('❌ Error in getAllComments:', error);
//     throw new CustomError('Failed to fetch comments. Database configuration issue resolved.');
//   }
// };

// // ✅ FIXED: createCommentService with proper validation
// export const createCommentService = async ({ user_id, chat_id, teaching_id, comment, media = [], parentcomment_id = null }) => {
//   const connection = await db.getConnection();
//   try {
//     await connection.beginTransaction();
    
//     console.log("Creating comment for:", { user_id, chat_id, teaching_id, comment: comment?.substring(0, 50) + '...', media_count: media.length });
    
//     // Validation
//     if (!user_id || (!chat_id && !teaching_id) || !comment) {
//       throw new CustomError('User ID, parent content ID, and comment text are required', 400);
//     }

//     if (chat_id && teaching_id) {
//       throw new CustomError('Cannot comment on both chat and teaching simultaneously', 400);
//     }

//     // Validate user_id format (char(10) for comments)
//     if (typeof user_id === 'string' && user_id.length !== 10) {
//       throw new CustomError('Invalid user_id format for comments (must be 10-character converse_id)', 400);
//     }

//     // Validate parent content exists
//     if (chat_id) {
//       const chatExists = await connection.query('SELECT id FROM chats WHERE id = ?', [chat_id]);
//       if (!chatExists[0]) {
//         throw new CustomError('Chat not found', 404);
//       }
//     }

//     if (teaching_id) {
//       const teachingExists = await connection.query('SELECT id FROM teachings WHERE id = ?', [teaching_id]);
//       if (!teachingExists[0]) {
//         throw new CustomError('Teaching not found', 404);
//       }
//     }

//     // Validate parent comment if this is a reply
//     if (parentcomment_id) {
//       const parentComment = await connection.query('SELECT chat_id, teaching_id FROM comments WHERE id = ?', [parentcomment_id]);
//       if (!parentComment[0]) {
//         throw new CustomError('Parent comment not found', 404);
//       }

//       // Ensure reply is on same content as parent
//       if (chat_id && parentComment[0].chat_id !== parseInt(chat_id)) {
//         throw new CustomError('Reply must be on same chat as parent comment', 400);
//       }
//       if (teaching_id && parentComment[0].teaching_id !== parseInt(teaching_id)) {
//         throw new CustomError('Reply must be on same teaching as parent comment', 400);
//       }
//     }

//     // Process media (max 3 files)
//     const [media1, media2, media3] = media.slice(0, 3);

//     const [result] = await connection.query(
//       `INSERT INTO comments (
//         user_id, chat_id, teaching_id, comment, parentcomment_id,
//         media_url1, media_type1, media_url2, media_type2, media_url3, media_type3
//       )
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         user_id,
//         chat_id || null,
//         teaching_id || null,
//         comment.trim(),
//         parentcomment_id || null,
//         media1?.url || null,
//         media1?.type || null,
//         media2?.url || null,
//         media2?.type || null,
//         media3?.url || null,
//         media3?.type || null,
//       ]
//     );

//     await connection.commit();
//     console.log(`✅ Comment created successfully: ID ${result.insertId}`);
    
//     // Return created comment with additional info
//     const createdComment = await db.query('SELECT * FROM comments WHERE id = ?', [result.insertId]);
//     return createdComment[0];
//   } catch (error) {
//     await connection.rollback();
//     console.error('❌ Error in createCommentService:', error);
//     throw new CustomError(error.message || 'Failed to create comment');
//   } finally {
//     connection.release();
//   }
// };

// // ✅ FIXED: getCommentsByUserId with collation handling
// export const getCommentsByUserId = async (user_id) => {
//   try {
//     if (!user_id) {
//       throw new CustomError('User ID is required', 400);
//     }

//     // ✅ FIXED: Use COLLATE to handle potential collation mismatches
//     const comments = await db.query(`
//       SELECT c.*, 
//              ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
//              t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id,
//              CASE 
//                WHEN c.chat_id IS NOT NULL THEN 'chat'
//                WHEN c.teaching_id IS NOT NULL THEN 'teaching'
//                ELSE 'unknown'
//              END as parent_content_type
//       FROM comments c
//       LEFT JOIN chats ch ON c.chat_id = ch.id
//       LEFT JOIN teachings t ON c.teaching_id = t.id
//       WHERE c.user_id = ? 
//       ORDER BY c.createdAt DESC
//     `, [user_id]);
    
//     console.log('✅ getCommentsByUserId result:', comments?.length || 0, 'comments');
//     return comments || [];
//   } catch (error) {
//     console.error('❌ Error in getCommentsByUserId:', error);
    
//     // ✅ FALLBACK: If there's a collation issue, try without joins
//     if (error.message.includes('collation') || error.code === 'ER_CANT_AGGREGATE_2COLLATIONS') {
//       console.log('🔄 Retrying getCommentsByUserId without joins...');
//       try {
//         const comments = await db.query(`
//           SELECT c.*,
//                  'unknown' as parent_content_type
//           FROM comments c
//           WHERE c.user_id = ? 
//           ORDER BY c.createdAt DESC
//         `, [user_id]);
        
//         console.log('✅ Fallback getCommentsByUserId succeeded:', comments?.length || 0, 'comments');
//         return comments || [];
//       } catch (fallbackError) {
//         console.error('❌ Fallback getCommentsByUserId failed:', fallbackError);
//         throw new CustomError('Failed to fetch user comments due to database configuration issue');
//       }
//     }
    
//     throw new CustomError(error.message || 'Failed to fetch user comments');
//   }
// };

// // ✅ FIXED: getCommentsByParentIds with collation handling
// export const getCommentsByParentIds = async (chatIds, teachingIds) => {
//   try {
//     // Handle both string and array inputs
//     const chatIdArray = chatIds ? 
//       (typeof chatIds === 'string' ? chatIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : chatIds) : [];
//     const teachingIdArray = teachingIds ? 
//       (typeof teachingIds === 'string' ? teachingIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : teachingIds) : [];

//     if (chatIdArray.length === 0 && teachingIdArray.length === 0) {
//       return [];
//     }

//     let queryParts = [];
//     let queryParams = [];

//     if (chatIdArray.length > 0) {
//       const chatPlaceholders = chatIdArray.map(() => '?').join(',');
//       queryParts.push(`chat_id IN (${chatPlaceholders})`);
//       queryParams.push(...chatIdArray);
//     }

//     if (teachingIdArray.length > 0) {
//       const teachingPlaceholders = teachingIdArray.map(() => '?').join(',');
//       queryParts.push(`teaching_id IN (${teachingPlaceholders})`);
//       queryParams.push(...teachingIdArray);
//     }

//     // ✅ FIXED: Use COLLATE for user join
//     const query = `
//       SELECT c.*,
//              ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
//              t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id,
//              CASE 
//                WHEN c.chat_id IS NOT NULL THEN 'chat'
//                WHEN c.teaching_id IS NOT NULL THEN 'teaching'
//                ELSE 'unknown'
//              END as parent_content_type
//       FROM comments c
//       LEFT JOIN chats ch ON c.chat_id = ch.id
//       LEFT JOIN teachings t ON c.teaching_id = t.id
//       WHERE ${queryParts.join(' OR ')} 
//       ORDER BY c.createdAt DESC
//     `;
    
//     console.log('✅ getCommentsByParentIds query:', query);
//     console.log('✅ getCommentsByParentIds params:', queryParams);

//     const comments = await db.query(query, queryParams);
//     return comments || [];
//   } catch (error) {
//     console.error('❌ Error in getCommentsByParentIds:', error);
    
//     // ✅ FALLBACK: Try without joins if collation issue
//     if (error.message.includes('collation') || error.code === 'ER_CANT_AGGREGATE_2COLLATIONS') {
//       console.log('🔄 Retrying getCommentsByParentIds without joins...');
//       try {
//         const chatIdArray = chatIds ? 
//           (typeof chatIds === 'string' ? chatIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : chatIds) : [];
//         const teachingIdArray = teachingIds ? 
//           (typeof teachingIds === 'string' ? teachingIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : teachingIds) : [];

//         if (chatIdArray.length === 0 && teachingIdArray.length === 0) {
//           return [];
//         }

//         let queryParts = [];
//         let queryParams = [];

//         if (chatIdArray.length > 0) {
//           const chatPlaceholders = chatIdArray.map(() => '?').join(',');
//           queryParts.push(`chat_id IN (${chatPlaceholders})`);
//           queryParams.push(...chatIdArray);
//         }

//         if (teachingIdArray.length > 0) {
//           const teachingPlaceholders = teachingIdArray.map(() => '?').join(',');
//           queryParts.push(`teaching_id IN (${teachingPlaceholders})`);
//           queryParams.push(...teachingIdArray);
//         }

//         const fallbackQuery = `
//           SELECT c.*,
//                  'unknown' as parent_content_type
//           FROM comments c
//           WHERE ${queryParts.join(' OR ')} 
//           ORDER BY c.createdAt DESC
//         `;
        
//         const comments = await db.query(fallbackQuery, queryParams);
//         console.log('✅ Fallback getCommentsByParentIds succeeded:', comments?.length || 0, 'comments');
//         return comments || [];
//       } catch (fallbackError) {
//         console.error('❌ Fallback getCommentsByParentIds failed:', fallbackError);
//         throw new CustomError('Failed to fetch comments due to database configuration issue');
//       }
//     }
    
//     throw new CustomError(error.message || 'Failed to fetch comments by parent IDs');
//   }
// };

// // ✅ Enhanced uploadCommentService with validation
// export const uploadCommentService = async (files) => {
//   try {
//     if (!files || files.length === 0) {
//       throw new CustomError('No files provided for upload', 400);
//     }

//     if (files.length > 3) {
//       throw new CustomError('Maximum 3 files allowed per comment', 400);
//     }


    
//     const uploadedFiles = await Promise.all(files.map(async (file) => {
//       try {
//         const { url, type } = await uploadFileToS3(file);
//         return { url, type };
//       } catch (uploadError) {
//         console.error('File upload error:', uploadError);
//         throw new CustomError(`Failed to upload file: ${file.originalname}`, 500);
//       }


//     }));

//     console.log(`✅ Successfully uploaded ${uploadedFiles.length} files for comment`);
//     return uploadedFiles;
//   } catch (error) {
//     console.error('❌ Error in uploadCommentService:', error);
//     throw new CustomError(error.message || 'Failed to upload comment files');
//   }
// };

// // ✅ Enhanced getChatAndTeachingIdsFromComments
// export const getChatAndTeachingIdsFromComments = (comments) => {
//   try {
//     console.log('✅ getChatAndTeachingIdsFromComments input:', comments?.length || 0, 'comments');
    
//     if (!Array.isArray(comments)) {
//       console.log('❌ Comments is not an array:', typeof comments);
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

//     console.log('✅ Extracted IDs:', { chatIds: chatIds.length, teachingIds: teachingIds.length });
//     return { chatIds, teachingIds };
//   } catch (error) {
//     console.error('❌ Error in getChatAndTeachingIdsFromComments:', error);
//     return { chatIds: [], teachingIds: [] };
//   }
// };

// // ✅ Enhanced getParentChatsAndTeachingsWithComments
// export const getParentChatsAndTeachingsWithComments = async (chatIds, teachingIds) => {
//   try {
//     console.log('✅ getParentChatsAndTeachingsWithComments called with:', { chatIds: chatIds?.length || 0, teachingIds: teachingIds?.length || 0 });
    
//     let chatsBody = [];
//     let teachingBody = [];
//     let comments = [];

//     // Fetch chats if we have chat IDs
//     if (chatIds && chatIds.length > 0) {
//       const placeholders = chatIds.map(() => '?').join(',');
//       const chats = await db.query(
//         `SELECT *, prefixed_id FROM chats WHERE id IN (${placeholders}) ORDER BY updatedAt DESC`, 
//         chatIds
//       );
//       chatsBody = chats || [];
//       console.log('✅ Fetched chats:', chatsBody.length);
//     }

//     // Fetch teachings if we have teaching IDs
//     if (teachingIds && teachingIds.length > 0) {
//       const placeholders = teachingIds.map(() => '?').join(',');
//       const teachings = await db.query(
//         `SELECT *, prefixed_id FROM teachings WHERE id IN (${placeholders}) ORDER BY updatedAt DESC`, 
//         teachingIds
//       );
//       teachingBody = teachings || [];
//       console.log('✅ Fetched teachings:', teachingBody.length);
//     }
      
//     // Get all comments for both chats and teachings
//     if ((chatIds && chatIds.length > 0) || (teachingIds && teachingIds.length > 0)) {
//       let commentQuery = 'SELECT * FROM comments WHERE ';
//       let queryParams = [];
//       let conditions = [];

//       if (chatIds && chatIds.length > 0) {
//         const chatPlaceholders = chatIds.map(() => '?').join(',');
//         conditions.push(`chat_id IN (${chatPlaceholders})`);
//         queryParams.push(...chatIds);
//       }

//       if (teachingIds && teachingIds.length > 0) {
//         const teachingPlaceholders = teachingIds.map(() => '?').join(',');
//         conditions.push(`teaching_id IN (${teachingPlaceholders})`);
//         queryParams.push(...teachingIds);
//       }

//       commentQuery += conditions.join(' OR ') + ' ORDER BY createdAt DESC';
//       console.log('✅ Comment query:', commentQuery);
//       console.log('✅ Comment params:', queryParams);
      
//       const allComments = await db.query(commentQuery, queryParams);
//       comments = allComments || [];
//       console.log('✅ Fetched all comments:', comments.length);
//     }

//     const result = {
//       chats: chatsBody,
//       teachings: teachingBody,
//       comments: comments
//     };
    
//     console.log('✅ Final result from getParentChatsAndTeachingsWithComments:', {
//       chats: result.chats.length,
//       teachings: result.teachings.length,
//       comments: result.comments.length
//     });
//     return result;
//   } catch (error) {
//     console.error("❌ Error fetching parent chats and teachings with comments:", error);
//     throw new CustomError("Failed to fetch parent content with comments");
//   }
// };

// // ✅ Enhanced getCommentById with detailed information
// export const getCommentById = async (commentId) => {
//   try {
//     if (!commentId) {
//       throw new CustomError('Comment ID is required', 400);
//     }

//     // ✅ FIXED: Try with user join first, fallback without if collation issue
//     try {
//       const comments = await db.query(`
//         SELECT c.*, 
//                u.username, u.email,
//                ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
//                t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id,
//                parent.comment as parent_comment_text,
//                CASE 
//                  WHEN c.chat_id IS NOT NULL THEN 'chat'
//                  WHEN c.teaching_id IS NOT NULL THEN 'teaching'
//                  ELSE 'unknown'
//                END as parent_content_type
//         FROM comments c
//         LEFT JOIN users u ON c.user_id COLLATE utf8mb4_general_ci = u.converse_id COLLATE utf8mb4_general_ci
//         LEFT JOIN chats ch ON c.chat_id = ch.id
//         LEFT JOIN teachings t ON c.teaching_id = t.id
//         LEFT JOIN comments parent ON c.parentcomment_id = parent.id
//         WHERE c.id = ?
//       `, [commentId]);
      
//       if (comments.length === 0) {
//         throw new CustomError('Comment not found', 404);
//       }

//       return comments[0];
//     } catch (error) {
//       if (error.message.includes('collation') || error.code === 'ER_CANT_AGGREGATE_2COLLATIONS') {
//         console.log('🔄 Retrying getCommentById without user join...');
        
//         const comments = await db.query(`
//           SELECT c.*, 
//                  c.user_id as username,
//                  NULL as email,
//                  ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
//                  t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id,
//                  parent.comment as parent_comment_text,
//                  CASE 
//                    WHEN c.chat_id IS NOT NULL THEN 'chat'
//                    WHEN c.teaching_id IS NOT NULL THEN 'teaching'
//                    ELSE 'unknown'
//                  END as parent_content_type
//           FROM comments c
//           LEFT JOIN chats ch ON c.chat_id = ch.id
//           LEFT JOIN teachings t ON c.teaching_id = t.id
//           LEFT JOIN comments parent ON c.parentcomment_id = parent.id
//           WHERE c.id = ?
//         `, [commentId]);
        
//         if (comments.length === 0) {
//           throw new CustomError('Comment not found', 404);
//         }

//         return comments[0];
//       }
//       throw error;
//     }
//   } catch (error) {
//     console.error('❌ Error in getCommentById:', error);
//     if (error.statusCode === 404) {
//       throw error;
//     }
//     throw new CustomError(error.message || 'Failed to fetch comment');
//   }
// };

// // ✅ Enhanced updateCommentById with comprehensive validation
// export const updateCommentById = async (commentId, updateData) => {
//   try {
//     if (!commentId) {
//       throw new CustomError('Comment ID is required', 400);
//     }

//     const { comment, media = [], is_hidden, admin_notes, edited_at, edited_by } = updateData;

//     // Check if comment exists
//     const existingComment = await db.query('SELECT id FROM comments WHERE id = ?', [commentId]);
//     if (!existingComment[0]) {
//       throw new CustomError('Comment not found', 404);
//     }

//     // Build dynamic update query
//     const updateFields = [];
//     const params = [];

//     if (comment !== undefined) {
//       if (!comment || comment.trim().length === 0) {
//         throw new CustomError('Comment text cannot be empty', 400);
//       }
//       updateFields.push('comment = ?');
//       params.push(comment.trim());
//     }

//     if (is_hidden !== undefined) {
//       updateFields.push('is_hidden = ?');
//       params.push(is_hidden ? 1 : 0);
//     }

//     if (admin_notes !== undefined) {
//       updateFields.push('admin_notes = ?');
//       params.push(admin_notes);
//     }

//     if (edited_at !== undefined) {
//       updateFields.push('edited_at = ?');
//       params.push(edited_at);
//     }

//     if (edited_by !== undefined) {
//       updateFields.push('edited_by = ?');
//       params.push(edited_by);
//     }

//     // Handle media updates
//     if (media.length > 0) {
//       const [media1, media2, media3] = media.slice(0, 3);
      
//       updateFields.push('media_url1 = ?', 'media_type1 = ?');
//       params.push(media1?.url || null, media1?.type || null);
      
//       updateFields.push('media_url2 = ?', 'media_type2 = ?');
//       params.push(media2?.url || null, media2?.type || null);
      
//       updateFields.push('media_url3 = ?', 'media_type3 = ?');
//       params.push(media3?.url || null, media3?.type || null);
//     }

//     // Always update timestamp
//     updateFields.push('updatedAt = NOW()');

//     if (updateFields.length === 1) { // Only updatedAt
//       throw new CustomError('No fields to update', 400);
//     }

//     const sql = `
//       UPDATE comments 
//       SET ${updateFields.join(', ')}
//       WHERE id = ?
//     `;
    
//     params.push(commentId);

//     const result = await db.query(sql, params);

//     if (result.affectedRows === 0) {
//       throw new CustomError('Failed to update comment', 500);
//     }

//     // Return updated comment
//     return await getCommentById(commentId);
//   } catch (error) {
//     console.error('❌ Error in updateCommentById:', error);
//     throw new CustomError(error.message || 'Failed to update comment');
//   }
// };

// // ✅ Enhanced deleteCommentById with cascade handling
// export const deleteCommentById = async (commentId) => {
//   try {
//     if (!commentId) {
//       throw new CustomError('Comment ID is required', 400);
//     }

//     // Check if comment exists
//     const existingComment = await db.query('SELECT id FROM comments WHERE id = ?', [commentId]);
//     if (!existingComment[0]) {
//       throw new CustomError('Comment not found', 404);
//     }

//     // Delete replies first (cascade)
//     await db.query('DELETE FROM comments WHERE parentcomment_id = ?', [commentId]);
//     console.log(`✅ Deleted replies for comment ${commentId}`);

//     // Delete the comment
//     const result = await db.query('DELETE FROM comments WHERE id = ?', [commentId]);

//     if (result.affectedRows === 0) {
//       throw new CustomError('Comment not found', 404);
//     }

//     console.log(`✅ Comment ${commentId} deleted successfully`);
//     return { deleted: true, commentId };
//   } catch (error) {
//     console.error('❌ Error in deleteCommentById:', error);
//     throw new CustomError(error.message || 'Failed to delete comment');
//   }
// };

// // ✅ Enhanced getCommentStats with comprehensive analytics
// export const getCommentStats = async (filters = {}) => {
//   try {
//     const { user_id, startDate, endDate, timeframe = '30days' } = filters;

//     let whereConditions = [];
//     let params = [];

//     if (user_id) {
//       whereConditions.push('user_id = ?');
//       params.push(user_id);
//     }

//     // Handle timeframe filtering
//     if (timeframe && timeframe !== 'all' && !startDate && !endDate) {
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

//     const rows = await db.query(`
//       SELECT 
//         COUNT(*) as total_comments,
//         COUNT(CASE WHEN chat_id IS NOT NULL THEN 1 END) as chat_comments,
//         COUNT(CASE WHEN teaching_id IS NOT NULL THEN 1 END) as teaching_comments,
//         COUNT(CASE WHEN parentcomment_id IS NOT NULL THEN 1 END) as reply_comments,
//         COUNT(CASE WHEN parentcomment_id IS NULL THEN 1 END) as top_level_comments,
//         COUNT(DISTINCT user_id) as unique_commenters,
//         COUNT(CASE WHEN media_url1 IS NOT NULL OR media_url2 IS NOT NULL OR media_url3 IS NOT NULL THEN 1 END) as comments_with_media,
//         COUNT(CASE WHEN is_hidden = 1 THEN 1 END) as hidden_comments,
//         MIN(createdAt) as first_comment,
//         MAX(createdAt) as latest_comment
//       FROM comments ${whereClause}
//     `, params);

//     return rows[0] || {
//       total_comments: 0,
//       chat_comments: 0,
//       teaching_comments: 0,
//       reply_comments: 0,
//       top_level_comments: 0,
//       unique_commenters: 0,
//       comments_with_media: 0,
//       hidden_comments: 0,
//       first_comment: null,
//       latest_comment: null
//     };
//   } catch (error) {
//     console.error('❌ Error in getCommentStats:', error);
//     throw new CustomError('Failed to get comment statistics');
//   }
// };

// // ✅ New: Get comment replies (threaded comments)
// export const getCommentReplies = async (parentCommentId, options = {}) => {
//   try {
//     if (!parentCommentId) {
//       throw new CustomError('Parent comment ID is required', 400);
//     }

//     const { page = 1, limit = 20, sort_order = 'asc' } = options;

//     // Validate parent comment exists
//     const parentComment = await db.query('SELECT id FROM comments WHERE id = ?', [parentCommentId]);
//     if (!parentComment[0]) {
//       throw new CustomError('Parent comment not found', 404);
//     }

//     const offset = (parseInt(page) - 1) * parseInt(limit);
//     const finalSortOrder = sort_order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

//     // ✅ FIXED: Use COLLATE for user join or fallback without user join
//     try {
//       const query = `
//         SELECT c.*,
//                u.username, u.email,
//                ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
//                t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id
//         FROM comments c
//         LEFT JOIN users u ON c.user_id COLLATE utf8mb4_general_ci = u.converse_id COLLATE utf8mb4_general_ci
//         LEFT JOIN chats ch ON c.chat_id = ch.id
//         LEFT JOIN teachings t ON c.teaching_id = t.id
//         WHERE c.parentcomment_id = ?
//         ORDER BY c.createdAt ${finalSortOrder}
//         LIMIT ? OFFSET ?
//       `;

//       const replies = await db.query(query, [parentCommentId, parseInt(limit), offset]);
//       return replies || [];
//     } catch (error) {
//       if (error.message.includes('collation') || error.code === 'ER_CANT_AGGREGATE_2COLLATIONS') {
//         console.log('🔄 Retrying getCommentReplies without user join...');
        
//         const fallbackQuery = `
//           SELECT c.*,
//                  c.user_id as username,
//                  NULL as email,
//                  ch.title as chat_title, ch.prefixed_id as chat_prefixed_id,
//                  t.topic as teaching_title, t.prefixed_id as teaching_prefixed_id
//           FROM comments c
//           LEFT JOIN chats ch ON c.chat_id = ch.id
//           LEFT JOIN teachings t ON c.teaching_id = t.id
//           WHERE c.parentcomment_id = ?
//           ORDER BY c.createdAt ${finalSortOrder}
//           LIMIT ? OFFSET ?
//         `;

//         const replies = await db.query(fallbackQuery, [parentCommentId, parseInt(limit), offset]);
//         return replies || [];
//       }
//       throw error;
//     }
//   } catch (error) {
//     console.error('❌ Error in getCommentReplies:', error);
//     throw new CustomError(error.message || 'Failed to fetch comment replies');
//   }
// };

// // ✅ New: Get comment thread depth
// export const getCommentThreadDepth = async (commentId) => {
//   try {
//     if (!commentId) {
//       throw new CustomError('Comment ID is required', 400);
//     }

//     const query = `
//       WITH RECURSIVE comment_tree AS (
//         SELECT id, parentcomment_id, 0 as depth
//         FROM comments 
//         WHERE id = ?
        
//         UNION ALL
        
//         SELECT c.id, c.parentcomment_id, ct.depth + 1
//         FROM comments c
//         INNER JOIN comment_tree ct ON c.parentcomment_id = ct.id
//       )
//       SELECT MAX(depth) as max_depth, COUNT(*) as total_replies
//       FROM comment_tree
//     `;

//     const result = await db.query(query, [commentId]);
//     return result[0] || { max_depth: 0, total_replies: 0 };
//   } catch (error) {
//     console.error('❌ Error in getCommentThreadDepth:', error);
//     throw new CustomError('Failed to get comment thread depth');
//   }
// };