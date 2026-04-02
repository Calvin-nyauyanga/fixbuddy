import prisma from '../config/database.js';

// ============================================
// ADMIN REPORTS CONTROLLERS
// ============================================

// ✅ GET ADMIN DASHBOARD STATISTICS
export const getAdminDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get counts
    const totalTickets = await prisma.ticket.count();
    const openTickets = await prisma.ticket.count({
      where: { status: 'open' },
    });
    const inProgressTickets = await prisma.ticket.count({
      where: { status: 'in_progress' },
    });
    const resolvedToday = await prisma.ticket.count({
      where: {
        status: 'closed',
        updatedAt: {
          gte: today,
        },
      },
    });

    // Get average response time (in hours)
    const ticketsWithComments = await prisma.ticket.findMany({
      where: {
        comments: {
          some: {},
        },
      },
      select: {
        createdAt: true,
        comments: {
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    let averageResponseTime = 0;
    if (ticketsWithComments.length > 0) {
      const responseTimes = ticketsWithComments.map((ticket) => {
        const firstResponse = ticket.comments[0]?.createdAt;
        if (firstResponse) {
          const diffMs = firstResponse.getTime() - ticket.createdAt.getTime();
          return diffMs / (1000 * 60 * 60); // Convert to hours
        }
        return 0;
      });

      averageResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    res.status(200).json({
      success: true,
      data: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedToday,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      },
      message: 'Admin dashboard statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Admin Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin statistics',
      error: error.message,
    });
  }
};

// ✅ GET ADMIN TICKET ANALYTICS
export const getAdminTicketAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total tickets created
    const totalTickets = await prisma.ticket.count();

    // Tickets by status
    const byStatus = await prisma.ticket.groupBy({
      by: ['status'],
      _count: true,
    });

    // Tickets by priority
    const byPriority = await prisma.ticket.groupBy({
      by: ['priority'],
      _count: true,
    });

    // Tickets created in last 7 days
    const ticketsLast7Days = await prisma.ticket.count({
      where: {
        createdAt: {
          gte: last7Days,
        },
      },
    });

    // Average resolution time (in hours)
    const solvedTickets = await prisma.ticket.findMany({
      where: {
        status: 'closed',
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    let avgResolutionTime = 0;
    if (solvedTickets.length > 0) {
      const totalHours = solvedTickets.reduce((sum, ticket) => {
        const hours =
          (ticket.updatedAt.getTime() - ticket.createdAt.getTime()) /
          (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      avgResolutionTime = Math.round((totalHours / solvedTickets.length) * 100) / 100;
    }

    res.status(200).json({
      success: true,
      data: {
        totalTickets,
        ticketsLast7Days,
        avgResolutionTime,
        byStatus: byStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        byPriority: byPriority.map((item) => ({
          priority: item.priority,
          count: item._count,
        })),
      },
      message: 'Admin analytics retrieved successfully',
    });
  } catch (error) {
    console.error('Admin Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics',
      error: error.message,
    });
  }
};

// ✅ GET TICKETS BY STATUS
export const getTicketsByStatus = async (req, res) => {
  try {
    const statusDistribution = await prisma.ticket.groupBy({
      by: ['status'],
      _count: true,
    });

    const data = {
      statuses: statusDistribution.map((item) => item.status),
      counts: statusDistribution.map((item) => item._count),
    };

    res.status(200).json({
      success: true,
      data,
      message: 'Status distribution retrieved successfully',
    });
  } catch (error) {
    console.error('Status Distribution Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching status distribution',
      error: error.message,
    });
  }
};

// ✅ GET TICKETS BY PRIORITY
export const getTicketsByPriority = async (req, res) => {
  try {
    const priorityDistribution = await prisma.ticket.groupBy({
      by: ['priority'],
      _count: true,
    });

    const data = {
      priorities: priorityDistribution.map((item) => item.priority),
      counts: priorityDistribution.map((item) => item._count),
    };

    res.status(200).json({
      success: true,
      data,
      message: 'Priority distribution retrieved successfully',
    });
  } catch (error) {
    console.error('Priority Distribution Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching priority distribution',
      error: error.message,
    });
  }
};

// ✅ GET TICKETS BY CATEGORY
export const getTicketsByCategory = async (req, res) => {
  try {
    const categoryDistribution = await prisma.ticket.groupBy({
      by: ['category'],
      _count: true,
    });

    const data = {
      categories: categoryDistribution.map((item) => item.category),
      counts: categoryDistribution.map((item) => item._count),
    };

    res.status(200).json({
      success: true,
      data,
      message: 'Category distribution retrieved successfully',
    });
  } catch (error) {
    console.error('Category Distribution Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category distribution',
      error: error.message,
    });
  }
};

// ✅ GET TICKETS RESOLUTION TRENDS (Last 7 Days)
export const getTicketsResolutionTrends = async (req, res) => {
  try {
    const today = new Date();
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    const dayData = {};
    last7Days.forEach((day) => {
      dayData[day] = 0;
    });

    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: new Date(last7Days[0]),
        },
      },
      select: {
        createdAt: true,
      },
    });

    tickets.forEach((ticket) => {
      const dateStr = ticket.createdAt.toISOString().split('T')[0];
      if (dayData.hasOwnProperty(dateStr)) {
        dayData[dateStr]++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        dates: last7Days,
        counts: last7Days.map((day) => dayData[day]),
      },
      message: 'Resolution trends retrieved successfully',
    });
  } catch (error) {
    console.error('Resolution Trends Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching resolution trends',
      error: error.message,
    });
  }
};

// ✅ GET ADMIN RECENT ACTIVITIES
export const getAdminRecentActivities = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      select: {
        id: true,
        type: true,
        details: true,
        oldValue: true,
        newValue: true,
        createdAt: true,
        userId: true,
        ticketId: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        activities: activities || [],
      },
      message: 'Recent activities retrieved successfully',
    });
  } catch (error) {
    console.error('Recent Activities Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activities',
      error: error.message,
    });
  }
};

// ✅ EXPORT REPORT TO PDF
export const exportReportToPDF = async (req, res) => {
  try {
    // Fetch all necessary data
    const stats = await getReportStats();
    const tickets = await prisma.ticket.findMany({
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
        assignedTo: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'PDF export endpoint ready',
        note: 'Implement with jsPDF/pdfkit library',
        reportData: {
          stats,
          ticketsCount: tickets.length,
          generatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Export PDF Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting report',
      error: error.message,
    });
  }
};

// ============================================
// USER REPORTS CONTROLLERS
// ============================================

// ✅ GET USER DASHBOARD STATISTICS
export const getUserDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userTickets = await prisma.ticket.findMany({
      where: { createdById: userId },
    });

    const totalTickets = userTickets.length;
    const resolved = userTickets.filter(
      (t) => t.status === 'closed' || t.status === 'resolved'
    ).length;
    const openTickets = userTickets.filter((t) => t.status === 'open').length;
    const inProgress = userTickets.filter(
      (t) => t.status === 'in_progress'
    ).length;
    // In getUserDashboardStats function, add tracking:
    try {
       // Log that user viewed their reports
       await prisma.activity.create({
            data: {
               type: 'user_viewed_reports',
               userId: req.user.id,
               details: `User accessed reports page`
           }
        });
    } catch (err) {
       console.warn('Could not log report view:', err);
    }

    let avgResolutionTime = 0;
    let resolvedCount = 0;

    userTickets.forEach((ticket) => {
      if (ticket.status === 'closed' || ticket.status === 'resolved') {
        const created = new Date(ticket.createdAt);
        const closed = new Date(ticket.updatedAt);
        const timeInDays = (closed - created) / (1000 * 60 * 60 * 24);
        avgResolutionTime += timeInDays;
        resolvedCount++;
      }
    });

    if (resolvedCount > 0) {
      avgResolutionTime = (avgResolutionTime / resolvedCount).toFixed(1);
    }

    res.status(200).json({
      success: true,
      data: {
        totalTickets,
        resolved,
        openTickets,
        inProgress,
        avgResolutionTime: `${avgResolutionTime} days`,
      },
      message: 'User statistics retrieved successfully',
    });
  } catch (error) {
    console.error('User Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics',
      error: error.message,
    });
  }
};

// ✅ GET USER TICKETS ANALYTICS
export const getUserTicketsAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const userTickets = await prisma.ticket.findMany({
      where: { createdById: userId },
      select: {
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // By status
    const byStatus = {};
    userTickets.forEach((ticket) => {
      byStatus[ticket.status] = (byStatus[ticket.status] || 0) + 1;
    });

    // By priority
    const byPriority = {};
    userTickets.forEach((ticket) => {
      byPriority[ticket.priority] = (byPriority[ticket.priority] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        totalTickets: userTickets.length,
        byStatus: Object.entries(byStatus).map(([status, count]) => ({
          status,
          count,
        })),
        byPriority: Object.entries(byPriority).map(([priority, count]) => ({
          priority,
          count,
        })),
      },
      message: 'User analytics retrieved successfully',
    });
  } catch (error) {
    console.error('User Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user analytics',
      error: error.message,
    });
  }
};

// ✅ GET USER TICKETS BY STATUS
export const getUserTicketsByStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const statusDistribution = await prisma.ticket.groupBy({
      by: ['status'],
      where: { createdById: userId },
      _count: true,
    });

    const data = {
      statuses: statusDistribution.map((item) => item.status),
      counts: statusDistribution.map((item) => item._count),
    };

    res.status(200).json({
      success: true,
      data,
      message: 'User status distribution retrieved successfully',
    });
  } catch (error) {
    console.error('User Status Distribution Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user status distribution',
      error: error.message,
    });
  }
};

// ✅ GET USER TICKETS SUBMISSION TRENDS
export const getUserTicketsSubmissionTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    const dayData = {};
    last7Days.forEach((day) => {
      dayData[day] = 0;
    });

    const userTickets = await prisma.ticket.findMany({
      where: {
        createdById: userId,
        createdAt: {
          gte: new Date(last7Days[0]),
        },
      },
      select: {
        createdAt: true,
      },
    });

    userTickets.forEach((ticket) => {
      const dateStr = ticket.createdAt.toISOString().split('T')[0];
      if (dayData.hasOwnProperty(dateStr)) {
        dayData[dateStr]++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        dates: last7Days,
        counts: last7Days.map((day) => dayData[day]),
      },
      message: 'User submission trends retrieved successfully',
    });
  } catch (error) {
    console.error('User Submission Trends Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user submission trends',
      error: error.message,
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getReportStats() {
  const totalTickets = await prisma.ticket.count();
  const byStatus = await prisma.ticket.groupBy({
    by: ['status'],
    _count: true,
  });
  const byPriority = await prisma.ticket.groupBy({
    by: ['priority'],
    _count: true,
  });

  return {
    totalTickets,
    byStatus: byStatus.map((item) => ({ status: item.status, count: item._count })),
    byPriority: byPriority.map((item) => ({
      priority: item.priority,
      count: item._count,
    })),
  };
}