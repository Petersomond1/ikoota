// ikootaapi/services/classAdminServices.js
// ADMIN CLASS MANAGEMENT SERVICES - BUSINESS LOGIC LAYER
// All administrative database operations and business logic

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { generateUniqueClassId, validateIdFormat } from '../utils/idGenerator.js';

// ===============================================
// HELPER FUNCTIONS
// ===============================================

const validateClassIdFormat = (classId) => {
  if (!classId || typeof classId !== 'string') return false;
  if (classId === 'OTU#Public') return true;
  return validateIdFormat(classId, 'class');
};

// const validateClassIdFormat = (classId) => {
//   if (!classId || typeof classId !== 'string') return false;
//   if (classId === 'OTU#Public') return true;
//   return validateIdFormat(classId, 'class');
// };

/**
 * Validates class ID format - NEW FORMAT ONLY: OTU#XXXXXX
 */
//  const validateClassIdFormat = (classId) => {
//    if (!classId || typeof classId !== 'string') return false;
//   // Special case for public class
//   if (classId === 'OTU#Public') return true;
//   // Standard new format: OTU#XXXXXX (10 characters total)
//   return validateIdFormat(classId, 'class');
// };

const formatClassIdForDisplay = (classId) => {
  if (classId === 'OTU#Public') return 'Public Community';
  return `Class ${classId}`;
};

// const formatClassIdForDisplay = (classId) => {
//   if (classId === 'OTU#Public') return 'Public Community';
//   return `Class ${classId}`;
// };

/**
 * Formats class ID for display
 */
// const formatClassIdForDisplay = (classId) => {
//   if (classId === 'OTU#Public') return 'Public Community';
//   return `Class ${classId}`;
// };

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

// const calculateClassHealthScore = (classData) => {
//   let score = 0;
//   let maxScore = 100;

//   if (classData.max_members > 0) {
//     const utilization = (classData.total_members || 0) / classData.max_members;
//     if (utilization >= 0.7 && utilization <= 0.9) score += 30;
//     else if (utilization >= 0.5) score += 20;
//     else if (utilization >= 0.3) score += 10;
//   }

//   if (classData.days_since_creation > 0) {
//     const memberGrowthRate = (classData.total_members || 0) / classData.days_since_creation;
//     if (memberGrowthRate > 1) score += 25;
//     else if (memberGrowthRate > 0.5) score += 20;
//     else if (memberGrowthRate > 0.1) score += 15;
//     else if (memberGrowthRate > 0) score += 10;
//   }

//   if (classData.content_count > 10) score += 20;
//   else if (classData.content_count > 5) score += 15;
//   else if (classData.content_count > 0) score += 10;

//   if ((classData.moderators || 0) >= 2) score += 15;
//   else if ((classData.moderators || 0) >= 1) score += 10;

//   if (classData.description && classData.description.length > 50) score += 5;
//   if (classData.tags && classData.tags.length > 0) score += 3;
//   if (classData.difficulty_level) score += 2;

//   return Math.min(score, maxScore);
// };

// ===============================================
// CLASS MANAGEMENT SERVICES
// ===============================================

/**
 * Calculate class health score based on various metrics
 */
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

/**
 * Create a new class with enhanced options
 */
export const createClassService = async (classData, adminUserId) => {
  try {
    const {
      class_name,
      public_name,
      description,
      class_type = 'general',
      is_public = false,
      max_members = 50,
      privacy_level = 'members_only',
      requirements,
      instructor_notes,
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
      timezone = 'UTC'
    } = classData;

    if (!class_name || class_name.trim().length === 0) {
      throw new CustomError('Class name is required', 400);
    }

    const class_id = await generateUniqueClassId();

    const insertData = {
      class_id,
      class_name: class_name.trim(),
      public_name: (public_name || class_name).trim(),
      description,
      class_type,
      is_public: Boolean(is_public),
      max_members: parseInt(max_members),
      privacy_level,
      requirements,
      instructor_notes,
      tags: Array.isArray(tags) ? tags.join(',') : tags,
      category,
      difficulty_level,
      estimated_duration: estimated_duration ? parseInt(estimated_duration) : null,
      prerequisites: Array.isArray(prerequisites) ? prerequisites.join(',') : prerequisites,
      learning_objectives: Array.isArray(learning_objectives) ? learning_objectives.join(',') : learning_objectives,
      auto_approve_members: Boolean(auto_approve_members),
      allow_self_join: Boolean(allow_self_join),
      require_approval: Boolean(require_approval),
      enable_notifications: Boolean(enable_notifications),
      enable_discussions: Boolean(enable_discussions),
      enable_assignments: Boolean(enable_assignments),
      enable_grading: Boolean(enable_grading),
      class_schedule: class_schedule ? JSON.stringify(class_schedule) : null,
      timezone,
      created_by: adminUserId,
      is_active: 1
    };

    const sql = `
      INSERT INTO classes (
        class_id, class_name, public_name, description, class_type, is_public, 
        max_members, privacy_level, requirements, instructor_notes, tags, category,
        difficulty_level, estimated_duration, prerequisites, learning_objectives,
        auto_approve_members, allow_self_join, require_approval, enable_notifications,
        enable_discussions, enable_assignments, enable_grading, class_schedule, timezone,
        created_by, is_active, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await db.query(sql, Object.values(insertData));

    const membershipSql = `
      INSERT INTO user_class_memberships 
      (user_id, class_id, role_in_class, membership_status, joinedAt, assigned_by, receive_notifications, can_see_class_name, createdAt, updatedAt)
      VALUES (?, ?, 'moderator', 'active', NOW(), ?, 1, 1, NOW(), NOW())
    `;
    await db.query(membershipSql, [adminUserId, class_id, adminUserId]);

    console.log(`✅ Class ${class_id} (${class_name}) created by admin ${adminUserId}`);

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
      tags: newClass.tags ? newClass.tags.split(',') : [],
      prerequisites: newClass.prerequisites ? newClass.prerequisites.split(',') : [],
      learning_objectives: newClass.learning_objectives ? newClass.learning_objectives.split(',') : [],
      class_schedule: newClass.class_schedule ? JSON.parse(newClass.class_schedule) : null
    };

  } catch (error) {
    console.error('❌ createClassService error:', error);
    if (error instanceof CustomError) throw error;
    if (error.code === 'ER_DUP_ENTRY') {
      throw new CustomError('Class with this name already exists', 409);
    }
    throw new CustomError('Failed to create class', 500);
  }
};

/**
 * Create a new class with enhanced options
 */
// export const createClassService = async (classData, adminUserId) => {
//   try {
//     const {
//       class_name,
//       public_name,
//       description,
//       class_type = 'general',
//       is_public = true,
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

//     // Generate OTU# format class ID
//     const class_id = await generateUniqueClassId();

//     // Prepare data for insertion
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

//     // Create class
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

//     // Make the creator a moderator
//     const membershipSql = `
//       INSERT INTO user_class_memberships 
//       (user_id, class_id, role_in_class, membership_status, joinedAt, assigned_by, receive_notifications, can_see_class_name, createdAt, updatedAt)
//       VALUES (?, ?, 'moderator', 'active', NOW(), ?, 1, 1, NOW(), NOW())
//     `;
//     await db.query(membershipSql, [adminUserId, class_id, adminUserId]);

//     // Initialize class configuration if needed
//     try {
//       const configSql = `
//         INSERT INTO class_configuration (class_id, settings, createdAt)
//         VALUES (?, ?, NOW())
//       `;
//       const defaultSettings = {
//         notifications: { enabled: enable_notifications },
//         discussions: { enabled: enable_discussions },
//         assignments: { enabled: enable_assignments },
//         grading: { enabled: enable_grading }
//       };
//       await db.query(configSql, [class_id, JSON.stringify(defaultSettings)]);
//     } catch (error) {
//       console.warn('Could not initialize class configuration:', error.message);
//     }

//     console.log(`✅ Class ${class_id} (${class_name}) created by admin ${adminUserId}`);

//     // Return created class with full details
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

/**
 * Create a new class
 * Route: POST /admin/classes
 */
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

/**
 * Update class with comprehensive field support
 */
export const updateClassService = async (classId, updateData, adminUserId) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const [existingClass] = await db.query(
      'SELECT * FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"',
      [classId]
    );

    if (!existingClass) {
      throw new CustomError('Class not found', 404);
    }

    const allowedFields = [
      'class_name', 'public_name', 'description', 'class_type', 'is_public',
      'max_members', 'privacy_level', 'requirements', 'instructor_notes', 'is_active',
      'tags', 'category', 'difficulty_level', 'estimated_duration', 'prerequisites',
      'learning_objectives', 'auto_approve_members', 'allow_self_join', 'require_approval',
      'enable_notifications', 'enable_discussions', 'enable_assignments', 'enable_grading',
      'class_schedule', 'timezone'
    ];

    const updateFields = [];
    const params = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'tags' && Array.isArray(value)) {
          updateFields.push(`${key} = ?`);
          params.push(value.join(','));
        } else if (key === 'prerequisites' && Array.isArray(value)) {
          updateFields.push(`${key} = ?`);
          params.push(value.join(','));
        } else if (key === 'learning_objectives' && Array.isArray(value)) {
          updateFields.push(`${key} = ?`);
          params.push(value.join(','));
        } else if (key === 'class_schedule' && typeof value === 'object') {
          updateFields.push(`${key} = ?`);
          params.push(JSON.stringify(value));
        } else if (['is_public', 'auto_approve_members', 'allow_self_join', 'require_approval', 'enable_notifications', 'enable_discussions', 'enable_assignments', 'enable_grading', 'is_active'].includes(key)) {
          updateFields.push(`${key} = ?`);
          params.push(Boolean(value));
        } else if (['max_members', 'estimated_duration'].includes(key)) {
          updateFields.push(`${key} = ?`);
          params.push(parseInt(value));
        } else {
          updateFields.push(`${key} = ?`);
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
    await db.query(sql, params);

    console.log(`✅ Class ${classId} updated by admin ${adminUserId}. Fields: ${Object.keys(updateData).join(', ')}`);

    const updatedSql = `
      SELECT c.*, u.username as created_by_username
      FROM classes c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.class_id = ?
    `;
    const [updatedClass] = await db.query(updatedSql, [classId]);

    return {
      ...updatedClass,
      display_id: formatClassIdForDisplay(classId),
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

/**
 * Update class
 * Route: PUT /admin/classes/:id
 */
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

/**
 * Update class with comprehensive field support
 */
// export const updateClassService = async (classId, updateData, adminUserId) => {
//   try {
//     if (!validateClassIdFormat(classId)) {
//       throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
//     }

//     // Check if class exists
//     const [existingClass] = await db.query(
//       'SELECT * FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"',
//       [classId]
//     );

//     if (!existingClass) {
//       throw new CustomError('Class not found', 404);
//     }

//     // Build update query dynamically with all supported fields
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

//     // Add updatedAt
//     updateFields.push('updatedAt = NOW()');
//     params.push(classId);

//     const sql = `UPDATE classes SET ${updateFields.join(', ')} WHERE class_id = ?`;
//     await db.query(sql, params);

//     console.log(`✅ Class ${classId} updated by admin ${adminUserId}. Fields: ${Object.keys(updateData).join(', ')}`);

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


/**
 * Delete class with proper cleanup and safety checks
 */
export const deleteClassService = async (classId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { 
      force = false, 
      transfer_members_to, 
      deleted_by,
      archive_instead = false,
      deletion_reason 
    } = options;

    const classSql = `
      SELECT c.*, 
        COALESCE(cmc.total_members, 0) as member_count,
        (SELECT COUNT(*) FROM class_content_access WHERE class_id = c.class_id) as content_count
      FROM classes c
      LEFT JOIN class_member_counts cmc ON c.class_id = cmc.class_id
      WHERE c.class_id = ? AND c.class_id LIKE "OTU#%"
    `;
    const [classData] = await db.query(classSql, [classId]);
    
    if (!classData) {
      throw new CustomError('Class not found', 404);
    }

    if (classId === 'OTU#Public' && !force) {
      throw new CustomError('Cannot delete the public class without force flag', 403);
    }

    if (!force) {
      if (classData.member_count > 0 && !transfer_members_to && !archive_instead) {
        throw new CustomError(
          `Cannot delete class with ${classData.member_count} members. Use force=true, transfer_members_to, or archive_instead=true.`, 
          400
        );
      }

      if (classData.content_count > 0 && !archive_instead) {
        throw new CustomError(
          `Cannot delete class with ${classData.content_count} content items. Use force=true or archive_instead=true.`, 
          400
        );
      }
    }

    if (archive_instead) {
      const archiveSql = `
        UPDATE classes 
        SET is_active = 0, updatedAt = NOW()
        WHERE class_id = ?
      `;
      await db.query(archiveSql, [classId]);

      return {
        archived_class_id: classId,
        class_name: classData.class_name,
        display_id: formatClassIdForDisplay(classId),
        members_count: classData.member_count,
        content_count: classData.content_count,
        archived_by: deleted_by,
        archivedAt: new Date().toISOString(),
        archive_reason: deletion_reason,
        action: 'archived'
      };
    }

    if (transfer_members_to && classData.member_count > 0) {
      const targetSql = 'SELECT class_id, class_name FROM classes WHERE class_id = ? AND is_active = 1 AND class_id LIKE "OTU#%"';
      const [targetClass] = await db.query(targetSql, [transfer_members_to]);
      
      if (!targetClass) {
        throw new CustomError('Target class for member transfer not found, inactive, or invalid format', 400);
      }

      const transferSql = `
        UPDATE user_class_memberships 
        SET class_id = ?, updatedAt = NOW()
        WHERE class_id = ? AND membership_status = 'active'
      `;
      const transferResult = await db.query(transferSql, [transfer_members_to, classId]);

      console.log(`✅ Transferred ${transferResult.affectedRows} members from ${classId} to ${transfer_members_to}`);
    } else if (force && classData.member_count > 0) {
      const removeMembersSql = `
        UPDATE user_class_memberships 
        SET membership_status = 'expired', updatedAt = NOW()
        WHERE class_id = ?
      `;
      await db.query(removeMembersSql, [classId]);
    }

    if (force && classData.content_count > 0) {
      const removeContentSql = 'DELETE FROM class_content_access WHERE class_id = ?';
      await db.query(removeContentSql, [classId]);
    }

    const deleteSql = 'DELETE FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
    await db.query(deleteSql, [classId]);

    console.log(`✅ Class ${classId} deleted by admin ${deleted_by}. Reason: ${deletion_reason || 'No reason provided'}`);

    return {
      deleted_class_id: classId,
      deleted_class_name: classData.class_name,
      display_id: formatClassIdForDisplay(classId),
      members_affected: classData.member_count,
      content_items_affected: classData.content_count,
      members_transferred_to: transfer_members_to || null,
      force_delete: force,
      deleted_by,
      deletion_reason,
      deletedAt: new Date().toISOString(),
      action: 'deleted'
    };

  } catch (error) {
    console.error('❌ deleteClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to delete class', 500);
  }
};

/**
 * Delete class
 * Route: DELETE /admin/classes/:id
 */
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


/**
 * Delete class with proper cleanup and safety checks
 */
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

//     // Get comprehensive class data
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

//     // Special protection for public class
//     if (classId === 'OTU#Public' && !force) {
//       throw new CustomError('Cannot delete the public class without force flag', 403);
//     }

//     // Safety checks unless force is true
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

//     // Archive instead of delete if requested
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

//     // Transfer members if specified
//     if (transfer_members_to && classData.member_count > 0) {
//       // Verify target class exists and is OTU# format
//       const targetSql = 'SELECT class_id, class_name FROM classes WHERE class_id = ? AND is_active = 1 AND class_id LIKE "OTU#%"';
//       const [targetClass] = await db.query(targetSql, [transfer_members_to]);
      
//       if (!targetClass) {
//         throw new CustomError('Target class for member transfer not found, inactive, or invalid format', 400);
//       }

//       // Transfer active members
//       const transferSql = `
//         UPDATE user_class_memberships 
//         SET class_id = ?, updatedAt = NOW()
//         WHERE class_id = ? AND membership_status = 'active'
//       `;
//       const transferResult = await db.query(transferSql, [transfer_members_to, classId]);

//       console.log(`✅ Transferred ${transferResult.affectedRows} members from ${classId} to ${transfer_members_to}`);
//     } else if (force && classData.member_count > 0) {
//       // Remove all memberships if force delete
//       const removeMembersSql = `
//         UPDATE user_class_memberships 
//         SET membership_status = 'expired', updatedAt = NOW()
//         WHERE class_id = ?
//       `;
//       await db.query(removeMembersSql, [classId]);
//     }

//     // Remove content associations if force delete
//     if (force && classData.content_count > 0) {
//       const removeContentSql = 'DELETE FROM class_content_access WHERE class_id = ?';
//       await db.query(removeContentSql, [classId]);
//     }

//     // Remove class configuration
//     try {
//       await db.query('DELETE FROM class_configuration WHERE class_id = ?', [classId]);
//     } catch (error) {
//       console.warn('Could not remove class configuration:', error.message);
//     }

//     // Delete the class
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


/**
 * Manage class membership (approve/reject/remove/change roles)
 */
export const manageClassMembershipService = async (classId, userId, action, adminUserId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const adminCheckSql = `
      SELECT ucm.role_in_class, c.class_name
      FROM user_class_memberships ucm
      INNER JOIN classes c ON ucm.class_id = c.class_id
      WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active' AND c.class_id LIKE "OTU#%"
    `;
    const [adminMembership] = await db.query(adminCheckSql, [adminUserId, classId]);

    const isSystemAdmin = options.isSystemAdmin || false;
    
    if (!isSystemAdmin && (!adminMembership || !['moderator', 'instructor'].includes(adminMembership.role_in_class))) {
      throw new CustomError('You do not have permission to manage this class', 403);
    }

    const membershipSql = `
      SELECT ucm.*, u.username, u.email
      FROM user_class_memberships ucm
      INNER JOIN users u ON ucm.user_id = u.id
      WHERE ucm.user_id = ? AND ucm.class_id = ?
    `;
    const [membership] = await db.query(membershipSql, [userId, classId]);

    if (!membership) {
      throw new CustomError('User membership not found', 404);
    }

    let sql, params, message, actionResult = {};
    const { new_role, reason, notify_user = true } = options;

    switch (action) {
      case 'approve':
        if (membership.membership_status !== 'pending') {
          throw new CustomError('Only pending memberships can be approved', 400);
        }
        sql = `
          UPDATE user_class_memberships 
          SET membership_status = 'active', updatedAt = NOW()
          WHERE user_id = ? AND class_id = ?
        `;
        params = [userId, classId];
        message = 'Membership approved successfully';
        actionResult = { new_status: 'active', approved_by: adminUserId };
        break;

      case 'reject':
        if (membership.membership_status !== 'pending') {
          throw new CustomError('Only pending memberships can be rejected', 400);
        }
        sql = `
          UPDATE user_class_memberships 
          SET membership_status = 'suspended', updatedAt = NOW()
          WHERE user_id = ? AND class_id = ?
        `;
        params = [userId, classId];
        message = 'Membership rejected successfully';
        actionResult = { new_status: 'suspended', rejected_by: adminUserId };
        break;

      case 'remove':
        if (membership.membership_status !== 'active') {
          throw new CustomError('Only active members can be removed', 400);
        }
        if (membership.role_in_class === 'moderator') {
          const countSql = 'SELECT COUNT(*) as count FROM user_class_memberships WHERE class_id = ? AND role_in_class = "moderator" AND membership_status = "active"';
          const [countResult] = await db.query(countSql, [classId]);
          if (countResult.count <= 1) {
            throw new CustomError('Cannot remove the last moderator', 400);
          }
        }
        sql = `
          UPDATE user_class_memberships 
          SET membership_status = 'expired', updatedAt = NOW()
          WHERE user_id = ? AND class_id = ?
        `;
        params = [userId, classId];
        message = 'Member removed successfully';
        actionResult = { new_status: 'expired', removed_by: adminUserId };
        break;

      case 'change_role':
      case 'promote':
      case 'demote':
        if (!new_role || !['member', 'moderator', 'assistant', 'instructor'].includes(new_role)) {
          throw new CustomError('Invalid role. Must be: member, moderator, assistant, or instructor', 400);
        }
        if (membership.membership_status !== 'active') {
          throw new CustomError('Only active members can have role changes', 400);
        }
        if (membership.role_in_class === new_role) {
          throw new CustomError(`User already has the role: ${new_role}`, 400);
        }
        sql = `
          UPDATE user_class_memberships 
          SET role_in_class = ?, updatedAt = NOW()
          WHERE user_id = ? AND class_id = ?
        `;
        params = [new_role, userId, classId];
        message = `Role changed to ${new_role} successfully`;
        actionResult = { 
          previous_role: membership.role_in_class, 
          new_role, 
          changed_by: adminUserId 
        };
        break;

      default:
        throw new CustomError('Invalid action. Must be: approve, reject, remove, change_role, promote, or demote', 400);
    }

    await db.query(sql, params);

    console.log(`✅ Class membership action: ${action} for user ${userId} in class ${classId} by admin ${adminUserId}`);

    return {
      success: true,
      message,
      action,
      user_id: userId,
      username: membership.username,
      class_id: classId,
      class_name: adminMembership?.class_name || 'System Admin Action',
      display_id: formatClassIdForDisplay(classId),
      previous_status: membership.membership_status,
      previous_role: membership.role_in_class,
      ...actionResult,
      reason,
      notify_user,
      performed_by: adminUserId,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ manageClassMembershipService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to manage class membership', 500);
  }
};

/**
 * Manage class membership (approve/reject/remove/change roles)
 */
// export const manageClassMembershipService = async (classId, userId, action, adminUserId, options = {}) => {
//   try {
//     if (!validateClassIdFormat(classId)) {
//       throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
//     }

//     // Verify admin has permission
//     const adminCheckSql = `
//       SELECT ucm.role_in_class, c.class_name
//       FROM user_class_memberships ucm
//       INNER JOIN classes c ON ucm.class_id = c.class_id
//       WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active' AND c.class_id LIKE "OTU#%"
//     `;
//     const [adminMembership] = await db.query(adminCheckSql, [adminUserId, classId]);

//     // Allow system admins even if not a class member
//     const isSystemAdmin = options.isSystemAdmin || false;
    
//     if (!isSystemAdmin && (!adminMembership || !['moderator', 'instructor'].includes(adminMembership.role_in_class))) {
//       throw new CustomError('You do not have permission to manage this class', 403);
//     }

//     // Get current membership
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
//         // Prevent removing the last moderator
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

// ===============================================
// ADDITIONAL ADMIN SERVICES
// ===============================================

/**
 * Archive class service
 */
export const archiveClassService = async (classId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { archived_by, archive_reason } = options;

    const classSql = 'SELECT * FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
    const [classData] = await db.query(classSql, [classId]);
    
    if (!classData) {
      throw new CustomError('Class not found', 404);
    }

    const archiveSql = `
      UPDATE classes 
      SET is_active = 0, updatedAt = NOW()
      WHERE class_id = ?
    `;
    await db.query(archiveSql, [classId]);

    return {
      archived_class_id: classId,
      class_name: classData.class_name,
      display_id: formatClassIdForDisplay(classId),
      archived_by,
      archivedAt: new Date().toISOString(),
      archive_reason
    };

  } catch (error) {
    console.error('❌ archiveClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to archive class', 500);
  }
};

/**
 * Archive class service
 */
// export const archiveClassService = async (classId, options = {}) => {
//   try {
//     if (!validateClassIdFormat(classId)) {
//       throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
//     }

//     const { archived_by, archive_reason } = options;

//     // Check if class exists
//     const classSql = 'SELECT * FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
//     const [classData] = await db.query(classSql, [classId]);
    
//     if (!classData) {
//       throw new CustomError('Class not found', 404);
//     }

//     // Archive the class
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

/**
 * Restore class service
 */
export const restoreClassService = async (classId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { restore_members = true, restored_by } = options;

    const classSql = 'SELECT * FROM classes WHERE class_id = ? AND is_active = 0 AND class_id LIKE "OTU#%"';
    const [classData] = await db.query(classSql, [classId]);
    
    if (!classData) {
      throw new CustomError('Archived class not found', 404);
    }

    const restoreSql = `
      UPDATE classes 
      SET is_active = 1, updatedAt = NOW()
      WHERE class_id = ?
    `;
    await db.query(restoreSql, [classId]);

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
      restoredAt: new Date().toISOString(),
      members_restored: restore_members
    };

  } catch (error) {
    console.error('❌ restoreClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to restore class', 500);
  }
};

/**
 * Restore class service
 */
// export const restoreClassService = async (classId, options = {}) => {
//   try {
//     if (!validateClassIdFormat(classId)) {
//       throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
//     }

//     const { restore_members = true, restored_by } = options;

//     // Check if class exists and is archived
//     const classSql = 'SELECT * FROM classes WHERE class_id = ? AND is_active = 0 AND class_id LIKE "OTU#%"';
//     const [classData] = await db.query(classSql, [classId]);
    
//     if (!classData) {
//       throw new CustomError('Archived class not found', 404);
//     }

//     // Restore the class
//     const restoreSql = `
//       UPDATE classes 
//       SET is_active = 1, updatedAt = NOW()
//       WHERE class_id = ?
//     `;
//     await db.query(restoreSql, [classId]);

//     // Optionally restore members
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

/**
 * Duplicate class service
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

    const originalSql = 'SELECT * FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
    const [original] = await db.query(originalSql, [classId]);
    
    if (!original) {
      throw new CustomError('Class not found', 404);
    }

    const duplicateData = {
      ...original,
      class_id: undefined,
      class_name: new_name || `${original.class_name} (Copy)`,
      public_name: new_name || `${original.public_name} (Copy)`,
      created_by: duplicated_by,
      createdAt: undefined,
      updatedAt: undefined
    };

    delete duplicateData.id;

    const newClass = await createClassService(duplicateData, duplicated_by);

    if (copy_content) {
      const contentSql = `
        INSERT INTO class_content_access (content_id, content_type, class_id, access_level, createdAt)
        SELECT content_id, content_type, ?, access_level, NOW()
        FROM class_content_access
        WHERE class_id = ?
      `;
      await db.query(contentSql, [newClass.class_id, classId]);
    }

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
      duplicatedAt: new Date().toISOString(),
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

/**
 * Duplicate class service
 */
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

//     // Get original class
//     const originalSql = 'SELECT * FROM classes WHERE class_id = ? AND class_id LIKE "OTU#%"';
//     const [original] = await db.query(originalSql, [classId]);
    
//     if (!original) {
//       throw new CustomError('Class not found', 404);
//     }

//     // Create duplicate class data
//     const duplicateData = {
//       ...original,
//       class_id: undefined, // Will be generated
//       class_name: new_name || `${original.class_name} (Copy)`,
//       public_name: new_name || `${original.public_name} (Copy)`,
//       created_by: duplicated_by,
//       createdAt: undefined,
//       updatedAt: undefined
//     };

//     // Remove fields that shouldn't be copied
//     delete duplicateData.id;

//     const newClass = await createClassService(duplicateData, duplicated_by);

//     // Copy content if requested
//     if (copy_content) {
//       const contentSql = `
//         INSERT INTO class_content_access (content_id, content_type, class_id, access_level, createdAt)
//         SELECT content_id, content_type, ?, access_level, NOW()
//         FROM class_content_access
//         WHERE class_id = ?
//       `;
//       await db.query(contentSql, [newClass.class_id, classId]);
//     }

//     // Copy members if requested
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

/**
 * Get class enrollment statistics
 */
export const getClassEnrollmentStatsService = async (classId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { period = '30d', breakdown = 'daily' } = options;

    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trendQuery = breakdown === 'daily' ? `
      SELECT 
        DATE(joinedAt) as period,
        COUNT(*) as new_enrollments,
        SUM(CASE WHEN membership_status = 'active' THEN 1 ELSE 0 END) as active_enrollments
      FROM user_class_memberships
      WHERE class_id = ? AND joinedAt >= ?
      GROUP BY DATE(joinedAt)
      ORDER BY period ASC
    ` : `
      SELECT 
        YEARWEEK(joinedAt) as period,
        COUNT(*) as new_enrollments,
        SUM(CASE WHEN membership_status = 'active' THEN 1 ELSE 0 END) as active_enrollments
      FROM user_class_memberships
      WHERE class_id = ? AND joinedAt >= ?
      GROUP BY YEARWEEK(joinedAt)
      ORDER BY period ASC
    `;

    const enrollmentTrends = await db.query(trendQuery, [classId, startDate]);

    const [currentStats] = await db.query(`
      SELECT 
        COUNT(*) as total_enrollments,
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

    const roleDistribution = await db.query(`
      SELECT 
        role_in_class,
        COUNT(*) as count,
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_class_memberships WHERE class_id = ? AND membership_status = 'active')) as percentage
      FROM user_class_memberships
      WHERE class_id = ? AND membership_status = 'active'
      GROUP BY role_in_class
    `, [classId, classId]);

    return {
      current_status: currentStats,
      enrollment_trends: enrollmentTrends,
      role_distribution: roleDistribution,
      class_id: classId,
      display_id: formatClassIdForDisplay(classId),
      period,
      breakdown,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ getClassEnrollmentStatsService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to get enrollment statistics', 500);
  }
};

/**
 * Get class enrollment statistics
 */
// export const getClassEnrollmentStatsService = async (classId, options = {}) => {
//   try {
//     if (!validateClassIdFormat(classId)) {
//       throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
//     }

//     const { period = '30d', breakdown = 'daily' } = options;

//     // Parse period
//     const days = parseInt(period.replace('d', ''));
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - days);

//     // Get enrollment trends
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

//     // Get current statistics
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

//     // Get role distribution
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


/**
 * Get class analytics
 */
export const getClassAnalyticsService = async (filters = {}) => {
  try {
    const {
      period = '30d',
      class_type,
      include_inactive = false,
      breakdown = 'daily',
      class_id,
      date_from,
      date_to
    } = filters;

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

    let whereClause = 'WHERE c.class_id LIKE "OTU#%"';
    
    if (class_type) {
      whereClause += ' AND c.class_type = ?';
      params.push(class_type);
    }
    
    if (!include_inactive) {
      whereClause += ' AND c.is_active = 1';
    }
    
    if (class_id) {
      whereClause += ' AND c.class_id = ?';
      params.push(class_id);
    }

    const [overallStats] = await db.query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_classes,
        SUM(CASE WHEN c.is_active = 1 THEN 1 ELSE 0 END) as active_classes,
        SUM(CASE WHEN c.is_public = 1 THEN 1 ELSE 0 END) as public_classes,
        COUNT(DISTINCT ucm.user_id) as unique_members,
        COUNT(ucm.id) as total_memberships,
        AVG(cm.total_members) as avg_members_per_class,
        MAX(cm.total_members) as max_class_size,
        SUM(c.max_members) as total_capacity,
        AVG(CASE WHEN c.max_members > 0 
          THEN cm.total_members * 100.0 / c.max_members 
          ELSE 0 END) as avg_capacity_utilization
      FROM classes c
      LEFT JOIN user_class_memberships ucm ON c.class_id = ucm.class_id
      LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
      ${whereClause} ${dateCondition}
    `, params);

    const typeDistribution = await db.query(`
      SELECT 
        c.class_type,
        COUNT(*) as count,
        SUM(CASE WHEN c.is_active = 1 THEN 1 ELSE 0 END) as active_count,
        COUNT(DISTINCT ucm.user_id) as unique_members,
        AVG(cm.total_members) as avg_members
      FROM classes c
      LEFT JOIN user_class_memberships ucm ON c.class_id = ucm.class_id
      LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
      ${whereClause} ${dateCondition}
      GROUP BY c.class_type
      ORDER BY count DESC
    `, params);

    const topClasses = await db.query(`
      SELECT 
        c.class_id,
        c.class_name,
        c.class_type,
        cm.total_members as member_count,
        c.max_members,
        (cm.total_members * 100.0 / c.max_members) as utilization_rate
      FROM classes c
      LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
      WHERE c.is_active = 1 AND c.class_id LIKE "OTU#%"
      ORDER BY member_count DESC
      LIMIT 10
    `);

    return {
      summary: overallStats,
      type_distribution: typeDistribution,
      top_classes: topClasses.map(cls => ({
        ...cls,
        display_id: formatClassIdForDisplay(cls.class_id)
      })),
      filters_applied: filters,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ getClassAnalyticsService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to generate analytics', 500);
  }
};

/**
 * Get class analytics
 */
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

//     // Parse period
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

//     // Build where clause
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

//     // Get overall statistics
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

//     // Get growth trends
//     const trendQuery = breakdown === 'daily' ? `
//       SELECT 
//         DATE(c.createdAt) as period,
//         COUNT(*) as classes_created,
//         SUM(dm.new_members) as new_members
//       FROM classes c
//       LEFT JOIN (
//         SELECT 
//           DATE(joinedAt) as join_date,
//           class_id,
//           COUNT(*) as new_members
//         FROM user_class_memberships
//         GROUP BY DATE(joinedAt), class_id
//       ) dm ON DATE(c.createdAt) = dm.join_date AND c.class_id = dm.class_id
//       ${whereClause} ${dateCondition}
//       GROUP BY DATE(c.createdAt)
//       ORDER BY period DESC
//       LIMIT 30
//     ` : `
//       SELECT 
//         YEARWEEK(c.createdAt) as period,
//         COUNT(*) as classes_created,
//         SUM(wm.new_members) as new_members
//       FROM classes c
//       LEFT JOIN (
//         SELECT 
//           YEARWEEK(joinedAt) as join_week,
//           class_id,
//           COUNT(*) as new_members
//         FROM user_class_memberships
//         GROUP BY YEARWEEK(joinedAt), class_id
//       ) wm ON YEARWEEK(c.createdAt) = wm.join_week AND c.class_id = wm.class_id
//       ${whereClause} ${dateCondition}
//       GROUP BY YEARWEEK(c.createdAt)
//       ORDER BY period DESC
//       LIMIT 12
//     `;

//     const growthTrends = await db.query(trendQuery, params);

//     // Get class type distribution
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

//     // Get top classes by members
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
//       growth_trends: growthTrends,
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

/**
 * Bulk create classes
 */
export const bulkCreateClassesService = async (classesData, createdBy) => {
  const successful = [];
  const failed = [];

  try {
    for (let i = 0; i < classesData.length; i++) {
      const classData = classesData[i];
      
      try {
        if (!classData.class_name) {
          throw new Error('class_name is required');
        }

        const newClass = await createClassService(classData, createdBy);
        
        successful.push({
          index: i,
          class_id: newClass.class_id,
          class_name: newClass.class_name,
          display_id: newClass.display_id
        });
        
      } catch (error) {
        failed.push({
          index: i,
          class_name: classData.class_name,
          error: error.message
        });
      }
    }

    console.log(`✅ Bulk created ${successful.length} classes, ${failed.length} failed`);

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
    console.error('❌ bulkCreateClassesService error:', error);
    throw new CustomError('Bulk creation failed', 500);
  }
};

/**
 * Bulk create classes
 */
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

/**
 * Bulk update classes
 */
export const bulkUpdateClassesService = async (classIds, updates, updatedBy) => {
  const successful = [];
  const failed = [];

  try {
    for (const classId of classIds) {
      try {
        const updatedClass = await updateClassService(classId, updates, updatedBy);
        
        successful.push({
          class_id: classId,
          updated: true,
          display_id: updatedClass.display_id
        });
      } catch (error) {
        failed.push({
          class_id: classId,
          error: error.message
        });
      }
    }

    console.log(`✅ Bulk updated ${successful.length} classes, ${failed.length} failed`);

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
    console.error('❌ bulkUpdateClassesService error:', error);
    throw new CustomError('Bulk update failed', 500);
  }
};

/**
 * Bulk update classes
 */
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

/**
 * Bulk delete classes
 */
export const bulkDeleteClassesService = async (classIds, options = {}) => {
  const successful = [];
  const failed = [];

  try {
    for (const classId of classIds) {
      try {
        const result = await deleteClassService(classId, options);
        
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

    console.log(`✅ Bulk deleted ${successful.length} classes, ${failed.length} failed`);

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
    console.error('❌ bulkDeleteClassesService error:', error);
    throw new CustomError('Bulk delete failed', 500);
  }
};

/**
 * Bulk delete classes
 */
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



// ===============================================
// CLASS MANAGEMENT SERVICES (Routes: GET, POST, PUT, DELETE /admin/classes)
// ===============================================

/**
 * Get comprehensive class management data for admin
 * Route: GET /admin/classes
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

    const countSql = `SELECT COUNT(*) as total FROM classes c LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id ${whereClause}`;
    const [countResult] = await db.query(countSql, params);
    const total = countResult.total;

    const sql = `
      SELECT 
        c.*,
        u.username as created_by_username,
        u.email as created_by_email,
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
      LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id
      ${whereClause}
      ORDER BY 
        CASE WHEN c.class_id = 'OTU#Public' THEN 0 ELSE 1 END,
        c.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const classes = await db.query(sql, params);

    const formattedClasses = classes.map(cls => ({
      ...cls,
      display_id: formatClassIdForDisplay(cls.class_id),
      id_format: 'new_standard',
      tags: cls.tags ? (typeof cls.tags === 'string' ? cls.tags.split(',') : cls.tags) : [],
      health_score: calculateClassHealthScore(cls),
      available_spots: cls.max_members - (cls.total_members || 0)
    }));

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
      const [summaryResult] = await db.query(summarySql, params.slice(0, -2));
      summary = summaryResult;
      
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
 * Get comprehensive class management data for admin
 */
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








// ===============================================
// PARTICIPANT MANAGEMENT SERVICES (Routes: /admin/classes/:id/participants/*)
// ===============================================

/**
 * Get comprehensive class management data for admin
 */
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

//     // Enhanced filtering
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

//     // Get total count
//     const countSql = `SELECT COUNT(*) as total FROM classes c LEFT JOIN class_member_counts cm ON c.class_id = cm.class_id ${whereClause}`;
//     const [countResult] = await db.query(countSql, params);
//     const total = countResult.total;

//     // Get classes with enhanced admin info
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

//     // Add display formatting and health scoring
//     const formattedClasses = classes.map(cls => ({
//       ...cls,
//       display_id: formatClassIdForDisplay(cls.class_id),
//       id_format: 'new_standard',
//       tags: cls.tags ? (typeof cls.tags === 'string' ? cls.tags.split(',') : cls.tags) : [],
//       health_score: calculateClassHealthScore(cls),
//       available_spots: cls.max_members - (cls.total_members || 0)
//     }));

//     // Enhanced summary statistics
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
//       const [summaryResult] = await db.query(summarySql, params.slice(0, -2)); // Remove limit/offset
//       summary = summaryResult;
      
//       // Add calculated fields
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


/**
 * Get class participants (admin view)
 * Route: GET /admin/classes/:id/participants
 */
export const getClassParticipantsAdminService = async (classId, options = {}) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const { 
      role_in_class, 
      membership_status = 'active', 
      page = 1, 
      limit = 50,
      search,
      sort_by = 'joinedAt',
      sort_order = 'DESC',
      include_inactive = false,
      date_from,
      date_to
    } = options;
    
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE ucm.class_id = ?';
    const params = [classId];

    if (membership_status) {
      whereClause += ' AND ucm.membership_status = ?';
      params.push(membership_status);
    }

    if (role_in_class) {
      whereClause += ' AND ucm.role_in_class = ?';
      params.push(role_in_class);
    }

    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (date_from) {
      whereClause += ' AND ucm.joinedAt >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND ucm.joinedAt <= ?';
      params.push(date_to);
    }

    if (!include_inactive) {
      whereClause += ' AND (ucm.expiresAt IS NULL OR ucm.expiresAt > NOW())';
    }

    const countSql = `
      SELECT COUNT(*) as total 
      FROM user_class_memberships ucm 
      INNER JOIN users u ON ucm.user_id = u.id
      ${whereClause}
    `;
    const [countResult] = await db.query(countSql, params);
    const total = countResult.total;

    const sql = `
      SELECT 
        u.id as user_id,
        u.username,
        u.email,
        u.membership_stage,
        u.full_membership_status,
        ucm.role_in_class,
        ucm.membership_status,
        ucm.joinedAt,
        ucm.expiresAt,
        ucm.receive_notifications,
        ucm.can_see_class_name,
        ucm.assigned_by,
        assigned_by_user.username as assigned_by_username,
        DATEDIFF(NOW(), ucm.joinedAt) as days_as_member
      FROM user_class_memberships ucm
      INNER JOIN users u ON ucm.user_id = u.id
      LEFT JOIN users assigned_by_user ON ucm.assigned_by = assigned_by_user.id
      ${whereClause}
      ORDER BY ucm.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const participants = await db.query(sql, params);

    return {
      data: participants,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: limit
      },
      summary: {
        total_participants: total,
        by_role: {
          moderators: participants.filter(p => p.role_in_class === 'moderator').length,
          instructors: participants.filter(p => p.role_in_class === 'instructor').length,
          assistants: participants.filter(p => p.role_in_class === 'assistant').length,
          members: participants.filter(p => p.role_in_class === 'member').length
        }
      }
    };

  } catch (error) {
    console.error('❌ getClassParticipantsAdminService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to fetch class participants', 500);
  }
};

/**
 * Add participant to class
 * Route: POST /admin/classes/:id/participants/add
 */

export const addParticipantToClassService = async (classId, userData, adminUserId) => {
  try {
    if (!validateClassIdFormat(classId)) {
      throw new CustomError('Invalid class ID format. Expected OTU#XXXXXX format', 400);
    }

    const {
      user_id,
      user_ids, // For bulk add
      role_in_class = 'member',
      receive_notifications = true,
      expires_at,
      can_see_class_name = true,
      assignment_reason
    } = userData;

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
      throw new CustomError('user_id or user_ids is required for adding participants', 400);
    }
  } catch (error) {
    console.error('❌ addParticipantToClassService error:', error);
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to add participant to class', 500);
  }
};  




// ===============================================
// MODULE EXPORTS
// ===============================================

export default {
  // Class Management
  getClassManagementService,
  createClassService,
  updateClassService,
  deleteClassService,
  
  // Membership Management
  manageClassMembershipService,
  
  // Archive/Restore/Duplicate
  archiveClassService,
  restoreClassService,
  duplicateClassService,
  
  // Analytics & Stats
  getClassEnrollmentStatsService,
  getClassAnalyticsService,
  
  // Bulk Operations
  bulkCreateClassesService,
  bulkUpdateClassesService,
  bulkDeleteClassesService
};

