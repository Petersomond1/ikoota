// ikootaapi/controllers/membershipControllers.js
// ==================================================
// MAIN MEMBERSHIP CONTROLLERS - UNIFIED EXPORTS
// ==================================================

// Import all functions from the three modular files
import {
  // Utility functions
  generateApplicationTicket,
  getUserById,
  executeQuery,
  validateStageTransition,
  convertToCSV,
  successResponse,
  errorResponse,
  
  // Authentication & Registration
  // enhancedLogin,
  // sendVerificationCode,
  // registerWithVerification,
  
  // Middleware helpers
  validateRequest,
  requireAdmin,
  requireSuperAdmin
} from './membershipControllers_1.js';

import {
  // User Dashboard & Status
  getUserDashboard,
  checkApplicationStatus,
  getApplicationHistory,
  getUserPermissions,
  
  // Application Management
  submitInitialApplication,
  updateApplicationAnswers,
  withdrawApplication,
  getApplicationRequirements,
  
  // Full Membership
  getFullMembershipStatus,
  submitFullMembershipApplication,
  logFullMembershipAccess,
  
  // ✅ NEW: Debug and Testing Functions
  getUserByIdFixed,
  testUserLookup,
  getCurrentMembershipStatus
} from './membershipControllers_2.js';

import {
  // Admin Functions
  getPendingApplications,
  updateApplicationStatus,
  bulkApproveApplications,
  getPendingFullMemberships,
  updateFullMembershipStatus,
  
  // Analytics & Reporting
  getMembershipAnalytics,
  getMembershipOverview,
  getMembershipStats,
  exportMembershipData,
  
  // Notifications
  sendNotification,
  sendMembershipNotification,
  
  // System Functions
  healthCheck,
  getSystemConfig,
  deleteUserAccount,
  searchUsers,
  getAllReports,
  approvePreMemberApplication,
  declinePreMemberApplication,
  getAvailableMentors,
  getAvailableClasses
} from './membershipControllers_3.js';

// ==================================================
// RE-EXPORT ALL FUNCTIONS FOR ROUTES
// ==================================================

// Authentication & Registration
// export {
//   enhancedLogin,
//   sendVerificationCode,
//   registerWithVerification
// };

// User Dashboard & Status  
export {
  getUserDashboard,
  checkApplicationStatus,
  getApplicationHistory,
  getUserPermissions
};

// Application Management
export {
  submitInitialApplication,
  updateApplicationAnswers,
  withdrawApplication,
  getApplicationRequirements
};

// Full Membership
export {
  getFullMembershipStatus,
  submitFullMembershipApplication,
  logFullMembershipAccess
};

// ✅ NEW: Debug and Testing Functions
export {
  getUserByIdFixed,
  testUserLookup
};

// Admin Functions
export {
  getPendingApplications,
  updateApplicationStatus,
  bulkApproveApplications,
  getPendingFullMemberships,
  updateFullMembershipStatus,
  getAllReports
};

// Analytics & Reporting
export {
  getMembershipAnalytics,
  getMembershipOverview,
  getMembershipStats,
  exportMembershipData
};

// Notifications
export {
  sendNotification,
  sendMembershipNotification
};

// System Functions
export {
  healthCheck,
  getSystemConfig,
  deleteUserAccount,
  searchUsers
};

// Middleware helpers
export {
  validateRequest,
  requireAdmin,
  requireSuperAdmin
};

// Utility functions (for internal use)
export {
  generateApplicationTicket,
  getUserById,
  executeQuery,
  validateStageTransition,
  convertToCSV,
  successResponse,
  errorResponse
};

export {
  // ... existing exports
  getCurrentMembershipStatus,
  approvePreMemberApplication,
  declinePreMemberApplication,
  getAvailableMentors,
  getAvailableClasses
};

// ==================================================
// DEFAULT EXPORT FOR BACKWARD COMPATIBILITY
// ==================================================

export default {
  // // Authentication & Registration
  // enhancedLogin,
  // sendVerificationCode,
  // registerWithVerification,
  
  // User Dashboard & Status
  getUserDashboard,
  checkApplicationStatus,
  getApplicationHistory,
  getUserPermissions,
  
  // Application Management
  submitInitialApplication,
  updateApplicationAnswers,
  withdrawApplication,
  getApplicationRequirements,
  
  // Full Membership
  getFullMembershipStatus,
  submitFullMembershipApplication,
  logFullMembershipAccess,
  
  // Debug and Testing Functions
  getUserByIdFixed,
  testUserLookup,
  
  // Admin Functions
  getPendingApplications,
  updateApplicationStatus,
  bulkApproveApplications,
  getPendingFullMemberships,
  updateFullMembershipStatus,
  getAllReports,
  
  // Analytics & Reporting
  getMembershipAnalytics,
  getMembershipOverview,
  getMembershipStats,
  exportMembershipData,
  
  // Notifications
  sendNotification,
  sendMembershipNotification,
  
  // System Functions
  healthCheck,
  getSystemConfig,
  deleteUserAccount,
  searchUsers,
  
  // Middleware helpers
  validateRequest,
  requireAdmin,
  requireSuperAdmin,
  
  // Utility functions
  generateApplicationTicket,
  getUserById,
  executeQuery,
  validateStageTransition,
  convertToCSV,
  successResponse,
  errorResponse
};


