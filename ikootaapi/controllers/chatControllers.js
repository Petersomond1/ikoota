import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { 
  uploadContentService, 
  getAllContentService, 
  getContentByIdService, 
  createContentService, 
  addCommentToContentService, 
  getCommentsByContentIdService, 
  uploadClarionContentService, 
  getClarionContentService 
} from '../services/chatServices.js';

export const uploadContent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { audience, title, description } = req.body;
    const files = req.uploadedFiles;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const contentId = await uploadContentService(title, description, userId, audience);

    const filePromises = files.map(file => {
      return db.execute('INSERT INTO content_files (content_id, type, file_url) VALUES (?, ?, ?)', [contentId, file.type, file.fileUrl]);
    });

    await Promise.all(filePromises);

    res.status(201).json({ message: 'Files uploaded successfully', contentId });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Error uploading files' });
  }
};

export const getAllContent = async (req, res) => {
  try {
    const content = await getAllContentService(req.user.userId);
    res.status(200).json(content);
  } catch (error) {
    console.error('Error in getAllContent:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching content.' });
  }
};

export const getContentById = async (req, res) => {
  try {
    const content = await getContentByIdService(req.params.id);
    res.status(200).json(content);
  } catch (error) {
    console.error('Error in getContentById:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching content by ID.' });
  }
};

export const createContent = async (req, res) => {
  try {
    const contentId = await createContentService(req.body, req.user.userId);
    res.status(201).json({ message: 'Content created successfully', contentId });
  } catch (error) {
    console.error('Error in createContent:', error.message);
    res.status(500).json({ error: 'An error occurred while creating content.' });
  }
};

export const addCommentToContent = async (req, res) => {
  try {
    const commentId = await addCommentToContentService(req.params.id, req.body, req.user.userId);
    res.status(201).json({ message: 'Comment added successfully', commentId });
  } catch (error) {
    console.error('Error in addCommentToContent:', error.message);
    res.status(500).json({ error: 'An error occurred while adding a comment.' });
  }
};

export const getCommentsByContentId = async (req, res) => {
  try {
    const comments = await getCommentsByContentIdService(req.params.id);
    res.status(200).json(comments);
  } catch (error) {
    console.error('Error in getCommentsByContentId:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching comments.' });
  }
};

export const getClarionContent = async (req, res) => {
  try {
    const content = await getClarionContentService();
    res.status(200).json(content);
  } catch (error) {
    console.error('Error fetching Clarion Call content:', error);
    res.status(500).json({ error: 'An error occurred while fetching Clarion Call content.' });
  }
};

export const uploadClarionContent = async (req, res) => {
  try {
    const { clarionContent } = req.body;
    const files = req.uploadedFiles;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const contentId = uuidv4();

    const filePromises = files.map(file => {
      return db.execute('INSERT INTO clarion_content (id, type, file_url, clarionContent) VALUES (?, ?, ?, ?)', [contentId, file.type, file.fileUrl, clarionContent]);
    });

    await Promise.all(filePromises);

    res.status(201).json({ message: 'Clarion Call content uploaded successfully', contentId });
  } catch (error) {
    console.error('Error uploading Clarion Call content:', error);
    res.status(500).json({ error: 'Error uploading Clarion Call content' });
  }
};