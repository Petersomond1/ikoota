// ikootaapi/controllers/userAdminControllers.js
// ADMIN USER MANAGEMENT CONTROLLER - UPDATED TO USE SERVICES
// Administrative control over user accounts and permissions

import {
  getAllUsersService,
  createUserService,
  updateUserByAdminService,
  deleteUserService,
  banUserService,
  unbanUserService,
  generateBulkIdsService,
  generateConverseIdService,
  maskUserIdentityService,
  exportUsersDataService,
  generateClassIdService
} from '../services/userAdminServices.js';

import {
  getUserProfileService,
  //getAllUsers,
  getAllMentorsForAdmin,
  getUserStats,
  getAllClasses
} from '../services/userServices.js';

import { generateUniqueClassId } from '../utils/idGenerator.js';

// ===============================================
// USER MANAGEMENT
// ===============================================

/**
 * Get all users (Admin)
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res) => {
  try {
    console.log('🔍 Admin users request from user:', req.user.username);
    
    const { 
      page = 1, 
      limit = 50, 
      role, 
      is_member, 
      isblocked, 
      isbanned, 
      search 
    } = req.query;

    const filters = {
      role,
      is_member,
      isblocked: isblocked === 'true' ? true : isblocked === 'false' ? false : undefined,
      isbanned: isbanned === 'true' ? true : isbanned === 'false' ? false : undefined,
      search,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const result = await getAllUsersService(filters);
    
    res.status(200).json({
      success: true,
      data: {
        users: result.users || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit))
        },
        filters: { role, is_member, isblocked, isbanned, search }
      },
      message: `Found ${result.users?.length || 0} users`
    });
    
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      details: error.message,
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get specific user by ID (Admin)
 * GET /api/admin/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    console.log('🔍 Admin fetching user by ID:', id);
    
    const userProfile = await getUserProfileService(id);
    
    res.status(200).json({
      success: true,
      data: userProfile,
      message: 'User retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching user by ID:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to fetch user',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Create new user (Admin)
 * POST /api/admin/users/create
 */
export const createUser = async (req, res) => {
  try {
    console.log('👤 Admin creating new user:', req.body.username);

    const newUser = await createUserService(req.body, req.user);
    
    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    let statusCode = 500;
    if (error.message.includes('already exists')) statusCode = 409;
    if (error.message.includes('required')) statusCode = 400;
    if (error.message.includes('Invalid')) statusCode = 400;
    if (error.message.includes('super administrator')) statusCode = 403;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to create user',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user (Admin)
 * PUT /api/admin/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No update data provided'
      });
    }

    console.log('🔧 Admin updating user:', id);

    const updatedUser = await updateUserByAdminService(id, updateData, req.user);
    
    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('required')) statusCode = 400;
    if (error.message.includes('super administrator')) statusCode = 403;
    if (error.message.includes('Cannot demote')) statusCode = 403;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to update user',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete user (Super Admin only)
 * DELETE /api/admin/users/:id
 */
export const deleteUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    console.log('🗑️ Super admin deleting user:', id);

    const result = await deleteUserService(id, req.user, reason);
    
    res.status(200).json({
      success: true,
      message: 'User account deleted successfully',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('Super administrator')) statusCode = 403;
    if (error.message.includes('Cannot delete')) statusCode = 400;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to delete user',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Search users (Admin)
 * GET /api/admin/users/search
 */
export const searchUsers = async (req, res) => {
  try {
    const { 
      query = '', 
      role = '', 
      membership_stage = '', 
      page = 1, 
      limit = 20 
    } = req.query;

    console.log('🔍 Admin searching users:', { query, role, membership_stage });

    const filters = {
      search: query,
      role: role || undefined,
      membership_stage: membership_stage || undefined,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const result = await getAllUsersService(filters);
    
    res.status(200).json({
      success: true,
      data: {
        users: result.users || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(limit))
        },
        searchCriteria: { query, role, membership_stage }
      },
      message: `Found ${result.users?.length || 0} users matching criteria`
    });
    
  } catch (error) {
    console.error('❌ Error searching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users',
      details: error.message,
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// USER PERMISSIONS & ROLES
// ===============================================

/**
 * Update user role (Admin)
 * PUT /api/admin/users/role
 */
export const updateUserRole = async (req, res) => {
  try {
    const { userId, role, is_member, isblocked, isbanned, mentor_id, class_id } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    console.log('👑 Admin updating user role:', { userId, role, is_member });

    const updateData = {
      role,
      is_member,
      isblocked,
      isbanned,
      mentor_id,
      class_id
    };

    // Filter out undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );

    const updatedUser = await updateUserByAdminService(userId, cleanData, req.user);
    
    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'User role updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to update user role',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Grant posting rights to user (Admin)
 * POST /api/admin/users/grant-posting-rights
 */
export const grantPostingRights = async (req, res) => {
  try {
    const { userId, rights = [] } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    console.log('📝 Admin granting posting rights:', { userId, rights });

    // Update user with posting rights
    const updateData = {
      can_post: true,
      posting_rights_granted_at: new Date(),
      posting_rights_granted_by: req.user.id
    };

    const updatedUser = await updateUserByAdminService(userId, updateData, req.user);

    res.status(200).json({
      success: true,
      message: 'Posting rights granted successfully',
      data: {
        userId,
        rights_granted: rights,
        granted_by: req.user.username,
        granted_at: new Date().toISOString(),
        user: updatedUser
      }
    });
    
  } catch (error) {
    console.error('❌ Error granting posting rights:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to grant posting rights',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Ban user (Admin)
 * POST /api/admin/users/ban
 */
export const banUser = async (req, res) => {
  try {
    const { userId, reason, duration } = req.body;
    
    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'User ID and reason are required'
      });
    }

    console.log('🚫 Admin banning user:', { userId, reason, duration });

    const result = await banUserService(userId, { reason, duration }, req.user);
    
    res.status(200).json({
      success: true,
      message: 'User banned successfully',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Error banning user:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('Cannot ban')) statusCode = 403;
    if (error.message.includes('your own')) statusCode = 400;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to ban user',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Unban user (Admin)
 * POST /api/admin/users/unban
 */
export const unbanUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    console.log('✅ Admin unbanning user:', { userId, reason });

    const result = await unbanUserService(userId, reason, req.user);
    
    res.status(200).json({
      success: true,
      message: 'User unbanned successfully',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Error unbanning user:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('not banned')) statusCode = 400;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to unban user',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// ID GENERATION
// ===============================================

/**
 * Generate bulk IDs (Admin)
 * POST /api/admin/users/generate-bulk-ids
 */
export const generateBulkIds = async (req, res) => {
  try {
    const { count = 10, type = 'user' } = req.body;
    
    console.log('🆔 Admin generating bulk IDs:', { count, type });

    const result = await generateBulkIdsService(count, type, req.user);
    
    res.status(200).json({
      success: true,
      message: `Generated ${count} ${type} IDs`,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Error generating bulk IDs:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to generate bulk IDs',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Generate converse ID (Admin)
 * POST /api/admin/users/generate-converse-id
 */
export const generateConverseId = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    console.log('🆔 Admin generating converse ID for user:', userId);

    const result = await generateConverseIdService(userId, req.user);
    
    res.status(200).json({
      success: true,
      message: 'Converse ID generated successfully',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Error generating converse ID:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('already has')) statusCode = 400;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to generate converse ID',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Generate class ID (Admin)
 * POST /api/admin/users/generate-class-id
 */
export const generateClassIdForAdmin = async (req, res) => {
  try {
    const { className, classType = 'demographic' } = req.body;
    
    if (!className) {
      return res.status(400).json({
        success: false,
        error: 'Class name is required'
      });
    }

    console.log('🆔 Admin generating class ID:', { className, classType });

    // Generate class ID using the utility function
    const newClassId = await generateUniqueClassId();
    
    // Create the class using database directly (could be moved to service)
    const db = (await import('../config/db.js')).default;
    await db.query(`
      INSERT INTO classes (class_id, class_name, class_type, created_by, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [newClassId, className, classType, req.user.id]);
    
    // Log the generation
    await db.query(`
      INSERT INTO id_generation_log (generated_id, id_type, generated_by, purpose, createdAt)
      VALUES (?, 'class', ?, 'class_creation', NOW())
    `, [newClassId, req.user.converse_id || req.user.id]);
    
    res.status(200).json({
      success: true,
      message: 'Class ID generated and class created successfully',
      data: {
        class_id: newClassId,
        class_name: className,
        class_type: classType,
        created_by: req.user.username,
        created_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating class ID:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate class ID',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// IDENTITY MANAGEMENT
// ===============================================

/**
 * Mask user identity (Admin)
 * POST /api/admin/users/mask-identity
 */
export const maskUserIdentity = async (req, res) => {
  try {
    const { userId, adminConverseId, mentorConverseId, classId, reason } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    console.log('🎭 Admin masking user identity:', { userId, reason });

    const result = await maskUserIdentityService(req.body, req.user);
    
    res.status(200).json({
      success: true,
      message: 'User identity masked successfully',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Error masking identity:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('already masked')) statusCode = 400;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to mask identity',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// DATA EXPORT
// ===============================================

/**
 * Export user data (Super Admin only)
 * GET /api/admin/users/export
 */
export const exportUserData = async (req, res) => {
  try {
    const { format = 'json', includePersonalData = false } = req.query;
    
    console.log('📊 Admin exporting user data:', { format, includePersonalData });

    const result = await exportUsersDataService({ 
      format, 
      includePersonalData: includePersonalData === 'true' 
    }, req.user);
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = Object.keys(result.users[0] || {}).join(',');
      const csvRows = result.users.map(user => 
        Object.values(user).map(value => 
          typeof value === 'string' ? `"${value}"` : value
        ).join(',')
      );
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="users_export.csv"');
      res.send(csvContent);
    } else {
      res.status(200).json({
        success: true,
        data: result.users,
        metadata: result.metadata
      });
    }
    
  } catch (error) {
    console.error('❌ Error exporting user data:', error);
    
    let statusCode = 500;
    if (error.message.includes('Super administrator')) statusCode = 403;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to export user data',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// STATISTICS & ANALYTICS
// ===============================================

/**
 * Get user statistics (Admin)
 * GET /api/admin/users/stats
 */
export const getUserStatsAdmin = async (req, res) => {
  try {
    console.log('📊 Admin fetching user statistics');
    
    const stats = await getUserStats();
    
    res.status(200).json({
      success: true,
      data: stats,
      message: 'User statistics retrieved successfully',
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user statistics',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// MENTORS MANAGEMENT
// ===============================================

/**
 * Get all mentors (Admin)
 * GET /api/admin/users/mentors
 */
export const getMentors = async (req, res) => {
  try {
    console.log('👨‍🏫 Admin fetching mentors');
    
    const mentors = await getAllMentorsForAdmin();
    
    res.status(200).json({
      success: true,
      data: {
        mentors: mentors || [],
        count: mentors?.length || 0
      },
      message: 'Mentors retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching mentors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mentors',
      details: error.message,
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Assign mentor role (Admin)
 * POST /api/admin/users/mentors/assign
 */
export const assignMentorRole = async (req, res) => {
  try {
    const { userId, maxMentees = 5 } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    console.log('👨‍🏫 Admin assigning mentor role:', { userId, maxMentees });

    // Update user role to mentor
    const updateData = { role: 'mentor' };
    const updatedUser = await updateUserByAdminService(userId, updateData, req.user);
    
    // TODO: Add to mentors table if exists (could be moved to service)
    
    res.status(200).json({
      success: true,
      message: 'Mentor role assigned successfully',
      data: {
        userId,
        username: updatedUser.username,
        role: 'mentor',
        max_mentees: maxMentees,
        assigned_by: req.user.username,
        assigned_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error assigning mentor role:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to assign mentor role',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Remove mentor role (Admin)
 * DELETE /api/admin/users/mentors/:id/remove
 */
export const removeMentorRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    console.log('❌ Admin removing mentor role:', id);

    // Get user details first
    const user = await getUserProfileService(id);
    
    // Update user role back to regular user
    const updateData = { role: 'user' };
    await updateUserByAdminService(id, updateData, req.user);
    
    res.status(200).json({
      success: true,
      message: 'Mentor role removed successfully',
      data: {
        userId: id,
        username: user.username,
        previous_role: 'mentor',
        new_role: 'user',
        removed_by: req.user.username,
        removed_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error removing mentor role:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to remove mentor role',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// TESTING ENDPOINTS
// ===============================================

/**
 * Admin user routes test
 * GET /api/admin/users/test
 */
export const testAdminUserRoutes = (req, res) => {
  const testData = {
    success: true,
    message: 'Admin user routes are working!',
    timestamp: new Date().toISOString(),
    admin_user: {
      id: req.user?.id,
      username: req.user?.username,
      role: req.user?.role
    },
    endpoint_info: {
      path: req.path,
      method: req.method,
      access_level: 'admin_required'
    },
    available_endpoints: {
      user_management: [
        'GET / - Get all users',
        'GET /:id - Get specific user',
        'POST /create - Create new user',
        'PUT /:id - Update user',
        'DELETE /:id - Delete user (super admin)'
      ],
      permissions: [
        'PUT /role - Update user role',
        'POST /grant-posting-rights - Grant posting rights',
        'POST /ban - Ban user',
        'POST /unban - Unban user'
      ],
      id_generation: [
        'POST /generate-bulk-ids - Generate bulk IDs',
        'POST /generate-converse-id - Generate converse ID',
        'POST /generate-class-id - Generate class ID'
      ],
      identity: [
        'POST /mask-identity - Mask user identity'
      ],
      data_export: [
        'GET /export - Export user data (super admin)'
      ],
      mentors: [
        'GET /mentors - Get all mentors',
        'POST /mentors/assign - Assign mentor role',
        'DELETE /mentors/:id/remove - Remove mentor role'
      ],
      statistics: [
        'GET /stats - Get user statistics'
      ]
    }
  };
  
  res.status(200).json(testData);
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    console.log('🗑️ Admin deleting user:', id);

    const result = await deleteUserService(id, req.user);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) statusCode = 404;
    if (error.message.includes('Super administrator')) statusCode = 403;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to delete user',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// EXPORT ALL FUNCTIONS
// ===============================================

export {
  //getAllUsers,
  //getUserById,
  //createUser,
  //updateUser,
  //deleteUserAdmin as deleteUser,
  //deleteUser,
  //searchUsers,
  //updateUserRole,
  //grantPostingRights,
  //banUser,
  //unbanUser,
  //generateBulkIds,
  //generateConverseId,,
  //generateClassIdForAdmin,
  //maskUserIdentity,
  //exportUserData,
  getUserStatsAdmin as getUserStats,
  //getMentors,
  //assignMentorRole,
 // removeMentorRole,
  //testAdminUserRoutes
};