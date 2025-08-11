// ikootaapi/services/contentAdminServices.js
// EXTRACTED from adminServices.js + ENHANCED for unified content management
// Contains services specifically for content administration

import db from '../config/db.js';

// ============================================================================
// CONTENT MANAGEMENT SERVICES - EXTRACTED FROM adminServices.js
// ============================================================================

/**
 * ✅ Get pending content service - ENHANCED from adminServices.js
 * EXTRACTED and improved with better error handling
 */
export const getPendingContentService = async (filters = {}) => {
  try {
    console.log('🔍 Fetching pending content...');
    
    const { content_type, user_id, limit, offset = 0 } = filters;

    let whereConditions = [];
    let params = [];

    // Build where conditions for both tables
    if (user_id) {
      whereConditions.push('user_id = ?');
      params.push(user_id);
    }

    const whereClause = whereConditions.length > 0 ? 
      `AND ${whereConditions.join(' AND ')}` : '';

    let queries = [];

    // Get pending teachings
    if (!content_type || content_type === 'teaching') {
      queries.push({
        query: `
          SELECT 
            'teaching' as content_type,
            id,
            topic as title,
            description,
            approval_status,
            user_id,
            createdAt,
            updatedAt,
            reviewed_by,
            reviewedAt,
            admin_notes
          FROM teachings 
          WHERE approval_status = 'pending' ${whereClause}
          ORDER BY createdAt DESC
        `,
        params: [...params]
      });
    }
    
    // Get pending chats
    if (!content_type || content_type === 'chat') {
      queries.push({
        query: `
          SELECT 
            'chat' as content_type,
            id,
            title,
            summary as description,
            approval_status,
            user_id,
            createdAt,
            updatedAt,
            reviewed_by,
            reviewedAt,
            admin_notes
          FROM chats 
          WHERE approval_status = 'pending' ${whereClause}
          ORDER BY createdAt DESC
        `,
        params: [...params]
      });
    }

    // Execute all queries and combine results
    let allPendingContent = [];
    
    for (const queryObj of queries) {
      try {
        const results = await db.query(queryObj.query, queryObj.params);
        if (results && Array.isArray(results)) {
          allPendingContent.push(...results);
        }
      } catch (queryError) {
        console.error('❌ Error in individual query:', queryError);
        // Continue with other queries even if one fails
      }
    }

    // Sort by creation date (newest first)
    allPendingContent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply limit if specified
    if (limit) {
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      allPendingContent = allPendingContent.slice(startIndex, endIndex);
    }
    
    console.log('✅ Pending content fetched:', allPendingContent?.length || 0);
    return allPendingContent || [];
    
  } catch (error) {
    console.error('❌ Error in getPendingContentService:', error);
    throw new Error(`Failed to fetch pending content: ${error.message}`);
  }
};

/**
 * ✅ Approve content service - ENHANCED from adminServices.js
 * EXTRACTED and improved with better table handling
 */
export const approveContentService = async (contentId, contentType = 'teaching', adminNotes = '', reviewerId = null) => {
  try {
    console.log('🔍 Approving content:', contentId, contentType);
    
    if (!contentId) {
      throw new Error('Content ID is required');
    }

    // Validate content type
    const validTypes = ['teaching', 'chat'];
    if (!validTypes.includes(contentType)) {
      throw new Error(`Invalid content type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    let tableName = 'teachings'; // default
    if (contentType === 'chat') {
      tableName = 'chats';
    }
    
    // Check if content exists first
    const checkQuery = `SELECT id, approval_status FROM ${tableName} WHERE id = ?`;
    const existingContent = await db.query(checkQuery, [contentId]);
    
    if (!existingContent || existingContent.length === 0) {
      throw new Error(`${contentType} with ID ${contentId} not found`);
    }

    if (existingContent[0].approval_status === 'approved') {
      console.log('⚠️ Content already approved');
      return { message: 'Content already approved', status: 'approved' };
    }
    
    const sql = `
      UPDATE ${tableName} 
      SET 
        approval_status = 'approved',
        admin_notes = ?,
        reviewed_by = ?,
        reviewedAt = NOW(),
        updatedAt = NOW()
      WHERE id = ?
    `;
    
    const result = await db.query(sql, [adminNotes, reviewerId, contentId]);
    
    if (result.affectedRows === 0) {
      throw new Error(`Failed to approve ${contentType}`);
    }
    
    console.log('✅ Content approved successfully');
    
    // Return updated content
    const updatedContent = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [contentId]);
    return updatedContent[0] || { id: contentId, status: 'approved' };
    
  } catch (error) {
    console.error('❌ Error in approveContentService:', error);
    throw new Error(`Failed to approve content: ${error.message}`);
  }
};

/**
 * ✅ Reject content service - ENHANCED from adminServices.js  
 * EXTRACTED and improved with better error handling
 */
export const rejectContentService = async (contentId, contentType = 'teaching', adminNotes = '', reviewerId = null) => {
  try {
    console.log('🔍 Rejecting content:', contentId, contentType);
    
    if (!contentId) {
      throw new Error('Content ID is required');
    }

    if (!adminNotes || adminNotes.trim().length === 0) {
      throw new Error('Rejection reason (admin notes) is required');
    }

    // Validate content type
    const validTypes = ['teaching', 'chat'];
    if (!validTypes.includes(contentType)) {
      throw new Error(`Invalid content type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    let tableName = 'teachings'; // default
    if (contentType === 'chat') {
      tableName = 'chats';
    }
    
    // Check if content exists first
    const checkQuery = `SELECT id, approval_status FROM ${tableName} WHERE id = ?`;
    const existingContent = await db.query(checkQuery, [contentId]);
    
    if (!existingContent || existingContent.length === 0) {
      throw new Error(`${contentType} with ID ${contentId} not found`);
    }

    if (existingContent[0].approval_status === 'rejected') {
      console.log('⚠️ Content already rejected');
      return { message: 'Content already rejected', status: 'rejected' };
    }
    
    const sql = `
      UPDATE ${tableName} 
      SET 
        approval_status = 'rejected',
        admin_notes = ?,
        reviewed_by = ?,
        reviewedAt = NOW(),
        updatedAt = NOW()
      WHERE id = ?
    `;
    
    const result = await db.query(sql, [adminNotes.trim(), reviewerId, contentId]);
    
    if (result.affectedRows === 0) {
      throw new Error(`Failed to reject ${contentType}`);
    }
    
    console.log('✅ Content rejected successfully');
    
    // Return updated content
    const updatedContent = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [contentId]);
    return updatedContent[0] || { id: contentId, status: 'rejected', admin_notes: adminNotes };
    
  } catch (error) {
    console.error('❌ Error in rejectContentService:', error);
    throw new Error(`Failed to reject content: ${error.message}`);
  }
};

/**
 * ✅ Manage content service - ENHANCED from adminServices.js
 * EXTRACTED and improved with better bulk operations
 */
export const manageContentService = async (action, contentIds, options = {}) => {
  try {
    console.log('🔍 Managing content:', action, contentIds);
    
    if (!action) {
      // Original functionality - return all content
      return await getAllContentForAdmin();
    }
    
    if (!contentIds || !Array.isArray(contentIds)) {
      throw new Error('Content IDs array is required for bulk operations');
    }

    if (contentIds.length === 0) {
      throw new Error('At least one content ID is required');
    }
    
    // Enhanced functionality for bulk actions
    const { adminNotes = '', contentType = 'teaching', reviewerId = null } = options;
    
    const results = [];
    
    switch (action) {
      case 'bulk_approve':
        for (const id of contentIds) {
          try {
            const result = await approveContentService(id, contentType, adminNotes, reviewerId);
            results.push({ id, status: 'approved', result });
          } catch (error) {
            results.push({ id, status: 'error', error: error.message });
          }
        }
        break;
        
      case 'bulk_reject':
        if (!adminNotes || adminNotes.trim().length === 0) {
          throw new Error('Admin notes (rejection reason) required for bulk reject');
        }
        
        for (const id of contentIds) {
          try {
            const result = await rejectContentService(id, contentType, adminNotes, reviewerId);
            results.push({ id, status: 'rejected', result });
          } catch (error) {
            results.push({ id, status: 'error', error: error.message });
          }
        }
        break;
        
      case 'bulk_delete':
        for (const id of contentIds) {
          try {
            const result = await deleteContentService(id, contentType);
            results.push({ id, status: 'deleted', result });
          } catch (error) {
            results.push({ id, status: 'error', error: error.message });
          }
        }
        break;
        
      case 'bulk_update_status':
        const { new_status } = options;
        if (!new_status) {
          throw new Error('new_status is required for bulk_update_status');
        }
        
        for (const id of contentIds) {
          try {
            const result = await updateContentStatusService(id, contentType, new_status, adminNotes, reviewerId);
            results.push({ id, status: 'updated', new_status, result });
          } catch (error) {
            results.push({ id, status: 'error', error: error.message });
          }
        }
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    console.log('✅ Bulk operation completed:', results.length, 'items processed');
    return results;
    
  } catch (error) {
    console.error('❌ Error in manageContentService:', error);
    throw new Error(`Failed to manage content: ${error.message}`);
  }
};

/**
 * ✅ Delete content service - ENHANCED from adminServices.js
 * EXTRACTED and improved with better validation
 */
export const deleteContentService = async (contentId, contentType = 'teaching') => {
  try {
    console.log('🔍 Deleting content:', contentId, contentType);
    
    if (!contentId) {
      throw new Error('Content ID is required');
    }

    // Validate content type
    const validTypes = ['teaching', 'chat', 'comment'];
    if (!validTypes.includes(contentType)) {
      throw new Error(`Invalid content type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    let tableName = 'teachings'; // default
    if (contentType === 'chat') {
      tableName = 'chats';
    } else if (contentType === 'comment') {
      tableName = 'comments';
    }
    
    // Check if content exists first
    const checkQuery = `SELECT id FROM ${tableName} WHERE id = ?`;
    const existingContent = await db.query(checkQuery, [contentId]);
    
    if (!existingContent || existingContent.length === 0) {
      throw new Error(`${contentType} with ID ${contentId} not found`);
    }
    
    // TODO: Handle related data cleanup if needed
    // For example, delete related comments when deleting a chat or teaching
    if (contentType === 'chat') {
      // Delete related comments first
      await db.query('DELETE FROM comments WHERE chat_id = ?', [contentId]);
    } else if (contentType === 'teaching') {
      // Delete related comments first  
      await db.query('DELETE FROM comments WHERE teaching_id = ?', [contentId]);
    }
    
    const sql = `DELETE FROM ${tableName} WHERE id = ?`;
    const result = await db.query(sql, [contentId]);
    
    if (result.affectedRows === 0) {
      throw new Error(`Failed to delete ${contentType}`);
    }
    
    console.log('✅ Content deleted successfully');
    return { 
      id: contentId, 
      content_type: contentType, 
      deleted: true, 
      affected_rows: result.affectedRows 
    };
    
  } catch (error) {
    console.error('❌ Error in deleteContentService:', error);
    throw new Error(`Failed to delete content: ${error.message}`);
  }
};

/**
 * ✅ NEW: Update content status service
 * Enhanced service for unified content status updates
 */
export const updateContentStatusService = async (contentId, contentType, newStatus, adminNotes = '', reviewerId = null) => {
  try {
    console.log('🔍 Updating content status:', contentId, contentType, newStatus);
    
    if (!contentId || !contentType || !newStatus) {
      throw new Error('Content ID, content type, and new status are required');
    }

    // Validate content type
    const validTypes = ['teaching', 'chat', 'comment'];
    if (!validTypes.includes(contentType)) {
      throw new Error(`Invalid content type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate status for content types that have approval_status
    if (contentType !== 'comment') {
      const validStatuses = ['pending', 'approved', 'rejected'];
      if (contentType === 'teaching') {
        validStatuses.push('deleted');
      }
      
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status for ${contentType}. Must be one of: ${validStatuses.join(', ')}`);
      }
    }
    
    let tableName = 'teachings'; // default
    if (contentType === 'chat') {
      tableName = 'chats';
    } else if (contentType === 'comment') {
      tableName = 'comments';
    }
    
    // Check if content exists first
    const checkQuery = `SELECT id FROM ${tableName} WHERE id = ?`;
    const existingContent = await db.query(checkQuery, [contentId]);
    
    if (!existingContent || existingContent.length === 0) {
      throw new Error(`${contentType} with ID ${contentId} not found`);
    }
    
    let sql, params;
    
    if (contentType === 'comment') {
      // Comments don't have approval_status, so just update admin_notes
      sql = `
        UPDATE ${tableName} 
        SET admin_notes = ?, updatedAt = NOW()
        WHERE id = ?
      `;
      params = [adminNotes, contentId];
    } else {
      // Chats and teachings have approval_status
      sql = `
        UPDATE ${tableName} 
        SET 
          approval_status = ?,
          admin_notes = ?,
          reviewed_by = ?,
          reviewedAt = NOW(),
          updatedAt = NOW()
        WHERE id = ?
      `;
      params = [newStatus, adminNotes, reviewerId, contentId];
    }
    
    const result = await db.query(sql, params);
    
    if (result.affectedRows === 0) {
      throw new Error(`Failed to update ${contentType} status`);
    }
    
    console.log('✅ Content status updated successfully');
    
    // Return updated content
    const updatedContent = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [contentId]);
    return updatedContent[0] || { id: contentId, status: newStatus };
    
  } catch (error) {
    console.error('❌ Error in updateContentStatusService:', error);
    throw new Error(`Failed to update content status: ${error.message}`);
  }
};

/**
 * ✅ NEW: Get all content for admin management
 * Helper service to fetch all content across types
 */
export const getAllContentForAdmin = async (filters = {}) => {
  try {
    console.log('🔍 Fetching all content for admin...');
    
    const { content_type, approval_status, user_id, limit, offset = 0 } = filters;

    let whereConditions = [];
    let params = [];

    // Build where conditions
    if (user_id) {
      whereConditions.push('user_id = ?');
      params.push(user_id);
    }

    if (approval_status) {
      whereConditions.push('approval_status = ?');
      params.push(approval_status);
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    let queries = [];

    // Get teachings
    if (!content_type || content_type === 'teaching') {
      queries.push({
        query: `
          SELECT 
            'teaching' as content_type,
            id,
            topic as title,
            description,
            approval_status,
            user_id,
            createdAt,
            updatedAt,
            reviewed_by,
            reviewedAt,
            admin_notes
          FROM teachings 
          ${whereClause}
          ORDER BY createdAt DESC
        `,
        params: [...params]
      });
    }
    
    // Get chats
    if (!content_type || content_type === 'chat') {
      queries.push({
        query: `
          SELECT 
            'chat' as content_type,
            id,
            title,
            summary as description,
            approval_status,
            user_id,
            createdAt,
            updatedAt,
            reviewed_by,
            reviewedAt,
            admin_notes
          FROM chats 
          ${whereClause}
          ORDER BY createdAt DESC
        `,
        params: [...params]
      });
    }

    // Get comments (if requested)
    if (content_type === 'comment') {
      queries.push({
        query: `
          SELECT 
            'comment' as content_type,
            id,
            comment as title,
            comment as description,
            'approved' as approval_status,
            user_id,
            createdAt,
            updatedAt,
            NULL as reviewed_by,
            NULL as reviewedAt,
            NULL as admin_notes
          FROM comments 
          ${whereClause.replace('approval_status = ?', '1=1')} 
          ORDER BY createdAt DESC
        `,
        params: whereConditions.length > 0 ? [user_id].filter(Boolean) : []
      });
    }

    // Execute all queries and combine results
    let allContent = [];
    
    for (const queryObj of queries) {
      try {
        const results = await db.query(queryObj.query, queryObj.params);
        if (results && Array.isArray(results)) {
          allContent.push(...results);
        }
      } catch (queryError) {
        console.error('❌ Error in individual query:', queryError);
        // Continue with other queries even if one fails
      }
    }

    // Sort by creation date (newest first)
    allContent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply limit if specified
    if (limit) {
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      allContent = allContent.slice(startIndex, endIndex);
    }
    
    console.log('✅ All content fetched for admin:', allContent?.length || 0);
    return allContent || [];
    
  } catch (error) {
    console.error('❌ Error in getAllContentForAdmin:', error);
    throw new Error(`Failed to fetch content for admin: ${error.message}`);
  }
};

/**
 * ✅ EXTRACTED: Get reports service - from adminServices.js
 * Maintained for compatibility
 */
export const getReportsService = async (filters = {}) => {
  try {
    console.log('🔍 Fetching reports from database...');
    
    const { status = 'pending', limit, offset = 0 } = filters;

    let whereClause = '';
    let params = [];

    if (status && status !== 'all') {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }
    
    let query = `
      SELECT 
        id, 
        reported_id, 
        reporter_id, 
        reason, 
        status, 
        createdAt
      FROM reports 
      ${whereClause}
      ORDER BY createdAt DESC
    `;

    if (limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
    }
    
    const reports = await db.query(query, params);
    console.log('✅ Reports fetched successfully:', reports?.length || 0);
    return reports || [];
    
  } catch (error) {
    console.error('❌ Database error in getReportsService:', error);
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }
};

/**
 * ✅ EXTRACTED: Get all reports service - from adminServices.js
 * Maintained for compatibility
 */
export const getAllReportsService = async (filters = {}) => {
  try {
    console.log('🔍 Fetching all reports...');
    
    const { limit, offset = 0 } = filters;

    let query = `
      SELECT 
        id, reported_id, reporter_id, reason, status, createdAt
      FROM reports 
      ORDER BY createdAt DESC
    `;

    let params = [];
    if (limit) {
      query += ' LIMIT ? OFFSET ?';
      params = [parseInt(limit), parseInt(offset)];
    }
    
    const reports = await db.query(query, params);
    console.log('✅ All reports fetched successfully:', reports?.length || 0);
    return reports || [];
    
  } catch (error) {
    console.error('❌ Database error in getAllReportsService:', error);
    throw new Error(`Failed to fetch all reports: ${error.message}`);
  }
};

/**
 * ✅ EXTRACTED: Get audit logs service - from adminServices.js  
 * Maintained for compatibility
 */
export const getAuditLogsService = async (filters = {}) => {
  try {
    console.log('🔍 Fetching audit logs...');
    
    const { action, resource, limit = 100, offset = 0 } = filters;

    // Check if audit_logs table exists, if not return empty array
    try {
      let whereConditions = [];
      let params = [];

      if (action) {
        whereConditions.push('action LIKE ?');
        params.push(`%${action}%`);
      }

      if (resource) {
        whereConditions.push('resource LIKE ?');
        params.push(`%${resource}%`);
      }

      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';

      let query = `
        SELECT 
          id, action, resource, details, createdAt 
        FROM audit_logs 
        ${whereClause}
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `;
      
      params.push(parseInt(limit), parseInt(offset));
      
      const auditLogs = await db.query(query, params);
      console.log('✅ Audit logs fetched successfully:', auditLogs?.length || 0);
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

// NEW: Update comment status service
export const updateCommentStatusService = async (commentId, statusData) => {
  try {
    const { status, admin_notes = '', updated_by = null } = statusData;
    
    if (!commentId) {
      throw new Error('Comment ID is required');
    }

    // Check if comment exists
    const existingComment = await db.query('SELECT id FROM comments WHERE id = ?', [commentId]);
    if (!existingComment || existingComment.length === 0) {
      throw new Error('Comment not found');
    }

    const sql = `
      UPDATE comments 
      SET admin_notes = ?, updatedAt = NOW()
      WHERE id = ?
    `;
    
    const result = await db.query(sql, [admin_notes, commentId]);
    
    if (result.affectedRows === 0) {
      throw new Error('Failed to update comment status');
    }
    
    // Return updated comment
    const updatedComment = await db.query('SELECT * FROM comments WHERE id = ?', [commentId]);
    return updatedComment[0];
    
  } catch (error) {
    console.error('Error in updateCommentStatusService:', error);
    throw new Error(`Failed to update comment status: ${error.message}`);
  }
};

// ============================================================================
// EXPORT ALL SERVICES
// ============================================================================

// export {
//   // Core content admin services
//   getPendingContentService,
//   approveContentService,
//   rejectContentService,
//   manageContentService,
//   deleteContentService,
//   updateContentStatusService,
//   getAllContentForAdmin,
  
//   // Reports and audit services
//   getReportsService,
//   getAllReportsService,
//   getAuditLogsService
// };

