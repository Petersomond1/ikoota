// services/applicationService.js - COMPLETE FILE
export class ApplicationService {
  
  // Submit initial application
  static async submitInitialApplication(userId, answers) {
    try {
      // Check if user already has a pending application
      const existingApp = await db.query(`
        SELECT id FROM surveylog 
        WHERE user_id = $1 AND approval_status = 'pending'
      `, [userId]);

      if (existingApp.rows.length > 0) {
        throw new Error('You already have a pending application');
      }

      // Insert application
      const result = await db.query(`
        INSERT INTO surveylog (user_id, survey_data, approval_status, created_at)
        VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP)
        RETURNING *
      `, [userId, JSON.stringify({ type: 'initial', answers })]);

      // Update user status to applicant
      await db.query(`
        UPDATE users 
        SET membership_stage = 'applicant', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [userId]);

      return result.rows[0];
    } catch (error) {
      console.error('Error submitting application:', error);
      throw new Error('Failed to submit application');
    }
  }

  // Submit full membership application
  static async submitFullMembershipApplication(userId, answers) {
    try {
      // Verify user is pre-member
      const user = await db.query(`
        SELECT membership_stage FROM users WHERE id = $1
      `, [userId]);

      if (!user.rows[0] || user.rows[0].membership_stage !== 'pre_member') {
        throw new Error('Only pre-members can apply for full membership');
      }

      // Insert full membership application
      const result = await db.query(`
        INSERT INTO surveylog (user_id, survey_data, approval_status, created_at)
        VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP)
        RETURNING *
      `, [userId, JSON.stringify({ type: 'full_membership', answers })]);

      return result.rows[0];
    } catch (error) {
      console.error('Error submitting full membership application:', error);
      throw new Error('Failed to submit full membership application');
    }
  }

  // Get application status
  static async getApplicationStatus(userId, applicationType = 'initial') {
    try {
      const result = await db.query(`
        SELECT s.*, u.username, u.email
        FROM surveylog s
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id = $1 
        AND s.survey_data->>'type' = $2
        ORDER BY s.created_at DESC
        LIMIT 1
      `, [userId, applicationType]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching application status:', error);
      throw new Error('Failed to fetch application status');
    }
  }

  // Get all applications by user
  static async getAllUserApplications(userId) {
    try {
      const result = await db.query(`
        SELECT * FROM surveylog 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [userId]);

      return result.rows;
    } catch (error) {
      console.error('Error fetching user applications:', error);
      throw new Error('Failed to fetch user applications');
    }
  }

  // Cancel application
  static async cancelApplication(userId, applicationId) {
    try {
      const result = await db.query(`
        UPDATE surveylog 
        SET approval_status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2 AND approval_status = 'pending'
        RETURNING *
      `, [applicationId, userId]);

      if (result.rows.length === 0) {
        throw new Error('Application not found or cannot be cancelled');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error cancelling application:', error);
      throw new Error('Failed to cancel application');
    }
  }
};