// ikootaapi/routes/membershipAdminRoutes.js
// ADMIN MEMBERSHIP MANAGEMENT ROUTES
// Administrative review and management of membership applications

import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

// Import membership middleware
import { 
  canReviewApplications,
  validateApplicationReview,
  logMembershipAction 
} from '../middlewares/membershipMiddleware.js';

// Import admin controllers
import {
  // Application review functions
  getAllPendingMembershipApplications,
  reviewMembershipApplication,
  getApplicationStats,
  bulkReviewApplications,
  
  // Full membership management
  getPendingFullMemberships,
  reviewFullMembershipApplication,
  getFullMembershipStats,
  
  // Analytics and reporting
  getMembershipOverview,
  getMembershipAnalytics,
  exportMembershipData,
  
  // System management
  getSystemConfig,
  updateSystemConfig
} from '../controllers/membershipAdminControllers.js';

const router = express.Router();

// ===============================================
// APPLY ADMIN AUTHENTICATION TO ALL ROUTES
// ===============================================
router.use(authenticate);
router.use(authorize(['admin', 'super_admin']));

// ===============================================
// CONNECTIVITY & STATUS
// ===============================================

// Admin membership test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin membership routes are working!',
    timestamp: new Date().toISOString(),
    user: {
      id: req.user?.id,
      username: req.user?.username,
      role: req.user?.role
    },
    availableEndpoints: {
      applications: 'GET /applications?status=pending',
      stats: 'GET /full-membership-stats',
      pendingCount: 'GET /pending-count',
      review: 'PUT /applications/:id/review'
    }
  });
});

// ===============================================
// APPLICATION MANAGEMENT
// ===============================================

// Get applications with filtering
router.get('/applications', 
  canReviewApplications,
  logMembershipAction('view_applications'),
  getAllPendingMembershipApplications
);

// Get specific application details
router.get('/applications/:id',
  canReviewApplications,
  logMembershipAction('view_application_details'),
  (req, res, next) => {
    req.applicationId = req.params.id;
    getAllPendingMembershipApplications(req, res, next);
  }
);

// Review application
router.put('/applications/:id/review',
  canReviewApplications,
  validateApplicationReview,
  logMembershipAction('review_application'),
  reviewMembershipApplication
);

// Bulk application actions
router.post('/applications/bulk-review',
  canReviewApplications,
  logMembershipAction('bulk_review_applications'),
  bulkReviewApplications
);

// Legacy compatibility
router.post('/bulk-approve', 
  canReviewApplications,
  logMembershipAction('bulk_approve_applications'),
  bulkReviewApplications
);

// ===============================================
// STATISTICS & ANALYTICS
// ===============================================

// Application statistics
router.get('/stats',
  canReviewApplications,
  logMembershipAction('view_membership_stats'),
  getApplicationStats
);

// Full membership statistics
router.get('/full-membership-stats',
  canReviewApplications,
  logMembershipAction('view_full_membership_stats'),
  getFullMembershipStats
);

// Pending count
router.get('/pending-count',
  canReviewApplications,
  logMembershipAction('view_pending_count'),
  (req, res, next) => {
    req.query.status = 'pending';
    getApplicationStats(req, res, next);
  }
);

// Comprehensive analytics
router.get('/analytics',
  canReviewApplications,
  logMembershipAction('view_membership_analytics'),
  getMembershipAnalytics
);

// Membership overview dashboard
router.get('/overview',
  canReviewApplications,
  logMembershipAction('view_membership_overview'),
  getMembershipOverview
);

// ===============================================
// FULL MEMBERSHIP MANAGEMENT
// ===============================================

// Get pending full membership applications
router.get('/full-membership/pending',
  canReviewApplications,
  logMembershipAction('view_pending_full_memberships'),
  getPendingFullMemberships
);

// Review full membership application
router.put('/full-membership/:id/review',
  canReviewApplications,
  validateApplicationReview,
  logMembershipAction('review_full_membership'),
  reviewFullMembershipApplication
);

// ===============================================
// DATA EXPORT & REPORTING
// ===============================================

// Export membership data
router.get('/export',
  authorize(['super_admin']), // Restrict to super admin
  logMembershipAction('export_membership_data'),
  exportMembershipData
);

// Export applications
router.get('/export/applications',
  authorize(['super_admin']),
  logMembershipAction('export_applications'),
  (req, res, next) => {
    req.exportType = 'applications';
    exportMembershipData(req, res, next);
  }
);

// Export statistics
router.get('/export/stats',
  authorize(['super_admin']),
  logMembershipAction('export_statistics'),
  (req, res, next) => {
    req.exportType = 'statistics';
    exportMembershipData(req, res, next);
  }
);

// ===============================================
// SYSTEM CONFIGURATION
// ===============================================

// Get system configuration
router.get('/config',
  authorize(['super_admin']),
  logMembershipAction('view_system_config'),
  getSystemConfig
);

// Update system configuration
router.put('/config',
  authorize(['super_admin']),
  logMembershipAction('update_system_config'),
  updateSystemConfig
);

// ===============================================
// LEGACY COMPATIBILITY ENDPOINTS
// ===============================================

// Support existing frontend calls
router.get('/admin/membership-overview', getMembershipOverview);
router.get('/admin/pending-applications', getAllPendingMembershipApplications);
router.get('/admin/membership-stats', getFullMembershipStats);
router.get('/admin/analytics', getMembershipAnalytics);
router.post('/admin/bulk-approve', bulkReviewApplications);
router.put('/admin/update-user-status/:userId', reviewMembershipApplication);

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Admin membership route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      applications: [
        'GET /applications?status=pending - Get applications by status',
        'GET /applications/:id - Get specific application',
        'PUT /applications/:id/review - Review application',
        'POST /applications/bulk-review - Bulk review applications'
      ],
      statistics: [
        'GET /stats - Application statistics',
        'GET /full-membership-stats - Full membership statistics',
        'GET /pending-count - Count of pending applications',
        'GET /analytics - Comprehensive analytics',
        'GET /overview - Membership overview dashboard'
      ],
      fullMembership: [
        'GET /full-membership/pending - Pending full memberships',
        'PUT /full-membership/:id/review - Review full membership'
      ],
      dataExport: [
        'GET /export - Export all membership data (super admin)',
        'GET /export/applications - Export applications (super admin)',
        'GET /export/stats - Export statistics (super admin)'
      ],
      system: [
        'GET /config - Get system configuration (super admin)',
        'PUT /config - Update system configuration (super admin)',
        'GET /test - Connectivity test'
      ]
    },
    adminNote: 'All routes require admin or super_admin role',
    timestamp: new Date().toISOString()
  });
});

// Error handler
router.use((error, req, res, next) => {
  console.error('❌ Admin membership route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.username || 'unauthenticated',
    userRole: req.user?.role,
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Admin membership operation error',
    path: req.path,
    method: req.method,
    userRole: req.user?.role,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('🔐 Admin membership routes loaded: application review, analytics, full membership management');
}

export default router;