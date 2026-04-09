// ============================================
// FIXBUDDY REPORTS & ANALYTICS API SERVICE
// ============================================

const REPORTS_API_BASE = 'http://localhost:5000/api';

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

    const response = await fetch(`${REPORTS_API_BASE}${endpoint}`, {
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
     * Keeps client-side processing for compatibility
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
     * DEPRECATED: Use getMyStatsOptimized() for better performance
     * Kept for backwards compatibility
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
     * DEPRECATED: Use getMyStatusBreakdownOptimized() for better performance
     * Kept for backwards compatibility
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
     * DEPRECATED: Use getSubmissionTrendsOptimized() for better performance
     * Kept for backwards compatibility
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
    },

    // ============================================
    // OPTIMIZED SERVER-BASED METHODS
    // ============================================
    // These methods call new server endpoints for better performance
    // Use these in new code instead of the deprecated client-side methods

    /**
     * Get user's ticket categories breakdown (OPTIMIZED)
     * Calls server endpoint instead of processing client-side
     * Much faster and more efficient
     */
    getMyStatsOptimized: async () => {
        try {
            return authenticatedFetch('/tickets/reports/stats');
        } catch (error) {
            console.error('Error getting optimized user stats:', error);
            // Fallback to client-side processing
            return userReportsAPI.getMyStats();
        }
    },

    /**
     * Get user's ticket categories breakdown (OPTIMIZED)
     * Calls server endpoint instead of processing client-side
     * Much faster and more efficient for large datasets
     */
    getMyStatsOptimized: async () => {
        try {
            return authenticatedFetch('/tickets/reports/stats');
        } catch (error) {
            console.error('Error getting optimized user stats:', error);
            // Fallback to client-side processing
            return userReportsAPI.getMyStats();
        }
    },

    /**
     * Get user's ticket categories breakdown (OPTIMIZED)
     * Calls server endpoint instead of processing client-side
     * Much faster and more efficient for large datasets
     * 
     * @returns {Promise} Response with categories and counts
     * @example
     * const result = await userReportsAPI.getMyCategoriesOptimized();
     * // result.data = { categories: ['Bug', 'Feature'], counts: [5, 3] }
     */
    getMyCategoriesOptimized: async () => {
        try {
            return authenticatedFetch('/tickets/reports/categories');
        } catch (error) {
            console.error('Error getting optimized categories:', error);
            // Fallback to client-side processing
            return userReportsAPI.getMyCategories();
        }
    },

    /**
     * Get user's ticket status breakdown (OPTIMIZED)
     * Calls server endpoint instead of processing client-side
     * Much faster and more efficient for large datasets
     * 
     * @returns {Promise} Response with statuses and counts
     * @example
     * const result = await userReportsAPI.getMyStatusBreakdownOptimized();
     * // result.data = { statuses: ['Open', 'In Progress', 'Closed'], counts: [2, 3, 5] }
     */
    getMyStatusBreakdownOptimized: async () => {
        try {
            return authenticatedFetch('/tickets/reports/status');
        } catch (error) {
            console.error('Error getting optimized status breakdown:', error);
            // Fallback to client-side processing
            return userReportsAPI.getMyStatusBreakdown();
        }
    },

    /**
     * Get user's tickets submitted over time - Last 7 days (OPTIMIZED)
     * Calls server endpoint instead of processing client-side
     * Much faster and more efficient for large datasets
     * 
     * @returns {Promise} Response with dates and submission counts
     * @example
     * const result = await userReportsAPI.getSubmissionTrendsOptimized();
     * // result.data = { dates: ['2024-03-25', '2024-03-26'], counts: [2, 5] }
     */
    getSubmissionTrendsOptimized: async () => {
        try {
            return authenticatedFetch('/tickets/reports/trends');
        } catch (error) {
            console.error('Error getting optimized submission trends:', error);
            // Fallback to client-side processing
            return userReportsAPI.getSubmissionTrends();
        }
    }
};