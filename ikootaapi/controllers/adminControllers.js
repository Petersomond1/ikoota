//ikootaapi/controllers/adminControllers.js - Complete and properly organized implementation

import {
  getUsersService,
  updateUserByIdService, 
  updateUserColumnsService,
  getPendingContentService,
  approveContentService,
  rejectContentService,
  manageUsersService,
  manageContentService,
  banUserService,
  unbanUserService,
  grantPostingRightsService,
  updateUserService,
  getReportsService,
  getAllReportsService,
  getMentorsService,
  getAuditLogsService
} from '../services/adminServices.js';
import db from '../config/db.js';

// ===== USER MANAGEMENT CONTROLLERS =====

// GET /api/admin/users - Get all users
export const getUsers = async (req, res) => {
  try {
    console.log('🔍 getUsers endpoint called');
    
    const users = await getUsersService();
    
    // Return in the format expected by frontend
    res.status(200).json({
      success: true,
      users: users,
      count: users.length
    });
    
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while fetching users.',
      message: error.message 
    });
  }
};

// PUT /api/admin/users/:id - Update user by ID (isblocked, isbanned)
export const updateUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isblocked, isbanned } = req.body;

    console.log('🔍 updateUserById called for ID:', userId);

    const updatedUser = await updateUserByIdService(userId, isblocked, isbanned);
    
    res.status(200).json({ 
      success: true,
      message: 'User updated successfully', 
      updatedUser 
    });
    
  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while updating the user.',
      message: error.message
    });
  }
};

// POST /api/admin/users/update - Update user (enhanced functionality)
export const updateUser = async (req, res) => {
  try {
    console.log('🔍 updateUser called with body:', req.body);
    
    // Handle both old format (userId, rating, userclass) and new format
    let userId, updateData;
    
    if (req.body.userId) {
      // Old format
      const { userId: uid, rating, userclass, ...rest } = req.body;
      userId = uid;
      updateData = { rating, userclass, ...rest };
    } else if (req.params.id) {
      // New format with ID in params
      userId = req.params.id;
      updateData = req.body;
    } else {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const updatedUser = await updateUserService(userId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Error in updateUser:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while updating the user.',
      message: error.message
    });
  }
};

// PUT /api/admin/update-user-columns/:id - Update specific user columns
export const updateUserColumns = async (req, res) => {
  try {
    const { id } = req.params;
    const { converse_id, mentor_id, class_id, is_member, role } = req.body;
    
    console.log('🔍 updateUserColumns called for ID:', id);
    
    const result = await updateUserColumnsService(id, converse_id, mentor_id, class_id, is_member, role);
    
    res.status(200).json({
      success: true,
      message: 'User columns updated successfully',
      result
    });
    
  } catch (error) {
    console.error('Error updating user columns:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update user columns',
      error: error.message
    });
  }
};

// POST /api/admin/users/ban - Ban user
export const banUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    console.log('🔍 banUser called for ID:', userId);
    
    await banUserService(userId, reason);
    
    res.status(200).json({ 
      success: true,
      message: 'User banned successfully' 
    });
    
  } catch (error) {
    console.error('Error in banUser:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while banning the user.',
      message: error.message
    });
  }
};

// POST /api/admin/users/unban - Unban user
export const unbanUser = async (req, res) => {
  try {
    const { userId } = req.body;
    
    console.log('🔍 unbanUser called for ID:', userId);
    
    await unbanUserService(userId);
    
    res.status(200).json({ 
      success: true,
      message: 'User unbanned successfully' 
    });
    
  } catch (error) {
    console.error('Error in unbanUser:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while unbanning the user.',
      message: error.message
    });
  }
};

// POST /api/admin/users/grant - Grant posting rights
export const grantPostingRights = async (req, res) => {
  try {
    const { userId } = req.body;
    
    console.log('🔍 grantPostingRights called for ID:', userId);
    
    await grantPostingRightsService(userId);
    
    res.status(200).json({ 
      success: true,
      message: 'Posting rights granted successfully' 
    });
    
  } catch (error) {
    console.error('Error in grantPostingRights:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while granting posting rights.',
      message: error.message
    });
  }
};

// GET/POST /api/admin/users/manage - Manage users (bulk operations)
export const manageUsers = async (req, res) => {
  try {
    console.log('🔍 manageUsers called');
    
    // Check if this is a bulk action request
    if (req.method === 'POST') {
      const { action, userIds, options = {} } = req.body;
      const result = await manageUsersService(action, userIds, options);
      
      res.status(200).json({
        success: true,
        message: `Users ${action} completed successfully`,
        result
      });
    } else {
      // Original functionality - return all users
      const users = await manageUsersService();
      res.status(200).json({
        success: true,
        users: users,
        count: users.length
      });
    }
    
  } catch (error) {
    console.error('Error in manageUsers:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while managing users.',
      message: error.message
    });
  }
};

// POST /api/admin/create-user - Create new user
export const createUser = async (req, res) => {
  try {
    const userData = req.body;
    
    console.log('🔍 createUser called with data:', userData);
    
    const query = `
      INSERT INTO users (username, email, password, role, is_member) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(query, [
      userData.username,
      userData.email,
      userData.password, // Make sure to hash this!
      userData.role || 'user',
      userData.is_member || 'applied'
    ]);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: result.insertId
    });
    
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// DELETE /api/admin/delete-user/:id - Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 deleteUser called for ID:', id);
    
    const query = `DELETE FROM users WHERE id = ?`;
    const [result] = await db.query(query, [id]);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      result
    });
    
  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// ===== CONTENT MANAGEMENT CONTROLLERS =====

// GET /api/admin/content/pending - Get pending content
export const getPendingContent = async (req, res) => {
  try {
    console.log('🔍 getPendingContent endpoint called');
    
    const pendingContent = await getPendingContentService();
    
    res.status(200).json({
      success: true,
      content: pendingContent,
      count: pendingContent.length
    });
    
  } catch (error) {
    console.error('Error in getPendingContent:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while fetching pending content.',
      message: error.message
    });
  }
};

// GET/POST /api/admin/content - Manage content (bulk operations)
export const manageContent = async (req, res) => {
  try {
    console.log('🔍 manageContent called');
    
    // Check if this is a bulk action request
    if (req.method === 'POST') {
      const { action, contentIds, options = {} } = req.body;
      const result = await manageContentService(action, contentIds, options);
      
      res.status(200).json({
        success: true,
        message: `Content ${action} completed successfully`,
        result
      });
    } else {
      // Original functionality - return all content
      const content = await manageContentService();
      res.status(200).json({
        success: true,
        content: content,
        count: content.length
      });
    }
    
  } catch (error) {
    console.error('Error in manageContent:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while managing content.',
      message: error.message
    });
  }
};

// POST /api/admin/content/approve/:id - Approve content
export const approveContent = async (req, res) => {
  try {
    const contentId = req.params.id;
    const { contentType, adminNotes } = req.body;
    
    console.log('🔍 approveContent called for ID:', contentId);
    
    await approveContentService(contentId, contentType, adminNotes);
    
    res.status(200).json({ 
      success: true,
      message: 'Content approved successfully' 
    });
    
  } catch (error) {
    console.error('Error in approveContent:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while approving the content.',
      message: error.message
    });
  }
};

// POST /api/admin/content/reject/:id - Reject content
export const rejectContent = async (req, res) => {
  try {
    const contentId = req.params.id;
    const { contentType, adminNotes } = req.body;
    
    console.log('🔍 rejectContent called for ID:', contentId);
    
    await rejectContentService(contentId, contentType, adminNotes);
    
    res.status(200).json({ 
      success: true,
      message: 'Content rejected successfully' 
    });
    
  } catch (error) {
    console.error('Error in rejectContent:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while rejecting the content.',
      message: error.message
    });
  }
};

// ===== REPORTS CONTROLLERS =====

// GET /api/admin/reports - Get all reports
export const getReports = async (req, res) => {
  try {
    console.log('🔍 getReports endpoint called');
    
    const reports = await getReportsService();
    
    res.status(200).json({
      success: true,
      reports: reports,
      count: reports.length
    });
    
  } catch (error) {
    console.error('Error fetching reports:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while fetching reports.',
      message: error.message
    });
  }
};

// PUT /api/admin/update-report/:reportId - Update report status
export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;
    
    console.log('🔍 updateReportStatus called for report:', reportId);
    
    const query = `
      UPDATE reports 
      SET status = ?, admin_notes = ?
      WHERE id = ?
    `;
    
    const [result] = await db.query(query, [status, adminNotes, reportId]);
    
    res.status(200).json({
      success: true,
      message: 'Report status updated successfully',
      result
    });
    
  } catch (error) {
    console.error('Error updating report status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status',
      error: error.message
    });
  }
};

// ===== MENTORS CONTROLLERS =====

// GET /api/admin/mentors - Get all mentors
export const getMentors = async (req, res) => {
  try {
    console.log('🔍 getMentors endpoint called');
    
    const mentors = await getMentorsService();
    
    res.status(200).json({
      success: true,
      mentors: mentors,
      count: mentors.length
    });
    
  } catch (error) {
    console.error('Error fetching mentors:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentors',
      error: error.message
    });
  }
};

// ===== AUDIT LOGS CONTROLLERS =====

// GET /api/admin/audit-logs - Get audit logs
export const getAuditLogs = async (req, res) => {
  try {
    console.log('🔍 getAuditLogs endpoint called');
    
    const auditLogs = await getAuditLogsService();
    
    res.status(200).json({
      success: true,
      auditLogs: auditLogs,
      count: auditLogs.length
    });
    
  } catch (error) {
    console.error('Error fetching audit logs:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while fetching audit logs.',
      message: error.message
    });
  }
};

// ===== UTILITY CONTROLLERS =====

// POST /api/admin/send-notification - Send notification to user
export const sendNotification = async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    
    console.log('🔍 sendNotification called for user:', userId);
    
    // Your notification logic here
    // This could send email, SMS, or store in database
    
    res.status(200).json({
      success: true,
      message: 'Notification sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending notification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

// GET /api/admin/export-users - Export user data
export const exportUserData = async (req, res) => {
  try {
    const filters = req.query;
    
    console.log('🔍 exportUserData called with filters:', filters);
    
    const users = await getUsersService();
    
    // Convert to CSV or other format
    const csvData = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_member: user.is_member,
      created: user.createdAt
    }));
    
    res.status(200).json({
      success: true,
      data: csvData,
      format: 'json' // Could be 'csv', 'xlsx', etc.
    });
    
  } catch (error) {
    console.error('Error exporting user data:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to export user data',
      error: error.message
    });
  }
};

// POST /api/admin/mask-identity - Mask user identity
export const maskUserIdentity = async (req, res) => {
  try {
    const { userId, adminConverseId, mentorConverseId, classId } = req.body;
    
    console.log('🔍 maskUserIdentity called for user:', userId);
    
    const query = `
      UPDATE users 
      SET 
        converse_id = ?,
        mentor_id = ?,
        primary_class_id = ?,
        is_identity_masked = true
      WHERE id = ?
    `;
    
    const [result] = await db.query(query, [adminConverseId, mentorConverseId, classId, userId]);
    
    res.status(200).json({
      success: true,
      message: 'Identity masked successfully',
      result
    });
    
  } catch (error) {
    console.error('Error masking identity:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to mask identity',
      error: error.message
    });
  }
};

export const getReportsEnhanced = async (req, res) => {
  try {
    console.log('🔍 Fetching reports...');
    
    const query = `
      SELECT 
        r.*,
        reporter.username as reporter_name,
        reported.username as reported_user_name
      FROM reports r
      LEFT JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reported ON r.reported_id = reported.id
      ORDER BY r.createdAt DESC
    `;
    
    const result = await db.query(query);
    
    // Handle result format
    let reports = [];
    if (Array.isArray(result)) {
      reports = Array.isArray(result[0]) ? result[0] : result;
    }
    
    res.json({
      success: true,
      reports: reports || []
    });

  } catch (error) {
    console.error('❌ Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reports'
    });
  }
};

// =====================================================
// ADDITIONAL API ENDPOINTS FOR ADMIN FUNCTIONALITY
// ikootaapi/controllers/adminControllers.js
// =====================================================

/**
 * ✅ Get Available Mentors for Assignment
 */
export const getAvailableMentors = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const [mentors] = await db.execute(`
      SELECT 
        u.id,
        u.username,
        u.converse_id,
        u.email,
        m.current_mentees,
        m.max_mentees,
        (m.max_mentees - m.current_mentees) as available_slots
      FROM users u
      LEFT JOIN mentors m ON u.converse_id = m.mentor_converse_id
      WHERE u.role IN ('admin', 'super_admin') 
        OR (u.is_member = 'member' AND u.membership_stage = 'member')
      ORDER BY available_slots DESC, u.username ASC
    `);
    
    res.json({
      success: true,
      mentors: mentors.filter(mentor => mentor.available_slots > 0)
    });
    
  } catch (error) {
    console.error('❌ Get mentors error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ Get Available Classes for Assignment
 */
export const getAvailableClasses = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const [classes] = await db.execute(`
      SELECT 
        c.id,
        c.class_id,
        c.class_name,
        c.class_type,
        c.description,
        c.max_members,
        COALESCE(cm.current_members, 0) as current_members,
        (c.max_members - COALESCE(cm.current_members, 0)) as available_slots
      FROM classes c
      LEFT JOIN (
        SELECT 
          class_id, 
          COUNT(*) as current_members
        FROM user_class_memberships 
        WHERE membership_status = 'active'
        GROUP BY class_id
      ) cm ON c.class_id = cm.class_id
      WHERE c.is_active = 1
      ORDER BY c.class_type, available_slots DESC, c.class_name ASC
    `);
    
    res.json({
      success: true,
      classes: classes.filter(cls => cls.available_slots > 0)
    });
    
  } catch (error) {
    console.error('❌ Get classes error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ Get Application Statistics for Admin Dashboard
 */
export const getApplicationStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const [stats] = await db.execute(`
      SELECT 
        COUNT(CASE WHEN application_status = 'submitted' THEN 1 END) as pending_applications,
        COUNT(CASE WHEN application_status = 'approved' THEN 1 END) as approved_today,
        COUNT(CASE WHEN application_status = 'declined' THEN 1 END) as declined_today,
        COUNT(CASE WHEN is_member = 'pre_member' THEN 1 END) as active_pre_members,
        COUNT(CASE WHEN is_member = 'member' THEN 1 END) as full_members
      FROM users 
      WHERE DATE(application_reviewedAt) = CURDATE() OR application_status = 'submitted'
    `);
    
    const [recentActivity] = await db.execute(`
      SELECT 
        u.username,
        u.application_status,
        u.application_reviewedAt,
        reviewer.username as reviewer_name
      FROM users u
      LEFT JOIN users reviewer ON u.reviewed_by = reviewer.id
      WHERE u.application_reviewedAt >= DATE_SUB(NOW(), INTERVAL 7 DAYS)
      ORDER BY u.application_reviewedAt DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      stats: stats[0],
      recent_activity: recentActivity
    });
    
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
};




