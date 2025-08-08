// ikootaapi/controllers/adminApplicationController.js
// COMPLETE DIAGNOSTIC VERSION - All functions with enhanced logging

import db from '../config/db.js';

/**
 * Enhanced helper function to handle timestamp column variations (camelCase + snake_case)
 */
const getTimestamp = (obj, fieldName) => {
  if (!obj) return null;
  
  // Try camelCase first (preferred for your database)
  const camelCase = obj[fieldName];
  if (camelCase) return camelCase;
  
  // Convert camelCase to snake_case and try that (fallback)
  const snakeCase = fieldName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  return obj[snakeCase] || null;
};

/**
 * DIAGNOSTIC: Get all full membership applications with extensive logging
 * GET /admin/membership/applications
 */
export const getAllPendingMembershipApplications = async (req, res) => {
  console.log('🔍 DIAGNOSTIC: === getAllPendingMembershipApplications START ===');
  console.log('🔍 DIAGNOSTIC: Request params:', req.params);
  console.log('🔍 DIAGNOSTIC: Request query:', req.query);
  console.log('🔍 DIAGNOSTIC: Request headers:', {
    authorization: req.headers.authorization ? 'Present' : 'Missing',
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
  });
  
  try {
    const { status = 'pending', limit = 50, offset = 0, sortBy = 'submittedAt', sortOrder = 'DESC' } = req.query;

    console.log('🔍 DIAGNOSTIC: Processed query params:', { status, limit, offset, sortBy, sortOrder });

    // ✅ Test database connection first
    console.log('🔍 DIAGNOSTIC: Testing database connection...');
    const [connectionTest] = await db.query('SELECT 1 as test');
    console.log('✅ DIAGNOSTIC: Database connection OK:', connectionTest);

    // ✅ Direct query with aliases - no complex views needed
    const query = `
      SELECT 
        'full_membership' as application_type,
        u.id as user_id,
        u.username,
        u.email,
        fma.membership_ticket as ticket,
        fma.status,
        fma.submittedAt,
        fma.reviewedAt,
        fma.reviewed_by,
        fma.admin_notes,
        reviewer.username as reviewer_name
      FROM users u
      JOIN full_membership_applications fma ON u.id = fma.user_id
      LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
      WHERE fma.status = ?
      ORDER BY fma.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    console.log('🔍 DIAGNOSTIC: Executing query:', query);
    console.log('🔍 DIAGNOSTIC: Query params:', [status, parseInt(limit), parseInt(offset)]);

    const [applications] = await db.query(query, [status, parseInt(limit), parseInt(offset)]);
    console.log('✅ DIAGNOSTIC: Query executed, found applications:', applications.length);
    console.log('✅ DIAGNOSTIC: First application sample:', applications[0] || 'None');
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      WHERE fma.status = ?
    `;
    
    console.log('🔍 DIAGNOSTIC: Executing count query...');
    const [countResult] = await db.query(countQuery, [status]);
    const total = countResult[0].total;
    console.log('✅ DIAGNOSTIC: Total count:', total);

    // Get application answers from the main applications table
    console.log('🔍 DIAGNOSTIC: Fetching answers for applications...');
    const applicationsWithAnswers = await Promise.all(
      applications.map(async (app, index) => {
        try {
          console.log(`🔍 DIAGNOSTIC: Fetching answers for app ${index + 1}/${applications.length}, user_id:`, app.user_id);
          
          const [answerResult] = await db.query(
            'SELECT answers FROM full_membership_applications WHERE user_id = ?',
            [app.user_id]
          );
          
          const processedApp = {
            ...app,
            id: app.user_id, // Use user_id as application ID for compatibility
            answers: answerResult[0]?.answers ? JSON.parse(answerResult[0].answers) : null,
            membership_ticket: app.ticket,
            user_name: app.username,
            user_email: app.email,
            // ✅ Ensure camelCase timestamps
            submittedAt: getTimestamp(app, 'submittedAt') || app.submittedAt,
            reviewedAt: getTimestamp(app, 'reviewedAt') || app.reviewedAt,
            reviewedBy: app.reviewed_by,
            adminNotes: app.admin_notes,
            reviewerName: app.reviewer_name
          };
          
          console.log(`✅ DIAGNOSTIC: Processed app ${index + 1}:`, {
            id: processedApp.id,
            username: processedApp.username,
            hasAnswers: !!processedApp.answers,
            answersLength: Array.isArray(processedApp.answers) ? processedApp.answers.length : 'Not array'
          });
          
          return processedApp;
        } catch (error) {
          console.error(`❌ DIAGNOSTIC: Error fetching answers for user ${app.user_id}:`, error);
          return {
            ...app,
            id: app.user_id,
            answers: null,
            membership_ticket: app.ticket,
            user_name: app.username,
            user_email: app.email,
            submittedAt: getTimestamp(app, 'submittedAt') || app.submittedAt,
            reviewedAt: getTimestamp(app, 'reviewedAt') || app.reviewedAt,
            error: 'Failed to fetch answers'
          };
        }
      })
    );

    console.log('✅ DIAGNOSTIC: All applications processed, final count:', applicationsWithAnswers.length);

    const responseData = {
      success: true,
      data: {
        applications: applicationsWithAnswers,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total,
          page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
          totalPages: Math.ceil(total / parseInt(limit))
        },
        reviewer: req.reviewer?.username || req.user?.username || 'system',
        reviewerRole: req.reviewer?.role || req.user?.role || 'admin'
      }
    };

    console.log('✅ DIAGNOSTIC: Response data structure:', {
      success: responseData.success,
      applicationsCount: responseData.data.applications.length,
      pagination: responseData.data.pagination,
      reviewer: responseData.data.reviewer
    });

    console.log('🔍 DIAGNOSTIC: === getAllPendingMembershipApplications END ===');
    
    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ DIAGNOSTIC: CRITICAL ERROR in getAllPendingMembershipApplications:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    const errorResponse = { 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        sql: error.sql
      } : undefined,
      timestamp: new Date().toISOString(),
      endpoint: '/admin/membership/applications'
    };
    
    console.log('❌ DIAGNOSTIC: Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
};

/**
 * DIAGNOSTIC: Get full membership statistics with extensive logging
 * GET /admin/membership/full-membership-stats
 */
export const getFullMembershipStats = async (req, res) => {
  console.log('🔍 DIAGNOSTIC: === getFullMembershipStats START ===');
  
  try {
    console.log('🔍 DIAGNOSTIC: Testing database connection...');
    const [connectionTest] = await db.query('SELECT 1 as test');
    console.log('✅ DIAGNOSTIC: Database connection OK');
    
    // ✅ Direct query - no views needed
    const statsQuery = `
      SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN status = 'approved' AND MONTH(reviewedAt) = MONTH(CURRENT_DATE()) AND YEAR(reviewedAt) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as approvedCount,
        SUM(CASE WHEN status = 'declined' AND MONTH(reviewedAt) = MONTH(CURRENT_DATE()) AND YEAR(reviewedAt) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as declinedCount,
        COUNT(*) as totalApplications,
        AVG(CASE 
          WHEN status IN ('approved', 'declined') AND reviewedAt IS NOT NULL AND submittedAt IS NOT NULL
          THEN DATEDIFF(reviewedAt, submittedAt) 
          ELSE NULL 
        END) as avgReviewTime
      FROM full_membership_applications
    `;
    
    console.log('🔍 DIAGNOSTIC: Executing stats query:', statsQuery);
    const [statsResult] = await db.query(statsQuery);
    const stats = statsResult[0];
    
    console.log('✅ DIAGNOSTIC: Raw stats result:', stats);

    const responseData = {
      success: true,
      data: {
        pending: parseInt(stats.pendingCount) || 0,
        approved: parseInt(stats.approvedCount) || 0,
        declined: parseInt(stats.declinedCount) || 0,
        total: parseInt(stats.totalApplications) || 0,
        avgReviewTime: parseFloat(stats.avgReviewTime || 0)
      }
    };

    console.log('✅ DIAGNOSTIC: Processed response data:', responseData);
    console.log('🔍 DIAGNOSTIC: === getFullMembershipStats END ===');

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ DIAGNOSTIC: CRITICAL ERROR in getFullMembershipStats:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql
    });
    
    const errorResponse = { 
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined,
      timestamp: new Date().toISOString(),
      endpoint: '/admin/membership/full-membership-stats'
    };
    
    console.log('❌ DIAGNOSTIC: Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
};

/**
 * DIAGNOSTIC: Get pending full membership count
 * GET /admin/membership/pending-count
 */
export const getPendingFullMembershipCount = async (req, res) => {
  console.log('🔍 DIAGNOSTIC: === getPendingFullMembershipCount START ===');
  
  try {
    console.log('🔍 DIAGNOSTIC: Testing database connection...');
    const [connectionTest] = await db.query('SELECT 1 as test');
    console.log('✅ DIAGNOSTIC: Database connection OK');
    
    // ✅ Direct query instead of view
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM full_membership_applications
      WHERE status = 'pending'
    `;
    
    console.log('🔍 DIAGNOSTIC: Executing count query:', countQuery);
    const [countResult] = await db.query(countQuery);
    const count = countResult[0]?.count || 0;
    
    console.log('✅ DIAGNOSTIC: Count result:', count);

    const responseData = {
      success: true,
      count: count
    };
    
    console.log('✅ DIAGNOSTIC: Response data:', responseData);
    console.log('🔍 DIAGNOSTIC: === getPendingFullMembershipCount END ===');

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ DIAGNOSTIC: CRITICAL ERROR in getPendingFullMembershipCount:', {
      message: error.message,
      stack: error.stack
    });
    
    const errorResponse = { 
      success: false,
      message: 'Failed to fetch pending count',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message
      } : undefined,
      timestamp: new Date().toISOString(),
      endpoint: '/admin/membership/pending-count'
    };
    
    console.log('❌ DIAGNOSTIC: Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
};

/**
 * DIAGNOSTIC: Review full membership application with proper transaction safety
 * PUT /admin/membership/review/:applicationId
 */
export const reviewMembershipApplication = async (req, res) => {
  console.log('🔍 DIAGNOSTIC: === reviewMembershipApplication START ===');
  console.log('🔍 DIAGNOSTIC: Request params:', req.params);
  console.log('🔍 DIAGNOSTIC: Request body:', req.body);
  
  let connection = null;
  
  try {
    const { applicationId } = req.params;
    const { status, adminNotes } = req.body;
    const reviewer = req.user || { id: 1, username: 'system' }; // Fallback for testing
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); // MySQL datetime format

    console.log('🔍 DIAGNOSTIC: Processing review:', { applicationId, status, reviewerId: reviewer.id, timestamp });

    // Validate input
    if (!['approved', 'declined'].includes(status)) {
      console.log('❌ DIAGNOSTIC: Invalid status provided:', status);
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or declined'
      });
    }

    // Get application details using direct query
    console.log('🔍 DIAGNOSTIC: Fetching application details...');
    const [appCheck] = await db.query(`
      SELECT fma.user_id, u.username, u.email, fma.membership_ticket as ticket
      FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      WHERE fma.user_id = ? AND fma.status = 'pending'
    `, [applicationId]);

    console.log('✅ DIAGNOSTIC: Application check result:', appCheck);

    if (appCheck.length === 0) {
      console.log('❌ DIAGNOSTIC: No pending application found for ID:', applicationId);
      return res.status(404).json({ 
        success: false,
        message: 'Pending application not found' 
      });
    }

    const application = appCheck[0];
    const userId = application.user_id;

    console.log('🔍 DIAGNOSTIC: Found application:', application);

    // Get connection and begin transaction
    console.log('🔍 DIAGNOSTIC: Starting database transaction...');
    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // ✅ Update the main full_membership_applications table
      console.log('🔍 DIAGNOSTIC: Updating application status...');
      await connection.query(`
        UPDATE full_membership_applications 
        SET status = ?, reviewedAt = ?, reviewed_by = ?, admin_notes = ?, updatedAt = NOW()
        WHERE user_id = ?
      `, [status, timestamp, reviewer.id, adminNotes, userId]);

      // ✅ Update users table with new membership status
      if (status === 'approved') {
        console.log('🔍 DIAGNOSTIC: Upgrading user to full member...');
        // UPGRADE: pre_member → member
        await connection.query(`
          UPDATE users 
          SET membership_stage = 'member',
              is_member = 'member',
              full_membership_status = 'approved',
              fullMembershipReviewedAt = ?,
              updatedAt = NOW()
          WHERE id = ?
        `, [timestamp, userId]);

        // Grant member access
        console.log('🔍 DIAGNOSTIC: Granting member access...');
        await connection.query(`
          INSERT INTO full_membership_access (user_id, firstAccessedAt, access_count, createdAt, updatedAt)
          VALUES (?, ?, 0, NOW(), NOW())
          ON DUPLICATE KEY UPDATE 
            access_count = access_count,
            updatedAt = NOW()
        `, [userId, timestamp]);

      } else {
        console.log('🔍 DIAGNOSTIC: Declining application...');
        // DECLINE: Remains pre_member, but mark application as declined
        await connection.query(`
          UPDATE users 
          SET full_membership_status = 'declined',
              fullMembershipReviewedAt = ?,
              updatedAt = NOW()
          WHERE id = ?
        `, [timestamp, userId]);
      }

      // ✅ Log to membership_review_history table
      console.log('🔍 DIAGNOSTIC: Logging to review history...');
      await connection.query(`
        INSERT INTO membership_review_history (
          user_id, application_type, reviewer_id, previous_status, new_status, 
          review_notes, action_taken, reviewedAt, notification_sent
        ) VALUES (?, 'full_membership', ?, 'pending', ?, ?, ?, ?, 0)
      `, [
        userId, 
        reviewer.id, 
        status, 
        adminNotes, 
        status === 'approved' ? 'approve' : 'decline',
        timestamp
      ]);

      // Log the review action in audit_logs
      console.log('🔍 DIAGNOSTIC: Logging to audit logs...');
      await connection.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'full_membership_application_reviewed', ?, NOW())
      `, [reviewer.id, JSON.stringify({
        applicationId: applicationId,
        applicantId: userId,
        applicantUsername: application.username,
        decision: status,
        adminNotes: adminNotes,
        reviewerInfo: reviewer,
        ticket: application.ticket,
        reviewedAt: timestamp
      })]);

      console.log('🔍 DIAGNOSTIC: Committing transaction...');
      await connection.commit();

      const responseData = {
        success: true,
        message: `Full membership application ${status} successfully`,
        data: {
          applicationId: applicationId,
          decision: status,
          userId: userId,
          applicantUsername: application.username,
          reviewedBy: reviewer.username,
          reviewedAt: timestamp,
          adminNotes: adminNotes,
          ticket: application.ticket
        }
      };

      console.log('✅ DIAGNOSTIC: Review completed successfully:', responseData);
      console.log('🔍 DIAGNOSTIC: === reviewMembershipApplication END ===');
      
      res.json(responseData);

    } catch (transactionError) {
      console.error('❌ DIAGNOSTIC: Transaction error, rolling back:', transactionError);
      await connection.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ DIAGNOSTIC: CRITICAL ERROR in reviewMembershipApplication:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql
    });
    
    const errorResponse = { 
      success: false,
      message: 'Failed to review application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
    
    console.log('❌ DIAGNOSTIC: Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  } finally {
    if (connection) {
      console.log('🔍 DIAGNOSTIC: Releasing database connection...');
      connection.release();
    }
  }
};

/**
 * DIAGNOSTIC: Get application statistics using direct queries
 * GET /admin/applications/stats
 */
export const getApplicationStats = async (req, res) => {
  console.log('🔍 DIAGNOSTIC: === getApplicationStats START ===');
  
  try {
    console.log('🔍 DIAGNOSTIC: Testing database connection...');
    const [connectionTest] = await db.query('SELECT 1 as test');
    console.log('✅ DIAGNOSTIC: Database connection OK');
    
    // ✅ Direct query for main stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_applications,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) as declined_count,
        AVG(CASE 
          WHEN status IN ('approved', 'declined') AND reviewedAt IS NOT NULL AND submittedAt IS NOT NULL
          THEN TIMESTAMPDIFF(HOUR, submittedAt, reviewedAt) 
          ELSE NULL 
        END) as avg_review_time_hours
      FROM full_membership_applications
    `;
    
    console.log('🔍 DIAGNOSTIC: Executing stats query...');
    const [stats] = await db.query(statsQuery);
    console.log('✅ DIAGNOSTIC: Stats result:', stats[0]);
    
    // ✅ Get recent activity using direct query
    const recentQuery = `
      SELECT 
        mrh.user_id,
        mrh.new_status as status,
        mrh.reviewedAt,
        mrh.action_taken,
        u.username,
        reviewer.username as reviewer_name
      FROM membership_review_history mrh
      JOIN users u ON mrh.user_id = u.id
      LEFT JOIN users reviewer ON mrh.reviewer_id = reviewer.id
      WHERE mrh.application_type = 'full_membership'
        AND mrh.reviewedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY mrh.reviewedAt DESC
      LIMIT 10
    `;
    
    console.log('🔍 DIAGNOSTIC: Executing recent activity query...');
    const [recentActivity] = await db.query(recentQuery);
    console.log('✅ DIAGNOSTIC: Recent activity result:', recentActivity.length, 'records');
    
    // Normalize recent activity
    const normalizedRecentActivity = recentActivity.map(activity => ({
      ...activity,
      reviewedAt: getTimestamp(activity, 'reviewedAt') || activity.reviewedAt,
      actionTaken: activity.action_taken,
      reviewerName: activity.reviewer_name
    }));
    
    const responseData = {
      success: true,
      data: {
        statistics: stats[0],
        recentActivity: normalizedRecentActivity
      }
    };

    console.log('✅ DIAGNOSTIC: Response data prepared:', {
      statisticsKeys: Object.keys(responseData.data.statistics),
      recentActivityCount: responseData.data.recentActivity.length
    });
    console.log('🔍 DIAGNOSTIC: === getApplicationStats END ===');
    
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ DIAGNOSTIC: CRITICAL ERROR in getApplicationStats:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql
    });
    
    const errorResponse = {
      success: false,
      message: 'Failed to get application statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
    
    console.log('❌ DIAGNOSTIC: Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
};

/**
 * DIAGNOSTIC: Bulk review applications with safe approach
 * POST /admin/membership/bulk-review
 */
export const bulkReviewApplications = async (req, res) => {
  console.log('🔍 DIAGNOSTIC: === bulkReviewApplications START ===');
  console.log('🔍 DIAGNOSTIC: Request body:', req.body);
  
  let connection = null;
  
  try {
    const { applicationIds, decision, notes } = req.body;
    const reviewer = req.user || { id: 1, username: 'system' }; // Fallback for testing

    console.log('🔍 DIAGNOSTIC: Processing bulk review:', { 
      applicationIds, 
      decision, 
      notes, 
      reviewerId: reviewer.id 
    });

    // Validate input
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      console.log('❌ DIAGNOSTIC: Invalid applicationIds:', applicationIds);
      return res.status(400).json({
        success: false,
        message: 'Invalid applicationIds. Must be a non-empty array'
      });
    }

    if (!['approve', 'decline'].includes(decision)) {
      console.log('❌ DIAGNOSTIC: Invalid decision:', decision);
      return res.status(400).json({
        success: false,
        message: 'Invalid decision. Must be approve or decline'
      });
    }

    console.log('🔍 DIAGNOSTIC: Starting bulk review transaction...');
    connection = await db.getConnection();
    await connection.beginTransaction();

    const results = [];
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const status = decision === 'approve' ? 'approved' : 'declined';

    try {
      for (const userId of applicationIds) {
        console.log(`🔍 DIAGNOSTIC: Processing application ${userId}...`);
        
        // Update application status
        await connection.query(`
          UPDATE full_membership_applications 
          SET status = ?, reviewedAt = ?, reviewed_by = ?, admin_notes = ?, updatedAt = NOW()
          WHERE user_id = ?
        `, [status, timestamp, reviewer.id, notes, userId]);

        // Update user status
        if (decision === 'approve') {
          await connection.query(`
            UPDATE users 
            SET membership_stage = 'member', is_member = 'member', 
                full_membership_status = 'approved', fullMembershipReviewedAt = ?,
                updatedAt = NOW()
            WHERE id = ?
          `, [timestamp, userId]);
        } else {
          await connection.query(`
            UPDATE users 
            SET full_membership_status = 'declined', fullMembershipReviewedAt = ?,
                updatedAt = NOW()
            WHERE id = ?
          `, [timestamp, userId]);
        }

        // Log to review history
        await connection.query(`
          INSERT INTO membership_review_history (
            user_id, application_type, reviewer_id, previous_status, new_status, 
            review_notes, action_taken, reviewedAt
          ) VALUES (?, 'full_membership', ?, 'pending', ?, ?, ?, ?)
        `, [
          userId, 
          reviewer.id, 
          status,
          `BULK: ${notes}`,
          decision,
          timestamp
        ]);

        results.push({ userId, status });
        console.log(`✅ DIAGNOSTIC: Processed application ${userId} - ${status}`);
      }

      // Log bulk action
      console.log('🔍 DIAGNOSTIC: Logging bulk action to audit...');
      await connection.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'bulk_full_membership_review', ?, NOW())
      `, [reviewer.id, JSON.stringify({
        action: decision,
        applicationCount: applicationIds.length,
        reviewerInfo: reviewer,
        adminNotes: notes,
        processedAt: timestamp
      })]);

      console.log('🔍 DIAGNOSTIC: Committing bulk transaction...');
      await connection.commit();

      const responseData = {
        success: true,
        message: `Bulk ${decision} completed successfully`,
        data: {
          processedCount: results.length,
          results: results,
          reviewedBy: reviewer.username,
          processedAt: timestamp
        }
      };

      console.log('✅ DIAGNOSTIC: Bulk review completed:', responseData);
      console.log('🔍 DIAGNOSTIC: === bulkReviewApplications END ===');
      
      res.json(responseData);

    } catch (transactionError) {
      console.error('❌ DIAGNOSTIC: Bulk transaction error, rolling back:', transactionError);
      await connection.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ DIAGNOSTIC: CRITICAL ERROR in bulkReviewApplications:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql
    });
    
    const errorResponse = {
      success: false,
      message: 'Bulk review failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
    
    console.log('❌ DIAGNOSTIC: Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  } finally {
    if (connection) {
      console.log('🔍 DIAGNOSTIC: Releasing database connection...');
      connection.release();
    }
  }
};

/**
 * DIAGNOSTIC: Development admin setup (ONLY for development)
 * POST /dev/setup-admin/:userId
 */
export const setupDevAdmin = async (req, res) => {
  console.log('🔍 DIAGNOSTIC: === setupDevAdmin START ===');
  console.log('🔍 DIAGNOSTIC: Request params:', req.params);
  
  try {
    const { userId } = req.params;
    
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      console.log('❌ DIAGNOSTIC: Insufficient permissions for user:', req.user);
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required' 
      });
    }
    
    console.log('🛠️ DIAGNOSTIC: Setting up admin account for development...', userId);
    
    const [result] = await db.query(`
      UPDATE users 
      SET 
        membership_stage = 'member',
        is_member = 'member',
        updatedAt = NOW()
      WHERE id = ?
    `, [userId]);
    
    console.log('✅ DIAGNOSTIC: Admin setup result:', result);

    const responseData = {
      success: true,
      message: 'Admin account setup completed for development',
      userId: userId,
      newStatus: {
        membership_stage: 'member',
        is_member: 'member'
      },
      affectedRows: result.affectedRows
    };
    
    console.log('✅ DIAGNOSTIC: Dev admin setup completed:', responseData);
    console.log('🔍 DIAGNOSTIC: === setupDevAdmin END ===');
    
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ DIAGNOSTIC: Dev setup error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to setup admin account',
      details: error.message 
    });
  }
};

/**
 * DIAGNOSTIC: Get system configuration (Admin only)
 * GET /admin/config
 */
export const getSystemConfig = async (req, res) => {
  console.log('🔍 DIAGNOSTIC: === getSystemConfig START ===');
  console.log('🔍 DIAGNOSTIC: User requesting config:', req.user);
  
  try {
    const userRole = req.user.role;
    
    if (!['admin', 'super_admin'].includes(userRole)) {
      console.log('❌ DIAGNOSTIC: Insufficient permissions for role:', userRole);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    // Get various system configurations
    const config = {
      membershipStages: ['none', 'applicant', 'pre_member', 'member'],
      memberStatuses: ['pending', 'granted', 'rejected', 'active', 'pre_member', 'member'],
      userRoles: ['user', 'admin', 'super_admin'],
      applicationTypes: ['initial_application', 'full_membership'],
      approvalStatuses: ['not_submitted', 'pending', 'approved', 'rejected'],
      notificationTypes: ['email', 'sms', 'both'],
      systemLimits: {
        maxBulkOperations: 100,
        maxExportRecords: 10000,
        sessionTimeout: '7d',
        verificationCodeExpiry: '10m'
      },
      features: {
        emailNotifications: true,
        smsNotifications: true,
        bulkOperations: true,
        dataExport: true,
        analytics: true
      }
    };
    
    console.log('✅ DIAGNOSTIC: Config prepared for user:', userRole);
    console.log('🔍 DIAGNOSTIC: === getSystemConfig END ===');
    
    res.json({
      success: true,
      data: { config }
    });
    
  } catch (error) {
    console.error('❌ DIAGNOSTIC: Error getting system config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * DIAGNOSTIC: Super admin emergency reset with safe approach
 * POST /admin/super/emergency-reset/:userId
 */
export const emergencyUserReset = async (req, res) => {
  console.log('🔍 DIAGNOSTIC: === emergencyUserReset START ===');
  console.log('🔍 DIAGNOSTIC: Request params:', req.params);
  console.log('🔍 DIAGNOSTIC: Request body:', req.body);
  console.log('🔍 DIAGNOSTIC: Admin user:', req.user);
  
  let connection = null;
  
  try {
    const { userId } = req.params;
    const { resetType = 'full', reason } = req.body;
    const adminId = req.user.id;
    
    // Validate super admin access
    if (req.user.role !== 'super_admin') {
      console.log('❌ DIAGNOSTIC: Insufficient permissions - not super admin:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Super admin access required'
      });
    }
    
    console.log('🔍 DIAGNOSTIC: Processing emergency reset:', { userId, resetType, reason, adminId });
    
    // Get user details before reset using direct query
    console.log('🔍 DIAGNOSTIC: Fetching user details...');
    const [userCheck] = await db.query(
      'SELECT id, username, email, membership_stage, is_member FROM users WHERE id = ?', 
      [userId]
    );
    
    console.log('✅ DIAGNOSTIC: User check result:', userCheck);
    
    if (userCheck.length === 0) {
      console.log('❌ DIAGNOSTIC: User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userCheck[0];
    console.log('🔍 DIAGNOSTIC: Found user for reset:', user);
    
    console.log('🔍 DIAGNOSTIC: Starting emergency reset transaction...');
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      let resetActions = [];
      
      if (resetType === 'full' || resetType === 'membership') {
        console.log('🔍 DIAGNOSTIC: Resetting membership status...');
        // Reset membership status
        await connection.query(`
          UPDATE users 
          SET membership_stage = 'none',
              is_member = 'none',
              full_membership_status = NULL,
              fullMembershipReviewedAt = NULL,
              updatedAt = NOW()
          WHERE id = ?
        `, [userId]);
        resetActions.push('membership_reset');
        
        // Remove membership access
        console.log('🔍 DIAGNOSTIC: Removing membership access...');
        await connection.query(
          'DELETE FROM full_membership_access WHERE user_id = ?',
          [userId]
        );
        resetActions.push('access_removed');
      }
      
      if (resetType === 'full' || resetType === 'applications') {
        console.log('🔍 DIAGNOSTIC: Resetting applications...');
        // Reset all applications to declined
        await connection.query(`
          UPDATE full_membership_applications 
          SET status = 'declined',
              admin_notes = CONCAT(COALESCE(admin_notes, ''), ' [EMERGENCY RESET]'),
              reviewed_by = ?,
              reviewedAt = NOW(),
              updatedAt = NOW()
          WHERE user_id = ? AND status = 'pending'
        `, [adminId, userId]);
        resetActions.push('applications_reset');
      }
      
      // Log emergency reset action
      console.log('🔍 DIAGNOSTIC: Logging emergency reset to audit...');
      await connection.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'emergency_user_reset', ?, NOW())
      `, [adminId, JSON.stringify({
        targetUserId: userId,
        targetUsername: user.username,
        resetType: resetType,
        reason: reason,
        resetActions: resetActions,
        previousState: user,
        adminUsername: req.user.username,
        resetAt: new Date().toISOString()
      })]);
      
      console.log('🔍 DIAGNOSTIC: Committing emergency reset transaction...');
      await connection.commit();
      
      const responseData = {
        success: true,
        message: 'Emergency user reset completed successfully',
        data: {
          userId: userId,
          username: user.username,
          resetType: resetType,
          resetActions: resetActions,
          resetBy: req.user.username,
          timestamp: new Date().toISOString()
        }
      };

      console.log('✅ DIAGNOSTIC: Emergency reset completed:', responseData);
      console.log('🔍 DIAGNOSTIC: === emergencyUserReset END ===');
      
      res.json(responseData);
      
    } catch (error) {
      console.error('❌ DIAGNOSTIC: Emergency reset transaction error, rolling back:', error);
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ DIAGNOSTIC: CRITICAL ERROR in emergencyUserReset:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql
    });
    
    const errorResponse = {
      success: false,
      message: 'Emergency reset failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
    
    console.log('❌ DIAGNOSTIC: Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  } finally {
    if (connection) {
      console.log('🔍 DIAGNOSTIC: Releasing database connection...');
      connection.release();
    }
  }
};

/**
 * DIAGNOSTIC: Debug test endpoint
 * GET /admin/debug/test
 */
export const debugTest = async (req, res) => {
  console.log('🔍 DIAGNOSTIC: === debugTest START ===');
  
  try {
    console.log('🔍 DIAGNOSTIC: Request info:', {
      method: req.method,
      url: req.url,
      headers: {
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        'content-type': req.headers['content-type']
      },
      user: req.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : 'Not found',
      reviewer: req.reviewer ? { id: req.reviewer.id, username: req.reviewer.username, role: req.reviewer.role } : 'Not found'
    });
    
    // Test database connection
    console.log('🔍 DIAGNOSTIC: Testing database...');
    const [dbTest] = await db.query('SELECT NOW() as current_time, USER() as current_user');
    console.log('✅ DIAGNOSTIC: Database test result:', dbTest[0]);
    
    // Test table access
    console.log('🔍 DIAGNOSTIC: Testing table access...');
    const [tableTest] = await db.query('SELECT COUNT(*) as count FROM full_membership_applications');
    console.log('✅ DIAGNOSTIC: Table test result:', tableTest[0]);
    
    // Test users table
    console.log('🔍 DIAGNOSTIC: Testing users table...');
    const [usersTest] = await db.query('SELECT COUNT(*) as count FROM users');
    console.log('✅ DIAGNOSTIC: Users table test result:', usersTest[0]);
    
    const responseData = {
      success: true,
      message: 'Debug test endpoint working',
      data: {
        timestamp: new Date().toISOString(),
        server: 'Running',
        database: 'Connected',
        tableAccess: 'OK',
        applicationCount: tableTest[0].count,
        userCount: usersTest[0].count,
        reviewer: req.reviewer || null,
        user: req.user || null,
        headers: {
          authorization: req.headers.authorization ? 'Present' : 'Missing',
          'content-type': req.headers['content-type']
        },
        environment: process.env.NODE_ENV || 'unknown'
      }
    };
    
    console.log('✅ DIAGNOSTIC: Debug response:', responseData);
    console.log('🔍 DIAGNOSTIC: === debugTest END ===');
    
    res.status(200).json(responseData);
    
  } catch (error) {
    console.error('❌ DIAGNOSTIC: Debug test error:', error);
    
    const errorResponse = {
      success: false,
      message: 'Debug test failed',
      error: {
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('❌ DIAGNOSTIC: Debug error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
};

// ✅ COMPLETE: Export all the diagnostic functions
export default {
  getAllPendingMembershipApplications,
  getPendingFullMembershipCount,
  getFullMembershipStats,
  reviewMembershipApplication,
  getApplicationStats,
  bulkReviewApplications,
  setupDevAdmin,
  getSystemConfig,
  emergencyUserReset,
  debugTest
};





// // ikootaapi/controllers/adminApplicationController.js
// // SAFE APPROACH VERSION - Uses direct queries with aliases instead of complex views
// // ===============================================

// import db from '../config/db.js';

// /**
//  * Enhanced helper function to handle timestamp column variations (camelCase + snake_case)
//  */
// const getTimestamp = (obj, fieldName) => {
//   if (!obj) return null;
  
//   // Try camelCase first (preferred for your database)
//   const camelCase = obj[fieldName];
//   if (camelCase) return camelCase;
  
//   // Convert camelCase to snake_case and try that (fallback)
//   const snakeCase = fieldName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
//   return obj[snakeCase] || null;
// };

// /**
//  * SAFE APPROACH: Get all full membership applications using direct query with aliases
//  * GET /admin/membership/applications
//  */
// export const getAllPendingMembershipApplications = async (req, res) => {
//   try {
//     const { status = 'pending', limit = 50, offset = 0, sortBy = 'submittedAt', sortOrder = 'DESC' } = req.query;

//     console.log('🔍 SAFE: Fetching full membership applications...');

//     // ✅ Direct query with aliases - no complex views needed
//     const query = `
//       SELECT 
//         'full_membership' as application_type,
//         u.id as user_id,
//         u.username,
//         u.email,
//         fma.membership_ticket as ticket,
//         fma.status,
//         fma.submittedAt,
//         fma.reviewedAt,
//         fma.reviewed_by,
//         fma.admin_notes,
//         reviewer.username as reviewer_name
//       FROM users u
//       JOIN full_membership_applications fma ON u.id = fma.user_id
//       LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
//       WHERE fma.status = ?
//       ORDER BY fma.${sortBy} ${sortOrder}
//       LIMIT ? OFFSET ?
//     `;

//     const [applications] = await db.query(query, [status, parseInt(limit), parseInt(offset)]);
    
//     // Get total count for pagination
//     const countQuery = `
//       SELECT COUNT(*) as total 
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       WHERE fma.status = ?
//     `;
    
//     const [countResult] = await db.query(countQuery, [status]);
//     const total = countResult[0].total;

//     // Get application answers from the main applications table
//     const applicationsWithAnswers = await Promise.all(
//       applications.map(async (app) => {
//         try {
//           const [answerResult] = await db.query(
//             'SELECT answers FROM full_membership_applications WHERE user_id = ?',
//             [app.user_id]
//           );
          
//           return {
//             ...app,
//             id: app.user_id, // Use user_id as application ID for compatibility
//             answers: answerResult[0]?.answers ? JSON.parse(answerResult[0].answers) : null,
//             membership_ticket: app.ticket,
//             user_name: app.username,
//             user_email: app.email,
//             // ✅ Ensure camelCase timestamps
//             submittedAt: getTimestamp(app, 'submittedAt') || app.submittedAt,
//             reviewedAt: getTimestamp(app, 'reviewedAt') || app.reviewedAt,
//             reviewedBy: app.reviewed_by,
//             adminNotes: app.admin_notes,
//             reviewerName: app.reviewer_name
//           };
//         } catch (error) {
//           console.error('Error fetching answers for user:', app.user_id, error);
//           return {
//             ...app,
//             id: app.user_id,
//             answers: null,
//             membership_ticket: app.ticket,
//             user_name: app.username,
//             user_email: app.email,
//             submittedAt: getTimestamp(app, 'submittedAt') || app.submittedAt,
//             reviewedAt: getTimestamp(app, 'reviewedAt') || app.reviewedAt
//           };
//         }
//       })
//     );

//     res.json({
//       success: true,
//       data: {
//         applications: applicationsWithAnswers,
//         pagination: {
//           total,
//           limit: parseInt(limit),
//           offset: parseInt(offset),
//           hasMore: (parseInt(offset) + parseInt(limit)) < total,
//           page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
//           totalPages: Math.ceil(total / parseInt(limit))
//         },
//         reviewer: req.reviewer?.username || 'system',
//         reviewerRole: req.reviewer?.role || 'admin'
//       }
//     });

//   } catch (error) {
//     console.error('❌ SAFE: Error fetching membership applications:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// /**
//  * SAFE APPROACH: Get full membership statistics using direct query
//  * GET /admin/membership/full-membership-stats
//  */
// export const getFullMembershipStats = async (req, res) => {
//   try {
//     console.log('🔍 SAFE: Fetching full membership statistics...');
    
//     // ✅ Direct query - no views needed
//     const statsQuery = `
//       SELECT 
//         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
//         SUM(CASE WHEN status = 'approved' AND MONTH(reviewedAt) = MONTH(CURRENT_DATE()) AND YEAR(reviewedAt) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as approvedCount,
//         SUM(CASE WHEN status = 'declined' AND MONTH(reviewedAt) = MONTH(CURRENT_DATE()) AND YEAR(reviewedAt) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as declinedCount,
//         COUNT(*) as totalApplications,
//         AVG(CASE 
//           WHEN status IN ('approved', 'declined') AND reviewedAt IS NOT NULL AND submittedAt IS NOT NULL
//           THEN DATEDIFF(reviewedAt, submittedAt) 
//           ELSE NULL 
//         END) as avgReviewTime
//       FROM full_membership_applications
//     `;
    
//     const [statsResult] = await db.query(statsQuery);
//     const stats = statsResult[0];

//     res.json({
//       success: true,
//       data: {
//         pending: parseInt(stats.pendingCount) || 0,
//         approved: parseInt(stats.approvedCount) || 0,
//         declined: parseInt(stats.declinedCount) || 0,
//         total: parseInt(stats.totalApplications) || 0,
//         avgReviewTime: parseFloat(stats.avgReviewTime || 0)
//       }
//     });

//   } catch (error) {
//     console.error('❌ SAFE: Error fetching full membership stats:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Failed to fetch statistics',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// /**
//  * Get pending full membership count for sidebar badge (unchanged)
//  * GET /admin/membership/pending-count
//  */
// export const getPendingFullMembershipCount = async (req, res) => {
//   try {
//     console.log('🔍 SAFE: Fetching pending full membership count...');
    
//     // ✅ Direct query instead of view
//     const countQuery = `
//       SELECT COUNT(*) as count 
//       FROM full_membership_applications
//       WHERE status = 'pending'
//     `;
    
//     const [countResult] = await db.query(countQuery);
//     const count = countResult[0]?.count || 0;

//     res.json({
//       success: true,
//       count: count
//     });

//   } catch (error) {
//     console.error('❌ SAFE: Error fetching pending count:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Failed to fetch pending count',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// /**
//  * Review full membership application with proper transaction safety (unchanged)
//  * PUT /admin/membership/review/:applicationId
//  */
// export const reviewMembershipApplication = async (req, res) => {
//   let connection = null;
  
//   try {
//     const { applicationId } = req.params;
//     const { status, adminNotes } = req.body;
//     const reviewer = req.user || { id: 1, username: 'system' }; // Fallback for testing
//     const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); // MySQL datetime format

//     console.log('🔍 SAFE: Reviewing application:', { applicationId, status, reviewerId: reviewer.id });

//     // Validate input
//     if (!['approved', 'declined'].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid status. Must be approved or declined'
//       });
//     }

//     // Get application details using direct query
//     const [appCheck] = await db.query(`
//       SELECT fma.user_id, u.username, u.email, fma.membership_ticket as ticket
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       WHERE fma.user_id = ? AND fma.status = 'pending'
//     `, [applicationId]);

//     if (appCheck.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Pending application not found' 
//       });
//     }

//     const application = appCheck[0];
//     const userId = application.user_id;

//     // Get connection and begin transaction
//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     try {
//       // ✅ Update the main full_membership_applications table
//       await connection.query(`
//         UPDATE full_membership_applications 
//         SET status = ?, reviewedAt = ?, reviewed_by = ?, admin_notes = ?, updatedAt = NOW()
//         WHERE user_id = ?
//       `, [status, timestamp, reviewer.id, adminNotes, userId]);

//       // ✅ Update users table with new membership status
//       if (status === 'approved') {
//         // UPGRADE: pre_member → member
//         await connection.query(`
//           UPDATE users 
//           SET membership_stage = 'member',
//               is_member = 'member',
//               full_membership_status = 'approved',
//               fullMembershipReviewedAt = ?,
//               updatedAt = NOW()
//           WHERE id = ?
//         `, [timestamp, userId]);

//         // Grant member access
//         await connection.query(`
//           INSERT INTO full_membership_access (user_id, firstAccessedAt, access_count, createdAt, updatedAt)
//           VALUES (?, ?, 0, NOW(), NOW())
//           ON DUPLICATE KEY UPDATE 
//             access_count = access_count,
//             updatedAt = NOW()
//         `, [userId, timestamp]);

//       } else {
//         // DECLINE: Remains pre_member, but mark application as declined
//         await connection.query(`
//           UPDATE users 
//           SET full_membership_status = 'declined',
//               fullMembershipReviewedAt = ?,
//               updatedAt = NOW()
//           WHERE id = ?
//         `, [timestamp, userId]);
//       }

//       // ✅ Log to membership_review_history table
//       await connection.query(`
//         INSERT INTO membership_review_history (
//           user_id, application_type, reviewer_id, previous_status, new_status, 
//           review_notes, action_taken, reviewedAt, notification_sent
//         ) VALUES (?, 'full_membership', ?, 'pending', ?, ?, ?, ?, 0)
//       `, [
//         userId, 
//         reviewer.id, 
//         status, 
//         adminNotes, 
//         status === 'approved' ? 'approve' : 'decline',
//         timestamp
//       ]);

//       // Log the review action in audit_logs
//       await connection.query(`
//         INSERT INTO audit_logs (user_id, action, details, createdAt)
//         VALUES (?, 'full_membership_application_reviewed', ?, NOW())
//       `, [reviewer.id, JSON.stringify({
//         applicationId: applicationId,
//         applicantId: userId,
//         applicantUsername: application.username,
//         decision: status,
//         adminNotes: adminNotes,
//         reviewerInfo: reviewer,
//         ticket: application.ticket,
//         reviewedAt: timestamp
//       })]);

//       await connection.commit();

//       res.json({
//         success: true,
//         message: `Full membership application ${status} successfully`,
//         data: {
//           applicationId: applicationId,
//           decision: status,
//           userId: userId,
//           applicantUsername: application.username,
//           reviewedBy: reviewer.username,
//           reviewedAt: timestamp,
//           adminNotes: adminNotes,
//           ticket: application.ticket
//         }
//       });

//     } catch (transactionError) {
//       await connection.rollback();
//       throw transactionError;
//     }

//   } catch (error) {
//     console.error('❌ SAFE: Error reviewing membership application:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Failed to review application',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// };

// /**
//  * SAFE APPROACH: Get application statistics using direct queries
//  * GET /admin/applications/stats
//  */
// export const getApplicationStats = async (req, res) => {
//   try {
//     console.log('🔍 SAFE: Fetching application statistics...');
    
//     // ✅ Direct query for main stats
//     const statsQuery = `
//       SELECT 
//         COUNT(*) as total_applications,
//         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
//         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
//         SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) as declined_count,
//         AVG(CASE 
//           WHEN status IN ('approved', 'declined') AND reviewedAt IS NOT NULL AND submittedAt IS NOT NULL
//           THEN TIMESTAMPDIFF(HOUR, submittedAt, reviewedAt) 
//           ELSE NULL 
//         END) as avg_review_time_hours
//       FROM full_membership_applications
//     `;
    
//     const [stats] = await db.query(statsQuery);
    
//     // ✅ Get recent activity using direct query
//     const recentQuery = `
//       SELECT 
//         mrh.user_id,
//         mrh.new_status as status,
//         mrh.reviewedAt,
//         mrh.action_taken,
//         u.username,
//         reviewer.username as reviewer_name
//       FROM membership_review_history mrh
//       JOIN users u ON mrh.user_id = u.id
//       LEFT JOIN users reviewer ON mrh.reviewer_id = reviewer.id
//       WHERE mrh.application_type = 'full_membership'
//         AND mrh.reviewedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
//       ORDER BY mrh.reviewedAt DESC
//       LIMIT 10
//     `;
    
//     const [recentActivity] = await db.query(recentQuery);
    
//     // Normalize recent activity
//     const normalizedRecentActivity = recentActivity.map(activity => ({
//       ...activity,
//       reviewedAt: getTimestamp(activity, 'reviewedAt') || activity.reviewedAt,
//       actionTaken: activity.action_taken,
//       reviewerName: activity.reviewer_name
//     }));
    
//     res.json({
//       success: true,
//       data: {
//         statistics: stats[0],
//         recentActivity: normalizedRecentActivity
//       }
//     });
    
//   } catch (error) {
//     console.error('❌ SAFE: Error getting application stats:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to get application statistics',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// /**
//  * Bulk review applications with safe approach
//  * POST /admin/membership/bulk-review
//  */
// export const bulkReviewApplications = async (req, res) => {
//   let connection = null;
  
//   try {
//     const { applicationIds, decision, notes } = req.body;
//     const reviewer = req.user || { id: 1, username: 'system' }; // Fallback for testing

//     // Validate input
//     if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid applicationIds. Must be a non-empty array'
//       });
//     }

//     if (!['approve', 'decline'].includes(decision)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid decision. Must be approve or decline'
//       });
//     }

//     console.log('🔍 SAFE: Bulk reviewing applications:', { count: applicationIds.length, decision });

//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     const results = [];
//     const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
//     const status = decision === 'approve' ? 'approved' : 'declined';

//     try {
//       for (const userId of applicationIds) {
//         // Update application status
//         await connection.query(`
//           UPDATE full_membership_applications 
//           SET status = ?, reviewedAt = ?, reviewed_by = ?, admin_notes = ?, updatedAt = NOW()
//           WHERE user_id = ?
//         `, [status, timestamp, reviewer.id, notes, userId]);

//         // Update user status
//         if (decision === 'approve') {
//           await connection.query(`
//             UPDATE users 
//             SET membership_stage = 'member', is_member = 'member', 
//                 full_membership_status = 'approved', fullMembershipReviewedAt = ?,
//                 updatedAt = NOW()
//             WHERE id = ?
//           `, [timestamp, userId]);
//         } else {
//           await connection.query(`
//             UPDATE users 
//             SET full_membership_status = 'declined', fullMembershipReviewedAt = ?,
//                 updatedAt = NOW()
//             WHERE id = ?
//           `, [timestamp, userId]);
//         }

//         // Log to review history
//         await connection.query(`
//           INSERT INTO membership_review_history (
//             user_id, application_type, reviewer_id, previous_status, new_status, 
//             review_notes, action_taken, reviewedAt
//           ) VALUES (?, 'full_membership', ?, 'pending', ?, ?, ?, ?)
//         `, [
//           userId, 
//           reviewer.id, 
//           status,
//           `BULK: ${notes}`,
//           decision,
//           timestamp
//         ]);

//         results.push({ userId, status });
//       }

//       // Log bulk action
//       await connection.query(`
//         INSERT INTO audit_logs (user_id, action, details, createdAt)
//         VALUES (?, 'bulk_full_membership_review', ?, NOW())
//       `, [reviewer.id, JSON.stringify({
//         action: decision,
//         applicationCount: applicationIds.length,
//         reviewerInfo: reviewer,
//         adminNotes: notes,
//         processedAt: timestamp
//       })]);

//       await connection.commit();

//       res.json({
//         success: true,
//         message: `Bulk ${decision} completed successfully`,
//         data: {
//           processedCount: results.length,
//           results: results,
//           reviewedBy: reviewer.username,
//           processedAt: timestamp
//         }
//       });

//     } catch (transactionError) {
//       await connection.rollback();
//       throw transactionError;
//     }

//   } catch (error) {
//     console.error('❌ SAFE: Error in bulk review:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Bulk review failed',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// };

// // ===============================================
// // EXISTING FUNCTIONS FROM YOUR ORIGINAL FILE
// // (Keep compatibility with existing system)
// // ===============================================

// /**
//  * Development admin setup (ONLY for development)
//  * POST /dev/setup-admin/:userId
//  */
// export const setupDevAdmin = async (req, res) => {
//   try {
//     const { userId } = req.params;
    
//     if (!['admin', 'super_admin'].includes(req.user.role)) {
//       return res.status(403).json({ 
//         success: false,
//         error: 'Admin access required' 
//       });
//     }
    
//     console.log('🛠️ Setting up admin account for development...');
    
//     const [result] = await db.query(`
//       UPDATE users 
//       SET 
//         membership_stage = 'member',
//         is_member = 'member',
//         updatedAt = NOW()
//       WHERE id = ?
//     `, [userId]);
    
//     res.json({
//       success: true,
//       message: 'Admin account setup completed for development',
//       userId: userId,
//       newStatus: {
//         membership_stage: 'member',
//         is_member: 'member'
//       },
//       affectedRows: result.affectedRows
//     });
    
//   } catch (error) {
//     console.error('❌ Dev setup error:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Failed to setup admin account',
//       details: error.message 
//     });
//   }
// };

// /**
//  * Get system configuration (Admin only)
//  * GET /admin/config
//  */
// export const getSystemConfig = async (req, res) => {
//   try {
//     const userRole = req.user.role;
    
//     if (!['admin', 'super_admin'].includes(userRole)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Insufficient permissions'
//       });
//     }
    
//     // Get various system configurations
//     const config = {
//       membershipStages: ['none', 'applicant', 'pre_member', 'member'],
//       memberStatuses: ['pending', 'granted', 'rejected', 'active', 'pre_member', 'member'],
//       userRoles: ['user', 'admin', 'super_admin'],
//       applicationTypes: ['initial_application', 'full_membership'],
//       approvalStatuses: ['not_submitted', 'pending', 'approved', 'rejected'],
//       notificationTypes: ['email', 'sms', 'both'],
//       systemLimits: {
//         maxBulkOperations: 100,
//         maxExportRecords: 10000,
//         sessionTimeout: '7d',
//         verificationCodeExpiry: '10m'
//       },
//       features: {
//         emailNotifications: true,
//         smsNotifications: true,
//         bulkOperations: true,
//         dataExport: true,
//         analytics: true
//       }
//     };
    
//     res.json({
//       success: true,
//       data: { config }
//     });
    
//   } catch (error) {
//     console.error('❌ Error getting system config:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to get system configuration',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// /**
//  * Super admin emergency reset with safe approach
//  * POST /admin/super/emergency-reset/:userId
//  */
// export const emergencyUserReset = async (req, res) => {
//   let connection = null;
  
//   try {
//     const { userId } = req.params;
//     const { resetType = 'full', reason } = req.body;
//     const adminId = req.user.id;
    
//     // Validate super admin access
//     if (req.user.role !== 'super_admin') {
//       return res.status(403).json({
//         success: false,
//         message: 'Super admin access required'
//       });
//     }
    
//     // Get user details before reset using direct query
//     const [userCheck] = await db.query(
//       'SELECT id, username, email, membership_stage, is_member FROM users WHERE id = ?', 
//       [userId]
//     );
    
//     if (userCheck.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }
    
//     const user = userCheck[0];
    
//     connection = await db.getConnection();
//     await connection.beginTransaction();
    
//     try {
//       let resetActions = [];
      
//       if (resetType === 'full' || resetType === 'membership') {
//         // Reset membership status
//         await connection.query(`
//           UPDATE users 
//           SET membership_stage = 'none',
//               is_member = 'none',
//               full_membership_status = NULL,
//               fullMembershipReviewedAt = NULL,
//               updatedAt = NOW()
//           WHERE id = ?
//         `, [userId]);
//         resetActions.push('membership_reset');
        
//         // Remove membership access
//         await connection.query(
//           'DELETE FROM full_membership_access WHERE user_id = ?',
//           [userId]
//         );
//         resetActions.push('access_removed');
//       }
      
//       if (resetType === 'full' || resetType === 'applications') {
//         // Reset all applications to declined
//         await connection.query(`
//           UPDATE full_membership_applications 
//           SET status = 'declined',
//               admin_notes = CONCAT(COALESCE(admin_notes, ''), ' [EMERGENCY RESET]'),
//               reviewed_by = ?,
//               reviewedAt = NOW(),
//               updatedAt = NOW()
//           WHERE user_id = ? AND status = 'pending'
//         `, [adminId, userId]);
//         resetActions.push('applications_reset');
//       }
      
//       // Log emergency reset action
//       await connection.query(`
//         INSERT INTO audit_logs (user_id, action, details, createdAt)
//         VALUES (?, 'emergency_user_reset', ?, NOW())
//       `, [adminId, JSON.stringify({
//         targetUserId: userId,
//         targetUsername: user.username,
//         resetType: resetType,
//         reason: reason,
//         resetActions: resetActions,
//         previousState: user,
//         adminUsername: req.user.username,
//         resetAt: new Date().toISOString()
//       })]);
      
//       await connection.commit();
      
//       res.json({
//         success: true,
//         message: 'Emergency user reset completed successfully',
//         data: {
//           userId: userId,
//           username: user.username,
//           resetType: resetType,
//           resetActions: resetActions,
//           resetBy: req.user.username,
//           timestamp: new Date().toISOString()
//         }
//       });
      
//     } catch (error) {
//       await connection.rollback();
//       throw error;
//     }
    
//   } catch (error) {
//     console.error('❌ Emergency reset error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Emergency reset failed',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// };

// /**
//  * Simple test endpoint to debug what's happening
//  * GET /admin/debug/test
//  */
// export const debugTest = async (req, res) => {
//   try {
//     console.log('🔍 DEBUG: Test endpoint called');
    
//     res.json({
//       success: true,
//       message: 'Debug test endpoint working',
//       data: {
//         timestamp: new Date().toISOString(),
//         reviewer: req.reviewer || null,
//         user: req.user || null,
//         headers: {
//           authorization: req.headers.authorization ? 'Present' : 'Missing',
//           'content-type': req.headers['content-type']
//         }
//       }
//     });
    
//   } catch (error) {
//     console.error('❌ Debug test error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Debug test failed',
//       error: error.message
//     });
//   }
// };

// export default {
//   getAllPendingMembershipApplications,
//   getPendingFullMembershipCount,
//   getFullMembershipStats,
//   reviewMembershipApplication,
//   getApplicationStats,
//   bulkReviewApplications,
//   setupDevAdmin,
//   getSystemConfig,
//   emergencyUserReset,
//   debugTest
// };


