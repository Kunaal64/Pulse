import express from 'express';
import { body } from 'express-validator';
import { userController } from '../controllers/index.js';
import { authenticate, adminOnly } from '../middleware/index.js';

const router = express.Router();

// All routes require admin access
router.use(authenticate, adminOnly);

// Validation rules
const createUserValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
];

/**
 * @route   GET /api/users
 * @desc    Get all users in organization
 * @access  Private (Admin)
 */
router.get('/', userController.getUsers);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin)
 */
router.get('/stats', userController.getUserStats);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private (Admin)
 */
router.get('/:id', userController.getUser);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin)
 */
router.post('/', createUserValidation, userController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put('/:id', userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete('/:id', userController.deleteUser);

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin)
 */
router.patch('/:id/role', userController.updateUserRole);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Toggle user active status
 * @access  Private (Admin)
 */
router.patch('/:id/status', userController.toggleUserStatus);

export default router;
