// ikootaapi/routes/fullMembershipRoutes.js
// ===============================================
// FULL MEMBERSHIP ROUTES
// Handles all full membership application routes
// Enhanced with comprehensive middleware protection
// ===============================================

import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

// Import new membership-specific middleware
import { 
  canApplyForMembership, 
  validateMembershipApplication,
  rateLimitApplications,
  logMembershipAction,
  requirePreMemberOrHigher
} from '../middlewares/membershipMiddleware.js';

// Import controllers
import {
  getFullMembershipStatusById,
  submitFullMembershipApplication,
  reapplyFullMembership,
  logFullMembershipAccess
} from '../controllers/fullMembershipController.js';

// Import existing controller functions we're keeping
import { getFullMembershipStatus } from '../controllers/membershipControllers_2.OLD.js/index.js';

const router = express.Router();

// ===============================================
// MIDDLEWARE CHAINS FOR REUSE
// ===============================================

// Basic protected route (authenticated + logging)
const basicProtected = [
  authenticate,
  logMembershipAction('access_membership_content')
];

// Status check route (authenticated + pre-member access + logging)
const statusCheck = [
  authenticate,
  requirePreMemberOrHigher,
  logMembershipAction('check_membership_status')
];

// Application submission (full protection)
const applicationSubmission = [
  authenticate,
  rateLimitApplications,           // Prevent spam
  canApplyForMembership,           // Check eligibility
  validateMembershipApplication,   // Validate input
  logMembershipAction('submit_membership_application')
];

// Reapplication (similar to submission but different logging)
const reapplication = [
  authenticate,
  rateLimitApplications,
  canApplyForMembership,
  validateMembershipApplication,
  logMembershipAction('reapply_membership_application')
];

// ===============================================
// FULL MEMBERSHIP STATUS ROUTES
// ===============================================

// Get full membership status - Multiple endpoints for compatibility
router.get('/full-membership-status/:userId', 
  ...statusCheck, 
  getFullMembershipStatusById
);

router.get('/full-membership-status', 
  ...statusCheck, 
  getFullMembershipStatus
);

router.get('/membership/full-membership-status', 
  ...statusCheck, 
  getFullMembershipStatus
);

router.get('/full-membership/status', 
  ...statusCheck, 
  getFullMembershipStatus
);

// ===============================================
// FULL MEMBERSHIP APPLICATION ROUTES
// ===============================================

// Submit full membership application - Primary endpoint with full protection
router.post('/submit-full-membership', 
  ...applicationSubmission,
  submitFullMembershipApplication
);

// Alternative submission endpoints (for backward compatibility)
router.post('/membership/submit-full-membership', 
  ...applicationSubmission,
  submitFullMembershipApplication
);

router.post('/full-membership/apply', 
  ...applicationSubmission,
  submitFullMembershipApplication
);

router.post('/submit-full-membership-application', 
  ...applicationSubmission,
  submitFullMembershipApplication
);

// Reapplication for declined applications
router.post('/reapply-full-membership', 
  ...reapplication,
  reapplyFullMembership
);

// ===============================================
// ACCESS LOGGING ROUTES
// ===============================================

// Log full membership access - Protected but less restrictive
router.post('/membership/log-full-membership-access', 
  ...basicProtected,
  logFullMembershipAccess
);

router.post('/full-membership/access', 
  ...basicProtected,
  logFullMembershipAccess
);

// ===============================================
// ROUTE-SPECIFIC ENHANCEMENTS
// ===============================================

// Enhanced status endpoint with detailed logging
router.get('/full-membership/detailed-status', 
  authenticate,
  requirePreMemberOrHigher,
  logMembershipAction('check_detailed_membership_status'),
  getFullMembershipStatus
);

// Quick status check (minimal logging for frequent calls)
router.get('/full-membership/quick-status', 
  authenticate,
  getFullMembershipStatus
);

export default router;






// // ikootaapi/routes/fullMembershipRoutes.js
// // ===============================================
// // FULL MEMBERSHIP ROUTES
// // Handles all full membership application routes
// // ===============================================

// import express from 'express';
// import { authenticate } from '../middlewares/auth.middleware.js';
// import {
//   getFullMembershipStatusById,
//   submitFullMembershipApplication,
//   reapplyFullMembership,
//   logFullMembershipAccess
// } from '../controllers/fullMembershipController.js';

// // Import existing controller functions we're keeping
// import { getFullMembershipStatus } from '../controllers/membershipControllers_2.OLD.js/index.js';

// const router = express.Router();

// // ===============================================
// // FULL MEMBERSHIP STATUS ROUTES
// // ===============================================

// // Get full membership status - Multiple endpoints for compatibility
// router.get('/full-membership-status/:userId', authenticate, getFullMembershipStatusById);
// router.get('/full-membership-status', authenticate, getFullMembershipStatus);
// router.get('/membership/full-membership-status', authenticate, getFullMembershipStatus);
// router.get('/full-membership/status', authenticate, getFullMembershipStatus);

// // ===============================================
// // FULL MEMBERSHIP APPLICATION ROUTES
// // ===============================================

// // Submit full membership application
// router.post('/submit-full-membership', authenticate, submitFullMembershipApplication);
// router.post('/membership/submit-full-membership', authenticate, submitFullMembershipApplication);
// router.post('/full-membership/apply', authenticate, submitFullMembershipApplication);
// router.post('/submit-full-membership-application', authenticate, submitFullMembershipApplication);

// // Reapplication for declined applications
// router.post('/reapply-full-membership', authenticate, reapplyFullMembership);

// // Log full membership access
// router.post('/membership/log-full-membership-access', authenticate, logFullMembershipAccess);
// router.post('/full-membership/access', authenticate, logFullMembershipAccess);

// export default router;