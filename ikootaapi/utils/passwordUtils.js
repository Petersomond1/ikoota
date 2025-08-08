
// ikootaapi/utils/passwordUtils.js
// Password utilities (implement according to your security requirements)

import bcrypt from 'bcryptjs';

export const hashPassword = async (password) => {
  try {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('🔐 Password hashed successfully');
    return hashedPassword;
  } catch (error) {
    console.error('❌ Password hashing failed:', error);
    throw error;
  }
};

export const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('🔐 Password verification:', isMatch ? 'success' : 'failed');
    return isMatch;
  } catch (error) {
    console.error('❌ Password verification failed:', error);
    throw error;
  }
};
