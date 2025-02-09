import {
  createCommentService,
  uploadCommentService,
  getCommentsService,
  getCommentsByUserId,
  getCommentsByParentId,
} from "../services/commentServices.js";
import { getChatsByIds } from '../services/chatServices.js';
import { getTeachingsByIds } from '../services/teachingsServices.js';

import dotenv from 'dotenv';

dotenv.config();

export const createComment = async (req, res) => {
  try {
    const { chat_id, teaching_id, comment } = req.body;
    const { user_id } = req.user;

    console.log('createcomment req body:', req.body);
    console.log('createcomment req user:', req.user);

    if ((!chat_id && !teaching_id) || !comment || !user_id) {
      return res.status(400).json({ error: "User ID, Chat ID or Teaching ID, and Comment are required." });
    }

    // Ensure uploaded files are processed correctly
    const files = req.uploadedFiles || [];
    const media = files.map((file, index) => ({
      url: file.url, // Ensure this is the URL returned by S3
      type: file.type || `media${index + 1}`,
    }));

    const newComment = await createCommentService({
      user_id,
      chat_id: chat_id || null,
      teaching_id: teaching_id || null,
      comment,
      media,
    });

    res.status(201).json({
      id: newComment.id,
      message: "Comment created successfully.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadCommentFiles = async (req, res) => {
  try {
    const files = req.files;
    const uploadedFiles = await uploadCommentService(files);

    res.status(201).json({ uploadedFiles, message: "Files uploaded successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch comments based on chat_id or teaching_id
export const getComments = async (req, res) => {
  try {
    const { chat_id, teaching_id } = req.query;
    console.log('req.query:', req.query);
    console.log('chat_id:', chat_id);
    if (!chat_id) {
      return res.status(400).json({ error: "chat_id or teaching_id is required" });
    }

    const comments = await getCommentsService({ chat_id, teaching_id });

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


//The seems to be a duplicate of the above function below
export const fetchCommentsByUserId = async (req, res) => {
  const { user_id } = req.query;
  try {
    const comments = await getCommentsByUserId(user_id);

    const chatIds = comments.filter(comment => comment.chat_id).map(comment => comment.chat_id);
    const teachingIds = comments.filter(comment => comment.teaching_id).map(comment => comment.teaching_id);

    const [chats, teachings] = await Promise.all([
      chatIds.length > 0 ? getChatsByIds(chatIds) : [],
      teachingIds.length > 0 ? getTeachingsByIds(teachingIds) : []
    ]);

    const parentComments = await Promise.all([
      ...chatIds.map(chat_id => getCommentsByParentId(chat_id, null)),
      ...teachingIds.map(teaching_id => getCommentsByParentId(null, teaching_id))
    ]);

    res.status(200).json({
      comments,
      chats,
      teachings,
      parentComments: parentComments.flat()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};