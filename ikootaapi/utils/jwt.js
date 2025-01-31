import jwt from 'jsonwebtoken';

export const generateToken = (userData) => {
    const { user_id, email, role, is_member } = userData;
    const payload = {
      user_id,
      email,
      role,
      is_member
    };
  console.log('payload @jwt:', payload);
    // Create a JWT token with a 1 hour expiration
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  };