// ============================================
// USER REPORTS API SERVICE
// ============================================

const USER_REPORTS_API_BASE = 'http://localhost:5000/api';

/**
 * Get authentication token from localStorage
 */
function getAuthToken() {
    return localStorage.getItem('authToken');
}

/**
 * Fetch with auth headers
 */
async function authenticatedFetch(endpoint, options = {}) {
    const headers = {
        'Authorization': `Bearer ${getAuthToken()}`
    };

    // Only add Content-Type for non-GET requests
    const method = options.method || 'GET';
    if (method !== 'GET') {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${USER_REPORTS_API_BASE}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers }
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

// ============================================
// USER REPORTS ENDPOINTS
// ============================================

const userReportsAPI = {
    /**
     * Get user's ticket statistics
     */
    getMyStats: async () => {
        return authenticatedFetch('/tickets/reports/stats');
    },

    /**
     * Get user's ticket submission trends (last 7 days)
     */
    getSubmissionTrends: async () => {
        return authenticatedFetch('/tickets/reports/trends');
    },

    /**
     * Get user's ticket status breakdown
     */
    getStatusBreakdown: async () => {
        return authenticatedFetch('/tickets/reports/status');
    },

    /**
     * Get user's ticket categories
     */
    getCategoryBreakdown: async () => {
        return authenticatedFetch('/tickets/reports/categories');
    }
};

export default userReportsAPI;