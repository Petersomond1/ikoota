// controllers/authController.js - WORKING VERSION (sends response properly)
import jwt from 'jsonwebtoken';
import { UserService } from '../services/userService.js';

export class AuthController {
  
  // Fixed login that ACTUALLY sends response
 static async login(req, res) {
  try {
    const { email, password } = req.body;
    
    console.log('🔍 LOGIN: Starting for:', email);
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    console.log('🔍 LOGIN: Calling getUserByEmail...');
    const user = await UserService.getUserByEmail(email);

    if (!user) {
      console.log('❌ LOGIN: User not found');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    console.log('✅ LOGIN: User found, checking ban status...');

    // CORRECT: Check isbanned field (not is_banned)
    if (user.isbanned) {
      console.log('❌ LOGIN: User is banned');
      return res.status(403).json({
        success: false,
        error: 'Account is banned'
      });
    }

    console.log('🔍 LOGIN: User not banned, verifying password...');
    console.log('🔍 LOGIN: Password hash available:', !!user.password_hash);

    // CORRECT: Use password_hash field
    const passwordMatch = await UserService.verifyPassword(password, user.password_hash);
    
    if (!passwordMatch) {
      console.log('❌ LOGIN: Password verification failed');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    console.log('✅ LOGIN: Password verified, creating token...');

    // Generate JWT token
    const tokenPayload = {
      user_id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      membership_stage: user.membership_stage || 'none',
      is_member: user.membership_stage === 'member'
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: '7d' }
    );

    console.log('✅ LOGIN: Token generated, sending response...');

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        membership_stage: user.membership_stage,
        is_member: user.membership_stage === 'member'
      }
    });

  } catch (error) {
    console.error('❌ LOGIN: Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
}

  // Working registration
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username, email, and password are required'
        });
      }

      // Check if user already exists
      const userExists = await UserService.userExists(email, username);
      if (userExists) {
        return res.status(409).json({
          success: false,
          error: 'User already exists with this email or username'
        });
      }

      // Create user
      const newUser = await UserService.createUser({
        username,
        email,
        password
      });

      console.log('✅ New user registered:', newUser.email);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          membership_stage: newUser.membership_stage,
          is_member: newUser.membership_stage === 'member',
          created_at: newUser.createdAt
        }
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        message: error.message
      });
    }
  }

  // Logout
  static async logout(req, res) {
    console.log('🔄 LOGOUT: Processing logout request...');
    res.json({
      success: true,
      message: 'Logout successful'
    });
    console.log('✅ LOGOUT: Response sent successfully!');
  }
}

