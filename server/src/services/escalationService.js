// ============================================
// ESCALATION SERVICE
// Location: server/src/services/escalationService.js
// Purpose: Manage escalation to human support agents
// ============================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class EscalationService {
  /**
   * Escalate chat session to human agent
   */
  async escalateSession(sessionId, reason = 'user_requested') {
    try {
      // Update session status
      const session = await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          sessionStatus: 'escalated',
        },
      });

      // Get available agents
      const agents = await this.findAvailableAgents();

      if (agents.length > 0) {
        // In production, integrate with real assignment logic
        console.log(`Escalated session to agents: ${agents.map((a) => a.name).join(', ')}`);
      }

      return {
        success: true,
        session,
        assignedAgents: agents,
        message: 'Connecting you with a support agent...',
      };
    } catch (error) {
      console.error('Error escalating session:', error);
      throw error;
    }
  }

  /**
   * Find available support agents
   */
  async findAvailableAgents() {
    try {
      const agents = await prisma.user.findMany({
        where: {
          role: { in: ['agent', 'admin'] },
          status: 'active',
          teamStatus: { in: ['available', 'online'] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          teamStatus: true,
        },
      });

      return agents;
    } catch (error) {
      console.error('Error finding agents:', error);
      return [];
    }
  }

  /**
   * Check if escalation is needed
   */
  shouldEscalate(messageAnalysis) {
    const { confidence, turnCount, userFrustration, isNonTech } = messageAnalysis;

    // Escalate if:
    if (isNonTech) return true;
    if (confidence < 0.5) return true;
    if (turnCount > 5) return true;
    if (userFrustration > 0.8) return true;

    return false;
  }
}

export default new EscalationService();