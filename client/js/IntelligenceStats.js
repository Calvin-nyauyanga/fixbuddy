/**
 * Intelligence Analytics Dashboard
 * Displays AI/ML insights and predictions
 */

let categoriesChart = null;
let sentimentChart = null;
let intelligenceData = {
    categories: {},
    sentiment: {},
    accuracy: {},
    routing: [],
    totalTickets: 0,
    predictedCorrectly: 0
};

// API Endpoints
const API_BASE_URL = 'http://localhost:5000/api';

const INTELLIGENCE_API = {
    async getAnalytics(dateRange = '30', category = '') {
        try {
            const params = new URLSearchParams({
                days: dateRange,
                category: category
            });
            const response = await fetch(`${API_BASE_URL}/intelligence/analytics?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                credentials: 'include'
            });
            // Handle both 200 and 304 (Not Modified) as success
            if (response.status === 304) {
                console.log('Analytics: 304 Not Modified (cached response)');
                return null; // Return null to indicate use cached data
            }
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error('Analytics fetch error:', error);
            return null;
        }
    },

    async getAccuracyMetrics(dateRange = '30') {
        try {
            const response = await fetch(`${API_BASE_URL}/intelligence/accuracy-metrics?days=${dateRange}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                credentials: 'include'
            });
            if (response.status === 304) {
                console.log('Accuracy Metrics: 304 Not Modified (cached response)');
                return null;
            }
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error('Accuracy metrics fetch error:', error);
            return null;
        }
    },

    async getRoutingMetrics(dateRange = '30') {
        try {
            const response = await fetch(`${API_BASE_URL}/intelligence/routing-metrics?days=${dateRange}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                }
            });
            if (!response.ok) throw new Error('Failed to fetch routing metrics');
            return await response.json();
        } catch (error) {
            console.error('Routing metrics fetch error:', error);
            return null;
        }
    },

    async getSentimentAnalysis(dateRange = '30') {
        try {
            const response = await fetch(`${API_BASE_URL}/intelligence/sentiment-analysis?days=${dateRange}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                }
            });
            if (!response.ok) throw new Error('Failed to fetch sentiment analysis');
            return await response.json();
        } catch (error) {
            console.error('Sentiment analysis fetch error:', error);
            return null;
        }
    },

    async getInsights(dateRange = '30') {
        try {
            const response = await fetch(`${API_BASE_URL}/intelligence/insights?days=${dateRange}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                }
            });
            if (!response.ok) throw new Error('Failed to fetch insights');
            return await response.json();
        } catch (error) {
            console.error('Insights fetch error:', error);
            return null;
        }
    }
};

// ==================== CHART RENDERING ====================

function renderCategoriesChart(data) {
    const ctx = document.getElementById('categoriesChart');
    if (!ctx) {
        console.error('Categories chart canvas not found');
        return;
    }
    
    if (categoriesChart) {
        categoriesChart.destroy();
    }

    const categories = Object.keys(data || {});
    const counts = Object.values(data || {}).map(v => parseInt(v) || 0);
    
    if (categories.length === 0 || counts.length === 0) {
        ctx.parentElement.innerHTML = '<p class="no-data">No category data available</p>';
        return;
    }

    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe',
        '#43e97b', '#fa709a', '#fee140', '#30b0fe', '#a8edea'
    ];

    try {
        categoriesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Number of Tickets',
                    data: counts,
                    backgroundColor: colors.slice(0, categories.length),
                    borderRadius: 8,
                    borderSkipped: false,
                    hoverBackgroundColor: colors.slice(0, categories.length).map(c => c + 'dd')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error rendering categories chart:', error);
        ctx.parentElement.innerHTML = '<p class="no-data">Error rendering chart</p>';
    }
}

function renderSentimentChart(data) {
    const ctx = document.getElementById('sentimentChart');
    if (!ctx) {
        console.error('Sentiment chart canvas not found');
        return;
    }
    
    if (sentimentChart) {
        sentimentChart.destroy();
    }

    // Handle both object and array data formats
    let categories = [];
    let scores = [];
    
    if (Array.isArray(data)) {
        // If data is an array of objects with sentiment breakdown
        categories = data.map(item => item.category || '');
        scores = data.map(item => {
            // Calculate sentiment score from positive/negative/neutral percentages
            const positive = (item.positive_percentage || 0) / 100;
            const negative = (item.negative_percentage || 0) / 100;
            return positive - negative; // Range: -1 to 1
        });
    } else if (typeof data === 'object') {
        // If data is an object with category keys and score values
        categories = Object.keys(data || {});
        scores = Object.values(data || {}).map(d => parseFloat(d) || 0);
    }

    // Validate that we have data to display
    if (categories.length === 0 || scores.length === 0) {
        console.warn('No valid sentiment data for chart rendering');
        ctx.parentElement.innerHTML = '<p class="no-data">No sentiment data available</p>';
        return;
    }

    try {
        sentimentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Average Sentiment Score',
                    data: scores,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    pointRadius: 6,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        min: -1,
                        max: 1,
                        ticks: {
                            stepSize: 0.5
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error rendering sentiment chart:', error);
        ctx.parentElement.innerHTML = '<p class="no-data">Error rendering chart</p>';
    }
}

// ==================== TABLE RENDERING ====================

function renderAccuracyTable(data) {
    const tbody = document.getElementById('accuracyTableBody');
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No accuracy data available</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(item => {
        // Calculate accuracy rate if not provided
        const accuracyRate = item.accuracy_rate !== undefined ? item.accuracy_rate :
            (item.total_classified > 0 ? (item.correct_classifications / item.total_classified) * 100 : 0);
        
        // Ensure values are numbers
        const totalClassified = item.total_classified || 0;
        const correctClassifications = item.correct_classifications || 0;
        const avgConfidence = item.avg_confidence || 0;
        const trend = item.trend || 0;
        
        return `
        <tr>
            <td><span class="category-badge category-${item.category.toLowerCase()}">${item.category}</span></td>
            <td>${totalClassified}</td>
            <td>${correctClassifications}</td>
            <td>
                <strong style="color: ${accuracyRate >= 80 ? '#4caf50' : accuracyRate >= 60 ? '#ff9800' : '#f44336'};">
                    ${accuracyRate.toFixed(1)}%
                </strong>
            </td>
            <td>${avgConfidence.toFixed(1)}%</td>
            <td>
                <span class="metric-change ${trend >= 0 ? 'positive' : 'negative'}">
                    <i class="fa-solid fa-arrow-${trend >= 0 ? 'up' : 'down'}"></i>
                    ${Math.abs(trend).toFixed(1)}%
                </span>
            </td>
        </tr>
    `}).join('');
}

function renderSentimentTable(data) {
    const tbody = document.getElementById('sentimentTableBody');
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No sentiment data available</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(item => {
        // Safely extract and default all values
        const category = item.category || 'Unknown';
        const positiveCount = item.positive_count || 0;
        const positivePercentage = item.positive_percentage || 0;
        const neutralCount = item.neutral_count || 0;
        const neutralPercentage = item.neutral_percentage || 0;
        const negativeCount = item.negative_count || 0;
        const negativePercentage = item.negative_percentage || 0;
        const avgSentimentScore = item.avg_sentiment_score || 0;
        
        return `
        <tr>
            <td><span class="category-badge category-${category.toLowerCase()}">${category}</span></td>
            <td>
                <span class="sentiment-indicator sentiment-positive">
                    <i class="fa-solid fa-smile"></i>
                    ${positiveCount} (${positivePercentage.toFixed(1)}%)
                </span>
            </td>
            <td>
                <span class="sentiment-indicator sentiment-neutral">
                    <i class="fa-solid fa-circle"></i>
                    ${neutralCount} (${neutralPercentage.toFixed(1)}%)
                </span>
            </td>
            <td>
                <span class="sentiment-indicator sentiment-negative">
                    <i class="fa-solid fa-frown"></i>
                    ${negativeCount} (${negativePercentage.toFixed(1)}%)
                </span>
            </td>
            <td>
                <strong>${avgSentimentScore.toFixed(2)}</strong>
            </td>
        </tr>
    `}).join('');
}

function renderRoutingMetrics(data) {
    const list = document.getElementById('routingEffectivenessList');
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        list.innerHTML = '<li class="no-data">No routing data available</li>';
        return;
    }

    list.innerHTML = data.map(agent => {
        // Ensure all values have safe defaults
        const agentName = agent.agent_name || 'Unknown Agent';
        const specialization = agent.specialization || 'General Support';
        const totalAssigned = agent.total_assigned || 0;
        const totalResolved = agent.total_resolved || 0;
        const routingAccuracy = agent.routing_accuracy || 0;
        const avgResolutionTime = agent.avg_resolution_time || 0;
        
        return `
        <li class="routing-item">
            <div>
                <div class="routing-agent-name">${agentName}</div>
                <small style="color: #999;">${specialization}</small>
            </div>
            <div class="routing-metrics">
                <div class="routing-metric">
                    <div class="routing-metric-label">Assigned</div>
                    <div class="routing-metric-value">${totalAssigned}</div>
                </div>
                <div class="routing-metric">
                    <div class="routing-metric-label">Resolved</div>
                    <div class="routing-metric-value">${totalResolved}</div>
                </div>
                <div class="routing-metric">
                    <div class="routing-metric-label">Accuracy</div>
                    <div class="routing-metric-value" style="color: ${routingAccuracy >= 80 ? '#4caf50' : '#ff9800'};">
                        ${routingAccuracy.toFixed(1)}%
                    </div>
                </div>
                <div class="routing-metric">
                    <div class="routing-metric-label">Avg Resolution</div>
                    <div class="routing-metric-value">${avgResolutionTime.toFixed(1)}h</div>
                </div>
            </div>
        </li>
    `}).join('');
}

function renderInsights(data) {
    const container = document.getElementById('insightsContainer');
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        container.innerHTML = '<div class="alert alert-info"><i class="fa-solid fa-circle-info"></i><span>No insights available</span></div>';
        return;
    }

    container.innerHTML = data.map(insight => `
        <div class="alert alert-${insight.type || 'info'}">
            <i class="fa-solid fa-${getInsightIcon(insight.type)}"></i>
            <span>${insight.message}</span>
            <div class="alert-close" onclick="this.parentElement.style.display='none';">×</div>
        </div>
    `).join('');
}

function getInsightIcon(type) {
    const icons = {
        'success': 'check-circle',
        'warning': 'triangle-exclamation',
        'danger': 'circle-xmark',
        'info': 'circle-info'
    };
    return icons[type] || 'circle-info';
}

// ==================== UPDATE STATISTICS ====================

function updateStatistics(analytics, accuracy) {
    try {
        // Total Analyzed
        const totalTickets = analytics?.total_tickets || 0;
        document.getElementById('totalAnalyzed').textContent = totalTickets;

        // Prediction Accuracy - with fallback calculation
        let avgAccuracy = accuracy?.average_accuracy || 0;
        if (avgAccuracy === 0 && accuracy?.by_category && Array.isArray(accuracy.by_category) && accuracy.by_category.length > 0) {
            // Calculate average from category data if not provided
            const categoryAccuracies = accuracy.by_category
                .map(cat => cat.accuracy_rate || (cat.total_classified > 0 ? (cat.correct_classifications / cat.total_classified) * 100 : 0))
                .filter(val => !isNaN(val));
            if (categoryAccuracies.length > 0) {
                avgAccuracy = categoryAccuracies.reduce((a, b) => a + b, 0) / categoryAccuracies.length;
            }
        }
        document.getElementById('predictionAccuracy').textContent = avgAccuracy.toFixed(1) + '%';
        document.getElementById('classificationAccuracy').textContent = avgAccuracy.toFixed(1) + '%';

        // Duplicates Detected
        const duplicates = analytics?.duplicates_detected || 0;
        document.getElementById('duplicatesDetected').textContent = duplicates;
        document.getElementById('duplicateRate').textContent = totalTickets > 0 
            ? ((duplicates / totalTickets) * 100).toFixed(1) + '%'
            : '0%';

        // Routing Success
        const routingSuccess = analytics?.routing_accuracy || 0;
        document.getElementById('routingSuccess').textContent = routingSuccess.toFixed(1) + '%';

        // Priority Score
        const avgPriority = analytics?.avg_priority_score || 0;
        document.getElementById('avgPriorityScore').textContent = avgPriority.toFixed(1);

        // Sentiment Score
        const avgSentiment = analytics?.avg_sentiment_score || 0;
        document.getElementById('avgSentimentScore').textContent = avgSentiment.toFixed(2);

        // Classification Trend
        const trend = accuracy?.trend || 0;
        const trendElement = document.getElementById('classificationTrend');
        trendElement.textContent = (trend >= 0 ? '+' : '') + trend.toFixed(1) + '%';
        trendElement.style.color = trend >= 0 ? '#4caf50' : '#f44336';
        
        console.log('Statistics updated successfully:', { totalTickets, avgAccuracy, duplicates, routingSuccess });
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

// ==================== LOAD ALL DATA ====================

async function loadIntelligenceData() {
    const dateRange = document.getElementById('dateFilter').value;
    const category = document.getElementById('categoryFilter').value;

    try {
        // Show loading state
        const adminContent = document.querySelector('.admin-content');
        const refreshBtn = document.getElementById('refreshBtn');
        if (adminContent) adminContent.style.opacity = '0.6';
        if (refreshBtn) refreshBtn.disabled = true;

        console.log('Fetching intelligence data with dateRange:', dateRange, 'category:', category);

        // Fetch all data in parallel
        const [analytics, accuracy, routing, sentiment, insights] = await Promise.all([
            INTELLIGENCE_API.getAnalytics(dateRange, category),
            INTELLIGENCE_API.getAccuracyMetrics(dateRange),
            INTELLIGENCE_API.getRoutingMetrics(dateRange),
            INTELLIGENCE_API.getSentimentAnalysis(dateRange),
            INTELLIGENCE_API.getInsights(dateRange)
        ]);

        console.log('API Responses:', { analytics, accuracy, routing, sentiment, insights });

        // Update statistics
        if (analytics) {
            updateStatistics(analytics, accuracy);
        } else {
            console.warn('No analytics data received');
        }

        // Render charts
        if (analytics?.categories && Object.keys(analytics.categories).length > 0) {
            renderCategoriesChart(analytics.categories);
        } else {
            console.warn('No category data available for chart');
            const ctx = document.getElementById('categoriesChart');
            if (ctx) {
                ctx.parentElement.innerHTML = '<p class="no-data">No category data available</p>';
            }
        }

        // Handle sentiment chart - check multiple possible data sources
        let sentimentChartData = null;
        if (analytics?.sentiment_by_category && Object.keys(analytics.sentiment_by_category).length > 0) {
            sentimentChartData = analytics.sentiment_by_category;
            console.log('Using sentiment data from analytics.sentiment_by_category');
        } else if (sentiment?.by_category && Array.isArray(sentiment.by_category) && sentiment.by_category.length > 0) {
            sentimentChartData = sentiment.by_category;
            console.log('Using sentiment data from sentiment.by_category');
        }

        if (sentimentChartData) {
            renderSentimentChart(sentimentChartData);
        } else {
            console.warn('No sentiment data available for chart');
            const ctx = document.getElementById('sentimentChart');
            if (ctx) {
                ctx.parentElement.innerHTML = '<p class="no-data">No sentiment data available</p>';
            }
        }

        // Render tables
        if (accuracy?.by_category && Array.isArray(accuracy.by_category)) {
            console.log('Rendering accuracy table with:', accuracy.by_category);
            renderAccuracyTable(accuracy.by_category);
        } else {
            console.warn('No accuracy data available');
            const tbody = document.getElementById('accuracyTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="no-data">No accuracy data available</td></tr>';
        }

        if (sentiment?.by_category && Array.isArray(sentiment.by_category)) {
            console.log('Rendering sentiment table with:', sentiment.by_category);
            renderSentimentTable(sentiment.by_category);
        } else {
            console.warn('No sentiment table data available');
            const tbody = document.getElementById('sentimentTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="no-data">No sentiment data available</td></tr>';
        }

        if (routing?.agents && Array.isArray(routing.agents)) {
            console.log('Rendering routing metrics with:', routing.agents);
            renderRoutingMetrics(routing.agents);
        } else {
            console.warn('No routing data available');
            const list = document.getElementById('routingEffectivenessList');
            if (list) list.innerHTML = '<li class="no-data">No routing data available</li>';
        }

        if (insights?.insights && Array.isArray(insights.insights)) {
            console.log('Rendering insights with:', insights.insights);
            renderInsights(insights.insights);
        } else {
            console.warn('No insights available');
            const container = document.getElementById('insightsContainer');
            if (container) container.innerHTML = '<div class="alert alert-info"><i class="fa-solid fa-circle-info"></i><span>No insights available</span></div>';
        }

        showNotification('Intelligence data refreshed successfully!', 'success');
    } catch (error) {
        console.error('Error loading intelligence data:', error);
        showNotification('Error loading intelligence data: ' + error.message, 'error');
    } finally {
        const adminContent = document.querySelector('.admin-content');
        const refreshBtn = document.getElementById('refreshBtn');
        if (adminContent) adminContent.style.opacity = '1';
        if (refreshBtn) refreshBtn.disabled = false;
    }
}

// ==================== NOTIFICATIONS ====================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.innerHTML = `
        <i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'circle-info'}"></i>
        <span>${message}</span>
        <div class="alert-close" onclick="this.parentElement.remove();">×</div>
    `;
    
    const container = document.getElementById('insightsContainer');
    container.insertBefore(notification, container.firstChild);
    
    setTimeout(() => {
        notification.style.transition = 'opacity 0.3s';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ==================== EVENT LISTENERS ====================

document.getElementById('refreshBtn').addEventListener('click', loadIntelligenceData);

document.getElementById('dateFilter').addEventListener('change', loadIntelligenceData);

document.getElementById('categoryFilter').addEventListener('change', loadIntelligenceData);

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    localStorage.removeItem('authToken');
    localStorage.removeItem('admin');
    localStorage.removeItem('userRole');
    window.location.href = '../Main Dashboard/AdminLoginPage.html';
});

document.getElementById('adminWelcome').addEventListener('click', () => {
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    alert(`Logged in as: ${admin.name || admin.email}`);
});

document.getElementById('searchIntelligence').addEventListener('keyup', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    // Implement search functionality as needed
    console.log('Searching for:', searchTerm);
});

// ==================== INITIALIZATION ====================

// Debug function - can be called from console
window.debugIntelligenceAPI = async function() {
    console.log('=== INTELLIGENCE API DEBUG ===');
    const token = localStorage.getItem('authToken');
    console.log('Auth token exists:', !!token);
    
    try {
        console.log('\n1. Testing Analytics API...');
        const analytics = await INTELLIGENCE_API.getAnalytics('30', '');
        console.log('Analytics:', analytics);
        
        console.log('\n2. Testing Accuracy Metrics API...');
        const accuracy = await INTELLIGENCE_API.getAccuracyMetrics('30');
        console.log('Accuracy:', accuracy);
        
        console.log('\n3. Testing Routing Metrics API...');
        const routing = await INTELLIGENCE_API.getRoutingMetrics('30');
        console.log('Routing:', routing);
        
        console.log('\n4. Testing Sentiment Analysis API...');
        const sentiment = await INTELLIGENCE_API.getSentimentAnalysis('30');
        console.log('Sentiment:', sentiment);
        
        console.log('\n5. Testing Insights API...');
        const insights = await INTELLIGENCE_API.getInsights('30');
        console.log('Insights:', insights);
        
        console.log('\n=== ALL TESTS COMPLETE ===');
    } catch (error) {
        console.error('API Error:', error);
    }
};

// ==================== INITIALIZATION ====================

document.getElementById('year').textContent = new Date().getFullYear();

async function initIntelligenceDashboard() {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const admin = JSON.parse(localStorage.getItem('admin') || 'null');

    if (!token || userRole !== 'admin') {
        window.location.href = '../Main Dashboard/AdminLoginPage.html';
        return;
    }

    if (admin) {
        document.getElementById('adminWelcome').textContent = `👤 ${admin.name || admin.email}`;
    }

    // Load initial data
    await loadIntelligenceData();

    // Auto-refresh every 60 seconds
    setInterval(loadIntelligenceData, 60000);
}

// Only initialize once when DOM is ready
if (document.readyState === 'loading') {
  // Script loaded before DOMContentLoaded
  window.addEventListener('DOMContentLoaded', initIntelligenceDashboard);
} else {
  // Script loaded after DOMContentLoaded (more common with bottom script tag)
  initIntelligenceDashboard();
}