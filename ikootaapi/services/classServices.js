import dbQuery from '../config/dbQuery.js';
import CustomError from '../utils/CustomError.js';

// Fetch all classes
export const fetchClasses = async () => {
  const sql = 'SELECT * FROM classes';
  return await dbQuery(sql);
};

// Create a new class
export const createClass = async (classData) => {
  const { class_id, name, description } = classData;
  const sql = 'INSERT INTO classes (class_id, name, description) VALUES (?, ?, ?)';
  return await dbQuery(sql, [class_id, name, description]);
};

// Update an existing class
export const updateClass = async (id, classData) => {
  const { name, description } = classData;
  const sql = 'UPDATE classes SET name = ?, description = ? WHERE class_id = ?';
  return await dbQuery(sql, [name, description, id]);
};




export const assignUserToClassService = async (userId, classId) => {
    const sql = 'INSERT INTO user_classes (user_id, class_id) VALUES (?, ?)';
    await dbQuery(sql, [userId, classId]);
};

export const getClassContentService = async (classId) => {
    const sql = 'SELECT * FROM content WHERE class_id = ?';
    const content = await dbQuery(sql, [classId]);
    return content;
};