import express from 'express';
import {
  getDarkModePreference,
  updateDarkModePreference,
  toggleDarkMode,
} from '../controllers/themeController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All theme routes require authentication
router.use(authMiddleware);

// ==========================================
// DARK MODE ROUTES
// ==========================================
router.get('/dark-mode', getDarkModePreference);           // GET /api/theme/dark-mode
router.put('/dark-mode', updateDarkModePreference);        // PUT /api/theme/dark-mode
router.post('/dark-mode/toggle', toggleDarkMode);          // POST /api/theme/dark-mode/toggle

export default router;