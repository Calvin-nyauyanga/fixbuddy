// ============================================
// FIXBUDDY REPORTS & ANALYTICS API SERVICE
// ============================================

const API_BASE = 'http://localhost:5000/api';

/**
 * Get authentication token from localStorage
 */
function getAuthToken() {
    return localStorage.getItem('authToken');
}

/**
 * Get user role (admin or user)
 */
function getUserRole() {
    return localStorage.getItem('userRole');
}

/**
 * Fetch with auth headers
 */
async function authenticatedFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers }
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

// ============================================
// ADMIN REPORTS ENDPOINTS
// ============================================

const adminReportsAPI = {
    /**
     * Get comprehensive dashboard statistics
     */
    getDashboardStats: async () => {
        return authenticatedFetch('/helpdesk/stats');
    },

    /**
     * Get all tickets with filters
     */
    getAllTickets: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        return authenticatedFetch(`/helpdesk/tickets?${params}`);
    },

    /**
     * Get recent activities
     */
    getRecentActivities: async () => {
        return authenticatedFetch('/helpdesk/activities');
    },

    /**
     * Get notifications
     */
    getNotifications: async () => {
        return authenticatedFetch('/helpdesk/notifications');
    },

    /**
     * Get all users
     */
    getAllUsers: async () => {
        return authenticatedFetch('/helpdesk/users');
    },

    /**
     * Get ticket metrics and trends
     */
    getTicketMetrics: async () => {
        return authenticatedFetch('/helpdesk/stats');
    },

    /**
     * Get resolution trends (tickets created over time)
     */
    getResolutionTrends: async () => {
        try {
            const response = await authenticatedFetch('/helpdesk/tickets');
            const tickets = response.data.tickets || [];
            
            // Group by date
            const dateMap = {};
            tickets.forEach(ticket => {
                const date = new Date(ticket.createdAt).toLocaleDateString();
                dateMap[date] = (dateMap[date] || 0) + 1;
            });

            return {
                success: true,
                data: {
                    dates: Object.keys(dateMap),
                    counts: Object.values(dateMap)
                }
            };
        } catch (error) {
            console.error('Error getting resolution trends:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get category breakdown
     */
    getCategoryBreakdown: async () => {
        try {
            const response = await authenticatedFetch('/helpdesk/tickets');
            const tickets = response.data.tickets || [];
            
            const categoryMap = {};
            tickets.forEach(ticket => {
                const category = ticket.category || 'Uncategorized';
                categoryMap[category] = (categoryMap[category] || 0) + 1;
            });

            return {
                success: true,
                data: {
                    categories: Object.keys(categoryMap),
                    counts: Object.values(categoryMap)
                }
            };
        } catch (error) {
            console.error('Error getting category breakdown:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get priority distribution
     */
    getPriorityDistribution: async () => {
        try {
            const response = await authenticatedFetch('/helpdesk/tickets');
            const tickets = response.data.tickets || [];
            
            const priorityMap = {};
            tickets.forEach(ticket => {
                const priority = ticket.priority || 'Medium';
                priorityMap[priority] = (priorityMap[priority] || 0) + 1;
            });

            return {
                success: true,
                data: {
                    priorities: Object.keys(priorityMap),
                    counts: Object.values(priorityMap)
                }
            };
        } catch (error) {
            console.error('Error getting priority distribution:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get status distribution
     */
    getStatusDistribution: async () => {
        try {
            const response = await authenticatedFetch('/helpdesk/tickets');
            const tickets = response.data.tickets || [];
            
            const statusMap = {};
            tickets.forEach(ticket => {
                const status = ticket.status || 'open';
                statusMap[status] = (statusMap[status] || 0) + 1;
            });

            return {
                success: true,
                data: {
                    statuses: Object.keys(statusMap),
                    counts: Object.values(statusMap)
                }
            };
        } catch (error) {
            console.error('Error getting status distribution:', error);
            return { success: false, error: error.message };
        }
    }
};