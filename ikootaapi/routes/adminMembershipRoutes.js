// ikootaapi/routes/adminMembershipRoutes.js
// ===============================================
// CLEAN ADMIN FULL MEMBERSHIP ROUTES
// Only routes for admin review of full membership applications
// ===============================================

import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import db from '../config/db.js';

const router = express.Router();

// Basic admin authentication middleware
router.use(authenticate);
router.use(authorize(['admin', 'super_admin']));

// ===============================================
// 1. GET PENDING FULL MEMBERSHIP APPLICATIONS
// ===============================================
router.get('/applications', async (req, res) => {
  try {
    console.log('🔍 ADMIN: Fetching full membership applications');
    const { status = 'pending' } = req.query;

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
});

// ===============================================
// 2. GET FULL MEMBERSHIP STATISTICS
// ===============================================
router.get('/stats', async (req, res) => {
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

// ===============================================
// 3. GET PENDING COUNT (for sidebar badge)
// ===============================================
router.get('/pending-count', async (req, res) => {
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
// 4. REVIEW INDIVIDUAL APPLICATION (APPROVE/DECLINE)
// ===============================================
router.put('/review/:id', async (req, res) => {
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

// ===============================================
// 5. BULK REVIEW APPLICATIONS
// ===============================================
// router.post('/bulk-review', async (req, res) => {
//   try {
//     const { applicationIds, decision, notes } = req.body;
    
//     console.log('🔍 ADMIN: Bulk reviewing applications:', { applicationIds, decision, notes });
    
//     // Validate input
//     if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'applicationIds must be a non-empty array'
//       });
//     }

//     if (!['approved', 'declined', 'suspended'].includes(decision)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid decision. Must be approved, declined, or suspended'
//       });
//     }

//     // Start transaction
//     await db.query('START TRANSACTION');

//     try {
//       // Bulk update applications
//       const placeholders = applicationIds.map(() => '?').join(',');
//       await db.query(`
//         UPDATE full_membership_applications 
//         SET 
//           status = ?,
//           admin_notes = ?,
//           reviewedAt = NOW(),
//           reviewed_by = ?
//         WHERE id IN (${placeholders})
//       `, [decision, notes || '', req.user?.id || 1, ...applicationIds]);

//       // If approved, update users' membership status
//       if (decision === 'approved') {
//         await db.query(`
//           UPDATE users 
//           SET 
//             is_member = 'member',
//             membership_stage = 'member',
//             full_membership_status = 'approved',
//             fullMembershipReviewedAt = NOW()
//           WHERE id IN (
//             SELECT user_id 
//             FROM full_membership_applications 
//             WHERE id IN (${placeholders})
//           )
//         `, applicationIds);

//         console.log(`✅ ${applicationIds.length} users promoted to full members`);
//       }

//       // Commit transaction
//       await db.query('COMMIT');

//       console.log('✅ Bulk review completed successfully');

//       res.json({
//         success: true,
//         message: `${applicationIds.length} applications ${decision} successfully`,
//         processedCount: applicationIds.length,
//         applicationIds: applicationIds,
//         decision: decision,
//         timestamp: new Date().toISOString()
//       });

//     } catch (error) {
//       await db.query('ROLLBACK');
//       throw error;
//     }

//   } catch (error) {
//     console.error('❌ Error in bulk review:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to bulk review applications'
//     });
//   }
// });

// ===============================================
// 6. GET APPLICATION DETAILS (for review modal)
// ===============================================
router.get('/application/:id', async (req, res) => {
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
// 7. DEBUG ROUTES (development only)
// ===============================================
if (process.env.NODE_ENV === 'development') {
  
  // Test database connectivity
  router.get('/debug/test', async (req, res) => {
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
  router.get('/debug/routes', (req, res) => {
    res.json({
      success: true,
      message: 'Admin membership routes',
      routes: [
        'GET /applications - Get all applications (query: ?status=pending|approved|declined|all)',
        'GET /stats - Get membership statistics',
        'GET /pending-count - Get pending applications count',
        'PUT /review/:id - Review individual application',
        'POST /bulk-review - Bulk review applications',
        'GET /application/:id - Get application details',
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
router.use((error, req, res, next) => {
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

console.log('✅ Clean admin membership routes loaded');

export default router;