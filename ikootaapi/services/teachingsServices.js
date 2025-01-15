import pool from '../config/db.js';
import dbQuery from '../config/dbQuery.js';
import CustomError from '../utils/CustomError.js';


/* Note use of pool relates to creation of db.js and use of dbquery relates to use of dbquery.js before pool */


// Fetch all teachings
export const getAllTeachings = async () => {
  const [rows] = await pool.query('SELECT * FROM teachings ORDER BY createdAt DESC');
  return rows;
};



// Add a new teaching
export const createTeaching = async (data) => {
  const {
    topic,
    description,
    subjectMatter,
    audience,
    content,
    media,
  } = data;

  const [media1, media2, media3] = media || [];

  const sql = `
    INSERT INTO teachings 
    (topic, description, subjectMatter, audience, content, media_url1, media_type1, media_url2, media_type2, media_url3, media_type3)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(sql, [
    topic,
    description,
    subjectMatter,
    audience,
    content,
    media1?.url || null,
    media1?.type || null,
    media2?.url || null,
    media2?.type || null,
    media3?.url || null,
    media3?.type || null,
  ]);

  if (result.affectedRows === 0) throw new CustomError("Failed to add teaching", 500);

  return { id: result.insertId, ...data };
};


// Update a teaching by ID
export const updateTeachingById = async (id, data) => {
  const {
    topic,
    description,
    lessonNumber,
    subjectMatter,
    audience,
    content,
    media,
  } = data;

  const [media1, media2, media3] = media || [];

  const sql = `
    UPDATE teachings 
    SET topic = ?, description = ?, lessonNumber = ?, subjectMatter = ?, audience = ?, content = ?, 
        media_url1 = ?, media_type1 = ?, media_url2 = ?, media_type2 = ?, media_url3 = ?, media_type3 = ?
    WHERE id = ?
  `;

  const [result] = await pool.query(sql, [
    topic,
    description,
    lessonNumber,
    subjectMatter,
    audience,
    content,
    media1?.url || null,
    media1?.type || null,
    media2?.url || null,
    media2?.type || null,
    media3?.url || null,
    media3?.type || null,
    id,
  ]);

  if (result.affectedRows === 0) throw new CustomError('Teaching not found', 404);

  return { id, ...data };
};


// Delete a teaching by ID
export const deleteTeachingById = async (id) => {
  const [result] = await pool.query('DELETE FROM teachings WHERE id = ?', [id]);

  if (result.affectedRows === 0) throw new CustomError('Teaching not found', 404);
};