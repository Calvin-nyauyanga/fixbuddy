/**
 * Sentiment Analysis Engine for detecting urgency and emotion in tickets
 */
export class SentimentEngine {
  /**
   * Analyze sentiment and urgency from ticket text
   */
  analyzeSentiment(text) {
    const lowerText = text.toLowerCase();

    // Urgency detection
    const urgencyScore = this.calculateUrgency(lowerText);

    // Basic sentiment analysis
    const sentiment = this.detectSentiment(lowerText);

    // Escalation check
    const requiresEscalation = urgencyScore >= 60 ||
                              lowerText.includes('emergency') ||
                              lowerText.includes('critical') ||
                              lowerText.includes('urgent');

    return {
      urgency: urgencyScore,
      sentiment,
      sentimentScore: this.getSentimentScore(sentiment),
      requiresEscalation
    };
  }

  /**
   * Calculate urgency level from 0-100
   */
  calculateUrgency(text) {
    let score = 0;

    // High urgency keywords
    const highUrgencyWords = ['emergency', 'critical', 'urgent', 'asap', 'immediately', 'now', 'broken', 'down', 'cannot access', 'failed'];
    for (const word of highUrgencyWords) {
      if (text.includes(word)) score += 20;
    }

    // Medium urgency keywords
    const mediumUrgencyWords = ['issue', 'problem', 'not working', 'slow', 'error', 'help', 'support'];
    for (const word of mediumUrgencyWords) {
      if (text.includes(word)) score += 10;
    }

    // Time-sensitive words
    const timeWords = ['deadline', 'due', 'today', 'tomorrow', 'week', 'month'];
    for (const word of timeWords) {
      if (text.includes(word)) score += 5;
    }

    // Business impact words
    const impactWords = ['all users', 'everyone', 'company', 'business', 'revenue', 'customers'];
    for (const word of impactWords) {
      if (text.includes(word)) score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * Detect basic sentiment
   */
  detectSentiment(text) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'perfect', 'thanks', 'appreciate', 'happy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'angry', 'frustrated', 'annoyed', 'disappointed'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (text.includes(word)) positiveCount++;
    }

    for (const word of negativeWords) {
      if (text.includes(word)) negativeCount++;
    }

    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  /**
   * Convert sentiment to numerical score
   */
  getSentimentScore(sentiment) {
    switch (sentiment) {
      case 'positive': return 1;
      case 'negative': return -1;
      default: return 0;
    }
  }
}