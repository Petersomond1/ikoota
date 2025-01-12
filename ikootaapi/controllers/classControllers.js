import { fetchClasses, createClass, updateClass, assignUserToClassService, getClassContentService } from '../services/classServices.js';


// Fetch all classes
export const getClasses = async (req, res) => {
  try {
    const classes = await fetchClasses();
    res.status(200).json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching classes.' });
  }
};

// Create a new class
export const postClass = async (req, res) => {
  try {
    const classData = req.body;
    await createClass(classData);
    res.status(201).send('Class created');
  } catch (error) {
    console.error('Error creating class:', error.message);
    res.status(500).json({ error: 'An error occurred while creating the class.' });
  }
};

// Update an existing class
export const putClass = async (req, res) => {
  try {
    const { id } = req.params;
    const classData = req.body;
    await updateClass(id, classData);
    res.status(200).send('Class updated');
  } catch (error) {
    console.error('Error updating class:', error.message);
    res.status(500).json({ error: 'An error occurred while updating the class.' });
  }
};



export const assignUserToClass = async (req, res) => {
    try {
        const { userId, classId } = req.body;
        await assignUserToClassService(userId, classId);
        res.status(200).json({ message: 'User assigned to class successfully' });
    } catch (error) {
        console.error('Error in assignUserToClass:', error.message);
        res.status(500).json({ error: 'An error occurred while assigning the user to the class.' });
    }
};

export const getClassContent = async (req, res) => {
    try {
        const { classId } = req.params;
        const content = await getClassContentService(classId);
        res.status(200).json(content);
    } catch (error) {
        console.error('Error in getClassContent:', error.message);
        res.status(500).json({ error: 'An error occurred while retrieving the class content.' });
    }
};