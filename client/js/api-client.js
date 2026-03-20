/**
 * FixBuddy API Client
 * Centralized API communication for all frontend requests
 */

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Generic API request handler
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
 * @param {Object} body - Request body (optional)
 * @returns {Promise<Object>} - API response
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Include auth token in headers if available
  const token = localStorage.getItem('authToken');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    // Handle unauthorized - token expired
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '../Main Dashboard/UserLoginPage.html';
      return null;
    }

    // Handle server errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Auth API endpoints
 */
const authAPI = {
  signup: (name, email, password) =>
    apiRequest('/auth/signup', 'POST', { name, email, password }),

  login: (email, password) =>
    apiRequest('/auth/login', 'POST', { email, password }),

  getProfile: () =>
    apiRequest('/auth/profile', 'GET'),

  logout: () =>
    apiRequest('/auth/logout', 'POST'),
};

/**
 * Tickets API endpoints
 */
const ticketsAPI = {
  getAll: () =>
    apiRequest('/tickets', 'GET'),

  getMyTickets: () =>
    apiRequest('/tickets/my-tickets', 'GET'),

  getById: (id) =>
    apiRequest(`/tickets/${id}`, 'GET'),

  create: (data) =>
    apiRequest('/tickets', 'POST', data),

  update: (id, data) =>
    apiRequest(`/tickets/${id}`, 'PATCH', data),

  delete: (id) =>
    apiRequest(`/tickets/${id}`, 'DELETE'),

  assign: (id, agentId) =>
    apiRequest(`/tickets/${id}/assign`, 'PATCH', { assignedTo: agentId }),
};

// Export for use in HTML files
window.apiRequest = apiRequest;
window.authAPI = authAPI;
window.ticketsAPI = ticketsAPI;