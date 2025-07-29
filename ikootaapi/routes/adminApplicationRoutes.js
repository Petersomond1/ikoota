// adminApplicationRoutes.js
// ===============================================

import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

// 🔄 ADD: Import new membership middleware
import { 
  canReviewApplications,
  validateApplicationReview,
  logMembershipAction 
} from '../middlewares/membershipMiddleware.js';

// Import existing middleware
import { 
  requireAdmin, 
  requireSuperAdmin 
} from '../controllers/membershipControllers_1.OLD.js/index.js';

// Import updated controllers
import {
  getAllPendingMembershipApplications,
  reviewMembershipApplication,
  setupDevAdmin,
  getSystemConfig,
  emergencyUserReset,
  getApplicationStats
} from '../controllers/adminApplicationController.js';

// Import existing controller functions we're keeping
import {
  getPendingApplications,
  updateApplicationStatus,
  bulkApproveApplications,
  getPendingFullMemberships,
  updateFullMembershipStatus,
  getAllReports,
  approvePreMemberApplication,
  declinePreMemberApplication,
  getAvailableMentors,
  getAvailableClasses,
  testUserLookup
} from '../controllers/membershipControllers.OLD.js';

import { verifyApplicationStatusConsistency } from '../controllers/membershipControllers_2.OLD.js/index.js';

const router = express.Router();

// ===============================================
// ENHANCED ADMIN APPLICATION MANAGEMENT ROUTES
// ===============================================

// 🔄 ENHANCED: Get pending applications with middleware protection
router.get('/admin/pending-applications',
  authenticate,
  canReviewApplications,
  logMembershipAction('view_pending_applications'),
  getAllPendingMembershipApplications
);

router.get('/admin/applications',
  authenticate,
  canReviewApplications,
  logMembershipAction('view_applications'),
  getAllPendingMembershipApplications
);

// 🔄 ENHANCED: Admin endpoint to get all pending membership applications
router.get('/admin/membership/applications',
  authenticate,
  canReviewApplications,
  logMembershipAction('view_membership_applications'),
  getAllPendingMembershipApplications
);

// 🔄 ENHANCED: Review full membership applications with validation
router.put('/admin/membership/review/:applicationId',
  authenticate,
  canReviewApplications,
  validateApplicationReview,
  logMembershipAction('review_membership_application'),
  reviewMembershipApplication
);

// 🔄 ENHANCED: Application statistics with access control
router.get('/admin/applications/stats',
  authenticate,
  canReviewApplications,
  logMembershipAction('view_application_stats'),
  getApplicationStats
);

// ===============================================
// EXISTING ROUTES WITH BASIC PROTECTION
// ===============================================

// System configuration (Admin only)
router.get('/admin/config', authenticate, requireAdmin, getSystemConfig);
router.get('/admin/super/config', authenticate, requireSuperAdmin, getSystemConfig);

// Legacy routes (keep existing middleware for now)
router.put('/admin/update-user-status/:userId', authenticate, requireAdmin, updateApplicationStatus);
router.put('/admin/applications/:userId/status', authenticate, requireAdmin, updateApplicationStatus);

// Bulk operations
router.post('/admin/bulk-approve', authenticate, requireAdmin, bulkApproveApplications);
router.post('/admin/applications/bulk', authenticate, requireAdmin, bulkApproveApplications);

// Pre-member specific approval/decline
router.post('/approve/:userId', authenticate, requireAdmin, approvePreMemberApplication);
router.post('/decline/:userId', authenticate, requireAdmin, declinePreMemberApplication);

// Get pending full memberships
router.get('/admin/pending-full-memberships', authenticate, requireAdmin, getPendingFullMemberships);
router.get('/admin/full-memberships', authenticate, requireAdmin, getPendingFullMemberships);

// Review full membership applications (legacy)
router.put('/admin/review-full-membership/:applicationId', authenticate, requireAdmin, updateFullMembershipStatus);
router.put('/admin/full-memberships/:applicationId/status', authenticate, requireAdmin, updateFullMembershipStatus);

// Get available mentors and classes
router.get('/admin/mentors', authenticate, requireAdmin, getAvailableMentors);
router.get('/admin/classes', authenticate, requireAdmin, getAvailableClasses);

// Reports and admin data
router.get('/admin/reports', authenticate, requireAdmin, getAllReports);

// Debug user lookup routes
router.get('/test-user-lookup/:userId', authenticate, requireAdmin, testUserLookup);
router.get('/test-user-lookup', authenticate, testUserLookup);

// ===============================================
// SUPER ADMIN ROUTES
// ===============================================

router.post('/admin/super/emergency-reset/:userId',
  authenticate,
  requireSuperAdmin,
  emergencyUserReset
);

router.get('/admin/super/debug/user/:userId', authenticate, requireSuperAdmin, testUserLookup);

// ===============================================
// DEVELOPMENT ROUTES
// ===============================================

if (process.env.NODE_ENV === 'development') {
  router.post('/dev/setup-admin/:userId', authenticate, setupDevAdmin);
  router.get('/debug/status-consistency', authenticate, verifyApplicationStatusConsistency);
}

export default router;





// // ikootaapi/routes/adminApplicationRoutes.js
// // ===============================================
// // ADMIN APPLICATION MANAGEMENT ROUTES
// // Handles admin review and management routes
// // ===============================================

// import express from 'express';
// import { authenticate } from '../middlewares/auth.middleware.js';
// import { 
//   requireAdmin, 
//   requireSuperAdmin 
// } from '../controllers/membershipControllers_1.OLD.js/index.js';

// import {
//   getAllPendingMembershipApplications,
//   reviewMembershipApplication,
//   setupDevAdmin,
//   getSystemConfig,
//   emergencyUserReset
// } from '../controllers/adminApplicationController.js';

// // Import existing controller functions we're keeping
// import {
//   getPendingApplications,
//   updateApplicationStatus,
//   bulkApproveApplications,
//   getPendingFullMemberships,
//   updateFullMembershipStatus,
//   getAllReports,
//   approvePreMemberApplication,
//   declinePreMemberApplication,
//   getAvailableMentors,
//   getAvailableClasses,
//   testUserLookup
// } from '../controllers/membershipControllers.OLD.js';

// import { verifyApplicationStatusConsistency } from '../controllers/membershipControllers_2.OLD.js/index.js';

// const router = express.Router();

// // ===============================================
// // SYSTEM CONFIGURATION ROUTES
// // ===============================================

// // System configuration (Admin only)
// router.get('/admin/config', authenticate, requireAdmin, getSystemConfig);

// // Super admin configuration
// router.get('/admin/super/config', authenticate, requireSuperAdmin, getSystemConfig);

// // ===============================================
// // ADMIN APPLICATION MANAGEMENT ROUTES
// // ===============================================

// // Get pending applications
// router.get('/admin/pending-applications', authenticate, requireAdmin, getPendingApplications);
// router.get('/admin/applications', authenticate, requireAdmin, getPendingApplications);

// // Admin endpoint to get all pending membership applications
// router.get('/admin/membership/applications', authenticate, requireAdmin, getAllPendingMembershipApplications);

// // Update application status
// router.put('/admin/update-user-status/:userId', authenticate, requireAdmin, updateApplicationStatus);
// router.put('/admin/applications/:userId/status', authenticate, requireAdmin, updateApplicationStatus);

// // Bulk operations
// router.post('/admin/bulk-approve', authenticate, requireAdmin, bulkApproveApplications);
// router.post('/admin/applications/bulk', authenticate, requireAdmin, bulkApproveApplications);

// // Pre-member specific approval/decline
// router.post('/approve/:userId', authenticate, requireAdmin, approvePreMemberApplication);
// router.post('/decline/:userId', authenticate, requireAdmin, declinePreMemberApplication);

// // ===============================================
// // ADMIN FULL MEMBERSHIP MANAGEMENT
// // ===============================================

// // Get pending full memberships
// router.get('/admin/pending-full-memberships', authenticate, requireAdmin, getPendingFullMemberships);
// router.get('/admin/full-memberships', authenticate, requireAdmin, getPendingFullMemberships);

// // Review full membership applications
// router.put('/admin/review-full-membership/:applicationId', authenticate, requireAdmin, updateFullMembershipStatus);
// router.put('/admin/full-memberships/:applicationId/status', authenticate, requireAdmin, updateFullMembershipStatus);

// // Admin review endpoint with proper transaction safety
// router.put('/admin/membership/review/:applicationId', authenticate, requireAdmin, reviewMembershipApplication);

// // ===============================================
// // ADMIN RESOURCES & UTILITIES
// // ===============================================

// // Get available mentors and classes
// router.get('/admin/mentors', authenticate, requireAdmin, getAvailableMentors);
// router.get('/admin/classes', authenticate, requireAdmin, getAvailableClasses);

// // Reports and admin data
// router.get('/admin/reports', authenticate, requireAdmin, getAllReports);

// // Debug user lookup routes
// router.get('/test-user-lookup/:userId', authenticate, requireAdmin, testUserLookup);
// router.get('/test-user-lookup', authenticate, testUserLookup);

// // ===============================================
// // SUPER ADMIN ROUTES
// // ===============================================

// router.post('/admin/super/emergency-reset/:userId',
//   authenticate,
//   requireSuperAdmin,
//   emergencyUserReset
// );

// router.get('/admin/super/debug/user/:userId', authenticate, requireSuperAdmin, testUserLookup);

// // ===============================================
// // DEVELOPMENT ROUTES (Only in development environment)
// // ===============================================

// if (process.env.NODE_ENV === 'development') {
//   router.post('/dev/setup-admin/:userId', authenticate, setupDevAdmin);
//   router.get('/debug/status-consistency', authenticate, verifyApplicationStatusConsistency);
// }

// export default router;