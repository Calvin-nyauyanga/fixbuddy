import express from 'express';
import {
  getAllTicketsAdmin,
  getDashboardStats,
  getRecentActivities,
  addTicketResponse,
  solveTicket,
  closeTicket,
  getAllUsers,
  getNotifications,
  updateTicketPriority,
  updateTicketStatus,
} from '../controllers/helpdeskController.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';

const router = express.Router();

// All helpdesk routes require admin authentication
router.use(adminAuthMiddleware);
  
// Dashboard & Statistics
router.get('/stats', getDashboardStats);
router.get('/activities', getRecentActivities);
router.get('/notifications', getNotifications);

// Ticket Management
router.get('/tickets', getAllTicketsAdmin);
console.log('Setting up priority route');
router.patch('/tickets/:id/priority', updateTicketPriority);
console.log('Setting up status route');
router.patch('/tickets/:id/status', updateTicketStatus);
router.post('/tickets/:id/response', addTicketResponse);
router.post('/tickets/:id/solve', solveTicket);
router.patch('/tickets/:id/close', closeTicket);

// User Management
router.get('/users', getAllUsers);

export default router;