import {
  createCommentService,
  uploadCommentService,
} from "../services/commentServices.js";

export const createComment = async (req, res) => {
  try {
    const { chat_id, comment } = req.body;

    const user_id = req.user?.id; // Assuming `req.user` contains the authenticated user's info from the `authenticate` middleware.

    if (!user_id || !chat_id) {
      return res.status(400).json({ error: 'User ID and Chat ID are required.' });
    }

    // Ensure uploaded files are processed correctly
    const files = req.uploadedFiles || [];
    const media = files.map((file, index) => ({
      url: file.location, // Ensure this is the URL returned by S3
      type: file.mimetype || `media${index + 1}`,
    }));

    const newComment = await createCommentService({
      user_id,
      chat_id,
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
