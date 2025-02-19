import {
  createCommentService,
  uploadCommentService,
  getCommentsByUserId,
  getChatAndTeachingIdsFromComments,
  getParentChatsAndTeachingsWithComments,
  getCommentsByParentIds, // New service function
} from "../services/commentServices.js";
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
    console.log("req.uploadedFiles:", req.uploadedFiles);
    console.log("files:", files);
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
    console.log('here is the issue', error)
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

// Fetch parent chats and teachings along with their comments
export const fetchParentChatsAndTeachingsWithComments = async (req, res) => {
  const { user_id } = req.query;
  try {
    console.log("one")
    const comments = await getCommentsByUserId(user_id);
    console.log("two")
    
    const { chatIds, teachingIds } = getChatAndTeachingIdsFromComments(comments);
    console.log("three")

     const data = await getParentChatsAndTeachingsWithComments(chatIds, teachingIds);
    const { chats, teachings, comments: commentsData } = data;

    res.status(200).json({
      chats,
      teachings,
      comments,
    });
  } catch (error) {
    console.log("here is the isue", error)
    res.status(500).json({ error: error.message });
  }
};

// Fetch comments using parents chatIds and teachingIds
export const fetchCommentsByParentIds = async (req, res) => {
  const { chatIds, teachingIds } = req.query;
  try {
    const comments = await getCommentsByParentIds(chatIds, teachingIds);
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch comments by user_id
export const fetchCommentsByUserId = async (req, res) => {
  const { user_id } = req.params;
  try {
    const comments = await getCommentsByUserId(user_id);
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};