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
        'Authorization': `Bearer ${getAuthToken()}`
    };

    const method = options.method || 'GET';
    if (method !== 'GET') {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${REPORTS_API_BASE}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return response.json();
}

// ============================================
// ADMIN REPORTS ENDPOINTS (CORRECTED)
// ============================================

const adminReportsAPI = {
    /**
     * Get comprehensive dashboard statistics
     */
    getDashboardStats: async () => {
        console.log('📊 Fetching dashboard stats...');
        try {
            const response = await authenticatedFetch('/helpdesk/stats');
            console.log('✅ Dashboard stats:', response);
            return response;
        } catch (error) {
            console.error('❌ Error fetching dashboard stats:', error);
            return { success: false, data: null, error: error.message };
        }
    },

    /**
     * Get resolution trends with date filtering
     */
    getResolutionTrends: async (dateRange = '30days') => {
        console.log('📈 Fetching resolution trends for:', dateRange);
        try {
            const response = await authenticatedFetch('/helpdesk/tickets');
            const tickets = response.data?.tickets || response.data || [];
            
            // Calculate date range
            const now = new Date();
            let startDate = new Date();
            
            if (dateRange === '7days') startDate.setDate(now.getDate() - 7);
            else if (dateRange === '30days') startDate.setDate(now.getDate() - 30);
            else if (dateRange === '90days') startDate.setDate(now.getDate() - 90);
            else startDate = new Date('2000-01-01'); // All time
            
            // Filter and group by date
            const dateMap = {};
            tickets.forEach(ticket => {
                const ticketDate = new Date(ticket.createdAt);
                if (ticketDate >= startDate) {
                    const date = ticketDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    dateMap[date] = (dateMap[date] || 0) + 1;
                }
            });

            // Sort dates chronologically
            const sortedDates = Object.keys(dateMap).sort((a, b) => {
                return new Date(a) - new Date(b);
            });

            console.log('✅ Trends data:', { dates: sortedDates, counts: sortedDates.map(d => dateMap[d]) });
            
            return {
                success: true,
                data: {
                    dates: sortedDates,
                    counts: sortedDates.map(d => dateMap[d])
                }
            };
        } catch (error) {
            console.error('❌ Error getting resolution trends:', error);
            return { success: false, data: null, error: error.message };
        }
    },

    /**
     * Get category breakdown
     */
    getCategoryBreakdown: async () => {
        console.log('📂 Fetching category breakdown...');
        try {
            const response = await authenticatedFetch('/helpdesk/tickets');
            const tickets = response.data?.tickets || response.data || [];
            
            const categoryMap = {};
            tickets.forEach(ticket => {
                const category = ticket.category || 'Uncategorized';
                categoryMap[category] = (categoryMap[category] || 0) + 1;
            });

            console.log('✅ Category data:', categoryMap);
            
            return {
                success: true,
                data: {
                    categories: Object.keys(categoryMap),
                    counts: Object.values(categoryMap)
                }
            };
        } catch (error) {
            console.error('❌ Error getting category breakdown:', error);
            return { success: false, data: null, error: error.message };
        }
    },

    /**
     * Get priority distribution
     */
    getPriorityDistribution: async () => {
        console.log('🔴 Fetching priority distribution...');
        try {
            const response = await authenticatedFetch('/helpdesk/tickets');
            const tickets = response.data?.tickets || response.data || [];
            
            const priorityMap = {};
            tickets.forEach(ticket => {
                const priority = ticket.priority || 'medium';
                priorityMap[priority] = (priorityMap[priority] || 0) + 1;
            });

            console.log('✅ Priority data:', priorityMap);
            
            return {
                success: true,
                data: {
                    priorities: Object.keys(priorityMap),
                    counts: Object.values(priorityMap)
                }
            };
        } catch (error) {
            console.error('❌ Error getting priority distribution:', error);
            return { success: false, data: null, error: error.message };
        }
    },

    /**
     * Get status distribution
     */
    getStatusDistribution: async () => {
        console.log('🎯 Fetching status distribution...');
        try {
            const response = await authenticatedFetch('/helpdesk/tickets');
            const tickets = response.data?.tickets || response.data || [];
            
            const statusMap = {};
            tickets.forEach(ticket => {
                const status = ticket.status || 'open';
                statusMap[status] = (statusMap[status] || 0) + 1;
            });

            console.log('✅ Status data:', statusMap);
            
            return {
                success: true,
                data: {
                    statuses: Object.keys(statusMap),
                    counts: Object.values(statusMap)
                }
            };
        } catch (error) {
            console.error('❌ Error getting status distribution:', error);
            return { success: false, data: null, error: error.message };
        }
    },

    /**
     * Get all tickets
     */
    getAllTickets: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        return authenticatedFetch(`/helpdesk/tickets?${params}`);
    }
};