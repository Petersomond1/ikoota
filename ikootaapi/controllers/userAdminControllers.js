// ikootaapi/controllers/userAdminControllers.js
// ADMIN USER MANAGEMENT CONTROLLER - CORRECTED VERSION
// Administrative control over user accounts and permissions

import {
  getAllUsers,
  getUserProfileService,
  updateUser,
  deleteUser,
  getUserStats,
  getAllUsersForAdmin,
  getAllMentorsForAdmin,
  updateUserByAdmin,
  getMembershipOverviewStats,
  getAllClasses
} from '../services/userServices.js';
import { generateUniqueConverseId, generateUniqueClassId } from '../utils/idGenerator.js';
import { sendEmail, sendSMS } from '../utils/notifications.js';
import { hashPassword } from '../utils/passwordUtils.js';
import db from '../config/db.js';

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

    const result = await getAllUsers(filters);
    
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
    const {
      username,
      email,
      phone,
      password,
      role = 'user',
      is_member = 'applied',
      membership_stage = 'none'
    } = req.body;

    console.log('👤 Admin creating new user:', { username, email, role });

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }

    // Validate email format
    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate role
    const validRoles = ['user', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Valid roles: ${validRoles.join(', ')}`
      });
    }

    // Only super admins can create other admins
    if (['admin', 'super_admin'].includes(role) && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Only super administrators can create admin accounts'
      });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    const query = `
      INSERT INTO users (
        username, email, phone, password_hash, role, 
        is_member, membership_stage, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const [result] = await db.query(query, [
      username, email, phone, password_hash, 
      role, is_member, membership_stage
    ]);

    const newUserId = result.insertId;
    
    // Get the created user
    const newUser = await getUserProfileService(newUserId);
    
    console.log('✅ User created successfully:', newUserId);
    
    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Username or email already exists'
      });
    }
    
    res.status(500).json({
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

    console.log('🔧 Admin updating user:', id, 'with data:', updateData);

    // Check if trying to update admin roles
    if (updateData.role && ['admin', 'super_admin'].includes(updateData.role)) {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Only super administrators can assign admin roles'
        });
      }
    }

    const updatedUser = await updateUserByAdmin(id, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      details: error.message,
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete user (Super Admin only)
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Only super admins can delete users
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Super administrator privileges required'
      });
    }

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    console.log('🗑️ Super admin deleting user:', id, 'reason:', reason);

    // Get user details before deletion
    const user = await getUserProfileService(id);
    
    // Prevent deletion of other admins unless explicitly confirmed
    if (['admin', 'super_admin'].includes(user.role) && !req.body.confirmAdminDeletion) {
      return res.status(400).json({
        success: false,
        error: 'Admin account deletion requires confirmAdminDeletion flag',
        warning: 'This will delete an administrator account'
      });
    }

    const result = await deleteUser(id);
    
    console.log('✅ User deleted successfully:', result);
    
    res.status(200).json({
      success: true,
      message: `User account deleted successfully`,
      data: {
        deleted_user: result.username,
        deleted_by: req.user.username,
        reason: reason || 'Admin deletion',
        deleted_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
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

    const result = await getAllUsers(filters);
    
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

    // Validate role if provided
    const validRoles = ['user', 'admin', 'super_admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Valid roles: ${validRoles.join(', ')}`
      });
    }

    // Authorization check for admin role assignment
    if (['admin', 'super_admin'].includes(role) && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Only super administrators can assign admin roles'
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

    const updatedUser = await updateUserByAdmin(userId, cleanData);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'User role updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    res.status(500).json({
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

    // For now, this is a placeholder
    // You would implement specific posting rights logic based on your requirements
    const updateData = {
      // Add specific posting rights fields here
      can_post: true,
      posting_rights_granted_at: new Date(),
      posting_rights_granted_by: req.user.id
    };

    res.status(200).json({
      success: true,
      message: 'Posting rights granted successfully',
      data: {
        userId,
        rights_granted: rights,
        granted_by: req.user.username,
        granted_at: new Date().toISOString()
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
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Ban reason is required'
      });
    }

    console.log('🚫 Admin banning user:', { userId, reason, duration });

    // Check if user exists
    const user = await getUserProfileService(userId);
    
    // Prevent banning other admins
    if (['admin', 'super_admin'].includes(user.role) && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot ban administrator accounts'
      });
    }

    // Update user ban status
    const updateData = {
      isbanned: true,
      ban_reason: reason,
      banned_at: new Date(),
      banned_by: req.user.id,
      ban_duration: duration
    };

    const updatedUser = await updateUserByAdmin(userId, updateData);
    
    // Log the ban action
    await db.query(`
      INSERT INTO audit_logs (user_id, action, details, createdAt)
      VALUES (?, 'user_banned', ?, NOW())
    `, [req.user.id, JSON.stringify({
      targetUserId: userId,
      targetUsername: user.username,
      reason,
      duration,
      bannedBy: req.user.username
    })]);
    
    res.status(200).json({
      success: true,
      message: 'User banned successfully',
      data: {
        userId,
        username: user.username,
        reason,
        duration,
        banned_by: req.user.username,
        banned_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error banning user:', error);
    res.status(500).json({
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

    // Get user details
    const user = await getUserProfileService(userId);
    
    // Update user ban status
    const updateData = {
      isbanned: false,
      unban_reason: reason,
      unbanned_at: new Date(),
      unbanned_by: req.user.id
    };

    const updatedUser = await updateUserByAdmin(userId, updateData);
    
    // Log the unban action
    await db.query(`
      INSERT INTO audit_logs (user_id, action, details, createdAt)
      VALUES (?, 'user_unbanned', ?, NOW())
    `, [req.user.id, JSON.stringify({
      targetUserId: userId,
      targetUsername: user.username,
      reason,
      unbannedBy: req.user.username
    })]);
    
    res.status(200).json({
      success: true,
      message: 'User unbanned successfully',
      data: {
        userId,
        username: user.username,
        reason,
        unbanned_by: req.user.username,
        unbanned_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error unbanning user:', error);
    res.status(500).json({
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
    
    if (count > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 IDs can be generated at once'
      });
    }

    console.log('🆔 Admin generating bulk IDs:', { count, type });

    const generatedIds = [];
    
    for (let i = 0; i < count; i++) {
      let newId;
      if (type === 'user') {
        newId = await generateUniqueConverseId();
      } else if (type === 'class') {
        newId = await generateUniqueClassId();
      } else {
        // Fallback to simple generation
        newId = `${type.toUpperCase()}_${Date.now()}_${i}`;
      }
      
      generatedIds.push(newId);
      
      // Log the generation
      await db.query(`
        INSERT INTO id_generation_log (generated_id, id_type, generated_by, purpose)
        VALUES (?, ?, ?, 'bulk_generation')
      `, [newId, type, req.user.converse_id || req.user.id]);
    }
    
    res.status(200).json({
      success: true,
      message: `Generated ${count} ${type} IDs`,
      data: {
        generated_ids: generatedIds,
        count,
        type,
        generated_by: req.user.username,
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating bulk IDs:', error);
    res.status(500).json({
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

    // Check if user already has a converse ID
    const user = await getUserProfileService(userId);
    
    if (user.converse_id && user.converse_id !== '000000') {
      return res.status(400).json({
        success: false,
        error: 'User already has a converse ID',
        current_id: user.converse_id
      });
    }

    // Generate new converse ID
    const converseId = await generateUniqueConverseId();
    
    // Update user with new converse ID
    const updateData = { converse_id: converseId };
    await updateUserByAdmin(userId, updateData);
    
    // Log the generation
    await db.query(`
      INSERT INTO id_generation_log (generated_id, id_type, generated_by, purpose)
      VALUES (?, 'user', ?, 'converse_id_generation')
    `, [converseId, req.user.converse_id || req.user.id]);
    
    res.status(200).json({
      success: true,
      message: 'Converse ID generated successfully',
      data: {
        userId,
        username: user.username,
        converse_id: converseId,
        generated_by: req.user.username,
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating converse ID:', error);
    res.status(500).json({
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
    
    // Create the class
    await db.query(`
      INSERT INTO classes (class_id, class_name, class_type, created_by, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [newClassId, className, classType, req.user.id]);
    
    // Log the generation
    await db.query(`
      INSERT INTO id_generation_log (generated_id, id_type, generated_by, purpose)
      VALUES (?, 'class', ?, 'class_creation')
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

    // Get user details before masking
    const user = await getUserProfileService(userId);
    
    // Update user with masked identity
    const updateData = {
      converse_id: adminConverseId,
      mentor_id: mentorConverseId,
      primary_class_id: classId,
      is_identity_masked: true
    };

    await updateUserByAdmin(userId, updateData);
    
    // Log identity masking
    await db.query(`
      INSERT INTO identity_masking_audit (
        user_id, converse_id, masked_by_admin_id, original_username, reason, createdAt
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `, [userId, adminConverseId, req.user.converse_id || req.user.id, user.username, reason]);
    
    res.status(200).json({
      success: true,
      message: 'User identity masked successfully',
      data: {
        userId,
        original_username: user.username,
        new_converse_id: adminConverseId,
        mentor_id: mentorConverseId,
        class_id: classId,
        masked_by: req.user.username,
        masked_at: new Date().toISOString(),
        reason
      }
    });
    
  } catch (error) {
    console.error('❌ Error masking identity:', error);
    res.status(500).json({
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
    const { format = 'json', filters = {} } = req.query;
    
    console.log('📊 Admin exporting user data:', { format, filters });

    // Get all users for export
    const result = await getAllUsersForAdmin();
    
    // Filter sensitive data for export
    const exportData = result.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      membership_stage: user.membership_stage,
      is_member: user.is_member,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isblocked: user.isblocked,
      isbanned: user.isbanned
    }));
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = Object.keys(exportData[0]).join(',');
      const csvRows = exportData.map(user => 
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
        data: exportData,
        metadata: {
          total_records: exportData.length,
          exported_at: new Date().toISOString(),
          exported_by: req.user.username,
          format
        }
      });
    }
    
  } catch (error) {
    res.status(500).json({
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
export const getUserStats = async (req, res) => {
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

    // Update user role
    const updateData = { role: 'mentor' };
    const updatedUser = await updateUserByAdmin(userId, updateData);
    
    // Add to mentors table if exists
    try {
      await db.query(`
        INSERT INTO mentors (mentor_converse_id, max_mentees, current_mentees, is_active)
        VALUES (?, ?, 0, 1)
        ON DUPLICATE KEY UPDATE max_mentees = ?, is_active = 1
      `, [updatedUser.converse_id, maxMentees, maxMentees]);
    } catch (mentorError) {
      console.warn('Could not update mentors table:', mentorError.message);
    }
    
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
    res.status(500).json({
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

    // Get user details
    const user = await getUserProfileService(id);
    
    // Update user role back to regular user
    const updateData = { role: 'user' };
    const updatedUser = await updateUserByAdmin(id, updateData);
    
    // Deactivate in mentors table if exists
    try {
      await db.query(`
        UPDATE mentors 
        SET is_active = 0 
        WHERE mentor_converse_id = ?
      `, [user.converse_id]);
    } catch (mentorError) {
      console.warn('Could not update mentors table:', mentorError.message);
    }
    
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
    res.status(500).json({
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
export const testAdminUserRoutes = async (req, res) => {
  try {
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
    
  } catch (error) {
    console.error('❌ Error in admin user routes test:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Admin user routes test failed',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// EXPORT ALL FUNCTIONS
// ===============================================

export {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  searchUsers,
  updateUserRole,
  grantPostingRights,
  banUser,
  unbanUser,
  generateBulkIds,
  generateConverseId,
  generateClassIdForAdmin,
  maskUserIdentity,
  exportUserData,
  getUserStats,
  getMentors,
  assignMentorRole,
  removeMentorRole,
  testAdminUserRoutes
};