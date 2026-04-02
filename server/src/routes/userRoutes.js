import express from 'express';
import { body } from 'express-validator';
import {
    getAllUsers,
    getUserById,
    searchUsers,
    updateUser,
    suspendUser,
    activateUser,
    deleteUser,
    changeUserRole,
    getUserStats,
    createUser,
} from '../controllers/userController.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';

const router = express.Router();

// Protect all user routes with admin authentication
router.use(adminAuthMiddleware);

// GET all users
router.get('/', getAllUsers);

// GET user statistics
router.get('/stats/overview', getUserStats);

// SEARCH users
router.get('/search', searchUsers);

// GET single user
router.get('/:id', getUserById);

router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['user', 'staff', 'admin']).withMessage('Invalid role')
], createUser);

// UPDATE user (edit name, email)
router.put('/:id', [
    body('name').optional().trim().notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Valid email is required')
], updateUser);

// SUSPEND user (lock account)
router.patch('/:id/suspend', suspendUser);

// ACTIVATE user (unlock account)
router.patch('/:id/activate', activateUser);

// CHANGE user role
router.patch('/:id/role', [
    body('role').notEmpty().withMessage('Role is required'),
    body('role').isIn(['user', 'staff', 'admin']).withMessage('Invalid role')
], changeUserRole);

// DELETE user
router.delete('/:id', deleteUser);

export default router;