// Intelligence API client
export const intelligenceAPI = {
  async analyzeTicket(title, description) {
    const response = await fetch('/api/intelligence/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ title, description }),
    });
    return response.json();
  },

  async checkDuplicates(title, description, existingTickets) {
    const response = await fetch('/api/intelligence/duplicates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ title, description, existingTickets }),
    });
    return response.json();
  },

  async getFullAnalysis(title, description, existingTickets, handlers, historicalTickets) {
    const response = await fetch('/api/intelligence/full-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        title,
        description,
        existingTickets,
        handlers,
        historicalTickets,
      }),
    });
    return response.json();
  },
};