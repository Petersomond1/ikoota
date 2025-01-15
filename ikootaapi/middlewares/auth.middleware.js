import jwt from 'jsonwebtoken';
import dbQuery from '../config/dbQuery.js';
import dotenv from 'dotenv';

dotenv.config();

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication failed. No token provided.' });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;

    next();
  } catch (error) {
    console.error('Error in authenticate middleware:', error.message);
    res.status(401).json({ error: 'Authentication failed.' });
  }
};

export const authorize = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Authorization failed. No user found.' });
      }

      const sql = 'SELECT * FROM users WHERE id = ?';
      console.log("user", user)
      const result = await dbQuery(sql, [user.userId]);
      
      if (result.length === 0) {
        return res.status(401).json({ error: 'Authorization failed. User not found.' });
      }

      if (!requiredRoles.includes(result[0].role)){
        return res.status(403).json({ error: 'Authorization failed two. Insufficient permissions.' });
      }

      next();
    } catch (error) {
      console.error('Error in authorize middleware:', error.message);
      res.status(403).json({ error: 'Authorization failed.' });
    }
  };
};