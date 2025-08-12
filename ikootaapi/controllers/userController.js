// controllers/userController.js - COMPLETE FILE
import { UserService } from '../services/userService.js';

export class UserController {
  
  // Get user profile with real data
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
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
      console.error('Profile fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch profile'
      });
    }
  }

  // Get comprehensive dashboard
  static async getDashboard(req, res) {
    try {
      const userId = req.user.id;
      const dashboardData = await UserService.getUserDashboard(userId);
      
      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      const updatedUser = await UserService.updateUserProfile(userId, updateData);
      
      // Remove sensitive data
      const { password, ...safeUser } = updatedUser;
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: safeUser
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update profile'
      });
    }
  }

  // Get user status and permissions
  static async getStatus(req, res) {
    try {
      const userId = req.user.id;
      const user = await UserService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const status = {
        user_id: user.id,
        membership_stage: user.membership_stage,
        is_member: user.is_member,
        permissions: {
          canAccessTowncrier: ['pre_member', 'member', 'admin', 'super_admin'].includes(user.membership_stage),
          canAccessIko: ['member', 'admin', 'super_admin'].includes(user.membership_stage),
          canCreateTeachings: ['member', 'admin', 'super_admin'].includes(user.membership_stage),
          canApplyFullMembership: user.membership_stage === 'pre_member',
          canAccessAdmin: ['admin', 'super_admin'].includes(user.membership_stage)
        },
        account_status: user.is_banned ? 'banned' : 'active',
        member_since: user.created_at
      };
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Status fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user status'
      });
    }
  }
};