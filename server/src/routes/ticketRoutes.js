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
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All ticket routes require authentication
router.use(authMiddleware);

// Ticket CRUD operations
router.post('/', createTicket); // Create ticket
router.get('/', getAllTickets); // Get all tickets (with filters)
router.get('/my-tickets', getUserTickets); // Get user's own tickets
router.get('/:id', getTicketById); // Get single ticket
router.patch('/:id', updateTicket); // Update ticket
router.delete('/:id', deleteTicket); // Delete ticket
router.patch('/:id/assign', assignTicket); // Assign ticket to agent

export default router;