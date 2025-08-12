
// controllers/contentController.js - COMPLETE FILE
import { ContentService } from '../services/contentService.js';

export class ContentController {
  
  // Get all teachings with access control
  static async getTeachings(req, res) {
    try {
      const userId = req.user.id;
      const userMembershipStage = req.user.membership_stage;
      
      const teachings = await ContentService.getTeachings(userId, userMembershipStage);
      
      res.json({
        success: true,
        data: {
          teachings,
          user_access_level: userMembershipStage,
          total_count: teachings.length
        }
      });
    } catch (error) {
      console.error('Teachings fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch teachings'
      });
    }
  }

  // Create new teaching
  static async createTeaching(req, res) {
    try {
      const userId = req.user.id;
      const teachingData = req.body;
      
      const teaching = await ContentService.createTeaching(userId, teachingData);
      
      res.status(201).json({
        success: true,
        message: 'Teaching created successfully',
        data: teaching
      });
    } catch (error) {
      console.error('Teaching creation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create teaching'
      });
    }
  }

  // Get user's own teachings
  static async getMyTeachings(req, res) {
    try {
      const userId = req.user.id;
      const teachings = await ContentService.getUserTeachings(userId);
      
      res.json({
        success: true,
        data: {
          teachings,
          total_count: teachings.length
        }
      });
    } catch (error) {
      console.error('My teachings fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch your teachings'
      });
    }
  }

  // Get Towncrier content
  static async getTowncrier(req, res) {
    try {
      const userId = req.user.id;
      const userMembershipStage = req.user.membership_stage;
      
      const content = await ContentService.getTowncrier(userId, userMembershipStage);
      
      res.json({
        success: true,
        data: {
          content,
          access_level: 'towncrier',
          user_membership: userMembershipStage,
          total_count: content.length
        }
      });
    } catch (error) {
      console.error('Towncrier fetch error:', error);
      res.status(403).json({
        success: false,
        error: error.message || 'Access denied to Towncrier'
      });
    }
  }

  // Get Iko content
  static async getIko(req, res) {
    try {
      const userId = req.user.id;
      const userMembershipStage = req.user.membership_stage;
      
      const content = await ContentService.getIko(userId, userMembershipStage);
      
      res.json({
        success: true,
        data: {
          content,
          access_level: 'iko',
          user_membership: userMembershipStage,
          total_count: content.length
        }
      });
    } catch (error) {
      console.error('Iko fetch error:', error);
      res.status(403).json({
        success: false,
        error: error.message || 'Access denied to Iko'
      });
    }
  }

  // Get teaching by ID
  static async getTeachingById(req, res) {
    try {
      const { teachingId } = req.params;
      const teaching = await ContentService.getTeachingById(teachingId);
      
      if (!teaching) {
        return res.status(404).json({
          success: false,
          error: 'Teaching not found'
        });
      }

      res.json({
        success: true,
        data: teaching
      });
    } catch (error) {
      console.error('Teaching fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch teaching'
      });
    }
  }

  // Update teaching
  static async updateTeaching(req, res) {
    try {
      const { teachingId } = req.params;
      const userId = req.user.id;
      const updateData = req.body;
      
      const updatedTeaching = await ContentService.updateTeaching(teachingId, userId, updateData);
      
      res.json({
        success: true,
        message: 'Teaching updated successfully',
        data: updatedTeaching
      });
    } catch (error) {
      console.error('Teaching update error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update teaching'
      });
    }
  }

  // Delete teaching
  static async deleteTeaching(req, res) {
    try {
      const { teachingId } = req.params;
      const userId = req.user.id;
      
      const deletedTeaching = await ContentService.deleteTeaching(teachingId, userId);
      
      res.json({
        success: true,
        message: 'Teaching deleted successfully',
        data: deletedTeaching
      });
    } catch (error) {
      console.error('Teaching deletion error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete teaching'
      });
    }
  }
};