import express from 'express';
import TicketIntelligenceService from '../services/TicketIntelligenceService.js';
import { authMiddleware } from '../middleware/auth.js'; // Adjust based on your auth

const router = express.Router();
const intelligenceService = new TicketIntelligenceService();

/**
 * POST /api/intelligence/analyze
 * Analyze a ticket without creating it
 */
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: 'title and description are required',
      });
    }

    const analysis = intelligenceService.analyzeNewTicket({
      title,
      description,
    });

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/intelligence/full-analysis
 * Complete intelligence analysis with duplicates, routing, and SLA
 */
router.post('/full-analysis', authMiddleware, async (req, res) => {
  try {
    const { title, description, existingTickets = [], handlers = [], historicalTickets = [] } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: 'title and description are required',
      });
    }

    const fullAnalysis = await intelligenceService.performFullAnalysis(
      { title, description },
      { existingTickets, handlers, historicalTickets }
    );

    res.json(fullAnalysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/intelligence/duplicates
 * Check for duplicate tickets
 */
router.post('/duplicates', authMiddleware, async (req, res) => {
  try {
    const { title, description, existingTickets = [] } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: 'title and description are required',
      });
    }

    const duplicates = intelligenceService.checkForDuplicates(
      { title, description },
      existingTickets
    );

    res.json(duplicates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/intelligence/routing
 * Get routing recommendations
 */
router.post('/routing', authMiddleware, async (req, res) => {
  try {
    const { ticketData, handlers } = req.body;

    if (!ticketData || !handlers) {
      return res.status(400).json({
        error: 'ticketData and handlers are required',
      });
    }

    const recommendation = await intelligenceService.getRoutingRecommendation(
      ticketData,
      handlers
    );

    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/intelligence/sla
 * Estimate SLA resolution time
 */
router.post('/sla', authMiddleware, async (req, res) => {
  try {
    const { ticketData, historicalTickets = [] } = req.body;

    if (!ticketData) {
      return res.status(400).json({ error: 'ticketData is required' });
    }

    const slaEstimate = intelligenceService.estimateSLA(
      ticketData,
      historicalTickets
    );

    res.json(slaEstimate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;