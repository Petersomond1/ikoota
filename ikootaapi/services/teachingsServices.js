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
    lessonNumber,
    subjectMatter,
    audience,
    content,
    media_url1,
    media_type1,
    media_url2,
    media_type2,
    media_url3,
    media_type3,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO teachings 
    (topic, description, lessonNumber, subjectMatter, audience, content, media_url1, media_type1, media_url2, media_type2, media_url3, media_type3)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      topic,
      description,
      lessonNumber,
      subjectMatter,
      audience,
      content,
      media_url1,
      media_type1,
      media_url2,
      media_type2,
      media_url3,
      media_type3,
    ]
  );

  if (result.affectedRows === 0) throw new CustomError('Failed to add teaching', 500);

  return { id: result.insertId, ...data };
};

// Update a teaching by ID
export const updateTeachingById = async (id, data) => {
  const [result] = await pool.query(
    `UPDATE teachings 
    SET topic = ?, description = ?, lessonNumber = ?, subjectMatter = ?, audience = ?, content = ?, media_url1 = ?, media_type1 = ?, media_url2 = ?, media_type2 = ?, media_url3 = ?, media_type3 = ?
    WHERE id = ?`,
    [
      data.topic,
      data.description,
      data.lessonNumber,
      data.subjectMatter,
      data.audience,
      data.content,
      data.media_url1,
      data.media_type1,
      data.media_url2,
      data.media_type2,
      data.media_url3,
      data.media_type3,
      id,
    ]
  );

  if (result.affectedRows === 0) throw new CustomError('Teaching not found', 404);

  return { id, ...data };
};

// Delete a teaching by ID
export const deleteTeachingById = async (id) => {
  const [result] = await pool.query('DELETE FROM teachings WHERE id = ?', [id]);

  if (result.affectedRows === 0) throw new CustomError('Teaching not found', 404);
};



// import dbQuery from '../config/dbQuery.js';
// import CustomError from '../utils/CustomError.js';
// import { sendEmail } from '../utils/email.js';

// const submitTeachingsService = () => {
// teachingsServices
  
// }

// export default teachingsServices