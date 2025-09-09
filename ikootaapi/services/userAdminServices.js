// ikootaapi/services/userAdminServices.js
// COMPREHENSIVE ADMIN USER MANAGEMENT SERVICES
// Complete service layer for all userAdminRoutes endpoints
// Compatible with your actual database schema

import { query } from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import { hashPassword } from '../utils/passwordUtils.js';
import { generateUniqueConverseId, generateUniqueClassId } from '../utils/idGenerator.js';

class userAdminServices {
  
  // ===============================================
  // DASHBOARD & ANALYTICS SERVICES
  // ===============================================

  /**
   * GET /api/users/admin/stats/overview - Dashboard overview
   */
  async getOverviewStats() {
    try {
      // Use your actual table names and field names
      const [stats] = await query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE JSON_EXTRACT(isblocked, '$') != 1 AND isDeleted != 1) as totalUsers,
          (SELECT COUNT(*) FROM users WHERE membership_stage = 'member' AND isDeleted != 1) as totalMembers,
          (SELECT COUNT(*) FROM users WHERE membership_stage = 'pre_member' AND isDeleted != 1) as preMembers,
          (SELECT COUNT(*) FROM users WHERE membership_stage = 'applicant' AND isDeleted != 1) as applicants,
          (SELECT COUNT(*) FROM users WHERE is_verified = 1 AND isDeleted != 1) as verifiedUsers,
          (SELECT COUNT(*) FROM users WHERE isbanned = 1) as bannedUsers,
          (SELECT COUNT(*) FROM users WHERE role = 'admin') as adminUsers,
          (SELECT COUNT(*) FROM users WHERE role = 'super_admin') as superAdminUsers,
          (SELECT COUNT(*) FROM users WHERE canMentor = 1) as mentorUsers,
          (SELECT COUNT(*) FROM initial_membership_applications WHERE status = 'pending') as pendingInitialApplications,
          (SELECT COUNT(*) FROM full_membership_applications WHERE status = 'pending') as pendingFullApplications,
          (SELECT COUNT(*) FROM initial_membership_applications WHERE status IN ('approved', 'granted') AND DATE(reviewedAt) = CURDATE()) as todayApproved,
          (SELECT COUNT(*) FROM initial_membership_applications WHERE status IN ('rejected', 'declined') AND DATE(reviewedAt) = CURDATE()) as todayRejected,
          (SELECT COUNT(*) FROM chats WHERE status = 'approved') as approvedChats,
          (SELECT COUNT(*) FROM teachings WHERE status = 'approved') as approvedTeachings,
          (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pendingReports,
          (SELECT COUNT(*) FROM comments WHERE status = 'pending') as pendingComments,
          (SELECT COUNT(*) FROM classes WHERE is_active = 1) as activeClasses,
          (SELECT COUNT(*) FROM users WHERE DATE(createdAt) = CURDATE() AND isDeleted != 1) as newUsersToday,
          (SELECT COUNT(*) FROM users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND isDeleted != 1) as newUsers30Days,
          (SELECT COUNT(*) FROM users WHERE lastLogin >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as activeUsers7Days
      `);

      const quickActions = await this.getPendingItemsForQuickActions();

      return {
        overview: {
          totalUsers: stats.totalUsers || 0,
          totalMembers: stats.totalMembers || 0,
          preMembers: stats.preMembers || 0,
          applicants: stats.applicants || 0,
          verifiedUsers: stats.verifiedUsers || 0,
          bannedUsers: stats.bannedUsers || 0
        },
        applications: {
          pending: (stats.pendingInitialApplications || 0) + (stats.pendingFullApplications || 0),
          pendingInitial: stats.pendingInitialApplications || 0,
          pendingFull: stats.pendingFullApplications || 0,
          todayApproved: stats.todayApproved || 0,
          todayRejected: stats.todayRejected || 0,
          approvalRate: this.calculateApprovalRate(stats.todayApproved || 0, stats.todayRejected || 0)
        },
        content: {
          approvedChats: stats.approvedChats || 0,
          approvedTeachings: stats.approvedTeachings || 0,
          pendingReports: stats.pendingReports || 0,
          pendingComments: stats.pendingComments || 0
        },
        classes: {
          active: stats.activeClasses || 0
        },
        activity: {
          newUsersToday: stats.newUsersToday || 0,
          newUsers30Days: stats.newUsers30Days || 0,
          activeUsers7Days: stats.activeUsers7Days || 0,
          membershipConversionRate: this.calculateMembershipConversion(stats.totalMembers || 0, stats.totalUsers || 0)
        },
        user_counts: {
          total: stats.totalUsers || 0,
          admins: stats.adminUsers || 0,
          super_admins: stats.superAdminUsers || 0,
          mentors: stats.mentorUsers || 0,
          pre_members: stats.preMembers || 0,
          full_members: stats.totalMembers || 0,
          applicants: stats.applicants || 0,
          unregistered: 0
        },
        user_status: {
          blocked: 0,
          banned: stats.bannedUsers || 0
        },
        activity_metrics: {
          new_users_30_days: stats.newUsers30Days || 0,
          active_users_7_days: stats.activeUsers7Days || 0,
          new_users_today: stats.newUsersToday || 0
        },
        application_metrics: {
          pending_applications: (stats.pendingInitialApplications || 0) + (stats.pendingFullApplications || 0)
        },
        quickActions
      };
    } catch (error) {
      console.error('Overview stats service error:', error);
      throw new CustomError('Failed to fetch overview statistics: ' + error.message);
    }
  }

  /**
   * GET /api/users/admin/stats/detailed - Detailed analytics
   */
  async getDetailedStats(period = '30d', metrics = ['users', 'applications', 'content']) {
    try {
      const dateRange = this.getDateRangeForPeriod(period);
      
      const userGrowth = await query(`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as newUsers,
          COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verifiedUsers
        FROM users 
        WHERE createdAt >= DATE_SUB(NOW(), ${dateRange})
        AND isDeleted != 1
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `);

      const applicationTrends = await this.getApplicationTrends(dateRange);
      const contentTrends = await this.getContentTrends(dateRange);
      const mentorPerformance = await this.getMentorPerformance(dateRange);

      return {
        period,
        metrics: {
          userGrowth: userGrowth.map(row => ({
            date: this.formatDate(row.date),
            newUsers: row.newUsers,
            verifiedUsers: row.verifiedUsers
          })),
          applicationTrends: this.processApplicationTrends(applicationTrends),
          contentTrends: this.processContentTrends(contentTrends),
          mentorPerformance: this.processMentorPerformance(mentorPerformance)
        }
      };
    } catch (error) {
      console.error('Detailed stats service error:', error);
      throw new CustomError('Failed to fetch detailed statistics: ' + error.message);
    }
  }

  /**
   * GET /api/users/admin/analytics - Comprehensive analytics
   */
  async getAnalytics(filters = {}) {
    try {
      const { startDate, endDate, groupBy = 'day' } = filters;
      const dateFilter = this.buildDateFilter(startDate, endDate);

      const analytics = await query(`
        SELECT 
          COUNT(DISTINCT u.id) as totalUsers,
          COUNT(DISTINCT CASE WHEN u.membership_stage = 'member' THEN u.id END) as members,
          COUNT(DISTINCT CASE WHEN u.membership_stage = 'pre_member' THEN u.id END) as preMembers,
          COUNT(DISTINCT CASE WHEN u.is_verified = 1 THEN u.id END) as verifiedUsers,
          COUNT(DISTINCT ima.id) as initialApplications,
          COUNT(DISTINCT fma.id) as fullApplications,
          COUNT(DISTINCT CASE WHEN ima.status = 'pending' THEN ima.id END) as pendingInitialApps,
          COUNT(DISTINCT CASE WHEN fma.status = 'pending' THEN fma.id END) as pendingFullApps,
          COUNT(DISTINCT CASE WHEN ima.status IN ('approved', 'granted') THEN ima.id END) as approvedInitialApps,
          COUNT(DISTINCT CASE WHEN fma.status IN ('approved', 'granted') THEN fma.id END) as approvedFullApps,
          COUNT(DISTINCT c.id) as totalChats,
          COUNT(DISTINCT t.id) as totalTeachings,
          COUNT(DISTINCT cm.id) as totalComments,
          COUNT(DISTINCT r.id) as totalReports
        FROM users u
        LEFT JOIN initial_membership_applications ima ON u.id = ima.user_id ${dateFilter.replace('createdAt', 'ima.createdAt')}
        LEFT JOIN full_membership_applications fma ON u.id = fma.user_id ${dateFilter.replace('createdAt', 'fma.createdAt')}
        LEFT JOIN chats c ON u.converse_id = c.user_id ${dateFilter.replace('createdAt', 'c.createdAt')}
        LEFT JOIN teachings t ON u.converse_id = t.user_id ${dateFilter.replace('createdAt', 't.createdAt')}
        LEFT JOIN comments cm ON u.converse_id = cm.user_id ${dateFilter.replace('createdAt', 'cm.createdAt')}
        LEFT JOIN reports r ON u.converse_id = r.reporter_id ${dateFilter.replace('createdAt', 'r.createdAt')}
        WHERE u.isDeleted != 1 ${dateFilter.replace('createdAt', 'u.createdAt')}
      `);

      const segmentation = await this.getUserSegmentation(dateFilter);
      const insights = this.generateInsights(analytics[0]);

      return {
        summary: analytics[0],
        segmentation: this.processSegmentation(segmentation),
        insights: insights
      };
    } catch (error) {
      console.error('Analytics service error:', error);
      throw new CustomError('Failed to fetch analytics: ' + error.message);
    }
  }

  /**
   * GET /api/users/admin/pending-count - Real-time pending counts
   */
  async getPendingCount() {
    try {
      const [counts] = await query(`
        SELECT 
          (SELECT COUNT(*) FROM initial_membership_applications WHERE status = 'pending') as pendingInitialApplications,
          (SELECT COUNT(*) FROM full_membership_applications WHERE status = 'pending') as pendingFullApplications,
          (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pendingReports,
          (SELECT COUNT(*) FROM chats WHERE status = 'pending') as pendingChats,
          (SELECT COUNT(*) FROM teachings WHERE status = 'pending') as pendingTeachings,
          (SELECT COUNT(*) FROM comments WHERE status = 'pending') as pendingComments,
          (SELECT COUNT(*) FROM users WHERE is_verified = 0 AND createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY)) as unverifiedUsers
      `);

      const totalPending = Object.values(counts).reduce((sum, count) => sum + (count || 0), 0);

      return {
        pendingApplications: (counts.pendingInitialApplications || 0) + (counts.pendingFullApplications || 0),
        pendingInitialApplications: counts.pendingInitialApplications || 0,
        pendingFullApplications: counts.pendingFullApplications || 0,
        pendingReports: counts.pendingReports || 0,
        pendingChats: counts.pendingChats || 0,
        pendingTeachings: counts.pendingTeachings || 0,
        pendingComments: counts.pendingComments || 0,
        unverifiedUsers: counts.unverifiedUsers || 0,
        totalPending,
        priority: this.calculatePriority(totalPending)
      };
    } catch (error) {
      console.error('Pending count service error:', error);
      throw new CustomError('Failed to fetch pending counts: ' + error.message);
    }
  }

  // ===============================================
  // USER MANAGEMENT SERVICES
  // ===============================================

  /**
   * GET /api/users/admin - Get all users with advanced filtering
   */
  async getAllUsers(filters = {}) {
    try {
      console.log('🔍 Admin getting all users with filters:', filters);
      
      let whereClause = 'WHERE u.isDeleted != 1';
      const queryParams = [];
      
      // Build dynamic WHERE clause using your actual fields
      if (filters.role) {
        whereClause += ' AND u.role = ?';
        queryParams.push(filters.role);
      }
      
      if (filters.membershipStage) {
        whereClause += ' AND u.membership_stage = ?';
        queryParams.push(filters.membershipStage);
      }
      
      if (filters.isVerified !== undefined) {
        whereClause += ' AND u.is_verified = ?';
        queryParams.push(filters.isVerified);
      }
      
      if (filters.search) {
        whereClause += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.converse_id LIKE ?)';
        queryParams.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      }
      
      // Get total count
      const countResult = await query(`
        SELECT COUNT(*) as total FROM users u ${whereClause}
      `, queryParams);
      
      const total = countResult[0]?.total || 0;
      
      // Get users with pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 50;
      const offset = (page - 1) * limit;
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'DESC';
      
      const users = await query(`
        SELECT 
          u.id, u.username, u.email, u.phone, u.role, 
          u.membership_stage, u.is_member, u.full_membership_status,
          u.converse_id, u.mentor_id, u.primary_class_id,
          u.createdAt, u.updatedAt, u.lastLogin,
          u.isblocked, u.isbanned, u.ban_reason, u.is_identity_masked,
          u.is_verified, u.application_status, u.total_classes, u.canPost, u.canMentor,
          m.username as mentor_name,
          c.class_name as primary_class_name,
          (SELECT COUNT(*) FROM initial_membership_applications WHERE user_id = u.id) as initial_applications,
          (SELECT COUNT(*) FROM full_membership_applications WHERE user_id = u.id) as full_applications
        FROM users u
        LEFT JOIN users m ON u.mentor_id = m.converse_id
        LEFT JOIN classes c ON u.primary_class_id = c.class_id
        ${whereClause}
        ORDER BY u.${sortBy} ${sortOrder}
        LIMIT ${limit} OFFSET ${offset}
      `, queryParams);
      
      return {
        success: true,
        users: (users || []).map(user => ({
          ...user,
          is_identity_masked: !!user.is_identity_masked,
          isblocked: user.isblocked ? JSON.parse(user.isblocked) : false,
          isbanned: !!user.isbanned,
          is_verified: !!user.is_verified,
          canPost: !!user.canPost,
          canMentor: !!user.canMentor,
          total_applications: (user.initial_applications || 0) + (user.full_applications || 0)
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
          totalPages: Math.ceil(total / parseInt(limit))
        },
        filters: {
          role: filters.role,
          membership_stage: filters.membershipStage,
          search: filters.search
        }
      };
      
    } catch (error) {
      console.error('❌ Error in getAllUsers:', error);
      throw new CustomError('Failed to fetch users: ' + error.message);
    }
  }

  /**
   * GET /api/users/admin/:id - Get specific user by ID
   */
  async getUserById(userId) {
    try {
      console.log('🔍 Admin fetching user by ID:', userId);
      
      const users = await query(`
        SELECT 
          u.*,
          m.username as mentor_name, m.email as mentor_email,
          c.class_name as primary_class_name,
          (SELECT COUNT(*) FROM initial_membership_applications WHERE user_id = u.id) as initial_applications,
          (SELECT COUNT(*) FROM full_membership_applications WHERE user_id = u.id) as full_applications,
          (SELECT COUNT(*) FROM chats WHERE user_id = u.converse_id) as total_chats,
          (SELECT COUNT(*) FROM teachings WHERE user_id = u.converse_id) as total_teachings
        FROM users u
        LEFT JOIN users m ON u.mentor_id = m.converse_id
        LEFT JOIN classes c ON u.primary_class_id = c.class_id
        WHERE u.id = ?
      `, [userId]);
      
      if (!users || users.length === 0) {
        throw new CustomError('User not found', 404);
      }
      
      const user = users[0];
      
      return {
        ...user,
        isblocked: user.isblocked ? JSON.parse(user.isblocked) : false,
        statistics: {
          total_classes: user.total_classes || 0,
          initial_applications: user.initial_applications || 0,
          full_applications: user.full_applications || 0,
          total_applications: (user.initial_applications || 0) + (user.full_applications || 0),
          total_chats: user.total_chats || 0,
          total_teachings: user.total_teachings || 0
        }
      };
      
    } catch (error) {
      console.error('❌ Error in getUserById:', error);
      throw new CustomError('Failed to fetch user details: ' + error.message);
    }
  }

  /**
   * POST /api/users/admin - Create new user
   */
  async createUser(userData, adminUser) {
    try {
      console.log('👤 Admin creating new user:', userData.username);
      
      const {
        username,
        email,
        phone,
        password,
        role = 'user',
        membership_stage = 'none',
        mentor_id,
        primary_class_id
      } = userData;

      // Validation
      if (!username || !email || !password) {
        throw new CustomError('Username, email, and password are required', 400);
      }

      // Check duplicates
      const existingUsers = await query(`
        SELECT id, username, email FROM users 
        WHERE (username = ? OR email = ?) AND isDeleted != 1
      `, [username, email]);
      
      if (existingUsers && existingUsers.length > 0) {
        const existing = existingUsers[0];
        if (existing.username === username) {
          throw new CustomError('Username already exists', 409);
        }
        if (existing.email === email) {
          throw new CustomError('Email already exists', 409);
        }
      }

      // Hash password and generate converse ID
      const password_hash = await hashPassword(password);
      const converse_id = await generateUniqueConverseId();

      // Insert new user
      const result = await query(`
        INSERT INTO users (
          username, email, phone, password_hash, role, 
          membership_stage, converse_id, mentor_id, primary_class_id, 
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        username, email, phone, password_hash, 
        role, membership_stage, converse_id, mentor_id, primary_class_id
      ]);

      const newUserId = result.insertId;
      
      // Return created user
      return await this.getUserById(newUserId);
      
    } catch (error) {
      console.error('❌ Error in createUser:', error);
      throw new CustomError('Failed to create user: ' + error.message);
    }
  }

  /**
   * PUT /api/users/admin/:id - Update user
   */
  async updateUser(userId, updateData, adminUser) {
    try {
      console.log('🔧 Admin updating user:', userId);
      
      // Get current user
      const currentUser = await this.getUserById(userId);
      
      // Build dynamic update query
      const allowedFields = [
        'username', 'email', 'phone', 'role', 'membership_stage', 
        'is_member', 'full_membership_status', 'mentor_id', 
        'primary_class_id', 'isbanned', 'ban_reason', 'is_identity_masked', 
        'total_classes', 'canPost', 'canMentor'
      ];
      
      const sanitizedData = Object.fromEntries(
        Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
      );
      
      if (Object.keys(sanitizedData).length === 0) {
        throw new CustomError('No valid fields to update', 400);
      }

      const updateFields = Object.keys(sanitizedData).map(field => `${field} = ?`).join(', ');
      const updateValues = Object.values(sanitizedData);
      
      const updateQuery = `
        UPDATE users 
        SET ${updateFields}, updatedAt = NOW()
        WHERE id = ?
      `;
      
      await query(updateQuery, [...updateValues, userId]);
      
      // Return updated user
      return await this.getUserById(userId);
      
    } catch (error) {
      console.error('❌ Error in updateUser:', error);
      throw new CustomError('Failed to update user: ' + error.message);
    }
  }

  /**
   * DELETE /api/users/admin/:id - Delete user (soft delete)
   */
  async deleteUser(userId, reason, adminUser) {
    try {
      console.log('🗑️ Admin deleting user:', userId);
      
      // Get user details before deletion
      const user = await this.getUserById(userId);

      // Soft delete
      await query(`
        UPDATE users 
        SET isDeleted = 1, deletedAt = NOW(), updatedAt = NOW()
        WHERE id = ?
      `, [userId]);
      
      return {
        success: true,
        message: 'User deleted successfully',
        deletedUser: {
          id: userId,
          username: user.username,
          email: user.email
        },
        deletedBy: adminUser.username,
        reason: reason,
        deletedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error in deleteUser:', error);
      throw new CustomError('Failed to delete user: ' + error.message);
    }
  }

  /**
   * PUT /api/users/admin/:id/role - Update user role
   */
  async updateUserRole(userId, roleData, adminUser) {
    try {
      const { role, reason } = roleData;

      await query(`
        UPDATE users SET role = ?, updatedAt = NOW() WHERE id = ?
      `, [role, userId]);

      return {
        success: true,
        message: 'User role updated successfully',
        userId: userId,
        newRole: role,
        reason: reason,
        updatedBy: adminUser.username
      };
    } catch (error) {
      console.error('❌ Error in updateUserRole:', error);
      throw new CustomError('Failed to update user role: ' + error.message);
    }
  }

  /**
   * PUT /api/users/admin/:id/posting-rights - Grant/revoke posting rights
   */
  async grantPostingRights(userId, postingData, adminUser) {
    try {
      const { canPost, reason } = postingData;

      await query(`
        UPDATE users SET canPost = ?, updatedAt = NOW() WHERE id = ?
      `, [canPost, userId]);

      return {
        success: true,
        message: `Posting rights ${canPost ? 'granted' : 'revoked'} successfully`,
        userId: userId,
        canPost: canPost,
        reason: reason,
        updatedBy: adminUser.username
      };
    } catch (error) {
      console.error('❌ Error in grantPostingRights:', error);
      throw new CustomError('Failed to update posting rights: ' + error.message);
    }
  }

  /**
   * PUT /api/users/admin/:id/ban - Ban user
   */
  async banUser(userId, banData, adminUser) {
    try {
      const { reason, duration, daysToUnban } = banData;
      
      const banExpiresAt = daysToUnban ? 
        new Date(Date.now() + daysToUnban * 24 * 60 * 60 * 1000).toISOString() : null;

      await query(`
        UPDATE users 
        SET isbanned = 1, ban_reason = ?, bannedAt = NOW(), 
            unbanDate = ?, updatedAt = NOW()
        WHERE id = ?
      `, [reason, banExpiresAt, userId]);

      return {
        success: true,
        message: 'User banned successfully',
        userId: userId,
        reason: reason,
        duration: duration,
        daysToUnban: daysToUnban,
        bannedBy: adminUser.username,
        bannedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error in banUser:', error);
      throw new CustomError('Failed to ban user: ' + error.message);
    }
  }

  /**
   * PUT /api/users/admin/:id/unban - Unban user
   */
  async unbanUser(userId, unbanData, adminUser) {
    try {
      const { reason } = unbanData;

      await query(`
        UPDATE users 
        SET isbanned = 0, ban_reason = NULL, unbannedAt = NOW(), updatedAt = NOW()
        WHERE id = ?
      `, [userId]);

      return {
        success: true,
        message: 'User unbanned successfully',
        userId: userId,
        reason: reason,
        unbannedBy: adminUser.username,
        unbannedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error in unbanUser:', error);
      throw new CustomError('Failed to unban user: ' + error.message);
    }
  }

  // ===============================================
  // APPLICATION MANAGEMENT SERVICES
  // ===============================================

  /**
   * GET /api/users/admin/applications - Get applications with filtering
   */
  async getApplications(filters = {}) {
    try {
      const {
        status = '',
        type = '',
        page = 1,
        limit = 20,
        sortBy = 'submittedAt',
        sortOrder = 'desc'
      } = filters;

      let applications = [];
      let totalCount = 0;

      // Get initial membership applications
      if (!type || type === 'initial_application' || type === 'initial') {
        const initialApps = await query(`
          SELECT 
            'initial_application' as application_type,
            ima.id, ima.user_id, ima.status, ima.submittedAt, ima.reviewedAt,
            ima.reviewed_by, ima.admin_notes, u.username, u.email, u.membership_stage,
            reviewer.username as reviewerName,
            DATEDIFF(NOW(), ima.submittedAt) as daysPending
          FROM initial_membership_applications ima
          JOIN users u ON ima.user_id = u.id
          LEFT JOIN users reviewer ON ima.reviewed_by = reviewer.id
          WHERE (ima.status = ? OR ? = '') AND u.isDeleted != 1
          ORDER BY ima.${sortBy === 'submittedAt' ? 'submittedAt' : 'submittedAt'} ${sortOrder.toUpperCase()}
        `, [status, status]);

        applications = [...applications, ...(initialApps || [])];

        const initialCount = await query(`
          SELECT COUNT(*) as count 
          FROM initial_membership_applications ima
          JOIN users u ON ima.user_id = u.id
          WHERE (ima.status = ? OR ? = '') AND u.isDeleted != 1
        `, [status, status]);
        totalCount += initialCount[0]?.count || 0;
      }

      // Get full membership applications
      if (!type || type === 'full_membership' || type === 'full') {
        const fullApps = await query(`
          SELECT 
            'full_membership' as application_type,
            fma.id, fma.user_id, fma.status, fma.submittedAt, fma.reviewedAt,
            fma.reviewed_by, fma.admin_notes, u.username, u.email, u.membership_stage,
            reviewer.username as reviewerName,
            DATEDIFF(NOW(), fma.submittedAt) as daysPending
          FROM full_membership_applications fma
          JOIN users u ON fma.user_id = u.id
          LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
          WHERE (fma.status = ? OR ? = '') AND u.isDeleted != 1
          ORDER BY fma.${sortBy === 'submittedAt' ? 'submittedAt' : 'submittedAt'} ${sortOrder.toUpperCase()}
        `, [status, status]);

        applications = [...applications, ...(fullApps || [])];

        const fullCount = await query(`
          SELECT COUNT(*) as count 
          FROM full_membership_applications fma
          JOIN users u ON fma.user_id = u.id
          WHERE (fma.status = ? OR ? = '') AND u.isDeleted != 1
        `, [status, status]);
        totalCount += fullCount[0]?.count || 0;
      }

      // Sort and paginate
      applications.sort((a, b) => {
        if (sortBy === 'submittedAt') {
          return sortOrder === 'desc' ? 
            new Date(b.submittedAt) - new Date(a.submittedAt) : 
            new Date(a.submittedAt) - new Date(b.submittedAt);
        }
        return 0;
      });

      const offset = (page - 1) * limit;
      const paginatedApplications = applications.slice(offset, offset + parseInt(limit));

      return {
        success: true,
        applications: paginatedApplications.map(app => ({
          ...app,
          daysPending: parseInt(app.daysPending) || 0,
          completion_percentage: 100 // Default since it's not in your schema
        })),
        pagination: {
          currentPage: parseInt(page),
          page: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalApplications: totalCount,
          total: totalCount,
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1,
          limit: parseInt(limit)
        },
        filters: { status, type, sortBy, sortOrder }
      };
    } catch (error) {
      console.error('Get applications service error:', error);
      throw new CustomError('Failed to fetch applications: ' + error.message);
    }
  }

  /**
   * GET /api/users/admin/applications/pending - Get pending applications
   */
  async getPendingApplications(filters = {}) {
    try {
      // Use getApplications with pending status filter
      const pendingFilters = { ...filters, status: 'pending' };
      return await this.getApplications(pendingFilters);
    } catch (error) {
      console.error('Get pending applications service error:', error);
      throw new CustomError('Failed to fetch pending applications: ' + error.message);
    }
  }

  /**
   * PUT /api/users/admin/applications/:id/review - Review application
   */
  async reviewApplication(applicationId, reviewData, adminId) {
    try {
      const { status, adminNotes, notifyUser = true } = reviewData;

      // Try to find the application in both tables
      let updateResult = null;
      let appDetails = null;
      let applicationType = null;

      // Check initial membership applications first
      const initialApp = await query(`
        SELECT user_id, 'initial_application' as application_type 
        FROM initial_membership_applications WHERE id = ?
      `, [applicationId]);

      if (initialApp && initialApp.length > 0) {
        applicationType = 'initial_application';
        appDetails = initialApp[0];
        
        updateResult = await query(`
          UPDATE initial_membership_applications 
          SET status = ?, reviewed_by = ?, reviewedAt = NOW(), admin_notes = ?
          WHERE id = ?
        `, [status, adminId, adminNotes || '', applicationId]);
      } else {
        // Check full membership applications
        const fullApp = await query(`
          SELECT user_id, 'full_membership' as application_type 
          FROM full_membership_applications WHERE id = ?
        `, [applicationId]);

        if (fullApp && fullApp.length > 0) {
          applicationType = 'full_membership';
          appDetails = fullApp[0];
          
          updateResult = await query(`
            UPDATE full_membership_applications 
            SET status = ?, reviewed_by = ?, reviewedAt = NOW(), admin_notes = ?
            WHERE id = ?
          `, [status, adminId, adminNotes || '', applicationId]);
        }
      }

      if (!appDetails || !updateResult || updateResult.affectedRows === 0) {
        throw new CustomError('Application not found', 404);
      }

      const { user_id } = appDetails;

      // Update user status based on approval
      if (status === 'approved' || status === 'granted') {
        if (applicationType === 'initial_application') {
          await query(`
            UPDATE users 
            SET membership_stage = 'pre_member', is_member = 'pre_member', 
                application_status = 'approved', applicationReviewedAt = NOW()
            WHERE id = ?
          `, [user_id]);
        } else if (applicationType === 'full_membership') {
          await query(`
            UPDATE users 
            SET membership_stage = 'member', is_member = 'member', 
                full_membership_status = 'approved', fullMembershipReviewedAt = NOW()
            WHERE id = ?
          `, [user_id]);
        }
      }

      if (notifyUser) {
        await this.queueNotification(user_id, status, applicationType, adminNotes, adminId);
      }

      return {
        success: true,
        applicationId: applicationId,
        newStatus: status,
        applicationType: applicationType,
        notificationSent: notifyUser
      };
    } catch (error) {
      console.error('Review application service error:', error);
      throw new CustomError('Failed to review application: ' + error.message);
    }
  }

  // ===============================================
  // CONTENT MODERATION SERVICES
  // ===============================================

  /**
   * GET /api/users/admin/reports - Get content reports
   */
  async getContentReports(filters = {}) {
    try {
      const {
        status = '',
        contentType = '',
        reason = '',
        page = 1,
        limit = 20
      } = filters;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (status) {
        whereClause += ' AND r.status = ?';
        params.push(status);
      }

      if (contentType) {
        whereClause += ' AND r.content_type = ?';
        params.push(contentType);
      }

      if (reason) {
        whereClause += ' AND r.reason = ?';
        params.push(reason);
      }

      const reports = await query(`
        SELECT 
          r.*,
          u.username as reporterUsername,
          u.email as reporterEmail,
          'Content Preview' as contentPreview
        FROM reports r
        JOIN users u ON CAST(r.reporter_id AS CHAR) = CAST(u.converse_id AS CHAR)
        ${whereClause}
        ORDER BY r.createdAt DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      const countResult = await query(`
        SELECT COUNT(*) as total 
        FROM reports r
        JOIN users u ON CAST(r.reporter_id AS CHAR) = CAST(u.converse_id AS CHAR)
        ${whereClause}
      `, params);

      const total = countResult[0]?.total || 0;

      return {
        success: true,
        reports: reports || [],
        data: reports || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters: { status, contentType, reason }
      };
    } catch (error) {
      console.error('Get content reports service error:', error);
      throw new CustomError('Failed to fetch content reports: ' + error.message);
    }
  }

  /**
   * PUT /api/users/admin/reports/:id/resolve - Resolve content report
   */
  async resolveReport(reportId, resolutionData, adminId) {
    try {
      const { status, resolutionNotes, actionTaken } = resolutionData;

      await query(`
        UPDATE reports 
        SET status = ?, resolution_notes = ?, action_taken = ?, resolved_by = ?, resolvedAt = NOW()
        WHERE id = ?
      `, [status, resolutionNotes, actionTaken, adminId, reportId]);

      return {
        success: true,
        message: 'Report resolved successfully',
        reportId: reportId,
        status: status,
        actionTaken: actionTaken
      };
    } catch (error) {
      console.error('Resolve report service error:', error);
      throw new CustomError('Failed to resolve report: ' + error.message);
    }
  }

  /**
   * GET /api/users/admin/activity-logs - Get user activity logs
   */
  async getActivityLogs(filters = {}) {
    try {
      const { userId, action, startDate, endDate, page = 1, limit = 50 } = filters;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (userId) {
        whereClause += ' AND al.user_id = ?';
        params.push(userId);
      }

      if (action) {
        whereClause += ' AND al.action LIKE ?';
        params.push(`%${action}%`);
      }

      if (startDate) {
        whereClause += ' AND al.createdAt >= ?';
        params.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND al.createdAt <= ?';
        params.push(endDate);
      }

      const logs = await query(`
        SELECT 
          al.*,
          u.username,
          u.email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY al.createdAt DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      return {
        success: true,
        logs: logs || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      console.error('Get activity logs service error:', error);
      throw new CustomError('Failed to fetch activity logs: ' + error.message);
    }
  }

  /**
   * GET /api/users/admin/audit-trail - Get system audit trail
   */
  async getAuditTrail(filters = {}) {
    try {
      // This is essentially the same as activity logs but might have different permissions
      return await this.getActivityLogs(filters);
    } catch (error) {
      console.error('Get audit trail service error:', error);
      throw new CustomError('Failed to fetch audit trail: ' + error.message);
    }
  }

  // ===============================================
  // BULK OPERATIONS SERVICES
  // ===============================================

  /**
   * POST /api/users/admin/bulk/approve - Bulk approve users
   */
  async bulkApproveUsers(bulkData, adminId) {
    try {
      const { userIds, reason, notifyUsers = true } = bulkData;
      const results = [];

      for (const userId of userIds) {
        try {
          await query(`
            UPDATE users 
            SET membership_stage = 'pre_member', is_member = 'pre_member',
                application_status = 'approved', applicationReviewedAt = NOW()
            WHERE id = ? AND isDeleted != 1
          `, [userId]);

          results.push({ userId, status: 'success', message: 'User approved' });

          if (notifyUsers) {
            await this.queueNotification(userId, 'approved', 'bulk_approval', reason, adminId);
          }
        } catch (error) {
          results.push({ userId, status: 'error', message: error.message });
        }
      }

      return {
        success: true,
        message: `Bulk approval completed`,
        results,
        processedCount: userIds.length,
        successCount: results.filter(r => r.status === 'success').length,
        errorCount: results.filter(r => r.status === 'error').length
      };
    } catch (error) {
      console.error('Bulk approve users service error:', error);
      throw new CustomError('Failed to bulk approve users: ' + error.message);
    }
  }

  /**
   * POST /api/users/admin/bulk/assign-mentors - Bulk assign mentors
   */
  async bulkAssignMentors(assignmentData, adminId) {
    try {
      const { assignments, reason } = assignmentData;
      const results = [];

      for (const assignment of assignments) {
        try {
          const { userId, mentorId } = assignment;
          
          await query(`
            UPDATE users SET mentor_id = ?, updatedAt = NOW() WHERE id = ?
          `, [mentorId, userId]);

          results.push({ userId, mentorId, status: 'success', message: 'Mentor assigned' });
        } catch (error) {
          results.push({ userId: assignment.userId, status: 'error', message: error.message });
        }
      }

      return {
        success: true,
        message: 'Bulk mentor assignment completed',
        results,
        processedCount: assignments.length,
        successCount: results.filter(r => r.status === 'success').length,
        errorCount: results.filter(r => r.status === 'error').length
      };
    } catch (error) {
      console.error('Bulk assign mentors service error:', error);
      throw new CustomError('Failed to bulk assign mentors: ' + error.message);
    }
  }

  /**
   * POST /api/users/admin/bulk/send-notifications - Bulk send notifications
   */
  async bulkSendNotifications(notificationData, adminId) {
    try {
      const { userIds, title, message, type } = notificationData;
      const results = [];

      for (const userId of userIds) {
        try {
          await query(`
            INSERT INTO notifications (user_id, recipients, subject, message, type, created_by, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
          `, [userId, JSON.stringify([userId]), title, message, type, adminId]);

          results.push({ userId, status: 'success', message: 'Notification sent' });
        } catch (error) {
          results.push({ userId, status: 'error', message: error.message });
        }
      }

      return {
        success: true,
        message: 'Bulk notifications sent',
        results,
        processedCount: userIds.length,
        successCount: results.filter(r => r.status === 'success').length,
        errorCount: results.filter(r => r.status === 'error').length
      };
    } catch (error) {
      console.error('Bulk send notifications service error:', error);
      throw new CustomError('Failed to send bulk notifications: ' + error.message);
    }
  }

  // ===============================================
  // IDENTITY MANAGEMENT SERVICES
  // ===============================================

  /**
   * POST /api/users/admin/mask-identity-advanced - Advanced identity masking
   */
  async maskUserIdentityAdvanced(maskingData, adminId) {
    try {
      const { userId, reason, maskingLevel, duration } = maskingData;

      // Get current user data
      const user = await this.getUserById(userId);
      
      // Create identity mask record
      const expiresAt = duration ? 
        new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString() : null;

      await query(`
        INSERT INTO identity_masks (
          user_id, original_username, original_email, masked_username, masked_email,
          masking_level, reason, created_by, expiresAt, is_active, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
      `, [
        userId, user.username, user.email, 
        `masked_${userId}`, `masked_${userId}@hidden.local`,
        maskingLevel, reason, adminId, expiresAt
      ]);

      // Update user as masked
      await query(`
        UPDATE users SET is_identity_masked = 1, updatedAt = NOW() WHERE id = ?
      `, [userId]);

      return {
        success: true,
        message: 'Identity masked successfully',
        userId,
        maskingLevel,
        expiresAt,
        reason
      };
    } catch (error) {
      console.error('Mask identity service error:', error);
      throw new CustomError('Failed to mask identity: ' + error.message);
    }
  }

  /**
   * POST /api/users/admin/unmask-identity - Unmask identity
   */
  async unmaskUserIdentity(unmaskingData, adminId) {
    try {
      const { userId, reason } = unmaskingData;

      // Update identity mask record
      await query(`
        UPDATE identity_masks 
        SET is_active = 0, unmasked_by = ?, unmaskedAt = NOW(), unmask_reason = ?
        WHERE user_id = ? AND is_active = 1
      `, [adminId, reason, userId]);

      // Update user as unmasked
      await query(`
        UPDATE users SET is_identity_masked = 0, updatedAt = NOW() WHERE id = ?
      `, [userId]);

      return {
        success: true,
        message: 'Identity unmasked successfully',
        userId,
        reason,
        unmaskedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Unmask identity service error:', error);
      throw new CustomError('Failed to unmask identity: ' + error.message);
    }
  }

  /**
   * GET /api/users/admin/identity-audit-trail - Identity audit trail
   */
  async getIdentityAuditTrail(filters = {}) {
    try {
      const { userId, adminId, startDate, endDate, page = 1, limit = 50 } = filters;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (userId) {
        whereClause += ' AND iam.user_id = ?';
        params.push(userId);
      }

      if (adminId) {
        whereClause += ' AND iam.masked_by_admin_id = ?';
        params.push(adminId);
      }

      if (startDate) {
        whereClause += ' AND iam.createdAt >= ?';
        params.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND iam.createdAt <= ?';
        params.push(endDate);
      }

      const auditTrail = await query(`
        SELECT 
          iam.*,
          u.username as target_username,
          admin.username as admin_username
        FROM identity_masking_audit iam
        LEFT JOIN users u ON iam.user_id = u.id
        LEFT JOIN users admin ON iam.masked_by_admin_id COLLATE utf8mb4_general_ci = admin.converse_id COLLATE utf8mb4_general_ci
        ${whereClause}
        ORDER BY iam.createdAt DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      return {
        success: true,
        auditTrail: auditTrail || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      console.error('Get identity audit trail service error:', error);
      throw new CustomError('Failed to fetch identity audit trail: ' + error.message);
    }
  }

  /**
   * GET /api/users/admin/identity-dashboard - Identity management dashboard
   */
  async getIdentityDashboard() {
    try {
      const [stats] = await query(`
        SELECT 
          (SELECT COUNT(DISTINCT user_id) FROM identity_masks WHERE is_active = 1) as totalMaskedUsers,
          (SELECT COUNT(*) FROM identity_masks WHERE is_active = 1) as activeMasks,
          (SELECT COUNT(*) FROM identity_masks WHERE expiresAt IS NOT NULL AND expiresAt < NOW()) as expiredMasks,
          (SELECT COUNT(DISTINCT created_by) FROM identity_masks WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as adminsInvolved,
          (SELECT COUNT(*) FROM identity_masking_audit WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as recentActions
      `);

      return {
        success: true,
        data: {
          total_users: stats.totalMaskedUsers || 0,
          masked_users: stats.totalMaskedUsers || 0,
          active_masks: stats.activeMasks || 0,
          expired_masks: stats.expiredMasks || 0,
          admins_involved: stats.adminsInvolved || 0,
          recent_actions: stats.recentActions || 0,
          recent_maskings: Math.floor((stats.recentActions || 0) / 2),
          recent_unmaskings: Math.floor((stats.recentActions || 0) / 2),
          system_status: 'operational',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Get identity dashboard service error:', error);
      throw new CustomError('Failed to fetch identity dashboard: ' + error.message, 500);
    }
  }

  /**
   * GET /api/users/admin/mentor-analytics - Enhanced mentor analytics
   */
  async getMentorAnalytics(filters = {}) {
    try {
      const { period = '30d', mentorId } = filters;
      const dateRange = this.getDateRangeForPeriod(period);
      
      let whereClause = 'WHERE u.mentor_id IS NOT NULL';
      const params = [];

      if (mentorId) {
        whereClause += ' AND u.mentor_id = ?';
        params.push(mentorId);
      }

      const mentorStats = await query(`
        SELECT 
          u.mentor_id,
          mentor.username as mentorName,
          COUNT(DISTINCT u.id) as totalMentees,
          COUNT(DISTINCT CASE WHEN u.membership_stage = 'member' THEN u.id END) as successfulMentees,
          COUNT(DISTINCT CASE WHEN u.membership_stage = 'pre_member' THEN u.id END) as preMemberMentees,
          COUNT(DISTINCT CASE WHEN u.membership_stage = 'applicant' THEN u.id END) as applicantMentees,
          AVG(CASE WHEN u.membership_stage = 'member' THEN DATEDIFF(u.fullMembershipReviewedAt, u.createdAt) END) as avgTimeToMembership
        FROM users u
        LEFT JOIN users mentor ON u.mentor_id = mentor.converse_id
        ${whereClause}
        AND u.createdAt >= DATE_SUB(NOW(), ${dateRange})
        GROUP BY u.mentor_id, mentor.username
        HAVING totalMentees > 0
        ORDER BY successfulMentees DESC, totalMentees DESC
      `, params);

      return {
        success: true,
        analytics: {
          period,
          mentorStats: (mentorStats || []).map(stat => ({
            ...stat,
            successRate: stat.totalMentees > 0 ? 
              Math.round((stat.successfulMentees / stat.totalMentees) * 100) : 0,
            avgTimeToMembership: Math.round(stat.avgTimeToMembership || 0)
          }))
        }
      };
    } catch (error) {
      console.error('Get mentor analytics service error:', error);
      throw new CustomError('Failed to fetch mentor analytics: ' + error.message);
    }
  }

  /**
   * POST /api/users/admin/bulk-assign-mentors-advanced - Advanced bulk mentor assignment
   */
  async bulkAssignMentorsAdvanced(assignmentData, adminId) {
    try {
      const { assignments, autoMatch, reason } = assignmentData;
      const results = [];

      for (const assignment of assignments) {
        try {
          const { userId, mentorCriteria } = assignment;
          let assignedMentorId = null;

          if (autoMatch && mentorCriteria) {
            // Auto-match based on criteria (simplified logic)
            const matchedMentors = await query(`
              SELECT converse_id FROM users 
              WHERE canMentor = 1 AND role != 'user'
              AND (SELECT COUNT(*) FROM users WHERE mentor_id = converse_id) < 10
              ORDER BY RAND() LIMIT 1
            `);

            if (matchedMentors && matchedMentors.length > 0) {
              assignedMentorId = matchedMentors[0].converse_id;
            }
          } else if (assignment.mentorId) {
            assignedMentorId = assignment.mentorId;
          }

          if (assignedMentorId) {
            await query(`
              UPDATE users SET mentor_id = ?, updatedAt = NOW() WHERE id = ?
            `, [assignedMentorId, userId]);

            results.push({ 
              userId, 
              mentorId: assignedMentorId, 
              status: 'success', 
              message: 'Mentor assigned successfully' 
            });
          } else {
            results.push({ 
              userId, 
              status: 'error', 
              message: 'No suitable mentor found' 
            });
          }
        } catch (error) {
          results.push({ 
            userId: assignment.userId, 
            status: 'error', 
            message: error.message 
          });
        }
      }

      return {
        success: true,
        message: 'Advanced mentor assignment completed',
        results,
        processedCount: assignments.length,
        successCount: results.filter(r => r.status === 'success').length,
        errorCount: results.filter(r => r.status === 'error').length
      };
    } catch (error) {
      console.error('Bulk assign mentors advanced service error:', error);
      throw new CustomError('Failed to perform advanced mentor assignment: ' + error.message);
    }
  }

  // ===============================================
  // SYSTEM MANAGEMENT SERVICES
  // ===============================================

  /**
   * GET /api/users/admin/export/user-data - Export user data
   */
  async exportUserData(filters = {}) {
    try {
      const { format = 'json', startDate, endDate, includeFields } = filters;
      
      let whereClause = 'WHERE u.isDeleted != 1';
      const params = [];

      if (startDate) {
        whereClause += ' AND u.createdAt >= ?';
        params.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND u.createdAt <= ?';
        params.push(endDate);
      }

      const users = await query(`
        SELECT 
          u.id, u.username, u.email, u.phone, u.role, 
          u.membership_stage, u.is_member, u.converse_id,
          u.createdAt, u.updatedAt, u.lastLogin,
          u.is_verified, u.canPost, u.canMentor,
          (SELECT COUNT(*) FROM initial_membership_applications WHERE user_id = u.id) as initial_applications,
          (SELECT COUNT(*) FROM full_membership_applications WHERE user_id = u.id) as full_applications
        FROM users u
        ${whereClause}
        ORDER BY u.createdAt DESC
      `, params);

      const exportData = {
        exportedAt: new Date().toISOString(),
        format,
        totalUsers: users.length,
        filters: { startDate, endDate, includeFields },
        users: users || []
      };

      if (format === 'csv') {
        // Convert to CSV format (simplified)
        const csvHeaders = Object.keys(exportData.users[0] || {}).join(',');
        const csvRows = exportData.users.map(user => 
          Object.values(user).map(val => `"${val || ''}"`).join(',')
        ).join('\n');
        
        return {
          success: true,
          format: 'csv',
          data: csvHeaders + '\n' + csvRows,
          filename: `users_export_${new Date().toISOString().split('T')[0]}.csv`
        };
      }

      return {
        success: true,
        format: 'json',
        data: exportData,
        filename: `users_export_${new Date().toISOString().split('T')[0]}.json`
      };
    } catch (error) {
      console.error('Export user data service error:', error);
      throw new CustomError('Failed to export user data: ' + error.message);
    }
  }

  /**
   * POST /api/users/admin/generate/bulk-ids - Generate bulk IDs
   */
  async generateBulkIds(generationData, adminUser) {
    try {
      const { count, type, purpose } = generationData;
      
      if (count > 100) {
        throw new CustomError('Maximum 100 IDs can be generated at once', 400);
      }

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
        try {
          await query(`
            INSERT INTO id_generation_log (generated_id, id_type, generated_by, purpose, generatedAt)
            VALUES (?, ?, ?, ?, NOW())
          `, [newId, type, adminUser.converse_id || adminUser.id, purpose || 'bulk_generation']);
        } catch (logError) {
          console.warn('Could not log ID generation:', logError.message);
        }
      }
      
      return {
        success: true,
        generated_ids: generatedIds,
        generatedIds: generatedIds,
        count,
        type,
        generated_by: adminUser.username,
        generated_at: new Date().toISOString(),
        purpose: purpose || 'bulk_generation'
      };
    } catch (error) {
      console.error('Generate bulk IDs service error:', error);
      throw new CustomError('Failed to generate bulk IDs: ' + error.message);
    }
  }

  /**
   * POST /api/users/admin/generate/converse-id - Generate converse ID
   */
  async generateConverseId(generationData, adminUser) {
    try {
      const { userId, purpose } = generationData;
      
      const newConverseId = await generateUniqueConverseId();
      
      if (userId) {
        // Update specific user
        await query(`
          UPDATE users SET converse_id = ?, updatedAt = NOW() WHERE id = ?
        `, [newConverseId, userId]);
      }

      // Log the generation
      try {
        await query(`
          INSERT INTO id_generation_log (generated_id, id_type, generated_by, purpose, generatedAt)
          VALUES (?, 'user', ?, ?, NOW())
        `, [newConverseId, adminUser.converse_id || adminUser.id, purpose || 'converse_id_generation']);
      } catch (logError) {
        console.warn('Could not log ID generation:', logError.message);
      }

      return {
        success: true,
        converse_id: newConverseId,
        userId: userId,
        generated_by: adminUser.username,
        generated_at: new Date().toISOString(),
        purpose: purpose || 'converse_id_generation'
      };
    } catch (error) {
      console.error('Generate converse ID service error:', error);
      throw new CustomError('Failed to generate converse ID: ' + error.message);
    }
  }

  /**
   * POST /api/users/admin/generate/class-id - Generate class ID
   */
  async generateClassId(generationData, adminUser) {
    try {
      const { className, createdBy } = generationData;
      
      const newClassId = await generateUniqueClassId();

      // Log the generation
      try {
        await query(`
          INSERT INTO id_generation_log (generated_id, id_type, generated_by, purpose, generatedAt)
          VALUES (?, 'class', ?, ?, NOW())
        `, [newClassId, adminUser.converse_id || adminUser.id, `Class: ${className || 'Unknown'}`]);
      } catch (logError) {
        console.warn('Could not log ID generation:', logError.message);
      }

      return {
        success: true,
        class_id: newClassId,
        className: className,
        generated_by: adminUser.username,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Generate class ID service error:', error);
      throw new CustomError('Failed to generate class ID: ' + error.message);
    }
  }

  // ===============================================
  // HELPER METHODS
  // ===============================================

  getDateRangeForPeriod(period) {
    switch(period) {
      case '7d': return 'INTERVAL 7 DAY';
      case '30d': return 'INTERVAL 30 DAY';
      case '90d': return 'INTERVAL 90 DAY';
      case '1y': return 'INTERVAL 1 YEAR';
      default: return 'INTERVAL 30 DAY';
    }
  }

  buildDateFilter(startDate, endDate) {
    if (startDate && endDate) {
      return `AND createdAt BETWEEN '${startDate}' AND '${endDate}'`;
    } else {
      return 'AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }
  }

  async getPendingItemsForQuickActions() {
    try {
      const highPriorityApplications = await query(`
        (
          SELECT 'initial' as type, id, user_id, 'initial_application' as application_type, submittedAt as createdAt
          FROM initial_membership_applications 
          WHERE status = 'pending' 
          AND DATEDIFF(NOW(), submittedAt) > 7
          ORDER BY submittedAt ASC
          LIMIT 3
        )
        UNION ALL
        (
          SELECT 'full' as type, id, user_id, 'full_membership' as application_type, submittedAt as createdAt
          FROM full_membership_applications 
          WHERE status = 'pending' 
          AND DATEDIFF(NOW(), submittedAt) > 7
          ORDER BY submittedAt ASC
          LIMIT 2
        )
        ORDER BY createdAt ASC
      `);

      const urgentReports = await query(`
        SELECT id, 'report' as content_type, reason, createdAt
        FROM reports 
        WHERE status = 'pending'
        ORDER BY createdAt ASC
        LIMIT 5
      `);

      return {
        highPriorityApplications: highPriorityApplications || [],
        urgentReports: urgentReports || [],
        totalQuickActions: (highPriorityApplications?.length || 0) + (urgentReports?.length || 0)
      };
    } catch (error) {
      console.error('Get pending items error:', error);
      return {
        highPriorityApplications: [],
        urgentReports: [],
        totalQuickActions: 0
      };
    }
  }

  calculateApprovalRate(approved, rejected) {
    const total = approved + rejected;
    return total > 0 ? ((approved / total) * 100).toFixed(1) + '%' : '0%';
  }

  calculateMembershipConversion(members, totalUsers) {
    return totalUsers > 0 ? ((members / totalUsers) * 100).toFixed(1) + '%' : '0%';
  }

  calculatePriority(totalPending) {
    if (totalPending > 50) return 'high';
    if (totalPending > 20) return 'medium';
    return 'low';
  }

  formatDate(date) {
    return new Date(date).toISOString().split('T')[0];
  }

  async queueNotification(userId, status, applicationType, notes, adminId) {
    const subject = `Application ${status === 'approved' || status === 'granted' ? 'Approved' : 'Update'}`;
    const message = `Your ${applicationType} has been ${status}. ${notes ? 'Notes: ' + notes : ''}`;
    
    try {
      await query(`
        INSERT INTO notifications (user_id, recipients, subject, message, type, created_by, createdAt)
        VALUES (?, ?, ?, ?, 'email', ?, NOW())
      `, [userId, JSON.stringify([userId]), subject, message, adminId]);
    } catch (error) {
      console.warn('Could not queue notification:', error.message);
    }
  }

  processApplicationTrends(trends) {
    return trends.reduce((acc, row) => {
      const date = this.formatDate(row.date);
      if (!acc[date]) acc[date] = {};
      acc[date][row.status] = row.count;
      return acc;
    }, {});
  }

  async getApplicationTrends(dateRange) {
    try {
      return await query(`
        SELECT 
          DATE(submittedAt) as date,
          'initial' as application_type,
          status,
          COUNT(*) as count
        FROM initial_membership_applications 
        WHERE submittedAt >= DATE_SUB(NOW(), ${dateRange})
        GROUP BY DATE(submittedAt), status
        
        UNION ALL
        
        SELECT 
          DATE(submittedAt) as date,
          'full' as application_type,
          status,
          COUNT(*) as count
        FROM full_membership_applications 
        WHERE submittedAt >= DATE_SUB(NOW(), ${dateRange})
        GROUP BY DATE(submittedAt), status
        
        ORDER BY date, application_type, status
      `);
    } catch (error) {
      console.error('Application trends error:', error);
      return [];
    }
  }

  async getContentTrends(dateRange) {
    try {
      return await query(`
        SELECT 
          DATE(createdAt) as date,
          'chats' as content_type,
          COUNT(*) as count,
          0 as avg_views,
          0 as avg_likes
        FROM chats 
        WHERE createdAt >= DATE_SUB(NOW(), ${dateRange})
        GROUP BY DATE(createdAt)
        
        UNION ALL
        
        SELECT 
          DATE(createdAt) as date,
          'teachings' as content_type,
          COUNT(*) as count,
          0 as avg_views,
          0 as avg_likes
        FROM teachings 
        WHERE createdAt >= DATE_SUB(NOW(), ${dateRange})
        GROUP BY DATE(createdAt)
        
        ORDER BY date, content_type
      `);
    } catch (error) {
      console.error('Content trends error:', error);
      return [];
    }
  }

  processContentTrends(trends) {
    const processed = {};
    
    trends.forEach(trend => {
      const date = this.formatDate(trend.date);
      if (!processed[date]) {
        processed[date] = {
          date: date,
          chats: { count: 0, avg_views: 0, avg_likes: 0 },
          teachings: { count: 0, avg_views: 0, avg_likes: 0 }
        };
      }
      
      processed[date][trend.content_type] = {
        count: trend.count,
        avg_views: Math.round(trend.avg_views || 0),
        avg_likes: Math.round(trend.avg_likes || 0)
      };
    });

    return Object.values(processed).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  async getMentorPerformance(dateRange) {
    try {
      return await query(`
        SELECT 
          u.mentor_id,
          mentor.username as mentorName,
          COUNT(DISTINCT u.id) as totalMentees,
          COUNT(DISTINCT CASE WHEN u.membership_stage = 'member' THEN u.id END) as successfulMentees
        FROM users u
        LEFT JOIN users mentor ON u.mentor_id = mentor.converse_id
        WHERE u.mentor_id IS NOT NULL 
        AND u.createdAt >= DATE_SUB(NOW(), ${dateRange})
        GROUP BY u.mentor_id, mentor.username
        HAVING totalMentees > 0
        ORDER BY successfulMentees DESC
      `);
    } catch (error) {
      console.error('Mentor performance error:', error);
      return [];
    }
  }

  processMentorPerformance(mentorData) {
    return mentorData.map(mentor => ({
      mentorId: mentor.mentor_id,
      mentorName: mentor.mentorName,
      totalMentees: mentor.totalMentees,
      successfulMentees: mentor.successfulMentees,
      successRate: mentor.totalMentees > 0 ? 
        Math.round((mentor.successfulMentees / mentor.totalMentees) * 100) : 0
    }));
  }

  async getUserSegmentation(dateFilter) {
    try {
      return await query(`
        SELECT 
          membership_stage,
          role,
          is_verified,
          COUNT(*) as count,
          AVG(DATEDIFF(NOW(), createdAt)) as avg_days_since_joined
        FROM users 
        WHERE isDeleted != 1 ${dateFilter.replace('createdAt', 'users.createdAt')}
        GROUP BY membership_stage, role, is_verified
        ORDER BY count DESC
      `);
    } catch (error) {
      console.error('User segmentation error:', error);
      return [];
    }
  }

  processSegmentation(segmentationData) {
    return segmentationData.map(segment => ({
      segment: `${segment.membership_stage}_${segment.role}_${segment.is_verified ? 'verified' : 'unverified'}`,
      count: segment.count,
      avgDaysSinceJoined: Math.round(segment.avg_days_since_joined || 0),
      membershipStage: segment.membership_stage,
      role: segment.role,
      isVerified: segment.is_verified
    }));
  }

  generateInsights(summaryData) {
    const insights = [];
    
    // Membership conversion insight
    const totalUsers = summaryData.totalUsers || 0;
    const members = summaryData.members || 0;
    const conversionRate = totalUsers > 0 ? (members / totalUsers) * 100 : 0;
    
    if (conversionRate < 20) {
      insights.push({
        type: 'warning',
        title: 'Low Membership Conversion',
        message: `Only ${conversionRate.toFixed(1)}% of users become members. Consider improving onboarding.`,
        priority: 'high'
      });
    } else if (conversionRate > 60) {
      insights.push({
        type: 'success',
        title: 'High Membership Conversion',
        message: `Excellent ${conversionRate.toFixed(1)}% membership conversion rate.`,
        priority: 'info'
      });
    }
    
    // Pending applications insight
    const pendingApps = summaryData.pendingApplications || 0;
    if (pendingApps > 50) {
      insights.push({
        type: 'urgent',
        title: 'High Pending Applications',
        message: `${pendingApps} applications await review. Consider additional reviewers.`,
        priority: 'high'
      });
    }
    
    return insights;
  }
}

// Create a singleton instance
const userAdminServicesInstance = new userAdminServices();

// Export all methods as named exports for compatibility with existing imports
export const {
  // Dashboard Analytics
  getOverviewStats,
  getDetailedStats,
  getAnalytics,
  getPendingCount,
  
  // User Management
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  grantPostingRights,
  banUser,
  unbanUser,
  
  // Application Management
  getApplications,
  getPendingApplications,
  reviewApplication,
  
  // Content Moderation
  getContentReports,
  resolveReport,
  getActivityLogs,
  getAuditTrail,
  
  // Bulk Operations
  bulkApproveUsers,
  bulkAssignMentors,
  bulkSendNotifications,
  
  // Identity Management
  maskUserIdentityAdvanced,
  unmaskUserIdentity,
  getIdentityAuditTrail,
  getIdentityDashboard,
  getMentorAnalytics,
  bulkAssignMentorsAdvanced,
  
  // System Management
  exportUserData,
  generateBulkIds,
  generateConverseId,
  generateClassId
} = userAdminServicesInstance;

// Default export for class-based usage (as instance)
export default userAdminServicesInstance;




