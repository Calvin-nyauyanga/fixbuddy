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
                const status = ticket.status || 'Open';
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
    },

    /**
     * Get resolution time trends (last 7 days)
     */
    getResolutionTrends: async () => {
        try {
            const response = await authenticatedFetch('/helpdesk/tickets');
            const tickets = response.data.tickets || [];
            
            const today = new Date();
            const last7Days = [];
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                last7Days.push(date.toISOString().split('T')[0]);
            }

            const dayData = {};
            last7Days.forEach(day => {
                dayData[day] = 0;
            });

            tickets.forEach(ticket => {
                const createdDate = new Date(ticket.createdAt || ticket.created_at);
                const dateStr = createdDate.toISOString().split('T')[0];
                if (dayData.hasOwnProperty(dateStr)) {
                    dayData[dateStr]++;
                }
            });

            return {
                success: true,
                data: {
                    dates: last7Days,
                    counts: last7Days.map(day => dayData[day])
                }
            };
        } catch (error) {
            console.error('Error getting resolution trends:', error);
            return { success: false, error: error.message };
        }
    }
};

// ============================================
// USER REPORTS ENDPOINTS
// ============================================

const userReportsAPI = {
    /**
     * Get user's own tickets
     */
    getMyTickets: async () => {
        return authenticatedFetch('/tickets/my-tickets');
    },

    /**
     * Get user ticket statistics
     */
    getMyStats: async () => {
        try {
            const response = await authenticatedFetch('/tickets/my-tickets');
            const tickets = response.data || [];
            
            const totalTickets = tickets.length;
            const resolved = tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length;
            const openTickets = tickets.filter(t => t.status === 'open').length;
            const inProgress = tickets.filter(t => t.status === 'in_progress').length;

            let avgResolutionTime = 0;
            let resolvedCount = 0;

            tickets.forEach(ticket => {
                if (ticket.status === 'closed' || ticket.status === 'resolved') {
                    const created = new Date(ticket.createdAt || ticket.created_at);
                    const closed = new Date(ticket.updatedAt || ticket.updated_at);
                    const timeInDays = (closed - created) / (1000 * 60 * 60 * 24);
                    avgResolutionTime += timeInDays;
                    resolvedCount++;
                }
            });

            if (resolvedCount > 0) {
                avgResolutionTime = (avgResolutionTime / resolvedCount).toFixed(1);
            }

            return {
                success: true,
                data: {
                    totalTickets,
                    resolved,
                    openTickets,
                    inProgress,
                    avgResolutionTime: `${avgResolutionTime} days`
                }
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get user's ticket categories breakdown
     */
    getMyCategories: async () => {
        try {
            const response = await authenticatedFetch('/tickets/my-tickets');
            const tickets = response.data || [];
            
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
            console.error('Error getting user categories:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get user's ticket status breakdown
     */
    getMyStatusBreakdown: async () => {
        try {
            const response = await authenticatedFetch('/tickets/my-tickets');
            const tickets = response.data || [];
            
            const statusMap = {};
            tickets.forEach(ticket => {
                const status = ticket.status || 'Open';
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
            console.error('Error getting user status breakdown:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get user's tickets submitted over time (last 7 days)
     */
    getSubmissionTrends: async () => {
        try {
            const response = await authenticatedFetch('/tickets/my-tickets');
            const tickets = response.data || [];
            
            const today = new Date();
            const last7Days = [];
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                last7Days.push(date.toISOString().split('T')[0]);
            }

            const dayData = {};
            last7Days.forEach(day => {
                dayData[day] = 0;
            });

            tickets.forEach(ticket => {
                const createdDate = new Date(ticket.createdAt || ticket.created_at);
                const dateStr = createdDate.toISOString().split('T')[0];
                if (dayData.hasOwnProperty(dateStr)) {
                    dayData[dateStr]++;
                }
            });

            return {
                success: true,
                data: {
                    dates: last7Days,
                    counts: last7Days.map(day => dayData[day])
                }
            };
        } catch (error) {
            console.error('Error getting submission trends:', error);
            return { success: false, error: error.message };
        }
    }
};