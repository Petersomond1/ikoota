// routes/enhanced/admin.routes.js - COMPLETE ADMIN ROUTES
import express from 'express';
import { AdminController } from '../../controllers/adminController.js';
import { authenticate, requireMembership } from '../../middleware/auth.js';
import { validateAdminUpdate } from '../../middleware/validation.js';

const router = express.Router();

// Ensure only admins can access these routes
router.use(requireMembership(['admin', 'super_admin']));

// Get all users with pagination and filters (real database)
router.get('/users', AdminController.getUsers);

// Get specific user by ID (real database)
router.get('/users/:userId', AdminController.getUserById);

// Update user (admin only) (real database)
router.put('/users/:userId', validateAdminUpdate, AdminController.updateUser);

// Ban user (real database)
router.post('/users/:userId/ban', AdminController.banUser);

// Get pending applications (real database)
router.get('/applications', AdminController.getApplications);

// Review application (real database)
router.put('/applications/:applicationId/review', AdminController.reviewApplication);

// Get system statistics (real database)
router.get('/system/stats', AdminController.getSystemStats);

// Get system health (real database)
router.get('/system/health', AdminController.getSystemHealth);

// Compatibility check
router.get('/compatibility', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Admin routes are compatible and using real database',
    admin_level: req.user.role,
    routes_available: [
      'GET /api/admin/users',
      'GET /api/admin/users/:id',
      'PUT /api/admin/users/:id',
      'POST /api/admin/users/:id/ban',
      'GET /api/admin/applications',
      'PUT /api/admin/applications/:id/review',
      'GET /api/admin/system/stats',
      'GET /api/admin/system/health'
    ],
    data_source: 'real_database'
  });
});

export default router;







// // ikootaapi/routes/enhanced/admin.routes.js
// // ENHANCED ADMIN ROUTES - Safe integration with existing system
// // Adds comprehensive admin functionality without breaking existing code

// import express from 'express';

// // Import existing services (use what you already have)
// import { 
//   getAllUsers,
//   getUserById,
//   updateUserByAdmin,
//   deleteUser,
//   getUserStats,
//   getMembershipOverviewStats
// } from '../../services/userServices.js';

// import {
//   fetchAllSurveyLogs,
//   approveSurveySubmission,
//   getSurveyAnalyticsData,
//   exportSurveyDataToCSV,
//   getSurveyDetailsById
// } from '../../services/surveyServices.js';

// import {
//   performHealthCheckService,
//   getSystemStatisticsService,
//   performSystemCleanupService
// } from '../../services/systemServices.js';

// // Import middleware (adjust paths to match your structure)
// import { authenticate } from '../../middleware/auth.middleware.js';
// import { 
//   requireAdmin, 
//   requireSuperAdmin,
//   canReviewApplications,
//   logMembershipAction
// } from '../../middleware/membershipMiddleware.js';

// // Self-contained validation middleware (won't conflict)
// const validateAdminUserUpdate = (req, res, next) => {
//   const { username, email, role, membership_stage, is_member } = req.body;
//   const errors = [];
  
//   // Username validation (optional)
//   if (username !== undefined) {
//     if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
//       errors.push('Username must be between 3 and 50 characters');
//     }
//   }
  
//   // Email validation (optional)
//   if (email !== undefined) {
//     if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//       errors.push('Email must be a valid email address');
//     }
//   }
  
//   // Role validation (optional)
//   if (role !== undefined) {
//     const validRoles = ['user', 'mentor', 'admin', 'super_admin'];
//     if (!validRoles.includes(role)) {
//       errors.push(`Role must be one of: ${validRoles.join(', ')}`);
//     }
//   }
  
//   if (errors.length > 0) {
//     return res.status(400).json({
//       success: false,
//       message: 'Admin user update validation failed',
//       errors
//     });
//   }
  
//   next();
// };

// const validateApplicationReview = (req, res, next) => {
//   const { status, adminNotes } = req.body;
//   const errors = [];
  
//   if (!status) {
//     errors.push('Review status is required');
//   } else if (!['approved', 'declined', 'rejected'].includes(status)) {
//     errors.push('Status must be approved, declined, or rejected');
//   }
  
//   // Require admin notes for rejection/decline
//   if (['declined', 'rejected'].includes(status) && (!adminNotes || adminNotes.trim().length === 0)) {
//     errors.push('Admin notes required when declining or rejecting applications');
//   }
  
//   if (errors.length > 0) {
//     return res.status(400).json({
//       success: false,
//       message: 'Application review validation failed',
//       errors
//     });
//   }
  
//   next();
// };

// const validatePagination = (req, res, next) => {
//   const { page = 1, limit = 20 } = req.query;
  
//   const pageNum = Math.max(1, parseInt(page) || 1);
//   const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  
//   req.pagination = {
//     page: pageNum,
//     limit: limitNum,
//     offset: (pageNum - 1) * limitNum
//   };
  
//   next();
// };

// const router = express.Router();

// // All admin routes require authentication
// router.use(authenticate);

// // Apply admin requirement if middleware exists
// if (requireAdmin) {
//   router.use(requireAdmin);
// }

// // ===============================================
// // USER MANAGEMENT ROUTES
// // ===============================================

// /**
//  * GET /api/admin/users
//  * Get all users with filtering and pagination
//  * NEW ADMIN FUNCTIONALITY - Safe to add
//  */
// router.get('/users',
//   validatePagination,
//   ...(logMembershipAction ? [logMembershipAction('admin_view_users')] : []),
//   async (req, res, next) => {
//     try {
//       console.log(`👥 [${req.traceId || 'no-trace'}] Admin getting all users, requested by:`, req.user.username);
      
//       const filters = {
//         role: req.query.role,
//         membership_stage: req.query.membership_stage,
//         is_member: req.query.is_member,
//         search: req.query.search,
//         limit: req.pagination.limit,
//         offset: req.pagination.offset
//       };
      
//       // Use your existing service
//       const result = await getAllUsers(filters);
      
//       res.json({
//         success: true,
//         message: 'Users retrieved successfully',
//         data: {
//           users: result.users,
//           pagination: {
//             total: result.total,
//             page: req.pagination.page,
//             limit: req.pagination.limit,
//             pages: Math.ceil(result.total / req.pagination.limit)
//           },
//           filters_applied: Object.fromEntries(
//             Object.entries(filters).filter(([_, value]) => value !== undefined)
//           )
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Get all users error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get users',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// /**
//  * GET /api/admin/users/:userId
//  * Get specific user details
//  * NEW ADMIN FUNCTIONALITY - Safe to add
//  */
// router.get('/users/:userId',
//   ...(logMembershipAction ? [logMembershipAction('admin_view_user_details')] : []),
//   async (req, res, next) => {
//     try {
//       const userId = parseInt(req.params.userId);
      
//       if (isNaN(userId)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid user ID'
//         });
//       }
      
//       console.log(`🔍 [${req.traceId || 'no-trace'}] Admin getting user details:`, userId);
      
//       // Use your existing service
//       const user = await getUserById(userId);
      
//       res.json({
//         success: true,
//         message: 'User details retrieved successfully',
//         data: {
//           user,
//           admin_context: {
//             viewed_by: req.user.username,
//             viewed_at: new Date().toISOString()
//           }
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Get user details error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get user details',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// /**
//  * PUT /api/admin/users/:userId
//  * Update user information
//  * NEW ADMIN FUNCTIONALITY - Safe to add
//  */
// router.put('/users/:userId',
//   validateAdminUserUpdate,
//   ...(logMembershipAction ? [logMembershipAction('admin_update_user')] : []),
//   async (req, res, next) => {
//     try {
//       const userId = parseInt(req.params.userId);
      
//       if (isNaN(userId)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid user ID'
//         });
//       }
      
//       console.log(`🔧 [${req.traceId || 'no-trace'}] Admin updating user:`, userId);
      
//       const updateData = req.body;
      
//       // Use your existing service
//       const updatedUser = await updateUserByAdmin(userId, updateData);
      
//       res.json({
//         success: true,
//         message: 'User updated successfully',
//         data: {
//           user: updatedUser,
//           updated_fields: Object.keys(updateData),
//           updated_by: req.user.username,
//           updated_at: new Date().toISOString()
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Update user error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to update user',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// /**
//  * POST /api/admin/users/:userId/ban
//  * Ban user
//  * NEW ADMIN FUNCTIONALITY - Safe to add
//  */
// router.post('/users/:userId/ban',
//   ...(logMembershipAction ? [logMembershipAction('admin_ban_user')] : []),
//   async (req, res, next) => {
//     try {
//       const userId = parseInt(req.params.userId);
//       const { reason, duration } = req.body;
      
//       if (isNaN(userId)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid user ID'
//         });
//       }
      
//       if (!reason) {
//         return res.status(400).json({
//           success: false,
//           message: 'Ban reason is required'
//         });
//       }
      
//       console.log(`🚫 [${req.traceId || 'no-trace'}] Admin banning user:`, userId);
      
//       // Update user ban status
//       const banData = {
//         isbanned: true,
//         ban_reason: reason,
//         banned_by: req.user.id,
//         banned_at: new Date()
//       };
      
//       if (duration) {
//         banData.ban_duration = duration;
//       }
      
//       const updatedUser = await updateUserByAdmin(userId, banData);
      
//       res.json({
//         success: true,
//         message: 'User banned successfully',
//         data: {
//           user_id: userId,
//           reason,
//           duration,
//           banned_by: req.user.username,
//           banned_at: banData.banned_at
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Ban user error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to ban user',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// /**
//  * POST /api/admin/users/:userId/unban
//  * Unban user
//  * NEW ADMIN FUNCTIONALITY - Safe to add
//  */
// router.post('/users/:userId/unban',
//   ...(logMembershipAction ? [logMembershipAction('admin_unban_user')] : []),
//   async (req, res, next) => {
//     try {
//       const userId = parseInt(req.params.userId);
//       const { reason = 'Admin decision to unban' } = req.body;
      
//       if (isNaN(userId)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid user ID'
//         });
//       }
      
//       console.log(`✅ [${req.traceId || 'no-trace'}] Admin unbanning user:`, userId);
      
//       // Update user ban status
//       const unbanData = {
//         isbanned: false,
//         unban_reason: reason,
//         unbanned_by: req.user.id,
//         unbanned_at: new Date()
//       };
      
//       const updatedUser = await updateUserByAdmin(userId, unbanData);
      
//       res.json({
//         success: true,
//         message: 'User unbanned successfully',
//         data: {
//           user_id: userId,
//           reason,
//           unbanned_by: req.user.username,
//           unbanned_at: unbanData.unbanned_at
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Unban user error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to unban user',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// // ===============================================
// // APPLICATION REVIEW ROUTES
// // ===============================================

// /**
//  * GET /api/admin/applications
//  * Get all applications for review
//  * NEW ADMIN FUNCTIONALITY - Safe to add
//  */
// router.get('/applications',
//   ...(canReviewApplications ? [canReviewApplications] : []),
//   validatePagination,
//   ...(logMembershipAction ? [logMembershipAction('admin_view_applications')] : []),
//   async (req, res, next) => {
//     try {
//       console.log(`📋 [${req.traceId || 'no-trace'}] Admin getting applications, requested by:`, req.user.username);
      
//       const filters = {
//         approval_status: req.query.status,
//         application_type: req.query.type,
//         search: req.query.search
//       };
      
//       const pagination = {
//         page: req.pagination.page,
//         limit: req.pagination.limit
//       };
      
//       // Use your existing service
//       const result = await fetchAllSurveyLogs(filters, pagination);
      
//       res.json({
//         success: true,
//         message: 'Applications retrieved successfully',
//         data: {
//           applications: result.data,
//           pagination: {
//             current_page: result.page,
//             total_pages: result.totalPages,
//             total_count: result.count,
//             limit: pagination.limit
//           },
//           summary: {
//             total_applications: result.count,
//             pending_count: result.data.filter(app => app.approval_status === 'pending').length,
//             approved_count: result.data.filter(app => app.approval_status === 'approved').length,
//             declined_count: result.data.filter(app => app.approval_status === 'declined').length
//           }
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Get applications error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get applications',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// /**
//  * GET /api/admin/applications/:applicationId
//  * Get specific application details
//  * NEW ADMIN FUNCTIONALITY - Safe to add
//  */
// router.get('/applications/:applicationId',
//   ...(canReviewApplications ? [canReviewApplications] : []),
//   ...(logMembershipAction ? [logMembershipAction('admin_view_application_details')] : []),
//   async (req, res, next) => {
//     try {
//       const applicationId = parseInt(req.params.applicationId);
      
//       if (isNaN(applicationId)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid application ID'
//         });
//       }
      
//       console.log(`🔍 [${req.traceId || 'no-trace'}] Admin getting application details:`, applicationId);
      
//       // Use your existing service
//       const application = await getSurveyDetailsById(applicationId);
      
//       if (!application) {
//         return res.status(404).json({
//           success: false,
//           message: 'Application not found'
//         });
//       }
      
//       res.json({
//         success: true,
//         message: 'Application details retrieved successfully',
//         data: {
//           application,
//           review_context: {
//             can_review: application.approval_status === 'pending',
//             reviewed_by_current_admin: application.reviewed_by === req.user.id,
//             admin_viewing: req.user.username
//           }
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Get application details error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get application details',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// /**
//  * PUT /api/admin/applications/:applicationId/review
//  * Review application (approve/decline)
//  * NEW ADMIN FUNCTIONALITY - Safe to add
//  */
// router.put('/applications/:applicationId/review',
//   ...(canReviewApplications ? [canReviewApplications] : []),
//   validateApplicationReview,
//   ...(logMembershipAction ? [logMembershipAction('admin_review_application')] : []),
//   async (req, res, next) => {
//     try {
//       const applicationId = parseInt(req.params.applicationId);
//       const { status, adminNotes, mentorId, classId, converseId } = req.body;
      
//       if (isNaN(applicationId)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid application ID'
//         });
//       }
      
//       console.log(`⚖️ [${req.traceId || 'no-trace'}] Admin reviewing application:`, applicationId);
      
//       // Get application details first
//       const application = await getSurveyDetailsById(applicationId);
      
//       if (!application) {
//         return res.status(404).json({
//           success: false,
//           message: 'Application not found'
//         });
//       }
      
//       if (application.approval_status !== 'pending') {
//         return res.status(400).json({
//           success: false,
//           message: 'Application has already been reviewed'
//         });
//       }
      
//       const reviewData = {
//         surveyId: applicationId,
//         userId: application.user_id,
//         status,
//         adminNotes,
//         reviewedBy: req.user.id,
//         reviewerName: req.user.username,
//         mentorId,
//         classId,
//         converseId
//       };
      
//       // Use your existing service
//       const result = await approveSurveySubmission(reviewData);
      
//       res.json({
//         success: true,
//         message: `Application ${status} successfully`,
//         data: {
//           application_id: applicationId,
//           user_id: application.user_id,
//           username: application.username,
//           decision: status,
//           reviewed_by: req.user.username,
//           reviewed_at: new Date().toISOString(),
//           admin_notes: adminNotes
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Review application error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to review application',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// // ===============================================
// // SYSTEM MANAGEMENT ROUTES
// // ===============================================

// /**
//  * GET /api/admin/system/health
//  * Get system health status
//  * NEW ADMIN FUNCTIONALITY - Safe to add
//  */
// router.get('/system/health',
//   async (req, res, next) => {
//     try {
//       console.log(`❤️ [${req.traceId || 'no-trace'}] Admin checking system health`);
      
//       // Use your existing service
//       const healthData = await performHealthCheckService();
      
//       res.json({
//         success: true,
//         message: 'System health status retrieved',
//         data: healthData,
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] System health error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get system health',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// /**
//  * GET /api/admin/system/stats
//  * Get system statistics
//  * NEW ADMIN FUNCTIONALITY - Safe to add
//  */
// router.get('/system/stats',
//   ...(logMembershipAction ? [logMembershipAction('admin_view_system_stats')] : []),
//   async (req, res, next) => {
//     try {
//       console.log(`📊 [${req.traceId || 'no-trace'}] Admin getting system stats`);
      
//       // Use your existing services
//       const systemStats = await getSystemStatisticsService();
//       const userStats = await getUserStats();
//       const membershipStats = await getMembershipOverviewStats();
      
//       res.json({
//         success: true,
//         message: 'System statistics retrieved successfully',
//         data: {
//           system_statistics: systemStats,
//           user_statistics: userStats,
//           membership_statistics: membershipStats,
//           requested_by: req.user.username,
//           generated_at: new Date().toISOString()
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] System stats error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get system stats',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// // ===============================================
// // ANALYTICS ROUTES
// // ===============================================

// /**
//  * GET /api/admin/analytics/applications
//  * Get application analytics
//  * NEW ADMIN FUNCTIONALITY - Safe to add
//  */
// router.get('/analytics/applications',
//   ...(logMembershipAction ? [logMembershipAction('admin_view_application_analytics')] : []),
//   async (req, res, next) => {
//     try {
//       console.log(`📊 [${req.traceId || 'no-trace'}] Admin getting application analytics`);
      
//       const { startDate, endDate, groupBy = 'day' } = req.query;
      
//       // Use your existing service
//       const analyticsData = await getSurveyAnalyticsData({
//         startDate,
//         endDate,
//         groupBy
//       });
      
//       res.json({
//         success: true,
//         message: 'Application analytics retrieved successfully',
//         data: {
//           analytics: analyticsData,
//           period: {
//             start_date: startDate || 'all_time',
//             end_date: endDate || 'current',
//             group_by: groupBy
//           },
//           generated_by: req.user.username,
//           generated_at: new Date().toISOString()
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Application analytics error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get application analytics',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// // ===============================================
// // COMPATIBILITY CHECK
// // ===============================================

// /**
//  * GET /api/admin/compatibility
//  * Check what admin features are available
//  */
// router.get('/compatibility', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Enhanced admin routes compatibility check',
//     compatibility: {
//       version: '3.0',
//       available_features: {
//         user_management: true,
//         application_review: true,
//         system_monitoring: true,
//         analytics: true,
//         ban_unban: true
//       },
//       middleware_available: {
//         admin_requirement: !!requireAdmin,
//         super_admin_requirement: !!requireSuperAdmin,
//         review_permissions: !!canReviewApplications,
//         action_logging: !!logMembershipAction
//       },
//       services_available: {
//         user_services: true,
//         survey_services: true,
//         system_services: true
//       }
//     },
//     admin: {
//       id: req.user.id,
//       username: req.user.username,
//       role: req.user.role,
//       can_use_admin_features: true
//     }
//   });
// });

// export default router;