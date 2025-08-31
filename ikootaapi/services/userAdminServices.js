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
        LEFT JOIN users admin ON iam.masked_by_admin_id = admin.converse_id
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
          (SELECT COUNT(*) FROM users WHERE is_identity_masked = 1) as totalMaskedUsers,
          (SELECT COUNT(*) FROM identity_masks WHERE is_active = 1) as activeMasks,
          (SELECT COUNT(*) FROM identity_masks WHERE expiresAt IS NOT NULL AND expiresAt < NOW()) as expiredMasks,
          (SELECT COUNT(DISTINCT created_by) FROM identity_masks WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as adminsInvolved,
          (SELECT COUNT(*) FROM identity_masking_audit WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as recentActions
      `);

      return {
        success: true,
        dashboard: {
          totalMaskedUsers: stats.totalMaskedUsers || 0,
          activeMasks: stats.activeMasks || 0,
          expiredMasks: stats.expiredMasks || 0,
          adminsInvolved: stats.adminsInvolved || 0,
          recentActions: stats.recentActions || 0
        }
      };
    } catch (error) {
      console.error('Get identity dashboard service error:', error);
      throw new CustomError('Failed to fetch identity dashboard: ' + error.message);
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








// import query from '../config/database.js';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import crypto from 'crypto';
// import { v4 as uuidv4 } from 'uuid';

// class AdminServices {
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

// export default AdminServices;