// services/adminService.js - COMPLETE FILE
export class AdminService {
  
  // Get all users with pagination
  static async getAllUsers(page = 1, limit = 20, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = '';
      const queryParams = [];
      let paramCount = 1;

      // Build filter conditions
      if (filters.membership_stage) {
        whereClause += ` WHERE membership_stage = $${paramCount}`;
        queryParams.push(filters.membership_stage);
        paramCount++;
      }

      if (filters.search) {
        const searchClause = whereClause ? ' AND' : ' WHERE';
        whereClause += `${searchClause} (username ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        queryParams.push(`%${filters.search}%`);
        paramCount++;
      }

      // Get total count
      const countResult = await db.query(`
        SELECT COUNT(*) as total FROM users${whereClause}
      `, queryParams);

      // Get users
      queryParams.push(limit, offset);
      const result = await db.query(`
        SELECT u.*, 
               COUNT(DISTINCT t.id) as teaching_count,
               COUNT(DISTINCT c.id) as comment_count,
               MAX(s.created_at) as last_application_date
        FROM users u
        LEFT JOIN teachings t ON u.id = t.user_id
        LEFT JOIN comments c ON u.id = c.user_id
        LEFT JOIN surveylog s ON u.id = s.user_id
        ${whereClause}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `, queryParams);

      return {
        users: result.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  // Get pending applications
  static async getPendingApplications() {
    try {
      const result = await db.query(`
        SELECT s.*, u.username, u.email, u.membership_stage,
               u.created_at as user_created_at
        FROM surveylog s
        JOIN users u ON s.user_id = u.id
        WHERE s.approval_status = 'pending'
        ORDER BY s.created_at ASC
      `);

      return result.rows;
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw new Error('Failed to fetch applications');
    }
  }

  // Review application
  static async reviewApplication(applicationId, adminId, decision, adminNotes = '') {
    try {
      const validDecisions = ['approved', 'rejected', 'needs_review'];
      if (!validDecisions.includes(decision)) {
        throw new Error('Invalid decision');
      }

      // Update application
      const result = await db.query(`
        UPDATE surveylog 
        SET approval_status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `, [decision, adminNotes, adminId, applicationId]);

      if (result.rows.length === 0) {
        throw new Error('Application not found');
      }

      const application = result.rows[0];

      // Update user membership status if approved
      if (decision === 'approved') {
        const surveyData = application.survey_data;
        const applicationType = surveyData.type;
        
        let newMembershipStage;
        if (applicationType === 'initial') {
          newMembershipStage = 'pre_member';
        } else if (applicationType === 'full_membership') {
          newMembershipStage = 'member';
        }

        if (newMembershipStage) {
          await db.query(`
            UPDATE users 
            SET membership_stage = $1, is_member = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [newMembershipStage, application.user_id]);
        }
      }

      return application;
    } catch (error) {
      console.error('Error reviewing application:', error);
      throw new Error('Failed to review application');
    }
  }

  // Get system statistics
  static async getSystemStats() {
    try {
      const stats = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM users WHERE membership_stage = 'applicant') as pending_applicants,
          (SELECT COUNT(*) FROM users WHERE membership_stage = 'pre_member') as pre_members,
          (SELECT COUNT(*) FROM users WHERE membership_stage = 'member') as full_members,
          (SELECT COUNT(*) FROM teachings WHERE is_published = true) as total_teachings,
          (SELECT COUNT(*) FROM comments) as total_comments,
          (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_applications
      `);

      return stats.rows[0];
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw new Error('Failed to fetch system statistics');
    }
  }

  // Get application by ID
  static async getApplicationById(applicationId) {
    try {
      const result = await db.query(`
        SELECT s.*, u.username, u.email, u.membership_stage
        FROM surveylog s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = $1
      `, [applicationId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching application:', error);
      throw new Error('Failed to fetch application');
    }
  }

  // Get all applications with filters
  static async getAllApplications(filters = {}) {
    try {
      let whereClause = '';
      const queryParams = [];
      let paramCount = 1;

      if (filters.status) {
        whereClause += ` WHERE s.approval_status = $${paramCount}`;
        queryParams.push(filters.status);
        paramCount++;
      }

      if (filters.type) {
        const typeClause = whereClause ? ' AND' : ' WHERE';
        whereClause += `${typeClause} s.survey_data->>'type' = $${paramCount}`;
        queryParams.push(filters.type);
        paramCount++;
      }

      const result = await db.query(`
        SELECT s.*, u.username, u.email, u.membership_stage,
               u.created_at as user_created_at
        FROM surveylog s
        JOIN users u ON s.user_id = u.id
        ${whereClause}
        ORDER BY s.created_at DESC
      `, queryParams);

      return result.rows;
    } catch (error) {
      console.error('Error fetching all applications:', error);
      throw new Error('Failed to fetch applications');
    }
  }

  // Delete user (admin only)
  static async deleteUser(userId) {
    try {
      const result = await db.query(`
        DELETE FROM users WHERE id = $1
        RETURNING *
      `, [userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }
};