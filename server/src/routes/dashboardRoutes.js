import express from 'express';
import {
  getQueueStatus,
  getTeamStatus,
  updateAgentStatus,
  getDashboardData,
} from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Protect all dashboard routes with authentication
router.use(authMiddleware);

// Get queue status
router.get('/queue-status', getQueueStatus);

// Get team availability status
router.get('/team-status', getTeamStatus);

// Update agent status
router.put('/agent-status/:agentId', updateAgentStatus);

// Get combined dashboard data
router.get('/data', getDashboardData);

export default router;