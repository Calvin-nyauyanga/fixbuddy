// Intelligence API client
export const intelligenceAPI = {
  async analyzeTicket(title, description) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/intelligence/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });

      // Check if response is ok
      if (!response.ok) {
        console.error(`Intelligence API Error: ${response.status} ${response.statusText}`);
        // Return mock data for testing
        return {
          classification: { category: 'support', confidence: 85 },
          priority: { priority: 'medium' },
          sentiment: { emotion: 'neutral' }
        };
      }

      const data = await response.json();
      console.log('✅ Intelligence analysis successful:', data);
      return data;
    } catch (error) {
      console.error('❌ Intelligence analysis error:', error);
      // Return mock data on error
      return {
        classification: { category: 'support', confidence: 80 },
        priority: { priority: 'medium' },
        sentiment: { emotion: 'neutral' }
      };
    }
  },

  async checkDuplicates(title, description, existingTickets) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/intelligence/duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, existingTickets }),
      });

      if (!response.ok) {
        return { isDuplicate: false, matches: [] };
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return { isDuplicate: false, matches: [] };
    }
  },

  async getFullAnalysis(title, description, existingTickets, handlers, historicalTickets) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/intelligence/full-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          existingTickets,
          handlers,
          historicalTickets,
        }),
      });

      if (!response.ok) {
        return { analysis: 'pending' };
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting full analysis:', error);
      return { analysis: 'pending' };
    }
  },
};