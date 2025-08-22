// ikootaapi/controllers/classControllers.js
// CLASS MANAGEMENT CONTROLLERS - USER-FACING
// All controllers use services for business logic - no direct DB queries

import {
  getAllClassesService,
  getClassByIdService,
  getUserClassesService,
  joinClassService,
  leaveClassService,
  getClassParticipantsService,
  getAvailableClassesService,
  assignUserToClassService,
  getClassContentService,
  getClassScheduleService,
  markClassAttendanceService,
  getClassProgressService,
  submitClassFeedbackService,
  getClassFeedbackService,
  getClassAnnouncementsService
} from '../services/classServices.js';
import CustomError from '../utils/CustomError.js';

// ===============================================
// ERROR HANDLING WRAPPER
// ===============================================


const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error(`❌ Controller error in ${fn.name}:`, error);
      
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code || 'CUSTOM_ERROR',
          timestamp: new Date().toISOString(),
          ...(process.env.NODE_ENV === 'development' && { 
            stack: error.stack,
            details: error.details 
          })
        });
      }
      
      // Database constraint errors
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          error: 'Duplicate entry detected',
          code: 'DUPLICATE_ENTRY',
          timestamp: new Date().toISOString()
        });
      }
      
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
          success: false,
          error: 'Referenced record not found',
          code: 'INVALID_REFERENCE',
          timestamp: new Date().toISOString()
        });
      }

      if (error.code === 'ER_BAD_FIELD_ERROR') {
        return res.status(500).json({
          success: false,
          error: 'Database schema mismatch',
          code: 'SCHEMA_ERROR',
          timestamp: new Date().toISOString()
        });
      }
      
      // Generic server error
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        request_id: req.id || 'unknown',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message,
          stack: error.stack 
        })
      });
    }
  };
};

// const asyncHandler = (fn) => {
//   return async (req, res, next) => {
//     try {
//       await fn(req, res, next);
//     } catch (error) {
//       console.error(`❌ Controller error in ${fn.name}:`, error);
      
//       if (error instanceof CustomError) {
//         return res.status(error.statusCode).json({
//           success: false,
//           error: error.message,
//           code: error.code || 'CUSTOM_ERROR',
//           timestamp: new Date().toISOString()
//         });
//       }
      
//       // Database constraint errors
//       if (error.code === 'ER_DUP_ENTRY') {
//         return res.status(409).json({
//           success: false,
//           error: 'Duplicate entry detected',
//           code: 'DUPLICATE_ENTRY',
//           timestamp: new Date().toISOString()
//         });
//       }
      
//       res.status(500).json({
//         success: false,
//         error: 'Internal server error',
//         code: 'INTERNAL_ERROR',
//         timestamp: new Date().toISOString()
//       });
//     }
//   };
// };

// ===============================================
// CLASS DISCOVERY & ACCESS
// ===============================================



/**
 * GET /classes - Get all available classes with comprehensive filtering
 * This is the main endpoint that your frontend uses
 * Query params: page, limit, class_type, is_public, search, difficulty_level, has_space, created_after, created_before
 */
export const getAllClasses = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    class_type,
    is_public,
    search,
    difficulty_level,
    has_space,
    created_after,
    created_before,
    sort_by = 'createdAt',
    sort_order = 'DESC'
  } = req.query;

  // Use pagination from middleware if available
  const paginationParams = req.pagination || { page: parseInt(page), limit: parseInt(limit) };
  const sortingParams = req.sorting || { sort_by, sort_order };

  const filters = {
    class_type,
    is_public: is_public === 'true' ? true : is_public === 'false' ? false : undefined,
    search,
    difficulty_level,
    has_space: has_space === 'true' ? true : has_space === 'false' ? false : null,
    created_after,
    created_before
  };

  const options = {
    ...paginationParams,
    ...sortingParams
  };

  try {
    // Try to use the service if available, otherwise fallback to direct DB query
    let result;
    try {
      result = await getAllClassesService(filters, options);
    } catch (serviceError) {
      console.log('Service not available, using direct DB query:', serviceError.message);
      
      // Direct database query fallback
      let whereConditions = ['c.class_id LIKE "OTU#%"'];
      let queryParams = [];

      // Build WHERE conditions
      if (filters.class_type) {
        whereConditions.push('c.class_type = ?');
        queryParams.push(filters.class_type);
      }

      if (filters.is_public !== undefined) {
        whereConditions.push('c.is_public = ?');
        queryParams.push(filters.is_public);
      }

      if (filters.search) {
        whereConditions.push('(c.class_name LIKE ? OR c.description LIKE ?)');
        queryParams.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      if (filters.difficulty_level) {
        whereConditions.push('c.difficulty_level = ?');
        queryParams.push(filters.difficulty_level);
      }

      if (filters.created_after) {
        whereConditions.push('c.createdAt >= ?');
        queryParams.push(filters.created_after);
      }

      if (filters.created_before) {
        whereConditions.push('c.createdAt <= ?');
        queryParams.push(filters.created_before);
      }

      // Build ORDER BY clause
      const validSortFields = ['createdAt', 'updatedAt', 'class_name', 'class_type', 'max_members'];
      const sortField = validSortFields.includes(options.sort_by) ? options.sort_by : 'createdAt';
      const sortDirection = ['ASC', 'DESC'].includes(options.sort_order?.toUpperCase()) ? options.sort_order.toUpperCase() : 'DESC';

      // Main query
      const mainQuery = `
        SELECT 
          c.id,
          c.class_id,
          c.display_id,
          c.class_name,
          c.public_name,
          c.description,
          c.class_type,
          c.is_public,
          c.is_active,
          c.max_members,
          c.privacy_level,
          c.difficulty_level,
          c.category,
          c.tags,
          c.prerequisites,
          c.learning_objectives,
          c.estimated_duration,
          c.createdAt,
          c.updatedAt,
          COALESCE(cm.total_members, 0) as total_members,
          GREATEST(0, c.max_members - COALESCE(cm.total_members, 0)) as available_spots,
          CASE 
            WHEN COALESCE(cm.total_members, 0) >= c.max_members THEN true 
            ELSE false 
          END as is_full
        FROM classes c
        LEFT JOIN (
          SELECT 
            class_id, 
            COUNT(*) as total_members 
          FROM user_class_memberships 
          WHERE membership_status = 'active' 
          GROUP BY class_id
        ) cm ON c.class_id = cm.class_id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY c.${sortField} ${sortDirection}
        LIMIT ? OFFSET ?
      `;

      // Add pagination params
      queryParams.push(options.limit, (options.page - 1) * options.limit);

      // Execute main query
      const [classes] = await db.query(mainQuery, queryParams);

      // Count query for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM classes c
        WHERE ${whereConditions.join(' AND ')}
      `;

      const [countResult] = await db.query(countQuery, queryParams.slice(0, -2)); // Remove LIMIT and OFFSET params

      // Process results
      const processedClasses = classes.map(cls => {
        // Parse JSON fields
        if (cls.tags) {
          try { cls.tags = JSON.parse(cls.tags); } catch (e) { cls.tags = []; }
        }
        if (cls.prerequisites) {
          try { cls.prerequisites = JSON.parse(cls.prerequisites); } catch (e) { cls.prerequisites = []; }
        }
        if (cls.learning_objectives) {
          try { cls.learning_objectives = JSON.parse(cls.learning_objectives); } catch (e) { cls.learning_objectives = []; }
        }

        return cls;
      });

      const totalRecords = countResult[0].total;
      const totalPages = Math.ceil(totalRecords / options.limit);

      result = {
        data: processedClasses,
        pagination: {
          page: options.page,
          limit: options.limit,
          total_pages: totalPages,
          total_records: totalRecords,
          has_next: options.page < totalPages,
          has_prev: options.page > 1
        },
        summary: {
          total_classes: totalRecords,
          active_classes: processedClasses.filter(c => c.is_active).length,
          public_classes: processedClasses.filter(c => c.is_public).length,
          classes_with_space: processedClasses.filter(c => c.available_spots > 0).length
        }
      };
    }

    res.json({
      success: true,
      message: 'Classes retrieved successfully',
      ...result,
      filters_applied: Object.keys(filters).filter(key => filters[key] !== undefined).length,
      performance: {
        query_time: new Date().toISOString(),
        total_results: result.pagination?.total_records || result.data?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in getAllClasses:', error);
    throw error;
  }
});

/**
 * GET /classes - Get all available classes
 */
// export const getAllClasses = asyncHandler(async (req, res) => {
//   const {
//     page = 1,
//     limit = 20,
//     class_type,
//     is_public,
//     search,
//     difficulty_level,
//     has_space,
//     created_after,
//     created_before,
//     sort_by = 'createdAt',
//     sort_order = 'DESC'
//   } = req.query;

//   const filters = {
//     class_type,
//     is_public: is_public === 'true' ? true : is_public === 'false' ? false : undefined,
//     search,
//     difficulty_level,
//     has_space: has_space === 'true' ? true : has_space === 'false' ? false : null,
//     created_after,
//     created_before
//   };

//   const options = {
//     page: parseInt(page),
//     limit: parseInt(limit),
//     sort_by,
//     sort_order
//   };

//   const result = await getAllClassesService(filters, options);

//   res.json({
//     success: true,
//     message: 'Classes retrieved successfully',
//     ...result,
//     filters_applied: Object.keys(filters).filter(key => filters[key] !== undefined).length
//   });
// });



/**
 * GET /classes/:id - Get specific class details
 * Shows different levels of detail based on user's membership status
 */
export const getClassById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    // Try service first, fallback to direct query
    let classData;
    try {
      classData = await getClassByIdService(id, userId);
    } catch (serviceError) {
      console.log('Service not available, using direct DB query:', serviceError.message);
      
      // Direct database query
      const [classResult] = await db.query(`
        SELECT 
          c.id,
          c.class_id,
          c.display_id,
          c.class_name,
          c.public_name,
          c.description,
          c.class_type,
          c.is_public,
          c.is_active,
          c.max_members,
          c.privacy_level,
          c.difficulty_level,
          c.category,
          c.tags,
          c.prerequisites,
          c.learning_objectives,
          c.estimated_duration,
          c.requirements,
          c.auto_approve_members,
          c.allow_self_join,
          c.enable_notifications,
          c.enable_discussions,
          c.createdAt,
          c.updatedAt,
          COALESCE(cm.total_members, 0) as total_members,
          GREATEST(0, c.max_members - COALESCE(cm.total_members, 0)) as available_spots,
          CASE 
            WHEN COALESCE(cm.total_members, 0) >= c.max_members THEN true 
            ELSE false 
          END as is_full
        FROM classes c
        LEFT JOIN (
          SELECT 
            class_id, 
            COUNT(*) as total_members 
          FROM user_class_memberships 
          WHERE membership_status = 'active' 
          GROUP BY class_id
        ) cm ON c.class_id = cm.class_id
        WHERE c.class_id = ?
      `, [id]);

      if (classResult.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Class not found',
          class_id: id,
          timestamp: new Date().toISOString()
        });
      }

      classData = classResult[0];

      // Parse JSON fields
      if (classData.tags) {
        try { classData.tags = JSON.parse(classData.tags); } catch (e) { classData.tags = []; }
      }
      if (classData.prerequisites) {
        try { classData.prerequisites = JSON.parse(classData.prerequisites); } catch (e) { classData.prerequisites = []; }
      }
      if (classData.learning_objectives) {
        try { classData.learning_objectives = JSON.parse(classData.learning_objectives); } catch (e) { classData.learning_objectives = []; }
      }

      // Add user context if authenticated
      if (userId) {
        const [membershipResult] = await db.query(`
          SELECT 
            role_in_class,
            membership_status,
            receive_notifications,
            joinedAt
          FROM user_class_memberships 
          WHERE user_id = ? AND class_id = ?
        `, [userId, id]);

        classData.user_context = {
          is_member: membershipResult.length > 0,
          membership_status: membershipResult[0]?.membership_status || null,
          role: membershipResult[0]?.role_in_class || null,
          joined_at: membershipResult[0]?.joinedAt || null,
          can_join: membershipResult.length === 0 && classData.allow_self_join && !classData.is_full,
          can_leave: membershipResult.length > 0 && membershipResult[0].membership_status === 'active'
        };
      }
    }

    // Determine response level based on access
    let responseLevel = 'basic';
    if (classData.user_context?.is_member) {
      responseLevel = 'member';
    }
    if (classData.user_context?.role === 'moderator' || classData.user_context?.role === 'instructor') {
      responseLevel = 'admin';
    }

    res.json({
      success: true,
      message: 'Class retrieved successfully',
      data: classData,
      access_level: responseLevel,
      user_permissions: classData.user_context || null
    });

  } catch (error) {
    console.error('Error in getClassById:', error);
    throw error;
  }
});


/**
 * GET /classes/:id - Get specific class details
 */
// export const getClassById = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const userId = req.user?.id;

//   const classData = await getClassByIdService(id, userId);

//   res.json({
//     success: true,
//     message: 'Class retrieved successfully',
//     data: classData,
//     access_level: userId ? (classData.user_context?.is_member ? 'member' : 'visitor') : 'public'
//   });
// });


/**
 * GET /classes/my-classes - Get user's enrolled classes (requires authentication)
 */
// export const getUserClasses = asyncHandler(async (req, res) => {
//   const userId = req.user.id;
//   const {
//     page = 1,
//     limit = 20,
//     role_in_class,
//     membership_status = 'active',
//     include_expired = 'false',
//     sort_by = 'joinedAt',
//     sort_order = 'DESC'
//   } = req.query;

//   const paginationParams = req.pagination || { page: parseInt(page), limit: parseInt(limit) };

//   const options = {
//     ...paginationParams,
//     role_in_class,
//     membership_status,
//     include_expired: include_expired === 'true',
//     sort_by,
//     sort_order
//   };

//   try {
//     // Try service first, fallback to direct query
//     let result;
//     try {
//       result = await getUserClassesService(userId, options);
//     } catch (serviceError) {
//       console.log('Service not available, using direct DB query:', serviceError.message);
      
//       // Direct database query
//       let whereConditions = ['ucm.user_id = ?'];
//       let queryParams = [userId];

//       if (options.role_in_class) {
//         whereConditions.push('ucm.role_in_class = ?');
//         queryParams.push(options.role_in_class);
//       }

//       if (options.membership_status) {
//         whereConditions.push('ucm.membership_status = ?');
//         queryParams.push(options.membership_status);
//       }

//       if (!options.include_expired) {
//         whereConditions.push('(ucm.expires_at IS NULL OR ucm.expires_at > NOW())');
//       }

//       const validSortFields = ['joinedAt', 'class_name', 'createdAt', 'role_in_class'];
//       const sortField = validSortFields.includes(options.sort_by) ? options.sort_by : 'joinedAt';
//       const sortDirection = ['ASC', 'DESC'].includes(options.sort_order?.toUpperCase()) ? options.sort_order.toUpperCase() : 'DESC';

//       const mainQuery = `
//         SELECT 
//           c.id,
//           c.class_id,
//           c.display_id,
//           c.class_name,
//           c.public_name,
//           c.description,
//           c.class_type,
//           c.is_public,
//           c.is_active,
//           c.max_members,
//           c.difficulty_level,
//           c.category,
//           c.tags,
//           c.createdAt as class_created_at,
//           ucm.role_in_class,
//           ucm.membership_status,
//           ucm.receive_notifications,
//           ucm.joinedAt,
//           ucm.expires_at,
//           COALESCE(cm.total_members, 0) as total_members,
//           GREATEST(0, c.max_members - COALESCE(cm.total_members, 0)) as available_spots
//         FROM user_class_memberships ucm
//         JOIN classes c ON ucm.class_id = c.class_id
//         LEFT JOIN (
//           SELECT 
//             class_id, 
//             COUNT(*) as total_members 
//           FROM user_class_memberships 
//           WHERE membership_status = 'active' 
//           GROUP BY class_id
//         ) cm ON c.class_id = cm.class_id
//         WHERE ${whereConditions.join(' AND ')}
//         ORDER BY ${sortField === 'class_name' ? 'c.class_name' : sortField === 'createdAt' ? 'c.createdAt' : 'ucm.' + sortField} ${sortDirection}
//         LIMIT ? OFFSET ?
//       `;

//       queryParams.push(options.limit, (options.page - 1) * options.limit);

//       const [classes] = await db.query(mainQuery, queryParams);

//       // Count query
//       const countQuery = `
//         SELECT COUNT(*) as total
//         FROM user_class_memberships ucm
//         JOIN classes c ON ucm.class_id = c.class_id
//         WHERE ${whereConditions.join(' AND ')}
//       `;

//       const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));

//       // Process results
//       const processedClasses = classes.map(cls => {
//         if (cls.tags) {
//           try { cls.tags = JSON.parse(cls.tags); } catch (e) { cls.tags = []; }
//         }
//         return cls;
//       });

//       const totalRecords = countResult[0].total;
//       const totalPages = Math.ceil(totalRecords / options.limit);

//       result = {
//         data: processedClasses,
//         pagination: {
//           page: options.page,
//           limit: options.limit,
//           total_pages: totalPages,
//           total_records: totalRecords,
//           has_next: options.page < totalPages,
//           has_prev: options.page > 1
//         },
//         summary: {
//           total_enrolled: totalRecords,
//           active_memberships: processedClasses.filter(c => c.membership_status === 'active').length,
//           roles: [...new Set(processedClasses.map(c => c.role_in_class))]
//         }
//       };
//     }

//     res.json({
//       success: true,
//       message: 'User classes retrieved successfully',
//       ...result,
//       user_id: userId,
//       username: req.user.username
//     });

//   } catch (error) {
//     console.error('Error in getUserClasses:', error);
//     throw error;
//   }
// });

/**
 * GET /classes/my-classes - Get user's enrolled classes
 */
export const getUserClasses = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    page = 1,
    limit = 20,
    role_in_class,
    membership_status = 'active',
    include_expired = 'false',
    sort_by = 'joinedAt',
    sort_order = 'DESC'
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    role_in_class,
    membership_status,
    include_expired: include_expired === 'true',
    sort_by,
    sort_order
  };

  const result = await getUserClassesService(userId, options);

  res.json({
    success: true,
    message: 'User classes retrieved successfully',
    ...result,
    user_id: userId,
    username: req.user.username
  });
});

/**
 * GET /classes/available - Get available classes for user
 */
export const getAvailableClasses = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to view available classes',
      timestamp: new Date().toISOString()
    });
  }

  const userId = req.user.id;
  const {
    page = 1,
    limit = 20,
    class_type,
    search,
    difficulty_level,
    exclude_full = 'true'
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    class_type,
    search,
    difficulty_level,
    exclude_full: exclude_full === 'true',
    membershipStage: req.user.membership_stage,
    fullMembershipStatus: req.user.full_membership_status
  };

  const result = await getAvailableClassesService(userId, options);

  res.json({
    success: true,
    message: 'Available classes retrieved successfully',
    ...result
  });
});

/**
 * GET /classes/available - Get classes available to user for joining
 * Alternative endpoint that filters out classes user is already a member of
 */
// export const getAvailableClasses = asyncHandler(async (req, res) => {
//   if (!req.user) {
//     return res.status(401).json({
//       success: false,
//       error: 'Authentication required to view available classes',
//       timestamp: new Date().toISOString()
//     });
//   }

//   const userId = req.user.id;
//   const {
//     page = 1,
//     limit = 20,
//     class_type,
//     search,
//     difficulty_level,
//     exclude_full = 'true'
//   } = req.query;

//   try {
//     // Get classes user is not already a member of
//     let whereConditions = [
//       'c.class_id LIKE "OTU#%"',
//       'c.is_active = true',
//       'c.allow_self_join = true',
//       'c.class_id NOT IN (SELECT class_id FROM user_class_memberships WHERE user_id = ?)'
//     ];
//     let queryParams = [userId];

//     if (class_type) {
//       whereConditions.push('c.class_type = ?');
//       queryParams.push(class_type);
//     }

//     if (search) {
//       whereConditions.push('(c.class_name LIKE ? OR c.description LIKE ?)');
//       queryParams.push(`%${search}%`, `%${search}%`);
//     }

//     if (difficulty_level) {
//       whereConditions.push('c.difficulty_level = ?');
//       queryParams.push(difficulty_level);
//     }

//     if (exclude_full === 'true') {
//       whereConditions.push('COALESCE(cm.total_members, 0) < c.max_members');
//     }

//     const mainQuery = `
//       SELECT 
//         c.id,
//         c.class_id,
//         c.display_id,
//         c.class_name,
//         c.public_name,
//         c.description,
//         c.class_type,
//         c.is_public,
//         c.max_members,
//         c.difficulty_level,
//         c.category,
//         c.tags,
//         c.createdAt,
//         COALESCE(cm.total_members, 0) as total_members,
//         GREATEST(0, c.max_members - COALESCE(cm.total_members, 0)) as available_spots,
//         CASE 
//           WHEN COALESCE(cm.total_members, 0) >= c.max_members THEN true 
//           ELSE false 
//         END as is_full
//       FROM classes c
//       LEFT JOIN (
//         SELECT 
//           class_id, 
//           COUNT(*) as total_members 
//         FROM user_class_memberships 
//         WHERE membership_status = 'active' 
//         GROUP BY class_id
//       ) cm ON c.class_id = cm.class_id
//       WHERE ${whereConditions.join(' AND ')}
//       ORDER BY c.createdAt DESC
//       LIMIT ? OFFSET ?
//     `;

//     queryParams.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

//     const [classes] = await db.query(mainQuery, queryParams);

//     // Count query
//     const countQuery = `
//       SELECT COUNT(*) as total
//       FROM classes c
//       LEFT JOIN (
//         SELECT 
//           class_id, 
//           COUNT(*) as total_members 
//         FROM user_class_memberships 
//         WHERE membership_status = 'active' 
//         GROUP BY class_id
//       ) cm ON c.class_id = cm.class_id
//       WHERE ${whereConditions.join(' AND ')}
//     `;

//     const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));

//     // Process results
//     const processedClasses = classes.map(cls => {
//       if (cls.tags) {
//         try { cls.tags = JSON.parse(cls.tags); } catch (e) { cls.tags = []; }
//       }
//       return cls;
//     });

//     const totalRecords = countResult[0].total;
//     const totalPages = Math.ceil(totalRecords / parseInt(limit));

//     res.json({
//       success: true,
//       message: 'Available classes retrieved successfully',
//       data: processedClasses,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total_pages: totalPages,
//         total_records: totalRecords,
//         has_next: parseInt(page) < totalPages,
//         has_prev: parseInt(page) > 1
//       },
//       user_context: {
//         user_id: userId,
//         membership_stage: req.user.membership_stage,
//         full_membership_status: req.user.full_membership_status
//       }
//     });

//   } catch (error) {
//     console.error('Error in getAvailableClasses:', error);
//     throw error;
//   }
// });

// ===============================================
// CLASS ENROLLMENT
// ===============================================

/**
 * POST /classes/:id/join - Join a class
 */
export const joinClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    join_reason,
    role_in_class = 'member',
    receive_notifications = true
  } = req.body;

  if (role_in_class && !['member', 'assistant'].includes(role_in_class)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid role. Users can only join as member or assistant',
      allowed_roles: ['member', 'assistant'],
      provided: role_in_class
    });
  }

  const options = {
    role_in_class,
    receive_notifications: Boolean(receive_notifications),
    join_reason
  };

  const result = await joinClassService(userId, id, options);
  const statusCode = result.membership_status === 'active' ? 201 : 202;

  res.status(statusCode).json({
    success: true,
    ...result,
    user_id: userId,
    username: req.user.username
  });
});

/**
 * POST /classes/:id/join - Join a class
 * Body: { join_reason?, role_in_class?, receive_notifications? }
 */
// export const joinClass = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const userId = req.user.id;
//   const {
//     join_reason,
//     role_in_class = 'member',
//     receive_notifications = true
//   } = req.body;

//   // Validate role if provided
//   if (role_in_class && !['member', 'assistant'].includes(role_in_class)) {
//     return res.status(400).json({
//       success: false,
//       error: 'Invalid role. Users can only join as member or assistant',
//       allowed_roles: ['member', 'assistant'],
//       provided: role_in_class
//     });
//   }

//   try {
//     // Try service first, fallback to direct implementation
//     let result;
//     try {
//       const options = {
//         role_in_class,
//         receive_notifications: Boolean(receive_notifications),
//         join_reason
//       };
//       result = await joinClassService(userId, id, options);
//     } catch (serviceError) {
//       console.log('Service not available, using direct implementation:', serviceError.message);
      
//       // Check if class exists and is joinable
//       const [classCheck] = await db.query(`
//         SELECT 
//           class_id, 
//           class_name, 
//           max_members, 
//           is_active, 
//           allow_self_join,
//           auto_approve_members,
//           COALESCE(cm.total_members, 0) as current_members
//         FROM classes c
//         LEFT JOIN (
//           SELECT 
//             class_id, 
//             COUNT(*) as total_members 
//           FROM user_class_memberships 
//           WHERE membership_status = 'active' 
//           GROUP BY class_id
//         ) cm ON c.class_id = cm.class_id
//         WHERE c.class_id = ?
//       `, [id]);

//       if (classCheck.length === 0) {
//         return res.status(404).json({
//           success: false,
//           error: 'Class not found',
//           class_id: id,
//           timestamp: new Date().toISOString()
//         });
//       }

//       const classInfo = classCheck[0];

//       if (!classInfo.is_active) {
//         return res.status(400).json({
//           success: false,
//           error: 'Class is not active',
//           class_id: id,
//           class_name: classInfo.class_name
//         });
//       }

//       if (!classInfo.allow_self_join) {
//         return res.status(403).json({
//           success: false,
//           error: 'Class does not allow self-joining',
//           class_id: id,
//           class_name: classInfo.class_name
//         });
//       }

//       if (classInfo.current_members >= classInfo.max_members) {
//         return res.status(400).json({
//           success: false,
//           error: 'Class is full',
//           class_id: id,
//           class_name: classInfo.class_name,
//           max_members: classInfo.max_members,
//           current_members: classInfo.current_members
//         });
//       }

//       // Check if user is already a member
//       const [existingMembership] = await db.query(
//         'SELECT membership_status FROM user_class_memberships WHERE user_id = ? AND class_id = ?',
//         [userId, id]
//       );

//       if (existingMembership.length > 0) {
//         return res.status(409).json({
//           success: false,
//           error: 'User is already a member of this class',
//           current_status: existingMembership[0].membership_status,
//           class_id: id
//         });
//       }

//       // Create membership
//       const membershipStatus = classInfo.auto_approve_members ? 'active' : 'pending';
//       const membershipData = {
//         user_id: userId,
//         class_id: id,
//         role_in_class,
//         membership_status: membershipStatus,
//         receive_notifications: Boolean(receive_notifications),
//         join_reason: join_reason || null,
//         joinedAt: new Date(),
//         createdAt: new Date(),
//         updatedAt: new Date()
//       };

//       const [insertResult] = await db.query(`
//         INSERT INTO user_class_memberships 
//         (user_id, class_id, role_in_class, membership_status, receive_notifications, join_reason, joinedAt, createdAt, updatedAt)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `, [
//         membershipData.user_id,
//         membershipData.class_id,
//         membershipData.role_in_class,
//         membershipData.membership_status,
//         membershipData.receive_notifications,
//         membershipData.join_reason,
//         membershipData.joinedAt,
//         membershipData.createdAt,
//         membershipData.updatedAt
//       ]);

//       result = {
//         message: membershipStatus === 'active' 
//           ? 'Successfully joined class' 
//           : 'Join request submitted, awaiting approval',
//         data: {
//           membership_id: insertResult.insertId,
//           class_id: id,
//           class_name: classInfo.class_name,
//           user_id: userId,
//           role_in_class: membershipData.role_in_class,
//           membership_status: membershipData.membership_status,
//           joined_at: membershipData.joinedAt,
//           requires_approval: !classInfo.auto_approve_members
//         }
//       };
//     }

//     const statusCode = result.data?.membership_status === 'active' ? 201 : 202;

//     res.status(statusCode).json({
//       success: true,
//       ...result,
//       user_id: userId,
//       username: req.user.username
//     });

//   } catch (error) {
//     console.error('Error in joinClass:', error);
//     throw error;
//   }
// });

/**
 * POST /classes/:id/leave - Leave a class
 */
export const leaveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { reason } = req.body;

  const options = {
    reason,
    notify_moderators: true
  };

  const result = await leaveClassService(userId, id, options);

  res.json({
    success: true,
    ...result,
    user_id: userId,
    username: req.user.username
  });
});

/**
 * POST /classes/:id/leave - Leave a class
 * Body: { reason? }
 */
// export const leaveClass = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const userId = req.user.id;
//   const { reason } = req.body;

//   try {
//     // Try service first, fallback to direct implementation
//     let result;
//     try {
//       const options = {
//         reason,
//         notify_moderators: true
//       };
//       result = await leaveClassService(userId, id, options);
//     } catch (serviceError) {
//       console.log('Service not available, using direct implementation:', serviceError.message);
      
//       // Check if membership exists
//       const [membershipCheck] = await db.query(`
//         SELECT ucm.*, c.class_name
//         FROM user_class_memberships ucm
//         JOIN classes c ON ucm.class_id = c.class_id
//         WHERE ucm.user_id = ? AND ucm.class_id = ?
//       `, [userId, id]);

//       if (membershipCheck.length === 0) {
//         return res.status(404).json({
//           success: false,
//           error: 'You are not a member of this class',
//           class_id: id,
//           user_id: userId
//         });
//       }

//       const membership = membershipCheck[0];

//       // Remove membership
//       const [deleteResult] = await db.query(
//         'DELETE FROM user_class_memberships WHERE user_id = ? AND class_id = ?',
//         [userId, id]
//       );

//       if (deleteResult.affectedRows === 0) {
//         return res.status(500).json({
//           success: false,
//           error: 'Failed to leave class',
//           class_id: id
//         });
//       }

//       result = {
//         message: 'Successfully left class',
//         data: {
//           class_id: id,
//           class_name: membership.class_name,
//           user_id: userId,
//           previous_role: membership.role_in_class,
//           leave_reason: reason || 'No reason provided',
//           left_at: new Date()
//         }
//       };
//     }

//     res.json({
//       success: true,
//       ...result,
//       user_id: userId,
//       username: req.user.username
//     });

//   } catch (error) {
//     console.error('Error in leaveClass:', error);
//     throw error;
//   }
// });

/**
 * POST /classes/assign - Admin assign user to class
 */
export const assignUserToClass = asyncHandler(async (req, res) => {
  const {
    userId,
    user_id,
    classId,
    class_id,
    role_in_class = 'member',
    assignment_reason
  } = req.body;

  const targetUserId = userId || user_id;
  const targetClassId = classId || class_id;
  const assignedBy = req.user.id;

  if (!targetUserId || !targetClassId) {
    return res.status(400).json({
      success: false,
      error: 'userId and classId are required',
      required_fields: ['userId', 'classId']
    });
  }

  // Check if user has permission
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin privileges required for this operation',
      required_role: 'admin'
    });
  }

  const options = {
    role_in_class,
    assigned_by: assignedBy,
    receive_notifications: true,
    assignment_reason
  };

  const result = await assignUserToClassService(targetUserId, targetClassId, options);

  res.status(201).json({
    success: true,
    message: 'User assigned to class successfully',
    ...result,
    assigned_by: req.user.username
  });
});

/**
 * POST /classes/assign - Assign user to class (for admin use and compatibility)
 * Body: { userId, classId, role_in_class?, assigned_by? }
 */
// export const assignUserToClass = asyncHandler(async (req, res) => {
//   const {
//     userId,
//     user_id,
//     classId,
//     class_id,
//     role_in_class = 'member',
//     assignment_reason
//   } = req.body;

//   const targetUserId = userId || user_id;
//   const targetClassId = classId || class_id;
//   const assignedBy = req.user.id;

//   if (!targetUserId || !targetClassId) {
//     return res.status(400).json({
//       success: false,
//       error: 'userId and classId are required',
//       required_fields: ['userId', 'classId'],
//       provided: { userId: targetUserId, classId: targetClassId }
//     });
//   }

//   // Check if user has permission to assign (must be admin or class moderator)
//   const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
//   let isModerator = false;

//   if (!isAdmin) {
//     // Check if user is moderator of the target class
//     try {
//       const [membership] = await db.query(
//         'SELECT role_in_class FROM user_class_memberships WHERE user_id = ? AND class_id = ? AND membership_status = "active" AND role_in_class IN ("moderator", "instructor")',
//         [assignedBy, targetClassId]
//       );
//       isModerator = membership.length > 0;
//     } catch (error) {
//       console.warn('Could not verify moderator status:', error.message);
//     }
//   }

//   if (!isAdmin && !isModerator) {
//     return res.status(403).json({
//       success: false,
//       error: 'You do not have permission to assign users to classes',
//       required_permissions: ['admin', 'class_moderator']
//     });
//   }

//   try {
//     // Check if class exists
//     const [classCheck] = await db.query(
//       'SELECT class_id, class_name, max_members FROM classes WHERE class_id = ? AND is_active = true',
//       [targetClassId]
//     );

//     if (classCheck.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'Active class not found',
//         class_id: targetClassId
//       });
//     }

//     // Check if user exists
//     const [userCheck] = await db.query(
//       'SELECT id, username FROM users WHERE id = ?',
//       [targetUserId]
//     );

//     if (userCheck.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'User not found',
//         user_id: targetUserId
//       });
//     }

//     // Check if user is already a member
//     const [existingMembership] = await db.query(
//       'SELECT membership_status FROM user_class_memberships WHERE user_id = ? AND class_id = ?',
//       [targetUserId, targetClassId]
//     );

//     if (existingMembership.length > 0) {
//       return res.status(409).json({
//         success: false,
//         error: 'User is already a member of this class',
//         current_status: existingMembership[0].membership_status,
//         user_id: targetUserId,
//         class_id: targetClassId
//       });
//     }

//     // Create membership
//     const membershipData = {
//       user_id: targetUserId,
//       class_id: targetClassId,
//       role_in_class,
//       membership_status: 'active',
//       receive_notifications: true,
//       assignment_reason: assignment_reason || null,
//       assigned_by: assignedBy,
//       joinedAt: new Date(),
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };

//     const [insertResult] = await db.query(`
//       INSERT INTO user_class_memberships 
//       (user_id, class_id, role_in_class, membership_status, receive_notifications, assignment_reason, assigned_by, joinedAt, createdAt, updatedAt)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `, [
//       membershipData.user_id,
//       membershipData.class_id,
//       membershipData.role_in_class,
//       membershipData.membership_status,
//       membershipData.receive_notifications,
//       membershipData.assignment_reason,
//       membershipData.assigned_by,
//       membershipData.joinedAt,
//       membershipData.createdAt,
//       membershipData.updatedAt
//     ]);

//     const result = {
//       membership_id: insertResult.insertId,
//       class_id: targetClassId,
//       class_name: classCheck[0].class_name,
//       user_id: targetUserId,
//       username: userCheck[0].username,
//       role_in_class: membershipData.role_in_class,
//       membership_status: membershipData.membership_status,
//       assigned_by: req.user.username,
//       joined_at: membershipData.joinedAt
//     };

//     res.status(201).json({
//       success: true,
//       message: 'User assigned to class successfully',
//       data: result,
//       assigned_by: assignedBy,
//       assignment_type: isAdmin ? 'admin_assignment' : 'moderator_assignment'
//     });

//   } catch (error) {
//     console.error('Error in assignUserToClass:', error);
//     throw error;
//   }
// });

// ===============================================
// CLASS PARTICIPANTS
// ===============================================

/**
 * GET /classes/:id/members - Get class members
 */
export const getClassMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    role_in_class,
    membership_status = 'active',
    page = 1,
    limit = 50,
    search,
    sort_by = 'joinedAt',
    sort_order = 'DESC'
  } = req.query;

  const options = {
    role_in_class,
    membership_status,
    search,
    page: parseInt(page),
    limit: parseInt(limit),
    sort_by,
    sort_order
  };

  const result = await getClassParticipantsService(id, userId, options);

  res.json({
    success: true,
    message: 'Class members retrieved successfully',
    ...result,
    class_id: id
  });
});

// Alias for compatibility
//export const getClassParticipants = getClassMembers;


// ===============================================
// CLASS PARTICIPANTS (Members)
// ===============================================

/**
 * GET /classes/:id/members - Get class members (changed from /participants for frontend compatibility)
 * Note: This matches your frontend expectation from AudienceClassMgr.jsx
 */
export const getClassParticipants = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    role_in_class,
    membership_status = 'active',
    page = 1,
    limit = 50,
    search,
    sort_by = 'joinedAt',
    sort_order = 'DESC'
  } = req.query;

  const paginationParams = req.pagination || { page: parseInt(page), limit: parseInt(limit) };

  const options = {
    role_in_class,
    membership_status,
    search,
    ...paginationParams,
    sort_by,
    sort_order
  };

  try {
    // Try service first, fallback to direct implementation
    let result;
    try {
      result = await getClassParticipantsService(id, userId, options);
    } catch (serviceError) {
      console.log('Service not available, using direct implementation:', serviceError.message);
      
      // Check if user has access to view members
      const [membershipCheck] = await db.query(
        'SELECT role_in_class, membership_status FROM user_class_memberships WHERE user_id = ? AND class_id = ?',
        [userId, id]
      );

      if (membershipCheck.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'You must be a member of this class to view members',
          class_id: id
        });
      }

      // Build query
      let whereConditions = ['ucm.class_id = ?', 'ucm.membership_status = ?'];
      let queryParams = [id, options.membership_status];

      if (options.role_in_class) {
        whereConditions.push('ucm.role_in_class = ?');
        queryParams.push(options.role_in_class);
      }

      if (options.search) {
        whereConditions.push('(u.username LIKE ? OR u.name LIKE ?)');
        queryParams.push(`%${options.search}%`, `%${options.search}%`);
      }

      const validSortFields = ['joinedAt', 'username', 'name', 'role_in_class'];
      const sortField = validSortFields.includes(options.sort_by) ? options.sort_by : 'joinedAt';
      const sortDirection = ['ASC', 'DESC'].includes(options.sort_order?.toUpperCase()) ? options.sort_order.toUpperCase() : 'DESC';

      const mainQuery = `
        SELECT 
          u.id,
          u.username,
          u.name,
          u.email,
          u.avatar_url,
          ucm.role_in_class,
          ucm.membership_status,
          ucm.receive_notifications,
          ucm.joinedAt,
          ucm.expires_at,
          CASE 
            WHEN ucm.expires_at IS NULL OR ucm.expires_at > NOW() THEN true 
            ELSE false 
          END as is_active
        FROM user_class_memberships ucm
        JOIN users u ON ucm.user_id = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY ${sortField === 'username' || sortField === 'name' ? 'u.' + sortField : 'ucm.' + sortField} ${sortDirection}
        LIMIT ? OFFSET ?
      `;

      queryParams.push(options.limit, (options.page - 1) * options.limit);

      const [members] = await db.query(mainQuery, queryParams);

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_class_memberships ucm
        JOIN users u ON ucm.user_id = u.id
        WHERE ${whereConditions.join(' AND ')}
      `;

      const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));

      const totalRecords = countResult[0].total;
      const totalPages = Math.ceil(totalRecords / options.limit);

      result = {
        data: members,
        pagination: {
          page: options.page,
          limit: options.limit,
          total_pages: totalPages,
          total_records: totalRecords,
          has_next: options.page < totalPages,
          has_prev: options.page > 1
        },
        summary: {
          total_members: totalRecords,
          active_members: members.filter(m => m.is_active).length,
          roles: [...new Set(members.map(m => m.role_in_class))]
        }
      };
    }

    res.json({
      success: true,
      message: 'Class members retrieved successfully',
      ...result,
      class_id: id,
      privacy_note: 'Member information filtered based on your role and privacy settings'
    });

  } catch (error) {
    console.error('Error in getClassParticipants:', error);
    throw error;
  }
});


// ===============================================
// CLASS CONTENT & SCHEDULE
// ===============================================

/**
 * GET /classes/:id/content - Get class content
 */
export const getClassContent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    content_type,
    access_level,
    page = 1,
    limit = 20,
    sort_by = 'createdAt',
    sort_order = 'DESC'
  } = req.query;

  const options = {
    content_type,
    access_level,
    page: parseInt(page),
    limit: parseInt(limit),
    sort_by,
    sort_order
  };

  const result = await getClassContentService(id, userId, options);

  res.json({
    success: true,
    message: 'Class content retrieved successfully',
    ...result,
    class_id: id
  });
});

/**
 * GET /classes/:id/content - Get class content with user permissions
 * Query: content_type?, access_level?, page?, limit?, sort_by?, sort_order?
 */
// export const getClassContent = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const userId = req.user.id;
//   const {
//     content_type,
//     access_level,
//     page = 1,
//     limit = 20,
//     sort_by = 'createdAt',
//     sort_order = 'DESC'
//   } = req.query;

//   try {
//     // Check if user has access to this class
//     const [membershipCheck] = await db.query(
//       'SELECT role_in_class, membership_status FROM user_class_memberships WHERE user_id = ? AND class_id = ?',
//       [userId, id]
//     );

//     if (membershipCheck.length === 0) {
//       return res.status(403).json({
//         success: false,
//         error: 'You must be a member of this class to view content',
//         class_id: id
//       });
//     }

//     // For now, return placeholder structure since content management is complex
//     // This can be expanded based on your content storage strategy
//     const content = {
//       announcements: [],
//       materials: [],
//       assignments: [],
//       discussions: [],
//       resources: []
//     };

//     res.json({
//       success: true,
//       message: 'Class content retrieved successfully',
//       data: content,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total_pages: 1,
//         total_records: 0
//       },
//       user_context: {
//         role: membershipCheck[0].role_in_class,
//         can_edit: ['instructor', 'moderator'].includes(membershipCheck[0].role_in_class)
//       },
//       class_id: id,
//       implementation_note: 'Content management system to be fully implemented',
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error in getClassContent:', error);
//     throw error;
//   }
// });

/**
 * GET /classes/:id/schedule - Get class schedule
 */
export const getClassSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const {
    start_date,
    end_date,
    timezone = 'UTC',
    include_past = 'false'
  } = req.query;

  const options = {
    start_date,
    end_date,
    timezone,
    include_past: include_past === 'true'
  };

  const result = await getClassScheduleService(id, userId, options);

  res.json({
    success: true,
    message: 'Class schedule retrieved successfully',
    data: result
  });
});

/**
 * GET /classes/:id/schedule - Get class schedule
 * Query: start_date?, end_date?, timezone?, include_past?
 */
// export const getClassSchedule = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const userId = req.user?.id;
//   const {
//     start_date,
//     end_date,
//     timezone = 'UTC',
//     include_past = 'false'
//   } = req.query;

//   try {
//     // Check if class exists
//     const [classCheck] = await db.query(
//       'SELECT class_id, class_name, class_schedule FROM classes WHERE class_id = ?',
//       [id]
//     );

//     if (classCheck.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'Class not found',
//         class_id: id,
//         timestamp: new Date().toISOString()
//       });
//     }

//     const classInfo = classCheck[0];
//     let schedule = null;

//     // Parse stored schedule if available
//     if (classInfo.class_schedule) {
//       try {
//         schedule = JSON.parse(classInfo.class_schedule);
//       } catch (e) {
//         console.warn('Failed to parse class schedule:', e.message);
//       }
//     }

//     // If no stored schedule, create a basic placeholder
//     if (!schedule) {
//       schedule = {
//         sessions: [],
//         recurring_pattern: null,
//         timezone: timezone,
//         note: 'Schedule not yet configured for this class'
//       };
//     }

//     // Filter by date range if provided
//     if (schedule.sessions && (start_date || end_date || include_past === 'false')) {
//       const now = new Date();
//       schedule.sessions = schedule.sessions.filter(session => {
//         const sessionDate = new Date(session.date || session.start_time);
        
//         if (include_past === 'false' && sessionDate < now) {
//           return false;
//         }
        
//         if (start_date && sessionDate < new Date(start_date)) {
//           return false;
//         }
        
//         if (end_date && sessionDate > new Date(end_date)) {
//           return false;
//         }
        
//         return true;
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Class schedule retrieved successfully',
//       data: {
//         class_id: id,
//         class_name: classInfo.class_name,
//         schedule: schedule,
//         timezone: timezone,
//         filters_applied: {
//           start_date,
//           end_date,
//           include_past: include_past === 'true',
//           timezone
//         }
//       },
//       user_id: userId,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error in getClassSchedule:', error);
//     throw error;
//   }
// });

/**
 * GET /classes/:id/announcements - Get class announcements
 */
export const getClassAnnouncements = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    page = 1,
    limit = 20,
    priority,
    date_from,
    date_to
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    priority,
    date_from,
    date_to
  };

  const result = await getClassAnnouncementsService(id, userId, options);

  res.json({
    success: true,
    message: 'Class announcements retrieved successfully',
    ...result
  });
});

/**
 * GET /classes/:id/announcements - Get class announcements
 * Query: page?, limit?, priority?, date_from?, date_to?
 */
// export const getClassAnnouncements = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const userId = req.user.id;
//   const {
//     page = 1,
//     limit = 20,
//     priority,
//     date_from,
//     date_to
//   } = req.query;

//   try {
//     // Check if user is a member of this class
//     const [membershipCheck] = await db.query(
//       'SELECT role_in_class, membership_status FROM user_class_memberships WHERE user_id = ? AND class_id = ? AND membership_status = "active"',
//       [userId, id]
//     );

//     if (membershipCheck.length === 0) {
//       return res.status(403).json({
//         success: false,
//         error: 'You must be a member of this class to view announcements',
//         class_id: id
//       });
//     }

//     // Build query for announcements
//     let whereConditions = ['ca.class_id = ?'];
//     let queryParams = [id];

//     if (priority) {
//       whereConditions.push('ca.priority = ?');
//       queryParams.push(priority);
//     }

//     if (date_from) {
//       whereConditions.push('ca.createdAt >= ?');
//       queryParams.push(date_from);
//     }

//     if (date_to) {
//       whereConditions.push('ca.createdAt <= ?');
//       queryParams.push(date_to);
//     }

//     // Get announcements
//     const announcementsQuery = `
//       SELECT 
//         ca.id,
//         ca.title,
//         ca.content,
//         ca.priority,
//         ca.author_id,
//         u.username as author_name,
//         ca.createdAt,
//         ca.updatedAt,
//         ca.expires_at,
//         CASE 
//           WHEN ca.expires_at IS NULL OR ca.expires_at > NOW() THEN true 
//           ELSE false 
//         END as is_active
//       FROM class_announcements ca
//       LEFT JOIN users u ON ca.author_id = u.id
//       WHERE ${whereConditions.join(' AND ')}
//       ORDER BY ca.priority DESC, ca.createdAt DESC
//       LIMIT ? OFFSET ?
//     `;

//     queryParams.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

//     let announcements = [];
//     let totalRecords = 0;

//     try {
//       const [announcementResults] = await db.query(announcementsQuery, queryParams);
//       announcements = announcementResults;

//       // Count query
//       const countQuery = `
//         SELECT COUNT(*) as total
//         FROM class_announcements ca
//         WHERE ${whereConditions.join(' AND ')}
//       `;
//       const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));
//       totalRecords = countResult[0].total;
//     } catch (error) {
//       // Table might not exist
//       console.log('Announcements table not available');
//     }

//     const totalPages = Math.ceil(totalRecords / parseInt(limit));

//     res.json({
//       success: true,
//       message: 'Class announcements retrieved successfully',
//       data: announcements,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total_pages: totalPages,
//         total_records: totalRecords,
//         has_next: parseInt(page) < totalPages,
//         has_prev: parseInt(page) > 1
//       },
//       class_id: id,
//       user_role: membershipCheck[0].role_in_class,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error in getClassAnnouncements:', error);
//     throw error;
//   }
// });

// ===============================================
// CLASS INTERACTION
// ===============================================

/**
 * POST /classes/:id/attendance - Mark attendance
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    session_id,
    status = 'present',
    notes,
    location
  } = req.body;

  const validStatuses = ['present', 'absent', 'late', 'excused', 'partial'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid attendance status',
      allowed_statuses: validStatuses
    });
  }

  const options = {
    session_id,
    status,
    notes,
    check_in_time: new Date(),
    location
  };

  const result = await markClassAttendanceService(userId, id, options);

  res.status(201).json({
    success: true,
    message: 'Attendance marked successfully',
    data: result
  });
});

// Alias
// export const markClassAttendance = markAttendance;


/**
 * POST /classes/:id/attendance - Mark attendance for a class session
 * Body: { session_id?, status?, notes?, location? }
 */
export const markClassAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    session_id,
    status = 'present',
    notes,
    location
  } = req.body;

  // Validate status
  const validStatuses = ['present', 'absent', 'late', 'excused', 'partial'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid attendance status',
      provided: status,
      allowed_statuses: validStatuses
    });
  }

  try {
    // Check if user is a member of this class
    const [membershipCheck] = await db.query(
      'SELECT role_in_class, membership_status FROM user_class_memberships WHERE user_id = ? AND class_id = ? AND membership_status = "active"',
      [userId, id]
    );

    if (membershipCheck.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'You must be an active member of this class to mark attendance',
        class_id: id
      });
    }

    // Try to create attendance table if it doesn't exist
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS class_attendance (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          class_id VARCHAR(255) NOT NULL,
          session_id VARCHAR(255),
          session_date DATE NOT NULL,
          status ENUM('present', 'absent', 'late', 'excused', 'partial') NOT NULL,
          check_in_time DATETIME,
          notes TEXT,
          location VARCHAR(255),
          marked_by VARCHAR(255),
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_attendance (user_id, class_id, session_date),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_class_session (class_id, session_date),
          INDEX idx_user_class (user_id, class_id)
        )
      `);
    } catch (createError) {
      console.log('Could not create attendance table:', createError.message);
    }

    const sessionDate = new Date().toISOString().split('T')[0]; // Today's date
    const checkInTime = new Date();

    // Insert or update attendance record
    const [existingRecord] = await db.query(
      'SELECT id FROM class_attendance WHERE user_id = ? AND class_id = ? AND session_date = ?',
      [userId, id, sessionDate]
    );

    let result;
    if (existingRecord.length > 0) {
      // Update existing record
      await db.query(`
        UPDATE class_attendance 
        SET status = ?, check_in_time = ?, notes = ?, location = ?, session_id = ?, updatedAt = ?
        WHERE user_id = ? AND class_id = ? AND session_date = ?
      `, [status, checkInTime, notes, location, session_id, new Date(), userId, id, sessionDate]);

      result = {
        action: 'updated',
        attendance_id: existingRecord[0].id,
        user_id: userId,
        class_id: id,
        session_date: sessionDate,
        session_id: session_id || null,
        status: status,
        check_in_time: checkInTime,
        notes: notes || null,
        location: location || null
      };
    } else {
      // Create new record
      const [insertResult] = await db.query(`
        INSERT INTO class_attendance 
        (user_id, class_id, session_id, session_date, status, check_in_time, notes, location, marked_by, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, id, session_id, sessionDate, status, checkInTime, notes, location, userId, new Date(), new Date()]);

      result = {
        action: 'created',
        attendance_id: insertResult.insertId,
        user_id: userId,
        class_id: id,
        session_date: sessionDate,
        session_id: session_id || null,
        status: status,
        check_in_time: checkInTime,
        notes: notes || null,
        location: location || null
      };
    }

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: result,
      user_id: userId,
      username: req.user.username
    });

  } catch (error) {
    console.error('Error in markClassAttendance:', error);
    throw error;
  }
});

/**
 * GET /classes/:id/progress - Get user progress
 */
export const getClassProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await getClassProgressService(userId, id);

  res.json({
    success: true,
    message: 'Class progress retrieved successfully',
    data: result
  });
});

/**
 * GET /classes/:id/progress - Get user's progress in class
 * Shows completion rates, attendance, achievements, etc.
 */
// export const getClassProgress = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const userId = req.user.id;

//   try {
//     // Check if user is a member of this class
//     const [membershipCheck] = await db.query(`
//       SELECT 
//         ucm.role_in_class,
//         ucm.membership_status,
//         ucm.joinedAt,
//         c.class_name,
//         c.estimated_duration
//       FROM user_class_memberships ucm
//       JOIN classes c ON ucm.class_id = c.class_id
//       WHERE ucm.user_id = ? AND ucm.class_id = ?
//     `, [userId, id]);

//     if (membershipCheck.length === 0) {
//       return res.status(403).json({
//         success: false,
//         error: 'You are not a member of this class',
//         class_id: id
//       });
//     }

//     const membership = membershipCheck[0];

//     // Calculate basic progress metrics
//     const joinDate = new Date(membership.joinedAt);
//     const now = new Date();
//     const daysInClass = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));

//     // Get attendance records if they exist
//     let attendanceRecords = [];
//     try {
//       const [attendance] = await db.query(
//         'SELECT * FROM class_attendance WHERE user_id = ? AND class_id = ? ORDER BY session_date DESC',
//         [userId, id]
//       );
//       attendanceRecords = attendance || [];
//     } catch (e) {
//       // Table might not exist yet
//       console.log('Attendance table not available');
//     }

//     // Calculate progress
//     const progress = {
//       membership_info: {
//         role: membership.role_in_class,
//         status: membership.membership_status,
//         joined_date: membership.joinedAt,
//         days_in_class: daysInClass
//       },
//       attendance: {
//         total_sessions: attendanceRecords.length,
//         present_sessions: attendanceRecords.filter(a => a.status === 'present').length,
//         attendance_rate: attendanceRecords.length > 0 
//           ? Math.round((attendanceRecords.filter(a => a.status === 'present').length / attendanceRecords.length) * 100)
//           : 0
//       },
//       completion: {
//         overall_progress: Math.min(100, Math.round((daysInClass / 30) * 100)), // Basic calculation
//         assignments_completed: 0, // Placeholder
//         materials_accessed: 0, // Placeholder
//         participation_score: 85 // Placeholder
//       },
//       achievements: [
//         // Placeholder achievements
//         ...(daysInClass >= 7 ? [{ name: 'First Week Complete', earned_date: new Date(joinDate.getTime() + 7 * 24 * 60 * 60 * 1000) }] : []),
//         ...(attendanceRecords.length >= 5 ? [{ name: 'Regular Attendee', earned_date: new Date() }] : [])
//       ],
//       next_milestones: [
//         { name: 'Complete 30 days', progress: Math.min(100, (daysInClass / 30) * 100) },
//         { name: 'Attend 10 sessions', progress: Math.min(100, (attendanceRecords.length / 10) * 100) }
//       ]
//     };

//     res.json({
//       success: true,
//       message: 'Class progress retrieved successfully',
//       data: progress,
//       class_id: id,
//       class_name: membership.class_name,
//       user_id: userId,
//       username: req.user.username,
//       generated_at: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Error in getClassProgress:', error);
//     throw error;
//   }
// });


// ===============================================
// CLASS FEEDBACK
// ===============================================

/**
 * POST /classes/:id/feedback - Submit feedback
 */
export const submitClassFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const feedbackData = req.body;

  const result = await submitClassFeedbackService(userId, id, feedbackData);

  res.status(201).json({
    success: true,
    message: 'Feedback submitted successfully',
    data: result
  });
});

/**
 * POST /classes/:id/feedback - Submit feedback about a class
 * Body: { rating?, comments?, feedback_type?, anonymous?, aspects?, suggestions? }
 */
// export const submitClassFeedback = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const userId = req.user.id;
//   const feedbackData = req.body;

//   // Validate that at least rating or comments is provided
//   if (!feedbackData.rating && !feedbackData.comments) {
//     return res.status(400).json({
//       success: false,
//       error: 'Either rating or comments is required',
//       required_fields: ['rating (1-5)', 'comments']
//     });
//   }

//   // Validate rating if provided
//   if (feedbackData.rating) {
//     const rating = parseFloat(feedbackData.rating);
//     if (isNaN(rating) || rating < 1 || rating > 5) {
//       return res.status(400).json({
//         success: false,
//         error: 'Rating must be between 1 and 5',
//         provided: feedbackData.rating,
//         valid_range: '1-5'
//       });
//     }
//     feedbackData.rating = rating;
//   }

//   try {
//     // Check if user is a member of this class
//     const [membershipCheck] = await db.query(
//       'SELECT role_in_class, membership_status FROM user_class_memberships WHERE user_id = ? AND class_id = ?',
//       [userId, id]
//     );

//     if (membershipCheck.length === 0) {
//       return res.status(403).json({
//         success: false,
//         error: 'You must be a member of this class to submit feedback',
//         class_id: id
//       });
//     }

//     // Try to create feedback table if it doesn't exist
//     try {
//       await db.query(`
//         CREATE TABLE IF NOT EXISTS class_feedback (
//           id INT AUTO_INCREMENT PRIMARY KEY,
//           user_id VARCHAR(255) NOT NULL,
//           class_id VARCHAR(255) NOT NULL,
//           rating DECIMAL(2,1),
//           comments TEXT,
//           feedback_type ENUM('general', 'content', 'instructor', 'technical', 'suggestion', 'complaint') DEFAULT 'general',
//           anonymous BOOLEAN DEFAULT FALSE,
//           aspects JSON,
//           suggestions TEXT,
//           submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
//           createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
//           updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//           FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
//           INDEX idx_class_feedback (class_id, submission_date),
//           INDEX idx_user_feedback (user_id, class_id)
//         )
//       `);
//     } catch (createError) {
//       console.log('Could not create feedback table:', createError.message);
//     }

//     // Insert feedback record
//     const [insertResult] = await db.query(`
//       INSERT INTO class_feedback 
//       (user_id, class_id, rating, comments, feedback_type, anonymous, aspects, suggestions, submission_date, createdAt, updatedAt)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `, [
//       userId,
//       id,
//       feedbackData.rating || null,
//       feedbackData.comments || null,
//       feedbackData.feedback_type || 'general',
//       Boolean(feedbackData.anonymous || false),
//       feedbackData.aspects ? JSON.stringify(feedbackData.aspects) : null,
//       feedbackData.suggestions || null,
//       new Date(),
//       new Date(),
//       new Date()
//     ]);

//     const result = {
//       feedback_id: insertResult.insertId,
//       class_id: id,
//       rating: feedbackData.rating || null,
//       feedback_type: feedbackData.feedback_type || 'general',
//       anonymous: Boolean(feedbackData.anonymous || false),
//       submitted_at: new Date(),
//       status: 'submitted'
//     };

//     res.status(201).json({
//       success: true,
//       message: 'Feedback submitted successfully',
//       data: result,
//       user_id: feedbackData.anonymous ? null : userId,
//       username: feedbackData.anonymous ? null : req.user.username
//     });

//   } catch (error) {
//     console.error('Error in submitClassFeedback:', error);
//     throw error;
//   }
// });


/**
 * GET /classes/:id/feedback - Get class feedback (instructors/moderators)
 */
export const getClassFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    feedback_type,
    include_anonymous = 'true',
    page = 1,
    limit = 20,
    rating_filter,
    date_from,
    date_to
  } = req.query;

  const options = {
    feedback_type,
    include_anonymous: include_anonymous === 'true',
    page: parseInt(page),
    limit: parseInt(limit),
    rating_filter,
    date_from,
    date_to
  };

  const result = await getClassFeedbackService(id, userId, options);

  res.json({
    success: true,
    message: 'Class feedback retrieved successfully',
    ...result
  });
});


/**
 * GET /classes/:id/feedback - Get class feedback (for instructors/moderators)
 * Query: feedback_type?, include_anonymous?, page?, limit?, rating_filter?, date_from?, date_to?
 */
// export const getClassFeedback = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const userId = req.user.id;
//   const {
//     feedback_type,
//     include_anonymous = 'true',
//     page = 1,
//     limit = 20,
//     rating_filter,
//     date_from,
//     date_to
//   } = req.query;

//   try {
//     // Check if user has permission to view feedback (must be instructor/moderator)
//     const [membershipCheck] = await db.query(
//       'SELECT role_in_class FROM user_class_memberships WHERE user_id = ? AND class_id = ? AND role_in_class IN ("instructor", "moderator")',
//       [userId, id]
//     );

//     if (membershipCheck.length === 0) {
//       return res.status(403).json({
//         success: false,
//         error: 'You must be an instructor or moderator to view class feedback',
//         class_id: id,
//         required_roles: ['instructor', 'moderator']
//       });
//     }

//     // Try to get feedback - handle case where table doesn't exist
//     let feedback = [];
//     let totalRecords = 0;

//     try {
//       // Build query conditions
//       let whereConditions = ['cf.class_id = ?'];
//       let queryParams = [id];

//       if (feedback_type) {
//         whereConditions.push('cf.feedback_type = ?');
//         queryParams.push(feedback_type);
//       }

//       if (include_anonymous === 'false') {
//         whereConditions.push('cf.anonymous = FALSE');
//       }

//       if (rating_filter) {
//         whereConditions.push('cf.rating = ?');
//         queryParams.push(parseFloat(rating_filter));
//       }

//       if (date_from) {
//         whereConditions.push('cf.submission_date >= ?');
//         queryParams.push(date_from);
//       }

//       if (date_to) {
//         whereConditions.push('cf.submission_date <= ?');
//         queryParams.push(date_to);
//       }

//       const mainQuery = `
//         SELECT 
//           cf.id,
//           cf.rating,
//           cf.comments,
//           cf.feedback_type,
//           cf.anonymous,
//           cf.aspects,
//           cf.suggestions,
//           cf.submission_date,
//           CASE 
//             WHEN cf.anonymous = TRUE THEN NULL 
//             ELSE u.username 
//           END as submitted_by,
//           CASE 
//             WHEN cf.anonymous = TRUE THEN NULL 
//             ELSE u.name 
//           END as submitter_name
//         FROM class_feedback cf
//         LEFT JOIN users u ON cf.user_id = u.id
//         WHERE ${whereConditions.join(' AND ')}
//         ORDER BY cf.submission_date DESC
//         LIMIT ? OFFSET ?
//       `;

//       queryParams.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

//       const [feedbackResults] = await db.query(mainQuery, queryParams);
      
//       // Count query
//       const countQuery = `
//         SELECT COUNT(*) as total
//         FROM class_feedback cf
//         WHERE ${whereConditions.join(' AND ')}
//       `;
//       const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));
      
//       feedback = feedbackResults.map(f => {
//         if (f.aspects) {
//           try { f.aspects = JSON.parse(f.aspects); } catch (e) { f.aspects = null; }
//         }
//         return f;
//       });
      
//       totalRecords = countResult[0].total;

//     } catch (e) {
//       console.log('Feedback table not available or empty');
//     }

//     const totalPages = Math.ceil(totalRecords / parseInt(limit));

//     const result = {
//       data: feedback,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total_pages: totalPages,
//         total_records: totalRecords,
//         has_next: parseInt(page) < totalPages,
//         has_prev: parseInt(page) > 1
//       },
//       summary: {
//         total_feedback: totalRecords,
//         average_rating: feedback.length > 0 
//           ? feedback.filter(f => f.rating).reduce((sum, f) => sum + f.rating, 0) / feedback.filter(f => f.rating).length
//           : null,
//         feedback_types: [...new Set(feedback.map(f => f.feedback_type))]
//       },
//       user_permissions: {
//         role: membershipCheck[0].role_in_class,
//         can_view_anonymous: include_anonymous === 'true'
//       }
//     };

//     res.json({
//       success: true,
//       message: 'Class feedback retrieved successfully',
//       ...result,
//       class_id: id,
//       viewer_id: userId,
//       viewer_role: membershipCheck[0].role_in_class
//     });

//   } catch (error) {
//     console.error('Error in getClassFeedback:', error);
//     throw error;
//   }
// });

// ===============================================
// SEARCH & UTILITY
// ===============================================

/**
 * GET /classes/search - Advanced search
 */
export const searchClasses = asyncHandler(async (req, res) => {
  const {
    q: search,
    filters: filtersParam,
    sort = 'relevance',
    page = 1,
    limit = 20
  } = req.query;

  let filters = {};
  if (filtersParam) {
    try {
      filters = JSON.parse(filtersParam);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filters JSON format'
      });
    }
  }

  const searchOptions = {
    search,
    ...filters,
    page: parseInt(page),
    limit: parseInt(limit),
    sort_by: sort === 'relevance' ? 'relevance_score' : sort
  };

  const result = await getAllClassesService(searchOptions, {});

  res.json({
    success: true,
    message: 'Search results retrieved successfully',
    ...result
  });
});

/**
 * GET /classes/search - Advanced class search with multiple criteria
 * Query: q (search term), filters (JSON), sort?, page?, limit?
 */
// export const searchClasses = asyncHandler(async (req, res) => {
//   const {
//     q: search,
//     filters: filtersParam,
//     sort = 'relevance',
//     page = 1,
//     limit = 20
//   } = req.query;

//   let filters = {};
//   if (filtersParam) {
//     try {
//       filters = JSON.parse(filtersParam);
//     } catch (error) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid filters JSON format',
//         provided: filtersParam
//       });
//     }
//   }

//   // Enhanced search with relevance scoring
//   const searchOptions = {
//     search,
//     ...filters,
//     page: parseInt(page),
//     limit: parseInt(limit),
//     sort_by: sort === 'relevance' ? 'relevance_score' : sort
//   };

//   // Use getAllClasses with search parameters
//   req.query = {
//     ...req.query,
//     search,
//     page,
//     limit,
//     sort_by: searchOptions.sort_by,
//     ...filters
//   };

//   // Delegate to getAllClasses
//   await getAllClasses(req, res);
// });

/**
 * GET /classes/:id/quick-info - Get quick class info
 */
export const getClassQuickInfo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const classData = await getClassByIdService(id, userId);

  const quickInfo = {
    class_id: classData.class_id,
    display_id: classData.display_id,
    class_name: classData.class_name,
    public_name: classData.public_name,
    description: classData.description?.substring(0, 200) + (classData.description?.length > 200 ? '...' : ''),
    class_type: classData.class_type,
    difficulty_level: classData.difficulty_level,
    total_members: classData.capacity_info?.total_members || 0,
    max_members: classData.max_members,
    is_public: classData.is_public,
    is_full: classData.capacity_info?.is_full || false,
    tags: classData.tags?.slice(0, 5),
    user_is_member: classData.user_context?.is_member || false,
    user_can_join: classData.user_context?.can_join || false
  };

  res.json({
    success: true,
    message: 'Quick class info retrieved',
    data: quickInfo
  });
});

/**
 * GET /classes/:id/quick-info - Get essential class info for quick display
 * Lightweight endpoint for cards, previews, etc.
 */
// export const getClassQuickInfo = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const userId = req.user?.id;

//   try {
//     // Get basic class info
//     const [classResult] = await db.query(`
//       SELECT 
//         c.class_id,
//         c.display_id,
//         c.class_name,
//         c.public_name,
//         c.description,
//         c.class_type,
//         c.difficulty_level,
//         c.is_public,
//         c.is_active,
//         c.max_members,
//         c.tags,
//         c.allow_self_join,
//         COALESCE(cm.total_members, 0) as total_members,
//         CASE 
//           WHEN COALESCE(cm.total_members, 0) >= c.max_members THEN true 
//           ELSE false 
//         END as is_full
//       FROM classes c
//       LEFT JOIN (
//         SELECT 
//           class_id, 
//           COUNT(*) as total_members 
//         FROM user_class_memberships 
//         WHERE membership_status = 'active' 
//         GROUP BY class_id
//       ) cm ON c.class_id = cm.class_id
//       WHERE c.class_id = ?
//     `, [id]);

//     if (classResult.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'Class not found',
//         class_id: id,
//         timestamp: new Date().toISOString()
//       });
//     }

//     const classData = classResult[0];

//     // Parse tags
//     if (classData.tags) {
//       try { classData.tags = JSON.parse(classData.tags); } catch (e) { classData.tags = []; }
//     }

//     // Check user membership if authenticated
//     let userContext = { is_member: false, can_join: false };
//     if (userId) {
//       const [membershipResult] = await db.query(
//         'SELECT membership_status FROM user_class_memberships WHERE user_id = ? AND class_id = ?',
//         [userId, id]
//       );

//       userContext = {
//         is_member: membershipResult.length > 0,
//         can_join: membershipResult.length === 0 && classData.allow_self_join && !classData.is_full
//       };
//     }

//     // Return only essential information
//     const quickInfo = {
//       class_id: classData.class_id,
//       display_id: classData.display_id,
//       class_name: classData.class_name,
//       public_name: classData.public_name,
//       description: classData.description?.substring(0, 200) + (classData.description?.length > 200 ? '...' : ''),
//       class_type: classData.class_type,
//       difficulty_level: classData.difficulty_level,
//       total_members: classData.total_members,
//       max_members: classData.max_members,
//       is_public: classData.is_public,
//       is_full: classData.is_full,
//       tags: classData.tags?.slice(0, 5), // Limit tags for quick display
//       user_is_member: userContext.is_member,
//       user_can_join: userContext.can_join
//     };

//     res.json({
//       success: true,
//       message: 'Quick class info retrieved',
//       data: quickInfo,
//       response_type: 'quick_info'
//     });

//   } catch (error) {
//     console.error('Error in getClassQuickInfo:', error);
//     throw error;
//   }
// });



/**
 * GET /classes/test - Test endpoint
 */
export const testClassRoutes = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Class routes test completed',
    data: {
      route_status: 'operational',
      timestamp: new Date().toISOString(),
      user_context: req.user ? {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      } : null,
      available_operations: [
        'view classes',
        'join/leave classes',
        'view members',
        'search classes'
      ]
    }
  });
});

/**
 * GET /classes/test - Test endpoint for class routes
 */
// export const testClassRoutes = asyncHandler(async (req, res) => {
//   const testResults = {
//     route_status: 'operational',
//     timestamp: new Date().toISOString(),
//     user_context: req.user ? {
//       id: req.user.id,
//       username: req.user.username,
//       role: req.user.role,
//       membership_stage: req.user.membership_stage
//     } : null,
//     available_operations: [
//       'view classes',
//       'join/leave classes',
//       'view members',
//       'search classes'
//     ],
//     endpoint_info: {
//       path: '/api/classes/test',
//       method: 'GET',
//       authenticated: Boolean(req.user)
//     }
//   };

//   // Test database connectivity
//   try {
//     const [result] = await db.query('SELECT COUNT(*) as class_count FROM classes WHERE class_id LIKE "OTU#%"');
//     testResults.database_status = 'connected';
//     testResults.total_classes = result[0].class_count;
//   } catch (error) {
//     testResults.database_status = 'error';
//     testResults.database_error = error.message;
//   }

//   res.json({
//     success: true,
//     message: 'Class routes test completed',
//     data: testResults
//   });
// });

// ===============================================
// LEGACY SUPPORT
// ===============================================

/**
 * Legacy function for backward compatibility
 * @deprecated Use getAllClasses instead
 */
export const getClasses = asyncHandler(async (req, res) => {
  console.log('⚠️ Legacy function getClasses called, redirecting to getAllClasses');
  
  const originalJson = res.json;
  res.json = function(data) {
    if (data && typeof data === 'object') {
      data.deprecation_warning = {
        message: 'This endpoint is deprecated. Use GET /classes instead.',
        deprecated_endpoint: '/classes (legacy)',
        recommended_endpoint: '/classes'
      };
    }
    return originalJson.call(this, data);
  };

  return getAllClasses(req, res);
});

/**
 * Legacy function for backward compatibility
 * @deprecated Use getAllClasses instead
 */
// export const getClasses = asyncHandler(async (req, res) => {
//   console.log('⚠️ Legacy function getClasses called, redirecting to getAllClasses');
  
//   // Add deprecation warning to response
//   const originalJson = res.json;
//   res.json = function(data) {
//     if (data && typeof data === 'object') {
//       data.deprecation_warning = {
//         message: 'This endpoint is deprecated. Use GET /classes instead.',
//         deprecated_endpoint: '/classes (legacy)',
//         recommended_endpoint: '/classes',
//         deprecation_date: '2024-01-01',
//         removal_date: '2024-06-01'
//       };
//     }
//     return originalJson.call(this, data);
//   };

//   return getAllClasses(req, res);
// });






// Add this at the end of classControllers.js to properly export all functions

// ===============================================
// MODULE EXPORTS
// ===============================================

// export {
//   // Main class operations
//   getAllClasses,
//   getClassById,
//   getUserClasses,
//   joinClass,
//   leaveClass,
  
//   // Participants/Members
//   getClassParticipants,
//   //getClassMembers: getClassParticipants, // Alias for compatibility
  
//   // Search and discovery
//   searchClasses,
//   getClassQuickInfo,
//   getAvailableClasses,
  
//   // Assignment
//   assignUserToClass,
  
//   // Schedule and content
//   getClassSchedule,
//   getClassContent,
  
//   // Progress and attendance
//   getClassProgress,
//   markClassAttendance,

//   // markAttendance: markClassAttendance, // Alias for route compatibility
  
//   // Feedback
//   submitClassFeedback,
//   getClassFeedback,
  
//   // Announcements
//   getClassAnnouncements,
  
//   // Testing
//   testClassRoutes,
  
//   // Legacy support
//   getClasses
// };

// // ===============================================
// // UPDATE EXISTING EXPORT SECTION
// // ===============================================
//   name: 'Class Controllers',
//   version: '2.0.0',
//   description: 'Integration-ready user-facing class management controllers with OTU# format support',
//   supported_formats: ['OTU#XXXXXX'],
//   features: [
//     'class_discovery',
//     'class_enrollment',
//     'member_management',
//     'search_functionality',
//     'compatibility_layer'
//   ],
//   endpoints: [
//     'GET /classes - List all classes',
//     'GET /classes/:id - Get class details',
//     'GET /classes/my-classes - Get user classes',
//     'POST /classes/:id/join - Join class',
//     'POST /classes/:id/leave - Leave class',
//     'GET /classes/:id/members - Get class members',
//     'GET /classes/available - Get available classes',
//     'GET /classes/search - Search classes',
//     'GET /classes/:id/quick-info - Quick class info',
//     'POST /classes/assign - Assign user to class',
//     'GET /classes/test - Test endpoint'
//   ],
//   compatibility: {
//     frontend: 'AudienceClassMgr.jsx',
//     services: 'classServices.js (optional)',
//     database: 'Direct DB queries with service fallback'
//   },
//   last_updated: new Date().toISOString()
// };

