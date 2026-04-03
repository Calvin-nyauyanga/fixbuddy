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
import { checkSuspension } from '../middleware/checkSuspension.js';

const router = express.Router();

// quick health route in userRoutes
router.get('/__test_route__', (req, res) => {
  return res.status(200).json({ success: true, message: 'userRoutes test route hit' });
});

// 🔒 Example protected route with suspension check
router.get('/protected-route', checkSuspension, (req, res) => {
  return res.status(200).json({ success: true, message: 'Protected route access granted' });
});

// ✅ GET all users - public endpoint (protected by checking in controller if needed)
router.get('/', getAllUsers);

// ✅ GET user statistics - protected
router.get('/stats/overview', adminAuthMiddleware, getUserStats);

// ✅ SEARCH users - public
router.get('/search', searchUsers);

// ✅ GET single user - public
router.get('/:id', getUserById);

// ✅ CREATE user - protected
router.post('/', adminAuthMiddleware, [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['user', 'staff', 'admin']).withMessage('Invalid role')
], createUser);

// ✅ UPDATE user - protected
router.put('/:id', adminAuthMiddleware, [
    body('name').optional().trim().notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Valid email is required')
], updateUser);

// ✅ SUSPEND user - protected
router.patch('/:id/suspend', adminAuthMiddleware, suspendUser);

// ✅ ACTIVATE user - protected
router.patch('/:id/activate', adminAuthMiddleware, activateUser);

// ✅ CHANGE user role - protected
router.patch('/:id/role', adminAuthMiddleware, [
    body('role').notEmpty().withMessage('Role is required'),
    body('role').isIn(['user', 'staff', 'admin']).withMessage('Invalid role')
], changeUserRole);

// ✅ DELETE user - protected
router.delete('/:id', adminAuthMiddleware, deleteUser);

export default router;