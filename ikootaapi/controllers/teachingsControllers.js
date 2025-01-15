import {
    getAllTeachings,
    createTeaching,
    updateTeachingById,
    deleteTeachingById,
  } from '../services/teachingsServices.js';


  // Fetch all teachings
 
export const fetchAllTeachings = async (req, res) => {
  try {
    const teachings = await getAllTeachings();
    res.status(200).json(teachings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

  
  // Add a new teaching

  export const addTeaching = async (req, res) => {
    try {
      const data = {
        ...req.body,
        media: req.uploadedFiles || [],
      };
      const newTeaching = await createTeaching(data);
  
      // Append lessonNumber after ID is generated
      const lessonNumber = `${newTeaching.id}-${Date.now()}`;
      await updateTeachingById(newTeaching.id, { lessonNumber });
  
      res.status(201).json({ ...newTeaching, lessonNumber });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  
  // Update a teaching by ID
 
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

  
  // Delete a teaching by ID
 
export const removeTeaching = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteTeachingById(id);
    res.status(200).json({ message: 'Teaching deleted successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

