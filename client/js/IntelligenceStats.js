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
    predictedCorrectly: 0,
    lastUpdate: null
};

// Cache for API responses to handle 304 responses
const apiCache = {
    analytics: null,
    accuracy: null,
    routing: null,
    sentiment: null,
    insights: null,
    lastUpdate: Date.now()
};

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
                }
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
                }
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
            if (response.status === 304) {
                console.log('Routing Metrics: 304 Not Modified (cached response)');
                return null;
            }
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
            if (response.status === 304) {
                console.log('Sentiment Analysis: 304 Not Modified (cached response)');
                return null;
            }
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
            if (response.status === 304) {
                console.log('Insights: 304 Not Modified (cached response)');
                return null;
            }
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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

        console.log('🔄 Fetching intelligence data with dateRange:', dateRange, 'category:', category);

        // Fetch all data in parallel
        const [analytics, accuracy, routing, sentiment, insights] = await Promise.all([
            INTELLIGENCE_API.getAnalytics(dateRange, category),
            INTELLIGENCE_API.getAccuracyMetrics(dateRange),
            INTELLIGENCE_API.getRoutingMetrics(dateRange),
            INTELLIGENCE_API.getSentimentAnalysis(dateRange),
            INTELLIGENCE_API.getInsights(dateRange)
        ]);

        console.log('📊 Raw API Responses:', { analytics, accuracy, routing, sentiment, insights });

        // Handle 304 responses by using cached data
        const analyticsData = analytics || apiCache.analytics;
        const accuracyData = accuracy || apiCache.accuracy;
        const routingData = routing || apiCache.routing;
        const sentimentData = sentiment || apiCache.sentiment;
        const insightsData = insights || apiCache.insights;

        // Update cache with new data
        if (analytics) apiCache.analytics = analytics;
        if (accuracy) apiCache.accuracy = accuracy;
        if (routing) apiCache.routing = routing;
        if (sentiment) apiCache.sentiment = sentiment;
        if (insights) apiCache.insights = insights;
        apiCache.lastUpdate = Date.now();

        console.log('✅ Using Data:', { analyticsData, accuracyData, routingData, sentimentData, insightsData });

        // Update statistics - ALWAYS call this
        if (analyticsData) {
            try {
                updateStatistics(analyticsData, accuracyData);
            } catch (e) {
                console.error('❌ Error updating statistics:', e);
            }
        } else {
            console.warn('⚠️ No analytics data available');
        }

        // Render charts
        if (analyticsData?.categories && Object.keys(analyticsData.categories).length > 0) {
            console.log('✅ Rendering categories chart with:', analyticsData.categories);
            renderCategoriesChart(analyticsData.categories);
        } else {
            console.warn('⚠️ No category data available for chart');
            const ctx = document.getElementById('categoriesChart');
            if (ctx && ctx.parentElement) {
                ctx.parentElement.innerHTML = '<p class="no-data">No category data available</p>';
            }
        }

        // Handle sentiment chart - check multiple possible data sources
        let sentimentChartData = null;
        if (analyticsData?.sentiment_by_category && Object.keys(analyticsData.sentiment_by_category).length > 0) {
            sentimentChartData = analyticsData.sentiment_by_category;
            console.log('✅ Using sentiment data from analytics.sentiment_by_category');
        } else if (sentimentData?.by_category && Array.isArray(sentimentData.by_category) && sentimentData.by_category.length > 0) {
            sentimentChartData = sentimentData.by_category;
            console.log('✅ Using sentiment data from sentiment.by_category');
        } else {
            console.warn('⚠️ No sentiment data found in either source');
        }

        if (sentimentChartData) {
            try {
                renderSentimentChart(sentimentChartData);
            } catch (e) {
                console.error('❌ Error rendering sentiment chart:', e);
            }
        } else {
            console.warn('⚠️ No sentiment data available for chart');
            const ctx = document.getElementById('sentimentChart');
            if (ctx && ctx.parentElement) {
                ctx.parentElement.innerHTML = '<p class="no-data">No sentiment data available</p>';
            }
        }

        // Render tables
        if (accuracyData?.by_category && Array.isArray(accuracyData.by_category) && accuracyData.by_category.length > 0) {
            console.log('✅ Rendering accuracy table with:', accuracyData.by_category.length, 'rows');
            try {
                renderAccuracyTable(accuracyData.by_category);
            } catch (e) {
                console.error('❌ Error rendering accuracy table:', e);
            }
        } else {
            console.warn('⚠️ No accuracy data available');
            const tbody = document.getElementById('accuracyTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="no-data">No accuracy data available</td></tr>';
        }

        if (sentimentData?.by_category && Array.isArray(sentimentData.by_category) && sentimentData.by_category.length > 0) {
            console.log('✅ Rendering sentiment table with:', sentimentData.by_category.length, 'rows');
            try {
                renderSentimentTable(sentimentData.by_category);
            } catch (e) {
                console.error('❌ Error rendering sentiment table:', e);
            }
        } else {
            console.warn('⚠️ No sentiment table data available');
            const tbody = document.getElementById('sentimentTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="no-data">No sentiment data available</td></tr>';
        }

        if (routingData?.agents && Array.isArray(routingData.agents) && routingData.agents.length > 0) {
            console.log('✅ Rendering routing metrics with:', routingData.agents.length, 'agents');
            try {
                renderRoutingMetrics(routingData.agents);
            } catch (e) {
                console.error('❌ Error rendering routing metrics:', e);
            }
        } else {
            console.warn('⚠️ No routing data available');
            const list = document.getElementById('routingEffectivenessList');
            if (list) list.innerHTML = '<li class="no-data">No routing data available</li>';
        }

        if (insightsData?.insights && Array.isArray(insightsData.insights) && insightsData.insights.length > 0) {
            console.log('✅ Rendering insights with:', insightsData.insights.length, 'insights');
            try {
                renderInsights(insightsData.insights);
            } catch (e) {
                console.error('❌ Error rendering insights:', e);
            }
        } else {
            console.warn('⚠️ No insights available');
            const container = document.getElementById('insightsContainer');
            if (container) container.innerHTML = '<div class="alert alert-info"><i class="fa-solid fa-circle-info"></i><span>No insights available</span></div>';
        }

        showNotification('✅ Intelligence data refreshed successfully!', 'success');
    } catch (error) {
        console.error('❌ Error loading intelligence data:', error);
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

// ==================== DIAGNOSTICS ====================

window.intelligenceDiagnostics = async function() {
    console.log('====== INTELLIGENCE DASHBOARD DIAGNOSTICS ======');
    console.log('📅 Timestamp:', new Date().toLocaleString());
    
    // 1. Check environment
    console.log('\n1️⃣ ENVIRONMENT CHECK:');
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const admin = localStorage.getItem('admin');
    console.log('   Token exists:', !!token);
    console.log('   Token length:', token?.length || 0);
    console.log('   User role:', role);
    console.log('   Is admin:', role === 'admin');
    console.log('   Admin data:', admin);
    
    // 2. Check cache
    console.log('\n2️⃣ API CACHE STATUS:');
    console.log('   Cache age (ms):', Date.now() - apiCache.lastUpdate);
    console.log('   Analytics cached:', !!apiCache.analytics);
    console.log('   Accuracy cached:', !!apiCache.accuracy);
    console.log('   Routing cached:', !!apiCache.routing);
    console.log('   Sentiment cached:', !!apiCache.sentiment);
    console.log('   Insights cached:', !!apiCache.insights);
    
    // 3. Check DOM elements
    console.log('\n3️⃣ DOM ELEMENTS CHECK:');
    const elements = {
        categoriesChart: document.getElementById('categoriesChart'),
        sentimentChart: document.getElementById('sentimentChart'),
        accuracyTableBody: document.getElementById('accuracyTableBody'),
        sentimentTableBody: document.getElementById('sentimentTableBody'),
        routingEffectivenessList: document.getElementById('routingEffectivenessList'),
        insightsContainer: document.getElementById('insightsContainer'),
        dateFilter: document.getElementById('dateFilter'),
        categoryFilter: document.getElementById('categoryFilter'),
        refreshBtn: document.getElementById('refreshBtn')
    };
    Object.entries(elements).forEach(([name, el]) => {
        console.log(`   ${name}:`, el ? '✅ Found' : '❌ Missing');
    });
    
    // 4. Test each API endpoint
    console.log('\n4️⃣ TESTING API ENDPOINTS:');
    try {
        const dateRange = document.getElementById('dateFilter').value || '7';
        
        console.log(`   Testing with dateRange: ${dateRange}`);
        
        console.log('   Testing Analytics...');
        const analytics = await INTELLIGENCE_API.getAnalytics(dateRange);
        console.log('   ✅ Analytics:', analytics ? 'Data received' : 'Empty');
        if (analytics) console.log('      Keys:', Object.keys(analytics));
        
        console.log('   Testing Accuracy Metrics...');
        const accuracy = await INTELLIGENCE_API.getAccuracyMetrics(dateRange);
        console.log('   ✅ Accuracy:', accuracy ? 'Data received' : 'Empty');
        if (accuracy) console.log('      Keys:', Object.keys(accuracy));
        
        console.log('   Testing Routing Metrics...');
        const routing = await INTELLIGENCE_API.getRoutingMetrics(dateRange);
        console.log('   ✅ Routing:', routing ? 'Data received' : 'Empty');
        if (routing) console.log('      Keys:', Object.keys(routing));
        
        console.log('   Testing Sentiment Analysis...');
        const sentiment = await INTELLIGENCE_API.getSentimentAnalysis(dateRange);
        console.log('   ✅ Sentiment:', sentiment ? 'Data received' : 'Empty');
        if (sentiment) console.log('      Keys:', Object.keys(sentiment));
        
        console.log('   Testing Insights...');
        const insights = await INTELLIGENCE_API.getInsights(dateRange);
        console.log('   ✅ Insights:', insights ? 'Data received' : 'Empty');
        if (insights) console.log('      Keys:', Object.keys(insights));
        
    } catch (error) {
        console.error('   ❌ API Test Error:', error);
    }
    
    // 5. Summary
    console.log('\n5️⃣ SUMMARY:');
    console.log('   Chart instances:', { categories: !!categoriesChart, sentiment: !!sentimentChart });
    console.log('   Last data refresh:', new Date(apiCache.lastUpdate).toLocaleTimeString());
    console.log('   Current filter:', { dateRange: document.getElementById('dateFilter').value, category: document.getElementById('categoryFilter').value });
    
    console.log('\n====== END DIAGNOSTICS ======');
    console.log('💡 TIP: Run intelligenceDiagnostics() again after clicking Refresh button');
};

// Debug function - can be called from console
window.debugIntelligenceAPI = async function() {
    console.log('=== RUNNING FULL INTELLIGENCE TEST ===');
    await intelligenceDiagnostics();
    console.log('=== RELOADING PAGE DATA ===');
    await loadIntelligenceData();
    console.log('=== TEST COMPLETE ===');
};

// ==================== INITIALIZATION ====================

document.getElementById('year').textContent = new Date().getFullYear();

async function initIntelligenceDashboard() {
    console.log('🚀 Initializing Intelligence Dashboard...');
    
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const adminStr = localStorage.getItem('admin');
    let admin = null;
    
    console.log('🔐 Auth check - Token:', token ? '✅ Present' : '❌ Missing');
    console.log('👤 Role check - Role:', userRole);
    console.log('📦 Admin data:', adminStr ? '✅ Present' : '❌ Missing');
    
    try {
        admin = adminStr ? JSON.parse(adminStr) : null;
    } catch (e) {
        console.warn('Could not parse admin data:', e);
    }

    if (!token || userRole !== 'admin') {
        console.error('❌ Not authenticated as admin, redirecting...');
        window.location.href = '../Main Dashboard/AdminLoginPage.html';
        return;
    }

    // Update welcome message with admin info
    if (admin && admin.name) {
        console.log('✅ Displaying admin name:', admin.name);
        document.getElementById('adminWelcome').textContent = `👤 ${admin.name}`;
    } else if (admin && admin.email) {
        console.log('✅ Displaying admin email:', admin.email);
        document.getElementById('adminWelcome').textContent = `👤 ${admin.email}`;
    } else {
        // Fallback: try to get from user object
        const userStr = localStorage.getItem('user');
        try {
            const user = userStr ? JSON.parse(userStr) : null;
            if (user && user.email) {
                console.log('✅ Displaying user email:', user.email);
                document.getElementById('adminWelcome').textContent = `👤 ${user.email}`;
            } else {
                console.warn('⚠️ No user info found in localStorage');
            }
        } catch (e) {
            console.warn('Could not parse user data:', e);
        }
    }

    console.log('✅ Authentication successful, loading data...');
    
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