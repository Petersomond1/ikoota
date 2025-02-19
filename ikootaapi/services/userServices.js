import dbQuery from '../config/dbQuery.js';
import CustomError from '../utils/CustomError.js';

export const getUserProfileService = async (user_id) => {
  const sql = 'SELECT * FROM users WHERE id = ?';
  const userProfile = await dbQuery(sql, [user_id]);
  if (userProfile.length === 0) {
    throw new CustomError('User not found', 404);
  }
  return userProfile[0];
};

export const updateUserProfileService = async (userId, profileData) => {
    const { name, email, phone } = profileData;
    const sql = 'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?';
    await dbQuery(sql, [name, email, phone, userId]);
    return { userId, name, email, phone };
};

export const updateUser = async (userId, role) => {
    const query = `
      UPDATE users 
      SET role = ?, updatedAt = NOW() 
      WHERE id = ?`;
    const result = await dbQuery(query, [role, userId]);
  
    if (result.affectedRows === 0) {
      throw new CustomError('User not found or role update failed', 404);
    }
  };
  