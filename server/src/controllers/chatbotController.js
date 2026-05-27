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

  /**
   * GET /api/chatbot/analytics/dashboard
   * Get analytics dashboard data
   */
  async getAnalyticsDashboard(req, res) {
    try {
      const { period = '7days' } = req.query;

      // Calculate date range
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case '7days':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case '30days':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        case '90days':
          startDate = new Date(now.setDate(now.getDate() - 90));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }

      // Mock analytics data (in production, aggregate from database)
      const analytics = {
        totalSessions: Math.floor(Math.random() * 500) + 200,
        issuesResolved: Math.floor(Math.random() * 400) + 150,
        issuesEscalated: Math.floor(Math.random() * 100) + 20,
        satisfactionRate: Math.floor(Math.random() * 30) + 70,
        avgResponseTime: '2.3s',
        resolutionRate: Math.floor(Math.random() * 30) + 65,
        avgSessionDuration: '3.5m',
        unresolvedIssues: Math.floor(Math.random() * 50) + 10,
      };

      res.json({
        success: true,
        period,
        ...analytics,
      });
    } catch (error) {
      console.error('Error in getAnalyticsDashboard:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/chatbot/analytics/top-issues
   * Get top reported issues
   */
  async getTopIssues(req, res) {
    try {
      // Mock data for top issues
      const topIssues = [
        {
          category: 'Network',
          frequency: 156,
          resolutionRate: 78,
          avgResolutionTime: '4.2m',
          status: 'Good',
        },
        {
          category: 'Hardware',
          frequency: 134,
          resolutionRate: 65,
          avgResolutionTime: '6.1m',
          status: 'Needs Review',
        },
        {
          category: 'Software',
          frequency: 108,
          resolutionRate: 72,
          avgResolutionTime: '5.3m',
          status: 'Good',
        },
        {
          category: 'Account',
          frequency: 89,
          resolutionRate: 92,
          avgResolutionTime: '2.1m',
          status: 'Good',
        },
        {
          category: 'Security',
          frequency: 56,
          resolutionRate: 45,
          avgResolutionTime: '8.5m',
          status: 'Needs Review',
        },
      ];

      res.json({
        success: true,
        data: topIssues,
      });
    } catch (error) {
      console.error('Error in getTopIssues:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/chatbot/analytics/top-questions
   * Get most frequently asked questions
   */
  async getTopQuestions(req, res) {
    try {
      // Mock data for top questions
      const topQuestions = [
        {
          question: 'How do I reset my password?',
          askCount: 342,
          resolutionRate: 98,
          satisfaction: '⭐⭐⭐⭐⭐',
        },
        {
          question: 'Why is my computer slow?',
          askCount: 287,
          resolutionRate: 72,
          satisfaction: '⭐⭐⭐⭐',
        },
        {
          question: 'How do I connect to WiFi?',
          askCount: 256,
          resolutionRate: 85,
          satisfaction: '⭐⭐⭐⭐',
        },
        {
          question: 'My printer is not working',
          askCount: 198,
          resolutionRate: 68,
          satisfaction: '⭐⭐⭐',
        },
      ];

      res.json({
        success: true,
        data: topQuestions,
      });
    } catch (error) {
      console.error('Error in getTopQuestions:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/chatbot/analytics/unresolved-issues
   * Get unresolved issues requiring KB updates
   */
  async getUnresolvedIssues(req, res) {
    try {
      // Mock data for unresolved issues
      const unresolvedIssues = [
        {
          issue: 'Monitor not displaying correctly after update',
          escalationCount: 12,
          lastReported: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
        {
          issue: 'VPN connection drops intermittently',
          escalationCount: 9,
          lastReported: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          issue: 'Cannot install specific software',
          escalationCount: 7,
          lastReported: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        },
      ];

      res.json({
        success: true,
        data: unresolvedIssues,
      });
    } catch (error) {
      console.error('Error in getUnresolvedIssues:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ChatbotController();