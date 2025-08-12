// services/userService.js - Updated for your database schema
import db from '../config/db.js';
import bcrypt from 'bcrypt';

export class UserService {
  
  // Get user by ID with full profile data
  static async getUserById(userId) {
    try {
      const result = await db.query(`
        SELECT u.*, 
               COUNT(DISTINCT t.id) as teaching_count,
               COUNT(DISTINCT c.id) as comment_count,
               u.createdAt as member_since
        FROM users u
        LEFT JOIN teachings t ON u.id = t.user_id
        LEFT JOIN comments c ON u.id = c.user_id
        WHERE u.id = ?
        GROUP BY u.id
      `, [userId]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user data');
    }
  }

  // Get user dashboard data
  static async getUserDashboard(userId) {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');

      // Get recent activities
      const recentActivities = await db.query(`
        SELECT 'teaching' as type, title as content, createdAt as created_at
        FROM teachings WHERE user_id = ?
        UNION ALL
        SELECT 'comment' as type, content, createdAt as created_at
        FROM comments WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `, [userId, userId]);

      // Get application status from surveylog
      const applicationStatus = await db.query(`
        SELECT approval_status, createdAt as created_at, admin_notes
        FROM surveylog 
        WHERE user_id = ? 
        ORDER BY createdAt DESC 
        LIMIT 1
      `, [userId]);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          membership_stage: user.membership_stage,
          is_member: user.is_member,
          member_since: user.member_since,
          teaching_count: user.teaching_count || 0,
          comment_count: user.comment_count || 0
        },
        recentActivities: recentActivities.rows,
        applicationStatus: applicationStatus.rows[0] || null,
        accessLevels: {
          canAccessTowncrier: ['pre_member', 'member'].includes(user.membership_stage),
          canAccessIko: ['member'].includes(user.membership_stage),
          canCreateTeachings: ['member'].includes(user.membership_stage) || ['admin', 'super_admin'].includes(user.role),
          canApplyFullMembership: user.membership_stage === 'pre_member'
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw new Error('Failed to fetch dashboard data');
    }
  }

  // Update user profile
  static async updateUserProfile(userId, updateData) {
    try {
      const allowedFields = [
        'username', 'email', 'phone', 'avatar', 
        'membership_stage', 'is_member', 'role', 'isbanned'
      ];
      
      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(userId);
      const query = `
        UPDATE users 
        SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await db.query(query, values);
      
      // Return updated user
      return await this.getUserById(userId);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  // Get user by email
static async getUserByEmail(email) {
  try {
    console.log('🔍 UserService: Looking up user:', email);
    
    const result = await db.query(`
      SELECT 
        id, 
        username, 
        email, 
        password_hash,
        role,
        membership_stage,
        is_member,
        isbanned,
        is_verified,
        createdAt,
        updatedAt
      FROM users 
      WHERE email = ?
      LIMIT 1
    `, [email]);

    console.log('🔍 UserService: MySQL returned', result.rows.length, 'rows');

    if (result.rows.length === 0) {
      console.log('❌ UserService: No user found for:', email);
      return null;
    }

    const user = result.rows[0];
    console.log('✅ UserService: Found user:', {
      id: user.id,
      username: user.username,
      email: user.email,
      has_password: !!user.password_hash,
      membership: user.membership_stage,
      banned: user.isbanned
    });
    
    return user;
  } catch (error) {
    console.error('❌ UserService MySQL error:', error.message);
    throw error;
  }
}


  // Create new user
  static async createUser(userData) {
    try {
      const { username, email, password, role = 'user' } = userData;
      
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const result = await db.query(`
        INSERT INTO users (username, email, password_hash, role, membership_stage, is_member, createdAt)
        VALUES (?, ?, ?, ?, 'none', 'applied', CURRENT_TIMESTAMP)
      `, [username, email.toLowerCase(), hashedPassword, role]);

      // Get the created user
      const userId = result.rows.insertId || result.rows[0]?.id;
      return await this.getUserById(userId);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  // Check if user exists
  static async userExists(email, username) {
    try {
      const result = await db.query(`
        SELECT id FROM users WHERE email = ? OR username = ?
      `, [email.toLowerCase(), username]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking user existence:', error);
      throw new Error('Failed to check user existence');
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

  // Update last login - using existing field or create a simple log
  static async updateLastLogin(userId) {
    try {
      // Since your table doesn't have last_login, we'll just update updatedAt
      await db.query(`
        UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?
      `, [userId]);
    } catch (error) {
      console.error('Error updating last login:', error);
      throw new Error('Failed to update last login');
    }
  }
};




// // services/userService.js
// import db from '../config/db.js';
// import bcrypt from 'bcrypt';

// export class UserService {
  
//   // Get user by ID with full profile data
//   static async getUserById(userId) {
//     try {
//       const result = await db.query(`
//         SELECT u.*, 
//                COUNT(DISTINCT t.id) as teaching_count,
//                COUNT(DISTINCT c.id) as comment_count,
//                u.created_at as member_since
//         FROM users u
//         LEFT JOIN teachings t ON u.id = t.user_id
//         LEFT JOIN comments c ON u.id = c.user_id
//         WHERE u.id = $1
//         GROUP BY u.id
//       `, [userId]);
      
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error('Error fetching user:', error);
//       throw new Error('Failed to fetch user data');
//     }
//   }

//   // Get user dashboard data
//   static async getUserDashboard(userId) {
//     try {
//       const user = await this.getUserById(userId);
//       if (!user) throw new Error('User not found');

//       // Get recent activities
//       const recentActivities = await db.query(`
//         SELECT 'teaching' as type, title as content, created_at
//         FROM teachings WHERE user_id = $1
//         UNION ALL
//         SELECT 'comment' as type, content, created_at
//         FROM comments WHERE user_id = $1
//         ORDER BY created_at DESC
//         LIMIT 10
//       `, [userId]);

//       // Get application status
//       const applicationStatus = await db.query(`
//         SELECT approval_status, created_at, admin_notes
//         FROM surveylog 
//         WHERE user_id = $1 
//         ORDER BY created_at DESC 
//         LIMIT 1
//       `, [userId]);

//       return {
//         user: {
//           id: user.id,
//           username: user.username,
//           email: user.email,
//           membership_stage: user.membership_stage,
//           is_member: user.is_member,
//           member_since: user.member_since,
//           teaching_count: user.teaching_count || 0,
//           comment_count: user.comment_count || 0
//         },
//         recentActivities: recentActivities.rows,
//         applicationStatus: applicationStatus.rows[0] || null,
//         accessLevels: {
//           canAccessTowncrier: ['pre_member', 'member', 'admin', 'super_admin'].includes(user.membership_stage),
//           canAccessIko: ['member', 'admin', 'super_admin'].includes(user.membership_stage),
//           canCreateTeachings: ['member', 'admin', 'super_admin'].includes(user.membership_stage),
//           canApplyFullMembership: user.membership_stage === 'pre_member'
//         }
//       };
//     } catch (error) {
//       console.error('Error fetching dashboard:', error);
//       throw new Error('Failed to fetch dashboard data');
//     }
//   }

//   // Update user profile
//   static async updateUserProfile(userId, updateData) {
//     try {
//       const allowedFields = ['username', 'email', 'bio', 'location', 'website'];
//       const updates = [];
//       const values = [];
//       let paramCount = 1;

//       for (const [key, value] of Object.entries(updateData)) {
//         if (allowedFields.includes(key) && value !== undefined) {
//           updates.push(`${key} = $${paramCount}`);
//           values.push(value);
//           paramCount++;
//         }
//       }

//       if (updates.length === 0) {
//         throw new Error('No valid fields to update');
//       }

//       values.push(userId); // Add userId as last parameter
//       const query = `
//         UPDATE users 
//         SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
//         WHERE id = $${paramCount}
//         RETURNING *
//       `;

//       const result = await db.query(query, values);
//       return result.rows[0];
//     } catch (error) {
//       console.error('Error updating profile:', error);
//       throw new Error('Failed to update profile');
//     }
//   }
// }

// // services/applicationService.js
// export class ApplicationService {
  
//   // Submit initial application
//   static async submitInitialApplication(userId, answers) {
//     try {
//       // Check if user already has a pending application
//       const existingApp = await db.query(`
//         SELECT id FROM surveylog 
//         WHERE user_id = $1 AND approval_status = 'pending'
//       `, [userId]);

//       if (existingApp.rows.length > 0) {
//         throw new Error('You already have a pending application');
//       }

//       // Insert application
//       const result = await db.query(`
//         INSERT INTO surveylog (user_id, survey_data, approval_status, created_at)
//         VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP)
//         RETURNING *
//       `, [userId, JSON.stringify({ type: 'initial', answers })]);

//       // Update user status to applicant
//       await db.query(`
//         UPDATE users 
//         SET membership_stage = 'applicant', updated_at = CURRENT_TIMESTAMP
//         WHERE id = $1
//       `, [userId]);

//       return result.rows[0];
//     } catch (error) {
//       console.error('Error submitting application:', error);
//       throw new Error('Failed to submit application');
//     }
//   }

//   // Submit full membership application
//   static async submitFullMembershipApplication(userId, answers) {
//     try {
//       // Verify user is pre-member
//       const user = await db.query(`
//         SELECT membership_stage FROM users WHERE id = $1
//       `, [userId]);

//       if (!user.rows[0] || user.rows[0].membership_stage !== 'pre_member') {
//         throw new Error('Only pre-members can apply for full membership');
//       }

//       // Insert full membership application
//       const result = await db.query(`
//         INSERT INTO surveylog (user_id, survey_data, approval_status, created_at)
//         VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP)
//         RETURNING *
//       `, [userId, JSON.stringify({ type: 'full_membership', answers })]);

//       return result.rows[0];
//     } catch (error) {
//       console.error('Error submitting full membership application:', error);
//       throw new Error('Failed to submit full membership application');
//     }
//   }

//   // Get application status
//   static async getApplicationStatus(userId, applicationType = 'initial') {
//     try {
//       const result = await db.query(`
//         SELECT s.*, u.username, u.email
//         FROM surveylog s
//         JOIN users u ON s.user_id = u.id
//         WHERE s.user_id = $1 
//         AND s.survey_data->>'type' = $2
//         ORDER BY s.created_at DESC
//         LIMIT 1
//       `, [userId, applicationType]);

//       return result.rows[0] || null;
//     } catch (error) {
//       console.error('Error fetching application status:', error);
//       throw new Error('Failed to fetch application status');
//     }
//   }
// }

// // services/contentService.js
// export class ContentService {
  
//   // Get teachings with proper access control
//   static async getTeachings(userId, userMembershipStage) {
//     try {
//       let accessFilter = '';
      
//       // Determine access level
//       if (['admin', 'super_admin'].includes(userMembershipStage)) {
//         accessFilter = ''; // Admins see everything
//       } else if (userMembershipStage === 'member') {
//         accessFilter = "AND (t.audience IN ('public', 'member') OR t.user_id = $2)";
//       } else if (userMembershipStage === 'pre_member') {
//         accessFilter = "AND (t.audience = 'public' OR t.user_id = $2)";
//       } else {
//         accessFilter = "AND t.audience = 'public'";
//       }

//       const query = `
//         SELECT t.*, u.username as author_name, u.membership_stage as author_level,
//                COUNT(DISTINCT c.id) as comment_count,
//                COUNT(DISTINCT l.id) as like_count
//         FROM teachings t
//         JOIN users u ON t.user_id = u.id
//         LEFT JOIN comments c ON t.id = c.teaching_id
//         LEFT JOIN teaching_likes l ON t.id = l.teaching_id
//         WHERE t.is_published = true ${accessFilter}
//         GROUP BY t.id, u.username, u.membership_stage
//         ORDER BY t.created_at DESC
//       `;

//       const values = accessFilter ? [userId, userId] : [userId];
//       const result = await db.query(query, values);
      
//       return result.rows;
//     } catch (error) {
//       console.error('Error fetching teachings:', error);
//       throw new Error('Failed to fetch teachings');
//     }
//   }

//   // Create new teaching
//   static async createTeaching(userId, teachingData) {
//     try {
//       const { topic, description, content, audience = 'member', subjectMatter } = teachingData;
      
//       // Verify user can create teachings
//       const user = await db.query(`
//         SELECT membership_stage FROM users WHERE id = $1
//       `, [userId]);

//       if (!user.rows[0] || !['member', 'admin', 'super_admin'].includes(user.rows[0].membership_stage)) {
//         throw new Error('Only full members can create teachings');
//       }

//       const result = await db.query(`
//         INSERT INTO teachings (user_id, topic, description, content, audience, subject_matter, is_published, created_at)
//         VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP)
//         RETURNING *
//       `, [userId, topic, description, content, audience, subjectMatter]);

//       return result.rows[0];
//     } catch (error) {
//       console.error('Error creating teaching:', error);
//       throw new Error('Failed to create teaching');
//     }
//   }

//   // Get user's own teachings
//   static async getUserTeachings(userId) {
//     try {
//       const result = await db.query(`
//         SELECT t.*, 
//                COUNT(DISTINCT c.id) as comment_count,
//                COUNT(DISTINCT l.id) as like_count
//         FROM teachings t
//         LEFT JOIN comments c ON t.id = c.teaching_id
//         LEFT JOIN teaching_likes l ON t.id = l.teaching_id
//         WHERE t.user_id = $1
//         GROUP BY t.id
//         ORDER BY t.created_at DESC
//       `, [userId]);

//       return result.rows;
//     } catch (error) {
//       console.error('Error fetching user teachings:', error);
//       throw new Error('Failed to fetch user teachings');
//     }
//   }

//   // Get Towncrier content (pre-member level)
//   static async getTowncrier(userId, userMembershipStage) {
//     try {
//       if (!['pre_member', 'member', 'admin', 'super_admin'].includes(userMembershipStage)) {
//         throw new Error('Access denied: Insufficient membership level');
//       }

//       const result = await db.query(`
//         SELECT t.*, u.username as author_name,
//                COUNT(DISTINCT c.id) as comment_count
//         FROM teachings t
//         JOIN users u ON t.user_id = u.id
//         LEFT JOIN comments c ON t.id = c.teaching_id
//         WHERE t.audience IN ('public') 
//         AND t.is_published = true
//         GROUP BY t.id, u.username
//         ORDER BY t.created_at DESC
//         LIMIT 20
//       `);

//       return result.rows;
//     } catch (error) {
//       console.error('Error fetching Towncrier:', error);
//       throw new Error('Failed to fetch Towncrier content');
//     }
//   }

//   // Get Iko content (full member level)
//   static async getIko(userId, userMembershipStage) {
//     try {
//       if (!['member', 'admin', 'super_admin'].includes(userMembershipStage)) {
//         throw new Error('Access denied: Full membership required');
//       }

//       const result = await db.query(`
//         SELECT t.*, u.username as author_name,
//                COUNT(DISTINCT c.id) as comment_count
//         FROM teachings t
//         JOIN users u ON t.user_id = u.id
//         LEFT JOIN comments c ON t.id = c.teaching_id
//         WHERE t.audience IN ('member') 
//         AND t.is_published = true
//         GROUP BY t.id, u.username
//         ORDER BY t.created_at DESC
//         LIMIT 50
//       `);

//       return result.rows;
//     } catch (error) {
//       console.error('Error fetching Iko:', error);
//       throw new Error('Failed to fetch Iko content');
//     }
//   }
// }

// // services/adminService.js
// export class AdminService {
  
//   // Get all users with pagination
//   static async getAllUsers(page = 1, limit = 20, filters = {}) {
//     try {
//       const offset = (page - 1) * limit;
//       let whereClause = '';
//       const queryParams = [];
//       let paramCount = 1;

//       // Build filter conditions
//       if (filters.membership_stage) {
//         whereClause += ` WHERE membership_stage = $${paramCount}`;
//         queryParams.push(filters.membership_stage);
//         paramCount++;
//       }

//       if (filters.search) {
//         const searchClause = whereClause ? ' AND' : ' WHERE';
//         whereClause += `${searchClause} (username ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
//         queryParams.push(`%${filters.search}%`);
//         paramCount++;
//       }

//       // Get total count
//       const countResult = await db.query(`
//         SELECT COUNT(*) as total FROM users${whereClause}
//       `, queryParams);

//       // Get users
//       queryParams.push(limit, offset);
//       const result = await db.query(`
//         SELECT u.*, 
//                COUNT(DISTINCT t.id) as teaching_count,
//                COUNT(DISTINCT c.id) as comment_count,
//                MAX(s.created_at) as last_application_date
//         FROM users u
//         LEFT JOIN teachings t ON u.id = t.user_id
//         LEFT JOIN comments c ON u.id = c.user_id
//         LEFT JOIN surveylog s ON u.id = s.user_id
//         ${whereClause}
//         GROUP BY u.id
//         ORDER BY u.created_at DESC
//         LIMIT $${paramCount - 1} OFFSET $${paramCount}
//       `, queryParams);

//       return {
//         users: result.rows,
//         total: parseInt(countResult.rows[0].total),
//         page,
//         totalPages: Math.ceil(countResult.rows[0].total / limit)
//       };
//     } catch (error) {
//       console.error('Error fetching users:', error);
//       throw new Error('Failed to fetch users');
//     }
//   }

//   // Get pending applications
//   static async getPendingApplications() {
//     try {
//       const result = await db.query(`
//         SELECT s.*, u.username, u.email, u.membership_stage,
//                u.created_at as user_created_at
//         FROM surveylog s
//         JOIN users u ON s.user_id = u.id
//         WHERE s.approval_status = 'pending'
//         ORDER BY s.created_at ASC
//       `);

//       return result.rows;
//     } catch (error) {
//       console.error('Error fetching applications:', error);
//       throw new Error('Failed to fetch applications');
//     }
//   }

//   // Review application
//   static async reviewApplication(applicationId, adminId, decision, adminNotes = '') {
//     try {
//       const validDecisions = ['approved', 'rejected', 'needs_review'];
//       if (!validDecisions.includes(decision)) {
//         throw new Error('Invalid decision');
//       }

//       // Update application
//       const result = await db.query(`
//         UPDATE surveylog 
//         SET approval_status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP
//         WHERE id = $4
//         RETURNING *
//       `, [decision, adminNotes, adminId, applicationId]);

//       if (result.rows.length === 0) {
//         throw new Error('Application not found');
//       }

//       const application = result.rows[0];

//       // Update user membership status if approved
//       if (decision === 'approved') {
//         const surveyData = application.survey_data;
//         const applicationType = surveyData.type;
        
//         let newMembershipStage;
//         if (applicationType === 'initial') {
//           newMembershipStage = 'pre_member';
//         } else if (applicationType === 'full_membership') {
//           newMembershipStage = 'member';
//         }

//         if (newMembershipStage) {
//           await db.query(`
//             UPDATE users 
//             SET membership_stage = $1, is_member = $1, updated_at = CURRENT_TIMESTAMP
//             WHERE id = $2
//           `, [newMembershipStage, application.user_id]);
//         }
//       }

//       return application;
//     } catch (error) {
//       console.error('Error reviewing application:', error);
//       throw new Error('Failed to review application');
//     }
//   }

//   // Get system statistics
//   static async getSystemStats() {
//     try {
//       const stats = await db.query(`
//         SELECT 
//           (SELECT COUNT(*) FROM users) as total_users,
//           (SELECT COUNT(*) FROM users WHERE membership_stage = 'applicant') as pending_applicants,
//           (SELECT COUNT(*) FROM users WHERE membership_stage = 'pre_member') as pre_members,
//           (SELECT COUNT(*) FROM users WHERE membership_stage = 'member') as full_members,
//           (SELECT COUNT(*) FROM teachings WHERE is_published = true) as total_teachings,
//           (SELECT COUNT(*) FROM comments) as total_comments,
//           (SELECT COUNT(*) FROM surveylog WHERE approval_status = 'pending') as pending_applications
//       `);

//       return stats.rows[0];
//     } catch (error) {
//       console.error('Error fetching stats:', error);
//       throw new Error('Failed to fetch system statistics');
//     }
//   }
// }