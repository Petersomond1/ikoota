import axios from 'axios';
import pool from "../config/db.js";
import CustomError from "../utils/CustomError.js";
import { uploadFileToS3 } from '../config/s3.js';

export const createCommentService = async ({ user_id, chat_id, teaching_id, comment, media }) => {
  const connection = await pool.getConnection();
  try {
    // Start transaction
    await connection.beginTransaction();
    console.log("it readch here", user_id, chat_id, teaching_id, comment, media);
    // Insert comment into the database
    const [result] = await connection.query(
      `
      INSERT INTO comments (user_id, chat_id, teaching_id, comment, media_url1, media_type1, media_url2, media_type2, media_url3, media_type3)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
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

    // Commit transaction
    await connection.commit();

    return { id: result.insertId };
  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    throw new CustomError(error.message);
  } finally {
    connection.release();
  }
};

export const uploadCommentService = async (files) => {
  try {
    // Process files here if needed, for example:
    const uploadedFiles = await Promise.all(files.map(async (file) => {
      const { url, type } = await uploadFileToS3(file);
      return { url, type };
    }));

    return uploadedFiles;
  } catch (error) {
    throw new CustomError(error.message);
  }
};

// step-1 Fetch comments by user_id
export const getCommentsByUserId = async (user_id) => {
  const [comments] = await pool.query('SELECT * FROM comments WHERE user_id = ?', [user_id]);
  return comments;
};

// step-2 Extract chat_id and teaching_id from return comments of step-1
export const getChatAndTeachingIdsFromComments = (comments) => {
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

  return { chatIds, teachingIds };
};

// // step-3 Fetch parent chats and teachings along with their comments using return chatIds and teachingIds from step-2

// export const getParentChatsAndTeachingsWithComments = async (chatIds, teachingIds) => {
//   try {

//     if(chatIds.length !== 0)  {
//     var [chatsBody] = await pool.query('SELECT * FROM chats WHERE id iN (?)', [chatIds]);
//     }

//     if(teachingIds.length !== 0)  {
//       var [teachingBody] = await pool.query('SELECT * FROM teachings WHERE id iN (?)', [teachingIds]);
//       }
      
//     if(chatsBody){
//       var [comments] = await pool.query('SELECT * FROM comments WHERE chat_id IN (?)', [chatIds]);
      
//     }

//     if(teachingBody){
//       var [comments] = await pool.query('SELECT * FROM comments WHERE teaching_id IN (?)', [teachingIds]);
      
//     }

//     const data = {
//       chats: chatsBody ? chatsBody : [],
//       teachings: teachingBody ? teachingBody : [],
//       comments: comments
//     }

//     return data;
//   } catch (error) {
//     console.error("Error fetching parent chats and teachings with comments:", error);
//     throw new CustomError("Internal Server Error");
//   }
// };


// UPDATED: Include prefixed_id in parent content queries
export const getParentChatsAndTeachingsWithComments = async (chatIds, teachingIds) => {
  try {
    let chatsBody = [];
    let teachingBody = [];
    let comments = [];

    if (chatIds.length !== 0) {
      const [chats] = await pool.query('SELECT *, prefixed_id FROM chats WHERE id IN (?)', [chatIds]);
      chatsBody = chats;
    }

    if (teachingIds.length !== 0) {
      const [teachings] = await pool.query('SELECT *, prefixed_id FROM teachings WHERE id IN (?)', [teachingIds]);
      teachingBody = teachings;
    }
      
    // Get all comments for both chats and teachings
    if (chatIds.length > 0 || teachingIds.length > 0) {
      let commentQuery = 'SELECT * FROM comments WHERE ';
      let queryParams = [];
      let conditions = [];

      if (chatIds.length > 0) {
        conditions.push('chat_id IN (?)');
        queryParams.push(chatIds);
      }

      if (teachingIds.length > 0) {
        conditions.push('teaching_id IN (?)');
        queryParams.push(teachingIds);
      }

      commentQuery += conditions.join(' OR ');
      const [allComments] = await pool.query(commentQuery, queryParams);
      comments = allComments;
    }

    return {
      chats: chatsBody,
      teachings: teachingBody,
      comments: comments
    };
  } catch (error) {
    console.error("Error fetching parent chats and teachings with comments:", error);
    throw new CustomError("Internal Server Error");
  }
};



// Fetch comments using parents chatIds and teachingIds
export const getCommentsByParentIds = async (chatIds, teachingIds) => {
  try {
    const [comments] = await pool.query(
      'SELECT * FROM comments WHERE chat_id IN (?) OR teaching_id IN (?)',
      [chatIds.split(','), teachingIds.split(',')]
    );
    return comments;
  } catch (error) {
    throw new CustomError(error.message);
  }
};

// Fetch all comments
export const getAllComments = async () => {
  try {
    const [comments] = await pool.query('SELECT * FROM comments');
    return comments;
  } catch (error) {
    throw new CustomError(error.message);
  }
};