// routes/enhanced/content.routes.js - COMPLETE CONTENT ROUTES
import express from 'express';
import { ContentController } from '../../controllers/contentController.js';
import { authenticate, requireMembership } from '../../middleware/auth.js';
import { validateTeaching } from '../../middleware/validation.js';

const router = express.Router();

// Get all teachings with access control (real database)
router.get('/teachings', authenticate, ContentController.getTeachings);

// Create new teaching (real database)
router.post('/teachings', 
  authenticate, 
  requireMembership(['member', 'admin', 'super_admin']), 
  validateTeaching, 
  ContentController.createTeaching
);

// Get user's own teachings (real database)
router.get('/my-teachings', authenticate, ContentController.getMyTeachings);

// Get Towncrier content - pre-member level (real database)
router.get('/towncrier', 
  authenticate, 
  requireMembership(['pre_member', 'member', 'admin', 'super_admin']), 
  ContentController.getTowncrier
);

// Get Iko content - full member level (real database)
router.get('/iko', 
  authenticate, 
  requireMembership(['member', 'admin', 'super_admin']), 
  ContentController.getIko
);

// Compatibility check
router.get('/compatibility', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Content routes are compatible and using real database',
    user_membership: req.user.membership_stage,
    access_levels: {
      towncrier: ['pre_member', 'member', 'admin', 'super_admin'].includes(req.user.membership_stage),
      iko: ['member', 'admin', 'super_admin'].includes(req.user.membership_stage),
      create_teachings: ['member', 'admin', 'super_admin'].includes(req.user.membership_stage)
    },
    routes_available: [
      'GET /api/content/teachings',
      'POST /api/content/teachings',
      'GET /api/content/my-teachings',
      'GET /api/content/towncrier',
      'GET /api/content/iko'
    ],
    data_source: 'real_database'
  });
});

export default router;







// // ikootaapi/routes/enhanced/content.routes.js
// // ENHANCED CONTENT ROUTES - Safe integration with existing system
// // Handles Towncrier, Iko access, and content management

// import express from 'express';

// // Import existing services (use what you already have)
// import { 
//   getAllTeachings,
//   getTeachingsByUserId,
//   getTeachingByPrefixedId,
//   createTeachingService,
//   updateTeachingById,
//   deleteTeachingById,
//   searchTeachings
// } from '../../services/teachingsServices.js';

// // Import middleware (adjust paths to match your structure)
// import { authenticate } from '../../middleware/auth.middleware.js';
// import { 
//   requireMember,
//   requirePreMemberOrHigher,
//   logMembershipAction,
//   addMembershipContext
// } from '../../middleware/membershipMiddleware.js';
// import { uploadMiddleware, uploadToS3 } from '../../middleware/upload.middleware.js';

// // Self-contained validation middleware
// const validateContentAccess = (requiredLevel) => {
//   return (req, res, next) => {
//     const userRole = req.user?.role;
//     const membershipStage = req.user?.membership_stage;
    
//     // Admin bypass
//     if (['admin', 'super_admin'].includes(userRole)) {
//       return next();
//     }
    
//     // Check access level
//     switch (requiredLevel) {
//       case 'towncrier':
//         if (['pre_member', 'member'].includes(membershipStage)) {
//           return next();
//         }
//         break;
//       case 'iko':
//         if (membershipStage === 'member') {
//           return next();
//         }
//         break;
//       case 'public':
//         return next();
//       default:
//         return next();
//     }
    
//     return res.status(403).json({
//       success: false,
//       message: `Access denied. ${requiredLevel} access required.`,
//       user_status: {
//         membership_stage: membershipStage,
//         required_level: requiredLevel
//       }
//     });
//   };
// };

// const validateTeachingData = (req, res, next) => {
//   const { topic, description, content, media } = req.body;
//   const errors = [];
  
//   // Required fields
//   if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
//     errors.push('Topic is required and must be a non-empty string');
//   }
  
//   if (!description || typeof description !== 'string' || description.trim().length === 0) {
//     errors.push('Description is required and must be a non-empty string');
//   }
  
//   // Either content or media must be provided
//   if (!content && (!media || media.length === 0)) {
//     errors.push('Either content or media must be provided');
//   }
  
//   // Validate lengths
//   if (topic && topic.length > 255) {
//     errors.push('Topic cannot exceed 255 characters');
//   }
  
//   if (description && description.length > 1000) {
//     errors.push('Description cannot exceed 1000 characters');
//   }
  
//   if (content && content.length > 50000) {
//     errors.push('Content cannot exceed 50000 characters');
//   }
  
//   if (errors.length > 0) {
//     return res.status(400).json({
//       success: false,
//       message: 'Teaching validation failed',
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

// // All content routes require authentication
// router.use(authenticate);

// // Add membership context if available
// if (addMembershipContext) {
//   router.use(addMembershipContext);
// }

// // ===============================================
// // TOWNCRIER ROUTES (PRE-MEMBER ACCESS)
// // ===============================================

// /**
//  * GET /api/content/towncrier
//  * Access Towncrier content (pre-member level)
//  * NEW FUNCTIONALITY - Safe to add
//  */
// router.get('/towncrier',
//   validateContentAccess('towncrier'),
//   validatePagination,
//   ...(logMembershipAction ? [logMembershipAction('access_towncrier')] : []),
//   async (req, res, next) => {
//     try {
//       console.log(`📰 [${req.traceId || 'no-trace'}] Towncrier access by user:`, req.user.id);
      
//       const { search, category } = req.query;
      
//       // Get teachings with filters for Towncrier
//       const searchFilters = {
//         query: search,
//         audience: 'pre_member',
//         limit: req.pagination.limit,
//         offset: req.pagination.offset
//       };
      
//       // Use your existing service
//       const result = await searchTeachings(searchFilters);
      
//       res.json({
//         success: true,
//         message: 'Towncrier content retrieved successfully',
//         data: {
//           content: result.teachings,
//           pagination: {
//             current_page: req.pagination.page,
//             total_pages: Math.ceil(result.total / req.pagination.limit),
//             total_count: result.total,
//             limit: req.pagination.limit
//           },
//           access_info: {
//             level: 'towncrier',
//             user_membership: req.user.membership_stage,
//             content_type: 'pre_member_content'
//           },
//           filters_applied: {
//             search,
//             category,
//             audience: 'pre_member'
//           }
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Towncrier access error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to access Towncrier content',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// /**
//  * GET /api/content/towncrier/feed
//  * Get personalized Towncrier feed
//  * NEW FUNCTIONALITY - Safe to add
//  */
// router.get('/towncrier/feed',
//   validateContentAccess('towncrier'),
//   ...(logMembershipAction ? [logMembershipAction('view_towncrier_feed')] : []),
//   async (req, res, next) => {
//     try {
//       console.log(`📋 [${req.traceId || 'no-trace'}] Towncrier feed for user:`, req.user.id);
      
//       // Get recent content for pre-members
//       const recentContent = await getAllTeachings();
      
//       // Filter for pre-member appropriate content
//       const towncriertContent = recentContent
//         .filter(item => !item.audience || ['public', 'pre_member', 'all'].includes(item.audience))
//         .slice(0, 20);
      
//       res.json({
//         success: true,
//         message: 'Towncrier feed retrieved successfully',
//         data: {
//           feed_items: towncriertContent,
//           feed_info: {
//             total_items: towncriertContent.length,
//             content_level: 'pre_member',
//             last_updated: new Date().toISOString(),
//             personalized: false
//           },
//           user_context: {
//             membership_stage: req.user.membership_stage,
//             access_level: 'towncrier'
//           }
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Towncrier feed error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get Towncrier feed',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// // ===============================================
// // IKO ROUTES (FULL MEMBER ACCESS)
// // ===============================================

// /**
//  * GET /api/content/iko
//  * Access Iko content (full member level)
//  * NEW FUNCTIONALITY - Safe to add
//  */
// router.get('/iko',
//   validateContentAccess('iko'),
//   validatePagination,
//   ...(logMembershipAction ? [logMembershipAction('access_iko')] : []),
//   async (req, res, next) => {
//     try {
//       console.log(`🎓 [${req.traceId || 'no-trace'}] Iko access by user:`, req.user.id);
      
//       const { search, category, difficulty } = req.query;
      
//       // Get teachings with filters for Iko (all content)
//       const searchFilters = {
//         query: search,
//         audience: 'member',
//         limit: req.pagination.limit,
//         offset: req.pagination.offset
//       };
      
//       if (difficulty) {
//         searchFilters.difficulty = difficulty;
//       }
      
//       // Use your existing service
//       const result = await searchTeachings(searchFilters);
      
//       res.json({
//         success: true,
//         message: 'Iko content retrieved successfully',
//         data: {
//           content: result.teachings,
//           pagination: {
//             current_page: req.pagination.page,
//             total_pages: Math.ceil(result.total / req.pagination.limit),
//             total_count: result.total,
//             limit: req.pagination.limit
//           },
//           access_info: {
//             level: 'iko',
//             user_membership: req.user.membership_stage,
//             content_type: 'full_member_content'
//           },
//           filters_applied: {
//             search,
//             category,
//             difficulty,
//             audience: 'member'
//           }
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Iko access error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to access Iko content',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// /**
//  * GET /api/content/iko/feed
//  * Get personalized Iko feed
//  * NEW FUNCTIONALITY - Safe to add
//  */
// router.get('/iko/feed',
//   validateContentAccess('iko'),
//   ...(logMembershipAction ? [logMembershipAction('view_iko_feed')] : []),
//   async (req, res, next) => {
//     try {
//       console.log(`📚 [${req.traceId || 'no-trace'}] Iko feed for user:`, req.user.id);
      
//       // Get all content for full members
//       const allContent = await getAllTeachings();
      
//       // Get user's content for personalization
//       const userContent = await getTeachingsByUserId(req.user.id);
      
//       res.json({
//         success: true,
//         message: 'Iko feed retrieved successfully',
//         data: {
//           feed_items: allContent.slice(0, 30),
//           user_content: userContent,
//           feed_info: {
//             total_items: allContent.length,
//             user_items: userContent.length,
//             content_level: 'full_member',
//             last_updated: new Date().toISOString(),
//             personalized: true
//           },
//           user_context: {
//             membership_stage: req.user.membership_stage,
//             access_level: 'iko'
//           }
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Iko feed error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get Iko feed',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// // ===============================================
// // TEACHING MANAGEMENT ROUTES
// // ===============================================

// /**
//  * GET /api/content/teachings
//  * Get all teachings with filtering
//  * ENHANCED FUNCTIONALITY - Uses existing service
//  */
// router.get('/teachings',
//   requirePreMemberOrHigher ? requirePreMemberOrHigher : validateContentAccess('towncrier'),
//   validatePagination,
//   async (req, res, next) => {
//     try {
//       console.log(`📚 [${req.traceId || 'no-trace'}] Getting teachings for user:`, req.user.id);
      
//       const { search, user_id, audience, subject } = req.query;
      
//       let teachings;
      
//       if (search || user_id || audience || subject) {
//         // Use search with filters
//         const searchFilters = {
//           query: search,
//           user_id: user_id ? parseInt(user_id) : undefined,
//           audience,
//           subjectMatter: subject,
//           limit: req.pagination.limit,
//           offset: req.pagination.offset
//         };
        
//         const result = await searchTeachings(searchFilters);
//         teachings = result.teachings;
//       } else {
//         // Get all teachings
//         const allTeachings = await getAllTeachings();
//         teachings = allTeachings.slice(req.pagination.offset, req.pagination.offset + req.pagination.limit);
//       }
      
//       res.json({
//         success: true,
//         message: 'Teachings retrieved successfully',
//         data: {
//           teachings,
//           pagination: req.pagination,
//           filters_applied: { search, user_id, audience, subject }
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Get teachings error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get teachings',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// /**
//  * GET /api/content/teachings/:teachingId
//  * Get specific teaching by ID
//  * ENHANCED FUNCTIONALITY - Uses existing service
//  */
// router.get('/teachings/:teachingId',
//   requirePreMemberOrHigher ? requirePreMemberOrHigher : validateContentAccess('towncrier'),
//   async (req, res, next) => {
//     try {
//       const teachingId = req.params.teachingId;
      
//       console.log(`🔍 [${req.traceId || 'no-trace'}] Getting teaching:`, teachingId);
      
//       // Use your existing service
//       const teaching = await getTeachingByPrefixedId(teachingId);
      
//       if (!teaching) {
//         return res.status(404).json({
//           success: false,
//           message: 'Teaching not found'
//         });
//       }
      
//       res.json({
//         success: true,
//         message: 'Teaching retrieved successfully',
//         data: {
//           teaching,
//           access_info: {
//             user_can_edit: teaching.user_id === req.user.id || ['admin', 'super_admin'].includes(req.user.role),
//             content_level: teaching.audience || 'public'
//           }
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Get teaching error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get teaching',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// /**
//  * POST /api/content/teachings
//  * Create new teaching
//  * NEW FUNCTIONALITY - Uses existing service
//  */
// router.post('/teachings',
//   requireMember ? requireMember : validateContentAccess('iko'),
//   uploadMiddleware,
//   uploadToS3 ? uploadToS3 : (req, res, next) => next(),
//   validateTeachingData,
//   ...(logMembershipAction ? [logMembershipAction('create_teaching')] : []),
//   async (req, res, next) => {
//     try {
//       console.log(`✍️ [${req.traceId || 'no-trace'}] Creating teaching by user:`, req.user.id);
      
//       const { 
//         topic, 
//         description, 
//         subjectMatter, 
//         audience = 'member', 
//         content,
//         lessonNumber 
//       } = req.body;
      
//       // Handle uploaded files
//       let media = [];
//       if (req.uploadedFiles && req.uploadedFiles.length > 0) {
//         media = req.uploadedFiles.map(file => ({
//           url: file.url,
//           type: file.type
//         }));
//       }
      
//       const teachingData = {
//         topic: topic.trim(),
//         description: description.trim(),
//         subjectMatter: subjectMatter?.trim(),
//         audience,
//         content: content?.trim(),
//         media,
//         user_id: req.user.id,
//         lessonNumber
//       };
      
//       // Use your existing service
//       const newTeaching = await createTeachingService(teachingData);
      
//       res.status(201).json({
//         success: true,
//         message: 'Teaching created successfully',
//         data: {
//           teaching: newTeaching,
//           created_by: req.user.username,
//           created_at: new Date().toISOString(),
//           media_uploaded: media.length
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Create teaching error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to create teaching',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// /**
//  * PUT /api/content/teachings/:teachingId
//  * Update teaching
//  * ENHANCED FUNCTIONALITY - Uses existing service
//  */
// router.put('/teachings/:teachingId',
//   requireMember ? requireMember : validateContentAccess('iko'),
//   uploadMiddleware,
//   uploadToS3 ? uploadToS3 : (req, res, next) => next(),
//   validateTeachingData,
//   ...(logMembershipAction ? [logMembershipAction('update_teaching')] : []),
//   async (req, res, next) => {
//     try {
//       const teachingId = req.params.teachingId;
      
//       console.log(`🔧 [${req.traceId || 'no-trace'}] Updating teaching:`, teachingId);
      
//       // Get existing teaching to check ownership
//       const existingTeaching = await getTeachingByPrefixedId(teachingId);
      
//       if (!existingTeaching) {
//         return res.status(404).json({
//           success: false,
//           message: 'Teaching not found'
//         });
//       }
      
//       // Check ownership
//       if (existingTeaching.user_id !== req.user.id && !['admin', 'super_admin'].includes(req.user.role)) {
//         return res.status(403).json({
//           success: false,
//           message: 'You can only update your own teachings'
//         });
//       }
      
//       const updateData = req.body;
      
//       // Handle uploaded files
//       if (req.uploadedFiles && req.uploadedFiles.length > 0) {
//         updateData.media = req.uploadedFiles.map(file => ({
//           url: file.url,
//           type: file.type
//         }));
//       }
      
//       // Use your existing service
//       const updatedTeaching = await updateTeachingById(existingTeaching.id, updateData);
      
//       res.json({
//         success: true,
//         message: 'Teaching updated successfully',
//         data: {
//           teaching: updatedTeaching,
//           updated_by: req.user.username,
//           updated_at: new Date().toISOString()
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Update teaching error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to update teaching',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// /**
//  * DELETE /api/content/teachings/:teachingId
//  * Delete teaching
//  * ENHANCED FUNCTIONALITY - Uses existing service
//  */
// router.delete('/teachings/:teachingId',
//   requireMember ? requireMember : validateContentAccess('iko'),
//   ...(logMembershipAction ? [logMembershipAction('delete_teaching')] : []),
//   async (req, res, next) => {
//     try {
//       const teachingId = req.params.teachingId;
      
//       console.log(`🗑️ [${req.traceId || 'no-trace'}] Deleting teaching:`, teachingId);
      
//       // Get existing teaching to check ownership
//       const existingTeaching = await getTeachingByPrefixedId(teachingId);
      
//       if (!existingTeaching) {
//         return res.status(404).json({
//           success: false,
//           message: 'Teaching not found'
//         });
//       }
      
//       // Check ownership
//       if (existingTeaching.user_id !== req.user.id && !['admin', 'super_admin'].includes(req.user.role)) {
//         return res.status(403).json({
//           success: false,
//           message: 'You can only delete your own teachings'
//         });
//       }
      
//       // Use your existing service
//       const deleteResult = await deleteTeachingById(existingTeaching.id);
      
//       res.json({
//         success: true,
//         message: 'Teaching deleted successfully',
//         data: {
//           deleted_teaching: deleteResult,
//           deleted_by: req.user.username,
//           deleted_at: new Date().toISOString()
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Delete teaching error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to delete teaching',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// // ===============================================
// // USER CONTENT ROUTES
// // ===============================================

// /**
//  * GET /api/content/my-teachings
//  * Get current user's teachings
//  * NEW FUNCTIONALITY - Uses existing service
//  */
// router.get('/my-teachings',
//   requirePreMemberOrHigher ? requirePreMemberOrHigher : validateContentAccess('towncrier'),
//   validatePagination,
//   async (req, res, next) => {
//     try {
//       console.log(`📝 [${req.traceId || 'no-trace'}] Getting user teachings for:`, req.user.id);
      
//       // Use your existing service
//       const userTeachings = await getTeachingsByUserId(req.user.id);
      
//       // Apply pagination
//       const startIndex = req.pagination.offset;
//       const endIndex = startIndex + req.pagination.limit;
//       const paginatedTeachings = userTeachings.slice(startIndex, endIndex);
      
//       res.json({
//         success: true,
//         message: 'User teachings retrieved successfully',
//         data: {
//           teachings: paginatedTeachings,
//           pagination: {
//             current_page: req.pagination.page,
//             total_pages: Math.ceil(userTeachings.length / req.pagination.limit),
//             total_count: userTeachings.length,
//             limit: req.pagination.limit
//           },
//           user_stats: {
//             total_teachings: userTeachings.length,
//             latest_teaching: userTeachings[0]?.createdAt,
//             content_created: true
//           }
//         },
//         traceId: req.traceId || null
//       });
      
//     } catch (error) {
//       console.error(`❌ [${req.traceId || 'no-trace'}] Get user teachings error:`, error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get user teachings',
//         traceId: req.traceId || null
//       });
//     }
//   }
// );

// // ===============================================
// // COMPATIBILITY CHECK
// // ===============================================

// /**
//  * GET /api/content/compatibility
//  * Check what content features are available
//  */
// router.get('/compatibility', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Enhanced content routes compatibility check',
//     compatibility: {
//       version: '3.0',
//       available_features: {
//         towncrier_access: true,
//         iko_access: true,
//         teaching_management: true,
//         content_creation: true,
//         media_upload: !!uploadToS3,
//         personalized_feeds: true
//       },
//       middleware_available: {
//         membership_context: !!addMembershipContext,
//         access_validation: true,
//         action_logging: !!logMembershipAction,
//         upload_support: !!uploadMiddleware
//       },
//       services_available: {
//         teachings_service: true,
//         content_search: true
//       }
//     },
//     user: {
//       id: req.user.id,
//       username: req.user.username,
//       membership_stage: req.user.membership_stage,
//       can_access_towncrier: ['pre_member', 'member'].includes(req.user.membership_stage) || ['admin', 'super_admin'].includes(req.user.role),
//       can_access_iko: req.user.membership_stage === 'member' || ['admin', 'super_admin'].includes(req.user.role),
//       can_create_content: req.user.membership_stage === 'member' || ['admin', 'super_admin'].includes(req.user.role)
//     }
//   });
// });

// export default router;