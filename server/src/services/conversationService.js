// ============================================
// CONVERSATION SERVICE
// Location: server/src/services/conversationService.js
// Purpose: Manage chat sessions and conversation history
// ============================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ConversationService {
  /**
   * Create a new chat session for a user
   */
  async createSession(userId, language = 'en') {
    try {
      const session = await prisma.chatSession.create({
        data: {
          userId,
          language,
          sessionStatus: 'active',
        },
      });

      return session;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  }

  /**
   * Get or create a chat session
   */
  async getOrCreateSession(userId, language = 'en') {
    try {
      // Check if there's an active session
      let session = await prisma.chatSession.findFirst({
        where: {
          userId,
          sessionStatus: 'active',
        },
        orderBy: { createdAt: 'desc' },
      });

      // If no active session, create one
      if (!session) {
        session = await this.createSession(userId, language);
      }

      return session;
    } catch (error) {
      console.error('Error getting/creating session:', error);
      throw error;
    }
  }

  /**
   * Close a chat session
   */
  async closeSession(sessionId, reason = 'user_closed') {
    try {
      const session = await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          sessionStatus: 'closed',
          closedAt: new Date(),
        },
      });

      return session;
    } catch (error) {
      console.error('Error closing session:', error);
      throw error;
    }
  }

  /**
   * Get conversation context (last N messages)
   */
  async getConversationContext(sessionId, contextSize = 10) {
    try {
      const messages = await prisma.chatMessage.findMany({
        where: { sessionId },
        take: -contextSize,
        orderBy: { createdAt: 'asc' },
      });

      // Format for LangChain
      const context = messages.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      return context;
    } catch (error) {
      console.error('Error getting conversation context:', error);
      throw error;
    }
  }

  /**
   * Get user's chat profile
   */
  async getUserChatProfile(userId) {
    try {
      let profile = await prisma.userChatProfile.findUnique({
        where: { userId },
      });

      // Create profile if it doesn't exist
      if (!profile) {
        profile = await prisma.userChatProfile.create({
          data: { userId },
        });
      }

      return profile;
    } catch (error) {
      console.error('Error getting user chat profile:', error);
      throw error;
    }
  }

  /**
   * Update user chat profile
   */
  async updateUserChatProfile(userId, updates) {
    try {
      const profile = await prisma.userChatProfile.update({
        where: { userId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      return profile;
    } catch (error) {
      console.error('Error updating user chat profile:', error);
      throw error;
    }
  }

  /**
   * Increment user interaction counters
   */
  async recordIssueResolution(userId, isResolved = true) {
    try {
      const profile = await this.getUserChatProfile(userId);

      if (isResolved) {
        await this.updateUserChatProfile(userId, {
          issuesResolved: profile.issuesResolved + 1,
          lastInteraction: new Date(),
        });
      } else {
        await this.updateUserChatProfile(userId, {
          issuesEscalated: profile.issuesEscalated + 1,
          lastInteraction: new Date(),
        });
      }
    } catch (error) {
      console.error('Error recording resolution:', error);
      throw error;
    }
  }

  /**
   * Get personalized greeting for returning user
   */
  async getPersonalizedGreeting(userId) {
    try {
      const profile = await this.getUserChatProfile(userId);
      const user = await prisma.user.findUnique({ where: { id: userId } });

      // Get last issue category
      const lastMessage = await prisma.chatMessage.findFirst({
        where: {
          session: { userId },
          category: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (lastMessage && user) {
        return `Welcome back, ${user.name}! 👋 I see you last asked about ${lastMessage.category} issues. How can I help you today?`;
      }

      return `Welcome back! How can I help you today?`;
    } catch (error) {
      console.error('Error generating greeting:', error);
      return 'Welcome! How can I help?';
    }
  }
}

export default new ConversationService();