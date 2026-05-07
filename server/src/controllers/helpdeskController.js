import prisma from '../config/prisma.js';

// ============================================
// ADMIN HELPDESK CONTROLLERS
// ============================================

// ✅ GET ALL TICKETS (Admin View)
export const getAllTicketsAdmin = async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 10 } = req.query;

    // Build filters
    const filters = {};

    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { createdBy: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const totalTickets = await prisma.ticket.count({
      where: filters,
    });

    // Fetch tickets with all details
    const tickets = await prisma.ticket.findMany({
      where: filters,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    res.status(200).json({
      success: true,
      message: 'All tickets retrieved successfully',
      data: {
        tickets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalTickets,
          totalPages: Math.ceil(totalTickets / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get All Tickets Admin Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tickets',
      error: error.message,
    });
  }
};

// ✅ GET DASHBOARD STATISTICS
export const getDashboardStats = async (req, res) => {
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
        createdAt: {
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
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message,
    });
  }
};

/// ✅ GET RECENT ACTIVITIES (WITH USER NAME AND TICKET INFO)
export const getRecentActivities = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        ticket: {
          select: {
            id: true,
            title: true,
            createdBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Format activities for display
    const formattedActivities = activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      user_name: activity.user?.name || 'System',
      user_email: activity.user?.email,
      user_role: activity.user?.role,
      ticket_id: activity.ticket?.id ? `#${activity.ticket.id}` : null,
      ticket_title: activity.ticket?.title,
      ticket_creator: activity.ticket?.createdBy?.name,
      details: activity.details,
      oldValue: activity.oldValue,
      newValue: activity.newValue,
      created_at: activity.createdAt,
      createdAt: activity.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        activities: formattedActivities || [],
      },
    });
  } catch (error) {
    console.error('Get Activities Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activities',
      error: error.message,
    });
  }
};

// ✅ ADD RESPONSE TO TICKET
export const addTicketResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, responseType = 'admin' } = req.body;

    // Validation
    if (!response || response.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Response text is required',
      });
    }

    // Find ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Create comment (response)
    const comment = await prisma.comment.create({
      data: {
        content: response,
        ticketId: parseInt(id),
        userId: req.user.id,
        type: responseType,
      },
      select: {
        id: true,
        content: true,
        type: true,
        userId: true,
        ticketId: true,
        createdAt: true,
      },
    });

    // Log activity
    try {
      await prisma.activity.create({
        data: {
          type: 'ticket_response',
          userId: req.user.id,
          ticketId: parseInt(id),
          details: `Response added to ticket #${id}`,
          createdAt: new Date(),
        },
      });
    } catch (err) {
      console.warn('Could not log activity:', err);
    }

    res.status(201).json({
      success: true,
      message: 'Response added successfully',
      data: comment,
    });
  } catch (error) {
    console.error('Add Response Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding response',
      error: error.message,
    });
  }
};

// ✅ SOLVE TICKET
export const solveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { solution } = req.body;

    // Validation
    if (!solution || solution.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Solution description is required',
      });
    }

    // Find ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Add solution as a comment
    await prisma.comment.create({
      data: {
        content: `[SOLUTION] ${solution}`,
        ticketId: parseInt(id),
        userId: req.user.id,
        type: 'solution',
      },
    });

    // Update ticket status to closed
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        status: 'closed',
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log activity
    try {
      await prisma.activity.create({
        data: {
          type: 'ticket_solved',
          userId: req.user.id,
          ticketId: parseInt(id),
          details: `Ticket #${id} marked as solved`,
          createdAt: new Date(),
        },
      });
    } catch (err) {
      console.warn('Could not log activity:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Ticket marked as solved',
      data: updatedTicket,
    });
  } catch (error) {
    console.error('Solve Ticket Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while solving ticket',
      error: error.message,
    });
  }
};

// ✅ CLOSE TICKET
export const closeTicket = async (req, res) => {
  try {
    const { id } = req.params;

    // Find ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Close ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        status: 'closed',
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity
    try {
      await prisma.activity.create({
        data: {
          type: 'ticket_closed',
          userId: req.user.id,
          ticketId: parseInt(id),
          details: `Ticket #${id} closed`,
          createdAt: new Date(),
        },
      });
    } catch (err) {
      console.warn('Could not log activity:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Ticket closed successfully',
      data: updatedTicket,
    });
  } catch (error) {
    console.error('Close Ticket Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while closing ticket',
      error: error.message,
    });
  }
};

// ✅ GET NOTIFICATIONS
export const getNotifications = async (req, res) => {
  try {
    // Get recent activities related to user
    const activities = await prisma.activity.findMany({
      where: {
        OR: [
          { userId: req.user.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        type: true,
        details: true,
        ticketId: true,
        createdAt: true,
      },
    });

    const notifications = activities.map((activity) => ({
      id: activity.id,
      type: activity.type || 'notification',
      message: activity.details,
      ticketId: activity.ticketId,
      createdAt: activity.createdAt,
      read: false,
    }));

    res.status(200).json({
      success: true,
      data: {
        notifications: notifications || [],
        count: notifications.length,
      },
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications',
      error: error.message,
    });
  }
}; 
// ✅ UPDATE TICKET PRIORITY
export const updateTicketPriority = async (req, res) => {
  console.log('updateTicketPriority called with id:', req.params.id, 'priority:', req.body.priority);
  try {
    const { id } = req.params;
    const { priority } = req.body;

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority value',
      });
    }

    // Get old priority before updating
    const oldTicket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
    });

    if (!oldTicket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { priority },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity BEFORE sending response
    console.log('Creating priority_changed activity for ticket', id, 'user', req.user.id);
    if (!req.user || !req.user.id) {
      throw new Error('User not authenticated for activity logging');
    }
    const activity = await prisma.activity.create({
      data: {
        type: 'priority_changed',
        userId: req.user.id,
        ticketId: parseInt(id),
        details: `Priority changed from ${oldTicket.priority} to ${priority}`,
        oldValue: oldTicket.priority,
        newValue: priority,
      },
    });
    console.log('Priority activity created:', activity.id);

    res.status(200).json({
      success: true,
      message: 'Priority updated successfully',
      data: updatedTicket,
    });
  } catch (error) {
    console.error('Update Priority Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating priority',
      error: error.message,
    });
  }
};

// ✅ UPDATE TICKET STATUS
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['open', 'in_progress', 'closed', 'on_hold'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    // Get old status before updating
    const oldTicket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
    });

    if (!oldTicket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity BEFORE sending response
    console.log('Creating status_changed activity for ticket', id, 'user', req.user.id);
    await prisma.activity.create({
      data: {
        type: 'status_changed',
        userId: req.user.id,
        ticketId: parseInt(id),
        details: `Status changed from ${oldTicket.status} to ${status}`,
        oldValue: oldTicket.status,
        newValue: status,
      },
    });
    console.log('Status activity created');

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: updatedTicket,
    });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status',
      error: error.message,
    });
  }
};
// ✅ GET TICKET DETAILS BY ID
export const getTicketDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Get Ticket Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching ticket',
      error: error.message,
    });
  }
};

// ✅ DELETE TICKET
export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    // Find ticket first
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Delete all comments (responses) first
    await prisma.comment.deleteMany({
      where: { ticketId: parseInt(id) },
    });

    // Delete all activities related to this ticket
    await prisma.activity.deleteMany({
      where: { ticketId: parseInt(id) },
    });

    // Delete the ticket
    await prisma.ticket.delete({
      where: { id: parseInt(id) },
    });

    // Log activity for deletion
    try {
      await prisma.activity.create({
        data: {
          type: 'ticket_deleted',
          userId: req.user.id,
          details: `Ticket #${id} deleted`,
          createdAt: new Date(),
        },
      });
    } catch (err) {
      console.warn('Could not log deletion activity:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully',
      data: { deletedTicketId: id },
    });
  } catch (error) {
    console.error('Delete Ticket Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting ticket',
      error: error.message,
    });
  }
};

// ✅ ASSIGN TICKET TO AGENT
export const assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    // Find ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        assignedToId: parseInt(assignedTo),
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Log activity
    try {
      await prisma.activity.create({
        data: {
          type: 'ticket_assigned',
          userId: req.user.id,
          ticketId: parseInt(id),
          details: `Ticket #${id} assigned to agent ${updatedTicket.assignedTo?.name}`,
        },
      });
    } catch (err) {
      console.warn('Could not log activity:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Ticket assigned successfully',
      data: updatedTicket,
    });
  } catch (error) {
    console.error('Assign Ticket Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning ticket',
      error: error.message,
    });
  }
};

// ✅ GET TICKET ANALYTICS
export const getTicketAnalytics = async (req, res) => {
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
        const hours = (ticket.updatedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
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
        byStatus: byStatus.map(item => ({ status: item.status, count: item._count })),
        byPriority: byPriority.map(item => ({ priority: item.priority, count: item._count })),
      },
    });
  } catch (error) {
    console.error('Get Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics',
      error: error.message,
    });
  }
};

// ============================================
// END OF HELPDESK CONTROLLERS
// ============================================