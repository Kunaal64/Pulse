import { User } from '../models/index.js';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import { asyncHandler, BadRequestError, UnauthorizedError, ConflictError } from '../middleware/errorHandler.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, password, name, organization } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ConflictError('User with this email already exists');
  }

  // Create user
  const user = await User.create({
    email: email.toLowerCase(),
    password,
    name,
    organization: organization || 'default',
    role: 'viewer' // Default role
  });

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: user.toPublicJSON(),
      token,
      refreshToken
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  // Find user with password
  const user = await User.findByEmailWithPassword(email.toLowerCase());
  
  if (!user) {
    throw UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw UnauthorizedError('Account is deactivated. Please contact administrator.');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw UnauthorizedError('Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();
  
  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  
  user.refreshToken = refreshToken;
  await user.save();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toPublicJSON(),
      token,
      refreshToken
    }
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.json({
    success: true,
    data: {
      user: user.toPublicJSON()
    }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;

  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.toPublicJSON()
    }
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw BadRequestError('Current and new password are required');
  }

  if (newPassword.length < 6) {
    throw BadRequestError('New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw UnauthorizedError('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Password changed successfully',
    data: { token }
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw BadRequestError('Refresh token is required');
  }

  const user = await User.findOne({ refreshToken }).select('+refreshToken');
  
  if (!user) {
    throw UnauthorizedError('Invalid refresh token');
  }

  // Generate new tokens
  const token = generateToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save();

  res.json({
    success: true,
    data: {
      token,
      refreshToken: newRefreshToken
    }
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  user.refreshToken = null;
  await user.save();

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});
