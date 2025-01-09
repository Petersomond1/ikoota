import { assignUserToClassService, getClassContentService } from '../services/classServices.js';

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