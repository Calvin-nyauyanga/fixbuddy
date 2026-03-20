import prisma from '../config/database.js';

// ✅ CREATE TICKET - Create a new support ticket
export const createTicket = async (req, res) => {
  try {
    const { title, description, priority, category } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
    }

    if (title.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 5 characters',
      });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters',
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Priority must be one of: ${validPriorities.join(', ')}`,
      });
    }

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        category: category || 'General',
        status: 'open',
        createdById: req.user.id, // User creating the ticket
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

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Create Ticket Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating ticket',
      error: error.message,
    });
  }
};

// ✅ GET ALL TICKETS - Fetch all tickets with filters
export const getAllTickets = async (req, res) => {
  try {
    const { status, priority, category, search, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filters = {};

    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;

    // Search in title or description
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalTickets = await prisma.ticket.count({
      where: filters,
    });

    // Fetch tickets
    const tickets = await prisma.ticket.findMany({
      where: filters,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        comments: {
          select: { id: true, content: true, createdAt: true },
          take: 2, // Get last 2 comments
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    res.status(200).json({
      success: true,
      message: 'Tickets fetched successfully',
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
    console.error('Get All Tickets Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tickets',
      error: error.message,
    });
  }
};

// ✅ GET SINGLE TICKET - Get ticket by ID with all details
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket ID',
      });
    }

    // Fetch ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
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
          orderBy: { createdAt: 'asc' },
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
      message: 'Ticket fetched successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Get Ticket By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching ticket',
      error: error.message,
    });
  }
};

// ✅ UPDATE TICKET - Update ticket details (status, priority, category)
export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, category } = req.body;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket ID',
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

    // Check permissions - only creator, assigned agent, or admin can update
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (
      ticket.createdById !== req.user.id &&
      ticket.assignedToId !== req.user.id &&
      user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this ticket',
      });
    }

    // Validate priority if provided
    if (priority) {
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: `Priority must be one of: ${validPriorities.join(', ')}`,
        });
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['open', 'in_progress', 'closed', 'on_hold'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`,
        });
      }
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(category && { category }),
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

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      data: updatedTicket,
    });
  } catch (error) {
    console.error('Update Ticket Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating ticket',
      error: error.message,
    });
  }
};

// ✅ DELETE TICKET - Delete a ticket
export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket ID',
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

    // Check permissions - only creator or admin can delete
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (ticket.createdById !== req.user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this ticket',
      });
    }

    // Delete ticket (comments will be deleted due to CASCADE in schema)
    await prisma.ticket.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully',
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

// ✅ ASSIGN TICKET - Assign ticket to an agent
export const assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    // Validate inputs
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket ID',
      });
    }

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: 'Agent ID is required',
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

    // Check if agent exists and has agent/admin role
    const agent = await prisma.user.findUnique({
      where: { id: parseInt(agentId) },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    if (!['agent', 'admin'].includes(agent.role)) {
      return res.status(400).json({
        success: false,
        message: 'Only agents or admins can be assigned tickets',
      });
    }

    // Check permissions - only admin or ticket creator can assign
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (ticket.createdById !== req.user.id && currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to assign this ticket',
      });
    }

    // Assign ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        assignedToId: parseInt(agentId),
        status: 'in_progress', // Auto-set status when assigned
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

    res.status(200).json({
      success: true,
      message: `Ticket assigned to ${agent.name} successfully`,
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

// ✅ GET USER'S TICKETS - Get all tickets created by current user
export const getUserTickets = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;

    // Build filter
    const filters = {
      createdById: req.user.id,
    };

    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const totalTickets = await prisma.ticket.count({
      where: filters,
    });

    // Fetch user's tickets
    const tickets = await prisma.ticket.findMany({
      where: filters,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        comments: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    res.status(200).json({
      success: true,
      message: 'Your tickets fetched successfully',
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
    console.error('Get User Tickets Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your tickets',
      error: error.message,
    });
  }
};