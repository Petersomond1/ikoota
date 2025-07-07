
// ikootaapi/controllers/userController.js (updated methods)

import db from '../config/db.js';
import identityMaskingService from '../services/identityMaskingService.js';
import { 
  getUserProfileService, 
  updateUserProfileService, 
  // updateUser,
 // getAllUsers,
  getUserStats,
  getUserActivity,
  deleteUser
} from '../services/userServices.js';

// Enhanced getUserProfile with better error handling
export const getUserProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    if (!user_id) {
      return res.status(401).json({ 
        success: false, 
        error: 'User authentication required',
        message: 'Please login to access your profile'
      });
    }

    const userProfile = await getUserProfileService(user_id);
    
    res.status(200).json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch user profile'
    });
  }
};

// Enhanced updateUserProfile with validation
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.user_id; // Fixed: was using userId instead of user_id
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User authentication required',
        message: 'Please login to update your profile'
      });
    }

    const { username, email, phone, avatar, converse_id, mentor_id, class_id } = req.body;

    // Basic validation
    if (email && !email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    if (phone && phone.length < 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phone number',
        message: 'Phone number must be at least 5 characters'
      });
    }

    const updatedProfile = await updateUserProfileService(userId, req.body);
    
    res.status(200).json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('required') ? 400 : 500;
    
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to update user profile'
    });
  }
};

// Enhanced updateUserRole with authorization checks
export const updateUserRole = async (req, res) => {
  try {
    const { userId, role, is_member, isblocked, isbanned, mentor_id, class_id } = req.body;
    const requestingUser = req.user;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required',
        message: 'Please provide a valid user ID'
      });
    }

    // Authorization check - only admins and super_admins can update user roles
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied',
        message: 'Only administrators can update user roles'
      });
    }

    // Super admin check for sensitive operations
    if ((role === 'super_admin' || role === 'admin') && requestingUser.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied',
        message: 'Only super administrators can assign admin roles'
      });
    }

    const updateData = {
      role,
      is_member,
      isblocked,
      isbanned,
      mentor_id,
      class_id
    };

    const updatedUser = await updateUser(userId, updateData);
    
    res.status(200).json({ 
      success: true, 
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Invalid') ? 400 : 500;
    
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to update user'
    });
  }
};

// NEW: Get all users with filtering
export const fetchAllUsers = async (req, res) => {
  try {
    const requestingUser = req.user;

    // Authorization check - only admins and super_admins can view all users
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied',
        message: 'Only administrators can view all users'
      });
    }

    const { 
      role, 
      is_member, 
      isblocked, 
      isbanned, 
      search, 
      page = 1, 
      limit = 20 
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
      data: result.users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit))
      },
      filters: {
        role,
        is_member,
        isblocked,
        isbanned,
        search
      }
    });
  } catch (error) {
    console.error('Error in fetchAllUsers:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch users'
    });
  }
};

// NEW: Get user statistics
export const fetchUserStats = async (req, res) => {
  try {
    const requestingUser = req.user;

    // Authorization check - only admins and super_admins can view user stats
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied',
        message: 'Only administrators can view user statistics'
      });
    }

    const stats = await getUserStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in fetchUserStats:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch user statistics'
    });
  }
};

// NEW: Get user activity
export const fetchUserActivity = async (req, res) => {
  try {
    const { user_id } = req.params;
    const requestingUser = req.user;

    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required',
        message: 'Please provide a valid user ID'
      });
    }

    // Users can only view their own activity unless they're admin
    if (user_id !== requestingUser.user_id && !['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied',
        message: 'You can only view your own activity'
      });
    }

    const activity = await getUserActivity(user_id);
    
    res.status(200).json({
      success: true,
      data: activity,
      user_id
    });
  } catch (error) {
    console.error('Error in fetchUserActivity:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch user activity'
    });
  }
};

// NEW: Get user by ID (for admin use)
export const fetchUserById = async (req, res) => {
  try {
    const { user_id } = req.params;
    const requestingUser = req.user;

    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required',
        message: 'Please provide a valid user ID'
      });
    }

    // Users can only view their own profile unless they're admin
    if (user_id !== requestingUser.user_id && !['admin', 'super_admin'].includes(requestingUser.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied',
        message: 'You can only view your own profile'
      });
    }

    const userProfile = await getUserProfileService(user_id);
    
    res.status(200).json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Error in fetchUserById:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch user'
    });
  }
};

// NEW: Delete user (soft delete)
export const removeUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const requestingUser = req.user;

    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required',
        message: 'Please provide a valid user ID'
      });
    }

    // Authorization check - only super_admins can delete users
    if (requestingUser.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied',
        message: 'Only super administrators can delete users'
      });
    }

    // Prevent self-deletion
    if (user_id === requestingUser.user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete own account',
        message: 'You cannot delete your own account'
      });
    }

    const result = await deleteUser(user_id);
    
    res.status(200).json({ 
      success: true, 
      message: `User ${result.username} has been deleted successfully`,
      deleted_user: result.username
    });
  } catch (error) {
    console.error('Error in removeUser:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to delete user'
    });
  }
};

/**
 * Get users with appropriate data based on requestor's role
 */
export const getUsers = async (req, res) => {
    try {
        const requestorRole = req.user.role;
        
        let sql;
        if (requestorRole === 'super_admin') {
            // Super admin can see all data
            sql = `
                SELECT id, username, email, phone, converse_id, mentor_id, class_id, 
                       role, is_member, isblocked, isbanned, is_identity_masked, 
                       converse_avatar, createdAt, updatedAt
                FROM users 
                ORDER BY createdAt DESC
            `;
        } else if (requestorRole === 'admin') {
            // Regular admin sees converse data only for masked users
            sql = `
                SELECT id, 
                       CASE 
                           WHEN is_identity_masked = 1 THEN CONCAT('User_', converse_id)
                           ELSE username 
                       END as username,
                       CASE 
                           WHEN is_identity_masked = 1 THEN CONCAT(converse_id, '@masked.local')
                           ELSE email 
                       END as email,
                       CASE 
                           WHEN is_identity_masked = 1 THEN NULL
                           ELSE phone 
                       END as phone,
                       converse_id, mentor_id, class_id, role, is_member, 
                       isblocked, isbanned, is_identity_masked, converse_avatar,
                       createdAt, updatedAt
                FROM users 
                ORDER BY createdAt DESC
            `;
        } else {
            // Regular users only see converse data
            sql = `
                SELECT converse_id, 
                       CONCAT('User_', converse_id) as username,
                       converse_avatar, class_id, role, is_member
                FROM users 
                WHERE is_member = 'granted' AND is_identity_masked = 1
                ORDER BY createdAt DESC
            `;
        }

        const users = await db.query(sql);
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

/**
 * Get mentors (users who can be assigned as mentors)
 */
export const getMentors = async (req, res) => {
    try {
        const mentors = await db.query(`
            SELECT converse_id, role, class_id,
                   CONCAT('User_', converse_id) as display_name
            FROM users 
            WHERE role IN ('admin', 'super_admin') 
               OR (role = 'user' AND is_member = 'granted' AND is_identity_masked = 1)
            ORDER BY role DESC, createdAt DESC
        `);

        res.status(200).json(mentors);
    } catch (error) {
        console.error('Error fetching mentors:', error);
        res.status(500).json({ error: 'Failed to fetch mentors' });
    }
};

// Get all users for admin panel
export const getAllUsers = async (req, res) => {
  try {
    console.log('🔍 Admin users request from user:', req.user.username);
    
    const users = await userService.getAllUsersForAdmin();
    
    res.json({
      success: true,
      users: users || []
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      details: error.message
    });
  }
};

// Get all mentors for admin panel
export const getAllMentors = async (req, res) => {
  try {
    console.log('🔍 Admin mentors request from user:', req.user.username);
    
    const mentors = await userService.getAllMentorsForAdmin();
    
    res.json({
      success: true,
      mentors: mentors || []
    });
  } catch (error) {
    console.error('❌ Error fetching mentors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mentors',
      details: error.message
    });
  }
};

// Update user for admin
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('🔧 Updating user:', id, 'with data:', updateData);
    
    // Validate input
    if (!id || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID or update data'
      });
    }
    
    const updatedUser = await userService.updateUserByAdmin(id, updateData);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      details: error.message
    });
  }
};

// Get membership overview statistics
export const getMembershipOverview = async (req, res) => {
  try {
    console.log('📊 Admin membership overview request');
    
    const overview = await userService.getMembershipOverviewStats();
    
    res.json({
      success: true,
      overview: overview
    });
    
  } catch (error) {
    console.error('❌ Error fetching membership overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch membership overview',
      details: error.message
    });
  }
};

// Get classes information
export const getClasses = async (req, res) => {
  try {
    console.log('🔍 Classes request from user:', req.user.username);
    
    const classes = await userService.getAllClasses();
    
    res.json({
      success: true,
      classes: classes || []
    });
  } catch (error) {
    console.error('❌ Error fetching classes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch classes',
      details: error.message
    });
  }
};

