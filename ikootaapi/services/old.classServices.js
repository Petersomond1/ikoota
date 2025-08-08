// ikootaapi/services/classServices.js
import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// Fetch all classes
export const fetchClasses = async () => {
  const sql = 'SELECT * FROM classes';
  return await db.query(sql);
};

// Create a new class
export const createClass = async (classData) => {
  const { class_id, name, description } = classData;
  const sql = 'INSERT INTO classes (class_id, name, description) VALUES (?, ?, ?)';
  return await db.query(sql, [class_id, name, description]);
};

// Update an existing class
export const updateClass = async (id, classData) => {
  const { name, description } = classData;
  const sql = 'UPDATE classes SET name = ?, description = ? WHERE class_id = ?';
  return await db.query(sql, [name, description, id]);
};




export const assignUserToClassService = async (userId, classId) => {
    const sql = 'INSERT INTO user_classes (user_id, class_id) VALUES (?, ?)';
    await db.query(sql, [userId, classId]);
};

export const getClassContentService = async (classId) => {
    const sql = 'SELECT * FROM content WHERE class_id = ?';
    const content = await db.query(sql, [classId]);
    return content;
};