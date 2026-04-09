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

const API_BASE = 'http://localhost:5000/api';

// API Endpoints
const INTELLIGENCE_API = {
    async getAnalytics(dateRange = '30', category = '') {
        try {
            const params = new URLSearchParams({
                days: dateRange,
                category: category
            });
            const response = await fetch(`${API_BASE}/intelligence/analytics?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch analytics');
            return await response.json();
        } catch (error) {
            console.error('Analytics fetch error:', error);
            return null;
        }
    },

    async getAccuracyMetrics(dateRange = '30') {
        try {
            const response = await fetch(`${API_BASE}/intelligence/accuracy-metrics?days=${dateRange}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch accuracy metrics');
            return await response.json();
        } catch (error) {
            console.error('Accuracy metrics fetch error:', error);
            return null;
        }
    },

    async getRoutingMetrics(dateRange = '30') {
        try {
            const response = await fetch(`${API_BASE}/intelligence/routing-metrics?days=${dateRange}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
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
            const response = await fetch(`${API_BASE}/intelligence/sentiment-analysis?days=${dateRange}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
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
            const response = await fetch(`${API_BASE}/intelligence/insights?days=${dateRange}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
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
    const ctx = document.getElementById('categoriesChart').getContext('2d');
    
    if (categoriesChart) {
        categoriesChart.destroy();
    }

    const categories = Object.keys(data || {});
    const counts = Object.values(data || {});
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe',
        '#43e97b', '#fa709a', '#fee140', '#30b0fe', '#a8edea'
    ];

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
}

function renderSentimentChart(data) {
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    
    if (sentimentChart) {
        sentimentChart.destroy();
    }

    const categories = Object.keys(data || {});
    const scores = Object.values(data || {}).map(d => parseFloat(d) || 0);

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
}

// ==================== TABLE RENDERING ====================

function renderAccuracyTable(data) {
    const tbody = document.getElementById('accuracyTableBody');
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No accuracy data available</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr>
            <td><span class="category-badge category-${item.category.toLowerCase()}">${item.category}</span></td>
            <td>${item.total_classified}</td>
            <td>${item.correct_classifications}</td>
            <td>
                <strong style="color: ${item.accuracy_rate >= 80 ? '#4caf50' : item.accuracy_rate >= 60 ? '#ff9800' : '#f44336'};">
                    ${item.accuracy_rate.toFixed(1)}%
                </strong>
            </td>
            <td>${item.avg_confidence.toFixed(1)}%</td>
            <td>
                <span class="metric-change ${item.trend >= 0 ? 'positive' : 'negative'}">
                    <i class="fa-solid fa-arrow-${item.trend >= 0 ? 'up' : 'down'}"></i>
                    ${Math.abs(item.trend).toFixed(1)}%
                </span>
            </td>
        </tr>
    `).join('');
}

function renderSentimentTable(data) {
    const tbody = document.getElementById('sentimentTableBody');
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No sentiment data available</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr>
            <td><span class="category-badge category-${item.category.toLowerCase()}">${item.category}</span></td>
            <td>
                <span class="sentiment-indicator sentiment-positive">
                    <i class="fa-solid fa-smile"></i>
                    ${item.positive_count} (${item.positive_percentage.toFixed(1)}%)
                </span>
            </td>
            <td>
                <span class="sentiment-indicator sentiment-neutral">
                    <i class="fa-solid fa-circle"></i>
                    ${item.neutral_count} (${item.neutral_percentage.toFixed(1)}%)
                </span>
            </td>
            <td>
                <span class="sentiment-indicator sentiment-negative">
                    <i class="fa-solid fa-frown"></i>
                    ${item.negative_count} (${item.negative_percentage.toFixed(1)}%)
                </span>
            </td>
            <td>
                <strong>${item.avg_sentiment_score.toFixed(2)}</strong>
            </td>
        </tr>
    `).join('');
}

function renderRoutingMetrics(data) {
    const list = document.getElementById('routingEffectivenessList');
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        list.innerHTML = '<li class="no-data">No routing data available</li>';
        return;
    }

    list.innerHTML = data.map(agent => `
        <li class="routing-item">
            <div>
                <div class="routing-agent-name">${agent.agent_name}</div>
                <small style="color: #999;">${agent.specialization || 'General Support'}</small>
            </div>
            <div class="routing-metrics">
                <div class="routing-metric">
                    <div class="routing-metric-label">Assigned</div>
                    <div class="routing-metric-value">${agent.total_assigned}</div>
                </div>
                <div class="routing-metric">
                    <div class="routing-metric-label">Resolved</div>
                    <div class="routing-metric-value">${agent.total_resolved}</div>
                </div>
                <div class="routing-metric">
                    <div class="routing-metric-label">Accuracy</div>
                    <div class="routing-metric-value" style="color: ${agent.routing_accuracy >= 80 ? '#4caf50' : '#ff9800'};">
                        ${agent.routing_accuracy.toFixed(1)}%
                    </div>
                </div>
                <div class="routing-metric">
                    <div class="routing-metric-label">Avg Resolution</div>
                    <div class="routing-metric-value">${agent.avg_resolution_time.toFixed(1)}h</div>
                </div>
            </div>
        </li>
    `).join('');
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
    // Total Analyzed
    const totalTickets = analytics?.total_tickets || 0;
    document.getElementById('totalAnalyzed').textContent = totalTickets;

    // Prediction Accuracy
    const avgAccuracy = accuracy?.average_accuracy || 0;
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
}

// ==================== LOAD ALL DATA ====================

async function loadIntelligenceData() {
    const dateRange = document.getElementById('dateFilter').value;
    const category = document.getElementById('categoryFilter').value;

    try {
        // Show loading state
        document.querySelector('.admin-content').style.opacity = '0.6';
        document.getElementById('refreshBtn').disabled = true;

        // Fetch all data in parallel
        const [analytics, accuracy, routing, sentiment, insights] = await Promise.all([
            INTELLIGENCE_API.getAnalytics(dateRange, category),
            INTELLIGENCE_API.getAccuracyMetrics(dateRange),
            INTELLIGENCE_API.getRoutingMetrics(dateRange),
            INTELLIGENCE_API.getSentimentAnalysis(dateRange),
            INTELLIGENCE_API.getInsights(dateRange)
        ]);

        // Update statistics
        if (analytics) updateStatistics(analytics, accuracy);

        // Render charts
        if (analytics?.categories) {
            renderCategoriesChart(analytics.categories);
        }
        if (analytics?.sentiment_by_category) {
            renderSentimentChart(analytics.sentiment_by_category);
        }

        // Render tables
        if (accuracy?.by_category) {
            renderAccuracyTable(accuracy.by_category);
        }
        if (sentiment?.by_category) {
            renderSentimentTable(sentiment.by_category);
        }
        if (routing?.agents) {
            renderRoutingMetrics(routing.agents);
        }
        if (insights?.insights) {
            renderInsights(insights.insights);
        }

        showNotification('Intelligence data refreshed successfully!', 'success');
    } catch (error) {
        console.error('Error loading intelligence data:', error);
        showNotification('Error loading intelligence data', 'error');
    } finally {
        document.querySelector('.admin-content').style.opacity = '1';
        document.getElementById('refreshBtn').disabled = false;
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

window.addEventListener('DOMContentLoaded', initIntelligenceDashboard);
initIntelligenceDashboard();