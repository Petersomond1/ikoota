
// controllers/adminController.js - COMPLETE FILE
import { AdminService } from '../services/adminService.js';
import { UserService } from '../services/userService.js';
import db from '../config/db.js';

export class AdminController {
  
  // Get all users with pagination and filters
  static async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {
        membership_stage: req.query.membership_stage,
        search: req.query.search
      };
      
      const result = await AdminService.getAllUsers(page, limit, filters);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Users fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users'
      });
    }
  }

  // Get specific user by ID
  static async getUserById(req, res) {
    try {
      const { userId } = req.params;
      const user = await UserService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Remove sensitive data
      const { password, ...safeUser } = user;
      
      res.json({
        success: true,
        data: safeUser
      });
    } catch (error) {
      console.error('User fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user'
      });
    }
  }

  // Update user (admin only)
  static async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const updateData = req.body;
      
      // Admin can update additional fields
      const allowedAdminFields = [
        'username', 'email', 'membership_stage', 'is_member', 
        'role', 'is_banned', 'ban_reason'
      ];
      
      const filteredData = {};
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedAdminFields.includes(key)) {
          filteredData[key] = value;
        }
      }

      if (Object.keys(filteredData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      const updatedUser = await UserService.updateUserProfile(userId, filteredData);
      
      // Remove sensitive data
      const { password, ...safeUser } = updatedUser;
      
      res.json({
        success: true,
        message: 'User updated successfully',
        data: safeUser
      });
    } catch (error) {
      console.error('User update error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update user'
      });
    }
  }

  // Get pending applications
  static async getApplications(req, res) {
    try {
      const filters = {
        status: req.query.status,
        type: req.query.type
      };
      
      const applications = filters.status || filters.type 
        ? await AdminService.getAllApplications(filters)
        : await AdminService.getPendingApplications();
      
      res.json({
        success: true,
        data: {
          applications,
          total_count: applications.length
        }
      });
    } catch (error) {
      console.error('Applications fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch applications'
      });
    }
  }

  // Review application
  static async reviewApplication(req, res) {
    try {
      const { applicationId } = req.params;
      const { status, adminNotes } = req.body;
      const adminId = req.user.id;
      
      if (!['approved', 'rejected', 'needs_review'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be: approved, rejected, or needs_review'
        });
      }

      const reviewedApplication = await AdminService.reviewApplication(
        applicationId, 
        adminId, 
        status, 
        adminNotes
      );
      
      res.json({
        success: true,
        message: `Application ${status} successfully`,
        data: reviewedApplication
      });
    } catch (error) {
      console.error('Application review error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to review application'
      });
    }
  }

  // Ban user
  static async banUser(req, res) {
    try {
      const { userId } = req.params;
      const { reason, duration } = req.body;
      
      // Calculate ban expiry if duration provided
      let banExpiry = null;
      if (duration && duration !== 'permanent') {
        const durationMs = {
          '1 day': 24 * 60 * 60 * 1000,
          '7 days': 7 * 24 * 60 * 60 * 1000,
          '30 days': 30 * 24 * 60 * 60 * 1000
        };
        
        if (durationMs[duration]) {
          banExpiry = new Date(Date.now() + durationMs[duration]);
        }
      }

      const updateData = {
        is_banned: true,
        ban_reason: reason,
        banned_at: new Date(),
        ban_expiry: banExpiry,
        banned_by: req.user.id
      };

      const updatedUser = await UserService.updateUserProfile(userId, updateData);
      
      res.json({
        success: true,
        message: 'User banned successfully',
        data: {
          user_id: updatedUser.id,
          ban_reason: reason,
          ban_duration: duration,
          ban_expiry: banExpiry
        }
      });
    } catch (error) {
      console.error('Ban user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to ban user'
      });
    }
  }

  // Unban user
  static async unbanUser(req, res) {
    try {
      const { userId } = req.params;
      
      const updateData = {
        is_banned: false,
        ban_reason: null,
        ban_expiry: null,
        banned_by: null,
        banned_at: null
      };

      const updatedUser = await UserService.updateUserProfile(userId, updateData);
      
      res.json({
        success: true,
        message: 'User unbanned successfully',
        data: {
          user_id: updatedUser.id,
          status: 'active'
        }
      });
    } catch (error) {
      console.error('Unban user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unban user'
      });
    }
  }

  // Get system statistics
  static async getSystemStats(req, res) {
    try {
      const stats = await AdminService.getSystemStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Stats fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch system statistics'
      });
    }
  }

  // Get system health
  static async getSystemHealth(req, res) {
    try {
      // Check database connection
      const dbCheck = await db.query('SELECT 1');
      const dbHealthy = dbCheck.rows.length > 0;
      
      // Check memory usage
      const memUsage = process.memoryUsage();
      
      // Get uptime
      const uptime = process.uptime();
      
      const health = {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        database: dbHealthy ? 'connected' : 'disconnected',
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
        },
        uptime: Math.round(uptime) + ' seconds',
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        success: false,
        error: 'Health check failed',
        data: {
          status: 'unhealthy',
          database: 'error',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Delete user (admin only)
  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      
      const deletedUser = await AdminService.deleteUser(userId);
      
      res.json({
        success: true,
        message: 'User deleted successfully',
        data: {
          deleted_user_id: deletedUser.id,
          deleted_username: deletedUser.username
        }
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete user'
      });
    }
  }

  // Get application by ID
  static async getApplicationById(req, res) {
    try {
      const { applicationId } = req.params;
      const application = await AdminService.getApplicationById(applicationId);
      
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Application not found'
        });
      }

      res.json({
        success: true,
        data: application
      });
    } catch (error) {
      console.error('Application fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch application'
      });
    }
  }
};