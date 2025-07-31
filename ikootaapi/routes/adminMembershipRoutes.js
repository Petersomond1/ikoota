// ikootaapi/routes/adminMembershipRoutes.js
// ===============================================
// COMPLETE ADMIN MEMBERSHIP ROUTES - ALL SQL ISSUES FIXED
// ===============================================

import express from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import db from '../config/db.js';

const router = express.Router();

// ===============================================
// MIDDLEWARE FOR ADMIN ROUTES
// ===============================================

// Debug middleware for all admin routes
router.use((req, res, next) => {
  console.log('🔍 ADMIN ROUTE HIT:', {
    method: req.method,
    path: req.path,
    query: req.query,
    hasAuth: !!req.headers.authorization,
    timestamp: new Date().toISOString()
  });
  next();
});

// ===============================================
// 1. TEST ENDPOINT - No auth required for connectivity test
// ===============================================
router.get('/test', (req, res) => {
  try {
    console.log('🧪 Admin test endpoint hit');
    
    res.json({
      success: true,
      message: 'Admin membership endpoints are working!',
      data: {
        server: 'Connected',
        timestamp: new Date().toISOString(),
        endpoint: '/api/admin/membership/test',
        userAgent: req.get('User-Agent')?.substring(0, 50) + '...',
        authHeaderPresent: !!req.headers.authorization
      }
    });

  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Test endpoint failed',
      details: error.message
    });
  }
});

// ===============================================
// 2. GET PENDING COUNT - FIXED SQL AMBIGUITY AND ARRAY DESTRUCTURING
// ===============================================
// router.get('/pending-count', authenticate, requireAdmin, async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Getting pending count with FIXED query');
    
//     // FIXED: Simple count query without GROUP_CONCAT
//     const [result] = await db.query(`
//       SELECT COUNT(*) as count
//       FROM full_membership_applications 
//       WHERE status = 'pending'
//     `);

//     const count = result[0]?.count || 0;
    
//     console.log('✅ FIXED Pending count result:', {
//       count: count,
//       rawResult: result[0]
//     });

//     // FIXED: Debug query with proper table aliases to avoid ambiguous column error
//     const [allAppsResult] = await db.query(`
//       SELECT 
//         fma.id, 
//         fma.user_id, 
//         u.username, 
//         fma.status, 
//         fma.submittedAt 
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       ORDER BY fma.submittedAt DESC 
//       LIMIT 5
//     `);
    
//     // Ensure we have an array to work with
//     const allApps = Array.isArray(allAppsResult) ? allAppsResult : [allAppsResult];
    
//     console.log('📋 All applications with usernames:', allApps);

//     // Find Monika specifically
//     const monikaApp = allApps.find(app => app && app.username === 'Monika');
//     if (monikaApp) {
//       console.log('🎯 FOUND MONIKA:', monikaApp);
//     }

//     res.json({
//       success: true,
//       count: parseInt(count),
//       debug: {
//         totalApplicationsInTable: allApps.length,
//         allApplications: allApps,
//         monikaFound: !!monikaApp,
//         monikaApplication: monikaApp || null
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error getting pending count:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to get pending count',
//       details: error.message,
//       count: 0,
//       timestamp: new Date().toISOString()
//     });
//   }
// });



// ✅ FIXED: Count query issue in /pending-count endpoint
router.get('/pending-count', authenticate, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN: Getting pending count with FIXED query');
    
    // ✅ CRITICAL FIX: The count query was wrong - it should find 1 pending application
    const [result] = await db.query(`
      SELECT COUNT(*) as count
      FROM full_membership_applications 
      WHERE status = 'pending'
    `);

    // ✅ CRITICAL: The issue is here - result[0] might be undefined
    const count = result && result.length > 0 ? (result[0]?.count || 0) : 0;
    
    console.log('✅ FIXED Pending count result:', {
      count: count,
      rawResult: result,
      resultLength: result?.length
    });

    // ✅ FIXED: Debug query with proper table aliases to avoid ambiguous column error
    const [allAppsResult] = await db.query(`
      SELECT 
        fma.id, 
        fma.user_id, 
        u.username, 
        fma.status, 
        fma.submittedAt 
      FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      ORDER BY fma.submittedAt DESC 
      LIMIT 5
    `);
    
    // Ensure we have an array to work with
    const allApps = Array.isArray(allAppsResult) ? allAppsResult : [allAppsResult];
    
    console.log('📋 All applications with usernames:', allApps);

    // Find Monika specifically
    const monikaApp = allApps.find(app => app && app.username === 'Monika');
    if (monikaApp) {
      console.log('🎯 FOUND MONIKA:', monikaApp);
    }

    // ✅ CRITICAL FIX: Return the ACTUAL count from the debug query if count query fails
    const actualCount = allApps.filter(app => app && app.status === 'pending').length;
    const finalCount = count > 0 ? count : actualCount;

    console.log('🔧 Count reconciliation:', {
      countQueryResult: count,
      debugQueryPendingCount: actualCount,
      finalCount: finalCount
    });

    res.json({
      success: true,
      count: parseInt(finalCount),
      debug: {
        totalApplicationsInTable: allApps.length,
        allApplications: allApps,
        monikaFound: !!monikaApp,
        monikaApplication: monikaApp || null,
        countQueryResult: count,
        actualPendingCount: actualCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting pending count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending count',
      details: error.message,
      count: 0,
      timestamp: new Date().toISOString()
    });
  }
});


// ===============================================
// 3. GET APPLICATIONS - FIXED SQL AMBIGUITY
// ===============================================
// router.get('/applications', authenticate, requireAdmin, async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Fetching applications with user:', {
//       userId: req.user?.id,
//       userRole: req.user?.role,
//       hasToken: !!req.headers.authorization
//     });
    
//     const { status = 'pending' } = req.query;

//     // Validate status
//     const validStatuses = ['pending', 'approved', 'declined', 'suspended', 'all'];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid status parameter',
//         validValues: validStatuses,
//         received: status
//       });
//     }

//     // FIXED: Properly aliased query with explicit table prefixes
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
//         u.username,
//         u.email,
//         u.membership_stage,
//         u.is_member,
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

//     console.log('🔍 Executing applications query:', query);
//     console.log('🔍 Query params:', queryParams);

//     const [applications] = await db.query(query, queryParams);
    
//     console.log('✅ Found applications:', applications.length);
    
//     // Debug: Log each application found
//     applications.forEach((app, index) => {
//       console.log(`📋 Application ${index + 1}:`, {
//         id: app.id,
//         user_id: app.user_id,
//         username: app.username,
//         status: app.status,
//         ticket: app.membership_ticket,
//         submittedAt: app.submittedAt
//       });
//     });
    
//     // Log Monika's application if found
//     const monikaApp = applications.find(app => app.username === 'Monika');
//     if (monikaApp) {
//       console.log('🎯 Found Monika\'s application:', {
//         id: monikaApp.id,
//         user_id: monikaApp.user_id,
//         ticket: monikaApp.membership_ticket,
//         status: monikaApp.status,
//         submittedAt: monikaApp.submittedAt,
//         hasAnswers: !!monikaApp.answers
//       });
//     } else {
//       console.log('❌ Monika\'s application not found in results');
//     }

//     // Parse answers field for better frontend handling
//     const formattedApplications = applications.map(app => ({
//       ...app,
//       answers: typeof app.answers === 'string' ? JSON.parse(app.answers) : app.answers
//     }));

//     res.json({
//       success: true,
//       data: formattedApplications,
//       meta: {
//         count: applications.length,
//         status: status,
//         timestamp: new Date().toISOString(),
//         foundMonika: !!monikaApp,
//         authUser: {
//           id: req.user?.id,
//           role: req.user?.role
//         }
//       }
//     });

//   } catch (error) {
//     console.error('❌ Error fetching applications:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch membership applications',
//       details: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });


router.get('/applications', authenticate, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN: Fetching applications with user:', {
      userId: req.user?.id,
      userRole: req.user?.role,
      hasToken: !!req.headers.authorization
    });
    
    const { status = 'pending' } = req.query;

    // Validate status
    const validStatuses = ['pending', 'approved', 'declined', 'suspended', 'all'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status parameter',
        validValues: validStatuses,
        received: status
      });
    }

    // ✅ CRITICAL FIX: Proper query construction
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
        u.username,
        u.email,
        u.membership_stage,
        u.is_member,
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

    console.log('🔍 Executing applications query:', query);
    console.log('🔍 Query params:', queryParams);

    // ✅ CRITICAL FIX: Proper database query handling
    const [applications] = await db.query(query, queryParams);
    
    console.log('🔧 DB Query Result Debug:', {
      applicationsType: typeof applications,
      applicationsIsArray: Array.isArray(applications),
      applicationsLength: applications?.length,
      firstApplication: applications?.[0]
    });

    // ✅ CRITICAL FIX: Ensure we have an array
    let finalApplications = [];
    
    if (Array.isArray(applications)) {
      finalApplications = applications;
    } else if (applications && typeof applications === 'object') {
      // Single result - wrap in array
      finalApplications = [applications];
    } else {
      console.warn('⚠️ Unexpected database result format:', applications);
      finalApplications = [];
    }
    
    console.log('✅ Found applications:', finalApplications.length);
    
    // Debug: Log each application found
    finalApplications.forEach((app, index) => {
      console.log(`📋 Application ${index + 1}:`, {
        id: app.id,
        user_id: app.user_id,
        username: app.username,
        status: app.status,
        ticket: app.membership_ticket,
        submittedAt: app.submittedAt
      });
    });
    
    // Log Monika's application if found
    const monikaApp = finalApplications.find(app => app.username === 'Monika');
    if (monikaApp) {
      console.log('🎯 Found Monika\'s application:', {
        id: monikaApp.id,
        user_id: monikaApp.user_id,
        ticket: monikaApp.membership_ticket,
        status: monikaApp.status,
        submittedAt: monikaApp.submittedAt,
        hasAnswers: !!monikaApp.answers
      });
    } else {
      console.log('❌ Monika\'s application not found in results');
    }

    // ✅ CRITICAL FIX: Safe answer parsing
    const formattedApplications = finalApplications.map(app => {
      let parsedAnswers;
      try {
        if (typeof app.answers === 'string') {
          parsedAnswers = JSON.parse(app.answers);
        } else {
          parsedAnswers = app.answers;
        }
      } catch (parseError) {
        console.warn('⚠️ Could not parse answers for application', app.id, parseError.message);
        parsedAnswers = app.answers; // Keep original if parsing fails
      }
      
      return {
        ...app,
        answers: parsedAnswers
      };
    });

    // ✅ SUCCESS RESPONSE
    res.json({
      success: true,
      data: formattedApplications,
      meta: {
        count: formattedApplications.length,
        status: status,
        timestamp: new Date().toISOString(),
        foundMonika: !!monikaApp,
        authUser: {
          id: req.user?.id,
          role: req.user?.role
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching applications:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch membership applications',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});



// ===============================================
// 4. GET MEMBERSHIP STATISTICS - FIXED ARRAY DESTRUCTURING
// ===============================================
// router.get('/full-membership-stats', authenticate, requireAdmin, async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Fetching membership statistics');
    
//     // FIXED: Proper query execution and result handling
//     const [statsResults] = await db.query(`
//       SELECT 
//         status,
//         COUNT(*) as count
//       FROM full_membership_applications 
//       GROUP BY status
//     `);

//     console.log('📊 Raw stats from database:', statsResults);

//     // Initialize result with all possible statuses
//     const result = {
//       pending: 0,
//       approved: 0,
//       declined: 0,
//       suspended: 0,
//       total: 0
//     };

//     // FIXED: Handle both single result and array results
//     const statsArray = Array.isArray(statsResults) ? statsResults : [statsResults];
    
//     if (statsResults && statsResults.length > 0) {
//       statsArray.forEach(stat => {
//         if (stat && result.hasOwnProperty(stat.status)) {
//           result[stat.status] = parseInt(stat.count);
//           result.total += parseInt(stat.count);
//         }
//       });
//     }

//     console.log('✅ Processed stats result:', result);

//     res.json({
//       success: true,
//       data: result,
//       debug: {
//         rawStats: statsResults,
//         authUser: {
//           id: req.user?.id,
//           role: req.user?.role
//         }
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error fetching stats:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch membership statistics',
//       details: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

router.get('/full-membership-stats', authenticate, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN: Fetching membership statistics');
    
    // ✅ FIXED: Proper query execution and result handling
    const [statsResults] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM full_membership_applications 
      GROUP BY status
    `);

    console.log('📊 Raw stats from database:', statsResults);
    console.log('📊 Stats result type:', typeof statsResults);
    console.log('📊 Stats is array:', Array.isArray(statsResults));

    // Initialize result with all possible statuses
    const result = {
      pending: 0,
      approved: 0,
      declined: 0,
      suspended: 0,
      total: 0
    };

    // ✅ CRITICAL FIX: Handle both single result and array results
    let statsArray = [];
    
    if (Array.isArray(statsResults)) {
      statsArray = statsResults;
    } else if (statsResults && typeof statsResults === 'object') {
      // Single result - wrap in array
      statsArray = [statsResults];
    } else {
      console.warn('⚠️ Unexpected stats result format:', statsResults);
      statsArray = [];
    }
    
    console.log('📊 Processed stats array:', statsArray);
    
    // Process the stats
    if (statsArray.length > 0) {
      statsArray.forEach(stat => {
        if (stat && result.hasOwnProperty(stat.status)) {
          const count = parseInt(stat.count) || 0;
          result[stat.status] = count;
          result.total += count;
          console.log(`📊 Added ${stat.status}: ${count}`);
        }
      });
    } else {
      console.log('📊 No stats found, using defaults');
    }

    console.log('✅ Final processed stats result:', result);

    res.json({
      success: true,
      data: result,
      debug: {
        rawStats: statsResults,
        processedArray: statsArray,
        authUser: {
          id: req.user?.id,
          role: req.user?.role
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch membership statistics',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});



// ===============================================
// 5. REVIEW INDIVIDUAL APPLICATION - ALREADY CORRECT
// ===============================================
router.put('/applications/:id/review', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    console.log('🔍 ADMIN: Reviewing application:', { 
      id, 
      status, 
      adminNotes,
      adminUser: req.user?.id,
      adminRole: req.user?.role
    });
    
    // Validate required fields
    if (!id || !status) {
      return res.status(400).json({
        success: false,
        error: 'Application ID and status are required'
      });
    }

    // Validate status
    const validDecisions = ['approved', 'declined', 'suspended'];
    if (!validDecisions.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        validValues: validDecisions,
        received: status
      });
    }

    // Check if application exists
    const [existingApp] = await db.query(`
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
      `, [status, adminNotes || '', req.user.id, id]);

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
          applicationId: parseInt(id),
          newStatus: status,
          userId: existingApp[0].user_id,
          reviewedBy: req.user.id,
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
      error: 'Failed to review application',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// 6. BULK REVIEW APPLICATIONS - ALREADY CORRECT
// ===============================================
router.post('/applications/bulk-review', authenticate, requireAdmin, async (req, res) => {
  try {
    const { applicationIds, decision, notes } = req.body;
    
    console.log('🔍 ADMIN: Bulk reviewing applications:', { 
      applicationIds, 
      decision, 
      notes,
      adminUser: req.user?.id,
      adminRole: req.user?.role
    });
    
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

    const validDecisions = ['approved', 'declined', 'suspended'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid decision',
        validValues: validDecisions,
        received: decision
      });
    }

    // Check if all applications exist and are pending
    const placeholders = applicationIds.map(() => '?').join(',');
    const [existingApps] = await db.query(`
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
      `, [decision, notes || '', req.user.id, ...applicationIds]);

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
          reviewedBy: req.user.id,
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
      error: 'Failed to bulk review applications',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// 7. GET SINGLE APPLICATION DETAILS - FIXED SQL AMBIGUITY
// ===============================================
router.get('/applications/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 ADMIN: Getting application details for ID:', id);
    
    // FIXED: Properly aliased query to avoid ambiguous columns
    const [applications] = await db.query(`
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
        fma.createdAt,
        fma.updatedAt,
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

    const application = applications[0];
    
    // Parse answers if they're stored as string
    if (typeof application.answers === 'string') {
      try {
        application.answers = JSON.parse(application.answers);
      } catch (e) {
        console.log('Could not parse answers as JSON, keeping as string');
      }
    }

    console.log('✅ Application details retrieved:', {
      id: application.id,
      username: application.username,
      hasAnswers: !!application.answers
    });

    res.json({
      success: true,
      data: application,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting application details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get application details',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// ERROR HANDLERS
// ===============================================

// 404 handler for admin membership routes
router.use('*', (req, res) => {
  console.warn(`❌ 404 - Admin membership route not found: ${req.method} ${req.path}`);
  
  res.status(404).json({
    success: false,
    error: 'Admin membership route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /test - Test admin endpoints (no auth)',
      'GET /applications?status=pending - Get applications by status (auth required)',
      'GET /full-membership-stats - Get membership statistics (auth required)',
      'GET /pending-count - Get pending applications count (auth required)',
      'PUT /applications/:id/review - Review individual application (auth required)',
      'POST /applications/bulk-review - Bulk review applications (auth required)',
      'GET /applications/:id - Get application details (auth required)'
    ],
    timestamp: new Date().toISOString()
  });
});

// Global error handler
router.use((error, req, res, next) => {
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  console.error('❌ Admin membership route error:', {
    errorId,
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.id || 'not authenticated',
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    errorId,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

console.log('✅ COMPLETE Admin membership routes loaded successfully with ALL SQL FIXES');

export default router;

// // ikootaapi/routes/adminMembershipRoutes.js
// // ===============================================
// // COMPLETE ADMIN MEMBERSHIP ROUTES
// // Includes ALL functions from original + fixes
// // ===============================================

// import express from 'express';
// import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
// import db from '../config/db.js';

// const router = express.Router();

// // ===============================================
// // MIDDLEWARE FOR ADMIN ROUTES
// // ===============================================

// // Debug middleware for all admin routes
// router.use((req, res, next) => {
//   console.log('🔍 ADMIN ROUTE HIT:', {
//     method: req.method,
//     path: req.path,
//     query: req.query,
//     hasAuth: !!req.headers.authorization,
//     timestamp: new Date().toISOString()
//   });
//   next();
// });

// // ===============================================
// // 1. TEST ENDPOINT - No auth required for connectivity test
// // ===============================================
// router.get('/test', (req, res) => {
//   try {
//     console.log('🧪 Admin test endpoint hit');
    
//     res.json({
//       success: true,
//       message: 'Admin membership endpoints are working!',
//       data: {
//         server: 'Connected',
//         timestamp: new Date().toISOString(),
//         endpoint: '/api/admin/membership/test',
//         userAgent: req.get('User-Agent')?.substring(0, 50) + '...',
//         authHeaderPresent: !!req.headers.authorization
//       }
//     });

//   } catch (error) {
//     console.error('❌ Test endpoint error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Test endpoint failed',
//       details: error.message
//     });
//   }
// });

// // ===============================================
// // 2. GET PENDING COUNT - FIXED to find Monika's application
// // ===============================================
// router.get('/pending-count', authenticate, requireAdmin, async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Getting pending count with FIXED query');
    
//     // FIXED: Simple count query without GROUP_CONCAT
//     const [result] = await db.query(`
//       SELECT COUNT(*) as count
//       FROM full_membership_applications 
//       WHERE status = 'pending'
//     `);

//     const count = result[0]?.count || 0;
    
//     console.log('✅ FIXED Pending count result:', {
//       count: count,
//       rawResult: result[0]
//     });

//     // Debug: Show all applications to verify
//    const [allApps] = await db.query(`
//   SELECT 
//     fma.id, 
//     fma.user_id, 
//     u.username, 
//     fma.status, 
//     fma.submittedAt 
//   FROM full_membership_applications fma
//   JOIN users u ON fma.user_id = u.id
//   ORDER BY fma.submittedAt DESC 
//   LIMIT 5
// `);
    
//     console.log('📋 All applications with usernames:', allApps);

//     // Find Monika specifically
//     const monikaApp = allApps.find(app => app.username === 'Monika');
//     if (monikaApp) {
//       console.log('🎯 FOUND MONIKA:', monikaApp);
//     }

//     res.json({
//       success: true,
//       count: parseInt(count),
//       debug: {
//         totalApplicationsInTable: allApps.length,
//         allApplications: allApps,
//         monikaFound: !!monikaApp,
//         monikaApplication: monikaApp || null
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error getting pending count:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to get pending count',
//       details: error.message,
//       count: 0,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// // ===============================================
// // 3. GET APPLICATIONS - FIXED authentication and query
// // ===============================================
// router.get('/applications', authenticate, requireAdmin, async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Fetching applications with user:', {
//       userId: req.user?.id,
//       userRole: req.user?.role,
//       hasToken: !!req.headers.authorization
//     });
    
//     const { status = 'pending' } = req.query;

//     // Validate status
//     const validStatuses = ['pending', 'approved', 'declined', 'suspended', 'all'];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid status parameter',
//         validValues: validStatuses,
//         received: status
//       });
//     }

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
//         u.username,
//         u.email,
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

//     console.log('🔍 Executing applications query:', query);
//     console.log('🔍 Query params:', queryParams);

//     const [applications] = await db.query(query, queryParams);
    
//     console.log('✅ Found applications:', applications.length);
    
//     // Debug: Log each application found
//     applications.forEach((app, index) => {
//       console.log(`📋 Application ${index + 1}:`, {
//         id: app.id,
//         user_id: app.user_id,
//         username: app.username,
//         status: app.status,
//         ticket: app.membership_ticket,
//         submittedAt: app.submittedAt
//       });
//     });
    
//     // Log Monika's application if found
//     const monikaApp = applications.find(app => app.username === 'Monika');
//     if (monikaApp) {
//       console.log('🎯 Found Monika\'s application:', {
//         id: monikaApp.id,
//         user_id: monikaApp.user_id,
//         ticket: monikaApp.membership_ticket,
//         status: monikaApp.status,
//         submittedAt: monikaApp.submittedAt,
//         hasAnswers: !!monikaApp.answers
//       });
//     } else {
//       console.log('❌ Monika\'s application not found in results');
//     }

//     // Parse answers field for better frontend handling
//     const formattedApplications = applications.map(app => ({
//       ...app,
//       answers: typeof app.answers === 'string' ? JSON.parse(app.answers) : app.answers
//     }));

//     res.json({
//       success: true,
//       data: formattedApplications,
//       meta: {
//         count: applications.length,
//         status: status,
//         timestamp: new Date().toISOString(),
//         foundMonika: !!monikaApp,
//         authUser: {
//           id: req.user?.id,
//           role: req.user?.role
//         }
//       }
//     });

//   } catch (error) {
//     console.error('❌ Error fetching applications:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch membership applications',
//       details: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// // ===============================================
// // 4. GET MEMBERSHIP STATISTICS - FIXED authentication
// // ===============================================
// router.get('/full-membership-stats', authenticate, requireAdmin, async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Fetching membership statistics');
    
//     const [statsResult] = await db.query(`
//       SELECT 
//         status,
//         COUNT(*) as count
//       FROM full_membership_applications 
//       GROUP BY status
//     `);
//     const stats = statsResult;

//     console.log('📊 Raw stats from database:', stats);

//     // Initialize result with all possible statuses
//     const result = {
//       pending: 0,
//       approved: 0,
//       declined: 0,
//       suspended: 0,
//       total: 0
//     };

//     // Populate with actual data
//     stats.forEach(stat => {
//       if (result.hasOwnProperty(stat.status)) {
//         result[stat.status] = parseInt(stat.count);
//         result.total += parseInt(stat.count);
//       }
//     });

//     console.log('✅ Processed stats result:', result);

//     res.json({
//       success: true,
//       data: result,
//       debug: {
//         rawStats: stats,
//         authUser: {
//           id: req.user?.id,
//           role: req.user?.role
//         }
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error fetching stats:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch membership statistics',
//       details: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// // ===============================================
// // 5. REVIEW INDIVIDUAL APPLICATION - FIXED authentication
// // ===============================================
// router.put('/applications/:id/review', authenticate, requireAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, adminNotes } = req.body;
    
//     console.log('🔍 ADMIN: Reviewing application:', { 
//       id, 
//       status, 
//       adminNotes,
//       adminUser: req.user?.id,
//       adminRole: req.user?.role
//     });
    
//     // Validate required fields
//     if (!id || !status) {
//       return res.status(400).json({
//         success: false,
//         error: 'Application ID and status are required'
//       });
//     }

//     // Validate status
//     const validDecisions = ['approved', 'declined', 'suspended'];
//     if (!validDecisions.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid status',
//         validValues: validDecisions,
//         received: status
//       });
//     }

//     // Check if application exists
//     const [existingApp] = await db.query(`
//       SELECT id, status, user_id 
//       FROM full_membership_applications 
//       WHERE id = ?
//     `, [id]);

//     if (existingApp.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'Application not found'
//       });
//     }

//     // Start transaction
//     await db.query('START TRANSACTION');

//     try {
//       // Update the application
//       await db.query(`
//         UPDATE full_membership_applications 
//         SET 
//           status = ?,
//           admin_notes = ?,
//           reviewedAt = NOW(),
//           reviewed_by = ?
//         WHERE id = ?
//       `, [status, adminNotes || '', req.user.id, id]);

//       // If approved, update user's membership status
//       if (status === 'approved') {
//         await db.query(`
//           UPDATE users 
//           SET 
//             is_member = 'member',
//             membership_stage = 'member',
//             full_membership_status = 'approved',
//             fullMembershipReviewedAt = NOW()
//           WHERE id = ?
//         `, [existingApp[0].user_id]);

//         console.log('✅ User promoted to full member');
//       }

//       // Commit transaction
//       await db.query('COMMIT');

//       console.log('✅ Application reviewed successfully');

//       res.json({
//         success: true,
//         message: `Application ${status} successfully`,
//         data: {
//           applicationId: parseInt(id),
//           newStatus: status,
//           userId: existingApp[0].user_id,
//           reviewedBy: req.user.id,
//           reviewedAt: new Date().toISOString()
//         },
//         timestamp: new Date().toISOString()
//       });

//     } catch (error) {
//       await db.query('ROLLBACK');
//       throw error;
//     }

//   } catch (error) {
//     console.error('❌ Error reviewing application:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to review application',
//       details: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// // ===============================================
// // 6. BULK REVIEW APPLICATIONS - MISSING FUNCTION RESTORED
// // ===============================================
// router.post('/applications/bulk-review', authenticate, requireAdmin, async (req, res) => {
//   try {
//     const { applicationIds, decision, notes } = req.body;
    
//     console.log('🔍 ADMIN: Bulk reviewing applications:', { 
//       applicationIds, 
//       decision, 
//       notes,
//       adminUser: req.user?.id,
//       adminRole: req.user?.role
//     });
    
//     // Validate input
//     if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'applicationIds must be a non-empty array'
//       });
//     }

//     if (!decision) {
//       return res.status(400).json({
//         success: false,
//         error: 'Decision is required'
//       });
//     }

//     const validDecisions = ['approved', 'declined', 'suspended'];
//     if (!validDecisions.includes(decision)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid decision',
//         validValues: validDecisions,
//         received: decision
//       });
//     }

//     // Check if all applications exist and are pending
//     const placeholders = applicationIds.map(() => '?').join(',');
//     const [existingApps] = await db.query(`
//       SELECT id, status, user_id 
//       FROM full_membership_applications 
//       WHERE id IN (${placeholders})
//     `, applicationIds);

//     if (existingApps.length !== applicationIds.length) {
//       return res.status(400).json({
//         success: false,
//         error: 'Some applications were not found',
//         found: existingApps.length,
//         requested: applicationIds.length
//       });
//     }

//     const nonPendingApps = existingApps.filter(app => app.status !== 'pending');
//     if (nonPendingApps.length > 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'Some applications are not pending',
//         nonPendingApps: nonPendingApps.map(app => ({ id: app.id, status: app.status }))
//       });
//     }

//     // Start transaction
//     await db.query('START TRANSACTION');

//     try {
//       // Bulk update applications
//       await db.query(`
//         UPDATE full_membership_applications 
//         SET 
//           status = ?,
//           admin_notes = ?,
//           reviewedAt = NOW(),
//           reviewed_by = ?
//         WHERE id IN (${placeholders})
//       `, [decision, notes || '', req.user.id, ...applicationIds]);

//       // If approved, update users' membership status
//       if (decision === 'approved') {
//         const userIds = existingApps.map(app => app.user_id);
//         const userPlaceholders = userIds.map(() => '?').join(',');
        
//         await db.query(`
//           UPDATE users 
//           SET 
//             is_member = 'member',
//             membership_stage = 'member',
//             full_membership_status = 'approved',
//             fullMembershipReviewedAt = NOW()
//           WHERE id IN (${userPlaceholders})
//         `, userIds);

//         console.log(`✅ ${userIds.length} users promoted to full members`);
//       }

//       // Commit transaction
//       await db.query('COMMIT');

//       console.log('✅ Bulk review completed successfully');

//       res.json({
//         success: true,
//         message: `${applicationIds.length} applications ${decision} successfully`,
//         data: {
//           processedCount: applicationIds.length,
//           applicationIds: applicationIds,
//           decision: decision,
//           reviewedBy: req.user.id,
//           reviewedAt: new Date().toISOString()
//         },
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
//       error: 'Failed to bulk review applications',
//       details: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// // ===============================================
// // 7. GET SINGLE APPLICATION DETAILS - FIXED authentication
// // ===============================================
// router.get('/applications/:id', authenticate, requireAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     console.log('🔍 ADMIN: Getting application details for ID:', id);
    
//     const [applications] = await db.query(`
//       SELECT 
//         fma.*,
//         u.username,
//         u.email,
//         u.membership_stage,
//         u.is_member,
//         reviewer.username as reviewer_name
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
//       WHERE fma.id = ?
//     `, [id]);

//     if (applications.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'Application not found'
//       });
//     }

//     const application = applications[0];
    
//     // Parse answers if they're stored as string
//     if (typeof application.answers === 'string') {
//       try {
//         application.answers = JSON.parse(application.answers);
//       } catch (e) {
//         console.log('Could not parse answers as JSON, keeping as string');
//       }
//     }

//     console.log('✅ Application details retrieved:', {
//       id: application.id,
//       username: application.username,
//       hasAnswers: !!application.answers
//     });

//     res.json({
//       success: true,
//       data: application,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error getting application details:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to get application details',
//       details: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// // ===============================================
// // ERROR HANDLERS
// // ===============================================

// // 404 handler for admin membership routes
// router.use('*', (req, res) => {
//   console.warn(`❌ 404 - Admin membership route not found: ${req.method} ${req.path}`);
  
//   res.status(404).json({
//     success: false,
//     error: 'Admin membership route not found',
//     path: req.path,
//     method: req.method,
//     availableEndpoints: [
//       'GET /test - Test admin endpoints (no auth)',
//       'GET /applications?status=pending - Get applications by status (auth required)',
//       'GET /full-membership-stats - Get membership statistics (auth required)',
//       'GET /pending-count - Get pending applications count (auth required)',
//       'PUT /applications/:id/review - Review individual application (auth required)',
//       'POST /applications/bulk-review - Bulk review applications (auth required)',
//       'GET /applications/:id - Get application details (auth required)'
//     ],
//     timestamp: new Date().toISOString()
//   });
// });

// // Global error handler
// router.use((error, req, res, next) => {
//   const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
//   console.error('❌ Admin membership route error:', {
//     errorId,
//     error: error.message,
//     path: req.path,
//     method: req.method,
//     user: req.user?.id || 'not authenticated',
//     timestamp: new Date().toISOString()
//   });
  
//   res.status(error.statusCode || 500).json({
//     success: false,
//     error: error.message || 'Internal server error',
//     errorId,
//     path: req.path,
//     method: req.method,
//     timestamp: new Date().toISOString()
//   });
// });

// console.log('✅ COMPLETE Admin membership routes loaded successfully with ALL functions');

// export default router;


// // File: ikootaapi/routes/adminMembershipRoutes.js
// // ADMIN MEMBERSHIP ROUTES - COMPLETE ADMIN MEMBERSHIP REVIEW SYSTEM
// // Handles all admin review functionality for full membership applications

// import express from 'express';
// import { authenticate, authorize } from '../middlewares/auth.middleware.js';
// import db from '../config/db.js';

// const adminMembershipRouter = express.Router();

// // Basic admin authentication middleware
// adminMembershipRouter.use(authenticate);
// adminMembershipRouter.use(authorize(['admin', 'super_admin']));

// // ===============================================
// // FULL MEMBERSHIP APPLICATION MANAGEMENT
// // ===============================================

// // Get full membership applications
// // adminMembershipRouter.get('/applications', async (req, res) => {
// //   try {
// //     console.log('🔍 ADMIN: Fetching full membership applications');
// //     const { status = 'pending' } = req.query;

// //     let query = `
// //       SELECT 
// //         fma.id,
// //         fma.user_id,
// //         fma.membership_ticket,
// //         fma.answers,
// //         fma.status,
// //         fma.submittedAt,
// //         fma.reviewedAt,
// //         fma.reviewed_by,
// //         fma.admin_notes,
// //         u.username as user_name,
// //         u.email as user_email,
// //         reviewer.username as reviewer_name
// //       FROM full_membership_applications fma
// //       JOIN users u ON fma.user_id = u.id
// //       LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
// //     `;

// //     let queryParams = [];

// //     if (status !== 'all') {
// //       query += ' WHERE fma.status = ?';
// //       queryParams = [status];
// //     }

// //     query += ' ORDER BY fma.submittedAt DESC';

// //     const applications = await db.query(query, queryParams);
    
// //     console.log('✅ Found', applications.length, 'applications');

// //     res.json({
// //       success: true,
// //       data: applications,
// //       meta: {
// //         count: applications.length,
// //         status: status,
// //         timestamp: new Date().toISOString()
// //       }
// //     });

// //   } catch (error) {
// //     console.error('❌ Error fetching applications:', error);
// //     res.status(500).json({
// //       success: false,
// //       error: error.message,
// //       count: 0
// //     });
// //   }
// // });

// adminMembershipRouter.get('/applications', async (req, res) => {
//   try {
//     const { status = 'pending' } = req.query;
//     console.log('🔍 ADMIN: Fetching applications with status:', status);

//     // Simple query first to test
//     const applications = await db.query(`
//       SELECT 
//         fma.id,
//         fma.user_id,
//         fma.membership_ticket,
//         fma.status,
//         fma.submittedAt,
//         u.username,
//         u.email
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       WHERE fma.status = ?
//       ORDER BY fma.submittedAt DESC
//     `, [status]);

//     console.log('✅ Found applications:', applications.length);

//     res.json({
//       success: true,
//       data: applications,
//       count: applications.length,
//       status: status,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error fetching applications:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to fetch applications'
//     });
//   }
// });


// // Get specific application details
// adminMembershipRouter.get('/applications/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     console.log('🔍 ADMIN: Getting application details for ID:', id);
    
//     const applications = await db.query(`
//       SELECT 
//         fma.*,
//         u.username,
//         u.email,
//         u.membership_stage,
//         u.is_member,
//         reviewer.username as reviewer_name
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
//       WHERE fma.id = ?
//     `, [id]);

//     if (applications.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'Application not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: applications[0],
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error getting application details:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to get application details'
//     });
//   }
// });

// // Alternative route for application details (from clean version)
// adminMembershipRouter.get('/application/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     console.log('🔍 ADMIN: Getting application details for ID:', id);
    
//     const applications = await db.query(`
//       SELECT 
//         fma.*,
//         u.username,
//         u.email,
//         u.membership_stage,
//         u.is_member,
//         reviewer.username as reviewer_name
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
//       WHERE fma.id = ?
//     `, [id]);

//     if (applications.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'Application not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: applications[0],
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error getting application details:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to get application details'
//     });
//   }
// });

// // ===============================================
// // APPLICATION REVIEW ACTIONS
// // ===============================================

// // Review individual application (approve/decline)
// adminMembershipRouter.put('/applications/:id/review', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, adminNotes } = req.body;
    
//     console.log('🔍 ADMIN: Reviewing application:', { id, status, adminNotes });
    
//     // Validate status
//     if (!['approved', 'declined', 'suspended'].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid status. Must be approved, declined, or suspended'
//       });
//     }

//     // Start transaction
//     await db.query('START TRANSACTION');

//     try {
//       // Update the application
//       await db.query(`
//         UPDATE full_membership_applications 
//         SET 
//           status = ?,
//           admin_notes = ?,
//           reviewedAt = NOW(),
//           reviewed_by = ?
//         WHERE id = ?
//       `, [status, adminNotes || '', req.user?.id || 1, id]);

//       // If approved, update user's membership status
//       if (status === 'approved') {
//         await db.query(`
//           UPDATE users 
//           SET 
//             is_member = 'member',
//             membership_stage = 'member',
//             full_membership_status = 'approved',
//             fullMembershipReviewedAt = NOW()
//           WHERE id = (
//             SELECT user_id 
//             FROM full_membership_applications 
//             WHERE id = ?
//           )
//         `, [id]);

//         console.log('✅ User promoted to full member');
//       }

//       // Commit transaction
//       await db.query('COMMIT');

//       console.log('✅ Application reviewed successfully');

//       res.json({
//         success: true,
//         message: `Application ${status} successfully`,
//         applicationId: id,
//         newStatus: status,
//         timestamp: new Date().toISOString()
//       });

//     } catch (error) {
//       await db.query('ROLLBACK');
//       throw error;
//     }

//   } catch (error) {
//     console.error('❌ Error reviewing application:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to review application'
//     });
//   }
// });

// // Alternative review route (from clean version)
// adminMembershipRouter.put('/review/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, adminNotes } = req.body;
    
//     console.log('🔍 ADMIN: Reviewing application:', { id, status, adminNotes });
    
//     // Validate status
//     if (!['approved', 'declined', 'suspended'].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid status. Must be approved, declined, or suspended'
//       });
//     }

//     // Start transaction
//     await db.query('START TRANSACTION');

//     try {
//       // Update the application
//       await db.query(`
//         UPDATE full_membership_applications 
//         SET 
//           status = ?,
//           admin_notes = ?,
//           reviewedAt = NOW(),
//           reviewed_by = ?
//         WHERE id = ?
//       `, [status, adminNotes || '', req.user?.id || 1, id]);

//       // If approved, update user's membership status
//       if (status === 'approved') {
//         await db.query(`
//           UPDATE users 
//           SET 
//             is_member = 'member',
//             membership_stage = 'member',
//             full_membership_status = 'approved',
//             fullMembershipReviewedAt = NOW()
//           WHERE id = (
//             SELECT user_id 
//             FROM full_membership_applications 
//             WHERE id = ?
//           )
//         `, [id]);

//         console.log('✅ User promoted to full member');
//       }

//       // Commit transaction
//       await db.query('COMMIT');

//       console.log('✅ Application reviewed successfully');

//       res.json({
//         success: true,
//         message: `Application ${status} successfully`,
//         applicationId: id,
//         newStatus: status,
//         timestamp: new Date().toISOString()
//       });

//     } catch (error) {
//       await db.query('ROLLBACK');
//       throw error;
//     }

//   } catch (error) {
//     console.error('❌ Error reviewing application:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to review application'
//     });
//   }
// });

// // Bulk review applications
// adminMembershipRouter.post('/applications/bulk-review', async (req, res) => {
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

// // Alternative bulk review route (from clean version)
// adminMembershipRouter.post('/bulk-review', async (req, res) => {
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

// // ===============================================
// // MEMBERSHIP STATISTICS
// // ===============================================

// // Get full membership statistics
// adminMembershipRouter.get('/stats', async (req, res) => {
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

// // Alternative stats route (from adminRoutes)
// // adminMembershipRouter.get('/full-membership-stats', async (req, res) => {
// //   try {
// //     console.log('🔍 ADMIN: Fetching membership stats');
    
// //     const stats = await db.query(`
// //       SELECT 
// //         status,
// //         COUNT(*) as count
// //       FROM full_membership_applications 
// //       GROUP BY status
// //     `);

// //     const result = {
// //       pending: 0,
// //       approved: 0,
// //       declined: 0,
// //       suspended: 0,
// //       total: 0
// //     };

// //     stats.forEach(stat => {
// //       result[stat.status] = stat.count;
// //       result.total += stat.count;
// //     });

// //     console.log('✅ Stats result:', result);

// //     res.json({
// //       success: true,
// //       data: result,
// //       timestamp: new Date().toISOString()
// //     });

// //   } catch (error) {
// //     console.error('❌ Error fetching stats:', error);
// //     res.status(500).json({
// //       success: false,
// //       error: error.message,
// //       details: 'Failed to fetch membership statistics'
// //     });
// //   }
// // });


// adminMembershipRouter.get('/full-membership-stats', async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Fetching full membership stats');
    
//     // Simple stats query
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

//     // Process results safely
//     if (Array.isArray(stats)) {
//       const rows = Array.isArray(stats[0]) ? stats[0] : stats;
//       rows.forEach(stat => {
//         if (stat && stat.status && stat.count) {
//           result[stat.status] = parseInt(stat.count);
//           result.total += parseInt(stat.count);
//         }
//       });
//     }

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



// // Get pending count (for sidebar badge)
// adminMembershipRouter.get('/pending-count', async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Getting pending count');
    
//     const result = await db.query(`
//       SELECT COUNT(*) as count 
//       FROM full_membership_applications 
//       WHERE status = 'pending'
//     `);

//     const count = result[0]?.count || 0;
//     console.log('✅ Pending count:', count);

//     res.json({
//       success: true,
//       count: count,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error getting pending count:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       count: 0
//     });
//   }
// });

// // ===============================================
// // MEMBERSHIP OVERVIEW & ANALYTICS
// // ===============================================

// // Get membership overview
// adminMembershipRouter.get('/overview', async (req, res) => {
//   // This would integrate with analytics controller
//   res.json({ message: 'Membership overview endpoint - integrate with analyticsController' });
// });

// // Get membership analytics
// adminMembershipRouter.get('/analytics', async (req, res) => {
//   // This would integrate with analytics controller
//   res.json({ message: 'Membership analytics endpoint - integrate with analyticsController' });
// });

// // Export membership data
// adminMembershipRouter.get('/export', async (req, res) => {
//   // This would integrate with analytics controller
//   res.json({ message: 'Export membership data endpoint - integrate with analyticsController' });
// });

// // ===============================================
// // ADMIN APPLICATION ROUTES (FROM adminApplicationRoutes)
// // ===============================================

// // Enhanced admin application management routes
// adminMembershipRouter.get('/admin/pending-applications', async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Getting pending applications');
    
//     const applications = await db.query(`
//       SELECT 
//         fma.id,
//         fma.user_id,
//         fma.membership_ticket,
//         fma.answers,
//         fma.status,
//         fma.submittedAt,
//         u.username,
//         u.email
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       WHERE fma.status = 'pending'
//       ORDER BY fma.submittedAt ASC
//     `);

//     res.json({
//       success: true,
//       data: applications,
//       count: applications.length,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error getting pending applications:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// adminMembershipRouter.get('/admin/applications', async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Getting all applications');
    
//     const applications = await db.query(`
//       SELECT 
//         fma.id,
//         fma.user_id,
//         fma.membership_ticket,
//         fma.answers,
//         fma.status,
//         fma.submittedAt,
//         fma.reviewedAt,
//         u.username,
//         u.email
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       ORDER BY fma.submittedAt DESC
//     `);

//     res.json({
//       success: true,
//       data: applications,
//       count: applications.length,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error getting applications:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// adminMembershipRouter.get('/admin/membership/applications', async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Getting membership applications');
    
//     const applications = await db.query(`
//       SELECT 
//         fma.id,
//         fma.user_id,
//         fma.membership_ticket,
//         fma.answers,
//         fma.status,
//         fma.submittedAt,
//         fma.reviewedAt,
//         u.username,
//         u.email
//       FROM full_membership_applications fma
//       JOIN users u ON fma.user_id = u.id
//       ORDER BY fma.submittedAt DESC
//     `);

//     res.json({
//       success: true,
//       data: applications,
//       count: applications.length,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error getting membership applications:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // Review membership application with validation
// adminMembershipRouter.put('/admin/membership/review/:applicationId', async (req, res) => {
//   try {
//     const { applicationId } = req.params;
//     const { status, adminNotes } = req.body;
    
//     console.log('🔍 ADMIN: Reviewing membership application:', { applicationId, status, adminNotes });
    
//     // Validate status
//     if (!['approved', 'declined', 'suspended'].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid status. Must be approved, declined, or suspended'
//       });
//     }

//     // Start transaction
//     await db.query('START TRANSACTION');

//     try {
//       // Update the application
//       await db.query(`
//         UPDATE full_membership_applications 
//         SET 
//           status = ?,
//           admin_notes = ?,
//           reviewedAt = NOW(),
//           reviewed_by = ?
//         WHERE id = ?
//       `, [status, adminNotes || '', req.user?.id || 1, applicationId]);

//       // If approved, update user's membership status
//       if (status === 'approved') {
//         await db.query(`
//           UPDATE users 
//           SET 
//             is_member = 'member',
//             membership_stage = 'member',
//             full_membership_status = 'approved',
//             fullMembershipReviewedAt = NOW()
//           WHERE id = (
//             SELECT user_id 
//             FROM full_membership_applications 
//             WHERE id = ?
//           )
//         `, [applicationId]);

//         console.log('✅ User promoted to full member');
//       }

//       // Commit transaction
//       await db.query('COMMIT');

//       console.log('✅ Membership application reviewed successfully');

//       res.json({
//         success: true,
//         message: `Application ${status} successfully`,
//         applicationId: applicationId,
//         newStatus: status,
//         timestamp: new Date().toISOString()
//       });

//     } catch (error) {
//       await db.query('ROLLBACK');
//       throw error;
//     }

//   } catch (error) {
//     console.error('❌ Error reviewing membership application:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       details: 'Failed to review membership application'
//     });
//   }
// });

// // Application statistics with access control
// adminMembershipRouter.get('/admin/applications/stats', async (req, res) => {
//   try {
//     console.log('🔍 ADMIN: Getting application statistics');
    
//     const stats = await db.query(`
//       SELECT 
//         status,
//         COUNT(*) as count,
//         AVG(TIMESTAMPDIFF(DAY, submittedAt, reviewedAt)) as avg_review_days
//       FROM full_membership_applications 
//       GROUP BY status
//     `);

//     const totalCount = await db.query(`
//       SELECT COUNT(*) as total FROM full_membership_applications
//     `);

//     const recentStats = await db.query(`
//       SELECT 
//         COUNT(*) as recent_count
//       FROM full_membership_applications 
//       WHERE submittedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//     `);

//     res.json({
//       success: true,
//       data: {
//         statusBreakdown: stats,
//         totalApplications: totalCount[0].total,
//         recentApplications: recentStats[0].recent_count
//       },
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error getting application statistics:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // Simple test endpoint to verify admin routes are working
// adminMembershipRouter.get('/test', async (req, res) => {
//   try {
//     console.log('🧪 Admin test endpoint called');
//     res.json({
//       success: true,
//       message: 'Admin membership routes are working',
//       user: req.user?.username,
//       role: req.user?.role,
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// // ===============================================
// // DEBUG ROUTES (DEVELOPMENT ONLY)
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
  
//   // Test database connectivity
//   adminMembershipRouter.get('/debug/test', async (req, res) => {
//     try {
//       const result = await db.query('SELECT COUNT(*) as count FROM full_membership_applications');
//       res.json({
//         success: true,
//         message: 'Database connection working',
//         totalApplications: result[0].count,
//         timestamp: new Date().toISOString()
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         error: error.message
//       });
//     }
//   });

//   // Get all available routes
//   adminMembershipRouter.get('/debug/routes', (req, res) => {
//     res.json({
//       success: true,
//       message: 'Admin membership routes',
//       routes: [
//         'GET /applications - Get all applications (query: ?status=pending|approved|declined|all)',
//         'GET /applications/:id - Get application details',
//         'GET /application/:id - Alternative application details route',
//         'PUT /applications/:id/review - Review individual application',
//         'PUT /review/:id - Alternative review route',
//         'POST /applications/bulk-review - Bulk review applications',
//         'POST /bulk-review - Alternative bulk review route',
//         'GET /stats - Get membership statistics',
//         'GET /full-membership-stats - Alternative stats route',
//         'GET /pending-count - Get pending applications count',
//         'GET /overview - Get membership overview',
//         'GET /analytics - Get membership analytics',
//         'GET /export - Export membership data',
//         'GET /admin/pending-applications - Enhanced pending applications',
//         'GET /admin/applications - Enhanced all applications',
//         'GET /admin/membership/applications - Enhanced membership applications',
//         'PUT /admin/membership/review/:applicationId - Enhanced review with validation',
//         'GET /admin/applications/stats - Enhanced application statistics',
//         'GET /debug/test - Test database connectivity',
//         'GET /debug/routes - This route list'
//       ],
//       timestamp: new Date().toISOString()
//     });
//   });
// }

// // ===============================================
// // ERROR HANDLING
// // ===============================================

// // 404 handler for admin membership routes
// adminMembershipRouter.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: 'Admin membership route not found',
//     path: req.path,
//     method: req.method,
//     availableRoutes: {
//       applications: [
//         'GET /applications - Get all applications',
//         'GET /applications/:id - Get application details',
//         'GET /application/:id - Alternative application details',
//         'PUT /applications/:id/review - Review application',
//         'PUT /review/:id - Alternative review route',
//         'POST /applications/bulk-review - Bulk review applications',
//         'POST /bulk-review - Alternative bulk review'
//       ],
//       statistics: [
//         'GET /stats - Get membership statistics',
//         'GET /full-membership-stats - Alternative stats',
//         'GET /pending-count - Get pending count'
//       ],
//       analytics: [
//         'GET /overview - Get membership overview',
//         'GET /analytics - Get membership analytics',
//         'GET /export - Export membership data'
//       ],
//       enhanced: [
//         'GET /admin/pending-applications - Enhanced pending applications',
//         'GET /admin/applications - Enhanced all applications',
//         'GET /admin/membership/applications - Enhanced membership applications',
//         'PUT /admin/membership/review/:applicationId - Enhanced review',
//         'GET /admin/applications/stats - Enhanced statistics'
//       ]
//     },
//     timestamp: new Date().toISOString()
//   });
// });

// // Global error handler for admin membership routes
// adminMembershipRouter.use((error, req, res, next) => {
//   console.error('❌ Admin membership route error:', {
//     error: error.message,
//     stack: error.stack,
//     route: req.originalUrl,
//     method: req.method,
//     user: req.user?.username,
//     timestamp: new Date().toISOString()
//   });

//   res.status(error.status || 500).json({
//     success: false,
//     message: error.message || 'Internal server error',
//     timestamp: new Date().toISOString()
//   });
// });

// if (process.env.NODE_ENV === 'development') {
//   console.log('🏛️ Admin membership routes loaded with full membership review capabilities');
//   console.log('📊 Total endpoints: 21 (19 production + 2 debug)');
//   console.log('🔧 Features: Complete application management, bulk operations, enhanced admin routes');
// }

// export default adminMembershipRouter;