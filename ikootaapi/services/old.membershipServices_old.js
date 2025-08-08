// // ikootaapi/services/membershipServices.js - ENHANCED AND MODULARIZED
// // ===============================================
// // ENHANCED MEMBERSHIP SERVICES
// // Core business logic for membership operations
// // ===============================================

// import db from '../config/db.js';

// /**
//  * Get pending applications with pagination and filtering
//  * Enhanced with better error handling and more flexible options
//  */
// export const getPendingApplicationsWithPagination = async (options) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 20, 
//       status = 'pending', 
//       search = '', 
//       sortBy = 'submittedAt', 
//       sortOrder = 'DESC', 
//       stage = 'initial' 
//     } = options;
    
//     const offset = (page - 1) * limit;
//     const applicationType = stage === 'initial' ? 'initial_application' : 'full_membership';
    
//     // Build search conditions
//     let searchClause = '';
//     let searchParams = [];
    
//     if (search && search.trim()) {
//       searchClause = 'AND (u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
//       const searchTerm = `%${search.trim()}%`;
//       searchParams = [searchTerm, searchTerm, searchTerm];
//     }
    
//     // Build the query with all fields
//     const selectFields = `
//       u.id as user_id,
//       u.username,
//       u.email,
//       u.phone,
//       u.membership_stage,
//       u.role,
//       sl.id as application_id,
//       sl.answers,
//       sl.createdAt as submittedAt,
//       sl.application_ticket,
//       sl.additional_data,
//       sl.admin_notes,
//       sl.approval_status as status,
//       sl.application_type,
//       sl.reviewedAt,
//       sl.reviewed_by,
//       reviewer.username as reviewer_name,
//       DATEDIFF(NOW(), sl.createdAt) as days_pending,
//       fma.first_accessedAt,
//       fma.access_count
//     `;
    
//     // Validate sortBy parameter to prevent SQL injection
//     const allowedSortFields = [
//       'submittedAt', 'username', 'email', 'status', 
//       'days_pending', 'membership_stage', 'application_type'
//     ];
//     const safeSortBy = allowedSortFields.includes(sortBy) ? 
//       (sortBy === 'submittedAt' ? 'sl.createdAt' : sortBy) : 'sl.createdAt';
    
//     const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? 
//       sortOrder.toUpperCase() : 'DESC';
    
//     // Main query with proper joins and type casting
//     const query = `
//       SELECT ${selectFields}
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       LEFT JOIN users reviewer ON sl.reviewed_by = reviewer.id
//       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
//       WHERE sl.approval_status = ?
//         AND sl.application_type = ?
//         ${searchClause}
//       ORDER BY ${safeSortBy} ${safeSortOrder}
//       LIMIT ? OFFSET ?
//     `;
    
//     const queryParams = [
//       status, 
//       applicationType, 
//       ...searchParams, 
//       parseInt(limit), 
//       parseInt(offset)
//     ];
    
//     console.log('🔍 Executing query:', query.replace(/\s+/g, ' ').trim());
//     console.log('🔍 Query params:', queryParams);
    
//     const [applications] = await db.query(query, queryParams);
    
//     // Get total count for pagination
//     const countQuery = `
//       SELECT COUNT(*) as total
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       WHERE sl.approval_status = ?
//         AND sl.application_type = ?
//         ${searchClause}
//     `;
    
//     const countParams = [status, applicationType, ...searchParams];
//     const [countResult] = await db.query(countQuery, countParams);
//     const total = countResult[0]?.total || 0;
    
//     // Process applications data
//     const processedApplications = (applications || []).map(app => ({
//       ...app,
//       answers: app.answers ? (() => {
//         try {
//           return JSON.parse(app.answers);
//         } catch (e) {
//           console.warn('Failed to parse answers JSON for application:', app.application_id);
//           return null;
//         }
//       })() : null,
//       additional_data: app.additional_data ? (() => {
//         try {
//           return JSON.parse(app.additional_data);
//         } catch (e) {
//           return null;
//         }
//       })() : null
//     }));
    
//     return {
//       applications: processedApplications,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: total,
//         totalPages: Math.ceil(total / limit),
//         hasNextPage: (parseInt(page) * parseInt(limit)) < total,
//         hasPrevPage: parseInt(page) > 1
//       },
//       filters: {
//         status,
//         stage,
//         search,
//         sortBy,
//         sortOrder
//       }
//     };
    
//   } catch (error) {
//     console.error('❌ Database error in getPendingApplicationsWithPagination:', error);
//     throw new Error(`Failed to fetch pending applications: ${error.message}`);
//   }
// };

// /**
//  * Get all reports for admin panel
//  * Enhanced with better filtering and pagination
//  */
// export const getAllReportsForAdmin = async (options = {}) => {
//   try {
//     const {
//       page = 1,
//       limit = 50,
//       status = null,
//       sortBy = 'createdAt',
//       sortOrder = 'DESC'
//     } = options;
    
//     const offset = (page - 1) * limit;
    
//     // Build status filter
//     let statusClause = '';
//     let statusParams = [];
    
//     if (status) {
//       statusClause = 'WHERE status = ?';
//       statusParams = [status];
//     }
    
//     // Validate sort parameters
//     const allowedSortFields = ['id', 'createdAt', 'status', 'reason'];
//     const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
//     const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? 
//       sortOrder.toUpperCase() : 'DESC';
    
//     const query = `
//       SELECT 
//         r.id,
//         r.reported_id,
//         r.reporter_id,
//         r.reason,
//         r.status,
//         r.createdAt,
//         r.updatedAt,
//         reported_user.username as reported_username,
//         reported_user.email as reported_email,
//         reporter_user.username as reporter_username,
//         reporter_user.email as reporter_email
//       FROM reports r
//       LEFT JOIN users reported_user ON r.reported_id = reported_user.id
//       LEFT JOIN users reporter_user ON r.reporter_id = reporter_user.id
//       ${statusClause}
//       ORDER BY ${safeSortBy} ${safeSortOrder}
//       LIMIT ? OFFSET ?
//     `;
    
//     const queryParams = [...statusParams, parseInt(limit), parseInt(offset)];
//     const [reports] = await db.query(query, queryParams);
    
//     // Get total count
//     const countQuery = `
//       SELECT COUNT(*) as total
//       FROM reports r
//       ${statusClause}
//     `;
    
//     const [countResult] = await db.query(countQuery, statusParams);
//     const total = countResult[0]?.total || 0;
    
//     return {
//       reports: reports || [],
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: total,
//         totalPages: Math.ceil(total / limit)
//       }
//     };
//   } catch (error) {
//     console.error('❌ Database error in getAllReportsForAdmin:', error);
//     throw new Error(`Failed to fetch reports: ${error.message}`);
//   }
// };

// /**
//  * Update application status with proper transaction handling
//  */
// export const updateApplicationStatusSafely = async (applicationId, status, reviewerId, adminNotes = null) => {
//   let connection = null;
  
//   try {
//     // Validate status
//     const validStatuses = ['approved', 'declined', 'pending', 'under_review'];
//     if (!validStatuses.includes(status)) {
//       throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
//     }
    
//     connection = await db.getConnection();
//     await connection.beginTransaction();
    
//     try {
//       // Update the application
//       await connection.query(`
//         UPDATE surveylog 
//         SET 
//           approval_status = ?,
//           reviewedAt = NOW(),
//           reviewed_by = ?,
//           admin_notes = ?,
//           updatedAt = NOW()
//         WHERE id = ?
//       `, [status, reviewerId, adminNotes, applicationId]);
      
//       // Log the action
//       await connection.query(`
//         INSERT INTO audit_logs (user_id, action, details, createdAt)
//         VALUES (?, 'application_status_updated', ?, NOW())
//       `, [reviewerId, JSON.stringify({
//         applicationId,
//         newStatus: status,
//         adminNotes,
//         timestamp: new Date().toISOString()
//       })]);
      
//       await connection.commit();
      
//       return {
//         success: true,
//         applicationId,
//         newStatus: status,
//         reviewedBy: reviewerId,
//         reviewedAt: new Date().toISOString()
//       };
      
//     } catch (error) {
//       await connection.rollback();
//       throw error;
//     }
    
//   } catch (error) {
//     console.error('❌ Error in updateApplicationStatusSafely:', error);
//     throw new Error(`Failed to update application status: ${error.message}`);
//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// };

// /**
//  * Get user statistics for dashboard
//  */
// export const getUserStatistics = async (userId) => {
//   try {
//     const [userStats] = await db.query(`
//       SELECT 
//         u.id,
//         u.username,
//         u.email,
//         u.membership_stage,
//         u.is_member,
//         u.role,
//         u.createdAt,
//         COUNT(sl.id) as total_applications,
//         COUNT(CASE WHEN sl.approval_status = 'approved' THEN 1 END) as approved_applications,
//         COUNT(CASE WHEN sl.approval_status = 'pending' THEN 1 END) as pending_applications,
//         fma.access_count,
//         fma.first_accessedAt,
//         fma.last_accessedAt
//       FROM users u
//       LEFT JOIN surveylog sl ON u.id = sl.user_id
//       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
//       WHERE u.id = ?
//       GROUP BY u.id, fma.access_count, fma.first_accessedAt, fma.last_accessedAt
//     `, [userId]);
    
//     return userStats[0] || null;
//   } catch (error) {
//     console.error('❌ Error in getUserStatistics:', error);
//     throw new Error(`Failed to fetch user statistics: ${error.message}`);
//   }
// };

// /**
//  * Bulk operations helper
//  */
// export const bulkUpdateApplications = async (applicationIds, status, reviewerId, adminNotes = null) => {
//   let connection = null;
  
//   try {
//     if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
//       throw new Error('Application IDs must be a non-empty array');
//     }
    
//     if (applicationIds.length > 100) {
//       throw new Error('Cannot process more than 100 applications at once');
//     }
    
//     connection = await db.getConnection();
//     await connection.beginTransaction();
    
//     const results = [];
    
//     try {
//       for (const appId of applicationIds) {
//         await connection.query(`
//           UPDATE surveylog 
//           SET 
//             approval_status = ?,
//             reviewedAt = NOW(),
//             reviewed_by = ?,
//             admin_notes = ?,
//             updatedAt = NOW()
//           WHERE id = ?
//         `, [status, reviewerId, adminNotes, appId]);
        
//         results.push({ applicationId: appId, status, reviewerId });
//       }
      
//       // Log bulk operation
//       await connection.query(`
//         INSERT INTO audit_logs (user_id, action, details, createdAt)
//         VALUES (?, 'bulk_application_update', ?, NOW())
//       `, [reviewerId, JSON.stringify({
//         applicationIds,
//         newStatus: status,
//         adminNotes,
//         count: applicationIds.length,
//         timestamp: new Date().toISOString()
//       })]);
      
//       await connection.commit();
      
//       return {
//         success: true,
//         processedCount: results.length,
//         results
//       };
      
//     } catch (error) {
//       await connection.rollback();
//       throw error;
//     }
    
//   } catch (error) {
//     console.error('❌ Error in bulkUpdateApplications:', error);
//     throw new Error(`Failed to bulk update applications: ${error.message}`);
//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// };

// // Default export for backward compatibility
// export default {
//   getPendingApplicationsWithPagination,
//   getAllReportsForAdmin,
//   updateApplicationStatusSafely,
//   getUserStatistics,
//   bulkUpdateApplications
// };





// //ikootaapi\services\membershipServices.js
// import db from '../config/db.js';

// // Get pending applications with pagination and filtering
// export const getPendingApplicationsWithPagination = async (options) => {
//   try {
//     const { page, limit, status, search, sortBy, sortOrder, stage } = options;
//     const offset = (page - 1) * limit;
//     const applicationType = stage === 'initial' ? 'initial_application' : 'full_membership';
    
//     // Build search conditions (matching old version exactly)
//     let searchClause = '';
//     let searchParams = [];
    
//     if (search) {
//       searchClause = 'AND (u.username LIKE ? OR u.email LIKE ?)';
//       searchParams = [`%${search}%`, `%${search}%`];
//     }
    
//     // Build the query with all fields from both versions
//     const selectFields = `
//       u.id as user_id,
//       u.username,
//       u.email,
//       u.phone,
//       u.membership_stage,
//       sl.id as application_id,
//       sl.answers,
//       sl.createdAt as submittedAt,
//       sl.application_ticket,
//       sl.additional_data,
//       sl.admin_notes,
//       sl.approval_status as status,
//       sl.application_type,
//       DATEDIFF(NOW(), sl.createdAt) as days_pending,
//       fma.first_accessedAt,
//       fma.access_count
//     `;
    
//     // Main query with proper type casting
//     const query = `
//       SELECT ${selectFields}
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       LEFT JOIN full_membership_access fma ON u.id = fma.user_id
//       WHERE sl.approval_status = ?
//         AND sl.application_type = ?
//         ${searchClause}
//       ORDER BY ${sortBy === 'submittedAt' ? 'sl.createdAt' : sortBy} ${sortOrder}
//       LIMIT ? OFFSET ?
//     `;
    
//     const queryParams = [status, applicationType, ...searchParams, parseInt(limit), offset];
    
//     console.log('🔍 Executing query:', query.replace(/\s+/g, ' ').trim());
    
//     const [applications] = await db.query(query, queryParams);
    
//     // Get total count for pagination
//     const countQuery = `
//       SELECT COUNT(*) as total
//       FROM surveylog sl
//       JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
//       WHERE sl.approval_status = ?
//         AND sl.application_type = ?
//         ${searchClause}
//     `;
    
//     const countParams = [status, applicationType, ...searchParams];
//     const [countResult] = await db.query(countQuery, countParams);
//     const total = countResult[0]?.total || 0;
    
//     return {
//       applications: applications || [],
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: total,
//         totalPages: Math.ceil(total / limit)
//       }
//     };
    
//   } catch (error) {
//     console.error('❌ Database error in getPendingApplicationsWithPagination:', error);
//     throw new Error(`Failed to fetch pending applications: ${error.message}`);
//   }
// };

// // Get all reports for admin panel
// export const getAllReportsForAdmin = async () => {
//   try {
//     const [reports] = await db.query(`
//       SELECT 
//         id, reported_id, reporter_id, reason, status, createdAt
//       FROM reports 
//       ORDER BY createdAt DESC
//     `);
    
//     return reports;
//   } catch (error) {
//     console.error('❌ Database error in getAllReportsForAdmin:', error);
//     throw new Error(`Failed to fetch reports: ${error.message}`);
//   }
// };

// // Default export for backward compatibility
// export default {
//   getPendingApplicationsWithPagination,
//   getAllReportsForAdmin
// };

