import dbQuery from '../config/dbQuery.js';
import CustomError from '../utils/CustomError.js';

export const getUserProfileService = async (userId) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const userProfile = await dbQuery(sql, [userId]);
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