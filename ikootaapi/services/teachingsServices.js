// file: ikootaapi/services/teachingsServices.js
import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// Enhanced getAllTeachings with better error handling and sorting
export const getAllTeachings = async () => {
  try {
    const rows = await db.query(`
      SELECT *, prefixed_id, 
             'teaching' as content_type,
             topic as content_title,
             createdAt as content_createdAt,
             updatedAt as content_updatedAt
      FROM teachings 
      ORDER BY updatedAt DESC, createdAt DESC
    `);
    return rows;
  } catch (error) {
    console.error('Error in getAllTeachings:', error);
    throw new CustomError(`Failed to fetch teachings: ${error.message}`);
  }
};

// Enhanced getTeachingsByUserId
export const getTeachingsByUserId = async (user_id) => {
  try {
    if (!user_id) {
      throw new CustomError('User ID is required', 400);
    }

    const rows = await db.query(`
      SELECT *, prefixed_id,
             'teaching' as content_type,
             topic as content_title,
             createdAt as content_createdAt,
             updatedAt as content_updatedAt
      FROM teachings 
      WHERE user_id = ? 
      ORDER BY updatedAt DESC, createdAt DESC
    `, [user_id]);
    
    return rows;
  } catch (error) {
    console.error('Error in getTeachingsByUserId:', error);
    throw new CustomError(`Failed to fetch user teachings: ${error.message}`);
  }
};

// Enhanced getTeachingByPrefixedId with fallback to numeric ID
export const getTeachingByPrefixedId = async (identifier) => {
  try {
    if (!identifier) {
      throw new CustomError('Teaching identifier is required', 400);
    }

    // Try prefixed_id first, then fallback to numeric id
    let query, params;
    
    if (identifier.startsWith('t') || identifier.startsWith('T')) {
      // Prefixed ID
      query = `
        SELECT *, prefixed_id,
               'teaching' as content_type,
               topic as content_title,
               createdAt as content_createdAt,
               updatedAt as content_updatedAt
        FROM teachings 
        WHERE prefixed_id = ?
      `;
      params = [identifier];
    } else {
      // Numeric ID
      query = `
        SELECT *, prefixed_id,
               'teaching' as content_type,
               topic as content_title,
               createdAt as content_createdAt,
               updatedAt as content_updatedAt
        FROM teachings 
        WHERE id = ?
      `;
      params = [parseInt(identifier)];
    }

    const rows = await db.query(query, params);
    return rows[0] || null;
  } catch (error) {
    console.error('Error in getTeachingByPrefixedId:', error);
    throw new CustomError(`Failed to fetch teaching: ${error.message}`);
  }
};

// Enhanced createTeachingService with comprehensive validation
export const createTeachingService = async (data) => {
  try {
    const {
      topic,
      description,
      subjectMatter,
      audience,
      content,
      media = [],
      user_id,
      lessonNumber, // Optional lesson number
    } = data;

    // Validation
    if (!topic || !description || !user_id) {
      throw new CustomError('Topic, description, and user_id are required', 400);
    }

    if (!content && (!media || media.length === 0)) {
      throw new CustomError('Either content or media must be provided', 400);
    }

    const [media1, media2, media3] = media;

    // Generate lesson number if not provided
    const finalLessonNumber = lessonNumber || `0-${Date.now()}`;

    const sql = `
      INSERT INTO teachings 
      (topic, description, lessonNumber, subjectMatter, audience, content, 
       media_url1, media_type1, media_url2, media_type2, media_url3, media_type3, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(sql, [
      topic.trim(),
      description.trim(),
      finalLessonNumber,
      subjectMatter?.trim() || null,
      audience?.trim() || null,
      content?.trim() || null,
      media1?.url || null,
      media1?.type || null,
      media2?.url || null,
      media2?.type || null,
      media3?.url || null,
      media3?.type || null,
      user_id,
    ]);

    if (result.affectedRows === 0) {
      throw new CustomError("Failed to create teaching", 500);
    }

    // Get the created record with prefixed_id (populated by trigger)
    const createdTeaching = await db.query(`
      SELECT *, prefixed_id,
             'teaching' as content_type,
             topic as content_title,
             createdAt as content_createdAt,
             updatedAt as content_updatedAt
      FROM teachings 
      WHERE id = ?
    `, [result.insertId]);
    
    if (!createdTeaching[0]) {
      throw new CustomError("Failed to retrieve created teaching", 500);
    }

    console.log(`Teaching created successfully with ID: ${createdTeaching[0].prefixed_id}`);
    return createdTeaching[0];
  } catch (error) {
    console.error('Error in createTeachingService:', error);
    throw new CustomError(error.message || 'Failed to create teaching');
  }
};

// Enhanced updateTeachingById with better validation
export const updateTeachingById = async (id, data) => {
  try {
    if (!id) {
      throw new CustomError('Teaching ID is required', 400);
    }

    const {
      topic,
      description,
      lessonNumber,
      subjectMatter,
      audience,
      content,
      media = [],
    } = data;

    // Check if teaching exists
    const existingTeaching = await db.query('SELECT id FROM teachings WHERE id = ?', [id]);
    if (!existingTeaching[0]) {
      throw new CustomError('Teaching not found', 404);
    }

    const [media1, media2, media3] = media;

    const sql = `
      UPDATE teachings 
      SET topic = ?, description = ?, lessonNumber = ?, subjectMatter = ?, audience = ?, content = ?,
          media_url1 = ?, media_type1 = ?, media_url2 = ?, media_type2 = ?, media_url3 = ?, media_type3 = ?, 
          updatedAt = NOW()
      WHERE id = ?
    `;

    const result = await db.query(sql, [
      topic?.trim() || null,
      description?.trim() || null,
      lessonNumber || null,
      subjectMatter?.trim() || null,
      audience?.trim() || null,
      content?.trim() || null,
      media1?.url || null,
      media1?.type || null,
      media2?.url || null,
      media2?.type || null,
      media3?.url || null,
      media3?.type || null,
      id,
    ]);

    if (result.affectedRows === 0) {
      throw new CustomError('Teaching not found or no changes made', 404);
    }

    // Return updated teaching
    const updatedTeaching = await db.query(`
      SELECT *, prefixed_id,
             'teaching' as content_type,
             topic as content_title,
             createdAt as content_createdAt,
             updatedAt as content_updatedAt
      FROM teachings 
      WHERE id = ?
    `, [id]);

    return updatedTeaching[0];
  } catch (error) {
    console.error('Error in updateTeachingById:', error);
    throw new CustomError(error.message || 'Failed to update teaching');
  }
};

// Enhanced deleteTeachingById with cascade considerations
export const deleteTeachingById = async (id) => {
  try {
    if (!id) {
      throw new CustomError('Teaching ID is required', 400);
    }

    // Check if teaching exists and get prefixed_id for logging
    const [existingTeaching] = await db.query('SELECT prefixed_id FROM teachings WHERE id = ?', [id]);
    if (!existingTeaching[0]) {
      throw new CustomError('Teaching not found', 404);
    }

    // Note: Comments should be handled by foreign key constraints or separate cleanup
    const result = await db.query('DELETE FROM teachings WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      throw new CustomError('Teaching not found', 404);
    }

    console.log(`Teaching deleted successfully: ${existingTeaching[0].prefixed_id}`);
    return { deleted: true, prefixed_id: existingTeaching[0].prefixed_id };
  } catch (error) {
    console.error('Error in deleteTeachingById:', error);
    throw new CustomError(error.message || 'Failed to delete teaching');
  }
};

// Enhanced getTeachingsByIds supporting both numeric and prefixed IDs
export const getTeachingsByIds = async (ids) => {
  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new CustomError('Teaching IDs array is required', 400);
    }

    // Clean and validate IDs
    const cleanIds = ids.filter(id => id && id.toString().trim());
    if (cleanIds.length === 0) {
      throw new CustomError('Valid teaching IDs are required', 400);
    }

    // Check if IDs are prefixed or numeric
    const isNumeric = cleanIds.every(id => !isNaN(id));
    const column = isNumeric ? 'id' : 'prefixed_id';
    
    const placeholders = cleanIds.map(() => '?').join(',');
    const query = `
      SELECT *, prefixed_id,
             'teaching' as content_type,
             topic as content_title,
             createdAt as content_createdAt,
             updatedAt as content_updatedAt
      FROM teachings 
      WHERE ${column} IN (${placeholders}) 
      ORDER BY updatedAt DESC, createdAt DESC
    `;
    
    const rows = await db.query(query, cleanIds);
    return rows;
  } catch (error) {
    console.error('Error in getTeachingsByIds:', error);
    throw new CustomError(error.message || 'Failed to fetch teachings by IDs');
  }
};

// NEW: Search teachings with filters
export const searchTeachings = async (filters = {}) => {
  try {
    const { 
      query, 
      user_id, 
      audience, 
      subjectMatter, 
      limit = 50, 
      offset = 0 
    } = filters;

    let whereConditions = [];
    let params = [];

    if (query) {
      whereConditions.push('(topic LIKE ? OR description LIKE ? OR content LIKE ?)');
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (user_id) {
      whereConditions.push('user_id = ?');
      params.push(user_id);
    }

    if (audience) {
      whereConditions.push('audience LIKE ?');
      params.push(`%${audience}%`);
    }

    if (subjectMatter) {
      whereConditions.push('subjectMatter LIKE ?');
      params.push(`%${subjectMatter}%`);
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT *, prefixed_id,
             'teaching' as content_type,
             topic as content_title,
             createdAt as content_createdAt,
             updatedAt as content_updatedAt
      FROM teachings 
      ${whereClause}
      ORDER BY updatedAt DESC, createdAt DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));
    const [rows] = await db.query(sql, params);

    // Get total count for pagination
    const countSql = `SELECT COUNT(*) as total FROM teachings ${whereClause}`;
    const countResult = await db.query(countSql, params.slice(0, -2));

    return {
      teachings: rows,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
  } catch (error) {
    console.error('Error in searchTeachings:', error);
    throw new CustomError(error.message || 'Failed to search teachings');
  }
};

// NEW: Get teaching statistics
export const getTeachingStats = async (user_id = null) => {
  try {
    let whereClause = '';
    let params = [];

    if (user_id) {
      whereClause = 'WHERE user_id = ?';
      params = [user_id];
    }

    const sql = `
      SELECT 
        COUNT(*) as total_teachings,
        COUNT(DISTINCT user_id) as total_authors,
        COUNT(DISTINCT audience) as unique_audiences,
        COUNT(DISTINCT subjectMatter) as unique_subjects,
        SUM(CASE WHEN media_url1 IS NOT NULL OR media_url2 IS NOT NULL OR media_url3 IS NOT NULL THEN 1 ELSE 0 END) as teachings_with_media,
        MIN(createdAt) as earliest_teaching,
        MAX(updatedAt) as latest_update
      FROM teachings 
      ${whereClause}
    `;

    const rows = await db.query(sql, params);
    return rows[0];
  } catch (error) {
    console.error('Error in getTeachingStats:', error);
    throw new CustomError(error.message || 'Failed to get teaching statistics');
  }
};