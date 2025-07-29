// ikootaapi/controllers/fullMembershipController.js
// FINAL ENHANCED VERSION - Complete with Email Notifications & Error Handling
import db from '../config/db.js';

// Import email functions (adjust paths as needed for your project)
let sendEmail, sendEmailWithTemplate;
try {
  ({ sendEmail } = await import('../utils/notifications.js'));
} catch (e) {
  console.log('⚠️ notifications.js not found, trying alternative email imports...');
}
try {
  ({ sendEmailWithTemplate } = await import('../utils/email.js'));
} catch (e) {
  console.log('⚠️ email.js not found, will use fallback email methods');
}

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
 * Get full membership status by user ID
 * GET /full-membership-status/:userId
 */
export const getFullMembershipStatusById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ error: 'Valid user ID required' });
    }

    if (req.user.id !== parseInt(userId) && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied - can only view your own status' 
      });
    }

    console.log('🔍 Checking membership status for user:', userId);

    // Check if user exists
    const userResult = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    let userExists = false;
    if (Array.isArray(userResult)) {
      if (Array.isArray(userResult[0])) {
        userExists = userResult[0].length > 0;
      } else {
        userExists = userResult.length > 0;
      }
    }
    
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get applications for this user
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

    console.log('📋 Applications found:', applications.length);

    if (applications.length === 0) {
      return res.json({
        success: true,
        hasApplication: false,
        status: 'not_applied',
        appliedAt: null,
        reviewedAt: null,
        ticket: null,
        adminNotes: null
      });
    }

    const app = applications[0];
    console.log('✅ Application found:', {
      id: app.id,
      status: app.status,
      ticket: app.membership_ticket
    });

    return res.json({
      success: true,
      hasApplication: true,
      status: app.status || 'pending',
      appliedAt: getTimestamp(app, 'submittedAt'),
      reviewedAt: getTimestamp(app, 'reviewedAt'),
      ticket: app.membership_ticket,
      adminNotes: app.admin_notes,
      answers: app.answers ? (typeof app.answers === 'string' ? JSON.parse(app.answers) : app.answers) : null
    });

  } catch (error) {
    console.error('❌ Error fetching membership application status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Submit full membership application with professional email notifications
 * POST /submit-full-membership
 */
export const submitFullMembershipApplication = async (req, res) => {
  let connection = null;
  
  try {
    const userId = req.user?.user_id || req.user?.id;
    
    console.log('🎯 Submit application called');
    console.log('👤 User ID:', userId);
    console.log('📝 Request data:', {
      hasAnswers: !!req.body.answers,
      hasTicket: !!req.body.membershipTicket,
      answersLength: req.body.answers ? req.body.answers.length : 0
    });
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { answers, membershipTicket } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Application answers are required and must be an array' });
    }

    if (!membershipTicket) {
      return res.status(400).json({ error: 'Membership ticket is required' });
    }

    console.log('✅ Basic validation passed');

    // Get user data with robust result handling
    console.log('🔍 Querying user data...');
    const userResult = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    let user = null;
    if (Array.isArray(userResult)) {
      if (Array.isArray(userResult[0])) {
        user = userResult[0].length > 0 ? userResult[0][0] : null;
      } else if (userResult.length > 0 && userResult[0].id) {
        user = userResult[0];
      }
    }
    
    if (!user || !user.id) {
      console.error('❌ User not found or invalid result format');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('👤 User data extracted:', {
      id: user.id,
      username: user.username,
      email: user.email,
      membership_stage: user.membership_stage,
      is_member: user.is_member,
      full_membership_status: user.full_membership_status
    });

    // Check eligibility - user must be pre_member
    if (user.membership_stage !== 'pre_member' || user.is_member !== 'pre_member') {
      return res.status(400).json({ 
        success: false,
        message: 'Only pre-members can apply for full membership',
        currentStatus: {
          membership_stage: user.membership_stage,
          is_member: user.is_member
        }
      });
    }

    console.log('✅ User is eligible (pre-member)');

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
      console.log('📝 Inserting application...');
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

      // Create audit log (try camelCase first, then snake_case)
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
        console.log('✅ Audit log created with camelCase');
      } catch (auditError) {
        console.log('⚠️ Audit log failed (non-critical):', auditError.message);
      }

      // Commit transaction before sending notifications
      await connection.commit();
      console.log('✅ Database transaction committed');

      // SEND EMAIL NOTIFICATIONS (after successful database commit)
      console.log('📧 Preparing email notifications...');
      
      // 1. Send confirmation email to user
      try {
        console.log('📧 Sending user confirmation email...');
        
        const userEmailContent = {
          to: user.email,
          subject: '🎓 Full Membership Application Submitted Successfully - Ikoota',
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 10px;">🎉</div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                  Application Submitted Successfully!
                </h1>
                <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 16px;">
                  Your full membership application is under review
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
                        <small style="color: #64748b;">Our committee will thoroughly evaluate your application</small>
                      </div>
                    </div>
                    <div style="margin: 15px 0; display: flex; align-items: center;">
                      <span style="font-size: 20px; margin-right: 12px;">📧</span>
                      <div>
                        <strong>Decision Notification:</strong> Email with final decision<br>
                        <small style="color: #64748b;">You'll receive detailed feedback regardless of outcome</small>
                      </div>
                    </div>
                    <div style="margin: 15px 0; display: flex; align-items: center;">
                      <span style="font-size: 20px; margin-right: 12px;">📚</span>
                      <div>
                        <strong>Continued Access:</strong> Pre-member privileges maintained<br>
                        <small style="color: #64748b;">Continue enjoying Towncrier content during review</small>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Important Info -->
                <div style="background: #f0fdf4; border: 3px solid #10b981; border-radius: 16px; padding: 25px; margin: 30px 0;">
                  <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px; font-weight: 700;">
                    📞 Need Help?
                  </h3>
                  <p style="color: #065f46; margin: 0; font-size: 15px; line-height: 1.6;">
                    <strong>Email us:</strong> support@ikoota.com<br>
                    <strong>Subject:</strong> Full Membership Application - ${membershipTicket}<br>
                    <strong>Response time:</strong> Within 24 hours
                  </p>
                </div>
                
                <!-- Call to Action -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/full-membership-info" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    📊 Check Application Status
                  </a>
                </div>
                
                <p style="color: #334155; font-size: 16px; line-height: 1.7; margin: 30px 0 0 0;">
                  Thank you for your commitment to becoming a full member of the Ikoota educational community. We're excited to review your application!
                </p>
                
                <!-- Footer -->
                <div style="border-top: 2px solid #e2e8f0; margin: 40px 0 0 0; padding: 30px 0 0 0; text-align: center;">
                  <p style="color: #64748b; font-size: 14px; margin: 0;">
                    Best regards,<br>
                    <strong style="color: #334155;">The Ikoota Membership Team</strong>
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0 0;">
                    This is an automated message. Please do not reply to this email.
                  </p>
                </div>
              </div>
            </div>
          `,
          text: `
🎉 Full Membership Application Submitted Successfully - Ikoota

Dear ${user.username},

Congratulations! Your full membership application has been successfully submitted and is now under review by our membership committee.

🎫 YOUR APPLICATION TICKET: ${membershipTicket}
(Please save this number for your records)

⏰ WHAT HAPPENS NEXT:
• Review Period: 5-7 business days
• Committee Evaluation: Thorough review of your application  
• Decision Notification: Email with final decision
• Continued Access: Pre-member privileges maintained during review

📞 NEED HELP?
Email: support@ikoota.com
Subject: Full Membership Application - ${membershipTicket}
Response time: Within 24 hours

Check your application status: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/full-membership-info

Thank you for your commitment to becoming a full member of the Ikoota educational community!

Best regards,
The Ikoota Membership Team

---
This is an automated message. Please do not reply to this email.
          `
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
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <div style="background: #dc2626; color: white; padding: 30px; text-align: center;">
                <div style="font-size: 2.5rem; margin-bottom: 10px;">🔔</div>
                <h1 style="margin: 0; font-size: 24px; font-weight: 700;">
                  NEW Full Membership Application
                </h1>
                <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 16px;">
                  Immediate admin review required
                </p>
              </div>
              
              <!-- Content -->
              <div style="padding: 30px;">
                <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 12px; padding: 20px; margin: 0 0 25px 0;">
                  <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 18px;">⚡ Action Required</h3>
                  <p style="color: #7f1d1d; margin: 0; font-weight: 600;">A new full membership application requires immediate review and approval.</p>
                </div>
                
                <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Application Details</h3>
                
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 0 0 25px 0;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 12px 0; font-weight: 600; color: #374151; width: 30%;">👤 Applicant:</td>
                      <td style="padding: 12px 0; color: #1f2937;">${user.username}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 12px 0; font-weight: 600; color: #374151;">📧 Email:</td>
                      <td style="padding: 12px 0; color: #1f2937;">${user.email}</td>
                    </tr>
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
          `,
          text: `
🔔 NEW Full Membership Application - Immediate Review Required

⚡ ACTION REQUIRED: A new full membership application needs immediate admin review.

APPLICATION DETAILS:
👤 Applicant: ${user.username}
📧 Email: ${user.email}
🎫 Ticket: ${membershipTicket}
🆔 Application ID: ${applicationId}
📅 Submitted: ${new Date().toLocaleString()}
📊 Status: Pre-Member → Pending Full Member

ADMIN ACTIONS:
Review Application: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/applications
View User Profile: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/users/${user.id}

⏰ SLA REMINDER: Full membership applications should be reviewed within 5-7 business days.

---
Automated notification from Ikoota membership system
Generated at ${new Date().toLocaleString()}
          `
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
        message: 'Membership application submitted successfully',
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
    console.error('❌ Error submitting membership application:', error);
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
  // Use the same enhanced logic as submit for reapplications
  return submitFullMembershipApplication(req, res);
};

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

