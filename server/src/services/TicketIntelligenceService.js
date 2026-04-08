import {
  ClassificationEngine,
  DuplicateDetectionEngine,
  RoutingEngine,
  SLAEngine,
  SentimentEngine,
} from 'fixbuddy-intelligence';

export class TicketIntelligenceService {
  constructor() {
    this.classification = new ClassificationEngine();
    this.duplicateDetection = new DuplicateDetectionEngine();
    this.routing = new RoutingEngine();
    this.sla = new SLAEngine();
    this.sentiment = new SentimentEngine();
  }

  /**
   * Analyze a new ticket with all intelligence engines
   */
  analyzeNewTicket(ticketData) {
    const { title, description } = ticketData;
    
    return {
      classification: this.classification.classifyTicket(title, description),
      priority: this.classification.predictPriority(title, description),
      sentiment: this.sentiment.analyzeSentiment(`${title} ${description}`),
      timestamp: new Date(),
    };
  }

  /**
   * Find duplicate tickets
   */
  checkForDuplicates(ticketData, existingTickets) {
    const { title, description } = ticketData;
    return this.duplicateDetection.findDuplicates(
      title,
      description,
      existingTickets
    );
  }

  /**
   * Get routing recommendation based on handlers
   */
  async getRoutingRecommendation(ticketData, handlers) {
    return await this.routing.findBestHandler(ticketData, handlers);
  }

  /**
   * Estimate SLA based on similar historical tickets
   */
  estimateSLA(ticketData, historicalTickets) {
    return this.sla.estimateResolutionTime(ticketData, historicalTickets);
  }

  /**
   * Full intelligence analysis
   */
  async performFullAnalysis(ticketData, options = {}) {
    const {
      existingTickets = [],
      handlers = [],
      historicalTickets = [],
    } = options;

    const analysis = this.analyzeNewTicket(ticketData);
    const duplicates = this.checkForDuplicates(ticketData, existingTickets);
    
    let routing = null;
    let sla = null;

    if (handlers.length > 0) {
      routing = await this.getRoutingRecommendation(ticketData, handlers);
    }

    if (historicalTickets.length > 0) {
      sla = this.estimateSLA(ticketData, historicalTickets);
    }

    return {
      ...analysis,
      duplicates,
      routing,
      sla,
    };
  }
}

export default TicketIntelligenceService;