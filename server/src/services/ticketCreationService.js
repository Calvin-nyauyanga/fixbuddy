// ============================================
// TICKET CREATION SERVICE
// Location: server/src/services/ticketCreationService.js
// Purpose: Automatically create tickets for escalated issues
// ============================================

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

class TicketCreationService {
  /**
   * Create a ticket from chatbot conversation
   */
  async createTicketFromChat(userId, chatData) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error('User not found');
      }

      // Create ticket
      const ticket = await prisma.ticket.create({
        data: {
          title: chatData.summary || 'Support Request',
          description: chatData.description,
          category: chatData.category || 'General',
          priority: chatData.urgency || 'medium',
          status: 'open',
          createdById: userId,
          intelligenceData: {
            source: 'chatbot',
            chatSessionId: chatData.sessionId,
            userMessage: chatData.originalMessage,
            aiResponse: chatData.aiResponse,
            confidence: chatData.confidence,
          },
        },
      });

      // Link chat messages to ticket
      if (chatData.sessionId) {
        await prisma.chatMessage.updateMany({
          where: { sessionId: chatData.sessionId },
          data: { ticketId: ticket.id },
        });
      }

      return ticket;
    } catch (error) {
      console.error('Error creating ticket from chat:', error);
      throw error;
    }
  }

  /**
   * Get escalation recommendations
   */
  async getEscalationData(sessionId) {
    try {
      // Get all messages from session
      const messages = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
      });

      // Analyze messages
      const summary = this.summarizeConversation(messages);

      return {
        messageCount: messages.length,
        categories: [...new Set(messages.map((m) => m.category).filter(Boolean))],
        summary,
        lastMessage: messages[messages.length - 1],
      };
    } catch (error) {
      console.error('Error getting escalation data:', error);
      throw error;
    }
  }

  /**
   * Create a smart summary of conversation
   */
  summarizeConversation(messages) {
    const userMessages = messages.filter((m) => m.sender === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (!lastUserMessage) {
      return 'No conversation summary available';
    }

    // Simple summary - in production, use AI
    return lastUserMessage.content.substring(0, 200);
  }
}

export default new TicketCreationService();