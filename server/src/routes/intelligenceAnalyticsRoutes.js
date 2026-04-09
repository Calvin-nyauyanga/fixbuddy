import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import TicketIntelligenceService from '../services/TicketIntelligenceService.js';

const router = express.Router();
const intelligenceService = new TicketIntelligenceService();

// Helper function to filter dates
function getDateFilter(days) {
    const daysNum = parseInt(days) || 30;
    if (daysNum === 0) return null; // All time
    
    const date = new Date();
    date.setDate(date.getDate() - daysNum);
    return date;
}

// ==================== ANALYTICS ENDPOINT ====================

/**
 * GET /api/intelligence/analytics
 * Get overall intelligence analytics
 */
router.get('/analytics', authMiddleware, async (req, res) => {
    try {
        const { days = '30', category = '' } = req.query;
        const dateFilter = getDateFilter(days);

        // Build query filter
        const where = {};
        if (dateFilter) {
            where.createdAt = { gte: dateFilter };
        }
        if (category) {
            where.category = category;
        }

        // Get tickets
        const tickets = await prisma.ticket.findMany({
            where,
            select: {
                id: true,
                category: true,
                priority: true,
                confidence: true,
                sentiment: true,
                intelligenceData: true,
                createdAt: true
            }
        });

        // Calculate categories
        const categories = {};
        const sentimentByCategory = {};
        let totalDuplicates = 0;
        let totalPriorityScore = 0;
        let totalSentimentScore = 0;

        tickets.forEach(ticket => {
            // Count categories
            if (ticket.category) {
                categories[ticket.category] = (categories[ticket.category] || 0) + 1;
            }

            // Average sentiment by category
            if (ticket.sentiment && ticket.category) {
                if (!sentimentByCategory[ticket.category]) {
                    sentimentByCategory[ticket.category] = { sum: 0, count: 0 };
                }
                sentimentByCategory[ticket.category].sum += ticket.sentiment.score || 0;
                sentimentByCategory[ticket.category].count += 1;
            }

            // Calculate totals
            totalPriorityScore += ticket.confidence || 0;
            totalSentimentScore += ticket.sentiment?.score || 0;
        });

        // Convert to averages
        Object.keys(sentimentByCategory).forEach(cat => {
            sentimentByCategory[cat] = 
                sentimentByCategory[cat].sum / sentimentByCategory[cat].count;
        });

        const avgPriority = tickets.length > 0 ? totalPriorityScore / tickets.length : 0;
        const avgSentiment = tickets.length > 0 ? totalSentimentScore / tickets.length : 0;

        res.json({
            total_tickets: tickets.length,
            categories,
            sentiment_by_category: sentimentByCategory,
            duplicates_detected: totalDuplicates,
            avg_priority_score: avgPriority,
            avg_sentiment_score: avgSentiment,
            routing_accuracy: calculateRoutingAccuracy(tickets),
            date_range: days
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== ACCURACY METRICS ENDPOINT ====================

/**
 * GET /api/intelligence/accuracy-metrics
 * Get prediction accuracy metrics by category
 */
router.get('/accuracy-metrics', authMiddleware, async (req, res) => {
    try {
        const { days = '30' } = req.query;
        const dateFilter = getDateFilter(days);

        const where = {};
        if (dateFilter) {
            where.createdAt = { gte: dateFilter };
        }

        const tickets = await prisma.ticket.findMany({
            where,
            select: {
                id: true,
                category: true,
                confidence: true,
                intelligenceData: true,
                updatedAt: true
            }
        });

        // Group by category
        const categoryAccuracy = {};

        tickets.forEach(ticket => {
            const category = ticket.category || 'Uncategorized';
            
            if (!categoryAccuracy[category]) {
                categoryAccuracy[category] = {
                    category,
                    total_classified: 0,
                    correct_classifications: 0,
                    avg_confidence: 0,
                    trend: Math.random() * 20 - 10 // Mock trend
                };
            }

            categoryAccuracy[category].total_classified += 1;
            categoryAccuracy[category].avg_confidence += ticket.confidence || 0;
            
            // Assume correct if confidence > 70%
            if ((ticket.confidence || 0) > 70) {
                categoryAccuracy[category].correct_classifications += 1;
            }
        });

        // Calculate percentages
        Object.keys(categoryAccuracy).forEach(cat => {
            const item = categoryAccuracy[cat];
            item.avg_confidence = item.total_classified > 0 
                ? (item.avg_confidence / item.total_classified)
                : 0;
            item.accuracy_rate = item.total_classified > 0
                ? (item.correct_classifications / item.total_classified) * 100
                : 0;
        });

        const byCategory = Object.values(categoryAccuracy);
        const averageAccuracy = byCategory.length > 0
            ? byCategory.reduce((sum, item) => sum + item.accuracy_rate, 0) / byCategory.length
            : 0;

        res.json({
            by_category: byCategory,
            average_accuracy: averageAccuracy,
            trend: calculateTrend(byCategory),
            total_tickets_analyzed: tickets.length
        });
    } catch (error) {
        console.error('Accuracy metrics error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== ROUTING METRICS ENDPOINT ====================

/**
 * GET /api/intelligence/routing-metrics
 * Get routing effectiveness metrics
 */
router.get('/routing-metrics', authMiddleware, async (req, res) => {
    try {
        const { days = '30' } = req.query;
        const dateFilter = getDateFilter(days);

        const where = {};
        if (dateFilter) {
            where.createdAt = { gte: dateFilter };
        }

        // Get tickets with assigned agents
        const tickets = await prisma.ticket.findMany({
            where,
            select: {
                id: true,
                suggestedAgent: true,
                createdAt: true,
                updatedAt: true,
                resolvedAt: true
            }
        });

        // Get agents
        const agents = await prisma.user.findMany({
            where: { role: 'agent' },
            select: {
                id: true,
                name: true,
                status: true
            }
        });

        // Calculate metrics per agent
        const agentMetrics = {};

        agents.forEach(agent => {
            const assignedTickets = tickets.filter(t => t.suggestedAgent === agent.id);
            const resolved = assignedTickets.filter(t => t.resolvedAt !== null);

            let totalTime = 0;
            resolved.forEach(ticket => {
                const createdTime = new Date(ticket.createdAt);
                const resolvedTime = new Date(ticket.resolvedAt);
                totalTime += (resolvedTime - createdTime) / (1000 * 60 * 60); // hours
            });

            agentMetrics[agent.id] = {
                agent_name: agent.name,
                status: agent.status,
                total_assigned: assignedTickets.length,
                total_resolved: resolved.length,
                routing_accuracy: assignedTickets.length > 0
                    ? (resolved.length / assignedTickets.length) * 100
                    : 0,
                avg_resolution_time: resolved.length > 0 ? totalTime / resolved.length : 0
            };
        });

        res.json({
            agents: Object.values(agentMetrics),
            overall_routing_accuracy: calculateOverallAccuracy(Object.values(agentMetrics))
        });
    } catch (error) {
        console.error('🔴 ROUTING-METRICS-ERROR:', error.message);
        res.status(500).json({ error: '[ROUTING-METRICS] ' + error.message });
    }
});

// ==================== SENTIMENT ANALYSIS ENDPOINT ====================

/**
 * GET /api/intelligence/sentiment-analysis
 * Get sentiment analysis by category
 */
router.get('/sentiment-analysis', authMiddleware, async (req, res) => {
    try {
        const { days = '30' } = req.query;
        const dateFilter = getDateFilter(days);

        const where = {};
        if (dateFilter) {
            where.createdAt = { gte: dateFilter };
        }

        const tickets = await prisma.ticket.findMany({
            where,
            select: {
                category: true,
                sentiment: true
            }
        });

        // Group by category
        const sentimentByCategory = {};

        tickets.forEach(ticket => {
            const category = ticket.category || 'Uncategorized';
            const sentiment = ticket.sentiment || { score: 0, emotion: 'neutral' };

            if (!sentimentByCategory[category]) {
                sentimentByCategory[category] = {
                    category,
                    positive_count: 0,
                    neutral_count: 0,
                    negative_count: 0,
                    total_count: 0,
                    total_score: 0
                };
            }

            const data = sentimentByCategory[category];
            data.total_count += 1;
            data.total_score += sentiment.score || 0;

            // Classify sentiment
            if (sentiment.score > 0.2) {
                data.positive_count += 1;
            } else if (sentiment.score < -0.2) {
                data.negative_count += 1;
            } else {
                data.neutral_count += 1;
            }
        });

        // Calculate percentages
        Object.keys(sentimentByCategory).forEach(cat => {
            const data = sentimentByCategory[cat];
            data.positive_percentage = (data.positive_count / data.total_count) * 100;
            data.neutral_percentage = (data.neutral_count / data.total_count) * 100;
            data.negative_percentage = (data.negative_count / data.total_count) * 100;
            data.avg_sentiment_score = data.total_score / data.total_count;
        });

        res.json({
            by_category: Object.values(sentimentByCategory),
            total_tickets_analyzed: tickets.length
        });
    } catch (error) {
        console.error('Sentiment analysis error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== INSIGHTS ENDPOINT ====================

/**
 * GET /api/intelligence/insights
 * Get AI-generated insights and recommendations
 */
router.get('/insights', authMiddleware, async (req, res) => {
    try {
        const { days = '30' } = req.query;
        const dateFilter = getDateFilter(days);

        const where = {};
        if (dateFilter) {
            where.createdAt = { gte: dateFilter };
        }

        const [tickets, agents] = await Promise.all([
            prisma.ticket.findMany({
                where,
                select: {
                    category: true,
                    priority: true,
                    confidence: true,
                    sentiment: true
                }
            }),
            prisma.user.findMany({
                where: { role: 'agent' },
                select: { name: true }
            })
        ]);

        const insights = [];

        // Insight 1: Most common category
        if (tickets.length > 0) {
            const categories = {};
            tickets.forEach(t => {
                categories[t.category] = (categories[t.category] || 0) + 1;
            });
            const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
            insights.push({
                type: 'info',
                message: `Most common issue category is "${topCategory[0]}" with ${topCategory[1]} tickets (${((topCategory[1]/tickets.length)*100).toFixed(1)}%)`
            });
        }

        // Insight 2: High confidence prediction
        const avgConfidence = tickets.reduce((sum, t) => sum + (t.confidence || 0), 0) / tickets.length;
        if (avgConfidence > 80) {
            insights.push({
                type: 'success',
                message: `AI classification is performing excellently with ${avgConfidence.toFixed(1)}% average confidence!`
            });
        } else if (avgConfidence < 60) {
            insights.push({
                type: 'warning',
                message: `AI classification confidence is low (${avgConfidence.toFixed(1)}%). Consider providing more training data.`
            });
        }

        // Insight 3: Sentiment warning
        const avgSentiment = tickets.reduce((sum, t) => sum + (t.sentiment?.score || 0), 0) / tickets.length;
        if (avgSentiment < -0.3) {
            insights.push({
                type: 'danger',
                message: `Negative sentiment detected in recent tickets (${avgSentiment.toFixed(2)}). Review and improve support quality.`
            });
        }

        // Insight 4: Agent performance
        if (agents.length > 0) {
            insights.push({
                type: 'info',
                message: `You have ${agents.length} active support agents. Monitor their performance regularly.`
            });
        }

        // Insight 5: High priority tickets
        const highPriorityCount = tickets.filter(t => t.priority === 'critical' || t.priority === 'high').length;
        if (highPriorityCount > tickets.length * 0.2) {
            insights.push({
                type: 'warning',
                message: `${highPriorityCount} high-priority tickets detected. Ensure proper allocation of resources.`
            });
        }

        res.json({ insights });
    } catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== HELPER FUNCTIONS ====================

function calculateRoutingAccuracy(tickets) {
    if (tickets.length === 0) return 0;
    // Mock calculation - in real app, compare suggestedAgent with actualAgent
    return Math.random() * 100;
}

function calculateTrend(items) {
    if (items.length < 2) return 0;
    const recent = items.slice(0, Math.ceil(items.length / 2));
    const older = items.slice(Math.ceil(items.length / 2));
    const recentAvg = recent.reduce((sum, i) => sum + i.accuracy_rate, 0) / recent.length;
    const olderAvg = older.reduce((sum, i) => sum + i.accuracy_rate, 0) / older.length;
    return recentAvg - olderAvg;
}

function calculateOverallAccuracy(agentMetrics) {
    if (agentMetrics.length === 0) return 0;
    const totalAccuracy = agentMetrics.reduce((sum, agent) => sum + agent.routing_accuracy, 0);
    return totalAccuracy / agentMetrics.length;
}

export default router;