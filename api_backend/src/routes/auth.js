import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';

const router = express.Router();

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

const emailValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const passwordValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Routes
router.post('/register', 
  authLimiter, 
  registerValidation, 
  validate, 
  register
);

router.post('/login', 
  authLimiter, 
  loginValidation, 
  validate, 
  login
);

router.post('/refresh-token', 
  generalLimiter, 
  refreshTokenValidation, 
  validate, 
  refreshToken
);

router.post('/logout', 
  generalLimiter, 
  logout
);

router.post('/logout-all', 
  generalLimiter, 
  authenticate, 
  logoutAll
);

router.get('/me', 
  generalLimiter, 
  authenticate, 
  me
);

router.get('/verify-email/:token', 
  generalLimiter, 
  verifyEmail
);

router.post('/resend-verification', 
  authLimiter, 
  emailValidation, 
  validate, 
  resendVerification
);

router.post('/forgot-password', 
  authLimiter, 
  emailValidation, 
  validate, 
  forgotPassword
);

router.post('/reset-password/:token', 
  authLimiter, 
  passwordValidation, 
  validate, 
  resetPassword
);

export default router;
