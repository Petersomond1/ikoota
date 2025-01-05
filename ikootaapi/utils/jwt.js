import jwt from 'jsonwebtoken';

export const generateToken = (userData) => {
    const { userId, email, isAdmin, isVerified, isConfirmed } = userData;
    const payload = {
      userId,
      email,
      isAdmin,
      isVerified,
      isConfirmed,
    };
  
    // Create a JWT token with a 1 hour expiration
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  };