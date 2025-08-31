// import query from '../config/database.js';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import crypto from 'crypto';
// import { v4 as uuidv4 } from 'uuid';

// class adminServices {
//   // ==================== DASHBOARD & ANALYTICS ====================
  
//   async getDashboardStats() {
//     try {
//       const stats = {};
      
//       // Get user statistics
//       const userStats = await query(
//         `SELECT 
//           COUNT(*) as totalUsers,
//           COUNT(CASE WHEN isActive = 1 THEN 1 END) as activeUsers,
//           COUNT(CASE WHEN isVerified = 1 THEN 1 END) as verifiedUsers,
//           COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as newUsersLast30Days,
//           COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as newUsersLast7Days
//         FROM users`
//       );
//       stats.users = userStats[0];
      
//       // Get application statistics
//       const appStats = await query(
//         `SELECT 
//           COUNT(*) as totalApplications,
//           COUNT(CASE WHEN status = 'approved' THEN 1 END) as approvedApplications,
//           COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingApplications,
//           COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejectedApplications,
//           COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as applicationsLast30Days
//         FROM applications`
//       );
//       stats.applications = appStats[0];
      
//       // Get content statistics
//       const contentStats = await query(
//         `SELECT 
//           COUNT(*) as totalPosts,
//           COUNT(CASE WHEN status = 'published' THEN 1 END) as publishedPosts,
//           COUNT(CASE WHEN status = 'draft' THEN 1 END) as draftPosts,
//           COUNT(CASE WHEN isFlagged = 1 THEN 1 END) as flaggedPosts
//         FROM posts`
//       );
//       stats.content = contentStats[0];
      
//       // Get moderation statistics
//       const moderationStats = await query(
//         `SELECT 
//           COUNT(*) as totalReports,
//           COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingReports,
//           COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolvedReports,
//           COUNT(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as reportsLast24Hours
//         FROM content_reports`
//       );
//       stats.moderation = moderationStats[0];
      
//       // Get activity statistics
//       const activityStats = await query(
//         `SELECT 
//           COUNT(DISTINCT userId) as dailyActiveUsers,
//           COUNT(*) as totalActivities
//         FROM user_activities 
//         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
//       );
//       stats.activity = activityStats[0];
      
//       // Get growth metrics
//       const growthData = await query(
//         `SELECT 
//           DATE(createdAt) as date,
//           COUNT(*) as newUsers
//         FROM users
//         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//         GROUP BY DATE(createdAt)
//         ORDER BY date ASC`
//       );
//       stats.growth = growthData;
      
//       return stats;
//     } catch (error) {
//       console.error('Error getting dashboard stats:', error);
//       throw error;
//     }
//   }

//   async getAnalytics(period = '30d') {
//     try {
//       let interval;
//       switch(period) {
//         case '7d': interval = '7 DAY'; break;
//         case '30d': interval = '30 DAY'; break;
//         case '90d': interval = '90 DAY'; break;
//         case '1y': interval = '1 YEAR'; break;
//         default: interval = '30 DAY';
//       }
      
//       // User growth analytics
//       const userGrowth = await query(
//         `SELECT 
//           DATE(createdAt) as date,
//           COUNT(*) as newUsers,
//           COUNT(CASE WHEN isVerified = 1 THEN 1 END) as verifiedUsers
//         FROM users
//         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${interval})
//         GROUP BY DATE(createdAt)
//         ORDER BY date ASC`
//       );
      
//       // Activity analytics
//       const activityData = await query(
//         `SELECT 
//           DATE(createdAt) as date,
//           COUNT(DISTINCT userId) as activeUsers,
//           COUNT(*) as totalActions
//         FROM user_activities
//         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${interval})
//         GROUP BY DATE(createdAt)
//         ORDER BY date ASC`
//       );
      
//       // Content analytics
//       const contentData = await query(
//         `SELECT 
//           DATE(createdAt) as date,
//           COUNT(*) as newPosts,
//           AVG(viewCount) as avgViews,
//           AVG(likeCount) as avgLikes
//         FROM posts
//         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${interval})
//         GROUP BY DATE(createdAt)
//         ORDER BY date ASC`
//       );
      
//       // Application analytics
//       const applicationData = await query(
//         `SELECT 
//           DATE(createdAt) as date,
//           COUNT(*) as totalApplications,
//           COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
//           COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
//         FROM applications
//         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${interval})
//         GROUP BY DATE(createdAt)
//         ORDER BY date ASC`
//       );
      
//       return {
//         period,
//         userGrowth,
//         activityData,
//         contentData,
//         applicationData,
//         summary: {
//           totalNewUsers: userGrowth.reduce((sum, day) => sum + day.newUsers, 0),
//           totalActiveUsers: activityData.reduce((sum, day) => sum + day.activeUsers, 0),
//           totalNewContent: contentData.reduce((sum, day) => sum + day.newPosts, 0),
//           totalApplications: applicationData.reduce((sum, day) => sum + day.totalApplications, 0)
//         }
//       };
//     } catch (error) {
//       console.error('Error getting analytics:', error);
//       throw error;
//     }
//   }

//   async getRecentActivities(limit = 50) {
//     try {
//       const activities = await query(
//         `SELECT 
//           a.*,
//           u.username,
//           u.email,
//           u.profilePicture
//         FROM user_activities a
//         JOIN users u ON a.userId = u.id
//         ORDER BY a.createdAt DESC
//         LIMIT ?`,
//         [limit]
//       );
      
//       return activities;
//     } catch (error) {
//       console.error('Error getting recent activities:', error);
//       throw error;
//     }
//   }

//   async getSystemHealth() {
//     try {
//       // Database connection check
//       const dbCheck = await query('SELECT 1 as healthy');
      
//       // Get system metrics
//       const metrics = {
//         database: dbCheck.length > 0 ? 'healthy' : 'unhealthy',
//         timestamp: new Date().toISOString(),
//         uptime: process.uptime(),
//         memory: process.memoryUsage(),
//         activeConnections: await this.getActiveConnectionCount(),
//         queuedJobs: await this.getQueuedJobCount(),
//         errorRate: await this.getErrorRate(),
//         responseTime: await this.getAverageResponseTime()
//       };
      
//       return metrics;
//     } catch (error) {
//       console.error('Error checking system health:', error);
//       throw error;
//     }
//   }

//   // ==================== USER MANAGEMENT ====================
  
//   async getAllUsers(filters = {}) {
//     try {
//       let sql = `
//         SELECT 
//           u.*,
//           r.name as roleName,
//           COUNT(DISTINCT p.id) as postCount,
//           COUNT(DISTINCT c.id) as commentCount
//         FROM users u
//         LEFT JOIN roles r ON u.roleId = r.id
//         LEFT JOIN posts p ON u.id = p.userId
//         LEFT JOIN comments c ON u.id = c.userId
//         WHERE 1=1
//       `;
      
//       const params = [];
      
//       // Apply filters
//       if (filters.role) {
//         sql += ' AND u.roleId = ?';
//         params.push(filters.role);
//       }
      
//       if (filters.status) {
//         if (filters.status === 'active') {
//           sql += ' AND u.isActive = 1';
//         } else if (filters.status === 'inactive') {
//           sql += ' AND u.isActive = 0';
//         } else if (filters.status === 'verified') {
//           sql += ' AND u.isVerified = 1';
//         } else if (filters.status === 'unverified') {
//           sql += ' AND u.isVerified = 0';
//         }
//       }
      
//       if (filters.search) {
//         sql += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.firstName LIKE ? OR u.lastName LIKE ?)';
//         const searchTerm = `%${filters.search}%`;
//         params.push(searchTerm, searchTerm, searchTerm, searchTerm);
//       }
      
//       if (filters.dateFrom) {
//         sql += ' AND u.createdAt >= ?';
//         params.push(filters.dateFrom);
//       }
      
//       if (filters.dateTo) {
//         sql += ' AND u.createdAt <= ?';
//         params.push(filters.dateTo);
//       }
      
//       sql += ' GROUP BY u.id';
      
//       // Apply sorting
//       const sortColumn = filters.sortBy || 'createdAt';
//       const sortOrder = filters.sortOrder || 'DESC';
//       sql += ` ORDER BY u.${sortColumn} ${sortOrder}`;
      
//       // Apply pagination
//       if (filters.limit) {
//         const limit = parseInt(filters.limit) || 50;
//         const offset = parseInt(filters.offset) || 0;
//         sql += ` LIMIT ${limit} OFFSET ${offset}`;
//       }
      
//       const users = await query(sql, params);
      
//       // Get total count for pagination
//       const countSql = `
//         SELECT COUNT(DISTINCT u.id) as total
//         FROM users u
//         LEFT JOIN roles r ON u.roleId = r.id
//         WHERE 1=1
//       `;
      
//       const totalResult = await query(countSql, params.slice(0, params.length - 2));
      
//       return {
//         users,
//         total: totalResult[0].total,
//         page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
//         pageSize: filters.limit || 50
//       };
//     } catch (error) {
//       console.error('Error getting all users:', error);
//       throw error;
//     }
//   }

//   async getUserById(userId) {
//     try {
//       const user = await query(
//         `SELECT 
//           u.*,
//           r.name as roleName,
//           r.permissions
//         FROM users u
//         LEFT JOIN roles r ON u.roleId = r.id
//         WHERE u.id = ?`,
//         [userId]
//       );
      
//       if (!user.length) {
//         throw new Error('User not found');
//       }
      
//       // Get user's activity summary
//       const activity = await query(
//         `SELECT 
//           COUNT(DISTINCT CASE WHEN type = 'post' THEN targetId END) as totalPosts,
//           COUNT(DISTINCT CASE WHEN type = 'comment' THEN targetId END) as totalComments,
//           COUNT(DISTINCT CASE WHEN type = 'like' THEN targetId END) as totalLikes,
//           MAX(createdAt) as lastActivity
//         FROM user_activities
//         WHERE userId = ?`,
//         [userId]
//       );
      
//       // Get user's applications
//       const applications = await query(
//         `SELECT * FROM applications WHERE userId = ? ORDER BY createdAt DESC`,
//         [userId]
//       );
      
//       // Get user's recent posts
//       const recentPosts = await query(
//         `SELECT 
//           id, title, status, viewCount, likeCount, createdAt
//         FROM posts 
//         WHERE userId = ? 
//         ORDER BY createdAt DESC 
//         LIMIT 5`,
//         [userId]
//       );
      
//       return {
//         ...user[0],
//         activity: activity[0],
//         applications,
//         recentPosts
//       };
//     } catch (error) {
//       console.error('Error getting user by ID:', error);
//       throw error;
//     }
//   }

//   async updateUser(userId, updates) {
//     try {
//       // Build dynamic update query
//       const updateFields = [];
//       const params = [];
      
//       const allowedFields = [
//         'username', 'email', 'firstName', 'lastName', 'phoneNumber',
//         'bio', 'profilePicture', 'coverImage', 'location', 'website',
//         'isActive', 'isVerified', 'isBanned', 'canPost', 'canComment',
//         'canMentor', 'roleId', 'settings'
//       ];
      
//       for (const field of allowedFields) {
//         if (updates[field] !== undefined) {
//           updateFields.push(`${field} = ?`);
//           params.push(updates[field]);
//         }
//       }
      
//       if (updateFields.length === 0) {
//         throw new Error('No valid update fields provided');
//       }
      
//       params.push(userId);
      
//       const result = await query(
//         `UPDATE users SET ${updateFields.join(', ')}, updatedAt = NOW() WHERE id = ?`,
//         params
//       );
      
//       // Log the admin action
//       await this.logAdminAction('UPDATE_USER', userId, updates);
      
//       return result;
//     } catch (error) {
//       console.error('Error updating user:', error);
//       throw error;
//     }
//   }

//   async deleteUser(userId, softDelete = true) {
//     try {
//       if (softDelete) {
//         // Soft delete - mark as deleted
//         await query(
//           `UPDATE users SET isDeleted = 1, isActive = 0, deletedAt = NOW() WHERE id = ?`,
//           [userId]
//         );
//       } else {
//         // Hard delete - permanently remove
//         // First delete related data
//         await query('DELETE FROM user_activities WHERE userId = ?', [userId]);
//         await query('DELETE FROM posts WHERE userId = ?', [userId]);
//         await query('DELETE FROM comments WHERE userId = ?', [userId]);
//         await query('DELETE FROM applications WHERE userId = ?', [userId]);
        
//         // Then delete the user
//         await query('DELETE FROM users WHERE id = ?', [userId]);
//       }
      
//       await this.logAdminAction(softDelete ? 'SOFT_DELETE_USER' : 'HARD_DELETE_USER', userId);
      
//       return { success: true, message: 'User deleted successfully' };
//     } catch (error) {
//       console.error('Error deleting user:', error);
//       throw error;
//     }
//   }

//   async banUser(userId, reason, duration = null) {
//     try {
//       const banExpiresAt = duration ? 
//         new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;
      
//       await query(
//         `UPDATE users 
//         SET isBanned = 1, 
//             banReason = ?, 
//             banExpiresAt = ?,
//             isActive = 0,
//             updatedAt = NOW()
//         WHERE id = ?`,
//         [reason, banExpiresAt, userId]
//       );
      
//       // Create ban record
//       await query(
//         `INSERT INTO user_bans (userId, reason, bannedBy, expiresAt)
//         VALUES (?, ?, ?, ?)`,
//         [userId, reason, 'admin', banExpiresAt]
//       );
      
//       await this.logAdminAction('BAN_USER', userId, { reason, duration });
      
//       return { success: true, message: 'User banned successfully' };
//     } catch (error) {
//       console.error('Error banning user:', error);
//       throw error;
//     }
//   }

//   async unbanUser(userId) {
//     try {
//       await query(
//         `UPDATE users 
//         SET isBanned = 0, 
//             banReason = NULL, 
//             banExpiresAt = NULL,
//             isActive = 1,
//             updatedAt = NOW()
//         WHERE id = ?`,
//         [userId]
//       );
      
//       // Update ban record
//       await query(
//         `UPDATE user_bans 
//         SET unbannedAt = NOW(), unbannedBy = 'admin'
//         WHERE userId = ? AND unbannedAt IS NULL`,
//         [userId]
//       );
      
//       await this.logAdminAction('UNBAN_USER', userId);
      
//       return { success: true, message: 'User unbanned successfully' };
//     } catch (error) {
//       console.error('Error unbanning user:', error);
//       throw error;
//     }
//   }

//   async resetUserPassword(userId) {
//     try {
//       // Generate temporary password
//       const tempPassword = crypto.randomBytes(8).toString('hex');
//       const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
//       await query(
//         `UPDATE users 
//         SET password = ?, 
//             requirePasswordChange = 1,
//             updatedAt = NOW()
//         WHERE id = ?`,
//         [hashedPassword, userId]
//       );
      
//       await this.logAdminAction('RESET_USER_PASSWORD', userId);
      
//       return { 
//         success: true, 
//         message: 'Password reset successfully',
//         tempPassword 
//       };
//     } catch (error) {
//       console.error('Error resetting user password:', error);
//       throw error;
//     }
//   }

//   // ==================== APPLICATION MANAGEMENT ====================
  
//   async getAllApplications(filters = {}) {
//     try {
//       let sql = `
//         SELECT 
//           a.*,
//           u.username,
//           u.email,
//           u.firstName,
//           u.lastName,
//           u.profilePicture
//         FROM applications a
//         JOIN users u ON a.userId = u.id
//         WHERE 1=1
//       `;
      
//       const params = [];
      
//       if (filters.status) {
//         sql += ' AND a.status = ?';
//         params.push(filters.status);
//       }
      
//       if (filters.type) {
//         sql += ' AND a.type = ?';
//         params.push(filters.type);
//       }
      
//       if (filters.search) {
//         sql += ' AND (u.username LIKE ? OR u.email LIKE ? OR a.id LIKE ?)';
//         const searchTerm = `%${filters.search}%`;
//         params.push(searchTerm, searchTerm, searchTerm);
//       }
      
//       sql += ' ORDER BY a.createdAt DESC';
      
//       if (filters.limit) {
//         sql += ' LIMIT ? OFFSET ?';
//         params.push(parseInt(filters.limit), parseInt(filters.offset) || 0);
//       }
      
//       const applications = await query(sql, params);
      
//       return applications;
//     } catch (error) {
//       console.error('Error getting applications:', error);
//       throw error;
//     }
//   }

//   async updateApplicationStatus(applicationId, status, reviewNotes = '') {
//     try {
//       const validStatuses = ['pending', 'approved', 'rejected', 'on-hold'];
//       if (!validStatuses.includes(status)) {
//         throw new Error('Invalid application status');
//       }
      
//       await query(
//         `UPDATE applications 
//         SET status = ?, 
//             reviewNotes = ?,
//             reviewedBy = 'admin',
//             reviewedAt = NOW(),
//             updatedAt = NOW()
//         WHERE id = ?`,
//         [status, reviewNotes, applicationId]
//       );
      
//       // If approved, update user permissions
//       if (status === 'approved') {
//         const application = await query(
//           'SELECT userId, type FROM applications WHERE id = ?',
//           [applicationId]
//         );
        
//         if (application[0].type === 'mentor') {
//           await query(
//             'UPDATE users SET canMentor = 1 WHERE id = ?',
//             [application[0].userId]
//           );
//         }
//       }
      
//       await this.logAdminAction('UPDATE_APPLICATION_STATUS', applicationId, { status, reviewNotes });
      
//       return { success: true, message: 'Application status updated' };
//     } catch (error) {
//       console.error('Error updating application status:', error);
//       throw error;
//     }
//   }

//   async getApplicationDetails(applicationId) {
//     try {
//       const application = await query(
//         `SELECT 
//           a.*,
//           u.username,
//           u.email,
//           u.firstName,
//           u.lastName,
//           u.profilePicture,
//           u.bio,
//           u.createdAt as userCreatedAt
//         FROM applications a
//         JOIN users u ON a.userId = u.id
//         WHERE a.id = ?`,
//         [applicationId]
//       );
      
//       if (!application.length) {
//         throw new Error('Application not found');
//       }
      
//       // Get user's previous applications
//       const previousApplications = await query(
//         `SELECT id, type, status, createdAt 
//         FROM applications 
//         WHERE userId = ? AND id != ?
//         ORDER BY createdAt DESC`,
//         [application[0].userId, applicationId]
//       );
      
//       return {
//         ...application[0],
//         previousApplications
//       };
//     } catch (error) {
//       console.error('Error getting application details:', error);
//       throw error;
//     }
//   }

//   // ==================== CONTENT MODERATION ====================
  
//   async getFlaggedContent(filters = {}) {
//     try {
//       let sql = `
//         SELECT 
//           p.*,
//           u.username,
//           u.email,
//           COUNT(r.id) as reportCount,
//           GROUP_CONCAT(DISTINCT r.reason) as reportReasons
//         FROM posts p
//         JOIN users u ON p.userId = u.id
//         LEFT JOIN content_reports r ON p.id = r.contentId AND r.contentType = 'post'
//         WHERE p.isFlagged = 1
//       `;
      
//       const params = [];
      
//       if (filters.status) {
//         sql += ' AND p.status = ?';
//         params.push(filters.status);
//       }
      
//       sql += ' GROUP BY p.id ORDER BY reportCount DESC, p.createdAt DESC';
      
//       if (filters.limit) {
//         sql += ' LIMIT ? OFFSET ?';
//         params.push(parseInt(filters.limit), parseInt(filters.offset) || 0);
//       }
      
//       const flaggedContent = await query(sql, params);
      
//       return flaggedContent;
//     } catch (error) {
//       console.error('Error getting flagged content:', error);
//       throw error;
//     }
//   }

//   async moderateContent(contentId, action, moderatorNotes = '') {
//     try {
//       const validActions = ['approve', 'remove', 'flag', 'unflag'];
//       if (!validActions.includes(action)) {
//         throw new Error('Invalid moderation action');
//       }
      
//       let updateQuery;
//       const params = [moderatorNotes, contentId];
      
//       switch(action) {
//         case 'approve':
//           updateQuery = `UPDATE posts 
//             SET isFlagged = 0, status = 'published', moderatorNotes = ?
//             WHERE id = ?`;
//           break;
//         case 'remove':
//           updateQuery = `UPDATE posts 
//             SET status = 'removed', moderatorNotes = ?
//             WHERE id = ?`;
//           break;
//         case 'flag':
//           updateQuery = `UPDATE posts 
//             SET isFlagged = 1, moderatorNotes = ?
//             WHERE id = ?`;
//           break;
//         case 'unflag':
//           updateQuery = `UPDATE posts 
//             SET isFlagged = 0, moderatorNotes = ?
//             WHERE id = ?`;
//           break;
//       }
      
//       await query(updateQuery, params);
      
//       // Update related reports
//       if (action === 'approve' || action === 'remove') {
//         await query(
//           `UPDATE content_reports 
//           SET status = 'resolved', 
//               resolvedBy = 'admin',
//               resolvedAt = NOW(),
//               resolution = ?
//           WHERE contentId = ? AND contentType = 'post'`,
//           [action, contentId]
//         );
//       }
      
//       await this.logAdminAction('MODERATE_CONTENT', contentId, { action, moderatorNotes });
      
//       return { success: true, message: 'Content moderated successfully' };
//     } catch (error) {
//       console.error('Error moderating content:', error);
//       throw error;
//     }
//   }

//   async getReports(filters = {}) {
//     try {
//       let sql = `
//         SELECT 
//           r.*,
//           u.username as reporterUsername,
//           u.email as reporterEmail,
//           CASE 
//             WHEN r.contentType = 'post' THEN p.title
//             WHEN r.contentType = 'comment' THEN c.content
//             ELSE NULL
//           END as contentPreview
//         FROM content_reports r
//         JOIN users u ON r.reportedBy = u.id
//         LEFT JOIN posts p ON r.contentId = p.id AND r.contentType = 'post'
//         LEFT JOIN comments c ON r.contentId = c.id AND r.contentType = 'comment'
//         WHERE 1=1
//       `;
      
//       const params = [];
      
//       if (filters.status) {
//         sql += ' AND r.status = ?';
//         params.push(filters.status);
//       }
      
//       if (filters.contentType) {
//         sql += ' AND r.contentType = ?';
//         params.push(filters.contentType);
//       }
      
//       sql += ' ORDER BY r.createdAt DESC';
      
//       if (filters.limit) {
//         sql += ' LIMIT ? OFFSET ?';
//         params.push(parseInt(filters.limit), parseInt(filters.offset) || 0);
//       }
      
//       const reports = await query(sql, params);
      
//       return reports;
//     } catch (error) {
//       console.error('Error getting reports:', error);
//       throw error;
//     }
//   }

//   async resolveReport(reportId, resolution, notes = '') {
//     try {
//       await query(
//         `UPDATE content_reports 
//         SET status = 'resolved',
//             resolution = ?,
//             resolvedBy = 'admin',
//             resolvedAt = NOW(),
//             notes = ?
//         WHERE id = ?`,
//         [resolution, notes, reportId]
//       );
      
//       await this.logAdminAction('RESOLVE_REPORT', reportId, { resolution, notes });
      
//       return { success: true, message: 'Report resolved successfully' };
//     } catch (error) {
//       console.error('Error resolving report:', error);
//       throw error;
//     }
//   }

//   // ==================== USER PERMISSIONS & ROLES ====================
  
//   async updateUserRole(userId, roleId) {
//     try {
//       // Verify role exists
//       const role = await query('SELECT * FROM roles WHERE id = ?', [roleId]);
//       if (!role.length) {
//         throw new Error('Invalid role ID');
//       }
      
//       await query(
//         'UPDATE users SET roleId = ?, updatedAt = NOW() WHERE id = ?',
//         [roleId, userId]
//       );
      
//       await this.logAdminAction('UPDATE_USER_ROLE', userId, { roleId, roleName: role[0].name });
      
//       return { success: true, message: 'User role updated successfully' };
//     } catch (error) {
//       console.error('Error updating user role:', error);
//       throw error;
//     }
//   }

//   async updateUserPermissions(userId, permissions) {
//     try {
//       const updateFields = [];
//       const params = [];
      
//       const permissionFields = ['canPost', 'canComment', 'canMentor', 'canModerate'];
      
//       for (const field of permissionFields) {
//         if (permissions[field] !== undefined) {
//           updateFields.push(`${field} = ?`);
//           params.push(permissions[field] ? 1 : 0);
//         }
//       }
      
//       if (updateFields.length === 0) {
//         throw new Error('No valid permission fields provided');
//       }
      
//       params.push(userId);
      
//       await query(
//         `UPDATE users SET ${updateFields.join(', ')}, updatedAt = NOW() WHERE id = ?`,
//         params
//       );
      
//       await this.logAdminAction('UPDATE_USER_PERMISSIONS', userId, permissions);
      
//       return { success: true, message: 'User permissions updated successfully' };
//     } catch (error) {
//       console.error('Error updating user permissions:', error);
//       throw error;
//     }
//   }

//   async getAllRoles() {
//     try {
//       const roles = await query(
//         `SELECT 
//           r.*,
//           COUNT(u.id) as userCount
//         FROM roles r
//         LEFT JOIN users u ON r.id = u.roleId
//         GROUP BY r.id
//         ORDER BY r.level ASC`
//       );
      
//       return roles;
//     } catch (error) {
//       console.error('Error getting all roles:', error);
//       throw error;
//     }
//   }

//   async createRole(roleData) {
//     try {
//       const { name, description, permissions, level } = roleData;
      
//       const result = await query(
//         `INSERT INTO roles (name, description, permissions, level)
//         VALUES (?, ?, ?, ?)`,
//         [name, description, JSON.stringify(permissions), level]
//       );
      
//       await this.logAdminAction('CREATE_ROLE', result.insertId, roleData);
      
//       return { 
//         success: true, 
//         message: 'Role created successfully',
//         roleId: result.insertId 
//       };
//     } catch (error) {
//       console.error('Error creating role:', error);
//       throw error;
//     }
//   }

//   // ==================== BULK OPERATIONS ====================
  
//   async bulkUpdateUsers(userIds, updates) {
//     try {
//       const updateFields = [];
//       const params = [];
      
//       for (const [field, value] of Object.entries(updates)) {
//         updateFields.push(`${field} = ?`);
//         params.push(value);
//       }
      
//       const placeholders = userIds.map(() => '?').join(',');
//       params.push(...userIds);
      
//       const result = await query(
//         `UPDATE users 
//         SET ${updateFields.join(', ')}, updatedAt = NOW()
//         WHERE id IN (${placeholders})`,
//         params
//       );
      
//       await this.logAdminAction('BULK_UPDATE_USERS', userIds, updates);
      
//       return { 
//         success: true, 
//         message: `${result.affectedRows} users updated successfully` 
//       };
//     } catch (error) {
//       console.error('Error in bulk update users:', error);
//       throw error;
//     }
//   }

//   async bulkDeleteUsers(userIds, softDelete = true) {
//     try {
//       const placeholders = userIds.map(() => '?').join(',');
      
//       if (softDelete) {
//         await query(
//           `UPDATE users 
//           SET isDeleted = 1, isActive = 0, deletedAt = NOW()
//           WHERE id IN (${placeholders})`,
//           userIds
//         );
//       } else {
//         // Delete related data first
//         await query(`DELETE FROM user_activities WHERE userId IN (${placeholders})`, userIds);
//         await query(`DELETE FROM posts WHERE userId IN (${placeholders})`, userIds);
//         await query(`DELETE FROM comments WHERE userId IN (${placeholders})`, userIds);
//         await query(`DELETE FROM applications WHERE userId IN (${placeholders})`, userIds);
        
//         // Then delete users
//         await query(`DELETE FROM users WHERE id IN (${placeholders})`, userIds);
//       }
      
//       await this.logAdminAction('BULK_DELETE_USERS', userIds, { softDelete });
      
//       return { 
//         success: true, 
//         message: `${userIds.length} users deleted successfully` 
//       };
//     } catch (error) {
//       console.error('Error in bulk delete users:', error);
//       throw error;
//     }
//   }

//   async bulkModerateContent(contentIds, action, moderatorNotes = '') {
//     try {
//       const placeholders = contentIds.map(() => '?').join(',');
//       let updateQuery;
//       const params = [];
      
//       switch(action) {
//         case 'approve':
//           updateQuery = `UPDATE posts 
//             SET isFlagged = 0, status = 'published', moderatorNotes = ?
//             WHERE id IN (${placeholders})`;
//           params.push(moderatorNotes, ...contentIds);
//           break;
//         case 'remove':
//           updateQuery = `UPDATE posts 
//             SET status = 'removed', moderatorNotes = ?
//             WHERE id IN (${placeholders})`;
//           params.push(moderatorNotes, ...contentIds);
//           break;
//         case 'flag':
//           updateQuery = `UPDATE posts 
//             SET isFlagged = 1, moderatorNotes = ?
//             WHERE id IN (${placeholders})`;
//           params.push(moderatorNotes, ...contentIds);
//           break;
//       }
      
//       const result = await query(updateQuery, params);
      
//       await this.logAdminAction('BULK_MODERATE_CONTENT', contentIds, { action, moderatorNotes });
      
//       return { 
//         success: true, 
//         message: `${result.affectedRows} posts moderated successfully` 
//       };
//     } catch (error) {
//       console.error('Error in bulk moderate content:', error);
//       throw error;
//     }
//   }

//   // ==================== IDENTITY MANAGEMENT ====================
  
//   async verifyUserIdentity(userId, verificationType = 'manual') {
//     try {
//       await query(
//         `UPDATE users 
//         SET isVerified = 1, 
//             verifiedAt = NOW(),
//             verificationType = ?,
//             updatedAt = NOW()
//         WHERE id = ?`,
//         [verificationType, userId]
//       );
      
//       // Create verification record
//       await query(
//         `INSERT INTO user_verifications (userId, type, verifiedBy, verifiedAt)
//         VALUES (?, ?, 'admin', NOW())`,
//         [userId, verificationType]
//       );
      
//       await this.logAdminAction('VERIFY_USER_IDENTITY', userId, { verificationType });
      
//       return { success: true, message: 'User identity verified successfully' };
//     } catch (error) {
//       console.error('Error verifying user identity:', error);
//       throw error;
//     }
//   }

//   async revokeUserVerification(userId, reason) {
//     try {
//       await query(
//         `UPDATE users 
//         SET isVerified = 0, 
//             verifiedAt = NULL,
//             verificationType = NULL,
//             updatedAt = NOW()
//         WHERE id = ?`,
//         [userId]
//       );
      
//       // Update verification record
//       await query(
//         `UPDATE user_verifications 
//         SET revokedAt = NOW(), 
//             revokedBy = 'admin',
//             revokeReason = ?
//         WHERE userId = ? AND revokedAt IS NULL`,
//         [reason, userId]
//       );
      
//       await this.logAdminAction('REVOKE_USER_VERIFICATION', userId, { reason });
      
//       return { success: true, message: 'User verification revoked successfully' };
//     } catch (error) {
//       console.error('Error revoking user verification:', error);
//       throw error;
//     }
//   }

//   async getVerificationRequests(status = 'pending') {
//     try {
//       const requests = await query(
//         `SELECT 
//           vr.*,
//           u.username,
//           u.email,
//           u.firstName,
//           u.lastName,
//           u.profilePicture
//         FROM verification_requests vr
//         JOIN users u ON vr.userId = u.id
//         WHERE vr.status = ?
//         ORDER BY vr.createdAt DESC`,
//         [status]
//       );
      
//       return requests;
//     } catch (error) {
//       console.error('Error getting verification requests:', error);
//       throw error;
//     }
//   }

//   async processVerificationRequest(requestId, decision, notes = '') {
//     try {
//       const validDecisions = ['approve', 'reject', 'request-info'];
//       if (!validDecisions.includes(decision)) {
//         throw new Error('Invalid verification decision');
//       }
      
//       // Get request details
//       const request = await query(
//         'SELECT * FROM verification_requests WHERE id = ?',
//         [requestId]
//       );
      
//       if (!request.length) {
//         throw new Error('Verification request not found');
//       }
      
//       // Update request status
//       await query(
//         `UPDATE verification_requests 
//         SET status = ?,
//             reviewedBy = 'admin',
//             reviewedAt = NOW(),
//             reviewNotes = ?
//         WHERE id = ?`,
//         [decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'pending', notes, requestId]
//       );
      
//       // If approved, verify the user
//       if (decision === 'approve') {
//         await this.verifyUserIdentity(request[0].userId, 'document');
//       }
      
//       await this.logAdminAction('PROCESS_VERIFICATION_REQUEST', requestId, { decision, notes });
      
//       return { success: true, message: 'Verification request processed successfully' };
//     } catch (error) {
//       console.error('Error processing verification request:', error);
//       throw error;
//     }
//   }

//   async checkDuplicateAccounts(userId) {
//     try {
//       const user = await query('SELECT * FROM users WHERE id = ?', [userId]);
//       if (!user.length) {
//         throw new Error('User not found');
//       }
      
//       // Check for same email domain
//       const emailDomain = user[0].email.split('@')[1];
//       const sameEmailDomain = await query(
//         `SELECT id, username, email, createdAt 
//         FROM users 
//         WHERE email LIKE ? AND id != ?`,
//         [`%@${emailDomain}`, userId]
//       );
      
//       // Check for similar usernames
//       const similarUsernames = await query(
//         `SELECT id, username, email, createdAt 
//         FROM users 
//         WHERE username LIKE ? AND id != ?`,
//         [`%${user[0].username.substring(0, 5)}%`, userId]
//       );
      
//       // Check for same IP address (if tracked)
//       const sameIP = await query(
//         `SELECT DISTINCT u.id, u.username, u.email, u.createdAt
//         FROM users u
//         JOIN user_sessions s1 ON u.id = s1.userId
//         JOIN user_sessions s2 ON s1.ipAddress = s2.ipAddress
//         WHERE s2.userId = ? AND u.id != ?`,
//         [userId, userId]
//       );
      
//       return {
//         sameEmailDomain,
//         similarUsernames,
//         sameIP,
//         potentialDuplicates: [...new Set([
//           ...sameEmailDomain.map(u => u.id),
//           ...similarUsernames.map(u => u.id),
//           ...sameIP.map(u => u.id)
//         ])].length
//       };
//     } catch (error) {
//       console.error('Error checking duplicate accounts:', error);
//       throw error;
//     }
//   }

//   async mergeAccounts(primaryUserId, secondaryUserId) {
//     try {
//       // Begin transaction
//       await query('START TRANSACTION');
      
//       try {
//         // Transfer posts
//         await query(
//           'UPDATE posts SET userId = ? WHERE userId = ?',
//           [primaryUserId, secondaryUserId]
//         );
        
//         // Transfer comments
//         await query(
//           'UPDATE comments SET userId = ? WHERE userId = ?',
//           [primaryUserId, secondaryUserId]
//         );
        
//         // Transfer activities
//         await query(
//           'UPDATE user_activities SET userId = ? WHERE userId = ?',
//           [primaryUserId, secondaryUserId]
//         );
        
//         // Transfer applications
//         await query(
//           'UPDATE applications SET userId = ? WHERE userId = ?',
//           [primaryUserId, secondaryUserId]
//         );
        
//         // Mark secondary account as merged
//         await query(
//           `UPDATE users 
//           SET isDeleted = 1, 
//               isActive = 0,
//               mergedInto = ?,
//               deletedAt = NOW()
//           WHERE id = ?`,
//           [primaryUserId, secondaryUserId]
//         );
        
//         await query('COMMIT');
        
//         await this.logAdminAction('MERGE_ACCOUNTS', primaryUserId, { 
//           mergedFrom: secondaryUserId 
//         });
        
//         return { success: true, message: 'Accounts merged successfully' };
//       } catch (error) {
//         await query('ROLLBACK');
//         throw error;
//       }
//     } catch (error) {
//       console.error('Error merging accounts:', error);
//       throw error;
//     }
//   }

//   // ==================== ID GENERATION ====================
  
//   async generateShortId(prefix = '') {
//     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//     let id = prefix;
//     for (let i = 0; i < 8; i++) {
//       id += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     return id;
//   }

//   async generateUserId() {
//     let userId;
//     let exists = true;
    
//     while (exists) {
//       userId = await this.generateShortId('U');
//       const check = await query('SELECT id FROM users WHERE id = ?', [userId]);
//       exists = check.length > 0;
//     }
    
//     return userId;
//   }

//   async generateApplicationId() {
//     let appId;
//     let exists = true;
    
//     while (exists) {
//       appId = await this.generateShortId('APP');
//       const check = await query('SELECT id FROM applications WHERE id = ?', [appId]);
//       exists = check.length > 0;
//     }
    
//     return appId;
//   }

//   // ==================== DATA EXPORT ====================
  
//   async exportUserData(userId, format = 'json') {
//     try {
//       // Get all user data
//       const userData = await query('SELECT * FROM users WHERE id = ?', [userId]);
//       const posts = await query('SELECT * FROM posts WHERE userId = ?', [userId]);
//       const comments = await query('SELECT * FROM comments WHERE userId = ?', [userId]);
//       const activities = await query('SELECT * FROM user_activities WHERE userId = ?', [userId]);
//       const applications = await query('SELECT * FROM applications WHERE userId = ?', [userId]);
      
//       const data = {
//         user: userData[0],
//         posts,
//         comments,
//         activities,
//         applications,
//         exportedAt: new Date().toISOString()
//       };
      
//       if (format === 'json') {
//         return JSON.stringify(data, null, 2);
//       } else if (format === 'csv') {
//         // Convert to CSV format (simplified)
//         let csv = 'Data Type,Count\n';
//         csv += `User Profile,1\n`;
//         csv += `Posts,${posts.length}\n`;
//         csv += `Comments,${comments.length}\n`;
//         csv += `Activities,${activities.length}\n`;
//         csv += `Applications,${applications.length}\n`;
//         return csv;
//       }
      
//       return data;
//     } catch (error) {
//       console.error('Error exporting user data:', error);
//       throw error;
//     }
//   }

//   // ==================== HELPER METHODS ====================
  
//   async logAdminAction(action, targetId, details = {}) {
//     try {
//       await query(
//         `INSERT INTO admin_logs (action, targetId, details, performedBy, performedAt)
//         VALUES (?, ?, ?, 'admin', NOW())`,
//         [action, targetId, JSON.stringify(details)]
//       );
//     } catch (error) {
//       console.error('Error logging admin action:', error);
//     }
//   }

//   async getActiveConnectionCount() {
//     try {
//       const result = await query(
//         `SELECT COUNT(DISTINCT userId) as count
//         FROM user_sessions 
//         WHERE lastActivity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)`
//       );
//       return result[0].count;
//     } catch (error) {
//       return 0;
//     }
//   }

//   async getQueuedJobCount() {
//     try {
//       const result = await query(
//         `SELECT COUNT(*) as count
//         FROM job_queue 
//         WHERE status = 'pending'`
//       );
//       return result[0].count;
//     } catch (error) {
//       return 0;
//     }
//   }

//   async getErrorRate() {
//     try {
//       const result = await query(
//         `SELECT 
//           COUNT(CASE WHEN level = 'error' THEN 1 END) * 100.0 / COUNT(*) as rate
//         FROM system_logs
//         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`
//       );
//       return result[0].rate || 0;
//     } catch (error) {
//       return 0;
//     }
//   }

//   async getAverageResponseTime() {
//     try {
//       const result = await query(
//         `SELECT AVG(responseTime) as avgTime
//         FROM api_metrics
//         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`
//       );
//       return result[0].avgTime || 0;
//     } catch (error) {
//       return 0;
//     }
//   }

//   async searchUsers(searchTerm) {
//     try {
//       const users = await query(
//         `SELECT 
//           id, username, email, firstName, lastName, profilePicture, isActive, isVerified
//         FROM users
//         WHERE username LIKE ? 
//           OR email LIKE ? 
//           OR firstName LIKE ? 
//           OR lastName LIKE ?
//           OR CONCAT(firstName, ' ', lastName) LIKE ?
//         ORDER BY 
//           CASE 
//             WHEN username = ? THEN 1
//             WHEN email = ? THEN 2
//             ELSE 3
//           END,
//           username ASC
//         LIMIT 20`,
//         [
//           `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, 
//           `%${searchTerm}%`, `%${searchTerm}%`,
//           searchTerm, searchTerm
//         ]
//       );
      
//       return users;
//     } catch (error) {
//       console.error('Error searching users:', error);
//       throw error;
//     }
//   }

//   async getAdminLogs(filters = {}) {
//     try {
//       let sql = `
//         SELECT * FROM admin_logs
//         WHERE 1=1
//       `;
      
//       const params = [];
      
//       if (filters.action) {
//         sql += ' AND action = ?';
//         params.push(filters.action);
//       }
      
//       if (filters.performedBy) {
//         sql += ' AND performedBy = ?';
//         params.push(filters.performedBy);
//       }
      
//       if (filters.dateFrom) {
//         sql += ' AND performedAt >= ?';
//         params.push(filters.dateFrom);
//       }
      
//       if (filters.dateTo) {
//         sql += ' AND performedAt <= ?';
//         params.push(filters.dateTo);
//       }
      
//       sql += ' ORDER BY performedAt DESC';
      
//       if (filters.limit) {
//         sql += ' LIMIT ? OFFSET ?';
//         params.push(parseInt(filters.limit), parseInt(filters.offset) || 0);
//       }
      
//       const logs = await query(sql, params);
      
//       return logs;
//     } catch (error) {
//       console.error('Error getting admin logs:', error);
//       throw error;
//     }
//   }

//   async cleanupOldData(daysToKeep = 90) {
//     try {
//       const cutoffDate = new Date();
//       cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
//       // Clean old sessions
//       await query(
//         'DELETE FROM user_sessions WHERE lastActivity < ?',
//         [cutoffDate]
//       );
      
//       // Clean old activities
//       await query(
//         'DELETE FROM user_activities WHERE createdAt < ?',
//         [cutoffDate]
//       );
      
//       // Clean old logs
//       await query(
//         'DELETE FROM system_logs WHERE createdAt < ?',
//         [cutoffDate]
//       );
      
//       // Clean soft-deleted users older than retention period
//       await query(
//         'DELETE FROM users WHERE isDeleted = 1 AND deletedAt < ?',
//         [cutoffDate]
//       );
      
//       await this.logAdminAction('CLEANUP_OLD_DATA', null, { daysToKeep });
      
//       return { success: true, message: 'Old data cleaned up successfully' };
//     } catch (error) {
//       console.error('Error cleaning up old data:', error);
//       throw error;
//     }
//   }

//   async validateUserData(userId) {
//     try {
//       const issues = [];
      
//       // Check user exists
//       const user = await query('SELECT * FROM users WHERE id = ?', [userId]);
//       if (!user.length) {
//         return { valid: false, issues: ['User not found'] };
//       }
      
//       // Check for required fields
//       const requiredFields = ['username', 'email'];
//       for (const field of requiredFields) {
//         if (!user[0][field]) {
//           issues.push(`Missing required field: ${field}`);
//         }
//       }
      
//       // Check email format
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (user[0].email && !emailRegex.test(user[0].email)) {
//         issues.push('Invalid email format');
//       }
      
//       // Check for duplicate email
//       const duplicateEmail = await query(
//         'SELECT id FROM users WHERE email = ? AND id != ?',
//         [user[0].email, userId]
//       );
//       if (duplicateEmail.length) {
//         issues.push('Duplicate email address');
//       }
      
//       // Check for duplicate username
//       const duplicateUsername = await query(
//         'SELECT id FROM users WHERE username = ? AND id != ?',
//         [user[0].username, userId]
//       );
//       if (duplicateUsername.length) {
//         issues.push('Duplicate username');
//       }
      
//       return {
//         valid: issues.length === 0,
//         issues
//       };
//     } catch (error) {
//       console.error('Error validating user data:', error);
//       throw error;
//     }
//   }
// }

// export default adminServices;