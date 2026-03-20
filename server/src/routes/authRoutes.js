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
import { authMiddleware } from '../middleware/auth.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';

const router = express.Router();

// User Authentication
router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.post('/logout', authMiddleware, logout);

// Admin Authentication
router.post('/admin-login', adminLogin);
router.get('/admin/profile', adminAuthMiddleware, getAdminProfile);
router.post('/admin/logout', adminAuthMiddleware, adminLogout);

export default router;