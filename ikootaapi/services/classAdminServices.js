// ikootaapi/services/classAdminServices.js
// ADMIN CLASS MANAGEMENT SERVICES - COMPLETE BUSINESS LOGIC IMPLEMENTATION
// All database operations and business logic for admin class management

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { generateUniqueClassId } from '../utils/idGenerator.js';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate class ID format (OTU#XXXXXX)
 */
const validateClassIdFormat = (classId) => {
  if (!classId || typeof classId !== 'string') return false;
  if (classId === 'OTU#Public') return true;
  return /^OTU#[A-Za-z0-9]+$/.test(classId) && classId.length >= 5;
};

/**
 * Format class ID for display
 */
const formatClassIdForDisplay = (classId) => {
  if (classId === 'OTU#Public') return 'Public Community';
  return classId;
};

/**
 * Calculate class health score
 */
const calculateClassHealthScore = (classData) => {
  let score = 0;
  let maxScore = 100;

  // Capacity utilization (30 points)
  if (classData.max_members > 0) {
    const utilization = (classData.total_members || 0) / classData.max_members;
    if (utilization >= 0.7 && utilization <= 0.9) score += 30;
    else if (utilization >= 0.5) score += 20;
    else if (utilization >= 0.3) score += 10;
  }

  // Activity level (25 points)
  const daysSinceCreation = Math.floor((new Date() - new Date(classData.createdAt)) / (1000 * 60 * 60 * 24));
  if (daysSinceCreation > 0) {
    const memberGrowthRate = (classData.total_members || 0) / daysSinceCreation;
    if (memberGrowthRate > 1) score += 25;
    else if (memberGrowthRate > 0.5) score += 20;
    else if (memberGrowthRate > 0.1) score += 15;
    else if (memberGrowthRate > 0) score += 10;
  }

  // Content availability (20 points)
  if (classData.description && classData.description.length > 50) score += 10;
  if (classData.tags && classData.tags.length > 0) score += 5;
  if (classData.learning_objectives) score += 5;

  // Moderation (15 points)
  if ((classData.moderators || 0) >= 2) score += 15;
  else if ((classData.moderators || 0) >= 1) score += 10;

  // Completion (10 points)
  if (classData.difficulty_level) score += 5;
  if (classData.category) score += 3;
  if (classData.estimated_duration) score += 2;

  return Math.min(score, maxScore);
};

/**
 * Generate unique class ID
 */
const generateClassId = async () => {
  return await generateUniqueClassId();
};

// =============================================================================
// HEALTH CHECK AND TEST SERVICES
// =============================================================================

/**
 * Test system connectivity and permissions
 */
export const testSystemConnectivity = async () => {
  try {
    // Test database connection
    const [dbTest] = await db.query('SELECT 1 as test');
    
    // Test class table access
    const [classCount] = await db.query('SELECT COUNT(*) as count FROM classes');
    
    // Test user table access
    const [userCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE role IN ("admin", "super_admin")');
    
    // Test membership table access
    const [membershipCount] = await db.query('SELECT COUNT(*) as count FROM user_class_memberships');
    
    return {
      database_connection: 'healthy',
      tables_accessible: true,
      total_classes: classCount[0].count,
      total_admins: userCount[0].count,
      total_memberships: membershipCount[0].count,
      test_timestamp: new Date().toISOString(),
      system_status: 'operational'
    };
    
  } catch (error) {
    console.error('❌ System connectivity test failed:', error);
    throw new CustomError('System connectivity test failed', 500);
  }
};

/**
 * Get system health status
 */
export const getSystemHealthStatus = async () => {
  try {
    const [systemStats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM classes) as total_classes,
        (SELECT COUNT(*) FROM classes WHERE is_active = 1) as active_classes,
        (SELECT COUNT(*) FROM user_class_memberships WHERE membership_status = 'active') as active_memberships,
        (SELECT COUNT(*) FROM users WHERE role IN ('admin', 'super_admin')) as admin_users,
        (SELECT COUNT(*) FROM classes WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as classes_created_24h
    `);
    
    const stats = systemStats[0];
    
    // Determine overall health
    let overallHealth = 'healthy';
    let issues = [];
    
    if (stats.active_classes === 0) {
      overallHealth = 'warning';
      issues.push('No active classes found');
    }
    
    if (stats.admin_users === 0) {
      overallHealth = 'critical';
      issues.push('No admin users found');
    }
    
    return {
      overall_status: overallHealth,
      statistics: stats,
      issues: issues,
      uptime: 'Available', // Could be enhanced with actual uptime tracking
      last_check: new Date().toISOString(),
      version: '1.0.0'
    };
    
  } catch (error) {
    console.error('❌ Health status check failed:', error);
    throw new CustomError('Health status check failed', 500);
  }
};

// =============================================================================
// CLASS MANAGEMENT SERVICES
// =============================================================================

/**
 * Create a new class
 */
export const createNewClass = async (classData, adminUserId) => {
  try {
    const {
      class_name,
      public_name,
      description,
      class_type = 'demographic',
      category,
      difficulty_level = 'beginner',
      is_public = false,
      max_members = 50,
      estimated_duration,
      prerequisites,
      learning_objectives,
      tags,
      privacy_level = 'members_only',
      allow_self_join = true,
      require_full_membership = false,
      auto_approve_members = true,
      require_approval = false,
      allow_preview = true
    } = classData;

    if (!class_name || class_name.trim().length === 0) {
      throw new CustomError('Class name is required', 400);
    }

    // Check if admin user exists
    const [adminUser] = await db.query(
      'SELECT id, username FROM users WHERE id = ? AND role IN ("admin", "super_admin")',
      [adminUserId]
    );

    if (!adminUser.length) {
      throw new CustomError('Admin user not found or insufficient permissions', 403);
    }

    // Generate unique class ID
    const class_id = await generateClassId();

    // Prepare data for insertion
    const insertData = {
      class_id,
      class_name: class_name.trim(),
      public_name: (public_name || class_name).trim(),
      description: description || null,
      class_type,
      category: category || null,
      difficulty_level,
      is_public: Boolean(is_public),
      max_members: parseInt(max_members),
      estimated_duration: estimated_duration ? parseInt(estimated_duration) : null,
      prerequisites: prerequisites || null,
      learning_objectives: learning_objectives || null,
      tags: tags || null,
      privacy_level,
      created_by: adminUserId,
      is_active: true,
      allow_self_join: Boolean(allow_self_join),
      require_full_membership: Boolean(require_full_membership),
      auto_approve_members: Boolean(auto_approve_members),
      require_approval: Boolean(require_approval),
      allow_preview: Boolean(allow_preview),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const sql = `
      INSERT INTO classes (
        class_id, class_name, public_name, description, class_type, category,
        difficulty_level, is_public, max_members, estimated_duration, 
        prerequisites, learning_objectives, tags, privacy_level, created_by, 
        is_active, allow_self_join, require_full_membership, auto_approve_members,
        require_approval, allow_preview, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [insertResult] = await db.query(sql, Object.values(insertData));

    // Add admin as moderator of the class
    await db.query(`
      INSERT INTO user_class_memberships 
      (user_id, class_id, membership_status, role_in_class, joinedAt, assigned_by, 
       receive_notifications, can_see_class_name, createdAt, updatedAt)
      VALUES (?, ?, 'active', 'moderator', NOW(), ?, 1, 1, NOW(), NOW())
    `, [adminUserId, class_id, adminUserId]);

    console.log(`✅ Class ${class_id} (${class_name}) created by admin ${adminUser[0].username}`);

    // Return the created class data
    const [newClass] = await db.query(
      'SELECT * FROM classes WHERE class_id = ?',
      [class_id]
    );

    const result = newClass[0];
    return {
      ...result,
      display_id: formatClassIdForDisplay(class_id),
      created_by_username: adminUser[0].username,
      total_members: 1, // Admin is automatically added as moderator
      available_spots: result.max_members - 1
    };

  } catch (error) {
    console.error('❌ createNewClass error:', error);
    if (error instanceof CustomError) throw error;
    if (error.code === 'ER_DUP_ENTRY') {
      throw new CustomError('Class with this name already exists', 409);
    }
    throw new CustomError('Failed to create class', 500);
  }
};

/**
 * Get all classes for admin with comprehensive filters
 */
export const getAllClassesForAdmin = async (filters = {}, options = {}) => {
  try {
    const { 
      class_type, 
      is_active, 
      search, 
      date_from, 
      date_to, 
      created_by, 
      min_members, 
      max_members 
    } = filters;
    
    const { 
      page = 1, 
      limit = 20, 
      sort_by = 'createdAt', 
      sort_order = 'DESC',
      include_stats = true 
    } = options;
    
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['1=1'];
    const queryParams = [];

    if (class_type) {
      whereConditions.push('c.class_type = ?');
      queryParams.push(class_type);
    }

    if (is_active !== undefined) {
      whereConditions.push('c.is_active = ?');
      queryParams.push(is_active === 'true' || is_active === true ? 1 : 0);
    }

    if (search) {
      whereConditions.push('(c.class_name LIKE ? OR c.public_name LIKE ? OR c.description LIKE ? OR c.tags LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (date_from) {
      whereConditions.push('c.createdAt >= ?');
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push('c.createdAt <= ?');
      queryParams.push(date_to);
    }

    if (created_by) {
      whereConditions.push('c.created_by = ?');
      queryParams.push(created_by);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM classes c 
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id 
      WHERE ${whereClause}
    `;
    
    let countParams = [...queryParams];
    if (min_members) {
      countParams.push(min_members);
    }
    if (max_members) {
      countParams.push(max_members);
    }
    
    const [countResult] = await db.query(countSql, countParams);
    const total = countResult[0].total;

    // Build main query
    const sql = `
      SELECT 
        c.*,
        u.username as created_by_username,
        u.email as created_by_email,
        COALESCE(cmc.total_members, 0) as total_members,
        COALESCE(cmc.moderators, 0) as moderators,
        COALESCE(cmc.pending_members, 0) as pending_members,
        ${include_stats ? `
        DATEDIFF(NOW(), c.createdAt) as days_since_creation,
        CASE 
          WHEN c.max_members > 0 THEN ROUND((COALESCE(cmc.total_members, 0) / c.max_members) * 100, 2)
          ELSE 0 
        END as capacity_percentage,
        CASE 
          WHEN c.max_members <= COALESCE(cmc.total_members, 0) THEN 1
          ELSE 0 
        END as is_at_capacity
        ` : '0 as days_since_creation, 0 as capacity_percentage, 0 as is_at_capacity'}
      FROM classes c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      WHERE ${whereClause}
      ${min_members ? 'AND COALESCE(cmc.total_members, 0) >= ?' : ''}
      ${max_members ? 'AND COALESCE(cmc.total_members, 0) <= ?' : ''}
      ORDER BY 
        CASE WHEN c.class_id = 'OTU#Public' THEN 0 ELSE 1 END,
        c.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;
    
    const finalParams = [...queryParams];
    if (min_members) finalParams.push(min_members);
    if (max_members) finalParams.push(max_members);
    finalParams.push(limit, offset);

    const [classes] = await db.query(sql, finalParams);

    // Format results
    const formattedClasses = classes.map(cls => ({
      ...cls,
      display_id: formatClassIdForDisplay(cls.class_id),
      health_score: include_stats ? calculateClassHealthScore(cls) : null,
      available_spots: cls.max_members - (cls.total_members || 0),
      tags: cls.tags ? cls.tags.split(',').map(tag => tag.trim()) : [],
      prerequisites: cls.prerequisites || null,
      learning_objectives: cls.learning_objectives || null
    }));

    // Get summary statistics if requested
    let summary = null;
    if (include_stats) {
      const [summaryResult] = await db.query(`
        SELECT 
          COUNT(*) as total_classes,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_classes,
          SUM(CASE WHEN class_type = 'demographic' THEN 1 ELSE 0 END) as demographic_classes,
          SUM(CASE WHEN class_type = 'subject' THEN 1 ELSE 0 END) as subject_classes,
          SUM(CASE WHEN class_type = 'public' THEN 1 ELSE 0 END) as public_classes,
          SUM(CASE WHEN class_type = 'special' THEN 1 ELSE 0 END) as special_classes,
          SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as publicly_visible,
          AVG(max_members) as avg_max_capacity,
          AVG(COALESCE(cmc.total_members, 0)) as avg_current_members
        FROM classes c
        LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
        WHERE ${whereClause}
      `, queryParams);
      
      summary = summaryResult[0];
      if (summary) {
        summary.avg_max_capacity = Math.round(summary.avg_max_capacity || 0);
        summary.avg_current_members = Math.round(summary.avg_current_members || 0);
        summary.overall_capacity_utilization = summary.avg_max_capacity > 0 ? 
          Math.round((summary.avg_current_members / summary.avg_max_capacity) * 100) : 0;
      }
    }

    return {
      data: formattedClasses,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: limit,
        has_next: page < Math.ceil(total / limit),
        has_previous: page > 1
      },
      summary,
      filters_applied: Object.keys(filters).filter(key => filters[key] !== undefined).length
    };

  } catch (error) {
    console.error('❌ getAllClassesForAdmin error:', error);
    throw new CustomError('Failed to fetch classes', 500);
  }
};

/**
 * Get class by ID for admin with comprehensive details
 */
export const getClassByIdForAdmin = async (classId, adminUserId) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format', 400);
    }

    const [classData] = await db.query(`
      SELECT 
        c.*,
        u.username as created_by_username,
        u.email as created_by_email,
        COALESCE(cmc.total_members, 0) as total_members,
        COALESCE(cmc.moderators, 0) as moderators,
        COALESCE(cmc.pending_members, 0) as pending_members,
        DATEDIFF(NOW(), c.createdAt) as days_since_creation,
        CASE 
          WHEN c.max_members > 0 THEN ROUND((COALESCE(cmc.total_members, 0) / c.max_members) * 100, 2)
          ELSE 0 
        END as capacity_percentage
      FROM classes c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      WHERE c.class_id = ?
    `, [classId]);

    if (!classData.length) {
      throw new CustomError('Class not found', 404);
    }

    const cls = classData[0];

    // Get recent member activity
    const [recentMembers] = await db.query(`
      SELECT 
        u.username, 
        ucm.role_in_class, 
        ucm.membership_status,
        ucm.joinedAt
      FROM user_class_memberships ucm
      JOIN users u ON ucm.user_id = u.id
      WHERE ucm.class_id = ?
      ORDER BY ucm.joinedAt DESC
      LIMIT 10
    `, [classId]);

    // Get admin's role in this class (if any)
    const [adminRole] = await db.query(`
      SELECT role_in_class, membership_status
      FROM user_class_memberships 
      WHERE user_id = ? AND class_id = ?
    `, [adminUserId, classId]);

    return {
      ...cls,
      display_id: formatClassIdForDisplay(classId),
      health_score: calculateClassHealthScore(cls),
      available_spots: cls.max_members - cls.total_members,
      tags: cls.tags ? cls.tags.split(',').map(tag => tag.trim()) : [],
      prerequisites: cls.prerequisites || null,
      learning_objectives: cls.learning_objectives || null,
      recent_members: recentMembers,
      admin_role_in_class: adminRole.length ? adminRole[0] : null,
      is_admin_member: adminRole.length > 0
    };

  } catch (error) {
    console.error('❌ getClassByIdForAdmin error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to fetch class details', 500);
  }
};

/**
 * Update class data
 */
export const updateClassData = async (classId, updateData, adminUserId) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format', 400);
    }

    // Verify class exists
    const [existingClass] = await db.query(
      'SELECT * FROM classes WHERE class_id = ?',
      [classId]
    );

    if (!existingClass.length) {
      throw new CustomError('Class not found', 404);
    }

    // Prepare update fields
    const allowedFields = [
      'class_name', 'public_name', 'description', 'class_type', 'category',
      'difficulty_level', 'is_public', 'max_members', 'estimated_duration',
      'prerequisites', 'learning_objectives', 'tags', 'privacy_level',
      'is_active', 'allow_self_join', 'require_full_membership', 
      'auto_approve_members', 'require_approval', 'allow_preview'
    ];

    const updateFields = [];
    const params = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        
        // Handle boolean fields
        if (['is_public', 'is_active', 'allow_self_join', 'require_full_membership', 
             'auto_approve_members', 'require_approval', 'allow_preview'].includes(key)) {
          params.push(Boolean(value));
        } 
        // Handle numeric fields
        else if (['max_members', 'estimated_duration'].includes(key)) {
          params.push(value ? parseInt(value) : null);
        } 
        // Handle string fields
        else {
          params.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
      throw new CustomError('No valid fields to update', 400);
    }

    updateFields.push('updatedAt = NOW()');
    params.push(classId);

    const sql = `UPDATE classes SET ${updateFields.join(', ')} WHERE class_id = ?`;
    const [updateResult] = await db.query(sql, params);

    if (updateResult.affectedRows === 0) {
      throw new CustomError('Class not found', 404);
    }

    console.log(`✅ Class ${classId} updated by admin ${adminUserId}. Fields: ${Object.keys(updateData).join(', ')}`);

    // Return updated class data
    const [updatedClass] = await db.query(`
      SELECT 
        c.*,
        u.username as created_by_username,
        COALESCE(cmc.total_members, 0) as total_members
      FROM classes c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      WHERE c.class_id = ?
    `, [classId]);

    const result = updatedClass[0];
    return {
      ...result,
      display_id: formatClassIdForDisplay(classId),
      available_spots: result.max_members - (result.total_members || 0),
      tags: result.tags ? result.tags.split(',').map(tag => tag.trim()) : []
    };

  } catch (error) {
    console.error('❌ updateClassData error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to update class', 500);
  }
};

/**
 * Delete class by ID with safety checks
 */
export const deleteClassById = async (classId, options = {}, adminUserId) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format', 400);
    }

    const { 
      force = false, 
      transfer_members_to, 
      archive_instead = false,
      deletion_reason 
    } = options;

    // Get class info and member count
    const [classInfo] = await db.query(`
      SELECT 
        c.*,
        COALESCE(cmc.total_members, 0) as member_count
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      WHERE c.class_id = ?
    `, [classId]);
    
    if (!classInfo.length) {
      throw new CustomError('Class not found', 404);
    }

    const cls = classInfo[0];
    const memberCount = cls.member_count;

    // Safety check for public class
    if (classId === 'OTU#Public' && !force) {
      throw new CustomError('Cannot delete the public class without force flag', 403);
    }

    // Safety check for classes with members
    if (!force && memberCount > 0 && !transfer_members_to && !archive_instead) {
      throw new CustomError(
        `Cannot delete class with ${memberCount} members. Use force=true, transfer_members_to, or archive_instead=true.`, 
        400
      );
    }

    if (archive_instead) {
      // Archive the class instead of deleting
      await db.query(`
        UPDATE classes 
        SET is_active = 0, updatedAt = NOW()
        WHERE class_id = ?
      `, [classId]);

      return {
        action: 'archived',
        class_id: classId,
        class_name: cls.class_name,
        display_id: formatClassIdForDisplay(classId),
        members_count: memberCount,
        archived_by: adminUserId,
        archivedAt: new Date().toISOString(),
        archive_reason: deletion_reason
      };
    }

    // Handle member transfer if specified
    if (transfer_members_to && memberCount > 0) {
      const [targetClass] = await db.query(
        'SELECT class_id, class_name FROM classes WHERE class_id = ? AND is_active = 1',
        [transfer_members_to]
      );
      
      if (!targetClass.length) {
        throw new CustomError('Target class for member transfer not found or inactive', 400);
      }

      const [transferResult] = await db.query(`
        UPDATE user_class_memberships 
        SET class_id = ?, updatedAt = NOW()
        WHERE class_id = ? AND membership_status = 'active'
      `, [transfer_members_to, classId]);

      console.log(`✅ Transferred ${transferResult.affectedRows} members from ${classId} to ${transfer_members_to}`);
    }

    // Delete the class
    const [deleteResult] = await db.query('DELETE FROM classes WHERE class_id = ?', [classId]);

    if (deleteResult.affectedRows === 0) {
      throw new CustomError('Class not found', 404);
    }

    console.log(`✅ Class ${classId} deleted by admin ${adminUserId}. Reason: ${deletion_reason || 'No reason provided'}`);

    return {
      action: 'deleted',
      class_id: classId,
      class_name: cls.class_name,
      display_id: formatClassIdForDisplay(classId),
      members_affected: memberCount,
      members_transferred_to: transfer_members_to || null,
      force_delete: force,
      deleted_by: adminUserId,
      deletion_reason,
      deletedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ deleteClassById error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to delete class', 500);
  }
};

// =============================================================================
// PARTICIPANT MANAGEMENT SERVICES
// =============================================================================

/**
 * Get class participants for admin with filtering
 */
export const getClassParticipantsForAdmin = async (classId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format', 400);
    }

    const { 
      page = 1,
      limit = 50,
      role_in_class, 
      membership_status = 'active', 
      search,
      sort_by = 'joinedAt',
      sort_order = 'DESC',
      include_inactive = false,
      date_from,
      date_to
    } = options;
    
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['ucm.class_id = ?'];
    const params = [classId];

    if (membership_status) {
      whereConditions.push('ucm.membership_status = ?');
      params.push(membership_status);
    }

    if (role_in_class) {
      whereConditions.push('ucm.role_in_class = ?');
      params.push(role_in_class);
    }

    if (search) {
      whereConditions.push('(u.username LIKE ? OR u.email LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (date_from) {
      whereConditions.push('ucm.joinedAt >= ?');
      params.push(date_from);
    }

    if (date_to) {
      whereConditions.push('ucm.joinedAt <= ?');
      params.push(date_to);
    }

    if (!include_inactive) {
      whereConditions.push('(ucm.expiresAt IS NULL OR ucm.expiresAt > NOW())');
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total 
      FROM user_class_memberships ucm 
      INNER JOIN users u ON ucm.user_id = u.id
      WHERE ${whereClause}
    `, params);
    
    const total = countResult[0].total;

    // Get participants
    const sql = `
      SELECT 
        u.id as user_id,
        u.username,
        u.email,
        u.phone,
        u.avatar,
        u.membership_stage,
        u.is_member,
        u.role as user_role,
        ucm.role_in_class,
        ucm.membership_status,
        ucm.joinedAt,
        ucm.expiresAt,
        ucm.assigned_by,
        ucm.receive_notifications,
        ucm.can_see_class_name,
        ucm.createdAt as membership_createdAt,
        ucm.updatedAt as membership_updatedAt,
        DATEDIFF(NOW(), ucm.joinedAt) as days_as_member,
        assigned_by_user.username as assigned_by_username
      FROM user_class_memberships ucm
      INNER JOIN users u ON ucm.user_id = u.id
      LEFT JOIN users assigned_by_user ON ucm.assigned_by = assigned_by_user.id
      WHERE ${whereClause}
      ORDER BY ucm.${sort_by} ${sort_order.toUpperCase()}
      LIMIT ? OFFSET ?
    `;
    
    const [participants] = await db.query(sql, [...params, limit, offset]);

    // Get role distribution
    const [roleDistribution] = await db.query(`
      SELECT 
        role_in_class,
        COUNT(*) as count
      FROM user_class_memberships
      WHERE class_id = ? AND membership_status = 'active'
      GROUP BY role_in_class
    `, [classId]);

    return {
      data: participants,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: limit,
        has_next: page < Math.ceil(total / limit),
        has_previous: page > 1
      },
      summary: {
        total_participants: total,
        role_distribution: roleDistribution,
        active_participants: participants.filter(p => 
          !p.expiresAt || new Date(p.expiresAt) > new Date()
        ).length
      }
    };

  } catch (error) {
    console.error('❌ getClassParticipantsForAdmin error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to fetch class participants', 500);
  }
};

/**
 * Add participant to class
 */
export const addParticipantToClass = async (classId, participantData, adminUserId) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format', 400);
    }

    const {
      user_id,
      user_ids, // For bulk add
      role_in_class = 'member',
      receive_notifications = true,
      expires_at,
      can_see_class_name = true,
      assignment_reason
    } = participantData;

    // Verify class exists
    const [classCheck] = await db.query(
      'SELECT class_id, class_name, max_members FROM classes WHERE class_id = ? AND is_active = 1',
      [classId]
    );

    if (!classCheck.length) {
      throw new CustomError('Active class not found', 404);
    }

    const classInfo = classCheck[0];

    // Handle bulk add
    if (user_ids && Array.isArray(user_ids)) {
      const results = [];
      for (const userId of user_ids) {
        try {
          const result = await addSingleParticipant(classId, userId, {
            role_in_class,
            receive_notifications,
            expires_at,
            can_see_class_name,
            assignment_reason,
            assigned_by: adminUserId
          });
          results.push({ user_id: userId, success: true, ...result });
        } catch (error) {
          results.push({ user_id: userId, success: false, error: error.message });
        }
      }
      return {
        results,
        summary: {
          total_requested: user_ids.length,
          successful_count: results.filter(r => r.success).length,
          failed_count: results.filter(r => !r.success).length
        }
      };
    }
    // Single user add
    else if (user_id) {
      return await addSingleParticipant(classId, user_id, {
        role_in_class,
        receive_notifications,
        expires_at,
        can_see_class_name,
        assignment_reason,
        assigned_by: adminUserId
      });
    } else {
      throw new CustomError('user_id or user_ids is required', 400);
    }

  } catch (error) {
    console.error('❌ addParticipantToClass error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to add participant to class', 500);
  }
};

/**
 * Helper function to add single participant
 */
const addSingleParticipant = async (classId, userId, options) => {
  const {
    role_in_class = 'member',
    receive_notifications = true,
    expires_at,
    can_see_class_name = true,
    assignment_reason,
    assigned_by
  } = options;

  // Check if user exists
  const [userCheck] = await db.query(
    'SELECT id, username FROM users WHERE id = ?',
    [userId]
  );

  if (!userCheck.length) {
    throw new CustomError('User not found', 404);
  }

  // Check if user is already a member
  const [existingMembership] = await db.query(
    'SELECT membership_status FROM user_class_memberships WHERE user_id = ? AND class_id = ?',
    [userId, classId]
  );

  if (existingMembership.length > 0) {
    throw new CustomError('User is already a member of this class', 409);
  }

  // Add participant
  const [insertResult] = await db.query(`
    INSERT INTO user_class_memberships 
    (user_id, class_id, role_in_class, membership_status, receive_notifications, 
     can_see_class_name, expiresAt, assigned_by, joinedAt, createdAt, updatedAt)
    VALUES (?, ?, ?, 'active', ?, ?, ?, ?, NOW(), NOW(), NOW())
  `, [
    userId, classId, role_in_class, Boolean(receive_notifications),
    Boolean(can_see_class_name), expires_at || null, assigned_by
  ]);

  console.log(`✅ Admin ${assigned_by} added user ${userId} to class ${classId} as ${role_in_class}`);

  return {
    membership_id: insertResult.insertId,
    user_id: userId,
    username: userCheck[0].username,
    class_id: classId,
    role_in_class: role_in_class,
    membership_status: 'active',
    joinedAt: new Date()
  };
};

/**
 * Manage participant membership (approve, reject, change role, etc.)
 */
export const manageParticipantMembership = async (classId, userId, actionData, adminUserId) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format', 400);
    }

    const { action, new_role, reason } = actionData;

    // Check if membership exists
    const [membershipCheck] = await db.query(`
      SELECT ucm.*, u.username, c.class_name 
      FROM user_class_memberships ucm
      JOIN users u ON ucm.user_id = u.id
      JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.class_id = ?
    `, [userId, classId]);

    if (!membershipCheck.length) {
      throw new CustomError('Membership not found', 404);
    }

    const membership = membershipCheck[0];
    let updateResult = {};
    let message = '';

    switch (action) {
      case 'approve':
        if (membership.membership_status === 'active') {
          throw new CustomError('User is already approved', 400);
        }

        await db.query(
          'UPDATE user_class_memberships SET membership_status = "active", updatedAt = NOW() WHERE user_id = ? AND class_id = ?',
          [userId, classId]
        );

        updateResult = { membership_status: 'active' };
        message = 'Participant approved successfully';
        break;

      case 'reject':
      case 'suspend':
        await db.query(
          'UPDATE user_class_memberships SET membership_status = "suspended", updatedAt = NOW() WHERE user_id = ? AND class_id = ?',
          [userId, classId]
        );

        updateResult = { membership_status: 'suspended' };
        message = 'Participant suspended successfully';
        break;

      case 'remove':
        await db.query(
          'UPDATE user_class_memberships SET membership_status = "expired", updatedAt = NOW() WHERE user_id = ? AND class_id = ?',
          [userId, classId]
        );

        updateResult = { membership_status: 'expired' };
        message = 'Participant removed successfully';
        break;

      case 'change_role':
      case 'promote':
      case 'demote':
        if (!new_role || !['member', 'moderator', 'assistant'].includes(new_role)) {
          throw new CustomError('Invalid role. Must be: member, moderator, or assistant', 400);
        }
        if (membership.membership_status !== 'active') {
          throw new CustomError('Only active members can have role changes', 400);
        }
        if (membership.role_in_class === new_role) {
          throw new CustomError(`User already has the role: ${new_role}`, 400);
        }

        await db.query(
          'UPDATE user_class_memberships SET role_in_class = ?, updatedAt = NOW() WHERE user_id = ? AND class_id = ?',
          [new_role, userId, classId]
        );

        updateResult = { 
          previous_role: membership.role_in_class, 
          new_role 
        };
        message = `Role changed to ${new_role} successfully`;
        break;

      default:
        throw new CustomError('Invalid action. Must be: approve, reject, remove, change_role, promote, or demote', 400);
    }

    console.log(`✅ Class membership action: ${action} for user ${userId} in class ${classId} by admin ${adminUserId}`);

    return {
      success: true,
      message,
      action,
      user_id: userId,
      username: membership.username,
      class_id: classId,
      class_name: membership.class_name,
      display_id: formatClassIdForDisplay(classId),
      previous_status: membership.membership_status,
      previous_role: membership.role_in_class,
      ...updateResult,
      reason,
      performed_by: adminUserId,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ manageParticipantMembership error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to manage participant membership', 500);
  }
};

/**
 * Remove participant from class
 */
export const removeParticipantFromClass = async (classId, userId, options, adminUserId) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format', 400);
    }

    const { reason, notify_user = true } = options;

    // Check if membership exists
    const [membershipCheck] = await db.query(`
      SELECT ucm.*, u.username, c.class_name 
      FROM user_class_memberships ucm
      JOIN users u ON ucm.user_id = u.id
      JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.class_id = ?
    `, [userId, classId]);

    if (!membershipCheck.length) {
      throw new CustomError('Membership not found', 404);
    }

    const membership = membershipCheck[0];

    // Remove the membership (set to expired)
    const [updateResult] = await db.query(
      'UPDATE user_class_memberships SET membership_status = "expired", updatedAt = NOW() WHERE user_id = ? AND class_id = ?',
      [userId, classId]
    );

    if (updateResult.affectedRows === 0) {
      throw new CustomError('Failed to remove participant', 500);
    }

    console.log(`✅ Admin ${adminUserId} removed user ${userId} from class ${classId}. Reason: ${reason || 'No reason provided'}`);

    return {
      user_id: userId,
      username: membership.username,
      class_id: classId,
      class_name: membership.class_name,
      display_id: formatClassIdForDisplay(classId),
      previous_role: membership.role_in_class,
      removal_reason: reason || 'Admin removal',
      removed_by: adminUserId,
      removed_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ removeParticipantFromClass error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to remove participant from class', 500);
  }
};

/**
 * Perform bulk participant actions
 */
export const performBulkParticipantActions = async (classId, actionData, adminUserId) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format', 400);
    }

    const { action, user_ids, new_role, reason } = actionData;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      throw new CustomError('user_ids array is required', 400);
    }

    const successful = [];
    const failed = [];

    for (const userId of user_ids) {
      try {
        let result;
        
        switch (action) {
          case 'remove':
            result = await removeParticipantFromClass(classId, userId, { reason }, adminUserId);
            break;
          case 'approve':
          case 'reject':
          case 'change_role':
            result = await manageParticipantMembership(classId, userId, { action, new_role, reason }, adminUserId);
            break;
          default:
            throw new Error(`Invalid action: ${action}`);
        }
        
        successful.push({ user_id: userId, ...result });
        
      } catch (error) {
        failed.push({ user_id: userId, error: error.message });
      }
    }

    console.log(`✅ Admin ${adminUserId} performed bulk ${action} on ${successful.length} participants in class ${classId}`);

    return {
      successful,
      failed,
      summary: {
        total_requested: user_ids.length,
        successful_count: successful.length,
        failed_count: failed.length,
        action_performed: action
      }
    };

  } catch (error) {
    console.error('❌ performBulkParticipantActions error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to perform bulk participant actions', 500);
  }
};

// =============================================================================
// ANALYTICS AND REPORTING SERVICES
// =============================================================================

/**
 * Get comprehensive analytics
 */
export const getComprehensiveAnalytics = async (options = {}) => {
  try {
    const {
      period = '30d',
      class_type,
      include_inactive = false,
      breakdown = 'daily',
      date_from,
      date_to
    } = options;

    // Calculate date range
    let dateCondition = '';
    const params = [];
    
    if (date_from && date_to) {
      dateCondition = 'AND c.createdAt BETWEEN ? AND ?';
      params.push(date_from, date_to);
    } else if (period) {
      const days = parseInt(period.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      dateCondition = 'AND c.createdAt >= ?';
      params.push(startDate);
    }

    let whereClause = 'WHERE 1=1';
    
    if (class_type) {
      whereClause += ' AND c.class_type = ?';
      params.push(class_type);
    }
    
    if (!include_inactive) {
      whereClause += ' AND c.is_active = 1';
    }

    // Get overall statistics
    const [overallStats] = await db.query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_classes,
        SUM(CASE WHEN c.is_active = 1 THEN 1 ELSE 0 END) as active_classes,
        SUM(CASE WHEN c.is_public = 1 THEN 1 ELSE 0 END) as public_classes,
        COUNT(DISTINCT ucm.user_id) as unique_members,
        COUNT(ucm.id) as total_memberships,
        AVG(c.max_members) as avg_capacity,
        AVG(COALESCE(cmc.total_members, 0)) as avg_members_per_class,
        MAX(COALESCE(cmc.total_members, 0)) as max_class_size
      FROM classes c
      LEFT JOIN user_class_memberships ucm ON c.class_id = ucm.class_id
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      ${whereClause} ${dateCondition}
    `, params);

    // Get type distribution
    const [typeDistribution] = await db.query(`
      SELECT 
        c.class_type,
        COUNT(*) as count,
        SUM(CASE WHEN c.is_active = 1 THEN 1 ELSE 0 END) as active_count,
        AVG(COALESCE(cmc.total_members, 0)) as avg_members
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      ${whereClause} ${dateCondition}
      GROUP BY c.class_type
      ORDER BY count DESC
    `, params);

    // Get growth trends
    const groupByClause = breakdown === 'daily' ? 'DATE(c.createdAt)' : 'YEARWEEK(c.createdAt)';
    const [growthTrends] = await db.query(`
      SELECT 
        ${groupByClause} as period,
        COUNT(*) as classes_created,
        SUM(CASE WHEN c.is_active = 1 THEN 1 ELSE 0 END) as active_classes_created
      FROM classes c
      ${whereClause} ${dateCondition}
      GROUP BY ${groupByClause}
      ORDER BY period ASC
    `, params);

    // Get top performing classes
    const [topClasses] = await db.query(`
      SELECT 
        c.class_id,
        c.class_name,
        c.class_type,
        COALESCE(cmc.total_members, 0) as member_count,
        c.max_members,
        ROUND((COALESCE(cmc.total_members, 0) / c.max_members) * 100, 2) as utilization_rate
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      WHERE c.is_active = 1
      ORDER BY member_count DESC
      LIMIT 10
    `);

    return {
      summary: {
        ...overallStats[0],
        avg_capacity: Math.round(overallStats[0].avg_capacity || 0),
        avg_members_per_class: Math.round(overallStats[0].avg_members_per_class || 0)
      },
      type_distribution: typeDistribution,
      growth_trends: growthTrends,
      top_classes: topClasses.map(cls => ({
        ...cls,
        display_id: formatClassIdForDisplay(cls.class_id)
      })),
      filters_applied: options,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ getComprehensiveAnalytics error:', error);
    throw new CustomError('Failed to generate analytics', 500);
  }
};

/**
 * Get system statistics
 */
export const getSystemStatistics = async (options = {}) => {
  try {
    const {
      summary = true,
      by_type = true,
      by_status = true,
      recent_activity = true
    } = options;

    const stats = {};

    if (summary) {
      const [summaryStats] = await db.query(`
        SELECT 
          COUNT(*) as total_classes,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_classes,
          SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_classes,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_classes,
          AVG(max_members) as avg_capacity,
          (SELECT COUNT(*) FROM user_class_memberships WHERE membership_status = 'active') as total_enrollments,
          (SELECT COUNT(DISTINCT user_id) FROM user_class_memberships WHERE membership_status = 'active') as unique_enrolled_users
        FROM classes c
      `);
      stats.summary = {
        ...summaryStats[0],
        avg_capacity: Math.round(summaryStats[0].avg_capacity || 0)
      };
    }

    if (by_type) {
      const [typeStats] = await db.query(`
        SELECT 
          class_type,
          COUNT(*) as total,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
          AVG(max_members) as avg_capacity
        FROM classes
        GROUP BY class_type
        ORDER BY total DESC
      `);
      stats.by_type = typeStats.map(stat => ({
        ...stat,
        avg_capacity: Math.round(stat.avg_capacity || 0)
      }));
    }

    if (by_status) {
      const [statusStats] = await db.query(`
        SELECT 
          CASE 
            WHEN is_active = 1 AND is_public = 1 THEN 'active_public'
            WHEN is_active = 1 AND is_public = 0 THEN 'active_private'
            WHEN is_active = 0 THEN 'inactive'
            ELSE 'unknown'
          END as status,
          COUNT(*) as count
        FROM classes
        GROUP BY status
      `);
      stats.by_status = statusStats;
    }

    if (recent_activity) {
      const [activityStats] = await db.query(`
        SELECT 
          'classes_created_today' as metric,
          COUNT(*) as value
        FROM classes 
        WHERE DATE(createdAt) = CURDATE()
        UNION ALL
        SELECT 
          'classes_created_this_week' as metric,
          COUNT(*) as value
        FROM classes 
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        UNION ALL
        SELECT 
          'memberships_today' as metric,
          COUNT(*) as value
        FROM user_class_memberships 
        WHERE DATE(createdAt) = CURDATE()
        UNION ALL
        SELECT 
          'active_memberships' as metric,
          COUNT(*) as value
        FROM user_class_memberships 
        WHERE membership_status = 'active'
      `);
      
      const activityObj = {};
      activityStats.forEach(stat => {
        activityObj[stat.metric] = stat.value;
      });
      stats.recent_activity = activityObj;
    }

    return stats;

  } catch (error) {
    console.error('❌ getSystemStatistics error:', error);
    throw new CustomError('Failed to get system statistics', 500);
  }
};

/**
 * Get class-specific analytics
 */
export const getClassSpecificAnalytics = async (classId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format', 400);
    }

    const { period = '30d', breakdown = 'daily' } = options;

    // Get class info
    const [classInfo] = await db.query(`
      SELECT 
        c.*,
        COALESCE(cmc.total_members, 0) as total_members,
        COALESCE(cmc.moderators, 0) as moderators,
        COALESCE(cmc.pending_members, 0) as pending_members
      FROM classes c 
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      WHERE c.class_id = ?
    `, [classId]);

    if (!classInfo.length) {
      throw new CustomError('Class not found', 404);
    }

    const cls = classInfo[0];

    // Get membership stats
    const [membershipStats] = await db.query(`
      SELECT 
        COUNT(*) as total_memberships,
        SUM(CASE WHEN membership_status = 'active' THEN 1 ELSE 0 END) as active_members,
        SUM(CASE WHEN membership_status = 'pending' THEN 1 ELSE 0 END) as pending_members,
        SUM(CASE WHEN membership_status = 'suspended' THEN 1 ELSE 0 END) as suspended_members,
        SUM(CASE WHEN membership_status = 'expired' THEN 1 ELSE 0 END) as expired_members,
        AVG(DATEDIFF(NOW(), joinedAt)) as avg_membership_duration,
        MIN(joinedAt) as first_enrollment,
        MAX(joinedAt) as last_enrollment
      FROM user_class_memberships 
      WHERE class_id = ?
    `, [classId]);

    // Get enrollment over time
    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const groupByClause = breakdown === 'daily' ? 'DATE(joinedAt)' : 'YEARWEEK(joinedAt)';
    const [enrollmentHistory] = await db.query(`
      SELECT 
        ${groupByClause} as period,
        COUNT(*) as enrollments
      FROM user_class_memberships 
      WHERE class_id = ? AND joinedAt >= ?
      GROUP BY ${groupByClause}
      ORDER BY period ASC
    `, [classId, startDate]);

    // Get role distribution
    const [roleDistribution] = await db.query(`
      SELECT 
        role_in_class,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_class_memberships WHERE class_id = ? AND membership_status = 'active')), 2) as percentage
      FROM user_class_memberships 
      WHERE class_id = ? AND membership_status = 'active'
      GROUP BY role_in_class
    `, [classId, classId]);

    return {
      class_info: {
        ...cls,
        display_id: formatClassIdForDisplay(classId),
        health_score: calculateClassHealthScore(cls)
      },
      membership_stats: {
        ...membershipStats[0],
        capacity_utilization: cls.max_members > 0 ? 
          Math.round((membershipStats[0].active_members / cls.max_members) * 100) : 0
      },
      enrollment_history: enrollmentHistory,
      role_distribution: roleDistribution,
      period: period,
      breakdown: breakdown,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ getClassSpecificAnalytics error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to get class analytics', 500);
  }
};

// =============================================================================
// EXPORT AND REPORTING SERVICES
// =============================================================================

/**
 * Export class data to file
 */
export const exportClassDataToFile = async (options, adminUserId) => {
  try {
    const {
      format = 'csv',
      include_participants = true,
      include_analytics = false,
      class_ids = null,
      date_from,
      date_to
    } = options;

    // Build query for classes
    let whereConditions = ['1=1'];
    const params = [];

    if (class_ids && class_ids.length > 0) {
      whereConditions.push(`c.class_id IN (${class_ids.map(() => '?').join(',')})`);
      params.push(...class_ids);
    }

    if (date_from) {
      whereConditions.push('c.createdAt >= ?');
      params.push(date_from);
    }

    if (date_to) {
      whereConditions.push('c.createdAt <= ?');
      params.push(date_to);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get classes data
    const [classes] = await db.query(`
      SELECT 
        c.*,
        u.username as created_by_username,
        COALESCE(cmc.total_members, 0) as total_members,
        COALESCE(cmc.moderators, 0) as moderators,
        COALESCE(cmc.pending_members, 0) as pending_members
      FROM classes c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      WHERE ${whereClause}
      ORDER BY c.createdAt DESC
    `, params);

    let exportData = {
      classes: classes.map(cls => ({
        ...cls,
        display_id: formatClassIdForDisplay(cls.class_id),
        capacity_utilization: cls.max_members > 0 ? 
          Math.round((cls.total_members / cls.max_members) * 100) : 0
      })),
      exported_at: new Date().toISOString(),
      exported_by: adminUserId,
      total_classes: classes.length
    };

    // Include participants if requested
    if (include_participants && classes.length > 0) {
      const classIds = classes.map(c => c.class_id);
      const [participants] = await db.query(`
        SELECT 
          ucm.class_id,
          u.username,
          u.email,
          ucm.role_in_class,
          ucm.membership_status,
          ucm.joinedAt,
          ucm.expiresAt
        FROM user_class_memberships ucm
        JOIN users u ON ucm.user_id = u.id
        WHERE ucm.class_id IN (${classIds.map(() => '?').join(',')})
        ORDER BY ucm.class_id, ucm.joinedAt DESC
      `, classIds);
      
      exportData.participants = participants;
      exportData.total_participants = participants.length;
    }

    // Generate file content based on format
    let fileData;
    if (format === 'csv') {
      fileData = generateCSVContent(exportData);
    } else if (format === 'json') {
      fileData = JSON.stringify(exportData, null, 2);
    } else {
      throw new CustomError('Unsupported export format', 400);
    }

    console.log(`✅ Admin ${adminUserId} exported ${classes.length} classes in ${format} format`);

    return {
      fileData,
      filename: `class_export_${Date.now()}.${format}`,
      format,
      total_records: classes.length,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ exportClassDataToFile error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to export class data', 500);
  }
};

/**
 * Helper function to generate CSV content
 */
const generateCSVContent = (data) => {
  const { classes, participants = [] } = data;
  
  let csv = '';
  
  // Classes section
  csv += 'CLASSES\n';
  csv += 'class_id,class_name,class_type,is_active,total_members,max_members,capacity_utilization,created_by,createdAt\n';
  
  classes.forEach(cls => {
    csv += `"${cls.class_id}","${cls.class_name}","${cls.class_type}",${cls.is_active},${cls.total_members},${cls.max_members},${cls.capacity_utilization}%,"${cls.created_by_username}","${cls.createdAt}"\n`;
  });
  
  if (participants.length > 0) {
    csv += '\n\nPARTICIPANTS\n';
    csv += 'class_id,username,email,role_in_class,membership_status,joinedAt,expiresAt\n';
    
    participants.forEach(p => {
      csv += `"${p.class_id}","${p.username}","${p.email}","${p.role_in_class}","${p.membership_status}","${p.joinedAt}","${p.expiresAt || ''}"\n`;
    });
  }
  
  return csv;
};

/**
 * Generate custom report
 */
export const generateCustomReport = async (reportOptions, adminUserId) => {
  try {
    const {
      report_type = 'summary',
      class_ids,
      date_from,
      date_to,
      include_participants = true,
      include_analytics = true,
      format = 'json'
    } = reportOptions;

    const report = {
      report_type,
      generated_by: adminUserId,
      generated_at: new Date(),
      parameters: {
        class_ids,
        date_range: { from: date_from, to: date_to },
        includes: { participants: include_participants, analytics: include_analytics }
      },
      data: {}
    };

    // Get basic statistics for the report
    let whereConditions = ['1=1'];
    const params = [];

    if (class_ids && class_ids.length > 0) {
      whereConditions.push(`c.class_id IN (${class_ids.map(() => '?').join(',')})`);
      params.push(...class_ids);
    }

    if (date_from) {
      whereConditions.push('c.createdAt >= ?');
      params.push(date_from);
    }

    if (date_to) {
      whereConditions.push('c.createdAt <= ?');
      params.push(date_to);
    }

    const whereClause = whereConditions.join(' AND ');

    if (report_type === 'summary' || report_type === 'comprehensive') {
      const [summaryStats] = await db.query(`
        SELECT 
          COUNT(*) as total_classes,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_classes,
          AVG(max_members) as avg_capacity,
          SUM(COALESCE(cmc.total_members, 0)) as total_enrollments,
          AVG(COALESCE(cmc.total_members, 0)) as avg_members_per_class
        FROM classes c
        LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
        WHERE ${whereClause}
      `, params);

      report.data.summary = {
        ...summaryStats[0],
        avg_capacity: Math.round(summaryStats[0].avg_capacity || 0),
        avg_members_per_class: Math.round(summaryStats[0].avg_members_per_class || 0)
      };
    }

    if (include_analytics && (report_type === 'analytics' || report_type === 'comprehensive')) {
      const [typeBreakdown] = await db.query(`
        SELECT 
          class_type,
          COUNT(*) as count,
          AVG(COALESCE(cmc.total_members, 0)) as avg_members
        FROM classes c
        LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
        WHERE ${whereClause}
        GROUP BY class_type
      `, params);

      report.data.analytics = {
        type_breakdown: typeBreakdown
      };
    }

    console.log(`✅ Admin ${adminUserId} generated ${report_type} report`);

    return report;

  } catch (error) {
    console.error('❌ generateCustomReport error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to generate report', 500);
  }
};

/**
 * Get audit log entries
 */
export const getAuditLogEntries = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      class_id,
      user_id,
      action_type,
      date_from,
      date_to
    } = options;

    // For now, return a structured response since audit logging would need to be implemented
    // In a real system, this would query an audit_logs table
    
    const auditLogs = [];
    const totalRecords = 0;
    const totalPages = Math.ceil(totalRecords / limit);

    console.log(`📋 Audit logs requested by admin for class: ${class_id || 'all'}, action: ${action_type || 'all'}`);

    return {
      data: auditLogs,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_records: totalRecords,
        per_page: limit
      },
      filters: {
        class_id,
        user_id,
        action_type,
        date_from,
        date_to
      },
      note: 'Audit logging system needs to be implemented with proper audit_logs table',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ getAuditLogEntries error:', error);
    throw new CustomError('Failed to get audit logs', 500);
  }
};

// =============================================================================
// BULK OPERATIONS SERVICES
// =============================================================================

/**
 * Create multiple classes
 */
export const createMultipleClasses = async (classesData, adminUserId) => {
  const successful = [];
  const failed = [];

  try {
    for (let i = 0; i < classesData.length; i++) {
      const classData = classesData[i];
      
      try {
        if (!classData.class_name) {
          throw new Error('class_name is required');
        }

        const newClass = await createNewClass(classData, adminUserId);
        
        successful.push({
          index: i,
          class_id: newClass.class_id,
          class_name: newClass.class_name,
          display_id: newClass.display_id
        });
        
      } catch (error) {
        failed.push({
          index: i,
          class_name: classData.class_name || 'Unknown',
          error: error.message
        });
      }
    }

    console.log(`✅ Bulk created ${successful.length} classes, ${failed.length} failed by admin ${adminUserId}`);

    return {
      successful,
      failed,
      summary: {
        total_requested: classesData.length,
        successful_count: successful.length,
        failed_count: failed.length
      }
    };

  } catch (error) {
    console.error('❌ createMultipleClasses error:', error);
    throw new CustomError('Bulk creation failed', 500);
  }
};

/**
 * Update multiple classes
 */
export const updateMultipleClasses = async (classIds, updates, adminUserId) => {
  const successful = [];
  const failed = [];

  try {
    for (const classId of classIds) {
      try {
        const updatedClass = await updateClassData(classId, updates, adminUserId);
        
        successful.push({
          class_id: classId,
          display_id: updatedClass.display_id,
          updated: true
        });
      } catch (error) {
        failed.push({
          class_id: classId,
          error: error.message
        });
      }
    }

    console.log(`✅ Bulk updated ${successful.length} classes, ${failed.length} failed by admin ${adminUserId}`);

    return {
      successful,
      failed,
      summary: {
        total_requested: classIds.length,
        successful_count: successful.length,
        failed_count: failed.length
      },
      updates_applied: Object.keys(updates)
    };

  } catch (error) {
    console.error('❌ updateMultipleClasses error:', error);
    throw new CustomError('Bulk update failed', 500);
  }
};

/**
 * Delete multiple classes
 */
export const deleteMultipleClasses = async (classIds, options = {}, adminUserId) => {
  const successful = [];
  const failed = [];

  try {
    for (const classId of classIds) {
      try {
        const result = await deleteClassById(classId, options, adminUserId);
        
        successful.push({
          class_id: classId,
          action: result.action,
          display_id: result.display_id
        });
      } catch (error) {
        failed.push({
          class_id: classId,
          error: error.message
        });
      }
    }

    console.log(`✅ Bulk deleted ${successful.length} classes, ${failed.length} failed by admin ${adminUserId}`);

    return {
      successful,
      failed,
      summary: {
        total_requested: classIds.length,
        successful_count: successful.length,
        failed_count: failed.length
      }
    };

  } catch (error) {
    console.error('❌ deleteMultipleClasses error:', error);
    throw new CustomError('Bulk delete failed', 500);
  }
};

/**
 * Import classes from data
 */
export const importClassesFromData = async (importData, adminUserId) => {
  try {
    const { classes, source = 'manual' } = importData;

    if (!classes || !Array.isArray(classes)) {
      throw new CustomError('classes array is required', 400);
    }

    const result = await createMultipleClasses(classes, adminUserId);

    console.log(`✅ Imported ${result.successful.length} classes from ${source} by admin ${adminUserId}`);

    return {
      ...result,
      import_source: source,
      import_timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ importClassesFromData error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to import classes', 500);
  }
};

// =============================================================================
// ADVANCED ADMIN FEATURES
// =============================================================================

/**
 * Get admin dashboard data
 */
export const getAdminDashboardData = async (adminUserId) => {
  try {
    // Get overview statistics
    const [overview] = await db.query(`
      SELECT 
        COUNT(*) as total_classes,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_classes,
        SUM(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as classes_created_today,
        SUM(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as classes_created_week,
        (SELECT COUNT(*) FROM user_class_memberships WHERE membership_status = 'active') as total_active_memberships,
        (SELECT COUNT(*) FROM user_class_memberships WHERE membership_status = 'pending') as pending_memberships,
        (SELECT COUNT(*) FROM user_class_memberships WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_memberships_today
      FROM classes
    `);

    // Get recent activity
    const [recentClasses] = await db.query(`
      SELECT 
        class_id, 
        class_name, 
        class_type, 
        createdAt,
        COALESCE(cmc.total_members, 0) as member_count
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      ORDER BY createdAt DESC 
      LIMIT 10
    `);

    // Get recent memberships
    const [recentMemberships] = await db.query(`
      SELECT 
        c.class_name,
        u.username,
        ucm.role_in_class,
        ucm.joinedAt
      FROM user_class_memberships ucm
      JOIN classes c ON ucm.class_id = c.class_id
      JOIN users u ON ucm.user_id = u.id
      WHERE ucm.membership_status = 'active'
      ORDER BY ucm.joinedAt DESC
      LIMIT 10
    `);

    // Get class type distribution
    const [typeDistribution] = await db.query(`
      SELECT 
        class_type,
        COUNT(*) as count,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
      FROM classes
      GROUP BY class_type
    `);

    // Get pending items requiring attention
    const [pendingItems] = await db.query(`
      SELECT 
        COUNT(*) as pending_memberships
      FROM user_class_memberships 
      WHERE membership_status = 'pending'
    `);

    return {
      overview: overview[0],
      recent_classes: recentClasses.map(cls => ({
        ...cls,
        display_id: formatClassIdForDisplay(cls.class_id)
      })),
      recent_memberships: recentMemberships,
      type_distribution: typeDistribution,
      pending_items: pendingItems[0],
      quick_actions: [
        { action: 'create_class', label: 'Create New Class', count: null },
        { action: 'review_pending', label: 'Review Pending Memberships', count: pendingItems[0].pending_memberships },
        { action: 'view_analytics', label: 'View System Analytics', count: null },
        { action: 'export_data', label: 'Export Class Data', count: null }
      ],
      system_alerts: generateSystemAlerts(overview[0]),
      last_updated: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ getAdminDashboardData error:', error);
    throw new CustomError('Failed to get dashboard data', 500);
  }
};

/**
 * Helper function to generate system alerts
 */
const generateSystemAlerts = (overview) => {
  const alerts = [];

  if (overview.pending_memberships > 10) {
    alerts.push({
      type: 'warning',
      message: `${overview.pending_memberships} memberships pending approval`,
      action: 'review_pending'
    });
  }

  if (overview.active_classes === 0) {
    alerts.push({
      type: 'error',
      message: 'No active classes found',
      action: 'create_class'
    });
  }

  if (overview.classes_created_today === 0 && overview.new_memberships_today > 0) {
    alerts.push({
      type: 'info',
      message: 'High membership activity but no new classes created today',
      action: 'consider_new_classes'
    });
  }

  return alerts;
};

/**
 * Get pending approval items
 */
export const getPendingApprovalItems = async (options = {}) => {
  try {
    const { page = 1, limit = 20, type = 'all' } = options;
    const offset = (page - 1) * limit;

    const pendingItems = { data: [], pagination: {}, summary: {} };

    if (type === 'all' || type === 'participants') {
      // Get pending memberships
      const [pendingMemberships] = await db.query(`
        SELECT 
          ucm.user_id,
          ucm.class_id,
          u.username,
          u.email,
          c.class_name,
          ucm.role_in_class,
          ucm.joinedAt,
          'membership' as item_type
        FROM user_class_memberships ucm
        JOIN users u ON ucm.user_id = u.id
        JOIN classes c ON ucm.class_id = c.class_id
        WHERE ucm.membership_status = 'pending'
        ORDER BY ucm.joinedAt ASC
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      pendingItems.data = pendingMemberships.map(item => ({
        ...item,
        class_display_id: formatClassIdForDisplay(item.class_id)
      }));
    }

    // Get total count for pagination
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM user_class_memberships
      WHERE membership_status = 'pending'
    `);

    const total = countResult[0].total;

    pendingItems.pagination = {
      current_page: page,
      total_pages: Math.ceil(total / limit),
      total_records: total,
      per_page: limit
    };

    pendingItems.summary = {
      total_pending: total,
      types: {
        memberships: total
      }
    };

    return pendingItems;

  } catch (error) {
    console.error('❌ getPendingApprovalItems error:', error);
    throw new CustomError('Failed to get pending approval items', 500);
  }
};

/**
 * Perform batch approval
 */
export const performBatchApproval = async (items, approvalType, reason, adminUserId) => {
  try {
    const successful = [];
    const failed = [];

    for (const item of items) {
      try {
        if (approvalType === 'membership') {
          const result = await manageParticipantMembership(
            item.class_id, 
            item.user_id, 
            { action: 'approve', reason }, 
            adminUserId
          );
          successful.push({ ...item, result });
        } else {
          throw new Error(`Unsupported approval type: ${approvalType}`);
        }
      } catch (error) {
        failed.push({ ...item, error: error.message });
      }
    }

    console.log(`✅ Batch approval: ${successful.length} successful, ${failed.length} failed by admin ${adminUserId}`);

    return {
      successful,
      failed,
      summary: {
        total_requested: items.length,
        successful_count: successful.length,
        failed_count: failed.length,
        approval_type: approvalType
      }
    };

  } catch (error) {
    console.error('❌ performBatchApproval error:', error);
    throw new CustomError('Failed to perform batch approval', 500);
  }
};

/**
 * Update system settings
 */
export const updateSystemSettings = async (settings, adminUserId) => {
  try {
    // In a real system, this would update a system_settings table
    // For now, return the settings that would be updated
    
    const updatedSettings = {
      ...settings,
      updated_by: adminUserId,
      updated_at: new Date().toISOString()
    };

    console.log(`✅ System settings updated by admin ${adminUserId}:`, Object.keys(settings));

    return {
      settings: updatedSettings,
      message: 'Settings updated successfully (placeholder implementation)',
      updated_by: adminUserId,
      updated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ updateSystemSettings error:', error);
    throw new CustomError('Failed to update system settings', 500);
  }
};

// =============================================================================
// ARCHIVE/RESTORE SERVICES
// =============================================================================

/**
 * Archive class by ID
 */
export const archiveClassById = async (classId, options, adminUserId) => {
  try {
    const result = await deleteClassById(classId, { ...options, archive_instead: true }, adminUserId);
    return result;
  } catch (error) {
    console.error('❌ archiveClassById error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to archive class', 500);
  }
};

/**
 * Restore class by ID
 */
export const restoreClassById = async (classId, options, adminUserId) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format', 400);
    }

    const { restore_members = true, restoration_reason } = options;

    // Check if class exists and is inactive
    const [classData] = await db.query(
      'SELECT * FROM classes WHERE class_id = ? AND is_active = 0',
      [classId]
    );
    
    if (!classData.length) {
      throw new CustomError('Archived class not found', 404);
    }

    // Restore the class
    await db.query(`
      UPDATE classes 
      SET is_active = 1, updatedAt = NOW()
      WHERE class_id = ?
    `, [classId]);

    // Restore members if requested
    let membersRestored = 0;
    if (restore_members) {
      const [restoreResult] = await db.query(`
        UPDATE user_class_memberships 
        SET membership_status = 'active', updatedAt = NOW()
        WHERE class_id = ? AND membership_status = 'expired'
      `, [classId]);
      
      membersRestored = restoreResult.affectedRows;
    }

    console.log(`✅ Class ${classId} restored by admin ${adminUserId}. Members restored: ${membersRestored}`);

    return {
      restored_class_id: classId,
      class_name: classData[0].class_name,
      display_id: formatClassIdForDisplay(classId),
      restored_by: adminUserId,
      restoredAt: new Date().toISOString(),
      restoration_reason,
      members_restored: membersRestored,
      restore_members: restore_members
    };

  } catch (error) {
    console.error('❌ restoreClassById error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to restore class', 500);
  }
};

/**
 * Duplicate class by ID
 */
export const duplicateClassById = async (classId, options, adminUserId) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format', 400);
    }

    const { 
      new_name, 
      copy_members = false, 
      copy_settings = true, 
      copy_content = false 
    } = options;

    // Get original class
    const [originalClass] = await db.query(
      'SELECT * FROM classes WHERE class_id = ?',
      [classId]
    );
    
    if (!originalClass.length) {
      throw new CustomError('Original class not found', 404);
    }

    const original = originalClass[0];

    // Prepare data for new class
    const duplicateData = {
      class_name: new_name || `${original.class_name} (Copy)`,
      public_name: new_name || `${original.public_name} (Copy)`,
      description: copy_settings ? original.description : null,
      class_type: copy_settings ? original.class_type : 'demographic',
      category: copy_settings ? original.category : null,
      difficulty_level: copy_settings ? original.difficulty_level : 'beginner',
      is_public: copy_settings ? original.is_public : false,
      max_members: copy_settings ? original.max_members : 50,
      estimated_duration: copy_settings ? original.estimated_duration : null,
      prerequisites: copy_settings ? original.prerequisites : null,
      learning_objectives: copy_settings ? original.learning_objectives : null,
      tags: copy_settings ? original.tags : null,
      privacy_level: copy_settings ? original.privacy_level : 'members_only'
    };

    // Create the new class
    const newClass = await createNewClass(duplicateData, adminUserId);

    // Copy members if requested
    let membersCopied = 0;
    if (copy_members) {
      const [members] = await db.query(`
        SELECT user_id, role_in_class, receive_notifications, can_see_class_name
        FROM user_class_memberships
        WHERE class_id = ? AND membership_status = 'active'
      `, [classId]);

      for (const member of members) {
        try {
          if (member.user_id !== adminUserId) { // Don't duplicate admin
            await db.query(`
              INSERT INTO user_class_memberships 
              (user_id, class_id, role_in_class, membership_status, joinedAt, 
               receive_notifications, can_see_class_name, assigned_by, createdAt, updatedAt)
              VALUES (?, ?, ?, 'active', NOW(), ?, ?, ?, NOW(), NOW())
            `, [
              member.user_id, newClass.class_id, member.role_in_class,
              member.receive_notifications, member.can_see_class_name, adminUserId
            ]);
            membersCopied++;
          }
        } catch (error) {
          console.warn(`Failed to copy member ${member.user_id}:`, error.message);
        }
      }
    }

    console.log(`✅ Class ${classId} duplicated to ${newClass.class_id} by admin ${adminUserId}. Members copied: ${membersCopied}`);

    return {
      original_class_id: classId,
      new_class_id: newClass.class_id,
      new_class_name: newClass.class_name,
      display_id: formatClassIdForDisplay(newClass.class_id),
      duplicated_by: adminUserId,
      duplicatedAt: new Date().toISOString(),
      copied_features: {
        settings: copy_settings,
        members: copy_members,
        content: copy_content
      },
      members_copied: membersCopied
    };

  } catch (error) {
    console.error('❌ duplicateClassById error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to duplicate class', 500);
  }
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================

export default {
  // Health & Test
  testSystemConnectivity,
  getSystemHealthStatus,
  
  // Class Management
  createNewClass,
  getAllClassesForAdmin,
  getClassByIdForAdmin,
  updateClassData,
  deleteClassById,
  
  // Participant Management
  getClassParticipantsForAdmin,
  addParticipantToClass,
  manageParticipantMembership,
  removeParticipantFromClass,
  performBulkParticipantActions,
  
  // Analytics & Reporting
  getComprehensiveAnalytics,
  getSystemStatistics,
  getClassSpecificAnalytics,
  exportClassDataToFile,
  generateCustomReport,
  getAuditLogEntries,
  
  // Bulk Operations
  createMultipleClasses,
  updateMultipleClasses,
  deleteMultipleClasses,
  importClassesFromData,
  
  // Advanced Features
  getAdminDashboardData,
  getPendingApprovalItems,
  performBatchApproval,
  updateSystemSettings,
  
  // Archive/Restore
  archiveClassById,
  restoreClassById,
  duplicateClassById
};














// // ikootaapi/services/classAdminServices.js
// // ADMIN CLASS MANAGEMENT SERVICES - BUSINESS LOGIC LAYER
// // All administrative database operations and business logic

// import db from '../config/db.js';
// import CustomError from '../utils/CustomError.js';
// import { generateUniqueClassId, validateIdFormat } from '../utils/idGenerator.js';

// // ===============================================
// // HELPER FUNCTIONS
// // ===============================================

// const validateClassIdFormat = (classId) => {
//   if (!classId || typeof classId !== 'string') return false;
//   if (classId === 'OTU#Public') return true;
//   return validateIdFormat(classId, 'class');
// };



// const formatClassIdForDisplay = (classId) => {
//   if (classId === 'OTU#Public') return 'Public Community';
//   return `Class ${classId}`;
// };

// // const formatClassIdForDisplay = (classId) => {
// //   if (classId === 'OTU#Public') return 'Public Community';
// //   return `Class ${classId}`;
// // };

// /**
//  * Formats class ID for display
//  */
// // const formatClassIdForDisplay = (classId) => {
// //   if (classId === 'OTU#Public') return 'Public Community';
// //   return `Class ${classId}`;
// // };

// const calculateClassHealthScore = (classData) => {
//   let score = 0;
//   let maxScore = 100;

//   // Capacity utilization (30 points)
//   if (classData.max_members > 0) {
//     const utilization = (classData.total_members || 0) / classData.max_members;
//     if (utilization >= 0.7 && utilization <= 0.9) score += 30;
//     else if (utilization >= 0.5) score += 20;
//     else if (utilization >= 0.3) score += 10;
//   }

//   // Activity level (25 points)
//   if (classData.days_since_creation > 0) {
//     const memberGrowthRate = (classData.total_members || 0) / classData.days_since_creation;
//     if (memberGrowthRate > 1) score += 25;
//     else if (memberGrowthRate > 0.5) score += 20;
//     else if (memberGrowthRate > 0.1) score += 15;
//     else if (memberGrowthRate > 0) score += 10;
//   }

//   // Content availability (20 points)
//   if (classData.content_count > 10) score += 20;
//   else if (classData.content_count > 5) score += 15;
//   else if (classData.content_count > 0) score += 10;

//   // Moderation (15 points)
//   if ((classData.moderators || 0) >= 2) score += 15;
//   else if ((classData.moderators || 0) >= 1) score += 10;

//   // Completion (10 points)
//   if (classData.description && classData.description.length > 50) score += 5;
//   if (classData.tags && classData.tags.length > 0) score += 3;
//   if (classData.difficulty_level) score += 2;

//   return Math.min(score, maxScore);
// };



// /**
//  * Create a new class with enhanced options
//  */
// export const createClassService = async (classData, adminUserId) => {
//   try {
//     const {
//       class_name,
//       public_name,
//       description,
//       class_type = 'general',
//       is_public = false,
//       max_members = 50,
//       privacy_level = 'members_only',
//       requirements,
//       instructor_notes,
//       tags,
//       category,
//       difficulty_level,
//       estimated_duration,
//       prerequisites,
//       learning_objectives,
//       auto_approve_members = false,
//       allow_self_join = true,
//       require_approval = true,
//       enable_notifications = true,
//       enable_discussions = true,
//       enable_assignments = false,
//       enable_grading = false,
//       class_schedule,
//       timezone = 'UTC'
//     } = classData;

//     if (!class_name || class_name.trim().length === 0) {
//       throw new CustomError('Class name is required', 400);
//     }

//     const class_id = await generateUniqueClassId();

//     const insertData = {
//       class_id,
//       class_name: class_name.trim(),
//       public_name: (public_name || class_name).trim(),
//       description,
//       class_type,
//       is_public: Boolean(is_public),
//       max_members: parseInt(max_members),
//       privacy_level,
//       requirements,
//       instructor_notes,
//       tags: Array.isArray(tags) ? tags.join(',') : tags,
//       category,
//       difficulty_level,
//       estimated_duration: estimated_duration ? parseInt(estimated_duration) : null,
//       prerequisites: Array.isArray(prerequisites) ? prerequisites.join(',') : prerequisites,
//       learning_objectives: Array.isArray(learning_objectives) ? learning_objectives.join(',') : learning_objectives,
//       auto_approve_members: Boolean(auto_approve_members),
//       allow_self_join: Boolean(allow_self_join),
//       require_approval: Boolean(require_approval),
//       enable_notifications: Boolean(enable_notifications),
//       enable_discussions: Boolean(enable_discussions),
//       enable_assignments: Boolean(enable_assignments),
//       enable_grading: Boolean(enable_grading),
//       class_schedule: class_schedule ? JSON.stringify(class_schedule) : null,
//       timezone,
//       created_by: adminUserId,
//       is_active: 1
//     };

//     const sql = `
//       INSERT INTO classes (
//         class_id, class_name, public_name, description, class_type, is_public, 
//         max_members, privacy_level, requirements, instructor_notes, tags, category,
//         difficulty_level, estimated_duration, prerequisites, learning_objectives,
//         auto_approve_members, allow_self_join, require_approval, enable_notifications,
//         enable_discussions, enable_assignments, enable_grading, class_schedule, timezone,
//         created_by, is_active, createdAt, updatedAt
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
//     `;

//     await db.query(sql, Object.values(insertData));

//     const membershipSql = `
//       INSERT INTO user_class_memberships 
//       (user_id, class_id, role_in_class, membership_status, joinedAt, assigned_by, receive_notifications, can_see_class_name, createdAt, updatedAt)
//       VALUES (?, ?, 'moderator', 'active', NOW(), ?, 1, 1, NOW(), NOW())
//     `;
//     await db.query(membershipSql, [adminUserId, class_id, adminUserId]);

//     console.log(`✅ Class ${class_id} (${class_name}) created by admin ${adminUserId}`);

//     const createdSql = `
//       SELECT c.*, u.username as created_by_username
//       FROM classes c
//       LEFT JOIN users u ON c.created_by = u.id
//       WHERE c.class_id = ?
//     `;
//     const [newClass] = await db.query(createdSql, [class_id]);

//     return {
//       ...newClass,
//       display_id: formatClassIdForDisplay(class_id),
//       tags: newClass.tags ? newClass.tags.split(',') : [],
//       prerequisites: newClass.prerequisites ? newClass.prerequisites.split(',') : [],
//       learning_objectives: newClass.learning_objectives ? newClass.learning_objectives.split(',') : [],
//       class_schedule: newClass.class_schedule ? JSON.parse(newClass.class_schedule) : null
//     };

//   } catch (error) {
//     console.error('❌ createClassService error:', error);
//     if (error instanceof CustomError) throw error;
//     if (error.code === 'ER_DUP_ENTRY') {
//       throw new CustomError('Class with this name already exists', 409);
//     }
//     throw new CustomError('Failed to create class', 500);
//   }
// };



// /**
//  * Update class with comprehensive field support
//  */
// export const updateClassService = async (classId, updateData, adminUserId) => {
//   try {
//     if (!validateClassIdFormat(classId)) {
//       throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
//     }

//     const [existingClass] = await db.query(
//       'SELECT * FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"',
//       [classId]
//     );

//     if (!existingClass) {
//       throw new CustomError('Class not found', 404);
//     }

//     const allowedFields = [
//       'class_name', 'public_name', 'description', 'class_type', 'is_public',
//       'max_members', 'privacy_level', 'requirements', 'instructor_notes', 'is_active',
//       'tags', 'category', 'difficulty_level', 'estimated_duration', 'prerequisites',
//       'learning_objectives', 'auto_approve_members', 'allow_self_join', 'require_approval',
//       'enable_notifications', 'enable_discussions', 'enable_assignments', 'enable_grading',
//       'class_schedule', 'timezone'
//     ];

//     const updateFields = [];
//     const params = [];

//     Object.entries(updateData).forEach(([key, value]) => {
//       if (allowedFields.includes(key) && value !== undefined) {
//         if (key === 'tags' && Array.isArray(value)) {
//           updateFields.push(`${key} = ?`);
//           params.push(value.join(','));
//         } else if (key === 'prerequisites' && Array.isArray(value)) {
//           updateFields.push(`${key} = ?`);
//           params.push(value.join(','));
//         } else if (key === 'learning_objectives' && Array.isArray(value)) {
//           updateFields.push(`${key} = ?`);
//           params.push(value.join(','));
//         } else if (key === 'class_schedule' && typeof value === 'object') {
//           updateFields.push(`${key} = ?`);
//           params.push(JSON.stringify(value));
//         } else if (['is_public', 'auto_approve_members', 'allow_self_join', 'require_approval', 'enable_notifications', 'enable_discussions', 'enable_assignments', 'enable_grading', 'is_active'].includes(key)) {
//           updateFields.push(`${key} = ?`);
//           params.push(Boolean(value));
//         } else if (['max_members', 'estimated_duration'].includes(key)) {
//           updateFields.push(`${key} = ?`);
//           params.push(parseInt(value));
//         } else {
//           updateFields.push(`${key} = ?`);
//           params.push(value);
//         }
//       }
//     });

//     if (updateFields.length === 0) {
//       throw new CustomError('No valid fields to update', 400);
//     }

//     updateFields.push('updatedAt = NOW()');
//     params.push(classId);

//     const sql = `UPDATE classes SET ${updateFields.join(', ')} WHERE class_id = ?`;
//     await db.query(sql, params);

//     console.log(`✅ Class ${classId} updated by admin ${adminUserId}. Fields: ${Object.keys(updateData).join(', ')}`);

//     const updatedSql = `
//       SELECT c.*, u.username as created_by_username
//       FROM classes c
//       LEFT JOIN users u ON c.created_by = u.id
//       WHERE c.class_id = ?
//     `;
//     const [updatedClass] = await db.query(updatedSql, [classId]);

//     return {
//       ...updatedClass,
//       display_id: formatClassIdForDisplay(classId),
//       tags: updatedClass.tags ? updatedClass.tags.split(',') : [],
//       prerequisites: updatedClass.prerequisites ? updatedClass.prerequisites.split(',') : [],
//       learning_objectives: updatedClass.learning_objectives ? updatedClass.learning_objectives.split(',') : [],
//       class_schedule: updatedClass.class_schedule ? JSON.parse(updatedClass.class_schedule) : null
//     };

//   } catch (error) {
//     console.error('❌ updateClassService error:', error);
//     if (error instanceof CustomError) throw error;
//     throw new CustomError('Failed to update class', 500);
//   }
// };




// /**
//  * Delete class with proper cleanup and safety checks
//  */
// export const deleteClassService = async (classId, options = {}) => {
//   try {
//     if (!validateClassIdFormat(classId)) {
//       throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
//     }

//     const { 
//       force = false, 
//       transfer_members_to, 
//       deleted_by,
//       archive_instead = false,
//       deletion_reason 
//     } = options;

//     const classSql = `
//       SELECT c.*, 
//         COALESCE(cmc.total_members, 0) as member_count,
//         (SELECT COUNT(*) FROM class_content_access WHERE class_id = c.class_id) as content_count
//       FROM classes c
//       LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
//       WHERE c.class_id = ? AND c.class_id LIKE "OTU#%"
//     `;
//     const [classData] = await db.query(classSql, [classId]);
    
//     if (!classData) {
//       throw new CustomError('Class not found', 404);
//     }

//     if (classId === 'OTU#Public' && !force) {
//       throw new CustomError('Cannot delete the public class without force flag', 403);
//     }

//     if (!force) {
//       if (classData.member_count > 0 && !transfer_members_to && !archive_instead) {
//         throw new CustomError(
//           `Cannot delete class with ${classData.member_count} members. Use force=true, transfer_members_to, or archive_instead=true.`, 
//           400
//         );
//       }

//       if (classData.content_count > 0 && !archive_instead) {
//         throw new CustomError(
//           `Cannot delete class with ${classData.content_count} content items. Use force=true or archive_instead=true.`, 
//           400
//         );
//       }
//     }

//     if (archive_instead) {
//       const archiveSql = `
//         UPDATE classes 
//         SET is_active = 0, updatedAt = NOW()
//         WHERE class_id = ?
//       `;
//       await db.query(archiveSql, [classId]);

//       return {
//         archived_class_id: classId,
//         class_name: classData.class_name,
//         display_id: formatClassIdForDisplay(classId),
//         members_count: classData.member_count,
//         content_count: classData.content_count,
//         archived_by: deleted_by,
//         archivedAt: new Date().toISOString(),
//         archive_reason: deletion_reason,
//         action: 'archived'
//       };
//     }

//     if (transfer_members_to && classData.member_count > 0) {
//       const targetSql = 'SELECT class_id, class_name FROM classes WHERE class_id = ? AND is_active = 1 AND class_id LIKE "OTU#%"';
//       const [targetClass] = await db.query(targetSql, [transfer_members_to]);
      
//       if (!targetClass) {
//         throw new CustomError('Target class for member transfer not found, inactive, or invalid format', 400);
//       }

//       const transferSql = `
//         UPDATE user_class_memberships 
//         SET class_id = ?, updatedAt = NOW()
//         WHERE class_id = ? AND membership_status = 'active'
//       `;
//       const transferResult = await db.query(transferSql, [transfer_members_to, classId]);

//       console.log(`✅ Transferred ${transferResult.affectedRows} members from ${classId} to ${transfer_members_to}`);
//     } else if (force && classData.member_count > 0) {
//       const removeMembersSql = `
//         UPDATE user_class_memberships 
//         SET membership_status = 'expired', updatedAt = NOW()
//         WHERE class_id = ?
//       `;
//       await db.query(removeMembersSql, [classId]);
//     }

//     if (force && classData.content_count > 0) {
//       const removeContentSql = 'DELETE FROM class_content_access WHERE class_id = ?';
//       await db.query(removeContentSql, [classId]);
//     }

//     const deleteSql = 'DELETE FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
//     await db.query(deleteSql, [classId]);

//     console.log(`✅ Class ${classId} deleted by admin ${deleted_by}. Reason: ${deletion_reason || 'No reason provided'}`);

//     return {
//       deleted_class_id: classId,
//       deleted_class_name: classData.class_name,
//       display_id: formatClassIdForDisplay(classId),
//       members_affected: classData.member_count,
//       content_items_affected: classData.content_count,
//       members_transferred_to: transfer_members_to || null,
//       force_delete: force,
//       deleted_by,
//       deletion_reason,
//       deletedAt: new Date().toISOString(),
//       action: 'deleted'
//     };

//   } catch (error) {
//     console.error('❌ deleteClassService error:', error);
//     if (error instanceof CustomError) throw error;
//     throw new CustomError('Failed to delete class', 500);
//   }
// };




// /**
//  * Manage class membership (approve/reject/remove/change roles)
//  */
// export const manageClassMembershipService = async (classId, userId, action, adminUserId, options = {}) => {
//   try {
//     if (!validateClassIdFormat(classId)) {
//       throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
//     }

//     const adminCheckSql = `
//       SELECT ucm.role_in_class, c.class_name
//       FROM user_class_memberships ucm
//       INNER JOIN classes c ON ucm.class_id = c.class_id
//       WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active' AND c.class_id LIKE "OTU#%"
//     `;
//     const [adminMembership] = await db.query(adminCheckSql, [adminUserId, classId]);

//     const isSystemAdmin = options.isSystemAdmin || false;
    
//     if (!isSystemAdmin && (!adminMembership || !['moderator', 'instructor'].includes(adminMembership.role_in_class))) {
//       throw new CustomError('You do not have permission to manage this class', 403);
//     }

//     const membershipSql = `
//       SELECT ucm.*, u.username, u.email
//       FROM user_class_memberships ucm
//       INNER JOIN users u ON ucm.user_id = u.id
//       WHERE ucm.user_id = ? AND ucm.class_id = ?
//     `;
//     const [membership] = await db.query(membershipSql, [userId, classId]);

//     if (!membership) {
//       throw new CustomError('User membership not found', 404);
//     }

//     let sql, params, message, actionResult = {};
//     const { new_role, reason, notify_user = true } = options;

//     switch (action) {
//       case 'approve':
//         if (membership.membership_status !== 'pending') {
//           throw new CustomError('Only pending memberships can be approved', 400);
//         }
//         sql = `
//           UPDATE user_class_memberships 
//           SET membership_status = 'active', updatedAt = NOW()
//           WHERE user_id = ? AND class_id = ?
//         `;
//         params = [userId, classId];
//         message = 'Membership approved successfully';
//         actionResult = { new_status: 'active', approved_by: adminUserId };
//         break;

//       case 'reject':
//         if (membership.membership_status !== 'pending') {
//           throw new CustomError('Only pending memberships can be rejected', 400);
//         }
//         sql = `
//           UPDATE user_class_memberships 
//           SET membership_status = 'suspended', updatedAt = NOW()
//           WHERE user_id = ? AND class_id = ?
//         `;
//         params = [userId, classId];
//         message = 'Membership rejected successfully';
//         actionResult = { new_status: 'suspended', rejected_by: adminUserId };
//         break;

//       case 'remove':
//         if (membership.membership_status !== 'active') {
//           throw new CustomError('Only active members can be removed', 400);
//         }
//         if (membership.role_in_class === 'moderator') {
//           const countSql = 'SELECT COUNT(*) as count FROM user_class_memberships WHERE class_id = ? AND role_in_class = "moderator" AND membership_status = "active"';
//           const [countResult] = await db.query(countSql, [classId]);
//           if (countResult.count <= 1) {
//             throw new CustomError('Cannot remove the last moderator', 400);
//           }
//         }
//         sql = `
//           UPDATE user_class_memberships 
//           SET membership_status = 'expired', updatedAt = NOW()
//           WHERE user_id = ? AND class_id = ?
//         `;
//         params = [userId, classId];
//         message = 'Member removed successfully';
//         actionResult = { new_status: 'expired', removed_by: adminUserId };
//         break;

//       case 'change_role':
//       case 'promote':
//       case 'demote':
//         if (!new_role || !['member', 'moderator', 'assistant', 'instructor'].includes(new_role)) {
//           throw new CustomError('Invalid role. Must be: member, moderator, assistant, or instructor', 400);
//         }
//         if (membership.membership_status !== 'active') {
//           throw new CustomError('Only active members can have role changes', 400);
//         }
//         if (membership.role_in_class === new_role) {
//           throw new CustomError(`User already has the role: ${new_role}`, 400);
//         }
//         sql = `
//           UPDATE user_class_memberships 
//           SET role_in_class = ?, updatedAt = NOW()
//           WHERE user_id = ? AND class_id = ?
//         `;
//         params = [new_role, userId, classId];
//         message = `Role changed to ${new_role} successfully`;
//         actionResult = { 
//           previous_role: membership.role_in_class, 
//           new_role, 
//           changed_by: adminUserId 
//         };
//         break;

//       default:
//         throw new CustomError('Invalid action. Must be: approve, reject, remove, change_role, promote, or demote', 400);
//     }

//     await db.query(sql, params);

//     console.log(`✅ Class membership action: ${action} for user ${userId} in class ${classId} by admin ${adminUserId}`);

//     return {
//       success: true,
//       message,
//       action,
//       user_id: userId,
//       username: membership.username,
//       class_id: classId,
//       class_name: adminMembership?.class_name || 'System Admin Action',
//       display_id: formatClassIdForDisplay(classId),
//       previous_status: membership.membership_status,
//       previous_role: membership.role_in_class,
//       ...actionResult,
//       reason,
//       notify_user,
//       performed_by: adminUserId,
//       timestamp: new Date().toISOString()
//     };

//   } catch (error) {
//     console.error('❌ manageClassMembershipService error:', error);
//     if (error instanceof CustomError) throw error;
//     throw new CustomError('Failed to manage class membership', 500);
//   }
// };



// // ===============================================
// // ADDITIONAL ADMIN SERVICES
// // ===============================================

// /**
//  * Archive class service
//  */
// export const archiveClassService = async (classId, options = {}) => {
//   try {
//     if (!validateClassIdFormat(classId)) {
//       throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
//     }

//     const { archived_by, archive_reason } = options;

//     const classSql = 'SELECT * FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
//     const [classData] = await db.query(classSql, [classId]);
    
//     if (!classData) {
//       throw new CustomError('Class not found', 404);
//     }

//     const archiveSql = `
//       UPDATE classes 
//       SET is_active = 0, updatedAt = NOW()
//       WHERE class_id = ?
//     `;
//     await db.query(archiveSql, [classId]);

//     return {
//       archived_class_id: classId,
//       class_name: classData.class_name,
//       display_id: formatClassIdForDisplay(classId),
//       archived_by,
//       archivedAt: new Date().toISOString(),
//       archive_reason
//     };

//   } catch (error) {
//     console.error('❌ archiveClassService error:', error);
//     if (error instanceof CustomError) throw error;
//     throw new CustomError('Failed to archive class', 500);
//   }
// };



// /**
//  * Restore class service
//  */
// export const restoreClassService = async (classId, options = {}) => {
//   try {
//     if (!validateClassIdFormat(classId)) {
//       throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
//     }

//     const { restore_members = true, restored_by } = options;

//     const classSql = 'SELECT * FROM classes WHERE class_id = ? AND is_active = 0 AND class_id LIKE "OTU#%"';
//     const [classData] = await db.query(classSql, [classId]);
    
//     if (!classData) {
//       throw new CustomError('Archived class not found', 404);
//     }

//     const restoreSql = `
//       UPDATE classes 
//       SET is_active = 1, updatedAt = NOW()
//       WHERE class_id = ?
//     `;
//     await db.query(restoreSql, [classId]);

//     if (restore_members) {
//       const restoreMembersSql = `
//         UPDATE user_class_memberships 
//         SET membership_status = 'active', updatedAt = NOW()
//         WHERE class_id = ? AND membership_status = 'expired'
//       `;
//       await db.query(restoreMembersSql, [classId]);
//     }

//     return {
//       restored_class_id: classId,
//       class_name: classData.class_name,
//       display_id: formatClassIdForDisplay(classId),
//       restored_by,
//       restoredAt: new Date().toISOString(),
//       members_restored: restore_members
//     };

//   } catch (error) {
//     console.error('❌ restoreClassService error:', error);
//     if (error instanceof CustomError) throw error;
//     throw new CustomError('Failed to restore class', 500);
//   }
// };



// /**
//  * Duplicate class service
//  */
// export const duplicateClassService = async (classId, options = {}) => {
//   try {
//     if (!validateClassIdFormat(classId)) {
//       throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
//     }

//     const { 
//       new_name, 
//       copy_members = false, 
//       copy_content = true, 
//       copy_schedule = false,
//       duplicated_by 
//     } = options;

//     const originalSql = 'SELECT * FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
//     const [original] = await db.query(originalSql, [classId]);
    
//     if (!original) {
//       throw new CustomError('Class not found', 404);
//     }

//     const duplicateData = {
//       ...original,
//       class_id: undefined,
//       class_name: new_name || `${original.class_name} (Copy)`,
//       public_name: new_name || `${original.public_name} (Copy)`,
//       created_by: duplicated_by,
//       createdAt: undefined,
//       updatedAt: undefined
//     };

//     delete duplicateData.id;

//     const newClass = await createClassService(duplicateData, duplicated_by);

//     if (copy_content) {
//       const contentSql = `
//         INSERT INTO class_content_access (content_id, content_type, class_id, access_level, createdAt)
//         SELECT content_id, content_type, ?, access_level, NOW()
//         FROM class_content_access
//         WHERE class_id = ?
//       `;
//       await db.query(contentSql, [newClass.class_id, classId]);
//     }

//     if (copy_members) {
//       const membersSql = `
//         INSERT INTO user_class_memberships (user_id, class_id, role_in_class, membership_status, joinedAt, receive_notifications, can_see_class_name, createdAt, updatedAt)
//         SELECT user_id, ?, role_in_class, membership_status, NOW(), receive_notifications, can_see_class_name, NOW(), NOW()
//         FROM user_class_memberships
//         WHERE class_id = ? AND membership_status = 'active'
//       `;
//       await db.query(membersSql, [newClass.class_id, classId]);
//     }

//     return {
//       original_class_id: classId,
//       new_class_id: newClass.class_id,
//       new_class_name: newClass.class_name,
//       display_id: formatClassIdForDisplay(newClass.class_id),
//       duplicated_by,
//       duplicatedAt: new Date().toISOString(),
//       copied_features: {
//         content: copy_content,
//         members: copy_members,
//         schedule: copy_schedule
//       }
//     };

//   } catch (error) {
//     console.error('❌ duplicateClassService error:', error);
//     if (error instanceof CustomError) throw error;
//     throw new CustomError('Failed to duplicate class', 500);
//   }
// };



// /**
//  * Get class enrollment statistics
//  */
// export const getClassEnrollmentStatsService = async (classId, options = {}) => {
//   try {
//     if (!validateClassIdFormat(classId)) {
//       throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
//     }

//     const { period = '30d', breakdown = 'daily' } = options;

//     const days = parseInt(period.replace('d', ''));
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - days);

//     const trendQuery = breakdown === 'daily' ? `
//       SELECT 
//         DATE(joinedAt) as period,
//         COUNT(*) as new_enrollments,
//         SUM(CASE WHEN membership_status = 'active' THEN 1 ELSE 0 END) as active_enrollments
//       FROM user_class_memberships
//       WHERE class_id = ? AND joinedAt >= ?
//       GROUP BY DATE(joinedAt)
//       ORDER BY period ASC
//     ` : `
//       SELECT 
//         YEARWEEK(joinedAt) as period,
//         COUNT(*) as new_enrollments,
//         SUM(CASE WHEN membership_status = 'active' THEN 1 ELSE 0 END) as active_enrollments
//       FROM user_class_memberships
//       WHERE class_id = ? AND joinedAt >= ?
//       GROUP BY YEARWEEK(joinedAt)
//       ORDER BY period ASC
//     `;

//     const enrollmentTrends = await db.query(trendQuery, [classId, startDate]);

//     const [currentStats] = await db.query(`
//       SELECT 
//         COUNT(*) as total_enrollments,
//         SUM(CASE WHEN membership_status = 'active' THEN 1 ELSE 0 END) as active_members,
//         SUM(CASE WHEN membership_status = 'pending' THEN 1 ELSE 0 END) as pending_members,
//         SUM(CASE WHEN membership_status = 'suspended' THEN 1 ELSE 0 END) as suspended_members,
//         SUM(CASE WHEN membership_status = 'expired' THEN 1 ELSE 0 END) as expired_members,
//         AVG(DATEDIFF(NOW(), joinedAt)) as avg_membership_duration,
//         MIN(joinedAt) as first_enrollment,
//         MAX(joinedAt) as last_enrollment
//       FROM user_class_memberships
//       WHERE class_id = ?
//     `, [classId]);

//     const roleDistribution = await db.query(`
//       SELECT 
//         role_in_class,
//         COUNT(*) as count,
//         (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_class_memberships WHERE class_id = ? AND membership_status = 'active')) as percentage
//       FROM user_class_memberships
//       WHERE class_id = ? AND membership_status = 'active'
//       GROUP BY role_in_class
//     `, [classId, classId]);

//     return {
//       current_status: currentStats,
//       enrollment_trends: enrollmentTrends,
//       role_distribution: roleDistribution,
//       class_id: classId,
//       display_id: formatClassIdForDisplay(classId),
//       period,
//       breakdown,
//       generatedAt: new Date().toISOString()
//     };

//   } catch (error) {
//     console.error('❌ getClassEnrollmentStatsService error:', error);
//     if (error instanceof CustomError) throw error;
//     throw new CustomError('Failed to get enrollment statistics', 500);
//   }
// };




// /**
//  * Get class analytics
//  */
// export const getClassAnalyticsService = async (filters = {}) => {
//   try {
//     const {
//       period = '30d',
//       class_type,
//       include_inactive = false,
//       breakdown = 'daily',
//       class_id,
//       date_from,
//       date_to
//     } = filters;

//     let dateCondition = '';
//     const params = [];
    
//     if (date_from && date_to) {
//       dateCondition = 'AND c.createdAt BETWEEN ? AND ?';
//       params.push(date_from, date_to);
//     } else if (period) {
//       const days = parseInt(period.replace('d', ''));
//       const startDate = new Date();
//       startDate.setDate(startDate.getDate() - days);
//       dateCondition = 'AND c.createdAt >= ?';
//       params.push(startDate);
//     }

//     let whereClause = 'WHERE c.class_id LIKE "OTU#%"';
    
//     if (class_type) {
//       whereClause += ' AND c.class_type = ?';
//       params.push(class_type);
//     }
    
//     if (!include_inactive) {
//       whereClause += ' AND c.is_active = 1';
//     }
    
//     if (class_id) {
//       whereClause += ' AND c.class_id = ?';
//       params.push(class_id);
//     }

//     const [overallStats] = await db.query(`
//       SELECT 
//         COUNT(DISTINCT c.id) as total_classes,
//         SUM(CASE WHEN c.is_active = 1 THEN 1 ELSE 0 END) as active_classes,
//         SUM(CASE WHEN c.is_public = 1 THEN 1 ELSE 0 END) as public_classes,
//         COUNT(DISTINCT ucm.user_id) as unique_members,
//         COUNT(ucm.id) as total_memberships,
//         AVG(cm.total_members) as avg_members_per_class,
//         MAX(cm.total_members) as max_class_size,
//         SUM(c.max_members) as total_capacity,
//         AVG(CASE WHEN c.max_members > 0 
//           THEN cm.total_members * 100.0 / c.max_members 
//           ELSE 0 END) as avg_capacity_utilization
//       FROM classes c
//       LEFT JOIN user_class_memberships ucm ON c.class_id = ucm.class_id
//       LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
//       ${whereClause} ${dateCondition}
//     `, params);

//     const typeDistribution = await db.query(`
//       SELECT 
//         c.class_type,
//         COUNT(*) as count,
//         SUM(CASE WHEN c.is_active = 1 THEN 1 ELSE 0 END) as active_count,
//         COUNT(DISTINCT ucm.user_id) as unique_members,
//         AVG(cm.total_members) as avg_members
//       FROM classes c
//       LEFT JOIN user_class_memberships ucm ON c.class_id = ucm.class_id
//       LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
//       ${whereClause} ${dateCondition}
//       GROUP BY c.class_type
//       ORDER BY count DESC
//     `, params);

//     const topClasses = await db.query(`
//       SELECT 
//         c.class_id,
//         c.class_name,
//         c.class_type,
//         cm.total_members as member_count,
//         c.max_members,
//         (cm.total_members * 100.0 / c.max_members) as utilization_rate
//       FROM classes c
//       LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
//       WHERE c.is_active = 1 AND c.class_id LIKE "OTU#%"
//       ORDER BY member_count DESC
//       LIMIT 10
//     `);

//     return {
//       summary: overallStats,
//       type_distribution: typeDistribution,
//       top_classes: topClasses.map(cls => ({
//         ...cls,
//         display_id: formatClassIdForDisplay(cls.class_id)
//       })),
//       filters_applied: filters,
//       generatedAt: new Date().toISOString()
//     };

//   } catch (error) {
//     console.error('❌ getClassAnalyticsService error:', error);
//     if (error instanceof CustomError) throw error;
//     throw new CustomError('Failed to generate analytics', 500);
//   }
// };



// /**
//  * Bulk create classes
//  */
// export const bulkCreateClassesService = async (classesData, createdBy) => {
//   const successful = [];
//   const failed = [];

//   try {
//     for (let i = 0; i < classesData.length; i++) {
//       const classData = classesData[i];
      
//       try {
//         if (!classData.class_name) {
//           throw new Error('class_name is required');
//         }

//         const newClass = await createClassService(classData, createdBy);
        
//         successful.push({
//           index: i,
//           class_id: newClass.class_id,
//           class_name: newClass.class_name,
//           display_id: newClass.display_id
//         });
        
//       } catch (error) {
//         failed.push({
//           index: i,
//           class_name: classData.class_name,
//           error: error.message
//         });
//       }
//     }

//     console.log(`✅ Bulk created ${successful.length} classes, ${failed.length} failed`);

//     return {
//       successful,
//       failed,
//       summary: {
//         total_requested: classesData.length,
//         successful_count: successful.length,
//         failed_count: failed.length
//       }
//     };

//   } catch (error) {
//     console.error('❌ bulkCreateClassesService error:', error);
//     throw new CustomError('Bulk creation failed', 500);
//   }
// };



// /**
//  * Bulk update classes
//  */
// export const bulkUpdateClassesService = async (classIds, updates, updatedBy) => {
//   const successful = [];
//   const failed = [];

//   try {
//     for (const classId of classIds) {
//       try {
//         const updatedClass = await updateClassService(classId, updates, updatedBy);
        
//         successful.push({
//           class_id: classId,
//           updated: true,
//           display_id: updatedClass.display_id
//         });
//       } catch (error) {
//         failed.push({
//           class_id: classId,
//           error: error.message
//         });
//       }
//     }

//     console.log(`✅ Bulk updated ${successful.length} classes, ${failed.length} failed`);

//     return {
//       successful,
//       failed,
//       summary: {
//         total_requested: classIds.length,
//         successful_count: successful.length,
//         failed_count: failed.length
//       },
//       updates_applied: Object.keys(updates)
//     };

//   } catch (error) {
//     console.error('❌ bulkUpdateClassesService error:', error);
//     throw new CustomError('Bulk update failed', 500);
//   }
// };



// /**
//  * Bulk delete classes
//  */
// export const bulkDeleteClassesService = async (classIds, options = {}) => {
//   const successful = [];
//   const failed = [];

//   try {
//     for (const classId of classIds) {
//       try {
//         const result = await deleteClassService(classId, options);
        
//         successful.push({
//           class_id: classId,
//           action: result.action,
//           display_id: result.display_id
//         });
//       } catch (error) {
//         failed.push({
//           class_id: classId,
//           error: error.message
//         });
//       }
//     }

//     console.log(`✅ Bulk deleted ${successful.length} classes, ${failed.length} failed`);

//     return {
//       successful,
//       failed,
//       summary: {
//         total_requested: classIds.length,
//         successful_count: successful.length,
//         failed_count: failed.length
//       }
//     };

//   } catch (error) {
//     console.error('❌ bulkDeleteClassesService error:', error);
//     throw new CustomError('Bulk delete failed', 500);
//   }
// };



// // ===============================================
// // CLASS MANAGEMENT SERVICES (Routes: GET, POST, PUT, DELETE /classes/admin)
// // ===============================================

// /**
//  * Get comprehensive class management data for admin
//  * Route: GET /classes/admin
//  */
// export const getClassManagementService = async (filters = {}, options = {}) => {
//   try {
//     const { 
//       type, 
//       is_active, 
//       search, 
//       date_from, 
//       date_to, 
//       created_by, 
//       min_members, 
//       max_members 
//     } = filters;
    
//     const { 
//       page = 1, 
//       limit = 20, 
//       sort_by = 'createdAt', 
//       sort_order = 'DESC',
//       include_stats = true 
//     } = options;
    
//     const offset = (page - 1) * limit;

//     let whereClause = 'WHERE c.class_id LIKE "OTU#%"';
//     const params = [];

//     if (type) {
//       whereClause += ' AND c.class_type = ?';
//       params.push(type);
//     }

//     if (is_active !== undefined) {
//       whereClause += ' AND c.is_active = ?';
//       params.push(is_active);
//     }

//     if (search) {
//       whereClause += ' AND (c.class_name LIKE ? OR c.public_name LIKE ? OR c.description LIKE ? OR c.tags LIKE ?)';
//       const searchTerm = `%${search}%`;
//       params.push(searchTerm, searchTerm, searchTerm, searchTerm);
//     }

//     if (date_from) {
//       whereClause += ' AND c.createdAt >= ?';
//       params.push(date_from);
//     }

//     if (date_to) {
//       whereClause += ' AND c.createdAt <= ?';
//       params.push(date_to);
//     }

//     if (created_by) {
//       whereClause += ' AND c.created_by = ?';
//       params.push(created_by);
//     }

//     if (min_members) {
//       whereClause += ' AND COALESCE(cm.total_members, 0) >= ?';
//       params.push(min_members);
//     }

//     if (max_members) {
//       whereClause += ' AND COALESCE(cm.total_members, 0) <= ?';
//       params.push(max_members);
//     }

//     const countSql = `SELECT COUNT(*) as total FROM classes c LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id ${whereClause}`;
//     const [countResult] = await db.query(countSql, params);
//     const total = countResult.total;

//     const sql = `
//       SELECT 
//         c.*,
//         u.username as created_by_username,
//         u.email as created_by_email,
//         COALESCE(cm.total_members, 0) as total_members,
//         COALESCE(cm.moderators, 0) as moderators,
//         COALESCE(cm.pending_members, 0) as pending_members,
//         ${include_stats ? `
//         (SELECT COUNT(*) FROM class_content_access WHERE class_id = c.class_id) as content_count,
//         DATEDIFF(NOW(), c.createdAt) as days_since_creation,
//         CASE 
//           WHEN c.max_members > 0 THEN ROUND((COALESCE(cm.total_members, 0) / c.max_members) * 100, 2)
//           ELSE 0 
//         END as capacity_percentage,
//         CASE 
//           WHEN c.max_members <= COALESCE(cm.total_members, 0) THEN 1
//           ELSE 0 
//         END as is_at_capacity
//         ` : '0 as content_count, 0 as days_since_creation, 0 as capacity_percentage, 0 as is_at_capacity'}
//       FROM classes c
//       LEFT JOIN users u ON c.created_by = u.id
//       LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
//       ${whereClause}
//       ORDER BY 
//         CASE WHEN c.class_id = 'OTU#Public' THEN 0 ELSE 1 END,
//         c.${sort_by} ${sort_order}
//       LIMIT ? OFFSET ?
//     `;
    
//     params.push(limit, offset);
//     const classes = await db.query(sql, params);

//     const formattedClasses = classes.map(cls => ({
//       ...cls,
//       display_id: formatClassIdForDisplay(cls.class_id),
//       id_format: 'new_standard',
//       tags: cls.tags ? (typeof cls.tags === 'string' ? cls.tags.split(',') : cls.tags) : [],
//       health_score: calculateClassHealthScore(cls),
//       available_spots: cls.max_members - (cls.total_members || 0)
//     }));

//     let summary = null;
//     if (include_stats) {
//       const summarySql = `
//         SELECT 
//           COUNT(*) as total_classes,
//           SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_classes,
//           SUM(CASE WHEN class_type = 'demographic' THEN 1 ELSE 0 END) as demographic_classes,
//           SUM(CASE WHEN class_type = 'subject' THEN 1 ELSE 0 END) as subject_classes,
//           SUM(CASE WHEN class_type = 'public' THEN 1 ELSE 0 END) as public_classes,
//           SUM(CASE WHEN class_type = 'special' THEN 1 ELSE 0 END) as special_classes,
//           SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as publicly_visible,
//           AVG(max_members) as avg_max_capacity,
//           AVG(COALESCE(cm.total_members, 0)) as avg_current_members,
//           SUM(CASE WHEN max_members <= COALESCE(cm.total_members, 0) THEN 1 ELSE 0 END) as classes_at_capacity
//         FROM classes c
//         LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
//         ${whereClause}
//       `;
//       const [summaryResult] = await db.query(summarySql, params.slice(0, -2));
//       summary = summaryResult;
      
//       if (summary) {
//         summary.avg_max_capacity = Math.round(summary.avg_max_capacity || 0);
//         summary.avg_current_members = Math.round(summary.avg_current_members || 0);
//         summary.overall_capacity_utilization = summary.avg_max_capacity > 0 ? 
//           Math.round((summary.avg_current_members / summary.avg_max_capacity) * 100) : 0;
//       }
//     }

//     return {
//       data: formattedClasses,
//       pagination: {
//         current_page: page,
//         total_pages: Math.ceil(total / limit),
//         total_records: total,
//         per_page: limit,
//         has_next: page < Math.ceil(total / limit),
//         has_previous: page > 1
//       },
//       summary,
//       filters_applied: Object.keys(filters).filter(key => filters[key] !== undefined).length
//     };

//   } catch (error) {
//     console.error('❌ getClassManagementService error:', error);
//     throw new CustomError('Failed to fetch class management data', 500);
//   }
// };

// /**
//  * Get class participants (admin view)
//  * Route: GET /classes/admin/:id/participants
//  */
// export const getClassParticipantsAdminService = async (classId, options = {}) => {
//   try {
//     if (!validateClassIdFormat(classId)) {
//       throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
//     }

//     const { 
//       role_in_class, 
//       membership_status = 'active', 
//       page = 1, 
//       limit = 50,
//       search,
//       sort_by = 'joinedAt',
//       sort_order = 'DESC',
//       include_inactive = false,
//       date_from,
//       date_to
//     } = options;
    
//     const offset = (page - 1) * limit;

//     let whereClause = 'WHERE ucm.class_id = ?';
//     const params = [classId];

//     if (membership_status) {
//       whereClause += ' AND ucm.membership_status = ?';
//       params.push(membership_status);
//     }

//     if (role_in_class) {
//       whereClause += ' AND ucm.role_in_class = ?';
//       params.push(role_in_class);
//     }

//     if (search) {
//       whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)';
//       const searchTerm = `%${search}%`;
//       params.push(searchTerm, searchTerm);
//     }

//     if (date_from) {
//       whereClause += ' AND ucm.joinedAt >= ?';
//       params.push(date_from);
//     }

//     if (date_to) {
//       whereClause += ' AND ucm.joinedAt <= ?';
//       params.push(date_to);
//     }

//     if (!include_inactive) {
//       whereClause += ' AND (ucm.expiresAt IS NULL OR ucm.expiresAt > NOW())';
//     }

//     const countSql = `
//       SELECT COUNT(*) as total 
//       FROM user_class_memberships ucm 
//       INNER JOIN users u ON ucm.user_id = u.id
//       ${whereClause}
//     `;
//     const [countResult] = await db.query(countSql, params);
//     const total = countResult.total;

//     const sql = `
//       SELECT 
//         u.id as user_id,
//         u.username,
//         u.email,
//         u.membership_stage,
//         u.full_membership_status,
//         ucm.role_in_class,
//         ucm.membership_status,
//         ucm.joinedAt,
//         ucm.expiresAt,
//         ucm.receive_notifications,
//         ucm.can_see_class_name,
//         ucm.assigned_by,
//         assigned_by_user.username as assigned_by_username,
//         DATEDIFF(NOW(), ucm.joinedAt) as days_as_member
//       FROM user_class_memberships ucm
//       INNER JOIN users u ON ucm.user_id = u.id
//       LEFT JOIN users assigned_by_user ON ucm.assigned_by = assigned_by_user.id
//       ${whereClause}
//       ORDER BY ucm.${sort_by} ${sort_order}
//       LIMIT ? OFFSET ?
//     `;
    
//     params.push(limit, offset);
//     const participants = await db.query(sql, params);

//     return {
//       data: participants,
//       pagination: {
//         current_page: page,
//         total_pages: Math.ceil(total / limit),
//         total_records: total,
//         per_page: limit
//       },
//       summary: {
//         total_participants: total,
//         by_role: {
//           moderators: participants.filter(p => p.role_in_class === 'moderator').length,
//           instructors: participants.filter(p => p.role_in_class === 'instructor').length,
//           assistants: participants.filter(p => p.role_in_class === 'assistant').length,
//           members: participants.filter(p => p.role_in_class === 'member').length
//         }
//       }
//     };

//   } catch (error) {
//     console.error('❌ getClassParticipantsAdminService error:', error);
//     if (error instanceof CustomError) throw error;
//     throw new CustomError('Failed to fetch class participants', 500);
//   }
// };

// /**
//  * Add participant to class
//  * Route: POST /classes/admin/:id/participants/add
//  */

// export const addParticipantToClassService = async (classId, userData, adminUserId) => {
//   try {
//     if (!validateClassIdFormat(classId)) {
//       throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
//     }

//     const {
//       user_id,
//       user_ids, // For bulk add
//       role_in_class = 'member',
//       receive_notifications = true,
//       expires_at,
//       can_see_class_name = true,
//       assignment_reason
//     } = userData;

//     // Handle bulk add
//     if (user_ids && Array.isArray(user_ids)) {
//       const results = [];
//       for (const userId of user_ids) {
//         try {
//           const result = await addSingleParticipant(classId, userId, {
//             role_in_class,
//             receive_notifications,
//             expires_at,
//             can_see_class_name,
//             assignment_reason,
//             assigned_by: adminUserId
//           });
//           results.push({ user_id: userId, success: true, ...result });
//         } catch (error) {
//           results.push({ user_id: userId, success: false, error: error.message });
//         }
//       }
//       return {
//         results,
//         summary: {
//           total_requested: user_ids.length,
//           successful_count: results.filter(r => r.success).length,
//           failed_count: results.filter(r => !r.success).length
//         }
//       };
//     }
//     // Single user add
//     else if (user_id) {
//       return await addSingleParticipant(classId, user_id, {
//         role_in_class,
//         receive_notifications,
//         expires_at,
//         can_see_class_name,
//         assignment_reason,
//         assigned_by: adminUserId
//       });
//     } else {
//       throw new CustomError('user_id or user_ids is required for adding participants', 400);
//     }
//   } catch (error) {
//     console.error('❌ addParticipantToClassService error:', error);
//     if (error instanceof CustomError) throw error;
//     throw new CustomError('Failed to add participant to class', 500);
//   }
// };  




// // ===============================================
// // MODULE EXPORTS
// // ===============================================

// export default {
//   // Class Management
//   getClassManagementService,
//   createClassService,
//   updateClassService,
//   deleteClassService,
  
//   // Membership Management
//   manageClassMembershipService,
  
//   // Archive/Restore/Duplicate
//   archiveClassService,
//   restoreClassService,
//   duplicateClassService,
  
//   // Analytics & Stats
//   getClassEnrollmentStatsService,
//   getClassAnalyticsService,
  
//   // Bulk Operations
//   bulkCreateClassesService,
//   bulkUpdateClassesService,
//   bulkDeleteClassesService
// };

