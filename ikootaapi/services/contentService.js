
// services/contentService.js - COMPLETE FILE
export class ContentService {
  
  // Get teachings with proper access control
  static async getTeachings(userId, userMembershipStage) {
    try {
      let accessFilter = '';
      
      // Determine access level
      if (['admin', 'super_admin'].includes(userMembershipStage)) {
        accessFilter = ''; // Admins see everything
      } else if (userMembershipStage === 'member') {
        accessFilter = "AND (t.audience IN ('public', 'member') OR t.user_id = $2)";
      } else if (userMembershipStage === 'pre_member') {
        accessFilter = "AND (t.audience = 'public' OR t.user_id = $2)";
      } else {
        accessFilter = "AND t.audience = 'public'";
      }

      const query = `
        SELECT t.*, u.username as author_name, u.membership_stage as author_level,
               COUNT(DISTINCT c.id) as comment_count,
               COUNT(DISTINCT l.id) as like_count
        FROM teachings t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN comments c ON t.id = c.teaching_id
        LEFT JOIN teaching_likes l ON t.id = l.teaching_id
        WHERE t.is_published = true ${accessFilter}
        GROUP BY t.id, u.username, u.membership_stage
        ORDER BY t.created_at DESC
      `;

      const values = accessFilter ? [userId, userId] : [userId];
      const result = await db.query(query, values);
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching teachings:', error);
      throw new Error('Failed to fetch teachings');
    }
  }

  // Create new teaching
  static async createTeaching(userId, teachingData) {
    try {
      const { topic, description, content, audience = 'member', subjectMatter } = teachingData;
      
      // Verify user can create teachings
      const user = await db.query(`
        SELECT membership_stage FROM users WHERE id = $1
      `, [userId]);

      if (!user.rows[0] || !['member', 'admin', 'super_admin'].includes(user.rows[0].membership_stage)) {
        throw new Error('Only full members can create teachings');
      }

      const result = await db.query(`
        INSERT INTO teachings (user_id, topic, description, content, audience, subject_matter, is_published, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP)
        RETURNING *
      `, [userId, topic, description, content, audience, subjectMatter]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating teaching:', error);
      throw new Error('Failed to create teaching');
    }
  }

  // Get user's own teachings
  static async getUserTeachings(userId) {
    try {
      const result = await db.query(`
        SELECT t.*, 
               COUNT(DISTINCT c.id) as comment_count,
               COUNT(DISTINCT l.id) as like_count
        FROM teachings t
        LEFT JOIN comments c ON t.id = c.teaching_id
        LEFT JOIN teaching_likes l ON t.id = l.teaching_id
        WHERE t.user_id = $1
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `, [userId]);

      return result.rows;
    } catch (error) {
      console.error('Error fetching user teachings:', error);
      throw new Error('Failed to fetch user teachings');
    }
  }

  // Get Towncrier content (pre-member level)
  static async getTowncrier(userId, userMembershipStage) {
    try {
      if (!['pre_member', 'member', 'admin', 'super_admin'].includes(userMembershipStage)) {
        throw new Error('Access denied: Insufficient membership level');
      }

      const result = await db.query(`
        SELECT t.*, u.username as author_name,
               COUNT(DISTINCT c.id) as comment_count
        FROM teachings t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN comments c ON t.id = c.teaching_id
        WHERE t.audience IN ('public') 
        AND t.is_published = true
        GROUP BY t.id, u.username
        ORDER BY t.created_at DESC
        LIMIT 20
      `);

      return result.rows;
    } catch (error) {
      console.error('Error fetching Towncrier:', error);
      throw new Error('Failed to fetch Towncrier content');
    }
  }

  // Get Iko content (full member level)
  static async getIko(userId, userMembershipStage) {
    try {
      if (!['member', 'admin', 'super_admin'].includes(userMembershipStage)) {
        throw new Error('Access denied: Full membership required');
      }

      const result = await db.query(`
        SELECT t.*, u.username as author_name,
               COUNT(DISTINCT c.id) as comment_count
        FROM teachings t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN comments c ON t.id = c.teaching_id
        WHERE t.audience IN ('member') 
        AND t.is_published = true
        GROUP BY t.id, u.username
        ORDER BY t.created_at DESC
        LIMIT 50
      `);

      return result.rows;
    } catch (error) {
      console.error('Error fetching Iko:', error);
      throw new Error('Failed to fetch Iko content');
    }
  }

  // Update teaching
  static async updateTeaching(teachingId, userId, updateData) {
    try {
      const allowedFields = ['topic', 'description', 'content', 'audience', 'subject_matter', 'is_published'];
      const updates = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(teachingId, userId);
      const query = `
        UPDATE teachings 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
        RETURNING *
      `;

      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Teaching not found or unauthorized');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating teaching:', error);
      throw new Error('Failed to update teaching');
    }
  }

  // Delete teaching
  static async deleteTeaching(teachingId, userId) {
    try {
      const result = await db.query(`
        DELETE FROM teachings 
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `, [teachingId, userId]);

      if (result.rows.length === 0) {
        throw new Error('Teaching not found or unauthorized');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error deleting teaching:', error);
      throw new Error('Failed to delete teaching');
    }
  }

  // Get teaching by ID
  static async getTeachingById(teachingId) {
    try {
      const result = await db.query(`
        SELECT t.*, u.username as author_name,
               COUNT(DISTINCT c.id) as comment_count,
               COUNT(DISTINCT l.id) as like_count
        FROM teachings t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN comments c ON t.id = c.teaching_id
        LEFT JOIN teaching_likes l ON t.id = l.teaching_id
        WHERE t.id = $1
        GROUP BY t.id, u.username
      `, [teachingId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching teaching:', error);
      throw new Error('Failed to fetch teaching');
    }
  }
};