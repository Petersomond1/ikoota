import dbQuery from '../config/dbQuery.js';
import CustomError from '../utils/CustomError.js';

export const assignUserToClassService = async (userId, classId) => {
    const sql = 'INSERT INTO user_classes (user_id, class_id) VALUES (?, ?)';
    await dbQuery(sql, [userId, classId]);
};

export const getClassContentService = async (classId) => {
    const sql = 'SELECT * FROM content WHERE class_id = ?';
    const content = await dbQuery(sql, [classId]);
    return content;
};