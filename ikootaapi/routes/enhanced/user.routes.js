// routes/enhanced/user.routes.js - COMPLETE USER ROUTES
import express from 'express';
import { UserController } from '../../controllers/userController.js';
import { authenticate, requireMembership } from '../../middleware/auth.js';
import { validateUserUpdate } from '../../middleware/validation.js';

const router = express.Router();

// Get user profile (real database data)
router.get('/profile', authenticate, UserController.getProfile);

// Get comprehensive dashboard (real database data)
router.get('/dashboard', authenticate, UserController.getDashboard);

// Update user profile (real database update)
router.put('/profile', authenticate, validateUserUpdate, UserController.updateProfile);

// Get user status and permissions (real database data)
router.get('/status', authenticate, UserController.getStatus);

// Compatibility check endpoint
router.get('/compatibility', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'User routes are compatible and using real database',
    user_id: req.user.id,
    routes_available: [
      'GET /api/user/profile',
      'GET /api/user/dashboard', 
      'PUT /api/user/profile',
      'GET /api/user/status'
    ],
    data_source: 'real_database'
  });
});

export default router;






// // ikootaapi/routes/enhanced/user.routes.js
// // ENHANCED USER ROUTES - Extends existing user functionality
// // Backward compatible with existing user operations

// import express from 'express';

// // Import existing services (preserve current functionality)
// import { 
//   getUserProfileService,
//   updateUserProfileService,
//   getUserActivity
// } from '../../services/userServices.js';

// import {
//   getUserDashboardService,
//   getCurrentMembershipStatusService,
//   getUserPreferencesService,
//   updateUserPreferencesService
// } from '../../services/userStatusServices.js';

// // Import middleware
// import { authenticate } from '../../middleware/auth.middleware.js';
// import { addMembershipContext, logMembershipAction } from '../../middleware/membershipMiddleware.js';
// import { 
//   validateUserProfileUpdate, 
//   validateUserPreferences 
// } from '../../middleware/validation.middleware.js';

// const router = express.Router();

// // All user routes require authentication
// router.use(authenticate);

// // Add membership context to all routes
// router.use(addMembershipContext);

// // ===============================================
// // ENHANCED PROFILE ROUTES
// // ===============================================

// /**
//  * GET /api/user/profile
//  * Enhanced profile endpoint with additional user context
//  * BACKWARD COMPATIBLE: Returns same structure as existing + new fields
//  */
// router.get('/profile', 
//   logMembershipAction('view_profile'),
//   async (req, res, next) => {
//     try {
//       console.log(`👤 [${req.traceId}] Enhanced profile request for user:`, req.user.id);
      
//       // Use existing service but enhance response
//       const profile = await getUserProfileService(req.user.id);
      
//       // Add enhanced fields while preserving existing structure
//       const enhancedProfile = {
//         ...profile,
        
//         // Preserve all existing fields
        
//         // Add new enhanced fields
//         enhanced_features: {
//           membership_context: req.membershipContext,
//           permissions: profile.permissions,
//           last_activity: profile.last_login,
//           account_health: {
//             is_verified: profile.email_verified || false,
//             is_complete: !!(profile.username && profile.email),
//             needs_action: profile.status.is_blocked || profile.status.is_banned
//           }
//         },
        
//         // API metadata
//         api_version: '3.0',
//         response_time: new Date().toISOString()
//       };
      
//       res.json({
//         success: true,
//         message: 'Profile retrieved successfully',
//         data: enhancedProfile,
        
//         // Backward compatibility
//         user: enhancedProfile, // Legacy field name support
        
//         traceId: req.traceId
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId}] Enhanced profile error:`, error);
//       next(error);
//     }
//   }
// );

// /**
//  * PUT /api/user/profile
//  * Enhanced profile update with better validation
//  * BACKWARD COMPATIBLE: Accepts same fields as before + new optional fields
//  */
// router.put('/profile',
//   validateUserProfileUpdate,
//   logMembershipAction('update_profile'),
//   async (req, res, next) => {
//     try {
//       console.log(`🔧 [${req.traceId}] Enhanced profile update for user:`, req.user.id);
      
//       const { 
//         username, 
//         email, 
//         phone, 
//         // New optional fields
//         preferred_language, 
//         timezone,
//         // Existing fields preserved
//         ...otherFields 
//       } = req.body;
      
//       // Prepare update data (preserving existing structure)
//       const updateData = {
//         username,
//         email, 
//         phone,
//         preferred_language,
//         timezone,
//         ...otherFields // Preserve any existing fields
//       };
      
//       // Remove undefined fields
//       Object.keys(updateData).forEach(key => {
//         if (updateData[key] === undefined) {
//           delete updateData[key];
//         }
//       });
      
//       if (Object.keys(updateData).length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: 'No valid fields to update',
//           traceId: req.traceId
//         });
//       }
      
//       // Use existing service
//       const updatedProfile = await updateUserProfileService(req.user.id, updateData);
      
//       res.json({
//         success: true,
//         message: 'Profile updated successfully',
//         data: {
//           profile: updatedProfile,
//           updated_fields: Object.keys(updateData),
//           updated_at: new Date().toISOString(),
          
//           // Enhanced metadata
//           enhancement_info: {
//             api_version: '3.0',
//             validation_passed: true,
//             fields_processed: Object.keys(updateData).length
//           }
//         },
        
//         // Backward compatibility
//         user: updatedProfile, // Legacy field name support
        
//         traceId: req.traceId
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId}] Enhanced profile update error:`, error);
//       next(error);
//     }
//   }
// );

// // ===============================================
// // NEW DASHBOARD ROUTE (ADDITIVE)
// // ===============================================

// /**
//  * GET /api/user/dashboard
//  * NEW: Comprehensive dashboard data
//  * This is completely new functionality, won't conflict with existing
//  */
// router.get('/dashboard',
//   logMembershipAction('view_dashboard'),
//   async (req, res, next) => {
//     try {
//       console.log(`📊 [${req.traceId}] Dashboard request for user:`, req.user.id);
      
//       const dashboardData = await getUserDashboardService(req.user.id);
      
//       res.json({
//         success: true,
//         message: 'Dashboard data retrieved successfully',
//         data: dashboardData,
//         traceId: req.traceId
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId}] Dashboard error:`, error);
//       next(error);
//     }
//   }
// );

// // ===============================================
// // NEW STATUS ROUTE (ADDITIVE)
// // ===============================================

// /**
//  * GET /api/user/status
//  * NEW: Current user status and membership information
//  * Additive functionality for membership system
//  */
// router.get('/status',
//   async (req, res, next) => {
//     try {
//       console.log(`📋 [${req.traceId}] Status request for user:`, req.user.id);
      
//       const statusData = await getCurrentMembershipStatusService(req.user.id);
      
//       res.json({
//         success: true,
//         message: 'User status retrieved successfully',
//         data: statusData,
//         traceId: req.traceId
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId}] Status error:`, error);
//       next(error);
//     }
//   }
// );

// // ===============================================
// // ENHANCED ACTIVITY ROUTE
// // ===============================================

// /**
//  * GET /api/user/activity
//  * Enhanced activity tracking with better filtering
//  * EXTENDS existing functionality if you have it, otherwise adds new
//  */
// router.get('/activity',
//   async (req, res, next) => {
//     try {
//       console.log(`📈 [${req.traceId}] Activity request for user:`, req.user.id);
      
//       const { 
//         period = '30d', 
//         include_content = true, 
//         include_applications = true 
//       } = req.query;
      
//       // Use existing service but enhance options
//       const activityData = await getUserActivity(req.user.id, {
//         period,
//         include_content: include_content === 'true',
//         include_applications: include_applications === 'true'
//       });
      
//       res.json({
//         success: true,
//         message: 'Activity data retrieved successfully',
//         data: {
//           activity: activityData,
//           period_requested: period,
//           filters_applied: {
//             include_content: include_content === 'true',
//             include_applications: include_applications === 'true'
//           },
          
//           // Enhanced metadata
//           enhancement_info: {
//             api_version: '3.0',
//             enhanced_filtering: true,
//             real_time_data: true
//           }
//         },
//         traceId: req.traceId
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId}] Activity error:`, error);
//       next(error);
//     }
//   }
// );

// // ===============================================
// // NEW PREFERENCES ROUTES (ADDITIVE)
// // ===============================================

// /**
//  * GET /api/user/preferences
//  * NEW: User preferences management
//  */
// router.get('/preferences',
//   async (req, res, next) => {
//     try {
//       console.log(`⚙️ [${req.traceId}] Preferences request for user:`, req.user.id);
      
//       const preferences = await getUserPreferencesService(req.user.id);
      
//       res.json({
//         success: true,
//         message: 'Preferences retrieved successfully',
//         data: preferences,
//         traceId: req.traceId
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId}] Preferences error:`, error);
//       next(error);
//     }
//   }
// );

// /**
//  * PUT /api/user/preferences
//  * NEW: Update user preferences
//  */
// router.put('/preferences',
//   validateUserPreferences,
//   logMembershipAction('update_preferences'),
//   async (req, res, next) => {
//     try {
//       console.log(`🔧 [${req.traceId}] Preferences update for user:`, req.user.id);
      
//       const preferenceData = req.body;
      
//       const updateResult = await updateUserPreferencesService(req.user.id, preferenceData);
      
//       res.json({
//         success: true,
//         message: 'Preferences updated successfully',
//         data: {
//           updated_preferences: Object.keys(preferenceData),
//           updated_at: updateResult.updated_at
//         },
//         traceId: req.traceId
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId}] Preferences update error:`, error);
//       next(error);
//     }
//   }
// );

// // ===============================================
// // BACKWARD COMPATIBILITY CHECK
// // ===============================================

// /**
//  * GET /api/user/compatibility
//  * Endpoint to check what features are available
//  */
// router.get('/compatibility', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Enhanced user routes compatibility check',
//     compatibility: {
//       version: '3.0',
//       backward_compatible: true,
//       existing_endpoints: {
//         profile: 'enhanced',
//         activity: 'enhanced'
//       },
//       new_endpoints: {
//         dashboard: 'available',
//         status: 'available', 
//         preferences: 'available'
//       },
//       breaking_changes: 'none'
//     },
//     user: {
//       id: req.user.id,
//       username: req.user.username,
//       can_use_enhanced_features: true
//     }
//   });
// });

// export default router;