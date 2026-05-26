// ============================================
// CHATBOT CONTROLLER
// Location: server/src/controllers/chatbotController.js
// Purpose: Handle HTTP requests for chatbot
// ============================================

import chatbotService from '../services/chatbotService.js';
import conversationService from '../services/conversationService.js';
import ticketCreationService from '../services/ticketCreationService.js';
import escalationService from '../services/escalationService.js';

class ChatbotController {
  /**
   * POST /api/chatbot/ask
   * User asks a question
   */
  async askQuestion(req, res) {
    try {
      const { message, sessionId, language = 'en' } = req.body;
      const userId = req.user?.id;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get or create session
      let session = sessionId
        ? await conversationService.getOrCreateSession(userId, language)
        : await conversationService.createSession(userId, language);

      // Save user message
      await chatbotService.saveMessage(session.id, 'user', message);

      // Generate response
      const response = await chatbotService.generateResponse(
        message,
        userId,
        session.id,
        language
      );

      // Save bot response
      await chatbotService.saveMessage(session.id, 'bot', response.response, {
        category: response.category,
        confidence: response.confidence,
        messageType: response.isTroubleshootingFlow ? 'system' : 'text',
      });

      // Check if should escalate
      const turnCount = await this.getSessionTurnCount(session.id);
      if (escalationService.shouldEscalate(
        { ...response, turnCount },
        'auto_check'
      )) {
        response.shouldEscalate = true;
      }

      res.json({
        success: true,
        sessionId: session.id,
        response: response.response,
        category: response.category,
        confidence: response.confidence,
        shouldEscalate: response.shouldEscalate || false,
        isTroubleshootingFlow: response.isTroubleshootingFlow || false,
      });
    } catch (error) {
      console.error('Error in askQuestion:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/chatbot/history/:sessionId
   * Get conversation history
   */
  async getConversationHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Verify ownership
      const session = await conversationService.getOrCreateSession(userId);
      const history = await chatbotService.getConversationHistory(session.id);

      res.json({
        success: true,
        sessionId: session.id,
        messages: history,
      });
    } catch (error) {
      console.error('Error in getConversationHistory:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/chatbot/escalate
   * Escalate to human support
   */
  async escalateToSupport(req, res) {
    try {
      const { sessionId, reason } = req.body;
      const userId = req.user?.id;

      if (!userId || !sessionId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await escalationService.escalateSession(sessionId, reason);

      res.json({
        success: true,
        message: result.message,
        assignedAgents: result.assignedAgents,
      });
    } catch (error) {
      console.error('Error in escalateToSupport:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/chatbot/create-ticket
   * Create support ticket from chat
   */
  async createTicket(req, res) {
    try {
      const { sessionId, summary, description, urgency, category } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get escalation data
      const escalationData = await ticketCreationService.getEscalationData(sessionId);

      // Create ticket
      const ticket = await ticketCreationService.createTicketFromChat(userId, {
        sessionId,
        summary: summary || escalationData.summary,
        description: description || escalationData.summary,
        category: category || escalationData.categories[0],
        urgency: urgency || 'medium',
      });

      res.json({
        success: true,
        ticketId: ticket.id,
        message: `Ticket #${ticket.id} created successfully`,
      });
    } catch (error) {
      console.error('Error in createTicket:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/chatbot/feedback
   * User rates response helpfulness
   */
  async submitFeedback(req, res) {
    try {
      const { messageId, rating, comment } = req.body;
      const userId = req.user?.id;

      if (!userId || !messageId || !rating) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // In a real system, save this feedback
      console.log(`Feedback from user ${userId}: rating=${rating}, comment=${comment}`);

      res.json({
        success: true,
        message: 'Thank you for your feedback!',
      });
    } catch (error) {
      console.error('Error in submitFeedback:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Helper: Count turns in a session
   */
  async getSessionTurnCount(sessionId) {
    const messages = await chatbotService.getConversationHistory(sessionId, 100);
    return Math.floor(messages.length / 2); // Every message pair is one turn
  }
}

export default new ChatbotController();