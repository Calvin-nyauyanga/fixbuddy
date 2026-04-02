import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ GET USER STATS - Get statistics for user's tickets
export const getMyStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Total tickets created by user
    const totalTickets = await prisma.ticket.count({
      where: { createdById: userId },
    });

    // Open tickets (awaiting response)
    const openTickets = await prisma.ticket.count({
      where: {
        createdById: userId,
        status: 'open',
      },
    });

    // In progress tickets
    const inProgress = await prisma.ticket.count({
      where: {
        createdById: userId,
        status: 'in_progress',
      },
    });

    // Resolved/Closed tickets
    const resolved = await prisma.ticket.count({
      where: {
        createdById: userId,
        status: 'closed',
      },
    });

    // Average resolution time (in days)
    const closedTickets = await prisma.ticket.findMany({
      where: {
        createdById: userId,
        status: 'closed',
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    let avgResolutionTime = 0;
    if (closedTickets.length > 0) {
      const totalDays = closedTickets.reduce((sum, ticket) => {
        const days = (ticket.updatedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgResolutionTime = Math.round(totalDays / closedTickets.length);
    }

    res.status(200).json({
      success: true,
      data: {
        totalTickets,
        openTickets,
        inProgress,
        resolved,
        avgResolutionTime,
      },
    });
  } catch (error) {
    console.error('Get User Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stats',
      error: error.message,
    });
  }
};

// ✅ GET SUBMISSION TRENDS - Get tickets submitted in last 7 days
export const getSubmissionTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const tickets = await prisma.ticket.findMany({
      where: {
        createdById: userId,
        createdAt: { gte: last7Days },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const trendsMap = {};
    const dateArray = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateArray.push(dateStr);
      trendsMap[dateStr] = 0;
    }

    tickets.forEach((ticket) => {
      const dateStr = new Date(ticket.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      if (trendsMap[dateStr] !== undefined) {
        trendsMap[dateStr]++;
      }
    });

    const counts = dateArray.map(date => trendsMap[date] || 0);

    res.status(200).json({
      success: true,
      data: {
        dates: dateArray,
        counts: counts,
      },
    });
  } catch (error) {
    console.error('Get Submission Trends Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trends',
      error: error.message,
    });
  }
};

// ✅ GET STATUS BREAKDOWN - Get ticket status distribution
export const getMyStatusBreakdown = async (req, res) => {
  try {
    const userId = req.user.id;

    const statusBreakdown = await prisma.ticket.groupBy({
      by: ['status'],
      where: { createdById: userId },
      _count: true,
    });

    const statuses = statusBreakdown.map(item => item.status || 'unknown');
    const counts = statusBreakdown.map(item => item._count);

    res.status(200).json({
      success: true,
      data: {
        statuses,
        counts,
      },
    });
  } catch (error) {
    console.error('Get Status Breakdown Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching status breakdown',
      error: error.message,
    });
  }
};

// ✅ GET CATEGORIES - Get ticket category distribution
export const getMyCategories = async (req, res) => {
  try {
    const userId = req.user.id;

    const categoryBreakdown = await prisma.ticket.groupBy({
      by: ['category'],
      where: { createdById: userId },
      _count: true,
    });

    const categories = categoryBreakdown.map(item => item.category || 'Uncategorized');
    const counts = categoryBreakdown.map(item => item._count);

    res.status(200).json({
      success: true,
      data: {
        categories,
        counts,
      },
    });
  } catch (error) {
    console.error('Get Categories Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories',
      error: error.message,
    });
  }
};