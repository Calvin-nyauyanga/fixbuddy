/**
 * Intelligent routing engine for ticket assignment
 * Suggests the best agent based on skills, workload, and ticket characteristics
 */
export class RoutingEngine {
  /**
   * Find the best handler for a ticket
   * @param {Object} ticketData - Ticket information
   * @param {Array} handlers - Available agents/handlers
   * @returns {Object} Best handler recommendation with scoring
   */
  async findBestHandler(ticketData, handlers) {
    if (!handlers || handlers.length === 0) {
      return { bestHandler: null, score: -1, allScores: [] };
    }

    const ticketCategory = ticketData.category || this.inferCategory(ticketData.title, ticketData.description);
    const ticketPriority = ticketData.priority || 'medium';

    // Calculate scores for all handlers
    const scoredHandlers = handlers.map(handler => {
      const score = this.calculateHandlerScore(handler, ticketCategory, ticketPriority);
      return {
        ...handler,
        score: score.total,
        breakdown: score.breakdown
      };
    });

    // Sort by score (highest first)
    scoredHandlers.sort((a, b) => (b.score || 0) - (a.score || 0));

    const bestHandler = scoredHandlers[0]?.score > 0 ? scoredHandlers[0] : null;

    return {
      bestHandler,
      score: bestHandler?.score || -1,
      allScores: scoredHandlers
    };
  }

  /**
   * Calculate comprehensive score for a handler
   */
  calculateHandlerScore(handler, ticketCategory, ticketPriority) {
    const breakdown = {
      categoryMatch: 0,
      workloadScore: 0,
      priorityMatch: 0,
      availability: 0
    };

    // Category/Skills matching (40% weight)
    if (handler.skills && Array.isArray(handler.skills)) {
      const hasMatchingSkill = handler.skills.some(skill =>
        skill.toLowerCase().includes(ticketCategory.toLowerCase()) ||
        ticketCategory.toLowerCase().includes(skill.toLowerCase())
      );
      breakdown.categoryMatch = hasMatchingSkill ? 100 : 30; // Base score even without exact match
    }

    // Workload scoring (30% weight) - Lower workload is better
    const workload = handler.workload || 0;
    if (workload === 0) breakdown.workloadScore = 100;
    else if (workload <= 2) breakdown.workloadScore = 80;
    else if (workload <= 4) breakdown.workloadScore = 60;
    else if (workload <= 6) breakdown.workloadScore = 40;
    else breakdown.workloadScore = 20;

    // Priority handling capability (20% weight)
    const priorityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const handlerPriorityLevel = priorityLevels[handler.maxPriority || 'medium'] || 2;
    const ticketPriorityLevel = priorityLevels[ticketPriority] || 2;

    if (handlerPriorityLevel >= ticketPriorityLevel) {
      breakdown.priorityMatch = 100;
    } else if (handlerPriorityLevel === ticketPriorityLevel - 1) {
      breakdown.priorityMatch = 70;
    } else {
      breakdown.priorityMatch = 30;
    }

    // Availability bonus (10% weight)
    breakdown.availability = handler.status === 'available' ? 100 :
                           handler.status === 'online' ? 80 : 50;

    // Calculate weighted total
    const total = Math.round(
      (breakdown.categoryMatch * 0.4) +
      (breakdown.workloadScore * 0.3) +
      (breakdown.priorityMatch * 0.2) +
      (breakdown.availability * 0.1)
    );

    return { total, breakdown };
  }

  /**
   * Infer category from title and description if not provided
   */
  inferCategory(title, description) {
    const text = `${title} ${description}`.toLowerCase();

    const categoryKeywords = {
      'Network': ['network', 'internet', 'connection', 'wifi', 'connectivity', 'dns', 'router', 'switch'],
      'Hardware': ['hardware', 'computer', 'laptop', 'desktop', 'monitor', 'keyboard', 'mouse', 'printer'],
      'Software': ['software', 'application', 'program', 'install', 'update', 'error', 'crash', 'bug'],
      'Security': ['security', 'password', 'login', 'access', 'permission', 'virus', 'malware', 'hack'],
      'Database': ['database', 'data', 'sql', 'query', 'server', 'backup', 'storage'],
      'Email': ['email', 'mail', 'outlook', 'smtp', 'imap', 'send', 'receive'],
      'Phone': ['phone', 'mobile', 'cell', 'voip', 'call', 'dial'],
      'Other': []
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }
}