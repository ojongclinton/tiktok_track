import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { Op } from 'sequelize';

// Generate tokens
const generateTokens = async (user, req) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Short-lived access token
  );

  const refreshTokenValue = RefreshToken.generateToken();
  
  // Store refresh token in database
  await RefreshToken.create({
    user_id: user.id,
    token: refreshTokenValue,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    device_info: {
      userAgent: req.get('User-Agent'),
      platform: req.get('Sec-Ch-Ua-Platform')
    },
    ip_address: req.ip
  });

  return { accessToken, refreshToken: refreshTokenValue };
};

// Register
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return sendError(res, 'User with this email already exists.', 400);
    }

    // Create user
    const user = await User.create({
      email,
      password,
      first_name: firstName,
      last_name: lastName
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // TODO: Send verification email here
    console.log(`Verification token for ${email}: ${verificationToken}`);

    sendSuccess(res, 
      { 
        message: 'Registration successful. Please check your email to verify your account.',
        userId: user.id 
      }, 
      'User registered successfully', 
      201
    );

  } catch (error) {
    console.error('Registration error:', error);
    sendError(res, 'Registration failed. Please try again.');
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user || !await user.checkPassword(password)) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    if (!user.is_active) {
      return sendError(res, 'Account is deactivated. Please contact support.', 401);
    }

    if (!user.email_verified) {
      return sendError(res, 'Please verify your email address before logging in.', 401);
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user, req);

    // Remove sensitive data
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      subscriptionPlan: user.subscription_plan,
      subscriptionExpires: user.subscription_expires
    };

    sendSuccess(res, {
      user: userResponse,
      accessToken,
      refreshToken
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Login failed. Please try again.');
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 'Refresh token is required.', 400);
    }

    // Find refresh token
    const tokenRecord = await RefreshToken.findOne({
      where: { token: refreshToken },
      include: [{ model: User, as: 'user' }]
    });

    if (!tokenRecord || tokenRecord.isExpired() || tokenRecord.isRevoked()) {
      return sendError(res, 'Invalid or expired refresh token.', 401);
    }

    const user = tokenRecord.User;
    if (!user || !user.is_active) {
      return sendError(res, 'User account not found or inactive.', 401);
    }

    // Revoke old refresh token
    tokenRecord.revoked_at = new Date();
    await tokenRecord.save();

    // Generate new tokens
    const tokens = await generateTokens(user, req);

    sendSuccess(res, tokens, 'Token refreshed successfully');

  } catch (error) {
    console.error('Token refresh error:', error);
    sendError(res, 'Failed to refresh token.');
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke the refresh token
      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { token: refreshToken } }
      );
    }

    sendSuccess(res, null, 'Logged out successfully');

  } catch (error) {
    console.error('Logout error:', error);
    sendError(res, 'Logout failed.');
  }
};

// Logout from all devices
export const logoutAll = async (req, res) => {
  try {
    const userId = req.user.id;

    // Revoke all refresh tokens for this user
    await RefreshToken.update(
      { revoked_at: new Date() },
      { 
        where: { 
          user_id: userId,
          revoked_at: null
        } 
      }
    );

    sendSuccess(res, null, 'Logged out from all devices successfully');

  } catch (error) {
    console.error('Logout all error:', error);
    sendError(res, 'Failed to logout from all devices.');
  }
};

// Get current user
export const me = async (req, res) => {
  try {
    const user = req.user;

    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      subscriptionPlan: user.subscription_plan,
      subscriptionExpires: user.subscription_expires,
      emailVerified: user.email_verified,
      isActive: user.is_active,
      createdAt: user.created_at
    };

    sendSuccess(res, userResponse, 'User details retrieved successfully');

  } catch (error) {
    console.error('Get user error:', error);
    sendError(res, 'Failed to get user details.');
  }
};

// Verify email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return sendError(res, 'Verification token is required.', 400);
    }

    // Hash the token (same way it was hashed when stored)
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this verification token
    const user = await User.findOne({
      where: {
        email_verification_token: hashedToken,
        is_active: true
      }
    });

    if (!user) {
      return sendError(res, 'Invalid or expired verification token.', 400);
    }

    // Update user as verified
    user.email_verified = true;
    user.email_verification_token = null;
    await user.save();

    sendSuccess(res, null, 'Email verified successfully. You can now log in.');

  } catch (error) {
    console.error('Email verification error:', error);
    sendError(res, 'Email verification failed.');
  }
};

// Resend verification email
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    if (user.email_verified) {
      return sendError(res, 'Email is already verified.', 400);
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // TODO: Send verification email here
    console.log(`New verification token for ${email}: ${verificationToken}`);

    sendSuccess(res, null, 'Verification email sent successfully.');

  } catch (error) {
    console.error('Resend verification error:', error);
    sendError(res, 'Failed to resend verification email.');
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists or not
      return sendSuccess(res, null, 'If your email is registered, you will receive a password reset link.');
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // TODO: Send password reset email here
    console.log(`Password reset token for ${email}: ${resetToken}`);

    sendSuccess(res, null, 'If your email is registered, you will receive a password reset link.');

  } catch (error) {
    console.error('Forgot password error:', error);
    sendError(res, 'Failed to process password reset request.');
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return sendError(res, 'Token and new password are required.', 400);
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return sendError(res, 'Invalid or expired reset token.', 400);
    }

    // Update password and clear reset token
    user.password = password;
    user.password_reset_token = null;
    user.password_reset_expires = null;
    await user.save();

    // Revoke all refresh tokens for security
    await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { user_id: user.id, revoked_at: null } }
    );

    sendSuccess(res, null, 'Password reset successfully. Please log in with your new password.');

  } catch (error) {
    console.error('Reset password error:', error);
    sendError(res, 'Failed to reset password.');
  }
};
