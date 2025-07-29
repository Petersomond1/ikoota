// // ikootaapi/controllers/membershipControllers_1.js
// // ==================================================
// // CORE FUNCTIONS, AUTHENTICATION & UTILITIES
// // ==================================================

// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import db from '../config/db.js';
// import { sendEmail, sendSMS } from '../utils/notifications.js';
// import CustomError from '../utils/CustomError.js';

// // =============================================================================
// // UTILITY FUNCTIONS
// // =============================================================================

// /**
//  * Generate application ticket with consistent format
//  */
// export const generateApplicationTicket = (username, email, method = 'INITIAL') => {
//   const timestamp = Date.now().toString(36);
//   const random = Math.random().toString(36).substr(2, 5);
//   const prefix = method === 'FULL' ? 'FMA' : 'APP';
//   return `${prefix}-${username.substr(0, 3).toUpperCase()}-${timestamp}-${random}`.toUpperCase();
// };

// /**
//  * FIXED: Get user by ID with proper error handling
//  */

// // ✅ FIXED: Use db.query instead of destructured query
// const query = db.query; 


// // Update user profile using your existing table structure
// export const getUserById = async (userId) => {
//     try {
//         console.log('🔍 getUserById called with userId:', userId);
        
//         // Validate input
//         if (!userId || (typeof userId !== 'number' && typeof userId !== 'string')) {
//             throw new CustomError('Invalid user ID provided', 400);
//         }
        
//         const result = await query('SELECT * FROM users WHERE id = ?', [userId]);
//         console.log('🔍 Raw DB result structure check');
        
//         // Handle different possible result structures
//         let users;
//         if (Array.isArray(result) && result.length > 0) {
//             if (Array.isArray(result[0])) {
//                 users = result[0]; // MySQL2 format: [rows, fields]
//                 console.log('✅ Using MySQL2 format: result[0]');
//             } else {
//                 users = result; // Direct array format
//                 console.log('✅ Using direct array format: result');
//             }
//         } else {
//             console.log('❌ Unexpected result structure');
//             throw new CustomError('Unexpected database result structure', 500);
//         }
        
//         if (!users || users.length === 0) {
//             console.log('❌ No users found');
//             throw new CustomError('User not found', 404);
//         }
        
//         const user = users[0];
//         console.log('✅ User extracted:', user.id, user.username);
        
//         return user;
//     } catch (error) {
//         console.error('❌ Database query error in getUserById:', error);
//         throw new CustomError('Database operation failed: ' + error.message, 500);
//     }
// };

// // export const updateUserProfile = async (userId, updates) => {
// //     try {
// //         // Map to your actual column names
// //         const fieldMapping = {
// //             'role': 'role',
// //             'is_member': 'is_member',
// //             'is_identity_masked': 'is_identity_masked',
// //             'converse_id': 'converse_id',
// //             'membership_stage': 'membership_stage',
// //             'isbanned': 'isbanned'
// //         };
        
// //         const updateFields = [];
// //         const values = [];
        
// //         Object.keys(updates).forEach(key => {
// //             if (fieldMapping[key] && updates[key] !== undefined) {
// //                 updateFields.push(`${fieldMapping[key]} = ?`);
// //                 values.push(updates[key]);
// //             }
// //         });
        
// //         if (updateFields.length === 0) {
// //             throw new CustomError('No valid fields to update', 400);
// //         }
        
// //         values.push(userId);
// //         const sql = `UPDATE users SET ${updateFields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
        
// //         const result = await query(sql, values);
        
// //         if (result.affectedRows === 0) {
// //             throw new CustomError('User not found or no changes made', 404);
// //         }
        
// //         return await getUserById(userId);
// //     } catch (error) {
// //         console.error('❌ Error updating user profile:', error);
// //         throw new CustomError(`Update failed: ${error.message}`, 500);
// //     }
// // };







// // ✅ NEW: Assign converse ID to user if they don't have one

// export const updateUserProfile = async (userId, updates) => {
//     try {
//         // Map to your actual column names
//         const fieldMapping = {
//             'role': 'role',
//             'is_member': 'is_member',
//             'is_identity_masked': 'is_identity_masked',
//             'converse_id': 'converse_id',
//             'membership_stage': 'membership_stage',
//             'isbanned': 'isbanned'
//         };
        
//         const updateFields = [];
//         const values = [];
        
//         Object.keys(updates).forEach(key => {
//             if (fieldMapping[key] && updates[key] !== undefined) {
//                 updateFields.push(`${fieldMapping[key]} = ?`);
//                 values.push(updates[key]);
//             }
//         });
        
//         if (updateFields.length === 0) {
//             throw new CustomError('No valid fields to update', 400);
//         }
        
//         values.push(userId);
//         const sql = `UPDATE users SET ${updateFields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
        
//         const result = await query(sql, values);
        
//         if (result.affectedRows === 0) {
//             throw new CustomError('User not found or no changes made', 404);
//         }
        
//         return await getUserById(userId);
//     } catch (error) {
//         console.error('❌ Error updating user profile:', error);
//         throw new CustomError(`Update failed: ${error.message}`, 500);
//     }
// };


// export const assignConverseIdToUser = async (userId) => {
//     try {
//         const user = await getUserById(userId);
        
//         if (user.converse_id) {
//             console.log('✅ User already has converse ID:', user.converse_id);
//             return user.converse_id;
//         }
        
//         const newConverseId = await ensureUniqueConverseId();
        
//         await updateUserProfile(userId, {
//             converse_id: newConverseId,
//             is_identity_masked: 1
//         });
        
//         console.log('✅ Assigned new converse ID to user:', userId, newConverseId);
//         return newConverseId;
//     } catch (error) {
//         console.error('❌ Error assigning converse ID:', error);
//         throw new CustomError(`Failed to assign converse ID: ${error.message}`, 500);
//     }
// };

// // ✅ NEW: Bulk assign converse IDs to users without them
// export const assignConverseIdsToUsersWithoutThem = async () => {
//     try {
//         console.log('🔍 Finding users without converse IDs...');
        
//         const result = await query('SELECT id, username, email FROM users WHERE converse_id IS NULL OR converse_id = ""');
        
//         // Handle result format
//         let usersWithoutIds;
//         if (Array.isArray(result)) {
//             usersWithoutIds = Array.isArray(result[0]) ? result[0] : result;
//         } else {
//             usersWithoutIds = [];
//         }
        
//         if (usersWithoutIds.length === 0) {
//             console.log('✅ All users already have converse IDs');
//             return { updated: 0, users: [] };
//         }
        
//         console.log(`📝 Found ${usersWithoutIds.length} users without converse IDs`);
        
//         const updatedUsers = [];
        
//         for (const user of usersWithoutIds) {
//             try {
//                 const converseId = await assignConverseIdToUser(user.id);
//                 updatedUsers.push({
//                     id: user.id,
//                     username: user.username,
//                     email: user.email,
//                     converseId
//                 });
//                 console.log(`✅ Assigned ${converseId} to user ${user.id}`);
//             } catch (error) {
//                 console.error(`❌ Failed to assign converse ID to user ${user.id}:`, error);
//             }
//         }
        
//         return {
//             updated: updatedUsers.length,
//             users: updatedUsers
//         };
//     } catch (error) {
//         console.error('❌ Error in bulk converse ID assignment:', error);
//         throw new CustomError(`Bulk assignment failed: ${error.message}`, 500);
//     }
// };
// /**
//  * Standardized database query executor with proper error handling
//  */
// // export const executeQuery = async (query, params = []) => {
// //   try {
// //     const [results] = await db.query(query, params);
// //     return results;
// //   } catch (error) {
// //     console.error('Database query error:', error);
// //     console.error('Query:', query);
// //     console.error('Params:', params);
// //     throw new CustomError('Database operation failed', 500);
// //   }
// // };

// export const executeQuery = async (query, params = []) => {
//   try {
//     const [results] = await db.query(query, params);
//     return results;
//   } catch (error) {
//     console.error('Database query error:', error);
//     console.error('Query:', query);
//     console.error('Params:', params);
//     throw new CustomError('Database operation failed', 500);
//   }
// };

// /**
//  * Validate membership stage transitions
//  */


// export const validateStageTransition = (currentStage, newStage) => {
//   const validTransitions = {
//     'none': ['applicant'],
//     'applicant': ['pre_member', 'applicant'], // Can stay applicant if rejected
//     'pre_member': ['member'],
//     'member': ['member'] // Members stay members
//   };
  
//   return validTransitions[currentStage]?.includes(newStage) || false;
// };

// /**
//  * Helper function to convert data to CSV
//  */
// // export const convertToCSV = (data) => {
// //   if (!data.length) return '';
  
// //   const headers = Object.keys(data[0]).join(',');
// //   const rows = data.map(row => 
// //     Object.values(row).map(value => {
// //       if (value === null || value === undefined) return '';
// //       if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
// //       if (value instanceof Date) return `"${value.toISOString()}"`;
// //       return value;
// //     }).join(',')
// //   );
  
// //   return [headers, ...rows].join('\n');
// // };


// export const convertToCSV = (data) => {
//   if (!data.length) return '';
  
//   const headers = Object.keys(data[0]).join(',');
//   const rows = data.map(row => 
//     Object.values(row).map(value => {
//       if (value === null || value === undefined) return '';
//       if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
//       if (value instanceof Date) return `"${value.toISOString()}"`;
//       return value;
//     }).join(',')
//   );
  
//   return [headers, ...rows].join('\n');
// };

// /**
//  * Standardized success response
//  */
// export const successResponse = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
//   return res.status(statusCode).json({
//     success: true,
//     message,
//     ...data
//   });
// };

// /**
//  * Standardized error response
//  */
// export const errorResponse = (res, error, statusCode = 500) => {
//   console.error('Error occurred:', error);
//   return res.status(statusCode).json({
//     success: false,
//     error: error.message || 'An error occurred',
//     details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//   });
// };

// /**
//  * Validate request parameters
//  */
// export const validateRequest = (requiredFields) => {
//   return (req, res, next) => {
//     const missingFields = requiredFields.filter(field => !req.body[field]);
    
//     if (missingFields.length > 0) {
//       return errorResponse(res, 
//         new CustomError(`Missing required fields: ${missingFields.join(', ')}`, 400), 
//         400
//       );
//     }
    
//     next();
//   };
// };

// /**
//  * Validate admin permissions
//  */
// export const requireAdmin = (req, res, next) => {
//   const userRole = req.user?.role;
  
//   if (!['admin', 'super_admin'].includes(userRole)) {
//     return errorResponse(res, 
//       new CustomError('Administrative privileges required', 403), 
//       403
//     );
//   }
  
//   next();
// };

// /**
//  * Validate super admin permissions
//  */
// export const requireSuperAdmin = (req, res, next) => {
//   const userRole = req.user?.role;
  
//   if (userRole !== 'super_admin') {
//     return errorResponse(res, 
//       new CustomError('Super administrative privileges required', 403), 
//       403
//     );
//   }
  
//   next();
// };