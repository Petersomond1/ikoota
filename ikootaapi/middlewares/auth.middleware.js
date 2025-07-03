// ikootaapi/middlewares/auth.middleware.js (enhanced)
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import dotenv from 'dotenv';

dotenv.config();

export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            throw new CustomError('Access token required', 401);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add this right after jwt.verify in authenticate function
console.log('=== JWT DEBUG ===');
console.log('Decoded token:', decoded);
console.log('User ID:', decoded.user_id);
console.log('Type of user_id:', typeof decoded.user_id);
console.log('================');
        
        // FIX 1: Check if decoded.user_id exists and is valid
        if (!decoded.user_id) {
    console.error('Token missing user_id:', decoded);
    throw new CustomError('Invalid token: missing user ID', 401);
}

        // FIX 2: Get user data properly (don't destructure immediately)
        const result= await db.query(`
            SELECT id, converse_id, role, is_member, is_identity_masked, isbanned
            FROM users 
            WHERE id = ?
        `, [decoded.user_id]);
        // const users = result[0];


        // FIX 3: Check if user exists before destructuring
        if (!users || users.length === 0) {
            throw new CustomError('User not found', 404);
        }

        const user = users[0]; // Now safe to get first element

        if (user.isbanned) {
            throw new CustomError('User is banned', 403);
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error); // Add logging
        res.status(error.statusCode || 401).json({ 
            error: error.message || 'Authentication failed' 
        });
    }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Super admin access required'
    });
  }
  next();
};

export const authorize = (requiredRoles) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            
            if (!user) {
                return res.status(401).json({ error: 'Authorization failed. No user found.' });
            }

            // FIX 4: Use user.id instead of user.user_id (since req.user comes from authenticate)
            const sql = 'SELECT * FROM users WHERE id = ?';
            const [result] = await db.query(sql, [user.id]); // Changed from user.user_id to user.id and added []
            
            if (result.length === 0) {
                return res.status(401).json({ error: 'Authorization failed. User not found.' });
            }

            if (!requiredRoles.includes(result[0].role)) {
                return res.status(403).json({ error: 'Authorization failed. Insufficient permissions.' });
            }

            next();
        } catch (error) {
            console.error('Error in authorize middleware:', error.message);
            res.status(403).json({ error: 'Authorization failed.' });
        }
    };
};

export const cacheMiddleware = (duration = 300) => {
  const cache = new Map();
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < duration * 1000) {
      return res.json(cached.data);
    }
    
    const originalSend = res.json;
    res.json = function(data) {
      cache.set(key, { data, timestamp: Date.now() });
      originalSend.call(this, data);
    };
    
    next();
  };
};