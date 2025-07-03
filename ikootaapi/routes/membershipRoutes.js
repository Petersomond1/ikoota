// ikootaapi/routes/membershipRoutes.js
import express from 'express';
import { 
  sendVerificationCode,
  registerWithVerification,
  enhancedLogin,
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
  getMembershipAnalytics
} from '../controllers/membershipControllers.js';
import { authenticate, requireAdmin, cacheMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ==================================================
// STAGE 1: INITIAL APPLICATION ENDPOINTS
// ==================================================

// Verification and Registration
router.post('/auth/send-verification', sendVerificationCode);
router.post('/auth/register', registerWithVerification);
router.post('/auth/login', enhancedLogin);

// User Dashboard and Status
router.get('/dashboard', authenticate, getUserDashboard);
router.get('/application-history', authenticate, getApplicationHistory);

// Initial Application Survey
router.get('/survey/check-status', authenticate, checkApplicationStatus);
router.post('/survey/submit-application', authenticate, submitInitialApplication);

// Admin endpoints for initial applications
router.get('/admin/pending-applications', authenticate, requireAdmin, getPendingApplications);
router.put('/admin/update-user-status/:userId', authenticate, requireAdmin, updateApplicationStatus);
router.post('/admin/bulk-approve', authenticate, requireAdmin, bulkApproveApplications);

// ==================================================
// STAGE 2: FULL MEMBERSHIP ENDPOINTS
// ==================================================

// Full Membership Application
router.get('/membership/full-membership-status', authenticate, getFullMembershipStatus);
router.post('/membership/log-full-membership-access', authenticate, logFullMembershipAccess);
router.post('/membership/submit-full-membership', authenticate, submitFullMembershipApplication);

// Admin endpoints for full membership
router.get('/admin/pending-full-memberships', authenticate, requireAdmin, getPendingFullMemberships);
router.put('/admin/review-full-membership/:applicationId', authenticate, requireAdmin, updateFullMembershipStatus);

// ==================================================
// ENHANCED ADMIN ENDPOINTS
// ==================================================

// Analytics and Overview
router.get('/admin/membership-overview', authenticate, requireAdmin, cacheMiddleware(600), getMembershipOverview);
router.get('/admin/membership-stats', authenticate, requireAdmin, cacheMiddleware(600), getMembershipStats);
router.get('/admin/analytics', authenticate, requireAdmin, cacheMiddleware(600), getMembershipAnalytics);

// Communication
router.post('/admin/send-notification', authenticate, requireAdmin, sendNotification);
router.post('/admin/send-membership-notification', authenticate, requireAdmin, sendMembershipNotification);

// Data Export
router.get('/admin/export-membership-data', authenticate, requireAdmin, exportMembershipData);

export default router;