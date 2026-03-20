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
  signup: (name, email, password, confirmPassword) =>
    apiRequest('/auth/signup', 'POST', { name, email, password, confirmPassword }),

  login: (email, password) =>
    apiRequest('/auth/login', 'POST', { email, password }),

  getProfile: () =>
    apiRequest('/auth/profile', 'GET'),

  logout: () =>
    apiRequest('/auth/logout', 'POST'),

  adminLogin: (email, password) =>
        apiRequest('/auth/admin-login', 'POST', { email, password }),
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
/**
 * Admin Auth API endpoints
 */
const adminAPI = {
  login: (email, password, adminCode) =>
    apiRequest('/auth/admin-login', 'POST', { email, password, adminCode }),

  getProfile: () =>
    apiRequest('/auth/admin/profile', 'GET'),

  logout: () =>
    apiRequest('/auth/admin/logout', 'POST'),

  verifyAdminCode: (email, code) =>
    apiRequest('/auth/admin/verify-code', 'POST', { email, code }),
};

/**
 * Helpdesk/Tickets Management API (Admin functions)
 */
const helpdeskAPI = {
  // Get all tickets (admin view)
  getAllTickets: () =>
    apiRequest('/helpdesk/tickets', 'GET'),

  // Get ticket by ID with full details
  getTicketDetails: (id) =>
    apiRequest(`/helpdesk/tickets/${id}`, 'GET'),

  // Assign ticket to agent
  assignTicket: (ticketId, agentId) =>
    apiRequest(`/helpdesk/tickets/${ticketId}/assign`, 'PATCH', { assignedTo: agentId }),

  // Update ticket status
  updateTicketStatus: (ticketId, status) =>
    apiRequest(`/helpdesk/tickets/${ticketId}/status`, 'PATCH', { status }),

  // Add response to ticket
  addResponse: (ticketId, response, responseType = 'admin') =>
    apiRequest(`/helpdesk/tickets/${ticketId}/response`, 'POST', { response, responseType }),

  // Mark ticket as solved
  solveTicket: (ticketId, solution) =>
    apiRequest(`/helpdesk/tickets/${ticketId}/solve`, 'POST', { solution }),

  // Close ticket
  closeTicket: (ticketId) =>
    apiRequest(`/helpdesk/tickets/${ticketId}/close`, 'PATCH'),

  // Get all users (admin view)
  getAllUsers: () =>
    apiRequest('/helpdesk/users', 'GET'),

  // Get user details
  getUserDetails: (userId) =>
    apiRequest(`/helpdesk/users/${userId}`, 'GET'),

  // Get recent activities
  getRecentActivities: () =>
    apiRequest('/helpdesk/activities', 'GET'),

  // Get dashboard statistics
  getDashboardStats: () =>
    apiRequest('/helpdesk/stats', 'GET'),

  // Get notifications
  getNotifications: () =>
    apiRequest('/helpdesk/notifications', 'GET'),

  // Mark notifications as read
  markNotificationsRead: (notificationIds) =>
    apiRequest('/helpdesk/notifications/read', 'PATCH', { notificationIds }),
};

// Export for use in HTML files
window.apiRequest = apiRequest;
window.authAPI = authAPI;
window.adminAPI = adminAPI;
window.ticketsAPI = ticketsAPI;
window.helpdeskAPI = helpdeskAPI;

// Export for use in HTML files
window.apiRequest = apiRequest;
window.authAPI = authAPI;
window.ticketsAPI = ticketsAPI;