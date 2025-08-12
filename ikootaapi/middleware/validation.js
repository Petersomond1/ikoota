// middleware/validation.js - COMPLETE VALIDATION MIDDLEWARE
import { body, validationResult } from 'express-validator';

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Login validation
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

// Registration validation
export const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters, alphanumeric and underscores only'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  handleValidationErrors
];

// User profile update validation
export const validateUserUpdate = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail(),
  body('bio')
    .optional()
    .isLength({ max: 500 }),
  body('location')
    .optional()
    .isLength({ max: 100 }),
  body('website')
    .optional()
    .isURL(),
  handleValidationErrors
];

// Application validation
export const validateApplication = [
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers array is required'),
  body('answers.*.question')
    .notEmpty()
    .withMessage('Question is required'),
  body('answers.*.answer')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Answer must be 10-2000 characters'),
  handleValidationErrors
];

// Teaching validation
export const validateTeaching = [
  body('topic')
    .isLength({ min: 5, max: 200 })
    .withMessage('Topic must be 5-200 characters'),
  body('description')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be 10-500 characters'),
  body('content')
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters'),
  body('audience')
    .optional()
    .isIn(['public', 'member'])
    .withMessage('Audience must be public or member'),
  body('subjectMatter')
    .optional()
    .isLength({ max: 100 }),
  handleValidationErrors
];

// Admin update validation
export const validateAdminUpdate = [
  body('membership_stage')
    .optional()
    .isIn(['visitor', 'applicant', 'pre_member', 'member', 'admin', 'super_admin']),
  body('is_member')
    .optional()
    .isIn(['visitor', 'applicant', 'pre_member', 'member', 'admin', 'super_admin']),
  body('role')
    .optional()
    .isIn(['user', 'admin', 'super_admin']),
  body('is_banned')
    .optional()
    .isBoolean(),
  handleValidationErrors
];