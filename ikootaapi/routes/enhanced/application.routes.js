// routes/enhanced/application.routes.js - COMPLETE APPLICATION ROUTES
import express from 'express';
import { ApplicationController } from '../../controllers/applicationController.js';
import { authenticate, requireMembership } from '../../middleware/auth.js';
import { validateApplication } from '../../middleware/validation.js';

const router = express.Router();

// Submit initial application (real database)
router.post('/initial', authenticate, validateApplication, ApplicationController.submitInitial);

// Get initial application status (real database)
router.get('/initial/status', authenticate, ApplicationController.getInitialStatus);

// Submit full membership application (real database)
router.post('/full-membership', 
  authenticate, 
  requireMembership(['pre_member']), 
  validateApplication, 
  ApplicationController.submitFullMembership
);

// Get full membership application status (real database)
router.get('/full-membership/status', authenticate, ApplicationController.getFullMembershipStatus);

// Compatibility check
router.get('/compatibility', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Application routes are compatible and using real database',
    user_membership: req.user.membership_stage,
    routes_available: [
      'POST /api/applications/initial',
      'GET /api/applications/initial/status',
      'POST /api/applications/full-membership',
      'GET /api/applications/full-membership/status'
    ],
    data_source: 'real_database'
  });
});

export default router;






// // ikootaapi/routes/enhanced/application.routes.js
// // ENHANCED APPLICATION ROUTES - Safe integration with existing system
// // Adds membership application functionality without breaking existing code

// import express from 'express';

// // Import existing services (use what you already have)
// import { 
//   submitInitialApplicationService,
//   checkUserSurveyStatus,
//   getUserSurveyHistory,
//   submitFullMembershipApplicationService
// } from '../../services/surveyServices.js';

// import {
//   getCurrentMembershipStatusService,
//   getApplicationStatusService,
//   getApplicationHistoryService
// } from '../../services/userStatusServices.js';

// // Import middleware (adjust paths to match your structure)
// import { authenticate } from '../../middleware/auth.middleware.js';
// import { 
//   requirePreMemberOrHigher, 
//   canApplyForMembership,
//   rateLimitApplications,
//   logMembershipAction,
//   addMembershipContext
// } from '../../middleware/membershipMiddleware.js';

// // Simple validation middleware (self-contained, won't conflict)
// const validateApplicationData = (req, res, next) => {
//   const { answers } = req.body;
  
//   if (!answers || !Array.isArray(answers) || answers.length === 0) {
//     return res.status(400).json({
//       success: false,
//       message: 'Application answers are required',
//       errors: ['answers field must be a non-empty array']
//     });
//   }
  
//   // Basic answer validation
//   for (let i = 0; i < answers.length; i++) {
//     const answer = answers[i];
//     if (!answer || typeof answer !== 'object') {
//       return res.status(400).json({
//         success: false,
//         message: `Answer ${i + 1} must be an object`,
//         errors: [`Invalid answer format at index ${i}`]
//       });
//     }
    
//     if (!answer.question || !answer.answer) {
//       return res.status(400).json({
//         success: false,
//         message: `Answer ${i + 1} missing required fields`,
//         errors: ['Each answer must have question and answer fields']
//       });
//     }
    
//     if (answer.answer.length < 10) {
//       return res.status(400).json({
//         success: false,
//         message: `Answer ${i + 1} too short`,
//         errors: ['Each answer must be at least 10 characters long']
//       });
//     }
//   }
  
//   next();
// };

// // Simple ticket generator (self-contained)
// const generateApplicationTicket = (type, username) => {
//   const now = new Date();
//   const year = now.getFullYear().toString().slice(-2);
//   const month = String(now.getMonth() + 1).padStart(2, '0');
//   const day = String(now.getDate()).padStart(2, '0');
//   const hour = String(now.getHours()).padStart(2, '0');
//   const minute = String(now.getMinutes()).padStart(2, '0');
  
//   const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
//   const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  
//   switch (type.toUpperCase()) {
//     case 'INITIAL':
//       return `IA-${cleanUsername}-${year}${month}${day}-${hour}${minute}-${randomSuffix}`;
//     case 'FULL':
//       return `FM-${cleanUsername}-${year}${month}${day}-${hour}${minute}-${randomSuffix}`;
//     case 'RESUBMIT':
//       return `RS-${cleanUsername}-${year}${month}${day}-${hour}${minute}-${randomSuffix}`;
//     default:
//       return `AP-${cleanUsername}-${year}${month}${day}-${hour}${minute}-${randomSuffix}`;
//   }
// };

// const router = express.Router();

// // All application routes require authentication
// router.use(authenticate);

// // Add membership context if middleware exists
// if (addMembershipContext) {
//   router.use(addMembershipContext);
// }

// // ===============================================
// // INITIAL APPLICATION ROUTES
// // ===============================================

// /**
//  * POST /api/applications/initial
//  * Submit initial membership application
//  * NEW FUNCTIONALITY - Safe to add
//  */
// router.post('/initial',
//   // Apply rate limiting if available
//   ...(rateLimitApplications ? [rateLimitApplications] : []),
//   validateApplicationData,
//   ...(logMembershipAction ? [logMembershipAction('submit_initial_application')] : []),
//   async (req, res, next) => {
//     try {
//       console.log(`📝 [${req.traceId || 'no-trace'}] Initial application from user:`, req.user.id);
      
//       const { answers, phone, referral_source } = req.body;
      
//       // Generate application ticket
//       const applicationTicket = generateApplicationTicket('INITIAL', req.user.username);
      
//       // Prepare submission data using your existing service structure
//       const submissionData = {
//         answers: JSON.stringify(answers),
//         applicationTicket,
//         userId: req.user.id,
//         userEmail: req.user.email,
//         username: req.user.username
//       };
      
//       // Use your existing service
//       const result = await submitInitialApplicationService(submissionData);
      
//       res.status(201).json({
//         success: true,
//         message: 'Initial application submitted successfully',
//         data: {
//           application_ticket: result.applicationTicket,
//           survey_id: result.surveyId,
//           submitted_at: new Date().toISOString(),
//           status: 'pending',
//           next_steps: [
//             'Your application is now under review',
//             'Review process typically takes 3-5 business days',
//             'You will receive email notification once reviewed',
//             'Check your application status in your dashboard'
//           ]
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Initial application error:`, error);
      
//       // Safe error response
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to submit application',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// /**
//  * GET /api/applications/initial/status
//  * Get initial application status
//  * NEW FUNCTIONALITY - Safe to add
//  */
// router.get('/initial/status',
//   ...(logMembershipAction ? [logMembershipAction('view_initial_application_status')] : []),
//   async (req, res, next) => {
//     try {
//       console.log(`📋 [${req.traceId || 'no-trace'}] Getting initial application status for user:`, req.user.id);
      
//       // Use your existing service
//       const statusData = await checkUserSurveyStatus(req.user.id);
      
//       res.json({
//         success: true,
//         message: 'Initial application status retrieved successfully',
//         data: {
//           application_status: statusData.survey?.status || 'not_submitted',
//           submitted_at: statusData.survey?.submittedAt,
//           reviewed_at: statusData.survey?.reviewedAt,
//           reviewed_by: statusData.survey?.reviewedBy,
//           admin_notes: statusData.survey?.adminNotes,
//           ticket: statusData.survey?.ticket,
//           can_resubmit: statusData.survey?.canResubmit || false,
//           next_steps: statusData.nextSteps || [],
//           redirect_url: statusData.redirect
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Initial application status error:`, error);
      
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get application status',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// // ===============================================
// // FULL MEMBERSHIP APPLICATION ROUTES
// // ===============================================

// /**
//  * POST /api/applications/full-membership
//  * Submit full membership application
//  * NEW FUNCTIONALITY - Safe to add
//  */
// router.post('/full-membership',
//   // Apply membership check if available
//   ...(canApplyForMembership ? [canApplyForMembership] : []),
//   ...(rateLimitApplications ? [rateLimitApplications] : []),
//   validateApplicationData,
//   ...(logMembershipAction ? [logMembershipAction('submit_full_membership_application')] : []),
//   async (req, res, next) => {
//     try {
//       console.log(`🎓 [${req.traceId || 'no-trace'}] Full membership application from user:`, req.user.id);
      
//       const { answers, membershipTicket } = req.body;
      
//       // Generate membership ticket if not provided
//       const finalMembershipTicket = membershipTicket || generateApplicationTicket('FULL', req.user.username);
      
//       // Prepare submission data
//       const submissionData = {
//         answers: JSON.stringify(answers),
//         membershipTicket: finalMembershipTicket,
//         userId: req.user.id,
//         userEmail: req.user.email,
//         username: req.user.username
//       };
      
//       // Use your existing service
//       const result = await submitFullMembershipApplicationService(submissionData);
      
//       res.status(201).json({
//         success: true,
//         message: 'Full membership application submitted successfully',
//         data: {
//           membership_ticket: result.membershipTicket,
//           application_id: result.applicationId,
//           submitted_at: new Date().toISOString(),
//           status: 'pending',
//           next_steps: [
//             'Your full membership application is now under review',
//             'Review process typically takes 5-7 business days',
//             'Continue enjoying pre-member access during review',
//             'You will receive email notification once reviewed'
//           ]
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Full membership application error:`, error);
      
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to submit full membership application',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// /**
//  * GET /api/applications/full-membership/status
//  * Get full membership application status
//  * NEW FUNCTIONALITY - Safe to add
//  */
// router.get('/full-membership/status',
//   ...(requirePreMemberOrHigher ? [requirePreMemberOrHigher] : []),
//   ...(logMembershipAction ? [logMembershipAction('view_full_membership_status')] : []),
//   async (req, res, next) => {
//     try {
//       console.log(`📊 [${req.traceId || 'no-trace'}] Getting full membership status for user:`, req.user.id);
      
//       // Use your existing service
//       const statusData = await getCurrentMembershipStatusService(req.user.id);
      
//       const fullMembershipInfo = statusData.application_progress?.full_membership || {};
      
//       res.json({
//         success: true,
//         message: 'Full membership status retrieved successfully',
//         data: {
//           application_status: fullMembershipInfo.status || 'not_applied',
//           submitted_at: fullMembershipInfo.submitted_at,
//           reviewed_at: fullMembershipInfo.reviewed_at,
//           admin_notes: fullMembershipInfo.admin_notes,
//           current_membership_stage: statusData.current_status?.membership_stage,
//           can_apply: statusData.access_permissions?.can_apply_full_membership,
//           access_permissions: {
//             can_access_towncrier: statusData.access_permissions?.can_access_towncrier || false,
//             can_access_iko: statusData.access_permissions?.can_access_iko || false
//           }
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Full membership status error:`, error);
      
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get full membership status',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// // ===============================================
// // APPLICATION HISTORY ROUTES
// // ===============================================

// /**
//  * GET /api/applications/history
//  * Get user's complete application history
//  * NEW FUNCTIONALITY - Safe to add
//  */
// router.get('/history',
//   ...(logMembershipAction ? [logMembershipAction('view_application_history')] : []),
//   async (req, res, next) => {
//     try {
//       console.log(`📚 [${req.traceId || 'no-trace'}] Getting application history for user:`, req.user.id);
      
//       // Try to use enhanced service, fallback to basic service
//       let historyData;
//       try {
//         historyData = await getApplicationHistoryService(req.user.id);
//       } catch (error) {
//         // Fallback to basic survey history
//         const surveyHistory = await getUserSurveyHistory(req.user.id);
//         historyData = {
//           application_history: surveyHistory,
//           summary: {
//             total_reviews: surveyHistory.length,
//             last_review: surveyHistory[0]?.reviewedAt || null,
//             status_changes: surveyHistory.length
//           }
//         };
//       }
      
//       res.json({
//         success: true,
//         message: 'Application history retrieved successfully',
//         data: {
//           application_history: historyData.application_history,
//           summary: historyData.summary,
//           user_id: req.user.id,
//           generated_at: new Date().toISOString()
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Application history error:`, error);
      
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get application history',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// // ===============================================
// // COMPATIBILITY CHECK
// // ===============================================

// /**
//  * GET /api/applications/compatibility
//  * Check what application features are available
//  */
// router.get('/compatibility', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Enhanced application routes compatibility check',
//     compatibility: {
//       version: '3.0',
//       available_features: {
//         initial_application: true,
//         full_membership_application: true,
//         application_history: true,
//         status_tracking: true
//       },
//       middleware_available: {
//         membership_context: !!addMembershipContext,
//         rate_limiting: !!rateLimitApplications,
//         action_logging: !!logMembershipAction,
//         membership_checks: !!canApplyForMembership
//       },
//       services_available: {
//         survey_services: true,
//         user_status_services: true
//       }
//     },
//     user: {
//       id: req.user.id,
//       username: req.user.username,
//       can_submit_applications: true
//     }
//   });
// });

// export default router;