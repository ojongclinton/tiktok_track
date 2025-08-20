import { body, param, query, validationResult } from 'express-validator';

/**
 * Common validation rules
 */

// Email validation
export const emailValidation = () =>
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address');

// Password validation
export const passwordValidation = (field = 'password') =>
  body(field)
    .isLength({ min: 6, max: 128 })
    .withMessage(`${field} must be between 6 and 128 characters`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(`${field} must contain at least one uppercase letter, one lowercase letter, and one number`);

// Simple password validation (less strict)
export const simplePasswordValidation = (field = 'password') =>
  body(field)
    .isLength({ min: 6 })
    .withMessage(`${field} must be at least 6 characters long`);

// Name validation
export const nameValidation = (field) =>
  body(field)
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage(`${field} must be between 1 and 100 characters`)
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(`${field} can only contain letters, spaces, hyphens, and apostrophes`);

// Username validation (for TikTok usernames)
export const usernameValidation = (field = 'username') =>
  body(field)
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage(`${field} must be between 1 and 50 characters`)
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage(`${field} can only contain letters, numbers, dots, underscores, and hyphens`);

// TikTok username parameter validation
export const tikTokUsernameParam = () =>
  param('username')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Username must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username can only contain letters, numbers, dots, underscores, and hyphens');

// Pagination validation
export const paginationValidation = () => [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a number between 1 and 1000')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be a number between 1 and 100')
    .toInt()
];

// Date range validation
export const dateRangeValidation = () => [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date')
    .toDate(),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .toDate()
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

// Period validation (for analytics)
export const periodValidation = () =>
  query('period')
    .optional()
    .isIn(['7', '30', '90', '180', '365'])
    .withMessage('Period must be one of: 7, 30, 90, 180, 365 days');

// Subscription plan validation
export const subscriptionPlanValidation = () =>
  body('plan')
    .isIn(['free', 'pro', 'agency'])
    .withMessage('Plan must be one of: free, pro, agency');

// ID parameter validation
export const idParamValidation = (field = 'id') =>
  param(field)
    .isInt({ min: 1 })
    .withMessage(`${field} must be a positive integer`);

// Token validation
export const tokenValidation = (field = 'token') =>
  body(field)
    .notEmpty()
    .withMessage(`${field} is required`)
    .isLength({ min: 10 })
    .withMessage(`${field} must be at least 10 characters long`);

// Refresh token validation
export const refreshTokenValidation = () =>
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isLength({ min: 40, max: 255 })
    .withMessage('Invalid refresh token format');

/**
 * Auth-specific validation groups
 */
export const authValidations = {
  register: [
    emailValidation(),
    simplePasswordValidation(),
    nameValidation('firstName'),
    nameValidation('lastName')
  ],

  login: [
    emailValidation(),
    body('password').notEmpty().withMessage('Password is required')
  ],

  refreshToken: [
    refreshTokenValidation()
  ],

  forgotPassword: [
    emailValidation()
  ],

  resetPassword: [
    tokenValidation('token'),
    simplePasswordValidation()
  ],

  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    simplePasswordValidation('newPassword')
  ],

  verifyEmail: [
    param('token').notEmpty().withMessage('Verification token is required')
  ]
};

/**
 * Profile-specific validation groups
 */
export const profileValidations = {
  addProfile: [
    usernameValidation()
  ],

  getProfile: [
    tikTokUsernameParam()
  ],

  removeProfile: [
    tikTokUsernameParam()
  ]
};

/**
 * Analytics-specific validation groups
 */
export const analyticsValidations = {
  getAnalytics: [
    tikTokUsernameParam(),
    periodValidation(),
    ...paginationValidation()
  ],

  getGrowth: [
    tikTokUsernameParam(),
    ...dateRangeValidation()
  ],

  getDashboard: [
    ...paginationValidation(),
    periodValidation()
  ]
};

/**
 * File upload validation
 */
export const fileValidation = {
  profileImage: (field = 'profileImage') =>
    body(field)
      .optional()
      .custom((value, { req }) => {
        if (!req.file) return true;
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error('Only JPEG, PNG, and GIF images are allowed');
        }
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
          throw new Error('File size must be less than 5MB');
        }
        
        return true;
      })
};

/**
 * Custom validation rules
 */
export const customValidations = {
  // Check if TikTok username exists (would need API call)
  tikTokUsernameExists: (field = 'username') =>
    body(field)
      .custom(async (username) => {
        // This would be implemented to check if TikTok profile exists
        // For now, just basic format validation
        if (!username.match(/^[a-zA-Z0-9._-]+$/)) {
          throw new Error('Invalid TikTok username format');
        }
        return true;
      }),

  // Ensure user doesn't exceed profile limits based on subscription
  profileLimitCheck: () =>
    body('username')
      .custom(async (username, { req }) => {
        const user = req.user;
        const limits = {
          free: 3,
          pro: 20,
          agency: 100
        };
        
        const currentCount = await user.countTrackedProfiles();
        const limit = limits[user.subscription_plan] || 3;
        
        if (currentCount >= limit) {
          throw new Error(`Profile limit reached. Upgrade your plan to track more profiles.`);
        }
        
        return true;
      })
};

/**
 * Validation result handler
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = {};
    errors.array().forEach(err => {
      extractedErrors[err.path || err.param] = err.msg;
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Sanitization helpers
 */
export const sanitize = {
  // Remove potentially harmful characters
  cleanString: (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>\"']/g, '').trim();
  },

  // Normalize TikTok username (remove @ if present)
  tikTokUsername: (username) => {
    if (typeof username !== 'string') return username;
    return username.replace(/^@/, '').toLowerCase().trim();
  },

  // Clean email
  email: (email) => {
    if (typeof email !== 'string') return email;
    return email.toLowerCase().trim();
  }
};
