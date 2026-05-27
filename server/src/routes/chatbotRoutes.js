// ============================================
// CHATBOT ROUTES
// Location: server/src/routes/chatbotRoutes.js
// Purpose: Define chatbot API endpoints
// ============================================

import express from 'express';
import chatbotController from '../controllers/chatbotController.js';
import { verifyChatbotUser } from '../middleware/chatbotAuth.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';

const router = express.Router();

// Apply authentication middleware for all routes
router.use(verifyChatbotUser);

/**
 * POST /api/chatbot/ask
 * Send message to chatbot
 */
router.post('/ask', chatbotController.askQuestion.bind(chatbotController));

/**
 * GET /api/chatbot/history/:sessionId
 * Get conversation history
 */
router.get('/history/:sessionId', chatbotController.getConversationHistory.bind(chatbotController));

/**
 * POST /api/chatbot/escalate
 * Escalate to human support
 */
router.post('/escalate', chatbotController.escalateToSupport.bind(chatbotController));

/**
 * POST /api/chatbot/create-ticket
 * Create support ticket
 */
router.post('/create-ticket', chatbotController.createTicket.bind(chatbotController));

/**
 * POST /api/chatbot/feedback
 * Submit feedback on response
 */
router.post('/feedback', chatbotController.submitFeedback.bind(chatbotController));

// ============================================
// ANALYTICS ENDPOINTS (Admin only)
// ============================================

/**
 * GET /api/chatbot/analytics/dashboard
 * Get dashboard analytics data
 */
router.get('/analytics/dashboard', adminAuthMiddleware, chatbotController.getAnalyticsDashboard.bind(chatbotController));

/**
 * GET /api/chatbot/analytics/top-issues
 * Get top reported issues
 */
router.get('/analytics/top-issues', adminAuthMiddleware, chatbotController.getTopIssues.bind(chatbotController));

/**
 * GET /api/chatbot/analytics/top-questions
 * Get most frequently asked questions
 */
router.get('/analytics/top-questions', adminAuthMiddleware, chatbotController.getTopQuestions.bind(chatbotController));

/**
 * GET /api/chatbot/analytics/unresolved-issues
 * Get unresolved issues
 */
router.get('/analytics/unresolved-issues', adminAuthMiddleware, chatbotController.getUnresolvedIssues.bind(chatbotController));

export default router;