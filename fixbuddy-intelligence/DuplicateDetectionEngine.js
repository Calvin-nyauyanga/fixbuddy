/**
 * Duplicate Detection Engine for identifying similar tickets
 */
export class DuplicateDetectionEngine {
  /**
   * Find duplicate or similar tickets
   */
  findDuplicates(title, description, existingTickets) {
    if (!existingTickets || existingTickets.length === 0) {
      return [];
    }

    const newTicketText = `${title} ${description}`.toLowerCase();

    const duplicates = existingTickets.map(ticket => {
      const existingText = `${ticket.title} ${ticket.description || ''}`.toLowerCase();
      const similarity = this.calculateSimilarity(newTicketText, existingText);

      return {
        id: ticket.id,
        title: ticket.title,
        similarity: Math.round(similarity * 100) / 100 // Round to 2 decimal places
      };
    }).filter(duplicate => duplicate.similarity >= 0.3) // Only return significant matches
      .sort((a, b) => b.similarity - a.similarity) // Sort by similarity descending
      .slice(0, 5); // Return top 5 matches

    return duplicates;
  }

  /**
   * Calculate text similarity using Jaccard similarity
   */
  calculateSimilarity(text1, text2) {
    // Simple word-based similarity
    const words1 = new Set(text1.split(/\s+/).filter(word => word.length > 2));
    const words2 = new Set(text2.split(/\s+/).filter(word => word.length > 2));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;

    return intersection.size / union.size;
  }
}