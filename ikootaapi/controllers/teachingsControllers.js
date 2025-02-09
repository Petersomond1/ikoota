import {
  getAllTeachings,
  getTeachingsByUserId,
  createTeachingService,
  updateTeachingById,
  deleteTeachingById,
} from '../services/teachingsServices.js';

export const fetchAllTeachings = async (req, res) => {
  try {
    const teachings = await getAllTeachings();
    res.status(200).json(teachings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchTeachingsByUserId = async (req, res) => {
  const { user_id } = req.query;
  try {
    const teachings = await getTeachingsByUserId(user_id);
    res.status(200).json(teachings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTeaching = async (req, res) => {
  try {
    const { topic, description, subjectMatter, audience, content } = req.body;
    
       // Extract uploaded files
       // const files = req.uploadedFiles;
       const files = req.uploadedFiles || [];
       const media = files.map((file) => ({
         url: file.url,
         type: file.type,
       }));

    const newTeaching = await createTeachingService({
      topic,
      description,
      subjectMatter,
      audience,
      content,
      media,
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