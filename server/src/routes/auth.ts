import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Name must be between 2 and 30 characters'),
  body('lastname')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Last name must be between 2 and 30 characters'),
  body('username')
    .trim()
    .isLength({ min: 2, max: 25 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('accountType')
    .isIn(['student', 'teacher'])
    .withMessage('Account type must be student or teacher'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Helper function to generate JWT token
const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    { userId },
    jwtSecret,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'alumet-api',
      audience: 'alumet-client'
    }
  );
};

// Register new user
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { name, lastname, username, email, password, accountType, subjects } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ mail: email }, { username }]
  });

  if (existingUser) {
    const field = existingUser.mail === email ? 'email' : 'username';
    return res.status(409).json({
      success: false,
      error: `User with this ${field} already exists`
    });
  }

  // Create new user
  const user = new User({
    name,
    lastname,
    username,
    mail: email,
    password,
    accountType,
    subjects: subjects || [],
    emailVerificationToken: crypto.randomBytes(32).toString('hex'),
  });

  await user.save();

  // Generate token
  const token = generateToken(user._id.toString());

  // Send welcome email (optional)
  try {
    await sendEmail({
      to: user.mail,
      subject: 'Welcome to Alumet Education!',
      template: 'welcome',
      data: { name: user.name, username: user.username }
    });
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError);
    // Don't fail registration if email fails
  }

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toJSON(),
      token
    }
  });
}));

// Login user
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { email, password, twoFactorCode } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ mail: email }).select('+password +a2fSecret');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }

  // Check if account is suspended
  if (user.suspended?.reason) {
    return res.status(403).json({
      success: false,
      error: 'Account suspended',
      reason: user.suspended.reason
    });
  }

  // Check 2FA if enabled
  if (user.isA2FEnabled) {
    if (!twoFactorCode) {
      return res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        message: 'Two-factor authentication required'
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.a2fSecret!,
      encoding: 'base32',
      token: twoFactorCode,
      window: 2 // Allow 2 time steps of variance
    });

    if (!verified) {
      return res.status(401).json({
        success: false,
        error: 'Invalid two-factor authentication code'
      });
    }
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id.toString());

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      token
    }
  });
}));

// Verify token
router.get('/verify', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
}));

// Logout (client-side token removal)
router.post('/logout', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  // In a more sophisticated setup, you might maintain a token blacklist
  // For now, we rely on client-side token removal
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// Enable 2FA
router.post('/2fa/enable', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.userId).select('+a2fSecret');
  
  if (!user) {
    throw createError('User not found', 404);
  }

  if (user.isA2FEnabled) {
    return res.status(400).json({
      success: false,
      error: 'Two-factor authentication is already enabled'
    });
  }

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `Alumet Education (${user.username})`,
    issuer: 'Alumet Education'
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  // Save secret (but don't enable 2FA yet)
  user.a2fSecret = secret.base32;
  await user.save();

  res.json({
    success: true,
    data: {
      secret: secret.base32,
      qrCode: qrCodeUrl
    }
  });
}));

// Verify and activate 2FA
router.post('/2fa/verify', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Verification code is required'
    });
  }

  const user = await User.findById(req.userId).select('+a2fSecret');
  
  if (!user || !user.a2fSecret) {
    return res.status(400).json({
      success: false,
      error: 'Two-factor authentication setup not found'
    });
  }

  // Verify the code
  const verified = speakeasy.totp.verify({
    secret: user.a2fSecret,
    encoding: 'base32',
    token: code,
    window: 2
  });

  if (!verified) {
    return res.status(400).json({
      success: false,
      error: 'Invalid verification code'
    });
  }

  // Enable 2FA
  user.isA2FEnabled = true;
  await user.save();

  res.json({
    success: true,
    message: 'Two-factor authentication enabled successfully',
    data: {
      user: user.toJSON()
    }
  });
}));

// Disable 2FA
router.post('/2fa/disable', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Verification code is required'
    });
  }

  const user = await User.findById(req.userId).select('+a2fSecret');
  
  if (!user || !user.isA2FEnabled) {
    return res.status(400).json({
      success: false,
      error: 'Two-factor authentication is not enabled'
    });
  }

  // Verify the code
  const verified = speakeasy.totp.verify({
    secret: user.a2fSecret!,
    encoding: 'base32',
    token: code,
    window: 2
  });

  if (!verified) {
    return res.status(400).json({
      success: false,
      error: 'Invalid verification code'
    });
  }

  // Disable 2FA
  user.isA2FEnabled = false;
  user.a2fSecret = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Two-factor authentication disabled successfully',
    data: {
      user: user.toJSON()
    }
  });
}));

// Request password reset
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { email } = req.body;
  const user = await User.findOne({ mail: email });

  // Always return success to prevent email enumeration
  const successResponse = {
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent'
  };

  if (!user) {
    return res.json(successResponse);
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  // Send reset email
  try {
    const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.mail,
      subject: 'Password Reset Request',
      template: 'passwordReset',
      data: { name: user.name, resetUrl }
    });
  } catch (emailError) {
    console.error('Failed to send password reset email:', emailError);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    return res.status(500).json({
      success: false,
      error: 'Failed to send password reset email'
    });
  }

  res.json(successResponse);
}));

// Reset password
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { token } = req.params;
  const { password } = req.body;

  // Hash token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired password reset token'
    });
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

// Change password
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.userId).select('+password');

  if (!user) {
    throw createError('User not found', 404);
  }

  // Verify current password
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({
      success: false,
      error: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

export default router;