// controllers/applicationController.js - COMPLETE FILE
import { ApplicationService } from '../services/applicationService.js';

export class ApplicationController {
  
  // Submit initial application
  static async submitInitial(req, res) {
    try {
      const userId = req.user.id;
      const { answers } = req.body;
      
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Application answers are required'
        });
      }

      const application = await ApplicationService.submitInitialApplication(userId, answers);
      
      res.status(201).json({
        success: true,
        message: 'Initial application submitted successfully',
        data: {
          application_id: application.id,
          status: application.approval_status,
          submitted_at: application.created_at
        }
      });
    } catch (error) {
      console.error('Initial application error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit application'
      });
    }
  }

  // Submit full membership application
  static async submitFullMembership(req, res) {
    try {
      const userId = req.user.id;
      const { answers } = req.body;
      
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Application answers are required'
        });
      }

      const application = await ApplicationService.submitFullMembershipApplication(userId, answers);
      
      res.status(201).json({
        success: true,
        message: 'Full membership application submitted successfully',
        data: {
          application_id: application.id,
          status: application.approval_status,
          submitted_at: application.created_at
        }
      });
    } catch (error) {
      console.error('Full membership application error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit full membership application'
      });
    }
  }

  // Get initial application status
  static async getInitialStatus(req, res) {
    try {
      const userId = req.user.id;
      const application = await ApplicationService.getApplicationStatus(userId, 'initial');
      
      if (!application) {
        return res.json({
          success: true,
          data: {
            has_application: false,
            status: null,
            message: 'No initial application found'
          }
        });
      }
      
      res.json({
        success: true,
        data: {
          has_application: true,
          application_id: application.id,
          status: application.approval_status,
          submitted_at: application.created_at,
          reviewed_at: application.reviewed_at,
          admin_notes: application.admin_notes
        }
      });
    } catch (error) {
      console.error('Application status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch application status'
      });
    }
  }

  // Get full membership application status
  static async getFullMembershipStatus(req, res) {
    try {
      const userId = req.user.id;
      const application = await ApplicationService.getApplicationStatus(userId, 'full_membership');
      
      if (!application) {
        return res.json({
          success: true,
          data: {
            has_application: false,
            status: null,
            message: 'No full membership application found'
          }
        });
      }
      
      res.json({
        success: true,
        data: {
          has_application: true,
          application_id: application.id,
          status: application.approval_status,
          submitted_at: application.created_at,
          reviewed_at: application.reviewed_at,
          admin_notes: application.admin_notes
        }
      });
    } catch (error) {
      console.error('Full membership status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch full membership application status'
      });
    }
  }

  // Get all user applications
  static async getAllApplications(req, res) {
    try {
      const userId = req.user.id;
      const applications = await ApplicationService.getAllUserApplications(userId);
      
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

  // Cancel application
  static async cancelApplication(req, res) {
    try {
      const userId = req.user.id;
      const { applicationId } = req.params;
      
      const cancelledApplication = await ApplicationService.cancelApplication(userId, applicationId);
      
      res.json({
        success: true,
        message: 'Application cancelled successfully',
        data: cancelledApplication
      });
    } catch (error) {
      console.error('Application cancellation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to cancel application'
      });
    }
  }
};