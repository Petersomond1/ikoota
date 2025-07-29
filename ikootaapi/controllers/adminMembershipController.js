// ikootaapi/controllers/adminMembershipController.js
// ===============================================
// CLEAN ADMIN MEMBERSHIP CONTROLLER
// Handles only full membership application review by admins
// ===============================================

import db from '../config/db.js';

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

// Validate status values
const validateStatus = (status) => {
  const validStatuses = ['pending', 'approved', 'declined', 'suspended', 'all'];
  return validStatuses.includes(status);
};

// Validate review decision
const validateDecision = (decision) => {
  const validDecisions = ['approved', 'declined', 'suspended'];
  return validDecisions.includes(decision);
};

// ===============================================
// 1. GET FULL MEMBERSHIP APPLICATIONS
// ===============================================
export const getFullMembershipApplications = async (req, res) => {
  try {
    console.log('🔍 ADMIN: Fetching full membership applications');
    const { status = 'pending' } = req.query;

    // Validate status parameter
    if (!validateStatus(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status parameter',
        validValues: ['pending', 'approved', 'declined', 'suspended', 'all']
      });
    }

    let query = `
      SELECT 
        fma.id,
        fma.user_id,
        fma.membership_ticket,
        fma.answers,
        fma.status,
        fma.submittedAt,
        fma.reviewedAt,
        fma.reviewed_by,
        fma.admin_notes,
        u.username as user_name,
        u.email as user_email,
        reviewer.username as reviewer_name
      FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
    `;

    let queryParams = [];

    if (status !== 'all') {
      query += ' WHERE fma.status = ?';
      queryParams = [status];
    }

    query += ' ORDER BY fma.submittedAt DESC';

    console.log('🔍 Executing query:', query);
    console.log('🔍 Query params:', queryParams);

    const applications = await db.query(query, queryParams);
    
    console.log('✅ Found', applications.length, 'applications');

    res.json({
      success: true,
      data: applications,
      meta: {
        count: applications.length,
        status: status,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching applications:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to fetch membership applications'
    });
  }
};

// ===============================================
// 2. GET MEMBERSHIP STATISTICS
// ===============================================
export const getMembershipStats = async (req, res) => {
  try {
    console.log('🔍 ADMIN: Fetching membership statistics');
    
    const stats = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM full_membership_applications 
      GROUP BY status
    `);

    const result = {
      pending: 0,
      approved: 0,
      declined: 0,
      suspended: 0,
      total: 0
    };

    stats.forEach(stat => {
      result[stat.status] = stat.count;
      result.total += stat.count;
    });

    console.log('✅ Stats result:', result);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to fetch membership statistics'
    });
  }
};

// ===============================================
// 3. GET PENDING COUNT
// ===============================================
export const getPendingCount = async (req, res) => {
  try {
    console.log('🔍 ADMIN: Getting pending count');
    
    const result = await db.query(`
      SELECT COUNT(*) as count 
      FROM full_membership_applications 
      WHERE status = 'pending'
    `);

    const count = result[0]?.count || 0;
    console.log('✅ Pending count:', count);

    res.json({
      success: true,
      count: count,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting pending count:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      count: 0
    });
  }
};

// ===============================================
// 4. REVIEW INDIVIDUAL APPLICATION
// ===============================================
export const reviewApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    console.log('🔍 ADMIN: Reviewing application:', { id, status, adminNotes });
    
    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Application ID is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    // Validate status
    if (!validateDecision(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        validValues: ['approved', 'declined', 'suspended']
      });
    }

    // Check if application exists and is pending
    const existingApp = await db.query(`
      SELECT id, status, user_id 
      FROM full_membership_applications 
      WHERE id = ?
    `, [id]);

    if (existingApp.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    if (existingApp[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Application is already ${existingApp[0].status}`,
        currentStatus: existingApp[0].status
      });
    }

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Update the application
      await db.query(`
        UPDATE full_membership_applications 
        SET 
          status = ?,
          admin_notes = ?,
          reviewedAt = NOW(),
          reviewed_by = ?
        WHERE id = ?
      `, [status, adminNotes || '', req.user?.id || 1, id]);

      // If approved, update user's membership status
      if (status === 'approved') {
        await db.query(`
          UPDATE users 
          SET 
            is_member = 'member',
            membership_stage = 'member',
            full_membership_status = 'approved',
            fullMembershipReviewedAt = NOW()
          WHERE id = ?
        `, [existingApp[0].user_id]);

        console.log('✅ User promoted to full member');
      }

      // Commit transaction
      await db.query('COMMIT');

      console.log('✅ Application reviewed successfully');

      res.json({
        success: true,
        message: `Application ${status} successfully`,
        data: {
          applicationId: id,
          newStatus: status,
          userId: existingApp[0].user_id,
          reviewedBy: req.user?.id || 1,
          reviewedAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Error reviewing application:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to review application'
    });
  }
};

// ===============================================
// 5. BULK REVIEW APPLICATIONS
// ===============================================
export const bulkReviewApplications = async (req, res) => {
  try {
    const { applicationIds, decision, notes } = req.body;
    
    console.log('🔍 ADMIN: Bulk reviewing applications:', { applicationIds, decision, notes });
    
    // Validate input
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'applicationIds must be a non-empty array'
      });
    }

    if (!decision) {
      return res.status(400).json({
        success: false,
        error: 'Decision is required'
      });
    }

    if (!validateDecision(decision)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid decision',
        validValues: ['approved', 'declined', 'suspended']
      });
    }

    // Check if all applications exist and are pending
    const placeholders = applicationIds.map(() => '?').join(',');
    const existingApps = await db.query(`
      SELECT id, status, user_id 
      FROM full_membership_applications 
      WHERE id IN (${placeholders})
    `, applicationIds);

    if (existingApps.length !== applicationIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some applications were not found',
        found: existingApps.length,
        requested: applicationIds.length
      });
    }

    const nonPendingApps = existingApps.filter(app => app.status !== 'pending');
    if (nonPendingApps.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Some applications are not pending',
        nonPendingApps: nonPendingApps.map(app => ({ id: app.id, status: app.status }))
      });
    }

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Bulk update applications
      await db.query(`
        UPDATE full_membership_applications 
        SET 
          status = ?,
          admin_notes = ?,
          reviewedAt = NOW(),
          reviewed_by = ?
        WHERE id IN (${placeholders})
      `, [decision, notes || '', req.user?.id || 1, ...applicationIds]);

      // If approved, update users' membership status
      if (decision === 'approved') {
        const userIds = existingApps.map(app => app.user_id);
        const userPlaceholders = userIds.map(() => '?').join(',');
        
        await db.query(`
          UPDATE users 
          SET 
            is_member = 'member',
            membership_stage = 'member',
            full_membership_status = 'approved',
            fullMembershipReviewedAt = NOW()
          WHERE id IN (${userPlaceholders})
        `, userIds);

        console.log(`✅ ${userIds.length} users promoted to full members`);
      }

      // Commit transaction
      await db.query('COMMIT');

      console.log('✅ Bulk review completed successfully');

      res.json({
        success: true,
        message: `${applicationIds.length} applications ${decision} successfully`,
        data: {
          processedCount: applicationIds.length,
          applicationIds: applicationIds,
          decision: decision,
          reviewedBy: req.user?.id || 1,
          reviewedAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Error in bulk review:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to bulk review applications'
    });
  }
};

// ===============================================
// 6. GET APPLICATION DETAILS
// ===============================================
export const getApplicationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Application ID is required'
      });
    }
    
    console.log('🔍 ADMIN: Getting application details for ID:', id);
    
    const applications = await db.query(`
      SELECT 
        fma.*,
        u.username,
        u.email,
        u.membership_stage,
        u.is_member,
        reviewer.username as reviewer_name
      FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
      WHERE fma.id = ?
    `, [id]);

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    console.log('✅ Application details retrieved');

    res.json({
      success: true,
      data: applications[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting application details:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to get application details'
    });
  }
};

// ===============================================
// 7. DEBUG FUNCTIONS (development only)
// ===============================================
export const debugTest = async (req, res) => {
  try {
    const result = await db.query('SELECT COUNT(*) as count FROM full_membership_applications');
    res.json({
      success: true,
      message: 'Database connection working',
      totalApplications: result[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

console.log('✅ Clean admin membership controller loaded');