// ikootaapi/services/teachingsServices.js - COMPLETE RECREATION
// Enhanced teaching services with comprehensive functionality and 8-step form support

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

// ✅ Enhanced getAllTeachings with advanced filtering and sorting
export const getAllTeachings = async (filters = {}) => {
  try {
    const {
      approval_status,
      user_id,
      audience,
      subjectMatter, // ACTUAL field name (camelCase)
      search,
      start_date,
      end_date,
      sort_by = 'updatedAt',
      sort_order = 'desc',
      page,
      limit
    } = filters;

    let whereConditions = [];
    let params = [];

    // Build WHERE conditions using ACTUAL field names
    if (approval_status) {
      whereConditions.push('approval_status = ?');
      params.push(approval_status);
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
      whereConditions.push('subjectMatter LIKE ?'); // ACTUAL field name
      params.push(`%${subjectMatter}%`);
    }

    if (search) {
      whereConditions.push('(topic LIKE ? OR description LIKE ? OR content LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (start_date) {
      whereConditions.push('createdAt >= ?'); // ACTUAL field name
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('createdAt <= ?'); // ACTUAL field name
      params.push(end_date);
    }

    // Build final query
    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const validSortColumns = ['createdAt', 'updatedAt', 'topic', 'lessonNumber', 'approval_status'];
    const finalSortBy = validSortColumns.includes(sort_by) ? sort_by : 'updatedAt';
    const finalSortOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    let query = `
      SELECT *, prefixed_id, 
             'teaching' as content_type,
             topic as content_title,
             createdAt as content_createdAt,
             updatedAt as content_updatedAt
      FROM teachings 
      ${whereClause}
      ORDER BY ${finalSortBy} ${finalSortOrder}
    `;

    // Add pagination if specified
    if (page && limit) {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    }

    console.log('🔍 getAllTeachings query:', query);
    console.log('🔍 getAllTeachings params:', params);

    const rows = await db.query(query, params);
    return rows || [];
  } catch (error) {
    console.error('Error in getAllTeachings:', error);
    throw new CustomError(`Failed to fetch teachings: ${error.message}`);
  }
};

// ✅ Enhanced getTeachingsByUserId with proper validation
export const getTeachingsByUserId = async (user_id) => {
  try {
    if (!user_id) {
      throw new CustomError('User ID is required', 400);
    }

    // Convert to numeric if needed
    const numericUserId = typeof user_id === 'string' ? parseInt(user_id) : user_id;
    
    if (isNaN(numericUserId)) {
      throw new CustomError('Valid numeric user ID is required for teachings', 400);
    }

    const query = `
      SELECT *, prefixed_id,
             'teaching' as content_type,
             topic as content_title,
             createdAt as content_createdAt,
             updatedAt as content_updatedAt
      FROM teachings 
      WHERE user_id = ? 
      ORDER BY updatedAt DESC, createdAt DESC
    `;

    const rows = await db.query(query, [numericUserId]);
    return rows || [];
  } catch (error) {
    console.error('Error in getTeachingsByUserId:', error);
    throw new CustomError(`Failed to fetch user teachings: ${error.message}`);
  }
};

// ✅ Enhanced getTeachingByPrefixedId with fallback to numeric ID
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

// ✅ Enhanced createTeachingService with 8-step form support
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
      lessonNumber,
      approval_status = 'pending'
    } = data;

    // Validation for 8-step form
    if (!topic || !description || !user_id) {
      throw new CustomError('Topic, description, and user_id are required (steps 1-2 of 8-step form)', 400);
    }

    if (!content && (!media || media.length === 0)) {
      throw new CustomError('Either content (step 4) or media (steps 5-7) must be provided', 400);
    }

    // Ensure numeric user_id for teachings
    const numericUserId = typeof user_id === 'string' ? parseInt(user_id) : user_id;
    if (isNaN(numericUserId)) {
      throw new CustomError('Valid numeric user_id required for teachings', 400);
    }

    // Process media (max 3 files from steps 5-7)
    const [media1, media2, media3] = media.slice(0, 3);

    // Generate lesson number if not provided (step 1 enhancement)
    const finalLessonNumber = lessonNumber || `auto-${Date.now()}`;

    const sql = `
      INSERT INTO teachings 
      (topic, description, lessonNumber, subjectMatter, audience, content, 
       media_url1, media_type1, media_url2, media_type2, media_url3, media_type3, 
       user_id, approval_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      topic.trim(),
      description.trim(),
      finalLessonNumber,
      subjectMatter?.trim() || null,
      audience?.trim() || 'general',
      content?.trim() || null,
      media1?.url || null,
      media1?.type || null,
      media2?.url || null,
      media2?.type || null,
      media3?.url || null,
      media3?.type || null,
      numericUserId,
      approval_status
    ];

    console.log('🔍 createTeachingService SQL:', sql);
    console.log('🔍 createTeachingService params:', params);

    const result = await db.query(sql, params);

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

    console.log(`✅ Teaching created successfully with ID: ${createdTeaching[0].prefixed_id}`);
    return createdTeaching[0];
  } catch (error) {
    console.error('Error in createTeachingService:', error);
    throw new CustomError(error.message || 'Failed to create teaching');
  }
};

// ✅ Enhanced updateTeachingById with comprehensive validation
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
      approval_status,
      admin_notes,
      reviewed_by,
      reviewedAt
    } = data;

    // Check if teaching exists
    const existingTeaching = await db.query('SELECT id FROM teachings WHERE id = ?', [id]);
    if (!existingTeaching[0]) {
      throw new CustomError('Teaching not found', 404);
    }

    // Process media (8-step form support)
    const [media1, media2, media3] = media.slice(0, 3);

    // Build dynamic update query
    const updateFields = [];
    const params = [];

    if (topic !== undefined) {
      updateFields.push('topic = ?');
      params.push(topic.trim());
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description.trim());
    }

    if (lessonNumber !== undefined) {
      updateFields.push('lessonNumber = ?');
      params.push(lessonNumber);
    }

    if (subjectMatter !== undefined) {
      updateFields.push('subjectMatter = ?');
      params.push(subjectMatter?.trim() || null);
    }

    if (audience !== undefined) {
      updateFields.push('audience = ?');
      params.push(audience?.trim() || 'general');
    }

    if (content !== undefined) {
      updateFields.push('content = ?');
      params.push(content?.trim() || null);
    }

    if (approval_status !== undefined) {
      updateFields.push('approval_status = ?');
      params.push(approval_status);
    }

    if (admin_notes !== undefined) {
      updateFields.push('admin_notes = ?');
      params.push(admin_notes);
    }

    if (reviewed_by !== undefined) {
      updateFields.push('reviewed_by = ?');
      params.push(reviewed_by);
    }

    if (reviewedAt !== undefined) {
      updateFields.push('reviewedAt = ?');
      params.push(reviewedAt);
    }

    // Handle media updates (steps 5-7 of 8-step form)
    if (media.length > 0 || media1 !== undefined) {
      updateFields.push('media_url1 = ?', 'media_type1 = ?');
      params.push(media1?.url || null, media1?.type || null);
    }

    if (media.length > 1 || media2 !== undefined) {
      updateFields.push('media_url2 = ?', 'media_type2 = ?');
      params.push(media2?.url || null, media2?.type || null);
    }

    if (media.length > 2 || media3 !== undefined) {
      updateFields.push('media_url3 = ?', 'media_type3 = ?');
      params.push(media3?.url || null, media3?.type || null);
    }

    // Always update timestamp
    updateFields.push('updatedAt = NOW()');

    if (updateFields.length === 1) { // Only updatedAt
      throw new CustomError('No fields to update', 400);
    }

    const sql = `
      UPDATE teachings 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    params.push(id);

    console.log('🔍 updateTeachingById SQL:', sql);
    console.log('🔍 updateTeachingById params:', params);

    const result = await db.query(sql, params);

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

// ✅ Enhanced deleteTeachingById with cascade considerations
export const deleteTeachingById = async (id) => {
  try {
    if (!id) {
      throw new CustomError('Teaching ID is required', 400);
    }

    // Check if teaching exists and get prefixed_id for logging
    const existingTeaching = await db.query('SELECT prefixed_id FROM teachings WHERE id = ?', [id]);
    if (!existingTeaching[0]) {
      throw new CustomError('Teaching not found', 404);
    }

    // Delete related comments first (foreign key constraints)
    await db.query('DELETE FROM comments WHERE teaching_id = ?', [id]);
    console.log(`✅ Deleted comments for teaching ${id}`);

    // Delete the teaching
    const result = await db.query('DELETE FROM teachings WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      throw new CustomError('Teaching not found', 404);
    }

    console.log(`✅ Teaching deleted successfully: ${existingTeaching[0].prefixed_id}`);
    return { deleted: true, prefixed_id: existingTeaching[0].prefixed_id };
  } catch (error) {
    console.error('Error in deleteTeachingById:', error);
    throw new CustomError(error.message || 'Failed to delete teaching');
  }
};

// ✅ Enhanced getTeachingsByIds supporting both numeric and prefixed IDs
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
    return rows || [];
  } catch (error) {
    console.error('Error in getTeachingsByIds:', error);
    throw new CustomError(error.message || 'Failed to fetch teachings by IDs');
  }
};

// ✅ Enhanced searchTeachings with advanced search capabilities
export const searchTeachings = async (filters = {}) => {
  try {
    const { 
      query, 
      user_id, 
      audience, 
      subjectMatter,
      approval_status,
      limit = 50, 
      offset = 0,
      sort_by = 'relevance',
      sort_order = 'desc'
    } = filters;

    let whereConditions = [];
    let params = [];

    // Search in content fields
    if (query) {
      whereConditions.push('(topic LIKE ? OR description LIKE ? OR content LIKE ? OR subjectMatter LIKE ?)');
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (user_id) {
      whereConditions.push('user_id = ?');
      params.push(parseInt(user_id));
    }

    if (audience) {
      whereConditions.push('audience LIKE ?');
      params.push(`%${audience}%`);
    }

    if (subjectMatter) {
      whereConditions.push('subjectMatter LIKE ?');
      params.push(`%${subjectMatter}%`);
    }

    if (approval_status) {
      whereConditions.push('approval_status = ?');
      params.push(approval_status);
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // Handle sorting
    let orderClause = 'ORDER BY updatedAt DESC';
    
    if (sort_by === 'relevance' && query) {
      // Custom relevance scoring when searching
      orderClause = `ORDER BY 
        (CASE WHEN topic LIKE ? THEN 3 ELSE 0 END) +
        (CASE WHEN description LIKE ? THEN 2 ELSE 0 END) +
        (CASE WHEN content LIKE ? THEN 1 ELSE 0 END) DESC,
        updatedAt DESC`;
      
      // Add search term for relevance scoring
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    } else if (sort_by && sort_by !== 'relevance') {
      const validSortColumns = ['createdAt', 'updatedAt', 'topic', 'lessonNumber'];
      const finalSortBy = validSortColumns.includes(sort_by) ? sort_by : 'updatedAt';
      const finalSortOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      orderClause = `ORDER BY ${finalSortBy} ${finalSortOrder}`;
    }

    // Count query for pagination
    const countQuery = `SELECT COUNT(*) as total FROM teachings ${whereClause}`;
    const countParams = params.slice(0, whereConditions.length); // Exclude relevance scoring params
    
    const countResult = await db.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    // Main search query
    const searchQuery = `
      SELECT *, prefixed_id,
             'teaching' as content_type,
             topic as content_title,
             createdAt as content_createdAt,
             updatedAt as content_updatedAt
      FROM teachings 
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));

    console.log('🔍 searchTeachings query:', searchQuery);
    console.log('🔍 searchTeachings params:', params);

    const teachings = await db.query(searchQuery, params);

    return {
      teachings: teachings || [],
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
  } catch (error) {
    console.error('Error in searchTeachings:', error);
    throw new CustomError(error.message || 'Failed to search teachings');
  }
};

// ✅ Enhanced getTeachingStats with comprehensive analytics
export const getTeachingStats = async (user_id = null, options = {}) => {
  try {
    const { timeframe = '30days', include_breakdown = true } = options;

    let whereConditions = [];
    let params = [];

    if (user_id) {
      whereConditions.push('user_id = ?');
      params.push(parseInt(user_id));
    }

    // Handle timeframe filtering
    if (timeframe && timeframe !== 'all') {
      const days = parseInt(timeframe.replace('days', '')) || 30;
      whereConditions.push('createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)');
      params.push(days);
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // Basic stats query
    const statsQuery = `
      SELECT 
        COUNT(*) as total_teachings,
        COUNT(DISTINCT user_id) as total_authors,
        COUNT(DISTINCT audience) as unique_audiences,
        COUNT(DISTINCT subjectMatter) as unique_subjects,
        COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_teachings,
        COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_teachings,
        COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected_teachings,
        COUNT(CASE WHEN media_url1 IS NOT NULL OR media_url2 IS NOT NULL OR media_url3 IS NOT NULL THEN 1 END) as teachings_with_media,
        MIN(createdAt) as earliest_teaching,
        MAX(updatedAt) as latest_update
      FROM teachings 
      ${whereClause}
    `;

    const stats = await db.query(statsQuery, params);
    const basicStats = stats[0] || {};

    let result = {
      ...basicStats,
      timeframe,
      scope: user_id ? 'user_specific' : 'global',
      user_id: user_id || null
    };

    // Include breakdown if requested
    if (include_breakdown) {
      // Audience breakdown
      const audienceQuery = `
        SELECT audience, COUNT(*) as count 
        FROM teachings ${whereClause}
        GROUP BY audience 
        ORDER BY count DESC
      `;
      const audienceBreakdown = await db.query(audienceQuery, params);

      // Subject matter breakdown
      const subjectQuery = `
        SELECT subjectMatter, COUNT(*) as count 
        FROM teachings ${whereClause}
        GROUP BY subjectMatter 
        ORDER BY count DESC
        LIMIT 10
      `;
      const subjectBreakdown = await db.query(subjectQuery, params);

      // Monthly creation trends (last 12 months)
      const trendsQuery = `
        SELECT 
          DATE_FORMAT(createdAt, '%Y-%m') as month,
          COUNT(*) as count
        FROM teachings 
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH) ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
        GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
        ORDER BY month DESC
      `;
      const monthlyTrends = await db.query(trendsQuery, params);

      result.breakdown = {
        by_audience: audienceBreakdown || [],
        by_subject: subjectBreakdown || [],
        monthly_trends: monthlyTrends || []
      };
    }

    return result;
  } catch (error) {
    console.error('Error in getTeachingStats:', error);
    throw new CustomError('Failed to get teaching statistics');
  }
};

// ✅ New: Get teaching by lesson number
export const getTeachingByLessonNumber = async (lessonNumber, user_id = null) => {
  try {
    if (!lessonNumber) {
      throw new CustomError('Lesson number is required', 400);
    }

    let query = `
      SELECT *, prefixed_id,
             'teaching' as content_type,
             topic as content_title,
             createdAt as content_createdAt,
             updatedAt as content_updatedAt
      FROM teachings 
      WHERE lessonNumber = ?
    `;
    
    let params = [lessonNumber];

    // Add user filter if specified
    if (user_id) {
      query += ' AND user_id = ?';
      params.push(parseInt(user_id));
    }

    query += ' ORDER BY createdAt DESC LIMIT 1';

    const rows = await db.query(query, params);
    return rows[0] || null;
  } catch (error) {
    console.error('Error in getTeachingByLessonNumber:', error);
    throw new CustomError(`Failed to fetch teaching by lesson number: ${error.message}`);
  }
};

// ✅ New: Get teachings by date range
export const getTeachingsByDateRange = async (startDate, endDate, filters = {}) => {
  try {
    if (!startDate || !endDate) {
      throw new CustomError('Start date and end date are required', 400);
    }

    const { user_id, approval_status, audience, limit = 100 } = filters;

    let whereConditions = ['createdAt >= ?', 'createdAt <= ?'];
    let params = [startDate, endDate];

    if (user_id) {
      whereConditions.push('user_id = ?');
      params.push(parseInt(user_id));
    }

    if (approval_status) {
      whereConditions.push('approval_status = ?');
      params.push(approval_status);
    }

    if (audience) {
      whereConditions.push('audience LIKE ?');
      params.push(`%${audience}%`);
    }

    const query = `
      SELECT *, prefixed_id,
             'teaching' as content_type,
             topic as content_title,
             createdAt as content_createdAt,
             updatedAt as content_updatedAt
      FROM teachings 
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY createdAt DESC
      LIMIT ?
    `;

    params.push(parseInt(limit));

    const rows = await db.query(query, params);
    return rows || [];
  } catch (error) {
    console.error('Error in getTeachingsByDateRange:', error);
    throw new CustomError(`Failed to fetch teachings by date range: ${error.message}`);
  }
};




