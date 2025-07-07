import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';


export const updateUserColumnsService = async (userId, converse_id, mentor_id, class_id, is_member, role) => {
  const sql = `
    UPDATE users
    SET converse_id = ?, mentor_id = ?, class_id = ?, is_member = ?, role = ?
    WHERE id = ?
  `;
  await db.query(sql, [converse_id, mentor_id, class_id, is_member, role, userId]);

  const updatedUser = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  return updatedUser[0];
};





export const getPendingContentService = async () => {
  const sql = 'SELECT * FROM content WHERE approval_status = "pending"';
  const content = await db.query(sql);
  return content;
};

export const approveContentService = async (contentId) => {
  const sql = 'UPDATE content SET approval_status = "approved" WHERE id = ?';
  await db.query(sql, [contentId]);
};

export const rejectContentService = async (contentId) => {
  const sql = 'UPDATE content SET approval_status = "rejected" WHERE id = ?';
  await db.query(sql, [contentId]);
};

export const manageContentService = async () => {
  const sql = 'SELECT * FROM content';
  const content = await db.query(sql);
  return content;
};

export const manageUsersService = async () => {
  const sql = 'SELECT * FROM users';
  const users = await db.query(sql);
  return users;
};

export const banUserService = async (userId) => {
  const sql = 'UPDATE users SET postingRight = "banned" WHERE id = ?';
  await db.query(sql, [userId]);
};

export const unbanUserService = async (userId) => {
  const sql = 'UPDATE users SET postingRight = "active" WHERE id = ?';
  await db.query(sql, [userId]);
};

export const grantPostingRightsService = async (userId) => {
  const sql = 'UPDATE users SET postingRight = "active" WHERE id = ?';
  await db.query(sql, [userId]);
};

// export const updateUserService = async (userId, rating, userclass) => {
//   const sql = 'UPDATE users SET rating = ?, userclass = ? WHERE id = ?';
//   await db.query(sql, [rating, userclass, userId]);
//   const updatedUser = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
//   return updatedUser[0];
// };

// Update user service
export const updateUserService = async (userId, updateData) => {
  try {
    // Map frontend field names to database field names
    const fieldMapping = {
      'class_id': 'primary_class_id',
      'isblocked': 'isblocked',
      'isbanned': 'isbanned'
    };
    
    // Clean and map the data
    const cleanData = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && value !== null && value !== '') {
        const dbField = fieldMapping[key] || key;
        cleanData[dbField] = value;
      }
    }
    
    if (Object.keys(cleanData).length === 0) {
      throw new Error('No valid update data provided');
    }
    
    // Special handling for isblocked (it's JSON in your schema)
    if (cleanData.isblocked !== undefined) {
      cleanData.isblocked = JSON.stringify(cleanData.isblocked);
    }
    
    // Build dynamic update query
    const setClause = Object.keys(cleanData)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(cleanData);
    values.push(userId);
    
    const updateQuery = `UPDATE users SET ${setClause} WHERE id = ?`;
    
    await db.query(updateQuery, values);
    
    // Get updated user
    const [updatedUser] = await db.query(
      `SELECT id, username, email, role, membership_stage, is_member, 
              primary_class_id as class_id, isblocked, isbanned 
       FROM users WHERE id = ?`,
      [userId]
    );
    
    return updatedUser[0] || null;
  } catch (error) {
    console.error('❌ Database error in updateUserService:', error);
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

// Fetch all users including isblocked, isbanned, and is_flagged
// export const getUsersService = async () => {
//   const sql = 'SELECT id, username, email, isblocked, isbanned, is_flagged FROM users';
//   const users = await db.query(sql);
//   return users;
// };

// Get users service - FIXED: Remove 'is_flagged' column
export const getUsersService = async () => {
  try {
    // ✅ REMOVED: is_flagged column that doesn't exist
    const [users] = await db.query(`
      SELECT 
        id, username, email, phone, role, membership_stage, is_member,
        converse_id, mentor_id, primary_class_id as class_id, 
        isblocked, isbanned, createdAt, updatedAt,
        full_membership_status, is_identity_masked, total_classes
      FROM users 
      ORDER BY createdAt DESC
    `);
    
    return users;
  } catch (error) {
    console.error('❌ Database error in getUsersService:', error);
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
};

// Update user by ID (isblocked, isbanned)
export const updateUserByIdService = async (userId, isblocked, isbanned) => {
  const sql = `
    UPDATE users
    SET isblocked = ?, isbanned = ?
    WHERE id = ?
  `;
  await db.query(sql, [isblocked, isbanned, userId]);
  const updatedUser = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  return updatedUser[0];
};

// Fetch reports for admin review
// export const getReportsService = async () => {
//   const sql = 'SELECT id, reported_id, reason, details FROM reports WHERE status = "pending"';
//   const reports = await db.query(sql);
//   return reports;
// };

// Get reports service - FIXED: Remove 'details' column
export const getReportsService = async () => {
  try {
    // ✅ REMOVED: details column that doesn't exist, ADDED: missing columns
    const [reports] = await db.query(`
      SELECT 
        id, reported_id, reporter_id, reason, status, createdAt, updatedAt
      FROM reports 
      WHERE status = "pending"
      ORDER BY createdAt DESC
    `);
    
    return reports;
  } catch (error) {
    console.error('❌ Database error in getReportsService:', error);
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }
};

// Fetch audit logs for monitoring
export const getAuditLogsService = async () => {
  const sql = 'SELECT id, action, target_id, details, createdAt FROM audit_logs ORDER BY createdAt DESC';
  const auditLogs = await db.query(sql);
  return auditLogs;
};

// Get all reports service (for admin panel)
export const getAllReportsService = async () => {
  try {
    const [reports] = await db.query(`
      SELECT 
        id, reported_id, reporter_id, reason, status, createdAt, updatedAt
      FROM reports 
      ORDER BY createdAt DESC
    `);
    
    return reports;
  } catch (error) {
    console.error('❌ Database error in getAllReportsService:', error);
    throw new Error(`Failed to fetch all reports: ${error.message}`);
  }
};

// Get mentors service
export const getMentorsService = async () => {
  try {
    const [mentors] = await db.query(`
      SELECT 
        id, username, email, converse_id, role, 
        primary_class_id as class_id, total_classes
      FROM users 
      WHERE role IN ('admin', 'super_admin') 
         OR converse_id IS NOT NULL
      ORDER BY role DESC, username ASC
    `);
    
    return mentors;
  } catch (error) {
    console.error('❌ Database error in getMentorsService:', error);
    throw new Error(`Failed to fetch mentors: ${error.message}`);
  }
};