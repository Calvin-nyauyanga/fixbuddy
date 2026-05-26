// ============================================
// CHATBOT SERVICE
// Location: server/src/services/chatbotService.js
// Purpose: Core AI logic, question classification, response generation
// ============================================

import { PrismaClient } from '@prisma/client';
import CHATBOT_CONFIG from '../config/chatbot.config.js';
import KNOWLEDGE_BASE from '../utils/knowledgeBase.js';
import { ISSUE_CATEGORIES, SYSTEM_PROMPTS, TROUBLESHOOTING_STEPS } from '../utils/chatbotPrompts.js';
import { getTranslation, detectLanguage } from '../utils/languageSupport.js';

const prisma = new PrismaClient();

class ChatbotService {
  /**
   * Classify user message into a category
   * Returns: { category, confidence, keywords_matched }
   */
  classifyMessage(message) {
    const lowerMessage = message.toLowerCase();
    let bestMatch = { category: null, confidence: 0, keywords: [] };

    for (const [category, data] of Object.entries(ISSUE_CATEGORIES)) {
      const matchedKeywords = data.keywords.filter((keyword) =>
        lowerMessage.includes(keyword.toLowerCase())
      );

      const confidence = matchedKeywords.length > 0 ? Math.min(0.9, matchedKeywords.length * 0.3) : 0;

      if (confidence > bestMatch.confidence) {
        bestMatch = { category: category.toLowerCase(), confidence, keywords: matchedKeywords };
      }
    }

    // If no strong match, use AI to classify (optional - costs money)
    if (bestMatch.confidence < 0.5) {
      bestMatch.category = 'general';
      bestMatch.confidence = 0.3;
    }

    return bestMatch;
  }

  /**
   * Generate a response based on user message
   * This is where the main AI magic happens
   */
  async generateResponse(message, userId, sessionId, language = 'en') {
    try {
      // 1. Classify the message
      const classification = this.classifyMessage(message);

      // 2. Check if it's a tech-related question
      if (!this.isTechRelated(message)) {
        return {
          success: true,
          response: getTranslation('sorry', language),
          category: 'non_tech',
          confidence: 0.99,
          escalate: true,
          shouldCreateTicket: false,
        };
      }

      // 3. Check knowledge base for direct answer
      const directAnswer = await this.searchKnowledgeBase(message);
      if (directAnswer) {
        return {
          success: true,
          response: directAnswer.answer,
          category: classification.category,
          confidence: 0.95,
          escalate: false,
          shouldCreateTicket: false,
          source: 'knowledge_base',
        };
      }

      // 4. Check if there's a troubleshooting flow
      const troubleshootingSteps = this.getTroubleshootingSteps(classification.category);
      if (troubleshootingSteps) {
        const response = troubleshootingSteps.join('\n\n');
        return {
          success: true,
          response,
          category: classification.category,
          confidence: classification.confidence,
          escalate: false,
          shouldCreateTicket: false,
          isTroubleshootingFlow: true,
        };
      }

      // 5. Generate contextual response
      const contextualResponse = await this.generateContextualResponse(
        message,
        classification.category,
        language
      );

      return {
        success: true,
        response: contextualResponse,
        category: classification.category,
        confidence: classification.confidence,
        escalate: classification.confidence < CHATBOT_CONFIG.escalation.confidenceThreshold,
        shouldCreateTicket: false,
      };
    } catch (error) {
      console.error('Error generating response:', error);
      return {
        success: false,
        response: 'I encountered an error. Let me connect you with a support agent.',
        escalate: true,
        shouldCreateTicket: true,
      };
    }
  }

  /**
   * Check if message is tech-related
   */
  isTechRelated(message) {
    const prohibitedTopics = KNOWLEDGE_BASE.prohibitedTopics;
    const lowerMessage = message.toLowerCase();

    // Simple check - in production, use ML model
    for (const topic of prohibitedTopics) {
      if (lowerMessage.includes(topic)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Search knowledge base for direct answers
   */
  async searchKnowledgeBase(query) {
    const lowerQuery = query.toLowerCase();

    // Simple keyword matching
    for (const faq of KNOWLEDGE_BASE.faqs) {
      if (
        lowerQuery.includes(faq.question.toLowerCase()) ||
        faq.question.toLowerCase().includes(lowerQuery)
      ) {
        return faq;
      }
    }

    return null;
  }

  /**
   * Get troubleshooting steps for an issue
   */
  getTroubleshootingSteps(category) {
    // Map category to troubleshooting key
    const categoryMap = {
      hardware: 'computer_not_turning_on',
      network: 'wifi_not_connecting',
      software: 'computer_slow',
      account: 'password_reset',
    };

    const key = categoryMap[category];
    return key ? TROUBLESHOOTING_STEPS[key] : null;
  }

  /**
   * Generate contextual response using LangChain/OpenAI
   * (This is where you'd call the AI API)
   */
  async generateContextualResponse(message, category, language) {
    // For now, return a generic friendly response
    // In production, call OpenAI API here

    const responses = {
      hardware: `I understand you're having hardware issues. Let me help you troubleshoot. Can you describe exactly what's happening?`,
      software: `It sounds like a software issue. To help you better, could you tell me: What error message did you see?`,
      network: `Network issues can be frustrating! Let's troubleshoot together. First, are you able to see your WiFi network in your device settings?`,
      account: `Account issues are tricky. Let me help you regain access. Have you tried the "Forgot Password" option?`,
      general: `I'd like to help! Could you provide more details about the issue you're facing?`,
    };

    return responses[category] || responses.general;
  }

  /**
   * Determine if should escalate to human agent
   */
  shouldEscalate(message, classification, turnCount) {
    // Escalate if:
    // 1. Low confidence
    if (classification.confidence < CHATBOT_CONFIG.escalation.confidenceThreshold) {
      return true;
    }

    // 2. Too many turns
    if (turnCount > CHATBOT_CONFIG.escalation.maxTurnsBeforeEscalation) {
      return true;
    }

    // 3. User seems frustrated
    const frustrationKeywords = ['frustrated', 'angry', 'fed up', 'useless', 'broken', 'bad'];
    if (frustrationKeywords.some((word) => message.toLowerCase().includes(word))) {
      return true;
    }

    return false;
  }

  /**
   * Save conversation to database
   */
  async saveMessage(sessionId, sender, content, metadata = {}) {
    try {
      const message = await prisma.chatMessage.create({
        data: {
          sessionId,
          sender,
          messageType: metadata.messageType || 'text',
          content,
          category: metadata.category,
          sentiment: metadata.sentiment,
          confidence: metadata.confidence,
          resolvedIssue: metadata.resolvedIssue || false,
          ticketId: metadata.ticketId || null,
        },
      });

      return message;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId, limit = 20) {
    try {
      const messages = await prisma.chatMessage.findMany({
        where: { sessionId },
        take: -limit, // Get last N messages
        orderBy: { createdAt: 'asc' },
      });

      return messages;
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  }
}

export default new ChatbotService();