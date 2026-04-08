/**
 * Classification Engine for ticket categorization and priority prediction
 */
export class ClassificationEngine {
  /**
   * Classify a ticket based on title and description
   */
  classifyTicket(title, description) {
    const text = `${title} ${description}`.toLowerCase();

    // Simple keyword-based classification
    const categories = {
      'Network': ['network', 'internet', 'connection', 'wifi', 'connectivity', 'dns', 'router'],
      'Hardware': ['hardware', 'computer', 'laptop', 'desktop', 'monitor', 'keyboard', 'mouse', 'printer'],
      'Software': ['software', 'application', 'program', 'install', 'update', 'error', 'crash', 'bug'],
      'Security': ['security', 'password', 'login', 'access', 'permission', 'virus', 'malware'],
      'Database': ['database', 'data', 'sql', 'query', 'server', 'backup'],
      'Email': ['email', 'mail', 'outlook', 'smtp', 'imap'],
      'Phone': ['phone', 'mobile', 'cell', 'voip', 'call']
    };

    let bestCategory = 'Other';
    let maxMatches = 0;
    let alternativeCategories = [];

    for (const [category, keywords] of Object.entries(categories)) {
      const matches = keywords.filter(keyword => text.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = category;
      }
      if (matches > 0) {
        alternativeCategories.push({ category, score: matches });
      }
    }

    // Sort alternatives by score
    alternativeCategories.sort((a, b) => b.score - a.score);
    alternativeCategories = alternativeCategories.slice(0, 3);

    const confidence = maxMatches > 0 ? Math.min(100, maxMatches * 20 + 20) : 10;

    return {
      category: bestCategory,
      confidence,
      alternativeCategories
    };
  }

  /**
   * Predict priority based on content analysis
   */
  predictPriority(title, description) {
    const text = `${title} ${description}`.toLowerCase();

    // Priority keywords with weights
    const priorityKeywords = {
      critical: [
        { word: 'down', weight: 10 },
        { word: 'emergency', weight: 10 },
        { word: 'urgent', weight: 8 },
        { word: 'critical', weight: 10 },
        { word: 'broken', weight: 8 },
        { word: 'cannot', weight: 6 },
        { word: 'failed', weight: 7 },
        { word: 'error', weight: 5 }
      ],
      high: [
        { word: 'slow', weight: 6 },
        { word: 'issue', weight: 4 },
        { word: 'problem', weight: 4 },
        { word: 'not working', weight: 6 },
        { word: 'help', weight: 3 }
      ],
      medium: [
        { word: 'question', weight: 2 },
        { word: 'how to', weight: 2 },
        { word: 'feature', weight: 2 }
      ]
    };

    let criticalScore = 0;
    let highScore = 0;
    let mediumScore = 0;
    const triggers = [];

    // Calculate scores
    for (const [priority, keywords] of Object.entries(priorityKeywords)) {
      for (const { word, weight } of keywords) {
        if (text.includes(word)) {
          if (priority === 'critical') criticalScore += weight;
          else if (priority === 'high') highScore += weight;
          else if (priority === 'medium') mediumScore += weight;

          triggers.push({ priority, keyword: word });
        }
      }
    }

    // Determine priority
    let priority = 'low';
    let confidence = 50;
    let score = 100; // Base score

    if (criticalScore >= 15) {
      priority = 'critical';
      confidence = Math.min(100, 70 + criticalScore);
      score = 300 + criticalScore;
    } else if (criticalScore >= 8 || highScore >= 10) {
      priority = 'high';
      confidence = Math.min(100, 60 + Math.max(criticalScore, highScore));
      score = 200 + Math.max(criticalScore, highScore);
    } else if (highScore >= 5 || mediumScore >= 3) {
      priority = 'medium';
      confidence = Math.min(100, 50 + Math.max(highScore, mediumScore));
      score = 150 + Math.max(highScore, mediumScore);
    }

    return {
      priority,
      score,
      confidence: Math.round(confidence),
      triggers: triggers.slice(0, 5) // Limit to top triggers
    };
  }
}