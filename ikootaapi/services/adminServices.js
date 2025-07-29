//ikootaapi/services/adminServices.js - Complete and properly merged implementation

import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// ===== USER MANAGEMENT SERVICES =====

// Get users service - FIXED: Proper column handling
export const getUsersService = async () => {
  try {
    console.log('🔍 Fetching users from database...');
    
    const query = `
      SELECT 
        id, username, email, phone, role, membership_stage, is_member,
        converse_id, mentor_id, primary_class_id as class_id, 
        isblocked, isbanned, createdAt,
        full_membership_status, is_identity_masked, total_classes
      FROM users 
      ORDER BY createdAt DESC
    `;
    
    const [users] = await db.query(query);
    console.log('✅ Users fetched successfully:', users?.length || 0);
    return users || [];
    
  } catch (error) {
    console.error('❌ Database error in getUsersService:', error);
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
};

// Update user by ID (isblocked, isbanned) - EXISTING functionality preserved
export const updateUserByIdService = async (userId, isblocked, isbanned) => {
  try {
    const sql = `
      UPDATE users
      SET isblocked = ?, isbanned = ?
      WHERE id = ?
    `;
    await db.query(sql, [isblocked, isbanned, userId]);
    
    const [updatedUser] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    return updatedUser[0];
  } catch (error) {
    console.error('❌ Error in updateUserByIdService:', error);
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

// Update user service - ENHANCED from existing
export const updateUserService = async (userId, updateData) => {
  try {
    console.log('🔍 Updating user:', userId, updateData);
    
    // Handle both old format (rating, userclass) and new format (object)
    let cleanData = {};
    
    if (typeof updateData === 'object' && updateData !== null) {
      // New format - object with multiple fields
      const fieldMapping = {
        'class_id': 'primary_class_id',
        'isblocked': 'isblocked',
        'isbanned': 'isbanned',
        'rating': 'rating',
        'userclass': 'userclass'
      };
      
      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined && value !== null && value !== '') {
          const dbField = fieldMapping[key] || key;
          cleanData[dbField] = value;
        }
      }
    } else {
      // Legacy format - individual parameters
      const { rating, userclass } = arguments[1] || {};
      if (rating !== undefined) cleanData.rating = rating;
      if (userclass !== undefined) cleanData.userclass = userclass;
    }
    
    if (Object.keys(cleanData).length === 0) {
      throw new Error('No valid update data provided');
    }
    
    // Special handling for isblocked (might be JSON in your schema)
    if (cleanData.isblocked !== undefined && typeof cleanData.isblocked === 'object') {
      cleanData.isblocked = JSON.stringify(cleanData.isblocked);
    }
    
    // Build dynamic update query
    const setClause = Object.keys(cleanData)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(cleanData);
    values.push(userId);
    
    const updateQuery = `UPDATE users SET ${setClause} WHERE id = ?`;
    await db.query(updateQuery, values);
    
    // Get updated user
    const [updatedUser] = await db.query(
      `SELECT id, username, email, role, membership_stage, is_member, 
              primary_class_id as class_id, isblocked, isbanned, rating, userclass
       FROM users WHERE id = ?`,
      [userId]
    );
    
    console.log('✅ User updated successfully');
    return updatedUser[0] || null;
    
  } catch (error) {
    console.error('❌ Error in updateUserService:', error);
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

// Update user columns service - EXISTING functionality preserved
export const updateUserColumnsService = async (userId, converse_id, mentor_id, class_id, is_member, role) => {
  try {
    const sql = `
      UPDATE users
      SET converse_id = ?, mentor_id = ?, primary_class_id = ?, is_member = ?, role = ?
      WHERE id = ?
    `;
    await db.query(sql, [converse_id, mentor_id, class_id, is_member, role, userId]);

    const [updatedUser] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    return updatedUser[0];
  } catch (error) {
    console.error('❌ Error in updateUserColumnsService:', error);
    throw new Error(`Failed to update user columns: ${error.message}`);
  }
};

// Ban user service - EXISTING functionality preserved
export const banUserService = async (userId, banReason = 'Admin action') => {
  try {
    console.log('🔍 Banning user:', userId);
    
    // Update both isbanned and postingRight for compatibility
    const sql = `
      UPDATE users 
      SET 
        isbanned = true,
        postingRight = "banned",
        ban_reason = ?,
        bannedAt = NOW()
      WHERE id = ?
    `;
    
    await db.query(sql, [banReason, userId]);
    console.log('✅ User banned successfully');
    
  } catch (error) {
    console.error('❌ Error in banUserService:', error);
    throw new Error(`Failed to ban user: ${error.message}`);
  }
};

// Unban user service - EXISTING functionality preserved
export const unbanUserService = async (userId) => {
  try {
    console.log('🔍 Unbanning user:', userId);
    
    // Update both isbanned and postingRight for compatibility
    const sql = `
      UPDATE users 
      SET 
        isbanned = false,
        postingRight = "active",
        ban_reason = NULL,
        bannedAt = NULL
      WHERE id = ?
    `;
    
    await db.query(sql, [userId]);
    console.log('✅ User unbanned successfully');
    
  } catch (error) {
    console.error('❌ Error in unbanUserService:', error);
    throw new Error(`Failed to unban user: ${error.message}`);
  }
};

// Grant posting rights service - EXISTING functionality preserved
export const grantPostingRightsService = async (userId) => {
  try {
    console.log('🔍 Granting posting rights to user:', userId);
    
    const sql = `
      UPDATE users 
      SET postingRight = "active", posting_rights_grantedAt = NOW()
      WHERE id = ?
    `;
    
    await db.query(sql, [userId]);
    console.log('✅ Posting rights granted successfully');
    
  } catch (error) {
    console.error('❌ Error in grantPostingRightsService:', error);
    throw new Error(`Failed to grant posting rights: ${error.message}`);
  }
};

// Manage users service - EXISTING functionality preserved
export const manageUsersService = async (action, userIds, options = {}) => {
  try {
    console.log('🔍 Managing users:', action, userIds);
    
    if (!action) {
      // Original functionality - return all users
      const [users] = await db.query('SELECT * FROM users');
      return users;
    }
    
    // Enhanced functionality for bulk actions
    switch (action) {
      case 'bulk_ban':
        const banPromises = userIds.map(id => banUserService(id, options.reason));
        return await Promise.all(banPromises);
        
      case 'bulk_unban':
        const unbanPromises = userIds.map(id => unbanUserService(id));
        return await Promise.all(unbanPromises);
        
      case 'bulk_grant_membership':
        const grantQuery = `UPDATE users SET is_member = 'granted' WHERE id IN (${userIds.map(() => '?').join(',')})`;
        return await db.query(grantQuery, userIds);
        
      case 'bulk_revoke_membership':
        const revokeQuery = `UPDATE users SET is_member = 'declined' WHERE id IN (${userIds.map(() => '?').join(',')})`;
        return await db.query(revokeQuery, userIds);
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
  } catch (error) {
    console.error('❌ Error in manageUsersService:', error);
    throw new Error(`Failed to manage users: ${error.message}`);
  }
};

// ===== CONTENT MANAGEMENT SERVICES =====

// Get pending content service - EXISTING functionality preserved
export const getPendingContentService = async () => {
  try {
    console.log('🔍 Fetching pending content...');
    
    const sql = 'SELECT * FROM content WHERE approval_status = "pending"';
    const [content] = await db.query(sql);
    
    console.log('✅ Pending content fetched:', content?.length || 0);
    return content || [];
    
  } catch (error) {
    console.error('❌ Error in getPendingContentService:', error);
    throw new Error(`Failed to fetch pending content: ${error.message}`);
  }
};

// Approve content service - EXISTING functionality preserved
export const approveContentService = async (contentId, contentType = null, adminNotes = '') => {
  try {
    console.log('🔍 Approving content:', contentId);
    
    const sql = `
      UPDATE content 
      SET 
        approval_status = "approved",
        approvedAt = NOW(),
        admin_notes = ?
      WHERE id = ?
    `;
    
    await db.query(sql, [adminNotes, contentId]);
    console.log('✅ Content approved successfully');
    
  } catch (error) {
    console.error('❌ Error in approveContentService:', error);
    throw new Error(`Failed to approve content: ${error.message}`);
  }
};

// Reject content service - EXISTING functionality preserved
export const rejectContentService = async (contentId, contentType = null, adminNotes = '') => {
  try {
    console.log('🔍 Rejecting content:', contentId);
    
    const sql = `
      UPDATE content 
      SET 
        approval_status = "rejected",
        rejectedAt = NOW(),
        admin_notes = ?
      WHERE id = ?
    `;
    
    await db.query(sql, [adminNotes, contentId]);
    console.log('✅ Content rejected successfully');
    
  } catch (error) {
    console.error('❌ Error in rejectContentService:', error);
    throw new Error(`Failed to reject content: ${error.message}`);
  }
};

// Manage content service - EXISTING functionality preserved
export const manageContentService = async (action, contentIds, options = {}) => {
  try {
    console.log('🔍 Managing content:', action, contentIds);
    
    if (!action) {
      // Original functionality - return all content
      const [content] = await db.query('SELECT * FROM content');
      return content;
    }
    
    // Enhanced functionality for bulk actions
    const { adminNotes = '' } = options;
    
    switch (action) {
      case 'bulk_approve':
        const approvePromises = contentIds.map(id => approveContentService(id, null, adminNotes));
        return await Promise.all(approvePromises);
        
      case 'bulk_reject':
        const rejectPromises = contentIds.map(id => rejectContentService(id, null, adminNotes));
        return await Promise.all(rejectPromises);
        
      case 'bulk_delete':
        const deleteQuery = `DELETE FROM content WHERE id IN (${contentIds.map(() => '?').join(',')})`;
        return await db.query(deleteQuery, contentIds);
        
      default:
        throw new Error(`Unknown content action: ${action}`);
    }
    
  } catch (error) {
    console.error('❌ Error in manageContentService:', error);
    throw new Error(`Failed to manage content: ${error.message}`);
  }
};

// ===== REPORTS SERVICES =====

// Get reports service - FIXED: Remove non-existent columns
export const getReportsService = async () => {
  try {
    console.log('🔍 Fetching reports from database...');
    
    const query = `
      SELECT 
        id, 
        reported_id, 
        reporter_id, 
        reason, 
        status, 
        createdAt
      FROM reports 
      WHERE status = "pending"
      ORDER BY createdAt DESC
    `;
    
    const [reports] = await db.query(query);
    console.log('✅ Reports fetched successfully:', reports?.length || 0);
    return reports || [];
    
  } catch (error) {
    console.error('❌ Database error in getReportsService:', error);
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }
};

// Get all reports service (for admin panel)
export const getAllReportsService = async () => {
  try {
    const query = `
      SELECT 
        id, reported_id, reporter_id, reason, status, createdAt
      FROM reports 
      ORDER BY createdAt DESC
    `;
    
    const [reports] = await db.query(query);
    return reports || [];
    
  } catch (error) {
    console.error('❌ Database error in getAllReportsService:', error);
    throw new Error(`Failed to fetch all reports: ${error.message}`);
  }
};

// ===== MENTORS SERVICES =====

// Get mentors service
export const getMentorsService = async () => {
  try {
    console.log('🔍 Fetching mentors from database...');
    
    const query = `
      SELECT 
        id, username, email, converse_id, role, 
        primary_class_id as class_id, total_classes, createdAt
      FROM users 
      WHERE role IN ('admin', 'super_admin', 'mentor') 
         OR converse_id IS NOT NULL
      ORDER BY role DESC, username ASC
    `;
    
    const [mentors] = await db.query(query);
    console.log('✅ Mentors fetched successfully:', mentors?.length || 0);
    return mentors || [];
    
  } catch (error) {
    console.error('❌ Database error in getMentorsService:', error);
    throw new Error(`Failed to fetch mentors: ${error.message}`);
  }
};

// ===== AUDIT LOGS SERVICES =====

// Get audit logs service
export const getAuditLogsService = async () => {
  try {
    console.log('🔍 Fetching audit logs...');
    
    // Check if audit_logs table exists, if not return empty array
    try {
      const query = `
        SELECT 
          id, action, resource, details, createdAt 
        FROM audit_logs 
        ORDER BY createdAt DESC
        LIMIT 100
      `;
      
      const [auditLogs] = await db.query(query);
      return auditLogs || [];
      
    } catch (tableError) {
      console.log('⚠️ Audit logs table not found, returning empty array');
      return [];
    }
    
  } catch (error) {
    console.error('❌ Error in getAuditLogsService:', error);
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }
};




// //ikootaapi\services\adminServices.js
// import db from '../config/db.js';
// import { v4 as uuidv4 } from 'uuid';



// // Fetch all users including isblocked, isbanned, and is_flagged
// // export const getUsersService = async () => {
// //   const sql = 'SELECT id, username, email, isblocked, isbanned, is_flagged FROM users';
// //   const users = await db.query(sql);
// //   return users;
// // };

// // Get users service - FIXED: Remove 'is_flagged' column
// export const getUsersService = async () => {
//   try {
//     // ✅ REMOVED: is_flagged column that doesn't exist
//     const [users] = await db.query(`
//       SELECT 
//         id, username, email, phone, role, membership_stage, is_member,
//         converse_id, mentor_id, primary_class_id as class_id, 
//         isblocked, isbanned, createdAt, updatedAt,
//         full_membership_status, is_identity_masked, total_classes
//       FROM users 
//       ORDER BY createdAt DESC
//     `);
    
//     return users;
//   } catch (error) {
//     console.error('❌ Database error in getUsersService:', error);
//     throw new Error(`Failed to fetch users: ${error.message}`);
//   }
// };

// // Update user by ID (isblocked, isbanned)
// export const updateUserByIdService = async (userId, isblocked, isbanned) => {
//   const sql = `
//     UPDATE users
//     SET isblocked = ?, isbanned = ?
//     WHERE id = ?
//   `;
//   await db.query(sql, [isblocked, isbanned, userId]);
//   const updatedUser = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
//   return updatedUser[0];
// };

// // export const updateUserService = async (userId, rating, userclass) => {
// //   const sql = 'UPDATE users SET rating = ?, userclass = ? WHERE id = ?';
// //   await db.query(sql, [rating, userclass, userId]);
// //   const updatedUser = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
// //   return updatedUser[0];
// // };

// // Update user service
// export const updateUserService = async (userId, updateData) => {
//   try {
//     // Map frontend field names to database field names
//     const fieldMapping = {
//       'class_id': 'primary_class_id',
//       'isblocked': 'isblocked',
//       'isbanned': 'isbanned'
//     };
    
//     // Clean and map the data
//     const cleanData = {};
//     for (const [key, value] of Object.entries(updateData)) {
//       if (value !== undefined && value !== null && value !== '') {
//         const dbField = fieldMapping[key] || key;
//         cleanData[dbField] = value;
//       }
//     }
    
//     if (Object.keys(cleanData).length === 0) {
//       throw new Error('No valid update data provided');
//     }
    
//     // Special handling for isblocked (it's JSON in your schema)
//     if (cleanData.isblocked !== undefined) {
//       cleanData.isblocked = JSON.stringify(cleanData.isblocked);
//     }
    
//     // Build dynamic update query
//     const setClause = Object.keys(cleanData)
//       .map(key => `${key} = ?`)
//       .join(', ');
    
//     const values = Object.values(cleanData);
//     values.push(userId);
    
//     const updateQuery = `UPDATE users SET ${setClause} WHERE id = ?`;
    
//     await db.query(updateQuery, values);
    
//     // Get updated user
//     const [updatedUser] = await db.query(
//       `SELECT id, username, email, role, membership_stage, is_member, 
//               primary_class_id as class_id, isblocked, isbanned 
//        FROM users WHERE id = ?`,
//       [userId]
//     );
    
//     return updatedUser[0] || null;
//   } catch (error) {
//     console.error('❌ Database error in updateUserService:', error);
//     throw new Error(`Failed to update user: ${error.message}`);
//   }
// };


// export const updateUserColumnsService = async (userId, converse_id, mentor_id, class_id, is_member, role) => {
//   const sql = `
//     UPDATE users
//     SET converse_id = ?, mentor_id = ?, class_id = ?, is_member = ?, role = ?
//     WHERE id = ?
//   `;
//   await db.query(sql, [converse_id, mentor_id, class_id, is_member, role, userId]);

//   const updatedUser = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
//   return updatedUser[0];
// };





// export const getPendingContentService = async () => {
//   const sql = 'SELECT * FROM content WHERE approval_status = "pending"';
//   const content = await db.query(sql);
//   return content;
// };

// export const approveContentService = async (contentId) => {
//   const sql = 'UPDATE content SET approval_status = "approved" WHERE id = ?';
//   await db.query(sql, [contentId]);
// };

// export const rejectContentService = async (contentId) => {
//   const sql = 'UPDATE content SET approval_status = "rejected" WHERE id = ?';
//   await db.query(sql, [contentId]);
// };

// export const manageContentService = async () => {
//   const sql = 'SELECT * FROM content';
//   const content = await db.query(sql);
//   return content;
// };

// export const manageUsersService = async () => {
//   const sql = 'SELECT * FROM users';
//   const users = await db.query(sql);
//   return users;
// };

// export const banUserService = async (userId) => {
//   const sql = 'UPDATE users SET postingRight = "banned" WHERE id = ?';
//   await db.query(sql, [userId]);
// };

// export const unbanUserService = async (userId) => {
//   const sql = 'UPDATE users SET postingRight = "active" WHERE id = ?';
//   await db.query(sql, [userId]);
// };

// export const grantPostingRightsService = async (userId) => {
//   const sql = 'UPDATE users SET postingRight = "active" WHERE id = ?';
//   await db.query(sql, [userId]);
// };




// // Fetch reports for admin review
// // export const getReportsService = async () => {
// //   const sql = 'SELECT id, reported_id, reason, details FROM reports WHERE status = "pending"';
// //   const reports = await db.query(sql);
// //   return reports;
// // };

// // Get reports service - FIXED: Remove 'details' column
// // export const getReportsService = async () => {
// //   try {
// //     // ✅ REMOVED: details column that doesn't exist, ADDED: missing columns
// //     const [reports] = await db.query(`
// //       SELECT 
// //         id, reported_id, reporter_id, reason, status, createdAt, updatedAt
// //       FROM reports 
// //       WHERE status = "pending"
// //       ORDER BY createdAt DESC
// //     `);
    
// //     return reports;
// //   } catch (error) {
// //     console.error('❌ Database error in getReportsService:', error);
// //     throw new Error(`Failed to fetch reports: ${error.message}`);
// //   }
// // };

// // // Fetch audit logs for monitoring
// // export const getAuditLogsService = async () => {
// //   const sql = 'SELECT id, action, target_id, details, createdAt FROM audit_logs ORDER BY createdAt DESC';
// //   const auditLogs = await db.query(sql);
// //   return auditLogs;
// // };

// export const getReportsService = async () => {
//   try {
//     console.log('🔍 Fetching reports from database...');
    
//     // ✅ FIXED: Remove 'updatedAt' column that doesn't exist
//     const query = `
//       SELECT 
//         id, 
//         reported_id, 
//         reporter_id, 
//         reason, 
//         status, 
//         createdAt
//       FROM reports 
//       WHERE status = "pending"
//       ORDER BY createdAt DESC
//     `;
    
//     const reports = await db.query(query);
    
//     console.log('✅ Reports fetched successfully:', reports?.length || 0);
//     return reports || [];
    
//   } catch (error) {
//     console.error('❌ Database error in getReportsService:', error);
//     throw new Error(`Failed to fetch reports: ${error.message}`);
//   }
// };

// // Get all reports service (for admin panel)
// export const getAllReportsService = async () => {
//   try {
//     const [reports] = await db.query(`
//       SELECT 
//         id, reported_id, reporter_id, reason, status, createdAt, updatedAt
//       FROM reports 
//       ORDER BY createdAt DESC
//     `);
    
//     return reports;
//   } catch (error) {
//     console.error('❌ Database error in getAllReportsService:', error);
//     throw new Error(`Failed to fetch all reports: ${error.message}`);
//   }
// };

// // Get mentors service
// export const getMentorsService = async () => {
//   try {
//     const [mentors] = await db.query(`
//       SELECT 
//         id, username, email, converse_id, role, 
//         primary_class_id as class_id, total_classes
//       FROM users 
//       WHERE role IN ('admin', 'super_admin') 
//          OR converse_id IS NOT NULL
//       ORDER BY role DESC, username ASC
//     `);
    
//     return mentors;
//   } catch (error) {
//     console.error('❌ Database error in getMentorsService:', error);
//     throw new Error(`Failed to fetch mentors: ${error.message}`);
//   }
// };