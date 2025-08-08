// ikootaapi/controllers/fullMemberApplicationController.js
// ===============================================
// FULL MEMBERSHIP APPLICATION CONTROLLER
// Handles all full membership application processes for pre-members
// Clean, organized implementation following Phase 3 specifications
// ===============================================

import db from '../config/db.js';
import { sendEmail } from '../utils/notifications.js';
import { sendEmailWithTemplate } from '../utils/email.js';
import CustomError from '../utils/CustomError.js';
import {
  getUserById,
  generateApplicationTicket,
  successResponse,
  errorResponse,
  executeQuery
} from './membershipCore.js';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Enhanced helper function to handle timestamp column variations
 */
const getTimestamp = (obj, fieldName) => {
  if (!obj) return null;
  
  // Try camelCase first (preferred), then snake_case (legacy)
  const camelCase = obj[fieldName];
  if (camelCase) return camelCase;
  
  // Convert camelCase to snake_case and try that
  const snakeCase = fieldName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  return obj[snakeCase] || null;
};

/**
 * Check if user is eligible for full membership
 */
const checkFullMembershipEligibility = async (userId) => {
  try {
    const user = await getUserById(userId);
    
    if (user.membership_stage !== 'pre_member') {
      throw new CustomError(`Not eligible: Current stage is ${user.membership_stage}, must be pre_member`, 403);
    }
    
    if (user.is_member !== 'pre_member') {
      throw new CustomError(`Not eligible: Current status is ${user.is_member}, must be pre_member`, 403);
    }
    
    return user;
  } catch (error) {
    throw error;
  }
};

// =============================================================================
// STATUS & INFORMATION FUNCTIONS
// =============================================================================

/**
 * Get full membership status by user ID
 * GET /full-membership-status/:userId
 */
export const getFullMembershipStatusById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ 
        success: false,
        error: 'Valid user ID required' 
      });
    }

    // Authorization check - users can only view their own status unless admin
    if (req.user.id !== parseInt(userId) && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied - can only view your own status' 
      });
    }

    console.log('🔍 Checking full membership status for user:', userId);

    // Check if user exists
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Get full membership applications for this user
    const appResult = await db.query(
      'SELECT * FROM full_membership_applications WHERE user_id = ? ORDER BY submittedAt DESC LIMIT 1', 
      [userId]
    );
    
    let applications = [];
    if (Array.isArray(appResult)) {
      if (Array.isArray(appResult[0])) {
        applications = appResult[0];
      } else {
        applications = appResult;
      }
    }

    if (applications.length === 0) {
      return res.json({
        success: true,
        hasApplication: false,
        status: 'not_applied',
        eligibility: {
          canApply: user.membership_stage === 'pre_member',
          currentStage: user.membership_stage,
          currentStatus: user.is_member
        },
        appliedAt: null,
        reviewedAt: null,
        ticket: null,
        adminNotes: null
      });
    }

    const app = applications[0];

    return res.json({
      success: true,
      hasApplication: true,
      status: app.status || 'pending',
      appliedAt: getTimestamp(app, 'submittedAt'),
      reviewedAt: getTimestamp(app, 'reviewedAt'),
      ticket: app.membership_ticket,
      adminNotes: app.admin_notes,
      answers: app.answers ? (typeof app.answers === 'string' ? JSON.parse(app.answers) : app.answers) : null,
      eligibility: {
        canReapply: app.status === 'declined',
        currentStage: user.membership_stage,
        currentStatus: user.is_member
      }
    });

  } catch (error) {
    console.error('❌ Error fetching full membership status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get full membership status and eligibility for current user
 * GET /full-membership-info
 */
export const getFullMembershipStatus = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    const user = await getUserById(userId);
    
    // Get full membership application details if exists
    const [fullMembershipApps] = await db.query(`
      SELECT 
        fma.answers,
        fma.status,
        fma.submittedAt,
        fma.reviewedAt,
        fma.admin_notes,
        fma.membership_ticket,
        reviewer.username as reviewed_by
      FROM full_membership_applications fma
      LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
      WHERE fma.user_id = ?
      ORDER BY fma.submittedAt DESC
      LIMIT 1
    `, [userId]);
    
    // Check eligibility for full membership
    const isEligible = user.membership_stage === 'pre_member';
    const currentApp = fullMembershipApps[0] || null;
    
    // Get requirements and benefits
    const requirements = [
      'Must be an approved pre-member',
      'Active participation for at least 30 days',
      'Good standing with community guidelines',
      'Complete full membership questionnaire',
      'Demonstrate commitment to community values'
    ];
    
    const benefits = [
      'Access to exclusive Iko member content',
      'Voting rights in community decisions',
      'Advanced class access and priority scheduling',
      'Mentorship opportunities (both giving and receiving)',
      'Priority support and direct access to leadership',
      'Ability to invite others to the community'
    ];
    
    const nextSteps = isEligible && (!currentApp || currentApp.status === 'declined') ? [
      'Review full membership benefits and responsibilities',
      'Complete the comprehensive membership application',
      'Submit required documentation and references',
      'Participate in community interview process (if selected)'
    ] : !isEligible ? [
      'Complete initial membership process first',
      'Achieve pre-member status',
      'Participate actively in community activities'
    ] : [
      'Application already submitted',
      'Wait for review process to complete',
      'Continue active participation in community'
    ];
    
    return successResponse(res, {
      currentStatus: {
        membership_stage: user.membership_stage,
        is_member: user.is_member,
        full_membership_application_status: currentApp?.status || 'not_submitted'
      },
      fullMembershipApplication: currentApp,
      eligibility: {
        isEligible,
        canApply: isEligible && (!currentApp || currentApp.status === 'declined'),
        requirements,
        benefits
      },
      nextSteps
    });
    
  } catch (error) {
    return errorResponse(res, error);
  }
};

// =============================================================================
// APPLICATION SUBMISSION FUNCTIONS
// =============================================================================

/**
 * Submit full membership application with comprehensive email notifications
 * POST /submit-full-membership
 */
export const submitFullMembershipApplication = async (req, res) => {
  let connection = null;
  
  try {
    const userId = req.user?.user_id || req.user?.id;
    
    console.log('🎯 Full membership application submission started');
    console.log('👤 User ID:', userId);
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        error: 'User not authenticated' 
      });
    }

    const { answers, membershipTicket } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ 
        success: false,
        error: 'Application answers are required and must be an array' 
      });
    }

    if (!membershipTicket) {
      return res.status(400).json({ 
        success: false,
        error: 'Membership ticket is required' 
      });
    }

    console.log('✅ Basic validation passed');

    // Check user eligibility
    const user = await checkFullMembershipEligibility(userId);
    console.log('✅ User eligibility confirmed:', user.username);

    // Check for existing pending applications
    const existingResult = await db.query(
      'SELECT id, status FROM full_membership_applications WHERE user_id = ? AND status = ?', 
      [userId, 'pending']
    );
    
    let existing = [];
    if (Array.isArray(existingResult)) {
      if (Array.isArray(existingResult[0])) {
        existing = existingResult[0];
      } else {
        existing = existingResult;
      }
    }
    
    if (existing && existing.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'You already have a pending membership application',
        existingApplicationId: existing[0].id
      });
    }

    console.log('✅ No existing pending application found');

    // Start database transaction
    connection = await db.getConnection();
    await connection.beginTransaction();
    console.log('🔄 Database transaction started');

    try {
      // Insert the application
      console.log('📝 Inserting full membership application...');
      const [insertResult] = await connection.query(`
        INSERT INTO full_membership_applications 
        (user_id, membership_ticket, answers, status, submittedAt, createdAt, updatedAt) 
        VALUES (?, ?, ?, 'pending', NOW(), NOW(), NOW())
      `, [userId, membershipTicket, JSON.stringify(answers)]);

      const applicationId = insertResult.insertId;
      console.log('✅ Application inserted with ID:', applicationId);

      // Update user status
      console.log('🔄 Updating user status...');
      await connection.query(`
        UPDATE users 
        SET full_membership_status = 'pending',
            full_membership_appliedAt = NOW(),
            full_membership_ticket = ?,
            updatedAt = NOW()
        WHERE id = ?
      `, [membershipTicket, userId]);

      console.log('✅ User status updated');

      // Create audit log
      console.log('📝 Creating audit log...');
      try {
        await connection.query(`
          INSERT INTO audit_logs (user_id, action, details, createdAt)
          VALUES (?, 'full_membership_application_submitted', ?, NOW())
        `, [userId, JSON.stringify({ 
          ticket: membershipTicket, 
          applicationId: applicationId,
          username: user.username,
          email: user.email,
          timestamp: new Date().toISOString()
        })]);
        console.log('✅ Audit log created');
      } catch (auditError) {
        console.log('⚠️ Audit log failed (non-critical):', auditError.message);
      }

      // Commit transaction before sending notifications
      await connection.commit();
      console.log('✅ Database transaction committed');

      // Send email notifications (after successful database commit)
      console.log('📧 Preparing email notifications...');
      
      // 1. Send confirmation email to user
      try {
        console.log('📧 Sending user confirmation email...');
        
        const userEmailContent = {
          to: user.email,
          subject: '🎓 Full Membership Application Submitted Successfully - Ikoota',
          html: generateUserConfirmationEmail(user, membershipTicket),
          text: generateUserConfirmationText(user, membershipTicket)
        };

        // Try to send user email
        if (sendEmailWithTemplate) {
          await sendEmailWithTemplate(userEmailContent);
          console.log('✅ User confirmation email sent via sendEmailWithTemplate');
        } else if (sendEmail) {
          await sendEmail(userEmailContent);
          console.log('✅ User confirmation email sent via sendEmail');
        } else {
          console.log('⚠️ No email function available - check email configuration');
        }

      } catch (userEmailError) {
        console.log('⚠️ User email failed (non-critical):', userEmailError.message);
      }

      // 2. Send notification to admins
      try {
        console.log('📧 Sending admin notification email...');
        
        const adminEmailContent = {
          to: 'admin@ikoota.com,membership@ikoota.com',
          subject: '🔔 NEW Full Membership Application - Immediate Review Required',
          html: generateAdminNotificationEmail(user, membershipTicket, applicationId),
          text: generateAdminNotificationText(user, membershipTicket, applicationId)
        };

        // Try to send admin email
        if (sendEmailWithTemplate) {
          await sendEmailWithTemplate(adminEmailContent);
          console.log('✅ Admin notification email sent via sendEmailWithTemplate');
        } else if (sendEmail) {
          await sendEmail(adminEmailContent);
          console.log('✅ Admin notification email sent via sendEmail');
        }

      } catch (adminEmailError) {
        console.log('⚠️ Admin email failed (non-critical):', adminEmailError.message);
      }

      console.log('📧 Email notifications completed');

      // Success response
      res.status(201).json({
        success: true,
        message: 'Full membership application submitted successfully',
        data: {
          applicationId: applicationId,
          membershipTicket: membershipTicket,
          status: 'pending',
          submittedAt: new Date().toISOString(),
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          },
          nextSteps: [
            'Your application is now under review by our membership committee',
            'Review process typically takes 5-7 business days',
            'You may be contacted for additional information or interview',
            'Continue participating in community activities during review',
            'You will receive email notification once the review is complete'
          ],
          notifications: {
            userEmailSent: true,
            adminNotificationSent: true
          }
        }
      });

    } catch (transactionError) {
      console.error('❌ Transaction error:', transactionError);
      await connection.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ Error submitting full membership application:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Reapplication for declined applications
 * POST /reapply-full-membership
 */
export const reapplyFullMembership = async (req, res) => {
  try {
    console.log('🔄 Full membership reapplication started');
    
    // Check if user has a declined application
    const userId = req.user?.user_id || req.user?.id;
    const user = await checkFullMembershipEligibility(userId);
    
    const [declinedApps] = await db.query(`
      SELECT id, status, reviewedAt, admin_notes
      FROM full_membership_applications 
      WHERE user_id = ? AND status = 'declined'
      ORDER BY submittedAt DESC 
      LIMIT 1
    `, [userId]);
    
    if (declinedApps.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No declined application found to reapply',
        message: 'You can only reapply if you have a previously declined application'
      });
    }
    
    console.log('✅ Declined application found, proceeding with reapplication');
    
    // Use the same enhanced logic as submit for reapplications
    return submitFullMembershipApplication(req, res);
    
  } catch (error) {
    console.error('❌ Error with full membership reapplication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process reapplication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// =============================================================================
// ACCESS TRACKING & LOGGING
// =============================================================================

/**
 * Log full membership access with flexible column handling
 * POST /membership/log-full-membership-access
 */
export const logFullMembershipAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Handle both camelCase and snake_case column names
    let accessQuery = `
      INSERT INTO full_membership_access (user_id, first_accessedAt, last_accessedAt, access_count)
      VALUES (?, NOW(), NOW(), 1)
      ON DUPLICATE KEY UPDATE 
        last_accessedAt = NOW(),
        access_count = access_count + 1
    `;
    
    try {
      await db.query(accessQuery, [userId]);
      console.log('✅ Access logged successfully');
    } catch (accessError) {
      // Try alternative column names if the first attempt fails
      console.log('⚠️ Trying alternative access log format...');
      accessQuery = `
        INSERT INTO full_membership_access (user_id, firstAccessedAt, lastAccessedAt, access_count)
        VALUES (?, NOW(), NOW(), 1)
        ON DUPLICATE KEY UPDATE 
          lastAccessedAt = NOW(),
          access_count = access_count + 1
      `;
      await db.query(accessQuery, [userId]);
      console.log('✅ Access logged with alternative column names');
    }
    
    // Get access info with flexible column handling
    const accessResult = await db.query(`
      SELECT * FROM full_membership_access WHERE user_id = ?
    `, [userId]);
    
    let accessInfo = null;
    if (Array.isArray(accessResult)) {
      if (Array.isArray(accessResult[0])) {
        accessInfo = accessResult[0].length > 0 ? accessResult[0][0] : null;
      } else {
        accessInfo = accessResult.length > 0 ? accessResult[0] : null;
      }
    }
    
    // Normalize the response to use consistent camelCase
    if (accessInfo) {
      accessInfo = {
        firstAccessedAt: getTimestamp(accessInfo, 'firstAccessedAt') || accessInfo.first_accessedAt,
        lastAccessedAt: getTimestamp(accessInfo, 'lastAccessedAt') || accessInfo.last_accessedAt,
        accessCount: accessInfo.access_count || accessInfo.accessCount,
        createdAt: getTimestamp(accessInfo, 'createdAt'),
        updatedAt: getTimestamp(accessInfo, 'updatedAt')
      };
    }
    
    res.json({
      success: true,
      message: 'Access logged successfully',
      data: {
        accessInfo: accessInfo
      }
    });
    
  } catch (error) {
    console.error('❌ Error logging full membership access:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to log access',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// =============================================================================
// EMAIL TEMPLATE GENERATORS
// =============================================================================

/**
 * Generate user confirmation email HTML
 */
const generateUserConfirmationEmail = (user, membershipTicket) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 10px;">🎉</div>
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          Full Membership Application Submitted!
        </h1>
        <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 16px;">
          Your application is now under review
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px;">
        <p style="color: #334155; font-size: 18px; line-height: 1.6; margin: 0 0 25px 0;">
          Dear <strong>${user.username}</strong>,
        </p>
        
        <p style="color: #334155; font-size: 16px; line-height: 1.7; margin: 0 0 30px 0;">
          Congratulations! Your full membership application has been successfully submitted and is now under review by our membership committee.
        </p>
        
        <!-- Ticket Section -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); border: 3px solid #f59e0b; border-radius: 16px; padding: 25px; margin: 30px 0; text-align: center;">
          <h3 style="color: #92400e; margin: 0 0 20px 0; font-size: 20px; font-weight: 700;">
            🎫 Your Application Ticket
          </h3>
          <div style="background: #f59e0b; color: white; padding: 15px 25px; border-radius: 10px; font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 15px 0;">
            ${membershipTicket}
          </div>
          <p style="color: #92400e; margin: 20px 0 0 0; font-size: 14px; font-weight: 600;">
            ⚠️ Important: Save this ticket number for your records!
          </p>
        </div>
        
        <!-- Timeline Section -->
        <div style="background: #f0f9ff; border: 3px solid #3b82f6; border-radius: 16px; padding: 25px; margin: 30px 0;">
          <h3 style="color: #1e40af; margin: 0 0 20px 0; font-size: 20px; font-weight: 700;">
            ⏰ What Happens Next?
          </h3>
          <div style="color: #1e40af; font-size: 15px; line-height: 1.8;">
            <div style="margin: 15px 0; display: flex; align-items: center;">
              <span style="font-size: 20px; margin-right: 12px;">🔍</span>
              <div>
                <strong>Review Period:</strong> 5-7 business days<br>
                <small style="color: #64748b;">Committee will thoroughly evaluate your application</small>
              </div>
            </div>
            <div style="margin: 15px 0; display: flex; align-items: center;">
              <span style="font-size: 20px; margin-right: 12px;">📞</span>
              <div>
                <strong>Possible Interview:</strong> You may be contacted<br>
                <small style="color: #64748b;">Some applicants participate in a brief interview</small>
              </div>
            </div>
            <div style="margin: 15px 0; display: flex; align-items: center;">
              <span style="font-size: 20px; margin-right: 12px;">📧</span>
              <div>
                <strong>Decision Notification:</strong> Email with final decision<br>
                <small style="color: #64748b;">Detailed feedback provided regardless of outcome</small>
              </div>
            </div>
          </div>
        </div>
        
        <p style="color: #334155; font-size: 16px; line-height: 1.7; margin: 30px 0 0 0;">
          Thank you for your commitment to becoming a full member of the Ikoota community. We appreciate your patience during the review process.
        </p>
        
        <!-- Footer -->
        <div style="border-top: 2px solid #e2e8f0; margin: 40px 0 0 0; padding: 30px 0 0 0; text-align: center;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            Best regards,<br>
            <strong style="color: #334155;">The Ikoota Membership Committee</strong>
          </p>
        </div>
      </div>
    </div>
  `;
};

/**
 * Generate user confirmation email text version
 */
const generateUserConfirmationText = (user, membershipTicket) => {
  return `
🎉 Full Membership Application Submitted Successfully - Ikoota

Dear ${user.username},

Congratulations! Your full membership application has been successfully submitted and is now under review by our membership committee.

🎫 YOUR APPLICATION TICKET: ${membershipTicket}
(Please save this number for your records)

⏰ WHAT HAPPENS NEXT:
• Review Period: 5-7 business days
• Committee Evaluation: Thorough review of your application  
• Possible Interview: You may be contacted for a brief discussion
• Decision Notification: Email with final decision and feedback

📞 NEED HELP?
Email: support@ikoota.com
Subject: Full Membership Application - ${membershipTicket}
Response time: Within 24 hours

Thank you for your commitment to becoming a full member of the Ikoota community!

Best regards,
The Ikoota Membership Committee

---
This is an automated message. Please do not reply to this email.
  `;
};

/**
 * Generate admin notification email HTML
 */
const generateAdminNotificationEmail = (user, membershipTicket, applicationId) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: #dc2626; color: white; padding: 30px; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 10px;">🔔</div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">
          NEW Full Membership Application
        </h1>
        <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 16px;">
          Immediate committee review required
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px;">
        <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 12px; padding: 20px; margin: 0 0 25px 0;">
          <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 18px;">⚡ Action Required</h3>
          <p style="color: #7f1d1d; margin: 0; font-weight: 600;">A new full membership application requires committee review and approval.</p>
        </div>
        
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Application Details</h3>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 0 0 25px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 0; font-weight: 600; color: #374151;">🎫 Ticket:</td>
              <td style="padding: 12px 0; color: #1f2937; font-family: monospace; font-weight: bold;">${membershipTicket}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 0; font-weight: 600; color: #374151;">🆔 Application ID:</td>
              <td style="padding: 12px 0; color: #1f2937;">${applicationId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 0; font-weight: 600; color: #374151;">📅 Submitted:</td>
              <td style="padding: 12px 0; color: #1f2937;">${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151;">📊 Current Status:</td>
              <td style="padding: 12px 0; color: #1f2937;">Pre-Member → <strong style="color: #dc2626;">Pending Full Member</strong></td>
            </tr>
          </table>
        </div>
        
        <!-- Action Buttons -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/applications" 
             style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 0 10px 10px 0; font-size: 16px;">
            🔍 Review Application
          </a>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/users/${user.id}" 
             style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 0 10px 10px 0; font-size: 16px;">
            👤 View User Profile
          </a>
        </div>
        
        <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 25px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
            <strong>⏰ SLA Reminder:</strong> Full membership applications should be reviewed within 5-7 business days. 
            The applicant has been notified of this timeline and will expect timely communication.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; margin: 30px 0 0 0; padding: 20px 0 0 0; text-align: center;">
          <p style="color: #6b7280; font-size: 13px; margin: 0;">
            This is an automated notification from the Ikoota membership system.<br>
            Generated at ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  `;
};

/**
 * Generate admin notification email text version
 */
const generateAdminNotificationText = (user, membershipTicket, applicationId) => {
  return `
🔔 NEW Full Membership Application - Immediate Review Required

⚡ ACTION REQUIRED: A new full membership application needs committee review.

APPLICATION DETAILS:
👤 Applicant: ${user.username}
📧 Email: ${user.email}
🎫 Ticket: ${membershipTicket}
🆔 Application ID: ${applicationId}
📅 Submitted: ${new Date().toLocaleString()}
📊 Status: Pre-Member → Pending Full Member

COMMITTEE ACTIONS:
Review Application: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/applications
View User Profile: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/users/${user.id}

⏰ SLA REMINDER: Full membership applications should be reviewed within 5-7 business days.

---
Automated notification from Ikoota membership system
Generated at ${new Date().toLocaleString()}
  `;
};

// =============================================================================
// APPLICATION MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Update application answers (before review)
 * PUT /full-membership/update-answers
 */
export const updateFullMembershipAnswers = async (req, res) => {
  try {
    const { answers } = req.body;
    const userId = req.user.id || req.user.user_id;
    
    if (!answers || !Array.isArray(answers)) {
      throw new CustomError('Valid answers array is required', 400);
    }
    
    // Check if user has a pending application
    const [applications] = await db.query(`
      SELECT id, status 
      FROM full_membership_applications 
      WHERE user_id = ? AND status = 'pending'
      ORDER BY submittedAt DESC LIMIT 1
    `, [userId]);
    
    if (!applications.length) {
      throw new CustomError('No pending full membership application found to update', 404);
    }
    
    const application = applications[0];
    
    // Update application answers
    await db.query(`
      UPDATE full_membership_applications 
      SET answers = ?, updatedAt = NOW()
      WHERE id = ?
    `, [JSON.stringify(answers), application.id]);
    
    return successResponse(res, {
      applicationId: application.id,
      updatedAnswers: answers.length,
      updatedAt: new Date().toISOString()
    }, 'Full membership application answers updated successfully');
    
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Withdraw full membership application
 * POST /full-membership/withdraw
 */
export const withdrawFullMembershipApplication = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user.id || req.user.user_id;
        
    // Check if application exists and is pending
    const [applications] = await db.query(`
      SELECT id, status 
      FROM full_membership_applications 
      WHERE user_id = ? AND status = 'pending'
      ORDER BY submittedAt DESC LIMIT 1
    `, [userId]);
        
    if (!applications.length) {
      throw new CustomError('No pending full membership application found to withdraw', 404);
    }
        
    const application = applications[0];
        
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update application status to withdrawn
      await connection.execute(`
        UPDATE full_membership_applications 
        SET status = 'withdrawn', admin_notes = ?, reviewedAt = NOW(), updatedAt = NOW()
        WHERE id = ?
      `, [reason || 'Withdrawn by user', application.id]);
            
      // Update user status
      await connection.execute(`
        UPDATE users 
        SET full_membership_status = 'withdrawn', updatedAt = NOW()
        WHERE id = ?
      `, [userId]);
      
      await connection.commit();
      connection.release();
            
      return successResponse(res, {
        applicationId: application.id,
        withdrawnAt: new Date().toISOString(),
        reason: reason || 'Withdrawn by user'
      }, 'Full membership application withdrawn successfully');
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
        
  } catch (error) {
    return errorResponse(res, error, error.statusCode || 500);
  }
};

/**
 * Get full membership application history
 * GET /full-membership/history
 */
export const getFullMembershipHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    // Get full membership application history
    const [history] = await db.query(`
      SELECT 
        fma.id,
        fma.membership_ticket,
        fma.status,
        fma.submittedAt,
        fma.reviewedAt,
        fma.admin_notes,
        reviewer.username as reviewed_by,
        fma.answers
      FROM full_membership_applications fma
      LEFT JOIN users reviewer ON fma.reviewed_by = reviewer.id
      WHERE fma.user_id = ?
      ORDER BY fma.submittedAt DESC
    `, [userId]);

    // Parse answers for each application
    const processedHistory = history.map(app => ({
      ...app,
      answers: app.answers ? JSON.parse(app.answers) : null
    }));

    return successResponse(res, {
      applications: processedHistory,
      totalApplications: processedHistory.length
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Get full membership requirements and guidelines
 * GET /full-membership/requirements
 */
export const getFullMembershipRequirements = async (req, res) => {
  try {
    const requirements = [
      'Must be an approved pre-member in good standing',
      'Active participation in community for at least 30 days',
      'Demonstrated commitment to community values and guidelines',
      'Complete comprehensive membership questionnaire',
      'Provide thoughtful responses to all application questions',
      'May be required to participate in interview process'
    ];
    
    const guidelines = [
      'Review all full membership benefits and responsibilities carefully',
      'Provide detailed and honest responses to all questions',
      'Include specific examples of your community participation',
      'Demonstrate your understanding of community values and mission',
      'Be prepared to discuss your long-term commitment to the community',
      'Application processing takes 5-7 business days',
      'You may be contacted for additional information or clarification',
      'Final decision will be communicated via email with detailed feedback'
    ];
    
    const benefits = [
      'Access to exclusive Iko member content and discussions',
      'Voting rights in community decisions and governance',
      'Priority access to advanced classes and workshops',
      'Mentorship opportunities (both giving and receiving)',
      'Direct access to community leadership and decision-making',
      'Ability to invite and sponsor new community members',
      'Enhanced support and priority assistance',
      'Recognition as a committed community member'
    ];
    
    const responsibilities = [
      'Uphold and model community values and guidelines',
      'Actively participate in community discussions and activities',
      'Contribute positively to the community environment',
      'Mentor and support newer community members',
      'Participate in community governance when called upon',
      'Maintain respectful and constructive communication',
      'Help preserve and enhance the community culture'
    ];
    
    return successResponse(res, {
      applicationType: 'full_membership',
      requirements,
      guidelines,
      benefits,
      responsibilities,
      estimatedTime: '20-30 minutes',
      processingTime: '5-7 business days',
      supportContact: 'support@ikoota.com'
    });
    
  } catch (error) {
    return errorResponse(res, error);
  }
};

// =============================================================================
// DEBUGGING & TESTING UTILITIES
// =============================================================================

/**
 * Test full membership eligibility (Debug helper)
 * GET /debug/full-membership-eligibility
 */
export const testFullMembershipEligibility = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;
    
    const user = await getUserById(userId);
    
    const eligibilityCheck = {
      userId: user.id,
      username: user.username,
      currentStage: user.membership_stage,
      currentStatus: user.is_member,
      isEligible: user.membership_stage === 'pre_member' && user.is_member === 'pre_member',
      requirements: {
        correctStage: user.membership_stage === 'pre_member',
        correctStatus: user.is_member === 'pre_member'
      }
    };
    
    res.json({
      success: true,
      eligibilityCheck,
      recommendations: eligibilityCheck.isEligible ? 
        ['User is eligible for full membership application'] :
        [
          'User must complete initial membership process first',
          'Current stage must be pre_member',
          'Current status must be pre_member'
        ]
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// =============================================================================
// EXPORT ALL FUNCTIONS
// =============================================================================

export default {
  // Status & Information
  getFullMembershipStatusById,
  getFullMembershipStatus,
  
  // Application Submission
  submitFullMembershipApplication,
  reapplyFullMembership,
  
  // Application Management
  updateFullMembershipAnswers,
  withdrawFullMembershipApplication,
  getFullMembershipHistory,
  getFullMembershipRequirements,
  
  // Access Tracking
  logFullMembershipAccess,
  
  // Debug & Testing
  testFullMembershipEligibility
};