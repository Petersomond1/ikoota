// ikootaapi/services/classAdminServices.js
// ADMIN CLASS MANAGEMENT SERVICES - ENHANCED COMPLETE IMPLEMENTATION
// Builds upon existing implementation with additional functionality and improvements

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { generateUniqueClassId, validateIdFormat } from '../utils/idGenerator.js';

// ===============================================
// ID FORMAT VALIDATION (NEW FORMAT ONLY)
// ===============================================


/**
 * Validates class ID format - NEW FORMAT ONLY: OTU#XXXXXX
 * @param {string} classId - The class ID to validate
 * @returns {boolean} True if valid OTU# format
 */
// const validateClassIdFormat = (classId) => {
//   if (!classId || typeof classId !== 'string') return false;
  
//   // Special case for public class
//   if (classId === 'OTU#Public') return true;
  
//   // Standard new format: OTU#XXXXXX (10 characters total)
//   return validateIdFormat(classId, 'class');
// };

/**
 * Formats class ID for display
 * @param {string} classId - The class ID (OTU# format)
 * @returns {string} Formatted display string
 */


/**
 * Validates class ID format - NEW FORMAT ONLY: OTU#XXXXXX
 */
const validateClassIdFormat = (classId) => {
  if (!classId || typeof classId !== 'string') return false;
  
  // Special case for public class
  if (classId === 'OTU#Public') return true;
  
  // Standard new format: OTU#XXXXXX (10 characters total)
  return validateIdFormat(classId, 'class');
};

/**
 * Formats class ID for display
 */
const formatClassIdForDisplay = (classId) => {
  if (classId === 'OTU#Public') return 'Public Community';
  return `Class ${classId}`;
};



// ===============================================
// ENHANCED CLASS MANAGEMENT SERVICES
// ===============================================

/**
 * Get comprehensive class management data for admin (ENHANCED VERSION)
 */
export const getClassManagementService = async (filters = {}, options = {}) => {
  try {
    const { 
      type, 
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

    let whereClause = 'WHERE c.class_id LIKE "OTU#%"';
    const params = [];

    // Enhanced filtering
    if (type) {
      whereClause += ' AND c.class_type = ?';
      params.push(type);
    }

    if (is_active !== undefined) {
      whereClause += ' AND c.is_active = ?';
      params.push(is_active);
    }

    if (search) {
      whereClause += ' AND (c.class_name LIKE ? OR c.public_name LIKE ? OR c.description LIKE ? OR c.tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (date_from) {
      whereClause += ' AND c.createdAt >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND c.createdAt <= ?';
      params.push(date_to);
    }

    if (created_by) {
      whereClause += ' AND c.created_by = ?';
      params.push(created_by);
    }

    if (min_members) {
      whereClause += ' AND COALESCE(cm.total_members, 0) >= ?';
      params.push(min_members);
    }

    if (max_members) {
      whereClause += ' AND COALESCE(cm.total_members, 0) <= ?';
      params.push(max_members);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM classes c LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id ${whereClause}`;
    const [{ total }] = await db.query(countSql, params);

    // Get classes with enhanced admin info
    const sql = `
      SELECT 
        c.*,
        u.username as created_by_username,
        u.email as created_by_email,
        updated_by_user.username as updated_by_username,
        COALESCE(cm.total_members, 0) as total_members,
        COALESCE(cm.moderators, 0) as moderators,
        COALESCE(cm.pending_members, 0) as pending_members,
        ${include_stats ? `
        (SELECT COUNT(*) FROM class_content_access WHERE class_id = c.class_id) as content_count,
        DATEDIFF(NOW(), c.createdAt) as days_since_creation,
        CASE 
          WHEN c.max_members > 0 THEN ROUND((COALESCE(cm.total_members, 0) / c.max_members) * 100, 2)
          ELSE 0 
        END as capacity_percentage,
        CASE 
          WHEN c.max_members <= COALESCE(cm.total_members, 0) THEN 1
          ELSE 0 
        END as is_at_capacity
        ` : '0 as content_count, 0 as days_since_creation, 0 as capacity_percentage, 0 as is_at_capacity'}
      FROM classes c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN users updated_by_user ON c.updated_by = updated_by_user.id
      LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
      ${whereClause}
      ORDER BY 
        CASE WHEN c.class_id = 'OTU#Public' THEN 0 ELSE 1 END,
        c.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const classes = await db.query(sql, params);

    // Add display formatting and health scoring
    const formattedClasses = classes.map(cls => ({
      ...cls,
      display_id: formatClassIdForDisplay(cls.class_id),
      id_format: 'new_standard',
      tags: cls.tags ? (typeof cls.tags === 'string' ? cls.tags.split(',') : cls.tags) : [],
      health_score: calculateClassHealthScore(cls),
      available_spots: cls.max_members - (cls.total_members || 0)
    }));

    // Enhanced summary statistics
    let summary = null;
    if (include_stats) {
      const summarySql = `
        SELECT 
          COUNT(*) as total_classes,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_classes,
          SUM(CASE WHEN class_type = 'demographic' THEN 1 ELSE 0 END) as demographic_classes,
          SUM(CASE WHEN class_type = 'subject' THEN 1 ELSE 0 END) as subject_classes,
          SUM(CASE WHEN class_type = 'public' THEN 1 ELSE 0 END) as public_classes,
          SUM(CASE WHEN class_type = 'special' THEN 1 ELSE 0 END) as special_classes,
          SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as publicly_visible,
          AVG(max_members) as avg_max_capacity,
          AVG(COALESCE(cm.total_members, 0)) as avg_current_members,
          SUM(CASE WHEN max_members <= COALESCE(cm.total_members, 0) THEN 1 ELSE 0 END) as classes_at_capacity
        FROM classes c
        LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
        ${whereClause}
      `;
      [summary] = await db.query(summarySql, params.slice(0, -2)); // Remove limit/offset
      
      // Add calculated fields
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
    console.error('❌ getClassManagementService error:', error);
    throw new CustomError('Failed to fetch class management data', 500);
  }
};

/**
 * Create a new class with enhanced options (ENHANCED VERSION)
 */
export const createClassService = async (classData) => {
  try {
    let {
      class_id,
      class_name,
      public_name,
      description,
      class_type = 'demographic',
      is_public = false,
      max_members = 50,
      privacy_level = 'members_only',
      created_by,
      // Enhanced fields
      tags,
      category,
      difficulty_level,
      estimated_duration,
      prerequisites,
      learning_objectives,
      auto_approve_members = false,
      allow_self_join = true,
      require_approval = true,
      enable_notifications = true,
      enable_discussions = true,
      enable_assignments = false,
      enable_grading = false,
      class_schedule,
      timezone = 'UTC',
      requirements,
      instructor_notes
    } = classData;

    // Validate required fields
    if (!class_name) {
      throw new CustomError('class_name is required', 400);
    }

    // Generate OTU# format ID if not provided
    if (!class_id) {
      class_id = await generateUniqueClassId();
    } else {
      if (!validateClassIdFormat(class_id)) {
        throw new CustomError('class_id must be in OTU#XXXXXX format', 400);
      }

      // Check if class_id already exists
      const existingSql = 'SELECT class_id FROM classes WHERE class_id = ?';
      const [existing] = await db.query(existingSql, [class_id]);
      
      if (existing) {
        throw new CustomError('Class ID already exists', 400);
      }
    }

    // Validate class_type
    const validTypes = ['demographic', 'subject', 'public', 'special', 'general', 'lecture', 'workshop', 'seminar', 'discussion'];
    if (!validTypes.includes(class_type)) {
      throw new CustomError(`Invalid class_type. Must be one of: ${validTypes.join(', ')}`, 400);
    }

    // Validate privacy_level
    const validPrivacyLevels = ['public', 'members_only', 'admin_only'];
    if (!validPrivacyLevels.includes(privacy_level)) {
      throw new CustomError(`Invalid privacy_level. Must be one of: ${validPrivacyLevels.join(', ')}`, 400);
    }

    // Process array fields
    const processedTags = Array.isArray(tags) ? tags.join(',') : tags;
    const processedPrerequisites = Array.isArray(prerequisites) ? prerequisites.join(',') : prerequisites;
    const processedObjectives = Array.isArray(learning_objectives) ? learning_objectives.join(',') : learning_objectives;
    const processedSchedule = class_schedule ? JSON.stringify(class_schedule) : null;

    // Create the class with enhanced fields
    const sql = `
      INSERT INTO classes (
        class_id, class_name, public_name, description, class_type,
        is_public, max_members, privacy_level, created_by, is_active,
        tags, category, difficulty_level, estimated_duration, prerequisites,
        learning_objectives, auto_approve_members, allow_self_join, require_approval,
        enable_notifications, enable_discussions, enable_assignments, enable_grading,
        class_schedule, timezone, requirements, instructor_notes,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await db.query(sql, [
      class_id, class_name, public_name || class_name, description,
      class_type, is_public, max_members, privacy_level, created_by,
      processedTags, category, difficulty_level, estimated_duration, processedPrerequisites,
      processedObjectives, auto_approve_members, allow_self_join, require_approval,
      enable_notifications, enable_discussions, enable_assignments, enable_grading,
      processedSchedule, timezone, requirements, instructor_notes
    ]);

    // Make the creator a moderator
    const membershipSql = `
      INSERT INTO user_class_memberships 
      (user_id, class_id, role_in_class, membership_status, joinedAt, assigned_by, receive_notifications, can_see_class_name, createdAt, updatedAt)
      VALUES (?, ?, 'moderator', 'active', NOW(), ?, 1, 1, NOW(), NOW())
    `;
    await db.query(membershipSql, [created_by, class_id, created_by]);

    // Return the created class with full details
    const createdSql = `
      SELECT c.*, u.username as created_by_username
      FROM classes c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.class_id = ?
    `;
    const [newClass] = await db.query(createdSql, [class_id]);

    return {
      ...newClass,
      display_id: formatClassIdForDisplay(class_id),
      id_format: 'new_standard',
      tags: newClass.tags ? newClass.tags.split(',') : [],
      prerequisites: newClass.prerequisites ? newClass.prerequisites.split(',') : [],
      learning_objectives: newClass.learning_objectives ? newClass.learning_objectives.split(',') : [],
      class_schedule: newClass.class_schedule ? JSON.parse(newClass.class_schedule) : null
    };

  } catch (error) {
    console.error('❌ createClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to create class', 500);
  }
};

/**
 * Update class with enhanced field support (ENHANCED VERSION)
 */
export const updateClassService = async (classId, updateData, adminId) => {
  try {
    // Validate class ID format
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    // Check if class exists (OTU# format only)
    const existingSql = 'SELECT * FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
    const [existing] = await db.query(existingSql, [classId]);
    
    if (!existing) {
      throw new CustomError('Class not found or invalid format', 404);
    }

    // Enhanced allowed fields
    const allowedFields = [
      'class_name', 'public_name', 'description', 'class_type',
      'is_public', 'max_members', 'privacy_level', 'is_active',
      'tags', 'category', 'difficulty_level', 'estimated_duration',
      'prerequisites', 'learning_objectives', 'auto_approve_members',
      'allow_self_join', 'require_approval', 'enable_notifications',
      'enable_discussions', 'enable_assignments', 'enable_grading',
      'class_schedule', 'timezone', 'requirements', 'instructor_notes'
    ];
    
    const updateFields = [];
    const params = [];
    
    Object.keys(updateData).forEach(field => {
      if (allowedFields.includes(field) && updateData[field] !== undefined) {
        // Process special fields
        if (field === 'tags' && Array.isArray(updateData[field])) {
          updateFields.push(`${field} = ?`);
          params.push(updateData[field].join(','));
        } else if (field === 'prerequisites' && Array.isArray(updateData[field])) {
          updateFields.push(`${field} = ?`);
          params.push(updateData[field].join(','));
        } else if (field === 'learning_objectives' && Array.isArray(updateData[field])) {
          updateFields.push(`${field} = ?`);
          params.push(updateData[field].join(','));
        } else if (field === 'class_schedule' && typeof updateData[field] === 'object') {
          updateFields.push(`${field} = ?`);
          params.push(JSON.stringify(updateData[field]));
        } else if (['is_public', 'auto_approve_members', 'allow_self_join', 'require_approval', 'enable_notifications', 'enable_discussions', 'enable_assignments', 'enable_grading', 'is_active'].includes(field)) {
          updateFields.push(`${field} = ?`);
          params.push(Boolean(updateData[field]));
        } else if (['max_members', 'estimated_duration'].includes(field)) {
          updateFields.push(`${field} = ?`);
          params.push(parseInt(updateData[field]));
        } else {
          updateFields.push(`${field} = ?`);
          params.push(updateData[field]);
        }
      }
    });

    if (updateFields.length === 0) {
      throw new CustomError('No valid fields provided for update', 400);
    }

    // Add metadata
    updateFields.push('updatedAt = NOW()');
    updateFields.push('updated_by = ?');
    params.push(adminId);
    params.push(classId);

    const sql = `
      UPDATE classes 
      SET ${updateFields.join(', ')}
      WHERE class_id = ? AND class_id LIKE "OTU#%"
    `;

    await db.query(sql, params);

    // Return updated class
    const updatedSql = `
      SELECT c.*, u.username as created_by_username, updated_by_user.username as updated_by_username
      FROM classes c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN users updated_by_user ON c.updated_by = updated_by_user.id
      WHERE c.class_id = ?
    `;
    const [updatedClass] = await db.query(updatedSql, [classId]);

    return {
      ...updatedClass,
      display_id: formatClassIdForDisplay(classId),
      id_format: 'new_standard',
      tags: updatedClass.tags ? updatedClass.tags.split(',') : [],
      prerequisites: updatedClass.prerequisites ? updatedClass.prerequisites.split(',') : [],
      learning_objectives: updatedClass.learning_objectives ? updatedClass.learning_objectives.split(',') : [],
      class_schedule: updatedClass.class_schedule ? JSON.parse(updatedClass.class_schedule) : null
    };

  } catch (error) {
    console.error('❌ updateClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to update class', 500);
  }
};

// ===============================================
// MISSING SERVICES FROM ORIGINAL FILE
// ===============================================

/**
 * Archive class service (MISSING FROM ORIGINAL)
 */
export const archiveClassService = async (classId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { archived_by, archive_reason } = options;

    // Check if class exists
    const classSql = 'SELECT * FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
    const [classData] = await db.query(classSql, [classId]);
    
    if (!classData) {
      throw new CustomError('Class not found', 404);
    }

    // Archive the class
    const archiveSql = `
      UPDATE classes 
      SET is_active = 0, archived_at = NOW(), archived_by = ?, archive_reason = ?, updatedAt = NOW()
      WHERE class_id = ?
    `;
    await db.query(archiveSql, [archived_by, archive_reason, classId]);

    return {
      archived_class_id: classId,
      class_name: classData.class_name,
      display_id: formatClassIdForDisplay(classId),
      archived_by,
      archived_at: new Date().toISOString(),
      archive_reason
    };

  } catch (error) {
    console.error('❌ archiveClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to archive class', 500);
  }
};

/**
 * Restore class service (MISSING FROM ORIGINAL)
 */
export const restoreClassService = async (classId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { restore_members = true, restored_by } = options;

    // Check if class exists and is archived
    const classSql = 'SELECT * FROM classes WHERE class_id = ? AND is_active = 0 AND class_id LIKE "OTU#%"';
    const [classData] = await db.query(classSql, [classId]);
    
    if (!classData) {
      throw new CustomError('Archived class not found', 404);
    }

    // Restore the class
    const restoreSql = `
      UPDATE classes 
      SET is_active = 1, restored_at = NOW(), restored_by = ?, archived_at = NULL, archived_by = NULL, archive_reason = NULL, updatedAt = NOW()
      WHERE class_id = ?
    `;
    await db.query(restoreSql, [restored_by, classId]);

    // Optionally restore members
    if (restore_members) {
      const restoreMembersSql = `
        UPDATE user_class_memberships 
        SET membership_status = 'active', updatedAt = NOW()
        WHERE class_id = ? AND membership_status = 'expired'
      `;
      await db.query(restoreMembersSql, [classId]);
    }

    return {
      restored_class_id: classId,
      class_name: classData.class_name,
      display_id: formatClassIdForDisplay(classId),
      restored_by,
      restored_at: new Date().toISOString(),
      members_restored: restore_members
    };

  } catch (error) {
    console.error('❌ restoreClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to restore class', 500);
  }
};

/**
 * Duplicate class service (MISSING FROM ORIGINAL)
 */
export const duplicateClassService = async (classId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { 
      new_name, 
      copy_members = false, 
      copy_content = true, 
      copy_schedule = false,
      duplicated_by 
    } = options;

    // Get original class
    const originalSql = 'SELECT * FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
    const [original] = await db.query(originalSql, [classId]);
    
    if (!original) {
      throw new CustomError('Class not found', 404);
    }

    // Create duplicate class data
    const duplicateData = {
      ...original,
      class_id: undefined, // Will be generated
      class_name: new_name || `${original.class_name} (Copy)`,
      public_name: new_name || `${original.public_name} (Copy)`,
      created_by: duplicated_by,
      createdAt: undefined,
      updatedAt: undefined
    };

    // Remove fields that shouldn't be copied
    delete duplicateData.id;
    delete duplicateData.archived_at;
    delete duplicateData.archived_by;
    delete duplicateData.archive_reason;
    delete duplicateData.restored_at;
    delete duplicateData.restored_by;

    const newClass = await createClassService(duplicateData);

    // Copy content if requested
    if (copy_content) {
      const contentSql = `
        INSERT INTO class_content_access (content_id, content_type, class_id, access_level, createdAt)
        SELECT content_id, content_type, ?, access_level, NOW()
        FROM class_content_access
        WHERE class_id = ?
      `;
      await db.query(contentSql, [newClass.class_id, classId]);
    }

    // Copy members if requested
    if (copy_members) {
      const membersSql = `
        INSERT INTO user_class_memberships (user_id, class_id, role_in_class, membership_status, joinedAt, receive_notifications, can_see_class_name, createdAt, updatedAt)
        SELECT user_id, ?, role_in_class, membership_status, NOW(), receive_notifications, can_see_class_name, NOW(), NOW()
        FROM user_class_memberships
        WHERE class_id = ? AND membership_status = 'active'
      `;
      await db.query(membersSql, [newClass.class_id, classId]);
    }

    return {
      original_class_id: classId,
      new_class_id: newClass.class_id,
      new_class_name: newClass.class_name,
      display_id: formatClassIdForDisplay(newClass.class_id),
      duplicated_by,
      duplicated_at: new Date().toISOString(),
      copied_features: {
        content: copy_content,
        members: copy_members,
        schedule: copy_schedule
      }
    };

  } catch (error) {
    console.error('❌ duplicateClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to duplicate class', 500);
  }
};













// ikootaapi/services/classAdminServices.js
// ADMIN CLASS MANAGEMENT SERVICES - NEW OTU# FORMAT ONLY
// Strictly uses OTU#XXXXXX format for all class operations

// ===============================================
// ID FORMAT VALIDATION (NEW FORMAT ONLY)
// ===============================================

// const formatClassIdForDisplay = (classId) => {
//   if (classId === 'OTU#Public') return 'Public Community';
//   return `Class ${classId}`;
// };

// ===============================================
// CLASS MANAGEMENT SERVICES (OTU# FORMAT ONLY)
// ===============================================

/**
 * Get comprehensive class management data for admin (OTU# format only)
 */
// export const getClassManagementService = async (filters = {}, options = {}) => {
//   try {
//     const { type, is_active, search } = filters;
//     const { 
//       page = 1, 
//       limit = 20, 
//       sort_by = 'createdAt', 
//       sort_order = 'DESC',
//       include_stats = true 
//     } = options;
//     const offset = (page - 1) * limit;

//     let whereClause = 'WHERE c.class_id LIKE "OTU#%"'; // Only OTU# format classes
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
//       whereClause += ' AND (c.class_name LIKE ? OR c.public_name LIKE ? OR c.description LIKE ?)';
//       const searchTerm = `%${search}%`;
//       params.push(searchTerm, searchTerm, searchTerm);
//     }

//     // Get total count
//     const countSql = `SELECT COUNT(*) as total FROM classes c ${whereClause}`;
//     const [{ total }] = await db.query(countSql, params);

//     // Get classes with comprehensive admin info
//     const sql = `
//       SELECT 
//         c.*,
//         u.username as created_by_username,
//         COALESCE(cm.total_members, 0) as total_members,
//         COALESCE(cm.moderators, 0) as moderators,
//         COALESCE(cm.pending_members, 0) as pending_members,
//         ${include_stats ? `
//         (SELECT COUNT(*) FROM class_content_access WHERE class_id = c.class_id) as content_count,
//         DATEDIFF(NOW(), c.createdAt) as days_since_creation
//         ` : '0 as content_count, 0 as days_since_creation'}
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

//     // Add display formatting
//     const formattedClasses = classes.map(cls => ({
//       ...cls,
//       display_id: formatClassIdForDisplay(cls.class_id),
//       id_format: 'new_standard'
//     }));

//     // Get summary statistics if requested
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
//           AVG(max_members) as avg_max_capacity
//         FROM classes c
//         ${whereClause}
//       `;
//       [summary] = await db.query(summarySql, params.slice(0, -2)); // Remove limit/offset
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
//       summary
//     };

//   } catch (error) {
//     console.error('❌ getClassManagementService error:', error);
//     throw new CustomError('Failed to fetch class management data', 500);
//   }
// };

/**
 * Create a new class with OTU# format ID generation
 */
// export const createClassService = async (classData) => {
//   try {
//     let {
//       class_id,
//       class_name,
//       public_name,
//       description,
//       class_type = 'demographic',
//       is_public = false,
//       max_members = 50,
//       privacy_level = 'members_only',
//       created_by
//     } = classData;

//     // Validate required fields
//     if (!class_name) {
//       throw new CustomError('class_name is required', 400);
//     }

//     // Generate OTU# format ID if not provided
//     if (!class_id) {
//       class_id = await generateUniqueClassId(); // This generates OTU#XXXXXX format
//     } else {
//       // Validate provided class_id is in OTU# format
//       if (!validateClassIdFormat(class_id)) {
//         throw new CustomError('class_id must be in OTU#XXXXXX format', 400);
//       }

//       // Check if class_id already exists
//       const existingSql = 'SELECT class_id FROM classes WHERE class_id = ?';
//       const [existing] = await db.query(existingSql, [class_id]);
      
//       if (existing) {
//         throw new CustomError('Class ID already exists', 400);
//       }
//     }

//     // Validate class_type
//     const validTypes = ['demographic', 'subject', 'public', 'special'];
//     if (!validTypes.includes(class_type)) {
//       throw new CustomError(`Invalid class_type. Must be one of: ${validTypes.join(', ')}`, 400);
//     }

//     // Validate privacy_level
//     const validPrivacyLevels = ['public', 'members_only', 'admin_only'];
//     if (!validPrivacyLevels.includes(privacy_level)) {
//       throw new CustomError(`Invalid privacy_level. Must be one of: ${validPrivacyLevels.join(', ')}`, 400);
//     }

//     // Create the class
//     const sql = `
//       INSERT INTO classes (
//         class_id, class_name, public_name, description, class_type,
//         is_public, max_members, privacy_level, created_by, is_active,
//         createdAt, updatedAt
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
//     `;

//     await db.query(sql, [
//       class_id, class_name, public_name || class_name, description,
//       class_type, is_public, max_members, privacy_level, created_by
//     ]);

//     // Return the created class
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
//       id_format: 'new_standard'
//     };

//   } catch (error) {
//     console.error('❌ createClassService error:', error);
//     if (error instanceof CustomError) throw error;
//     throw new CustomError('Failed to create class', 500);
//   }
// };

/**
 * Update class with OTU# format validation
 */
// export const updateClassService = async (classId, updateData, adminId) => {
//   try {
//     // Validate class ID format
//     if (!validateClassIdFormat(classId)) {
//       throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
//     }

//     // Check if class exists (OTU# format only)
//     const existingSql = 'SELECT * FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
//     const [existing] = await db.query(existingSql, [classId]);
    
//     if (!existing) {
//       throw new CustomError('Class not found or invalid format', 404);
//     }

//     // Build dynamic update query
//     const allowedFields = [
//       'class_name', 'public_name', 'description', 'class_type',
//       'is_public', 'max_members', 'privacy_level', 'is_active'
//     ];
    
//     const updateFields = [];
//     const params = [];
    
//     Object.keys(updateData).forEach(field => {
//       if (allowedFields.includes(field) && updateData[field] !== undefined) {
//         updateFields.push(`${field} = ?`);
//         params.push(updateData[field]);
//       }
//     });

//     if (updateFields.length === 0) {
//       throw new CustomError('No valid fields provided for update', 400);
//     }

//     // Add updatedAt
//     updateFields.push('updatedAt = NOW()');
//     params.push(classId);

//     const sql = `
//       UPDATE classes 
//       SET ${updateFields.join(', ')}
//       WHERE class_id = ? AND class_id LIKE "OTU#%"
//     `;

//     await db.query(sql, params);

//     // Return updated class
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
//       id_format: 'new_standard'
//     };

//   } catch (error) {
//     console.error('❌ updateClassService error:', error);
//     if (error instanceof CustomError) throw error;
//     throw new CustomError('Failed to update class', 500);
//   }
// };

/**
 * Delete class with OTU# format validation
 */
export const deleteClassService = async (classId, options = {}) => {
  try {
    const { force = false, transfer_members_to, deleted_by } = options;

    // Validate class ID format
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    // Validate transfer target format if provided
    if (transfer_members_to && !validateClassIdFormat(transfer_members_to)) {
      throw new CustomError('Invalid transfer target class ID format. Expected OTU#XXXXXX format', 400);
    }

    // Check if class exists (OTU# format only)
    const classSql = `
      SELECT c.*, 
        COALESCE(cm.total_members, 0) as member_count,
        (SELECT COUNT(*) FROM class_content_access WHERE class_id = c.class_id) as content_count
      FROM classes c
      LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
      WHERE c.class_id = ? AND c.class_id LIKE "OTU#%"
    `;
    const [classData] = await db.query(classSql, [classId]);
    
    if (!classData) {
      throw new CustomError('Class not found or invalid format', 404);
    }

    // Safety checks unless force is true
    if (!force) {
      if (classData.member_count > 0 && !transfer_members_to) {
        throw new CustomError(
          `Cannot delete class with ${classData.member_count} members. Use force=true or provide transfer_members_to.`, 
          400
        );
      }

      if (classData.content_count > 0) {
        throw new CustomError(
          `Cannot delete class with ${classData.content_count} content items. Use force=true to proceed.`, 
          400
        );
      }
    }

    // Transfer members if specified
    if (transfer_members_to && classData.member_count > 0) {
      // Verify target class exists and is OTU# format
      const targetSql = 'SELECT class_id FROM classes WHERE class_id = ? AND is_active = 1 AND class_id LIKE "OTU#%"';
      const [targetClass] = await db.query(targetSql, [transfer_members_to]);
      
      if (!targetClass) {
        throw new CustomError('Target class for member transfer not found, inactive, or invalid format', 400);
      }

      // Transfer members
      const transferSql = `
        UPDATE user_class_memberships 
        SET class_id = ?, updatedAt = NOW()
        WHERE class_id = ? AND membership_status = 'active'
      `;
      await db.query(transferSql, [transfer_members_to, classId]);
    } else if (force && classData.member_count > 0) {
      // Remove all memberships if force delete
      const removeMembersSql = `
        UPDATE user_class_memberships 
        SET membership_status = 'expired', updatedAt = NOW()
        WHERE class_id = ?
      `;
      await db.query(removeMembersSql, [classId]);
    }

    // Remove content associations if force delete
    if (force && classData.content_count > 0) {
      const removeContentSql = 'DELETE FROM class_content_access WHERE class_id = ?';
      await db.query(removeContentSql, [classId]);
    }

    // Delete the class
    const deleteSql = 'DELETE FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
    await db.query(deleteSql, [classId]);

    return {
      deleted_class_id: classId,
      deleted_class_name: classData.class_name,
      display_id: formatClassIdForDisplay(classId),
      members_affected: classData.member_count,
      content_items_affected: classData.content_count,
      members_transferred_to: transfer_members_to || null,
      force_delete: force,
      deleted_by,
      deleted_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ deleteClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to delete class', 500);
  }
};

// ===============================================
// PARTICIPANT MANAGEMENT SERVICES
// ===============================================

/**
 * Manage class participants (OTU# format validation)
 */
export const manageClassParticipantsService = async (classId, filters = {}, options = {}) => {
  try {
    // Validate class ID format
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { role_in_class, membership_status, search } = filters;
    const { 
      page = 1, 
      limit = 50, 
      sort_by = 'joinedAt', 
      sort_order = 'DESC' 
    } = options;
    const offset = (page - 1) * limit;

    // Verify class exists (OTU# format only)
    const classSql = 'SELECT class_id, class_name FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
    const [classData] = await db.query(classSql, [classId]);
    
    if (!classData) {
      throw new CustomError('Class not found or invalid format', 404);
    }

    let whereClause = 'WHERE ucm.class_id = ?';
    const params = [classId];

    if (role_in_class) {
      whereClause += ' AND ucm.role_in_class = ?';
      params.push(role_in_class);
    }

    if (membership_status) {
      whereClause += ' AND ucm.membership_status = ?';
      params.push(membership_status);
    }

    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.converse_id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM user_class_memberships ucm 
      INNER JOIN users u ON ucm.user_id = u.id 
      ${whereClause}
    `;
    const [{ total }] = await db.query(countSql, params);

    // Get participants with full admin details
    const sql = `
      SELECT 
        ucm.*,
        u.username,
        u.email,
        u.converse_id,
        u.membership_stage,
        u.full_membership_status,
        u.role as user_role,
        assigned_by_user.username as assigned_by_username
      FROM user_class_memberships ucm
      INNER JOIN users u ON ucm.user_id = u.id
      LEFT JOIN users assigned_by_user ON ucm.assigned_by = assigned_by_user.id
      ${whereClause}
      ORDER BY ucm.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const participants = await db.query(sql, params);

    // Get summary statistics
    const summarySql = `
      SELECT 
        COUNT(*) as total_participants,
        SUM(CASE WHEN ucm.membership_status = 'active' THEN 1 ELSE 0 END) as active_members,
        SUM(CASE WHEN ucm.membership_status = 'pending' THEN 1 ELSE 0 END) as pending_members,
        SUM(CASE WHEN ucm.role_in_class = 'moderator' THEN 1 ELSE 0 END) as moderators,
        SUM(CASE WHEN ucm.role_in_class = 'assistant' THEN 1 ELSE 0 END) as assistants,
        SUM(CASE WHEN ucm.role_in_class = 'member' THEN 1 ELSE 0 END) as regular_members
      FROM user_class_memberships ucm
      WHERE ucm.class_id = ?
    `;
    const [summary] = await db.query(summarySql, [classId]);

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
      summary,
      class_info: {
        ...classData,
        display_id: formatClassIdForDisplay(classId)
      }
    };

  } catch (error) {
    console.error('❌ manageClassParticipantsService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to fetch class participants', 500);
  }
};

/**
 * Add participant to class with admin privileges (OTU# format validation)
 */

export const addParticipantToClassService = async (classId, participantData) => {
  try {
    // Validate class ID format
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const {
      user_id,
      role_in_class = 'member',
      receive_notifications = true,
      expires_at,
      can_see_class_name = true,
      assigned_by
    } = participantData;

    // Verify class exists and get capacity info (OTU# format only)
    const classSql = `
      SELECT c.*, COALESCE(cm.total_members, 0) as current_members
      FROM classes c
      LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
      WHERE c.class_id = ? AND c.is_active = 1 AND c.class_id LIKE "OTU#%"
    `;
    const [classData] = await db.query(classSql, [classId]);
    
    if (!classData) {
      throw new CustomError('Class not found, inactive, or invalid format', 404);
    }

    // Verify user exists
    const userSql = 'SELECT id, username, email FROM users WHERE id = ?';
    const [userData] = await db.query(userSql, [user_id]);
    
    if (!userData) {
      throw new CustomError('User not found', 404);
    }

    // Check if user is already a member
    const existingSql = `
      SELECT membership_status 
      FROM user_class_memberships 
      WHERE user_id = ? AND class_id = ?
    `;
    const [existing] = await db.query(existingSql, [user_id, classId]);

    if (existing && existing.membership_status === 'active') {
      throw new CustomError('User is already an active member of this class', 400);
    }

    // Check capacity (admin can override but warn)
    const isOverCapacity = classData.current_members >= classData.max_members;

    // Add/update membership
    const sql = `
      INSERT INTO user_class_memberships (
        user_id, class_id, membership_status, role_in_class,
        assigned_by, receive_notifications, expiresAt, 
        can_see_class_name, joinedAt, createdAt, updatedAt
      ) VALUES (?, ?, 'active', ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        membership_status = 'active',
        role_in_class = VALUES(role_in_class),
        assigned_by = VALUES(assigned_by),
        receive_notifications = VALUES(receive_notifications),
        expiresAt = VALUES(expiresAt),
        can_see_class_name = VALUES(can_see_class_name),
        updatedAt = NOW()
    `;

    await db.query(sql, [
      user_id, classId, role_in_class, assigned_by,
      receive_notifications, expires_at, can_see_class_name
    ]);

    return {
      user_id,
      username: userData.username,
      email: userData.email,
      class_id: classId,
      class_name: classData.class_name,
      display_id: formatClassIdForDisplay(classId),
      membership_status: 'active',
      role_in_class,
      assigned_by,
      capacity_warning: isOverCapacity ? 'Class is now over capacity' : null,
      added_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ addParticipantToClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to add participant to class', 500);
  }
};

/**
 * Remove participant from class (OTU# format validation)
 */
export const removeParticipantFromClassService = async (classId, userId, options = {}) => {
  try {
    // Validate class ID format
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { reason, notify_user = true, removed_by } = options;

    // Verify membership exists
    const membershipSql = `
      SELECT ucm.*, u.username, u.email, c.class_name
      FROM user_class_memberships ucm
      INNER JOIN users u ON ucm.user_id = u.id
      INNER JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND c.class_id LIKE "OTU#%"
    `;
    const [membership] = await db.query(membershipSql, [userId, classId]);

    if (!membership) {
      throw new CustomError('User is not a member of this class or class has invalid format', 404);
    }

    // Remove membership
    const removeSql = `
      UPDATE user_class_memberships 
      SET membership_status = 'expired', updatedAt = NOW()
      WHERE user_id = ? AND class_id = ?
    `;
    await db.query(removeSql, [userId, classId]);

    // Log removal reason if provided
    if (reason) {
      console.log(`User ${userId} removed from class ${classId} by admin ${removed_by}. Reason: ${reason}`);
    }

    return {
      user_id: userId,
      username: membership.username,
      class_id: classId,
      class_name: membership.class_name,
      display_id: formatClassIdForDisplay(classId),
      previous_status: membership.membership_status,
      previous_role: membership.role_in_class,
      removal_reason: reason,
      removed_by,
      removed_at: new Date().toISOString(),
      notify_user
    };

  } catch (error) {
    console.error('❌ removeParticipantFromClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to remove participant from class', 500);
  }
};

/**
 * Get detailed enrollment statistics for a class (OTU# format validation)
 */
export const getClassEnrollmentStatsService = async (classId, options = {}) => {
  try {
    // Validate class ID format
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { period = '30d', breakdown = 'daily' } = options;

    // Verify class exists (OTU# format only)
    const classSql = 'SELECT class_id, class_name FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
    const [classData] = await db.query(classSql, [classId]);
    
    if (!classData) {
      throw new CustomError('Class not found or invalid format', 404);
    }

    // Parse period
    let days = 30;
    if (period.endsWith('d')) {
      days = parseInt(period.slice(0, -1));
    } else if (period.endsWith('m')) {
      days = parseInt(period.slice(0, -1)) * 30;
    }

    // Get enrollment trends
    const trendSql = `
      SELECT 
        DATE(joinedAt) as date,
        COUNT(*) as new_enrollments,
        SUM(CASE WHEN role_in_class = 'moderator' THEN 1 ELSE 0 END) as new_moderators
      FROM user_class_memberships 
      WHERE class_id = ? 
        AND joinedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(joinedAt)
      ORDER BY date DESC
    `;
    const trends = await db.query(trendSql, [classId, days]);

    // Get current status breakdown
    const statusSql = `
      SELECT 
        membership_status,
        role_in_class,
        COUNT(*) as count
      FROM user_class_memberships 
      WHERE class_id = ?
      GROUP BY membership_status, role_in_class
    `;
    const statusBreakdown = await db.query(statusSql, [classId]);

    // Get capacity info
    const capacitySql = `
      SELECT 
        c.max_members,
        COALESCE(cm.total_members, 0) as current_members,
        COALESCE(cm.pending_members, 0) as pending_members
      FROM classes c
      LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
      WHERE c.class_id = ?
    `;
    const [capacity] = await db.query(capacitySql, [classId]);

    return {
      class_id: classId,
      class_name: classData.class_name,
      display_id: formatClassIdForDisplay(classId),
      period: `${days} days`,
      enrollment_trends: trends,
      status_breakdown: statusBreakdown,
      capacity_info: {
        max_members: capacity.max_members,
        current_members: capacity.current_members,
        pending_members: capacity.pending_members,
        available_spots: capacity.max_members - capacity.current_members,
        utilization_percentage: Math.round((capacity.current_members / capacity.max_members) * 100)
      }
    };

  } catch (error) {
    console.error('❌ getClassEnrollmentStatsService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to fetch enrollment statistics', 500);
  }
};

// ===============================================
// CLASS CONTENT MANAGEMENT SERVICES
// ===============================================

/**
 * Get class content for admin management (OTU# format validation)
 */
export const manageClassContentService = async (classId, filters = {}, options = {}) => {
  try {
    // Validate class ID format
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { content_type, access_level, search } = filters;
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    // Verify class exists (OTU# format only)
    const classSql = 'SELECT class_id, class_name FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
    const [classData] = await db.query(classSql, [classId]);
    
    if (!classData) {
      throw new CustomError('Class not found or invalid format', 404);
    }

    let whereClause = 'WHERE cca.class_id = ?';
    const params = [classId];

    if (content_type) {
      whereClause += ' AND cca.content_type = ?';
      params.push(content_type);
    }

    if (access_level) {
      whereClause += ' AND cca.access_level = ?';
      params.push(access_level);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM class_content_access cca ${whereClause}`;
    const [{ total }] = await db.query(countSql, params);

    // Get content with details
    const sql = `
      SELECT 
        cca.*,
        CASE 
          WHEN cca.content_type = 'chat' THEN 
            (SELECT JSON_OBJECT(
              'id', c.id, 'title', c.title, 'summary', c.summary, 
              'approval_status', c.approval_status, 'createdAt', c.createdAt,
              'user_id', c.user_id
            ) FROM chats c WHERE c.id = cca.content_id)
          WHEN cca.content_type = 'teaching' THEN 
            (SELECT JSON_OBJECT(
              'id', t.id, 'topic', t.topic, 'description', t.description,
              'approval_status', t.approval_status, 'createdAt', t.createdAt,
              'user_id', t.user_id
            ) FROM teachings t WHERE t.id = cca.content_id)
          ELSE JSON_OBJECT('id', cca.content_id, 'type', cca.content_type)
        END as content_details
      FROM class_content_access cca
      ${whereClause}
      ORDER BY cca.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const content = await db.query(sql, params);

    // Get summary statistics
    const summarySql = `
      SELECT 
        content_type,
        access_level,
        COUNT(*) as count
      FROM class_content_access 
      WHERE class_id = ?
      GROUP BY content_type, access_level
    `;
    const summary = await db.query(summarySql, [classId]);

    return {
      data: content,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: limit,
        has_next: page < Math.ceil(total / limit),
        has_previous: page > 1
      },
      summary,
      class_info: {
        ...classData,
        display_id: formatClassIdForDisplay(classId)
      }
    };

  } catch (error) {
    console.error('❌ manageClassContentService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to fetch class content', 500);
  }
};


/**
 * Add content to class (OTU# format validation)
 */


export const addClassContentService = async (classId, contentData) => {
  try {
    // Validate class ID format
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { content_id, content_type, access_level = 'read' } = contentData;

    // Verify class exists (OTU# format only)
    const classSql = 'SELECT class_id, class_name FROM classes WHERE class_id = ? AND is_active = 1 AND class_id LIKE "OTU#%"';
    const [classData] = await db.query(classSql, [classId]);
    
    if (!classData) {
      throw new CustomError('Class not found, inactive, or invalid format', 404);
    }

    // Verify content exists based on type
    let contentExists = false;
    let contentInfo = null;

    if (content_type === 'chat') {
      const [chat] = await db.query('SELECT id, title FROM chats WHERE id = ?', [content_id]);
      if (chat) {
        contentExists = true;
        contentInfo = { id: chat.id, title: chat.title, type: 'chat' };
      }
    } else if (content_type === 'teaching') {
      const [teaching] = await db.query('SELECT id, topic FROM teachings WHERE id = ?', [content_id]);
      if (teaching) {
        contentExists = true;
        contentInfo = { id: teaching.id, title: teaching.topic, type: 'teaching' };
      }
    } else if (content_type === 'announcement') {
      // Would need announcements table
      contentExists = true;
      contentInfo = { id: content_id, title: 'Announcement', type: 'announcement' };
    }

    if (!contentExists) {
      throw new CustomError(`${content_type} with ID ${content_id} not found`, 404);
    }

    // Check if content is already associated with class
    const existingSql = `
      SELECT id FROM class_content_access 
      WHERE content_id = ? AND content_type = ? AND class_id = ?
    `;
    const [existing] = await db.query(existingSql, [content_id, content_type, classId]);

    if (existing) {
      throw new CustomError('Content is already associated with this class', 400);
    }

    // Add content to class
    const sql = `
      INSERT INTO class_content_access (
        content_id, content_type, class_id, access_level, createdAt
      ) VALUES (?, ?, ?, ?, NOW())
    `;
    await db.query(sql, [content_id, content_type, classId, access_level]);

    return {
      class_id: classId,
      class_name: classData.class_name,
      display_id: formatClassIdForDisplay(classId),
      content_id,
      content_type,
      content_info: contentInfo,
      access_level,
      added_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ addClassContentService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to add content to class', 500);
  }
};

/**
 * Update class content access level (OTU# format validation)
 */
export const updateClassContentService = async (classId, contentId, updateData) => {
  try {
    // Validate class ID format
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { access_level } = updateData;

    // Verify association exists
    const existingSql = `
      SELECT * FROM class_content_access 
      WHERE content_id = ? AND class_id = ?
    `;
    const [existing] = await db.query(existingSql, [contentId, classId]);

    if (!existing) {
      throw new CustomError('Content is not associated with this class', 404);
    }

    // Update access level
    const sql = `
      UPDATE class_content_access 
      SET access_level = ?
      WHERE content_id = ? AND class_id = ?
    `;
    await db.query(sql, [access_level, contentId, classId]);

    return {
      class_id: classId,
      display_id: formatClassIdForDisplay(classId),
      content_id: contentId,
      content_type: existing.content_type,
      previous_access_level: existing.access_level,
      new_access_level: access_level,
      updated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ updateClassContentService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to update class content', 500);
  }
};

/**
 * Remove content from class (OTU# format validation)
 */
export const deleteClassContentService = async (classId, contentId) => {
  try {
    // Validate class ID format
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    // Verify association exists
    const existingSql = `
      SELECT * FROM class_content_access 
      WHERE content_id = ? AND class_id = ?
    `;
    const [existing] = await db.query(existingSql, [contentId, classId]);

    if (!existing) {
      throw new CustomError('Content is not associated with this class', 404);
    }

    // Remove association
    const sql = `
      DELETE FROM class_content_access 
      WHERE content_id = ? AND class_id = ?
    `;
    await db.query(sql, [contentId, classId]);

    return {
      class_id: classId,
      display_id: formatClassIdForDisplay(classId),
      content_id: contentId,
      content_type: existing.content_type,
      access_level: existing.access_level,
      removed_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ deleteClassContentService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to remove content from class', 500);
  }
};

// ===============================================
// ANALYTICS & REPORTING SERVICES
// ===============================================

/**
 * Get comprehensive class analytics (OTU# format only)
 */
export const getClassAnalyticsService = async (options = {}) => {
  try {
    const {
      period = '30d',
      class_type,
      include_inactive = false,
      breakdown = 'daily',
      class_id
    } = options;

    // Parse period
    let days = 30;
    if (period.endsWith('d')) {
      days = parseInt(period.slice(0, -1));
    } else if (period.endsWith('m')) {
      days = parseInt(period.slice(0, -1)) * 30;
    }

    let whereClause = 'WHERE c.class_id LIKE "OTU#%"'; // Only OTU# format classes
    const params = [];

    if (class_id) {
      // Validate class ID format if provided
      if (!validateClassIdFormat(class_id)) {
        throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
      }
      whereClause += ' AND c.class_id = ?';
      params.push(class_id);
    }

    if (class_type) {
      whereClause += ' AND c.class_type = ?';
      params.push(class_type);
    }

    if (!include_inactive) {
      whereClause += ' AND c.is_active = 1';
    }

    // Overall statistics
    const overallSql = `
      SELECT 
        COUNT(*) as total_classes,
        SUM(CASE WHEN c.is_active = 1 THEN 1 ELSE 0 END) as active_classes,
        AVG(COALESCE(cm.total_members, 0)) as avg_members_per_class,
        SUM(COALESCE(cm.total_members, 0)) as total_members,
        AVG(c.max_members) as avg_capacity,
        SUM(CASE WHEN COALESCE(cm.total_members, 0) >= c.max_members THEN 1 ELSE 0 END) as classes_at_capacity
      FROM classes c
      LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
      ${whereClause}
    `;
    const [overallStats] = await db.query(overallSql, params);

    // Growth trends
    const trendSql = `
      SELECT 
        DATE(c.createdAt) as date,
        COUNT(*) as classes_created,
        c.class_type
      FROM classes c
      ${whereClause} AND c.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(c.createdAt), c.class_type
      ORDER BY date DESC
    `;
    const trends = await db.query(trendSql, [...params, days]);

    // Enrollment trends
    const enrollmentSql = `
      SELECT 
        DATE(ucm.joinedAt) as date,
        COUNT(*) as new_enrollments,
        AVG(DATEDIFF(NOW(), ucm.joinedAt)) as avg_membership_duration_days
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      ${whereClause.replace('WHERE c.class_id LIKE "OTU#%"', 'WHERE ucm.joinedAt >= DATE_SUB(NOW(), INTERVAL ? DAY) AND c.class_id LIKE "OTU#%"')}
      GROUP BY DATE(ucm.joinedAt)
      ORDER BY date DESC
    `;
    const enrollmentTrends = await db.query(enrollmentSql, [days, ...params]);

    // Class type breakdown
    const typeSql = `
      SELECT 
        c.class_type,
        COUNT(*) as count,
        SUM(COALESCE(cm.total_members, 0)) as total_members,
        AVG(COALESCE(cm.total_members, 0)) as avg_members,
        SUM(CASE WHEN c.is_active = 1 THEN 1 ELSE 0 END) as active_count
      FROM classes c
      LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
      ${whereClause}
      GROUP BY c.class_type
    `;
    const typeBreakdown = await db.query(typeSql, params);

    return {
      period: `${days} days`,
      overall_statistics: overallStats,
      growth_trends: trends,
      enrollment_trends: enrollmentTrends,
      class_type_breakdown: typeBreakdown,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ getClassAnalyticsService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to fetch class analytics', 500);
  }
};

/**
 * Get class statistics summary (OTU# format only)
 */
export const getClassStatsService = async (options = {}) => {
  try {
    const {
      summary = true,
      by_type = true,
      by_status = true,
      recent_activity = true
    } = options;

    const stats = {};

    if (summary) {
      const summarySql = `
        SELECT 
          COUNT(*) as total_classes,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_classes,
          SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_classes,
          AVG(max_members) as avg_max_capacity,
          (SELECT SUM(COALESCE(total_members, 0)) FROM class_member_counts) as total_enrollments
        FROM classes
        WHERE class_id LIKE "OTU#%"
      `;
      const [summaryData] = await db.query(summarySql);
      stats.summary = summaryData;
    }

    if (by_type) {
      const typeSql = `
        SELECT 
          class_type,
          COUNT(*) as count,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
        FROM classes
        WHERE class_id LIKE "OTU#%"
        GROUP BY class_type
      `;
      stats.by_type = await db.query(typeSql);
    }

    if (by_status) {
      const statusSql = `
        SELECT 
          CASE 
            WHEN is_active = 1 THEN 'active'
            ELSE 'inactive'
          END as status,
          COUNT(*) as count
        FROM classes
        WHERE class_id LIKE "OTU#%"
        GROUP BY is_active
      `;
      stats.by_status = await db.query(statusSql);
    }

    if (recent_activity) {
      const activitySql = `
        SELECT 
          'class_created' as activity_type,
          COUNT(*) as count,
          DATE(MAX(createdAt)) as latest_date
        FROM classes 
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND class_id LIKE "OTU#%"
        UNION ALL
        SELECT 
          'new_enrollment' as activity_type,
          COUNT(*) as count,
          DATE(MAX(ucm.joinedAt)) as latest_date
        FROM user_class_memberships ucm
        INNER JOIN classes c ON ucm.class_id = c.class_id
        WHERE ucm.joinedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND c.class_id LIKE "OTU#%"
      `;
      stats.recent_activity = await db.query(activitySql);
    }

    return stats;

  } catch (error) {
    console.error('❌ getClassStatsService error:', error);
    throw new CustomError('Failed to fetch class statistics', 500);
  }
};

/**
 * Export class data in various formats (OTU# format only)
 */
export const exportClassDataService = async (options = {}) => {
  try {
    const {
      format = 'csv',
      include_participants = true,
      include_content = false,
      date_from,
      date_to,
      class_type,
      export_type = 'classes'
    } = options;

    let data = [];
    
    if (export_type === 'classes') {
      let whereClause = 'WHERE c.class_id LIKE "OTU#%"'; // Only OTU# format classes
      const params = [];

      if (date_from) {
        whereClause += ' AND c.createdAt >= ?';
        params.push(date_from);
      }

      if (date_to) {
        whereClause += ' AND c.createdAt <= ?';
        params.push(date_to);
      }

      if (class_type) {
        whereClause += ' AND c.class_type = ?';
        params.push(class_type);
      }

      const sql = `
        SELECT 
          c.*,
          u.username as created_by_username,
          COALESCE(cm.total_members, 0) as current_members,
          COALESCE(cm.moderators, 0) as moderator_count
        FROM classes c
        LEFT JOIN users u ON c.created_by = u.id
        LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
        ${whereClause}
        ORDER BY 
          CASE WHEN c.class_id = 'OTU#Public' THEN 0 ELSE 1 END,
          c.createdAt DESC
      `;

      data = await db.query(sql, params);

    } else if (export_type === 'participants' && include_participants) {
      const participantsSql = `
        SELECT 
          ucm.*,
          u.username,
          u.email,
          u.converse_id,
          u.membership_stage,
          u.full_membership_status,
          c.class_name,
          c.class_type
        FROM user_class_memberships ucm
        INNER JOIN users u ON ucm.user_id = u.id
        INNER JOIN classes c ON ucm.class_id = c.class_id
        WHERE ucm.joinedAt >= COALESCE(?, '1970-01-01')
          AND ucm.joinedAt <= COALESCE(?, NOW())
          AND c.class_id LIKE "OTU#%"
        ORDER BY ucm.joinedAt DESC
      `;
      
      data = await db.query(participantsSql, [date_from, date_to]);

    } else if (export_type === 'analytics') {
      const analyticsSql = `
        SELECT 
          c.class_id,
          c.class_name,
          c.class_type,
          c.is_public,
          c.max_members,
          c.createdAt,
          COALESCE(cm.total_members, 0) as current_members,
          COALESCE(cm.moderators, 0) as moderators,
          COALESCE(cm.pending_members, 0) as pending_members,
          (SELECT COUNT(*) FROM class_content_access WHERE class_id = c.class_id) as content_count,
          ROUND(COALESCE(cm.total_members, 0) / c.max_members * 100, 2) as utilization_percentage
        FROM classes c
        LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
        WHERE c.createdAt >= COALESCE(?, '1970-01-01')
          AND c.createdAt <= COALESCE(?, NOW())
          AND c.class_id LIKE "OTU#%"
        ORDER BY 
          CASE WHEN c.class_id = 'OTU#Public' THEN 0 ELSE 1 END,
          c.createdAt DESC
      `;
      
      data = await db.query(analyticsSql, [date_from, date_to]);
    }

    if (format === 'csv') {
      // Convert to CSV format
      if (data.length === 0) {
        return { data: 'No data available for the specified criteria', count: 0 };
      }

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      
      const csvData = [headers, ...rows].join('\n');
      return { data: csvData, count: data.length };
    }

    return { data, count: data.length };

  } catch (error) {
    console.error('❌ exportClassDataService error:', error);
    throw new CustomError('Failed to export class data', 500);
  }
};

// ===============================================
// CLASS CONFIGURATION SERVICES
// ===============================================

/**
 * Get system-wide class configuration
 */
export const getClassConfigurationService = async () => {
  try {
    // This would typically come from a configuration table
    // For now, return default configuration
    return {
      default_max_members: 50,
      default_privacy_level: 'members_only',
      allowed_class_types: ['demographic', 'subject', 'public', 'special'],
      auto_approve_joins: false,
      id_format: 'OTU#XXXXXX',
      notification_settings: {
        notify_on_join: true,
        notify_on_leave: false,
        notify_moderators: true
      },
      capacity_settings: {
        allow_over_capacity: false,
        over_capacity_threshold: 110, // percentage
        waitlist_enabled: false
      },
      content_settings: {
        max_content_per_class: 100,
        allowed_content_types: ['chat', 'teaching', 'announcement'],
        default_access_level: 'read'
      }
    };

  } catch (error) {
    console.error('❌ getClassConfigurationService error:', error);
    throw new CustomError('Failed to fetch class configuration', 500);
  }
};

/**
 * Update system-wide class configuration
 */
export const updateClassConfigurationService = async (configData, adminId) => {
  try {
    // This would typically update a configuration table
    // For now, just validate and return the updated config
    
    const allowedFields = [
      'default_max_members',
      'default_privacy_level', 
      'allowed_class_types',
      'auto_approve_joins',
      'notification_settings'
    ];

    const updatedConfig = {};
    
    Object.keys(configData).forEach(field => {
      if (allowedFields.includes(field)) {
        updatedConfig[field] = configData[field];
      }
    });

    if (Object.keys(updatedConfig).length === 0) {
      throw new CustomError('No valid configuration fields provided', 400);
    }

    // Validation
    if (updatedConfig.default_max_members && updatedConfig.default_max_members < 1) {
      throw new CustomError('default_max_members must be at least 1', 400);
    }

    if (updatedConfig.default_privacy_level) {
      const validLevels = ['public', 'members_only', 'admin_only'];
      if (!validLevels.includes(updatedConfig.default_privacy_level)) {
        throw new CustomError(`Invalid privacy level. Must be one of: ${validLevels.join(', ')}`, 400);
      }
    }

    // Log configuration change
    console.log(`Class configuration updated by admin ${adminId}:`, updatedConfig);

    return {
      ...await getClassConfigurationService(),
      ...updatedConfig,
      last_updated_by: adminId,
      last_updated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ updateClassConfigurationService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to update class configuration', 500);
  }
};

// ===============================================
// BULK OPERATIONS SERVICES
// ===============================================

/**
 * Bulk create multiple classes (OTU# format generation)
 */
export const bulkCreateClassesService = async (classesData, adminId) => {
  try {
    const results = {
      successful: [],
      failed: []
    };

    for (const classData of classesData) {
      try {
        // Generate OTU# format ID if not provided
        if (!classData.class_id) {
          classData.class_id = await generateUniqueClassId();
        } else {
          // Validate provided ID is OTU# format
          if (!validateClassIdFormat(classData.class_id)) {
            throw new Error('class_id must be in OTU#XXXXXX format');
          }
        }

        // Set creator
        classData.created_by = adminId;

        const newClass = await createClassService(classData);
        results.successful.push({
          class_id: newClass.class_id,
          class_name: newClass.class_name,
          display_id: formatClassIdForDisplay(newClass.class_id),
          status: 'created'
        });

      } catch (error) {
        results.failed.push({
          class_data: classData,
          error: error.message,
          status: 'failed'
        });
      }
    }

    return results;

  } catch (error) {
    console.error('❌ bulkCreateClassesService error:', error);
    throw new CustomError('Failed to bulk create classes', 500);
  }
};

/**
 * Bulk update multiple classes (OTU# format validation)
 */
export const bulkUpdateClassesService = async (classIds, updates, adminId) => {
  try {
    const results = {
      successful: [],
      failed: []
    };

    for (const classId of classIds) {
      try {
        // Validate class ID format
        if (!validateClassIdFormat(classId)) {
          throw new Error('class_id must be in OTU#XXXXXX format');
        }

        const updatedClass = await updateClassService(classId, updates, adminId);
        results.successful.push({
          class_id: classId,
          class_name: updatedClass.class_name,
          display_id: formatClassIdForDisplay(classId),
          status: 'updated'
        });

      } catch (error) {
        results.failed.push({
          class_id: classId,
          error: error.message,
          status: 'failed'
        });
      }
    }

    return results;

  } catch (error) {
    console.error('❌ bulkUpdateClassesService error:', error);
    throw new CustomError('Failed to bulk update classes', 500);
  }
};

/**
 * Bulk delete multiple classes (OTU# format validation)
 */
export const bulkDeleteClassesService = async (classIds, options = {}) => {
  try {
    const results = {
      successful: [],
      failed: []
    };

    for (const classId of classIds) {
      try {
        // Validate class ID format
        if (!validateClassIdFormat(classId)) {
          throw new Error('class_id must be in OTU#XXXXXX format');
        }

        const deleteResult = await deleteClassService(classId, options);
        results.successful.push({
          class_id: classId,
          class_name: deleteResult.deleted_class_name,
          display_id: formatClassIdForDisplay(classId),
          members_affected: deleteResult.members_affected,
          status: 'deleted'
        });

      } catch (error) {
        results.failed.push({
          class_id: classId,
          error: error.message,
          status: 'failed'
        });
      }
    }

    return results;

  } catch (error) {
    console.error('❌ bulkDeleteClassesService error:', error);
    throw new CustomError('Failed to bulk delete classes', 500);
  }
};



// ===============================================
// PLACEHOLDER STUB FUNCTIONS
// ===============================================
// These are placeholder functions to prevent import errors
// They should be implemented properly based on your requirements

// export const manageClassParticipantsService = async (...args) => {
//   throw new CustomError('manageClassParticipantsService not implemented yet', 501);
// };

// export const addParticipantToClassService = async (...args) => {
//   throw new CustomError('addParticipantToClassService not implemented yet', 501);
// };

// export const removeParticipantFromClassService = async (...args) => {
//   throw new CustomError('removeParticipantFromClassService not implemented yet', 501);
// };

// export const getClassEnrollmentStatsService = async (...args) => {
//   throw new CustomError('getClassEnrollmentStatsService not implemented yet', 501);
// };

// export const manageClassContentService = async (...args) => {
//   throw new CustomError('manageClassContentService not implemented yet', 501);
// };

// export const addClassContentService = async (...args) => {
//   throw new CustomError('addClassContentService not implemented yet', 501);
// };

// export const updateClassContentService = async (...args) => {
//   throw new CustomError('updateClassContentService not implemented yet', 501);
// };

// export const deleteClassContentService = async (...args) => {
//   throw new CustomError('deleteClassContentService not implemented yet', 501);
// };

// export const getClassAnalyticsService = async (...args) => {
//   throw new CustomError('getClassAnalyticsService not implemented yet', 501);
// };

// export const getClassStatsService = async (...args) => {
//   throw new CustomError('getClassStatsService not implemented yet', 501);
// };

// export const exportClassDataService = async (...args) => {
//   throw new CustomError('exportClassDataService not implemented yet', 501);
// };

// export const getClassConfigurationService = async (...args) => {
//   throw new CustomError('getClassConfigurationService not implemented yet', 501);
// };

// export const updateClassConfigurationService = async (...args) => {
//   throw new CustomError('updateClassConfigurationService not implemented yet', 501);
// };

// export const bulkCreateClassesService = async (...args) => {
//   throw new CustomError('bulkCreateClassesService not implemented yet', 501);
// };

// export const bulkUpdateClassesService = async (...args) => {
//   throw new CustomError('bulkUpdateClassesService not implemented yet', 501);
// };

// export const bulkDeleteClassesService = async (...args) => {
//   throw new CustomError('bulkDeleteClassesService not implemented yet', 501);
// };

// ===============================================
// MODULE METADATA
// ===============================================

export const moduleInfo = {
  name: 'Class Admin Services',
  version: '2.0.0',
  description: 'Administrative class management services with OTU# format support',
  supported_formats: ['OTU#XXXXXX'],
  features: [
    'comprehensive_class_management',
    'class_creation_and_updates',
    'class_archival_and_restoration',
    'class_duplication',
    'health_scoring'
  ],
  implemented_functions: [
    'getClassManagementService',
    'createClassService', 
    'updateClassService',
    'archiveClassService',
    'restoreClassService',
    'duplicateClassService',
    'calculateClassHealthScore'
  ],
  stub_functions: [
    // 'manageClassParticipantsService',
    // 'addParticipantToClassService',
    //'removeParticipantFromClassService',
    // 'getClassEnrollmentStatsService',
    // 'manageClassContentService',
    // 'addClassContentService',
    // 'updateClassContentService',
   // 'deleteClassContentService',
    //'getClassAnalyticsService',
   // 'getClassStatsService',
   // 'exportClassDataService',
   // 'getClassConfigurationService',
   // 'updateClassConfigurationService',
   // 'bulkCreateClassesService',
   // 'bulkUpdateClassesService',
    //'bulkDeleteClassesService'
  ],
  last_updated: new Date().toISOString()
};












// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Calculate class health score based on various metrics
 */
export const calculateClassHealthScore = (classData) => {
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
  if (classData.days_since_creation > 0) {
    const memberGrowthRate = (classData.total_members || 0) / classData.days_since_creation;
    if (memberGrowthRate > 1) score += 25;
    else if (memberGrowthRate > 0.5) score += 20;
    else if (memberGrowthRate > 0.1) score += 15;
    else if (memberGrowthRate > 0) score += 10;
  }

  // Content availability (20 points)
  if (classData.content_count > 10) score += 20;
  else if (classData.content_count > 5) score += 15;
  else if (classData.content_count > 0) score += 10;

  // Moderation (15 points)
  if ((classData.moderators || 0) >= 2) score += 15;
  else if ((classData.moderators || 0) >= 1) score += 10;

  // Completion (10 points)
  if (classData.description && classData.description.length > 50) score += 5;
  if (classData.tags && classData.tags.length > 0) score += 3;
  if (classData.difficulty_level) score += 2;

  return Math.min(score, maxScore);
};

// ===============================================
// EXPORT ALL EXISTING + NEW SERVICES
// ===============================================

// Export all services from the original file
// export {
//   // Original services (keeping all existing functionality)
//   manageClassParticipantsService,
//  addParticipantToClassService,
//   removeParticipantFromClassService,
//   getClassEnrollmentStatsService,
//   manageClassContentService,
//   addClassContentService,
//   updateClassContentService,
//   deleteClassContentService,
//   getClassAnalyticsService,
//   getClassStatsService,
//   exportClassDataService,
//   getClassConfigurationService,
//   updateClassConfigurationService,
//   bulkCreateClassesService,
//   bulkUpdateClassesService,
//  bulkDeleteClassesService
// };
