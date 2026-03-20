import prisma from '../config/database.js';

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

// ✅ GET RECENT ACTIVITIES
export const getRecentActivities = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        activities,
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
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
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

// ✅ GET ALL USERS (For assigning tickets)
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, limit = 50 } = req.query;

    const filters = {
      role: role || { in: ['agent', 'admin'] }, // Only show agents and admins
    };

    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: filters,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      take: parseInt(limit),
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: {
        users,
      },
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: error.message,
    });
  }
};

// ✅ GET NOTIFICATIONS
export const getNotifications = async (req, res) => {
  try {
    // Get unread comments/responses for assigned tickets
    const assignedTickets = await prisma.ticket.findMany({
      where: {
        assignedToId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        comments: {
          select: { id: true, content: true, createdAt: true, type: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const notifications = assignedTickets
      .flatMap((ticket) =>
        ticket.comments.map((comment) => ({
          id: comment.id,
          type: 'ticket_response',
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          message: `New response on ticket: ${ticket.title}`,
          createdAt: comment.createdAt,
          is_read: false,
        }))
      )
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20); // Limit to 20 notifications

    res.status(200).json({
      success: true,
      data: {
        notifications,
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

// ============================================
// END OF HELPDESK CONTROLLERS
// ============================================