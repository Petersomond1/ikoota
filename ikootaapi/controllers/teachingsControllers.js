import {
  getAllTeachings,
  createTeachingService,
  updateTeachingById,
  deleteTeachingById,
} from '../services/teachingsServices.js';
import uploadFileToS3 from "../services/s3Service.js";

export const fetchAllTeachings = async (req, res) => {
  try {
    const teachings = await getAllTeachings();
    res.status(200).json(teachings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTeaching = async (req, res) => {
  try {
    const { topic, description, subjectMatter, audience, content } = req.body;
    const files = req.files;

    const fileUrls = await Promise.all(
      files.map((file) => uploadFileToS3(file))
    );

    const newTeaching = await createTeachingService({
      topic,
      description,
      subjectMatter,
      audience,
      content,
      media: fileUrls,
    });

    res.status(201).json({ id: newTeaching.id, message: "Teaching created successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const editTeaching = async (req, res) => {
  try {
    const { id } = req.params;
    const data = {
      ...req.body,
      media: req.uploadedFiles || [],
    };

    const updatedTeaching = await updateTeachingById(id, data);
    res.status(200).json(updatedTeaching);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const removeTeaching = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteTeachingById(id);
    res.status(200).json({ message: 'Teaching deleted successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};