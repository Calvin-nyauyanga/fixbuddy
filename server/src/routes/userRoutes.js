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
    updateUserStatus,
    getUsersByStatus,
    getTeamStatus,
} from '../controllers/userController.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';
import { staffAuthMiddleware } from '../middleware/staffAuth.js';
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

// ✅ GET all users - public endpoint
router.get('/', getAllUsers);

// ✅ GET user statistics - protected (admin only)
router.get('/stats/overview', adminAuthMiddleware, getUserStats);

// ✅ GET users by status - protected (staff & admin)
router.get('/status/:status', staffAuthMiddleware, getUsersByStatus);

// ✅ GET team status for dashboard - protected (staff & admin)
router.get('/team/status/dashboard', staffAuthMiddleware, getTeamStatus);

// ✅ SEARCH users - public
router.get('/search', searchUsers);

// ✅ GET single user - public
router.get('/:id', getUserById);

// ✅ CREATE user - protected (admin only)
router.post('/', adminAuthMiddleware, [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['user', 'staff', 'admin']).withMessage('Invalid role')
], createUser);

// ✅ UPDATE user - protected (admin only)
router.put('/:id', adminAuthMiddleware, [
    body('name').optional().trim().notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Valid email is required')
], updateUser);

// ✅ UPDATE user status (Team Status for agents/staff/admin, Account Status for admin only)
// Accepts either: { status: 'active'|'suspended' } or { teamStatus: 'available'|'on-break'|'away'|'offline' }
// Agents/Staff can update their own team status, Admins can update anyone's status
router.patch('/:id/status', staffAuthMiddleware, [
    body('status').optional().isIn(['active', 'suspended']).withMessage('Invalid account status'),
    body('teamStatus').optional().isIn(['available', 'on-break', 'away', 'offline']).withMessage('Invalid team status')
], updateUserStatus);

// ✅ SUSPEND user - protected (admin only)
router.patch('/:id/suspend', adminAuthMiddleware, suspendUser);

// ✅ ACTIVATE user - protected (admin only)
router.patch('/:id/activate', adminAuthMiddleware, activateUser);

// ✅ CHANGE user role - protected (admin only)
router.patch('/:id/role', adminAuthMiddleware, [
    body('role').notEmpty().withMessage('Role is required'),
    body('role').isIn(['user', 'staff', 'admin']).withMessage('Invalid role')
], changeUserRole);

// ✅ DELETE user - protected (admin only)
router.delete('/:id', adminAuthMiddleware, deleteUser);

export default router;