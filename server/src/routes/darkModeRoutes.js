import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDarkModePreference, setDarkModePreference } from '../controllers/darkModeController.js';

const router = express.Router();

router.get('/preference', authMiddleware, getDarkModePreference);
router.post('/toggle', authMiddleware, setDarkModePreference);

export default router;
