import { User } from '../models/index.js';
import { asyncHandler, NotFoundError, ForbiddenError, BadRequestError } from '../middleware/errorHandler.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private (Admin)
 */
export const getUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    role,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query - Admin sees users in their organization
  const query = { organization: req.user.organization };

  // Apply filters
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      users: users.map(u => u.toPublicJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin)
 */
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw NotFoundError('User not found');
  }

  // Check organization
  if (user.organization !== req.user.organization) {
    throw ForbiddenError('Access denied');
  }

  res.json({
    success: true,
    data: { user: user.toPublicJSON() }
  });
});

/**
 * @desc    Create new user (Admin only)
 * @route   POST /api/users
 * @access  Private (Admin)
 */
export const createUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, password, name, role } = req.body;

  // Check if email exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw BadRequestError('User with this email already exists');
  }

  const user = await User.create({
    email: email.toLowerCase(),
    password,
    name,
    role: role || 'viewer',
    organization: req.user.organization
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user: user.toPublicJSON() }
  });
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private (Admin)
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw NotFoundError('User not found');
  }

  if (user.organization !== req.user.organization) {
    throw ForbiddenError('Access denied');
  }

  const { name, role, isActive } = req.body;

  if (name) user.name = name;
  if (role) user.role = role;
  if (typeof isActive === 'boolean') user.isActive = isActive;

  await user.save();

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: user.toPublicJSON() }
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw NotFoundError('User not found');
  }

  if (user.organization !== req.user.organization) {
    throw ForbiddenError('Access denied');
  }

  // Prevent self-deletion
  if (user._id.toString() === req.user._id.toString()) {
    throw BadRequestError('Cannot delete your own account');
  }

  await user.deleteOne();

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

/**
 * @desc    Update user role
 * @route   PATCH /api/users/:id/role
 * @access  Private (Admin)
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw NotFoundError('User not found');
  }

  if (user.organization !== req.user.organization) {
    throw ForbiddenError('Access denied');
  }

  const { role } = req.body;

  if (!['viewer', 'editor', 'admin'].includes(role)) {
    throw BadRequestError('Invalid role. Must be viewer, editor, or admin');
  }

  user.role = role;
  await user.save();

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: { user: user.toPublicJSON() }
  });
});

/**
 * @desc    Toggle user active status
 * @route   PATCH /api/users/:id/status
 * @access  Private (Admin)
 */
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw NotFoundError('User not found');
  }

  if (user.organization !== req.user.organization) {
    throw ForbiddenError('Access denied');
  }

  // Prevent self-deactivation
  if (user._id.toString() === req.user._id.toString()) {
    throw BadRequestError('Cannot deactivate your own account');
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { user: user.toPublicJSON() }
  });
});

/**
 * @desc    Get user statistics
 * @route   GET /api/users/stats
 * @access  Private (Admin)
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const organization = req.user.organization;

  const stats = await User.aggregate([
    { $match: { organization } },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        adminCount: {
          $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
        },
        editorCount: {
          $sum: { $cond: [{ $eq: ['$role', 'editor'] }, 1, 0] }
        },
        viewerCount: {
          $sum: { $cond: [{ $eq: ['$role', 'viewer'] }, 1, 0] }
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalUsers: 0,
    activeUsers: 0,
    adminCount: 0,
    editorCount: 0,
    viewerCount: 0
  };

  res.json({
    success: true,
    data: { stats: result }
  });
});
