import express from 'express';
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  assignTicket,
  getUserTickets,
} from '../controllers/ticketController.js';
import {
  getMyStats,
  getSubmissionTrends,
  getMyStatusBreakdown,
  getMyCategories,
} from '../controllers/userReportsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All ticket routes require authentication
router.use(authMiddleware);

// ==========================================
// TICKET CRUD OPERATIONS
// ==========================================
router.post('/', createTicket);              // Create ticket
router.get('/', getAllTickets);              // Get all tickets (with filters)
router.get('/my-tickets', getUserTickets);   // Get user's own tickets
router.get('/:id', getTicketById);           // Get single ticket
router.patch('/:id', updateTicket);          // Update ticket
router.delete('/:id', deleteTicket);         // Delete ticket
router.patch('/:id/assign', assignTicket);   // Assign ticket to agent

// ==========================================
// USER REPORTS ROUTES - /api/tickets/reports/...
// ==========================================
router.get('/reports/stats', getMyStats);           // GET /api/tickets/reports/stats
router.get('/reports/trends', getSubmissionTrends); // GET /api/tickets/reports/trends
router.get('/reports/status', getMyStatusBreakdown); // GET /api/tickets/reports/status
router.get('/reports/categories', getMyCategories);  // GET /api/tickets/reports/categories

export default router;