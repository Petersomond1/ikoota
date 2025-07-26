// ===============================================
// ikootaapi/routes/membershipRoutes.js - STANDARDIZED & INTEGRATED
// Combines existing structure with standardized patterns
// ===============================================

import express from 'express';
import { 
  // ✅ EXISTING: Membership-specific endpoints (keep all existing imports)
  checkApplicationStatus,
  submitInitialApplication,
  submitFullMembershipApplication,
  getFullMembershipStatus,
  logFullMembershipAccess,
  getPendingApplications,
  updateApplicationStatus,
  updateFullMembershipStatus,
  sendNotification,
  getPendingFullMemberships,
  sendMembershipNotification,
  getMembershipOverview,
  getMembershipStats,
  getUserDashboard,
  getApplicationHistory,
  bulkApproveApplications,
  exportMembershipData,
  getMembershipAnalytics,
  getUserPermissions,
  healthCheck,
  getSystemConfig,
  requireAdmin,
  requireSuperAdmin,
  validateRequest,
  getAllReports,
  updateApplicationAnswers,
  withdrawApplication,
  getApplicationRequirements,
  getUserByIdFixed,
  testUserLookup,
  getCurrentMembershipStatus,
  approvePreMemberApplication,
  declinePreMemberApplication,
  getAvailableMentors,
  getAvailableClasses
} from '../controllers/membershipControllers.js';

import { verifyApplicationStatusConsistency } from '../controllers/membershipControllers_2.js';
import { authenticate, cacheMiddleware } from '../middlewares/auth.middleware.js';
import db from '../config/db.js';

const router = express.Router();

// ===============================================
// ✅ ADDED: STANDARDIZED MEMBERSHIP ENDPOINTS
// These follow the standardized patterns with db.query() and camelCase timestamps
// ===============================================

// ✅ STANDARDIZED: Get membership application status with improved error handling
router.get('/full-membership-status/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can access this data (themselves or admin)
    if (req.user.id !== parseInt(userId) && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied - can only view your own status' 
      });
    }

    const query = `
      SELECT 
        fma.*,
        u.username,
        u.email,
        u.membership_stage,
        u.is_member,
        u.full_membership_status,
        u.full_membership_applied_at,
        u.full_membership_reviewed_at
      FROM full_membership_applications fma
      RIGHT JOIN users u ON fma.user_id = u.id
      WHERE u.id = ?
      ORDER BY fma.submittedAt DESC
      LIMIT 1
    `;

    const results = await db.query(query, [userId]);
    
    if (results.length === 0) {
      return res.json({
        success: true,
        status: 'not_applied',
        appliedAt: null,
        reviewedAt: null,
        ticket: null,
        adminNotes: null
      });
    }

    const application = results[0];
    
    res.json({
      success: true,
      status: application.status || application.full_membership_status || 'not_applied',
      appliedAt: application.submittedAt || application.full_membership_applied_at,
      reviewedAt: application.reviewedAt || application.full_membership_reviewed_at,
      ticket: application.membership_ticket,
      adminNotes: application.admin_notes,
      answers: application.answers ? JSON.parse(application.answers) : null
    });

  } catch (error) {
    console.error('❌ Error fetching membership application status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ STANDARDIZED: Submit full membership application with transaction safety
router.post('/submit-full-membership', authenticate, async (req, res) => {
  try {
    const { answers, membershipTicket, applicationType } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!answers || !membershipTicket) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: answers and membershipTicket are required' 
      });
    }

    // ✅ STANDARDIZED: Verify user is pre_member
    const userCheck = await db.query(
      'SELECT membership_stage, is_member, full_membership_status FROM users WHERE id = ?',
      [userId]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const user = userCheck[0];
    
    // ✅ STANDARDIZED: Check eligibility - must be pre_member
    if (user.membership_stage !== 'pre_member') {
      return res.status(400).json({ 
        success: false,
        message: 'Only pre-members can apply for full membership',
        currentStatus: {
          membership_stage: user.membership_stage,
          is_member: user.is_member
        }
      });
    }

    // Check for existing pending application
    const existingApp = await db.query(
      'SELECT id FROM full_membership_applications WHERE user_id = ? AND status = "pending"',
      [userId]
    );

    if (existingApp.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'You already have a pending membership application' 
      });
    }

    // Begin transaction for data consistency
    await db.beginTransaction();

    try {
      // Insert application with standardized timestamp fields
      const insertResult = await db.query(`
        INSERT INTO full_membership_applications 
        (user_id, membership_ticket, answers, status, submittedAt, createdAt, updatedAt) 
        VALUES (?, ?, ?, 'pending', NOW(), NOW(), NOW())
      `, [userId, membershipTicket, JSON.stringify(answers)]);

      // ✅ STANDARDIZED: Update user table (application status, not membership level)
      await db.query(`
        UPDATE users 
        SET full_membership_status = 'pending',
            full_membership_applied_at = NOW(),
            full_membership_ticket = ?,
            updatedAt = NOW()
        WHERE id = ?
      `, [membershipTicket, userId]);

      // Log the application for audit trail
      await db.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'membership_application_submitted', ?, NOW())
      `, [userId, JSON.stringify({ 
        ticket: membershipTicket, 
        applicationId: insertResult.insertId,
        applicationType: applicationType || 'standard'
      })]);

      await db.commit();

      res.status(201).json({
        success: true,
        message: 'Membership application submitted successfully',
        data: {
          applicationId: insertResult.insertId,
          membershipTicket: membershipTicket,
          status: 'pending'
        }
      });

    } catch (error) {
      await db.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error submitting membership application:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ STANDARDIZED: Admin endpoint to get all pending applications
router.get('/admin/membership/applications', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status = 'pending', limit = 50, offset = 0 } = req.query;

    const query = `
      SELECT 
        fma.*,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.membership_stage,
        u.is_member,
        reviewer.username as reviewer_name
      FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
      WHERE fma.status = ?
      ORDER BY fma.submittedAt DESC
      LIMIT ? OFFSET ?
    `;

    const applications = await db.query(query, [status, parseInt(limit), parseInt(offset)]);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM full_membership_applications fma
      WHERE fma.status = ?
    `;
    
    const countResult = await db.query(countQuery, [status]);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        applications: applications.map(app => ({
          ...app,
          answers: app.answers ? JSON.parse(app.answers) : null
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching membership applications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ STANDARDIZED: Admin review endpoint with transaction safety
router.put('/admin/membership/review/:applicationId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, adminNotes } = req.body;
    const reviewerId = req.user.id;

    if (!['approved', 'declined'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status. Must be "approved" or "declined"' 
      });
    }

    // Get application details
    const appCheck = await db.query(`
      SELECT fma.*, u.username, u.email 
      FROM full_membership_applications fma
      JOIN users u ON fma.user_id = u.id
      WHERE fma.id = ? AND fma.status = 'pending'
    `, [applicationId]);

    if (appCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Pending application not found' 
      });
    }

    const application = appCheck[0];
    const userId = application.user_id;

    // Begin transaction
    await db.beginTransaction();

    try {
      // Update application with standardized timestamps
      await db.query(`
        UPDATE full_membership_applications 
        SET status = ?, reviewedAt = NOW(), reviewed_by = ?, admin_notes = ?, updatedAt = NOW()
        WHERE id = ?
      `, [status, reviewerId, adminNotes, applicationId]);

      // ✅ STANDARDIZED: Update user based on decision
      if (status === 'approved') {
        // ✅ UPGRADE: pre_member → member
        await db.query(`
          UPDATE users 
          SET membership_stage = 'member',
              is_member = 'member',
              full_membership_status = 'approved',
              full_membership_reviewed_at = NOW(),
              updatedAt = NOW()
          WHERE id = ?
        `, [userId]);

        // Grant member access
        await db.query(`
          INSERT INTO full_membership_access (user_id, first_accessed_at, access_count, createdAt, updatedAt)
          VALUES (?, NOW(), 0, NOW(), NOW())
          ON DUPLICATE KEY UPDATE 
            access_count = access_count,
            updatedAt = NOW()
        `, [userId]);

      } else {
        // ✅ DECLINE: Remains pre_member, but mark application as declined
        await db.query(`
          UPDATE users 
          SET full_membership_status = 'declined',
              full_membership_reviewed_at = NOW(),
              updatedAt = NOW()
          WHERE id = ?
        `, [userId]);
      }

      // Log the review action
      await db.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'membership_application_reviewed', ?, NOW())
      `, [reviewerId, JSON.stringify({
        applicationId: applicationId,
        applicantId: userId,
        decision: status,
        adminNotes: adminNotes,
        reviewerName: req.user.username
      })]);

      await db.commit();

      res.json({
        success: true,
        message: `Membership application ${status} successfully`,
        data: {
          applicationId: applicationId,
          decision: status,
          userId: userId
        }
      });

    } catch (error) {
      await db.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error reviewing membership application:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to review application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ STANDARDIZED: Enhanced survey status check with membership data
router.get('/survey/check-status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ STANDARDIZED: Get comprehensive user status including membership application
    const userResults = await db.query(`
      SELECT 
        u.*,
        sl.approval_status,
        sl.answers as survey_answers,
        fma.status as membership_application_status,
        fma.membership_ticket as membership_ticket,
        fma.submittedAt as membership_applied_at,
        fma.reviewedAt as membership_reviewed_at
      FROM users u
      LEFT JOIN surveylog sl ON u.id = sl.user_id
      LEFT JOIN full_membership_applications fma ON u.id = fma.user_id
      WHERE u.id = ?
      ORDER BY sl.createdAt DESC, fma.submittedAt DESC
      LIMIT 1
    `, [userId]);

    if (userResults.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const user = userResults[0];
    
    // Determine survey completion status
    const surveyCompleted = !!user.survey_answers;
    const needsSurvey = !surveyCompleted && !['granted', 'member'].includes(user.is_member);

    res.json({
      success: true,
      data: {
        survey_completed: surveyCompleted,
        needs_survey: needsSurvey,
        approval_status: user.approval_status || 'pending',
        survey_data: user.survey_answers ? JSON.parse(user.survey_answers) : null,
        // ✅ STANDARDIZED: Include membership application data
        membership_application_status: user.full_membership_status || 'not_applied',
        membership_ticket: user.membership_ticket,
        membership_applied_at: user.membership_applied_at,
        membership_reviewed_at: user.membership_reviewed_at,
        user_status: {
          membership_stage: user.membership_stage,
          is_member: user.is_member,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('❌ Error checking survey status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ STANDARDIZED: Reapplication endpoint
router.post('/reapply-full-membership', authenticate, async (req, res) => {
  try {
    const { answers, membershipTicket } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!answers || !membershipTicket) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: answers and membershipTicket are required' 
      });
    }

    // ✅ STANDARDIZED: Verify user can reapply
    const userCheck = await db.query(
      'SELECT membership_stage, is_member, full_membership_status FROM users WHERE id = ?',
      [userId]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const user = userCheck[0];
    
    // Check if user is eligible to reapply
    if (user.membership_stage !== 'pre_member' || user.full_membership_status !== 'declined') {
      return res.status(400).json({ 
        success: false,
        message: 'Only pre-members with declined applications can reapply',
        currentStatus: {
          membership_stage: user.membership_stage,
          full_membership_status: user.full_membership_status
        }
      });
    }

    // Begin transaction
    await db.beginTransaction();

    try {
      // Insert new application
      const insertResult = await db.query(`
        INSERT INTO full_membership_applications 
        (user_id, membership_ticket, answers, status, submittedAt, createdAt, updatedAt) 
        VALUES (?, ?, ?, 'pending', NOW(), NOW(), NOW())
      `, [userId, membershipTicket, JSON.stringify(answers)]);

      // Update user status
      await db.query(`
        UPDATE users 
        SET full_membership_status = 'pending',
            full_membership_applied_at = NOW(),
            full_membership_ticket = ?,
            updatedAt = NOW()
        WHERE id = ?
      `, [membershipTicket, userId]);

      // Log the reapplication
      await db.query(`
        INSERT INTO audit_logs (user_id, action, details, createdAt)
        VALUES (?, 'membership_reapplication_submitted', ?, NOW())
      `, [userId, JSON.stringify({ 
        ticket: membershipTicket, 
        applicationId: insertResult.insertId 
      })]);

      await db.commit();

      res.status(201).json({
        success: true,
        message: 'Membership reapplication submitted successfully',
        data: {
          applicationId: insertResult.insertId,
          membershipTicket: membershipTicket,
          status: 'pending'
        }
      });

    } catch (error) {
      await db.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error submitting membership reapplication:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit reapplication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===============================================
// EXISTING ROUTES - KEEPING ALL YOUR CURRENT FUNCTIONALITY
// ===============================================

// Development & Testing Routes
router.get('/test-simple', (req, res) => {
  res.json({
    success: true,
    message: 'Membership routes are working!',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

router.get('/test-auth', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication is working!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

router.get('/test-dashboard', authenticate, async (req, res) => {
  try {
    console.log('🧪 Test dashboard route called');
    console.log('🧪 User:', req.user);
    
    res.json({
      success: true,
      message: 'Test dashboard route working',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🧪 Test dashboard error:', error);
    res.status(500).json({ error: 'Test dashboard failed' });
  }
});

// Debug user lookup routes
router.get('/test-user-lookup/:userId', authenticate, requireAdmin, testUserLookup);
router.get('/test-user-lookup', authenticate, testUserLookup);

// Development admin setup (ONLY for development)
if (process.env.NODE_ENV === 'development') {
  router.post('/dev/setup-admin/:userId', authenticate, async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!['admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      console.log('🛠️ Setting up admin account for development...');
      
      await db.query(`
        UPDATE users 
        SET 
          membership_stage = 'member',
          is_member = 'member',
          updatedAt = NOW()
        WHERE id = ?
      `, [userId]);
      
      res.json({
        success: true,
        message: 'Admin account setup completed for development',
        userId: userId,
        newStatus: {
          membership_stage: 'member',
          is_member: 'member'
        }
      });
      
    } catch (error) {
      console.error('❌ Dev setup error:', error);
      res.status(500).json({ error: 'Failed to setup admin account' });
    }
  });

  router.get('/debug/status-consistency', authenticate, verifyApplicationStatusConsistency);
}

// Stage 1: Initial Application Endpoints (Keep existing)
router.get('/dashboard', authenticate, getUserDashboard);
router.get('/application-history', authenticate, getApplicationHistory);
router.get('/survey/check-status', authenticate, checkApplicationStatus);
router.post('/survey/submit-application', authenticate, submitInitialApplication);

// Application Management Routes (Keep existing)
router.put('/application/update-answers', authenticate, updateApplicationAnswers);
router.post('/application/withdraw', authenticate, withdrawApplication);
router.get('/application/requirements', authenticate, getApplicationRequirements);

// Admin endpoints for initial applications (Keep existing)
router.get('/admin/pending-applications', authenticate, requireAdmin, getPendingApplications);
router.put('/admin/update-user-status/:userId', authenticate, requireAdmin, updateApplicationStatus);
router.post('/admin/bulk-approve', authenticate, requireAdmin, bulkApproveApplications);

// Stage 2: Full Membership Endpoints (Keep existing)
router.get('/membership/full-membership-status', authenticate, getFullMembershipStatus);
router.post('/membership/log-full-membership-access', authenticate, logFullMembershipAccess);
router.post('/membership/submit-full-membership', authenticate, submitFullMembershipApplication);

// Admin endpoints for full membership (Keep existing)
router.get('/admin/pending-full-memberships', authenticate, requireAdmin, getPendingFullMemberships);
router.put('/admin/review-full-membership/:applicationId', authenticate, requireAdmin, updateFullMembershipStatus);

// Enhanced Admin Endpoints (Keep existing)
router.get('/admin/membership-overview', authenticate, requireAdmin, cacheMiddleware(600), getMembershipOverview);
router.get('/admin/membership-stats', authenticate, requireAdmin, cacheMiddleware(600), getMembershipStats);
router.get('/admin/analytics', authenticate, requireAdmin, cacheMiddleware(600), getMembershipAnalytics);

// Communication (Keep existing)
router.post('/admin/send-notification', authenticate, requireAdmin, sendNotification);
router.post('/admin/send-membership-notification', authenticate, requireAdmin, sendMembershipNotification);

// Data Export (Keep existing)
router.get('/admin/export-membership-data', authenticate, requireAdmin, exportMembershipData);

// Additional routes (Keep existing)
router.get('/status', authenticate, getCurrentMembershipStatus);
router.post('/approve/:userId', authenticate, requireAdmin, approvePreMemberApplication);
router.post('/decline/:userId', authenticate, requireAdmin, declinePreMemberApplication);
router.get('/admin/mentors', authenticate, requireAdmin, getAvailableMentors);
router.get('/admin/classes', authenticate, requireAdmin, getAvailableClasses);

// Alternative routes for compatibility (Keep all existing)
router.get('/history', authenticate, getApplicationHistory);
router.get('/permissions', authenticate, getUserPermissions);
router.get('/application/status', authenticate, checkApplicationStatus);
router.put('/application/answers', authenticate, updateApplicationAnswers);
router.delete('/application', authenticate, withdrawApplication);
router.get('/application/info', authenticate, getApplicationRequirements);
router.post('/application', authenticate, submitInitialApplication);
router.get('/full-membership/status', authenticate, getFullMembershipStatus);
router.post('/full-membership/apply', authenticate, submitFullMembershipApplication);
router.post('/full-membership/access', authenticate, logFullMembershipAccess);

// Admin routes (Keep all existing)
router.get('/admin/applications', authenticate, requireAdmin, getPendingApplications);
router.put('/admin/applications/:userId/status', authenticate, requireAdmin, updateApplicationStatus);
router.post('/admin/applications/bulk', authenticate, requireAdmin, bulkApproveApplications);
router.get('/admin/full-memberships', authenticate, requireAdmin, getPendingFullMemberships);
router.put('/admin/full-memberships/:applicationId/status', authenticate, requireAdmin, updateFullMembershipStatus);

// Analytics & Reporting (Keep existing)
router.get('/admin/overview', authenticate, requireAdmin, getMembershipOverview);
router.get('/admin/stats', authenticate, requireAdmin, getMembershipStats);
router.get('/admin/export', authenticate, requireAdmin, exportMembershipData);

// Notifications (Keep existing)
router.post('/admin/notifications/send', authenticate, requireAdmin, sendNotification);
router.post('/admin/notifications/membership', authenticate, requireAdmin, sendMembershipNotification);

// System routes (Keep existing)
router.get('/health', healthCheck);
router.get('/admin/config', authenticate, requireAdmin, getSystemConfig);

// Validation middleware examples (Keep existing)
router.post('/admin/notifications/validated-send', 
  authenticate, 
  requireAdmin,
  validateRequest(['recipients', 'subject', 'message']),
  sendNotification
);

router.post('/admin/applications/validated-bulk',
  authenticate,
  requireAdmin,
  validateRequest(['userIds', 'action']),
  bulkApproveApplications
);

router.put('/application/answers/validated',
  authenticate,
  validateRequest(['answers']),
  updateApplicationAnswers
);

router.post('/application/withdraw/validated',
  authenticate,
  validateRequest(['reason']),
  withdrawApplication
);

// Super admin routes (Keep existing)
router.get('/admin/super/config', authenticate, requireSuperAdmin, getSystemConfig);

router.post('/admin/super/emergency-reset/:userId',
  authenticate,
  requireSuperAdmin,
  (req, res) => {
    res.json({
      success: true,
      message: 'Emergency user reset functionality - implement as needed'
    });
  }
);

router.get('/admin/super/debug/user/:userId', authenticate, requireSuperAdmin, testUserLookup);
router.get('/admin/reports', authenticate, requireAdmin, getAllReports);

// ===============================================
// ENHANCED ERROR HANDLING & LOGGING
// ===============================================

// Log all routes in development
if (process.env.NODE_ENV === 'development') {
  console.log('🛣️ Membership routes loaded (STANDARDIZED):');
  console.log('   ✅ STANDARDIZED: Enhanced db.query() and camelCase timestamps');
  console.log('   ✅ STANDARDIZED: Improved error handling and transaction safety');
  console.log('   ✅ STANDARDIZED: Consistent response formats');
  console.log('   User: /dashboard, /application-history, /status, /history, /permissions');
  console.log('   Survey: /survey/check-status, /survey/submit-application');
  console.log('   Applications: /application/*, /full-membership/*');
  console.log('   Admin: /admin/pending-applications, /admin/applications/*');
  console.log('   Debug: /test-user-lookup, /test-user-lookup/:userId');
  console.log('   Test: /test-simple, /test-auth, /test-dashboard');
}

// Enhanced 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Membership route not found',
    path: req.path,
    method: req.method,
    note: 'This system uses standardized membership endpoints with enhanced error handling',
    suggestion: 'Check the available routes below or refer to API documentation',
    timestamp: new Date().toISOString()
  });
});

// Enhanced global error handler
router.use((error, req, res, next) => {
  console.error('❌ Membership route error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id || 'not authenticated',
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

export default router;







// // ikootaapi/routes/membershipRoutes.js - AUTH ENDPOINTS REMOVED
// import express from 'express';
// import { 
//   // ✅ REMOVED: Authentication endpoints moved to authRoutes
//   // sendVerificationCode,
//   // registerWithVerification,
//   // enhancedLogin,
  
//   // ✅ KEEP: Membership-specific endpoints
//   checkApplicationStatus,
//   submitInitialApplication,
//   submitFullMembershipApplication,
//   getFullMembershipStatus,
//   logFullMembershipAccess,
//   getPendingApplications,
//   updateApplicationStatus,
//   updateFullMembershipStatus,
//   sendNotification,
//   getPendingFullMemberships,
//   sendMembershipNotification,
//   getMembershipOverview,
//   getMembershipStats,
//   getUserDashboard,
//   getApplicationHistory,
//   bulkApproveApplications,
//   exportMembershipData,
//   getMembershipAnalytics,
//   getUserPermissions,
//   healthCheck,
//   getSystemConfig,
//   requireAdmin,
//   requireSuperAdmin,
//   validateRequest,
//   getAllReports,
//   // ✅ NEW: Missing function imports
//   updateApplicationAnswers,
//   withdrawApplication,
//   getApplicationRequirements,
//   getUserByIdFixed,
//   testUserLookup,
//    getCurrentMembershipStatus,
//   approvePreMemberApplication,
//   declinePreMemberApplication,
//   getAvailableMentors,
//   getAvailableClasses
// } from '../controllers/membershipControllers.js';
// import { verifyApplicationStatusConsistency } from '../controllers/membershipControllers_2.js';




// import { authenticate, cacheMiddleware } from '../middlewares/auth.middleware.js';
// import db from '../config/db.js';

// const router = express.Router();

// // ==================================================
// // DEVELOPMENT & TESTING ROUTES
// // ==================================================

// // Simple test route to verify routing works
// router.get('/test-simple', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Membership routes are working!',
//     timestamp: new Date().toISOString(),
//     path: req.path,
//     method: req.method
//   });
// });

// // Test route with authentication
// router.get('/test-auth', authenticate, (req, res) => {
//   res.json({
//     success: true,
//     message: 'Authentication is working!',
//     user: req.user,
//     timestamp: new Date().toISOString()
//   });
// });

// // Test the getUserDashboard function directly
// router.get('/test-dashboard', authenticate, async (req, res) => {
//   try {
//     console.log('🧪 Test dashboard route called');
//     console.log('🧪 User:', req.user);
    
//     res.json({
//       success: true,
//       message: 'Test dashboard route working',
//       user: req.user,
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error('🧪 Test dashboard error:', error);
//     res.status(500).json({ error: 'Test dashboard failed' });
//   }
// });

// // ✅ NEW: Debug user lookup routes
// router.get('/test-user-lookup/:userId', authenticate, requireAdmin, testUserLookup);
// router.get('/test-user-lookup', authenticate, testUserLookup);

// // Development admin setup (ONLY for development)
// if (process.env.NODE_ENV === 'development') {
//   router.post('/dev/setup-admin/:userId', authenticate, async (req, res) => {
//     try {
//       const { userId } = req.params;
      
//       if (req.user.role !== 'admin') {
//         return res.status(403).json({ error: 'Admin access required' });
//       }
      
//       console.log('🛠️ Setting up admin account for development...');
      
//       await db.query(`
//         UPDATE users 
//         SET 
//           membership_stage = 'member',
//           is_member = 'active',
//           updatedAt = NOW()
//         WHERE id = ?
//       `, [userId]);
      
//       await db.query(`
//         INSERT INTO surveylog (
//           user_id, 
//           answers, 
//           application_type, 
//           approval_status, 
//           admin_notes,
//           reviewed_by,
//           reviewed_at,
//           createdAt
//         ) VALUES (?, ?, 'initial_application', 'approved', 'Dev setup', ?, NOW(), NOW())
//         ON DUPLICATE KEY UPDATE
//           approval_status = 'approved',
//           admin_notes = 'Dev setup - updated'
//       `, [userId.toString(), JSON.stringify({dev: 'setup'}), userId]);
      
//       await db.query(`
//         INSERT INTO full_membership_access (
//           user_id, 
//           first_accessed_at, 
//           last_accessed_at, 
//           access_count
//         ) VALUES (?, NOW(), NOW(), 1)
//         ON DUPLICATE KEY UPDATE
//           last_accessed_at = NOW(),
//           access_count = access_count + 1
//       `, [userId]);
      
//       res.json({
//         success: true,
//         message: 'Admin account setup completed for development',
//         userId: userId,
//         newStatus: {
//           membership_stage: 'member',
//           is_member: 'active'
//         }
//       });
      
//     } catch (error) {
//       console.error('❌ Dev setup error:', error);
//       res.status(500).json({ error: 'Failed to setup admin account' });
//     }
//   });

//   // Add this debug route
//   router.get('/debug/status-consistency', authenticate, verifyApplicationStatusConsistency);

// }

// // ==================================================
// // ✅ REMOVED: AUTHENTICATION ENDPOINTS (Now in authRoutes.js)
// // ==================================================
// // These endpoints have been moved to /api/auth/
// // - POST /auth/send-verification -> moved to authRoutes.js
// // - POST /auth/register -> moved to authRoutes.js  
// // - POST /auth/login -> moved to authRoutes.js

// // ==================================================
// // STAGE 1: INITIAL APPLICATION ENDPOINTS
// // ==================================================

// // User Dashboard and Status
// router.get('/dashboard', authenticate, getUserDashboard);
// router.get('/application-history', authenticate, getApplicationHistory);

// // Initial Application Survey
// router.get('/survey/check-status', authenticate, checkApplicationStatus);
// router.post('/survey/submit-application', authenticate, submitInitialApplication);

// // ✅ NEW: Application Management Routes
// router.put('/application/update-answers', authenticate, updateApplicationAnswers);
// router.post('/application/withdraw', authenticate, withdrawApplication);
// router.get('/application/requirements', authenticate, getApplicationRequirements);

// // Admin endpoints for initial applications
// router.get('/admin/pending-applications', authenticate, requireAdmin, getPendingApplications);
// router.put('/admin/update-user-status/:userId', authenticate, requireAdmin, updateApplicationStatus);
// router.post('/admin/bulk-approve', authenticate, requireAdmin, bulkApproveApplications);

// // ==================================================
// // STAGE 2: FULL MEMBERSHIP ENDPOINTS
// // ==================================================

// // Full Membership Application
// router.get('/membership/full-membership-status', authenticate, getFullMembershipStatus);
// router.post('/membership/log-full-membership-access', authenticate, logFullMembershipAccess);
// router.post('/membership/submit-full-membership', authenticate, submitFullMembershipApplication);

// // Admin endpoints for full membership
// router.get('/admin/pending-full-memberships', authenticate, requireAdmin, getPendingFullMemberships);
// router.put('/admin/review-full-membership/:applicationId', authenticate, requireAdmin, updateFullMembershipStatus);

// // ==================================================
// // ENHANCED ADMIN ENDPOINTS
// // ==================================================

// // Analytics and Overview
// router.get('/admin/membership-overview', authenticate, requireAdmin, cacheMiddleware(600), getMembershipOverview);
// router.get('/admin/membership-stats', authenticate, requireAdmin, cacheMiddleware(600), getMembershipStats);
// router.get('/admin/analytics', authenticate, requireAdmin, cacheMiddleware(600), getMembershipAnalytics);

// // Communication
// router.post('/admin/send-notification', authenticate, requireAdmin, sendNotification);
// router.post('/admin/send-membership-notification', authenticate, requireAdmin, sendMembershipNotification);

// // Data Export
// router.get('/admin/export-membership-data', authenticate, requireAdmin, exportMembershipData);




// // Add these routes:
// router.get('/status', authenticate, getCurrentMembershipStatus);
// router.post('/approve/:userId', authenticate, requireAdmin, approvePreMemberApplication);
// router.post('/decline/:userId', authenticate, requireAdmin, declinePreMemberApplication);
// router.get('/admin/mentors', authenticate, requireAdmin, getAvailableMentors);
// router.get('/admin/classes', authenticate, requireAdmin, getAvailableClasses);
// // ==================================================
// // ALTERNATIVE ROUTES FOR COMPATIBILITY
// // ==================================================

// // User routes (require authentication) - MISSING ROUTES ADDED
// router.get('/status', authenticate, checkApplicationStatus);
// router.get('/history', authenticate, getApplicationHistory);
// router.get('/permissions', authenticate, getUserPermissions);

// // ✅ NEW: Additional application management routes
// router.get('/application/status', authenticate, checkApplicationStatus);
// router.put('/application/answers', authenticate, updateApplicationAnswers);
// router.delete('/application', authenticate, withdrawApplication);
// router.get('/application/info', authenticate, getApplicationRequirements);

// // Application routes - MISSING ROUTES ADDED
// router.post('/application', authenticate, submitInitialApplication);
// router.get('/full-membership/status', authenticate, getFullMembershipStatus);
// router.post('/full-membership/apply', authenticate, submitFullMembershipApplication);
// router.post('/full-membership/access', authenticate, logFullMembershipAccess);

// // Admin routes (require admin privileges) - MISSING ROUTES ADDED
// router.get('/admin/applications', 
//   authenticate, 
//   requireAdmin, 
//   getPendingApplications        
// );

// router.put('/admin/applications/:userId/status', 
//   authenticate, 
//   requireAdmin, 
//   updateApplicationStatus
// );

// router.post('/admin/applications/bulk', 
//   authenticate, 
//   requireAdmin, 
//   bulkApproveApplications
// );

// router.get('/admin/full-memberships', 
//   authenticate, 
//   requireAdmin, 
//   getPendingFullMemberships
// );

// router.put('/admin/full-memberships/:applicationId/status', 
//   authenticate, 
//   requireAdmin, 
//   updateFullMembershipStatus
// );

// // Analytics & Reporting (Admin only) - MISSING ROUTES ADDED
// router.get('/admin/overview', 
//   authenticate, 
//   requireAdmin, 
//   getMembershipOverview
// );

// router.get('/admin/stats', 
//   authenticate, 
//   requireAdmin, 
//   getMembershipStats
// );

// router.get('/admin/export', 
//   authenticate, 
//   requireAdmin, 
//   exportMembershipData
// );

// // Notifications (Admin only) - MISSING ROUTES ADDED
// router.post('/admin/notifications/send', 
//   authenticate, 
//   requireAdmin, 
//   sendNotification
// );

// router.post('/admin/notifications/membership', 
//   authenticate, 
//   requireAdmin, 
//   sendMembershipNotification
// );

// // System routes - MISSING ROUTES ADDED
// router.get('/health', healthCheck);
// router.get('/admin/config', 
//   authenticate, 
//   requireAdmin, 
//   getSystemConfig
// );

// // ==================================================
// // VALIDATION MIDDLEWARE EXAMPLES
// // ==================================================

// // Example routes with validation middleware
// router.post('/admin/notifications/validated-send', 
//   authenticate, 
//   requireAdmin,
//   validateRequest(['recipients', 'subject', 'message']),
//   sendNotification
// );

// router.post('/admin/applications/validated-bulk',
//   authenticate,
//   requireAdmin,
//   validateRequest(['userIds', 'action']),
//   bulkApproveApplications
// );

// // ✅ NEW: Application management with validation
// router.put('/application/answers/validated',
//   authenticate,
//   validateRequest(['answers']),
//   updateApplicationAnswers
// );

// router.post('/application/withdraw/validated',
//   authenticate,
//   validateRequest(['reason']),
//   withdrawApplication
// );

// // ==================================================
// // SUPER ADMIN ROUTES
// // ==================================================

// // Super admin only routes
// router.get('/admin/super/config', 
//   authenticate, 
//   requireSuperAdmin, 
//   getSystemConfig
// );

// router.post('/admin/super/emergency-reset/:userId',
//   authenticate,
//   requireSuperAdmin,
//   (req, res) => {
//     // Emergency user reset functionality
//     res.json({
//       success: true,
//       message: 'Emergency user reset functionality - implement as needed'
//     });
//   }
// );

// // ✅ NEW: Super admin debug routes
// router.get('/admin/super/debug/user/:userId',
//   authenticate,
//   requireSuperAdmin,
//   testUserLookup
// );

// router.get('/admin/reports', 
//   authenticate, 
//   requireAdmin, 
//   getAllReports
// );

// // ==================================================
// // ERROR HANDLING & LOGGING
// // ==================================================

// // Log all routes in development
// if (process.env.NODE_ENV === 'development') {
//   console.log('🛣️ Membership routes loaded:');
//   console.log('   ❌ REMOVED Auth: /auth/login, /auth/send-verification, /auth/register -> Now in authRoutes.js');
//   console.log('   User: /dashboard, /application-history, /status, /history, /permissions');
//   console.log('   Survey: /survey/check-status, /survey/submit-application');
//   console.log('   ✅ NEW Applications: /application/*, /application/update-answers, /application/withdraw');
//   console.log('   Applications: /application, /full-membership/*');
//   console.log('   Full Membership: /membership/full-membership-status, /membership/log-full-membership-access');
//   console.log('   Admin Applications: /admin/pending-applications, /admin/applications/*');
//   console.log('   Admin Full Membership: /admin/pending-full-memberships, /admin/full-memberships/*');
//   console.log('   Admin Analytics: /admin/membership-overview, /admin/analytics, /admin/overview');
//   console.log('   Admin Communication: /admin/send-notification, /admin/notifications/*');
//   console.log('   System: /health, /admin/config');
//   console.log('   ✅ NEW Debug: /test-user-lookup, /test-user-lookup/:userId');
//   console.log('   Test: /test-simple, /test-auth, /test-dashboard');
//   console.log('   Dev: /dev/setup-admin/:userId');
// }

// // 404 handler for unmatched routes
// router.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: 'Membership route not found',
//     path: req.path,
//     method: req.method,
//     note: 'Authentication endpoints have been moved to /api/auth/',
//     availableRoutes: {
//       authentication_moved: [
//         'POST /api/auth/send-verification (MOVED from here)',
//         'POST /api/auth/register (MOVED from here)', 
//         'POST /api/auth/login (MOVED from here)'
//       ],
//       user: [
//         'GET /dashboard',
//         'GET /application-history',
//         'GET /status',
//         'GET /history',
//         'GET /permissions'
//       ],
//       survey: [
//         'GET /survey/check-status',
//         'POST /survey/submit-application'
//       ],
//       applications: [
//         'POST /application',
//         'GET /application/status',
//         'PUT /application/update-answers',
//         'PUT /application/answers',
//         'POST /application/withdraw',
//         'DELETE /application',
//         'GET /application/requirements',
//         'GET /application/info',
//         'GET /full-membership/status',
//         'POST /full-membership/apply',
//         'POST /full-membership/access'
//       ],
//       fullMembership: [
//         'GET /membership/full-membership-status',
//         'POST /membership/log-full-membership-access',
//         'POST /membership/submit-full-membership'
//       ],
//       admin: [
//         'GET /admin/pending-applications',
//         'PUT /admin/update-user-status/:userId',
//         'POST /admin/bulk-approve',
//         'GET /admin/applications',
//         'PUT /admin/applications/:userId/status',
//         'POST /admin/applications/bulk',
//         'GET /admin/pending-full-memberships',
//         'PUT /admin/review-full-membership/:applicationId',
//         'GET /admin/full-memberships',
//         'PUT /admin/full-memberships/:applicationId/status'
//       ],
//       analytics: [
//         'GET /admin/membership-overview',
//         'GET /admin/membership-stats',
//         'GET /admin/analytics',
//         'GET /admin/overview',
//         'GET /admin/stats',
//         'GET /admin/export',
//         'GET /admin/export-membership-data'
//       ],
//       notifications: [
//         'POST /admin/send-notification',
//         'POST /admin/send-membership-notification',
//         'POST /admin/notifications/send',
//         'POST /admin/notifications/membership'
//       ],
//       system: [
//         'GET /health',
//         'GET /admin/config'
//       ],
//       debug: [
//         'GET /test-user-lookup',
//         'GET /test-user-lookup/:userId',
//         'GET /admin/super/debug/user/:userId'
//       ],
//       development: [
//         'GET /test-simple',
//         'GET /test-auth',
//         'GET /test-dashboard',
//         'POST /dev/setup-admin/:userId'
//       ]
//     }
//   });
// });

// // Global error handler for this router
// router.use((error, req, res, next) => {
//   console.error('Membership route error:', error);
  
//   res.status(error.statusCode || 500).json({
//     success: false,
//     error: error.message || 'Internal server error',
//     path: req.path,
//     method: req.method,
//     timestamp: new Date().toISOString()
//   });
// });

// export default router;

