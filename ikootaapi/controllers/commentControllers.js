import {
  createCommentService,
  uploadCommentService,
  getCommentsService,
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

    if (!chat_id && !teaching_id) {
      return res.status(400).json({ error: "chat_id or teaching_id is required" });
    }

    const comments = await getCommentsService({ chat_id, teaching_id });

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};