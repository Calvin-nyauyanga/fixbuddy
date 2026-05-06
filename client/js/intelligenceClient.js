// Intelligence API client
const API_BASE_URL = 'http://localhost:5000/api';

export const intelligenceAPI = {
  async analyzeTicket(title, description) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log(`🔗 Fetching: ${API_BASE_URL}/intelligence/analyze`);

      const response = await fetch(`${API_BASE_URL}/intelligence/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });

      console.log(`📡 Response Status: ${response.status}`);

      // Check if response is ok
      if (!response.ok) {
        console.error(`❌ Intelligence API Error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
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
      const response = await fetch(`${API_BASE_URL}/intelligence/duplicates`, {
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
      const response = await fetch(`${API_BASE_URL}/intelligence/full-analysis`, {
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