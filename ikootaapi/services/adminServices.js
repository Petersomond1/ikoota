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

export const updateUserService = async (userId, rating, userclass) => {
  const sql = 'UPDATE users SET rating = ?, userclass = ? WHERE id = ?';
  await db.query(sql, [rating, userclass, userId]);
  const updatedUser = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  return updatedUser[0];
};



// Fetch all users including isblocked, isbanned, and is_flagged
export const getUsersService = async () => {
  const sql = 'SELECT id, username, email, isblocked, isbanned, is_flagged FROM users';
  const users = await db.query(sql);
  return users;
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
export const getReportsService = async () => {
  const sql = 'SELECT id, reported_id, reason, details FROM reports WHERE status = "pending"';
  const reports = await db.query(sql);
  return reports;
};

// Fetch audit logs for monitoring
export const getAuditLogsService = async () => {
  const sql = 'SELECT id, action, target_id, details, createdAt FROM audit_logs ORDER BY createdAt DESC';
  const auditLogs = await db.query(sql);
  return auditLogs;
};