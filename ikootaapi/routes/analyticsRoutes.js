// ikootaapi/routes/analyticsRoutes.js
// ===============================================
// ANALYTICS AND REPORTING ROUTES
// Handles all analytics, statistics, and data export routes
// ===============================================

import express from 'express';
import { authenticate, cacheMiddleware } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../controllers/membershipControllers_1.OLD.js/index.js';
import {
  getMembershipAnalytics,
  getMembershipOverview,
  getMembershipStats,
  exportMembershipData
} from '../controllers/analyticsController.js';

const router = express.Router();

// ===============================================
// ANALYTICS & REPORTING ROUTES
// All routes require admin authentication and use caching
// ===============================================

// Main analytics endpoints
router.get('/admin/membership-overview', 
  authenticate, 
  requireAdmin, 
  cacheMiddleware(600), 
  getMembershipOverview
);

router.get('/admin/overview', 
  authenticate, 
  requireAdmin, 
  getMembershipOverview
);

router.get('/admin/applications-overview', 
  authenticate, 
  requireAdmin, 
  getMembershipOverview
);

router.get('/admin/membership-stats', 
  authenticate, 
  requireAdmin, 
  cacheMiddleware(600), 
  getMembershipStats
);

router.get('/admin/stats', 
  authenticate, 
  requireAdmin, 
  getMembershipStats
);

router.get('/admin/analytics', 
  authenticate, 
  requireAdmin, 
  cacheMiddleware(600), 
  getMembershipAnalytics
);

router.get('/admin/membership-analytics', 
  authenticate, 
  requireAdmin, 
  getMembershipAnalytics
);

// Data export routes
router.get('/admin/export-membership-data', 
  authenticate, 
  requireAdmin, 
  exportMembershipData
);

router.get('/admin/export', 
  authenticate, 
  requireAdmin, 
  exportMembershipData
);

export default router;