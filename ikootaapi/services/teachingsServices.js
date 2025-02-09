import pool from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// Fetch all teachings
export const getAllTeachings = async () => {
  const [rows] = await pool.query('SELECT * FROM teachings ORDER BY createdAt DESC');
  return rows;
};


// Fetch teachings by user_id
export const getTeachingsByUserId = async (user_id) => {
  const [rows] = await pool.query('SELECT * FROM teachings WHERE user_id = ? ORDER BY createdAt DESC', [user_id]);
  return rows;
};


// Add a new teaching
export const createTeachingService = async (data) => {
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
    media[0]?.url || null,
    media[0]?.type || null,
    media[1]?.url || null,
    media[1]?.type || null,
    media[2]?.url || null,
    media[2]?.type || null,
  ]);

  if (result.affectedRows === 0) throw new CustomError("Failed to add teaching", 500);

  const teachingId = teachingResult.insertId;

  // Insert media URLs associated with this teaching
 const mediaInsertPromises = media.map((file) => {
  const mediaQuery = `
    INSERT INTO teaching_media (teaching_id, media[0]_url, media[0]_type,  media[1]_url, media[1]_type, media[2]_url, media[2]_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  return dbQuery(mediaQuery, [teachingId, file.url, file.type]);
});

await Promise.all(mediaInsertPromises);


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


// Fetch teachings by a list of IDs
export const getTeachingsByIds = async (ids) => {
  const [rows] = await pool.query('SELECT * FROM teachings WHERE id IN (?) ORDER BY createdAt DESC', [ids]);
  return rows;
};