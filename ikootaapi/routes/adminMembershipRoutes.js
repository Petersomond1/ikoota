// File: ikootaapi/routes/adminMembershipRoutes.js
// ADMIN MEMBERSHIP ROUTES - COMPLETE ADMIN MEMBERSHIP REVIEW SYSTEM
// Handles all admin review functionality for full membership applications

import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import db from '../config/db.js';

const adminMembershipRouter = express.Router();

// Basic admin authentication middleware
adminMembershipRouter.use(authenticate);
adminMembershipRouter.use(authorize(['admin', 'super_admin']));

// ===============================================
// FULL MEMBERSHIP APPLICATION MANAGEMENT
// ===============================================

// Get full membership applications
// adminMembershipRouter.get('/applications', async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Fetching full membership applications');
//     const { status = 'pending' } = req.query;

//     let query = `
//       SELECT 
//         fma.id,
//         fma.user_id,
//         fma.membership_ticket,
//         fma.answers,
//         fma.status,
//         fma.submittedAt,
//         fma.reviewedAt,
//         fma.reviewed_by,
//         fma.admin_notes,
//         u.username as user_name,
//         u.email as user_email,
//         reviewer.username as reviewer_name
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
//     `;

//     let queryParams = [];

//     if (status !== 'all') {
//       query += ' WHERE fma.status = ?';
//       queryParams = [status];
//     }

//     query += ' ORDER BY fma.submittedAt DESC';

//     const applications = await db.query(query, queryParams);
    
//     console.log('✅ Found', applications.length, 'applications');

//     res.json({
//       success: true,
//       data: applications,
//       meta: {
//         count: applications.length,
//         status: status,
//         timestamp: new Date().toISOString()
//       }
//     });

//   } catch (error) {
//     console.error('❌ Error fetching applications:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       count: 0
//     });
//   }
// });

adminMembershipRouter.get('/applications', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    console.log('🔍 ADMIN: Fetching applications with status:', status);

    // Simple query first to test
    const applications = await db.query(`
      SELECT 
        fma.id,
        fma.user_id,
        fma.membership_ticket,
        fma.status,
        fma.submittedAt,
        u.username,
        u.email
      FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      WHERE fma.status = ?
      ORDER BY fma.submittedAt DESC
    `, [status]);

    console.log('✅ Found applications:', applications.length);

    res.json({
      success: true,
      data: applications,
      count: applications.length,
      status: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching applications:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to fetch applications'
    });
  }
});


// Get specific application details
adminMembershipRouter.get('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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
});

// Alternative route for application details (from clean version)
adminMembershipRouter.get('/application/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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
});

// ===============================================
// APPLICATION REVIEW ACTIONS
// ===============================================

// Review individual application (approve/decline)
adminMembershipRouter.put('/applications/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    console.log('🔍 ADMIN: Reviewing application:', { id, status, adminNotes });
    
    // Validate status
    if (!['approved', 'declined', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be approved, declined, or suspended'
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
          WHERE id = (
            SELECT user_id 
            FROM full_membership_applications 
            WHERE id = ?
          )
        `, [id]);

        console.log('✅ User promoted to full member');
      }

      // Commit transaction
      await db.query('COMMIT');

      console.log('✅ Application reviewed successfully');

      res.json({
        success: true,
        message: `Application ${status} successfully`,
        applicationId: id,
        newStatus: status,
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
});

// Alternative review route (from clean version)
adminMembershipRouter.put('/review/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    console.log('🔍 ADMIN: Reviewing application:', { id, status, adminNotes });
    
    // Validate status
    if (!['approved', 'declined', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be approved, declined, or suspended'
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
          WHERE id = (
            SELECT user_id 
            FROM full_membership_applications 
            WHERE id = ?
          )
        `, [id]);

        console.log('✅ User promoted to full member');
      }

      // Commit transaction
      await db.query('COMMIT');

      console.log('✅ Application reviewed successfully');

      res.json({
        success: true,
        message: `Application ${status} successfully`,
        applicationId: id,
        newStatus: status,
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
});

// Bulk review applications
adminMembershipRouter.post('/applications/bulk-review', async (req, res) => {
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

    if (!['approved', 'declined', 'suspended'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid decision. Must be approved, declined, or suspended'
      });
    }

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Bulk update applications
      const placeholders = applicationIds.map(() => '?').join(',');
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
        await db.query(`
          UPDATE users 
          SET 
            is_member = 'member',
            membership_stage = 'member',
            full_membership_status = 'approved',
            fullMembershipReviewedAt = NOW()
          WHERE id IN (
            SELECT user_id 
            FROM full_membership_applications 
            WHERE id IN (${placeholders})
          )
        `, applicationIds);

        console.log(`✅ ${applicationIds.length} users promoted to full members`);
      }

      // Commit transaction
      await db.query('COMMIT');

      console.log('✅ Bulk review completed successfully');

      res.json({
        success: true,
        message: `${applicationIds.length} applications ${decision} successfully`,
        processedCount: applicationIds.length,
        applicationIds: applicationIds,
        decision: decision,
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
});

// Alternative bulk review route (from clean version)
adminMembershipRouter.post('/bulk-review', async (req, res) => {
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

    if (!['approved', 'declined', 'suspended'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid decision. Must be approved, declined, or suspended'
      });
    }

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Bulk update applications
      const placeholders = applicationIds.map(() => '?').join(',');
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
        await db.query(`
          UPDATE users 
          SET 
            is_member = 'member',
            membership_stage = 'member',
            full_membership_status = 'approved',
            fullMembershipReviewedAt = NOW()
          WHERE id IN (
            SELECT user_id 
            FROM full_membership_applications 
            WHERE id IN (${placeholders})
          )
        `, applicationIds);

        console.log(`✅ ${applicationIds.length} users promoted to full members`);
      }

      // Commit transaction
      await db.query('COMMIT');

      console.log('✅ Bulk review completed successfully');

      res.json({
        success: true,
        message: `${applicationIds.length} applications ${decision} successfully`,
        processedCount: applicationIds.length,
        applicationIds: applicationIds,
        decision: decision,
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
});

// ===============================================
// MEMBERSHIP STATISTICS
// ===============================================

// Get full membership statistics
adminMembershipRouter.get('/stats', async (req, res) => {
  try {
    console.log('🔍 ADMIN: Fetching membership stats');
    
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
});

// Alternative stats route (from adminRoutes)
// adminMembershipRouter.get('/full-membership-stats', async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Fetching membership stats');
    
//     const stats = await db.query(`
//       SELECT 
//         status,
//         COUNT(*) as count
//       FROM full_membership_applications 
//       GROUP BY status
//     `);

//     const result = {
//       pending: 0,
//       approved: 0,
//       declined: 0,
//       suspended: 0,
//       total: 0
//     };

//     stats.forEach(stat => {
//       result[stat.status] = stat.count;
//       result.total += stat.count;
//     });

//     console.log('✅ Stats result:', result);

//     res.json({
//       success: true,
//       data: result,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error fetching stats:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to fetch membership statistics'
//     });
//   }
// });


adminMembershipRouter.get('/full-membership-stats', async (req, res) => {
  try {
    console.log('🔍 ADMIN: Fetching full membership stats');
    
    // Simple stats query
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

    // Process results safely
    if (Array.isArray(stats)) {
      const rows = Array.isArray(stats[0]) ? stats[0] : stats;
      rows.forEach(stat => {
        if (stat && stat.status && stat.count) {
          result[stat.status] = parseInt(stat.count);
          result.total += parseInt(stat.count);
        }
      });
    }

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
});



// Get pending count (for sidebar badge)
adminMembershipRouter.get('/pending-count', async (req, res) => {
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
});

// ===============================================
// MEMBERSHIP OVERVIEW & ANALYTICS
// ===============================================

// Get membership overview
adminMembershipRouter.get('/overview', async (req, res) => {
  // This would integrate with analytics controller
  res.json({ message: 'Membership overview endpoint - integrate with analyticsController' });
});

// Get membership analytics
adminMembershipRouter.get('/analytics', async (req, res) => {
  // This would integrate with analytics controller
  res.json({ message: 'Membership analytics endpoint - integrate with analyticsController' });
});

// Export membership data
adminMembershipRouter.get('/export', async (req, res) => {
  // This would integrate with analytics controller
  res.json({ message: 'Export membership data endpoint - integrate with analyticsController' });
});

// ===============================================
// ADMIN APPLICATION ROUTES (FROM adminApplicationRoutes)
// ===============================================

// Enhanced admin application management routes
adminMembershipRouter.get('/admin/pending-applications', async (req, res) => {
  try {
    console.log('🔍 ADMIN: Getting pending applications');
    
    const applications = await db.query(`
      SELECT 
        fma.id,
        fma.user_id,
        fma.membership_ticket,
        fma.answers,
        fma.status,
        fma.submittedAt,
        u.username,
        u.email
      FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      WHERE fma.status = 'pending'
      ORDER BY fma.submittedAt ASC
    `);

    res.json({
      success: true,
      data: applications,
      count: applications.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting pending applications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

adminMembershipRouter.get('/admin/applications', async (req, res) => {
  try {
    console.log('🔍 ADMIN: Getting all applications');
    
    const applications = await db.query(`
      SELECT 
        fma.id,
        fma.user_id,
        fma.membership_ticket,
        fma.answers,
        fma.status,
        fma.submittedAt,
        fma.reviewedAt,
        u.username,
        u.email
      FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      ORDER BY fma.submittedAt DESC
    `);

    res.json({
      success: true,
      data: applications,
      count: applications.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting applications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

adminMembershipRouter.get('/admin/membership/applications', async (req, res) => {
  try {
    console.log('🔍 ADMIN: Getting membership applications');
    
    const applications = await db.query(`
      SELECT 
        fma.id,
        fma.user_id,
        fma.membership_ticket,
        fma.answers,
        fma.status,
        fma.submittedAt,
        fma.reviewedAt,
        u.username,
        u.email
      FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      ORDER BY fma.submittedAt DESC
    `);

    res.json({
      success: true,
      data: applications,
      count: applications.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting membership applications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Review membership application with validation
adminMembershipRouter.put('/admin/membership/review/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, adminNotes } = req.body;
    
    console.log('🔍 ADMIN: Reviewing membership application:', { applicationId, status, adminNotes });
    
    // Validate status
    if (!['approved', 'declined', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be approved, declined, or suspended'
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
      `, [status, adminNotes || '', req.user?.id || 1, applicationId]);

      // If approved, update user's membership status
      if (status === 'approved') {
        await db.query(`
          UPDATE users 
          SET 
            is_member = 'member',
            membership_stage = 'member',
            full_membership_status = 'approved',
            fullMembershipReviewedAt = NOW()
          WHERE id = (
            SELECT user_id 
            FROM full_membership_applications 
            WHERE id = ?
          )
        `, [applicationId]);

        console.log('✅ User promoted to full member');
      }

      // Commit transaction
      await db.query('COMMIT');

      console.log('✅ Membership application reviewed successfully');

      res.json({
        success: true,
        message: `Application ${status} successfully`,
        applicationId: applicationId,
        newStatus: status,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Error reviewing membership application:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to review membership application'
    });
  }
});

// Application statistics with access control
adminMembershipRouter.get('/admin/applications/stats', async (req, res) => {
  try {
    console.log('🔍 ADMIN: Getting application statistics');
    
    const stats = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(TIMESTAMPDIFF(DAY, submittedAt, reviewedAt)) as avg_review_days
      FROM full_membership_applications 
      GROUP BY status
    `);

    const totalCount = await db.query(`
      SELECT COUNT(*) as total FROM full_membership_applications
    `);

    const recentStats = await db.query(`
      SELECT 
        COUNT(*) as recent_count
      FROM full_membership_applications 
      WHERE submittedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        totalApplications: totalCount[0].total,
        recentApplications: recentStats[0].recent_count
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting application statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple test endpoint to verify admin routes are working
adminMembershipRouter.get('/test', async (req, res) => {
  try {
    console.log('🧪 Admin test endpoint called');
    res.json({
      success: true,
      message: 'Admin membership routes are working',
      user: req.user?.username,
      role: req.user?.role,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===============================================
// DEBUG ROUTES (DEVELOPMENT ONLY)
// ===============================================

if (process.env.NODE_ENV === 'development') {
  
  // Test database connectivity
  adminMembershipRouter.get('/debug/test', async (req, res) => {
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
  });

  // Get all available routes
  adminMembershipRouter.get('/debug/routes', (req, res) => {
    res.json({
      success: true,
      message: 'Admin membership routes',
      routes: [
        'GET /applications - Get all applications (query: ?status=pending|approved|declined|all)',
        'GET /applications/:id - Get application details',
        'GET /application/:id - Alternative application details route',
        'PUT /applications/:id/review - Review individual application',
        'PUT /review/:id - Alternative review route',
        'POST /applications/bulk-review - Bulk review applications',
        'POST /bulk-review - Alternative bulk review route',
        'GET /stats - Get membership statistics',
        'GET /full-membership-stats - Alternative stats route',
        'GET /pending-count - Get pending applications count',
        'GET /overview - Get membership overview',
        'GET /analytics - Get membership analytics',
        'GET /export - Export membership data',
        'GET /admin/pending-applications - Enhanced pending applications',
        'GET /admin/applications - Enhanced all applications',
        'GET /admin/membership/applications - Enhanced membership applications',
        'PUT /admin/membership/review/:applicationId - Enhanced review with validation',
        'GET /admin/applications/stats - Enhanced application statistics',
        'GET /debug/test - Test database connectivity',
        'GET /debug/routes - This route list'
      ],
      timestamp: new Date().toISOString()
    });
  });
}

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler for admin membership routes
adminMembershipRouter.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Admin membership route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      applications: [
        'GET /applications - Get all applications',
        'GET /applications/:id - Get application details',
        'GET /application/:id - Alternative application details',
        'PUT /applications/:id/review - Review application',
        'PUT /review/:id - Alternative review route',
        'POST /applications/bulk-review - Bulk review applications',
        'POST /bulk-review - Alternative bulk review'
      ],
      statistics: [
        'GET /stats - Get membership statistics',
        'GET /full-membership-stats - Alternative stats',
        'GET /pending-count - Get pending count'
      ],
      analytics: [
        'GET /overview - Get membership overview',
        'GET /analytics - Get membership analytics',
        'GET /export - Export membership data'
      ],
      enhanced: [
        'GET /admin/pending-applications - Enhanced pending applications',
        'GET /admin/applications - Enhanced all applications',
        'GET /admin/membership/applications - Enhanced membership applications',
        'PUT /admin/membership/review/:applicationId - Enhanced review',
        'GET /admin/applications/stats - Enhanced statistics'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Global error handler for admin membership routes
adminMembershipRouter.use((error, req, res, next) => {
  console.error('❌ Admin membership route error:', {
    error: error.message,
    stack: error.stack,
    route: req.originalUrl,
    method: req.method,
    user: req.user?.username,
    timestamp: new Date().toISOString()
  });

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('🏛️ Admin membership routes loaded with full membership review capabilities');
  console.log('📊 Total endpoints: 21 (19 production + 2 debug)');
  console.log('🔧 Features: Complete application management, bulk operations, enhanced admin routes');
}

export default adminMembershipRouter;