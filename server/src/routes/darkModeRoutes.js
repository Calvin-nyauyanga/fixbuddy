// server/src/routes/darkmodeRoutes.js

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';
import {
  getUserDarkmodePreference,
  updateUserDarkmodePreference,
  toggleUserDarkmodePreference,
  getAllUsersDarkmodePreferences
} from './controllers/darkmodeController.js';

const router = express.Router();

/**
 * @route   GET /api/darkmode/preference
 * @desc    Get current user's darkmode preference
 * @access  Private (authenticated users)
 */
router.get('/preference', authMiddleware, getUserDarkmodePreference);

/**
 * @route   PUT /api/darkmode/preference
 * @desc    Update user's darkmode preference
 * @access  Private (authenticated users)
 * @body    { darkMode: boolean }
 */
router.put('/preference', authMiddleware, updateUserDarkmodePreference);

/**
 * @route   POST /api/darkmode/toggle
 * @desc    Toggle user's darkmode preference
 * @access  Private (authenticated users)
 */
router.post('/toggle', authMiddleware, toggleUserDarkmodePreference);

/**
 * @route   GET /api/darkmode/all
 * @desc    Get all users' darkmode preferences
 * @access  Private (admin only)
 */
router.get('/all', adminAuthMiddleware, getAllUsersDarkmodePreferences);

export default router;