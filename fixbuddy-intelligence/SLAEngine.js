/**
 * SLA Engine for estimating ticket resolution times
 * Analyzes historical data to predict resolution duration
 */
export class SLAEngine {
  /**
   * Estimate resolution time based on ticket data and historical tickets
   * @param {Object} ticketData - Current ticket information
   * @param {Array} historicalTickets - Past resolved tickets for reference
   * @returns {Object} SLA estimation with confidence
   */
  estimateResolutionTime(ticketData, historicalTickets = []) {
    const category = ticketData.category || 'Other';
    const priority = ticketData.priority || 'medium';

    // If we have historical data, use it for estimation
    if (historicalTickets && historicalTickets.length > 0) {
      return this.analyzeHistoricalData(ticketData, historicalTickets);
    }

    // Fallback to default SLA times
    return this.getDefaultSLA(category, priority);
  }

  /**
   * Analyze historical ticket data for accurate estimation
   */
  analyzeHistoricalData(ticketData, historicalTickets) {
    const category = ticketData.category || 'Other';
    const priority = ticketData.priority || 'medium';

    // Filter relevant historical tickets
    const relevantTickets = historicalTickets.filter(ticket =>
      ticket.category === category &&
      ticket.resolutionTime > 0 // Only resolved tickets
    );

    if (relevantTickets.length === 0) {
      return this.getDefaultSLA(category, priority);
    }

    // Group by priority for more accurate estimation
    const priorityGroups = this.groupByPriority(relevantTickets);

    // Get similar tickets by priority
    const similarTickets = priorityGroups[priority] || [];

    if (similarTickets.length === 0) {
      // Fall back to all tickets in category
      return this.calculateAverageTime(relevantTickets, category);
    }

    return this.calculateAverageTime(similarTickets, category, priority);
  }

  /**
   * Group historical tickets by priority
   */
  groupByPriority(tickets) {
    return tickets.reduce((groups, ticket) => {
      const priority = ticket.priority || 'medium';
      if (!groups[priority]) groups[priority] = [];
      groups[priority].push(ticket);
      return groups;
    }, {});
  }

  /**
   * Calculate average resolution time with statistical analysis
   */
  calculateAverageTime(tickets, category, priority = null) {
    if (tickets.length === 0) {
      return this.getDefaultSLA(category, priority || 'medium');
    }

    // Convert resolution times to minutes
    const timesInMinutes = tickets.map(ticket =>
      Math.max(1, Math.round(ticket.resolutionTime / (1000 * 60)))
    );

    // Calculate statistics
    const avg = this.calculateMean(timesInMinutes);
    const median = this.calculateMedian(timesInMinutes);
    const stdDev = this.calculateStandardDeviation(timesInMinutes, avg);

    // Use median for robustness (less affected by outliers)
    const estimatedMinutes = Math.round(median);

    // Calculate confidence based on sample size and variance
    const confidence = this.calculateConfidence(tickets.length, stdDev, avg);

    return {
      estimatedMinutes,
      confidence: Math.round(confidence),
      basedOn: priority ? `${category}_${priority}_historical` : `${category}_historical`,
      statistics: {
        sampleSize: tickets.length,
        average: Math.round(avg),
        median: Math.round(median),
        standardDeviation: Math.round(stdDev),
        range: {
          min: Math.min(...timesInMinutes),
          max: Math.max(...timesInMinutes)
        }
      }
    };
  }

  /**
   * Get default SLA times when no historical data is available
   */
  getDefaultSLA(category, priority) {
    const slaMatrix = {
      critical: {
        Network: 120,    // 2 hours
        Hardware: 240,   // 4 hours
        Security: 60,    // 1 hour
        default: 180     // 3 hours
      },
      high: {
        Network: 480,    // 8 hours
        Hardware: 720,   // 12 hours
        Security: 240,   // 4 hours
        default: 480     // 8 hours
      },
      medium: {
        Network: 1440,   // 24 hours
        Hardware: 2880,  // 48 hours
        Security: 720,   // 12 hours
        default: 1440    // 24 hours
      },
      low: {
        Network: 2880,   // 48 hours
        Hardware: 4320,  // 72 hours
        Security: 1440,  // 24 hours
        default: 2880    // 48 hours
      }
    };

    const prioritySLAs = slaMatrix[priority] || slaMatrix.medium;
    const estimatedMinutes = prioritySLAs[category] || prioritySLAs.default;

    return {
      estimatedMinutes,
      confidence: 20, // Low confidence for defaults
      basedOn: 'default_sla',
      statistics: {
        sampleSize: 0,
        note: 'Using default SLA times - no historical data available'
      }
    };
  }

  /**
   * Statistical helper functions
   */
  calculateMean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  calculateStandardDeviation(values, mean) {
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  calculateConfidence(sampleSize, stdDev, mean) {
    // Simplified confidence calculation based on sample size and coefficient of variation
    const cv = stdDev / mean; // Coefficient of variation
    let confidence = 50; // Base confidence

    // Increase confidence with larger sample sizes
    if (sampleSize >= 10) confidence += 20;
    else if (sampleSize >= 5) confidence += 10;
    else if (sampleSize >= 3) confidence += 5;

    // Decrease confidence with high variance
    if (cv > 0.5) confidence -= 20;
    else if (cv > 0.3) confidence -= 10;
    else if (cv > 0.2) confidence -= 5;

    return Math.max(10, Math.min(95, confidence));
  }
}