import express from 'express';
import { 
  signup, 
  login, 
  getProfile, 
  logout,
  adminLogin,
  getAdminProfile,
  adminLogout
} from '../controllers/authController.js';
import {
  requestPasswordReset,
  validateResetToken,
  resetPassword
} from '../controllers/passwordController.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';

const router = express.Router();

// User Authentication
router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.post('/logout', authMiddleware, logout);

// 🔐 PASSWORD RESET ROUTES
router.post('/forgot-password', requestPasswordReset);
router.get('/reset-password/:token', validateResetToken);
router.post('/reset-password', resetPassword);

// Admin Authentication
router.post('/admin-login', adminLogin);
router.get('/admin/profile', adminAuthMiddleware, getAdminProfile);
router.post('/admin/logout', adminAuthMiddleware, adminLogout);

export default router;