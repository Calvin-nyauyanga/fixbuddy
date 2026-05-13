import prisma from '../config/prisma.js';

// ✅ GET QUEUE STATUS BY CATEGORY
export const getQueueStatus = async (req, res) => {
  try {
    // First, get all tickets to understand the data structure
    const allTickets = await prisma.ticket.findMany({
      select: {
        id: true,
        category: true,
        status: true,
      },
      take: 100, // Limit to first 100 for debugging
    });

    console.log('📋 All Tickets Sample:', allTickets);

    // Count tickets by category (case-insensitive)
    // Note: Using OR conditions to handle different case variations
    const generalCount = await prisma.ticket.count({
      where: {
        OR: [
          { category: 'General' },
          { category: 'general' },
          { category: null } // Default category
        ],
        status: { in: ['open', 'in_progress'] },
      },
    });

    const technicalCount = await prisma.ticket.count({
      where: {
        OR: [
          { category: 'Technical' },
          { category: 'technical' }
        ],
        status: { in: ['open', 'in_progress'] },
      },
    });

    const billingCount = await prisma.ticket.count({
      where: {
        OR: [
          { category: 'Billing' },
          { category: 'billing' }
        ],
        status: { in: ['open', 'in_progress'] },
      },
    });

    const totalQueued = generalCount + technicalCount + billingCount;

    const queueData = {
      general: generalCount,
      technical: technicalCount,
      billing: billingCount,
      total: totalQueued
    };

    console.log('📊 Queue Status Result:', queueData);

    res.status(200).json({
      success: true,
      data: queueData,
    });
  } catch (error) {
    console.error('Get Queue Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching queue status',
      error: error.message,
    });
  }
};

// ✅ GET TEAM AVAILABILITY STATUS
export const getTeamStatus = async (req, res) => {
  try {
    // Fetch all agents (role = 'agent' or 'staff')
    const agents = await prisma.user.findMany({
      where: { 
        role: { in: ['agent', 'staff'] }
      },
      select: {
        id: true,
        name: true,
        teamStatus: true, // ✅ FIXED: Using teamStatus field (available, on-break, away, offline)
        status: true,     // account status (active/suspended)
        ticketsAssigned: {
          where: { status: { not: 'closed' } },
          select: { id: true },
        },
      },
    });

    // Count agents by TEAM STATUS (available, on-break, away, offline)
    const statusCounts = {
      available: 0,
      'on-break': 0,
      away: 0,
      offline: 0,
    };

    agents.forEach((agent) => {
      // ✅ FIXED: Check teamStatus field directly
      const teamStatus = agent.teamStatus || 'offline';
      
      // Count based on actual team status
      if (statusCounts.hasOwnProperty(teamStatus)) {
        statusCounts[teamStatus]++;
      } else {
        // Default to offline if invalid status
        statusCounts.offline++;
      }
    });

    // Calculate capacity usage
    const totalAgents = agents.length;
    const totalAssignedTickets = agents.reduce(
      (sum, agent) => sum + agent.ticketsAssigned.length,
      0
    );
    const avgTicketsPerAgent = totalAgents > 0 ? totalAssignedTickets / totalAgents : 0;
    // Assume max 5 tickets per agent for capacity calculation
    const capacityUsage = Math.min(Math.round((avgTicketsPerAgent / 5) * 100), 100);

    console.log('📊 Team Status Debug:', {
      totalAgents,
      statusCounts,
      totalAssignedTickets,
      avgTicketsPerAgent,
      capacityUsage,
    });

    res.status(200).json({
      success: true,
      data: {
        agentsAvailable: statusCounts.available,
        agentsBreak: statusCounts['on-break'],
        agentsAway: statusCounts.away,
        agentsOffline: statusCounts.offline,
        totalAgents: totalAgents,
        capacityUsage: capacityUsage,
        buffer: 100 - capacityUsage,
      },
    });
  } catch (error) {
    console.error('Get Team Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team status',
      error: error.message,
    });
  }
};

// ✅ UPDATE AGENT STATUS (Available, On Break, Away, Offline)
export const updateAgentStatus = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['available', 'on_break', 'away', 'offline'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    // Update agent status
    const updatedAgent = await prisma.user.update({
      where: { id: parseInt(agentId) },
      data: { status: status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Agent status updated successfully',
      data: updatedAgent,
    });
  } catch (error) {
    console.error('Update Agent Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating agent status',
      error: error.message,
    });
  }
};

// ✅ GET COMBINED DASHBOARD DATA (Queue + Team Status)
export const getDashboardData = async (req, res) => {
  try {
    // Get queue status
    const categories = ['general', 'technical', 'billing'];
    const queueData = {};
    let totalQueued = 0;

    for (const category of categories) {
      const count = await prisma.ticket.count({
        where: {
          category: category,
          status: { in: ['open', 'in_progress'] },
        },
      });
      queueData[category] = count;
      totalQueued += count;
    }

    // Get team status
    const agents = await prisma.user.findMany({
      where: { role: { in: ['agent', 'staff'] } },
      select: {
        id: true,
        name: true,
        teamStatus: true, // ✅ FIXED: Using teamStatus field
        ticketsAssigned: {
          where: { status: { not: 'closed' } },
          select: { id: true },
        },
      },
    });

    const statusCounts = {
      available: 0,
      'on-break': 0,
      away: 0,
      offline: 0,
    };

    agents.forEach((agent) => {
      // ✅ FIXED: Check teamStatus field directly
      const teamStatus = agent.teamStatus || 'offline';
      if (statusCounts.hasOwnProperty(teamStatus)) {
        statusCounts[teamStatus]++;
      } else {
        statusCounts.offline++;
      }
    });

    const totalAgents = agents.length;
    const totalAssignedTickets = agents.reduce(
      (sum, agent) => sum + agent.ticketsAssigned.length,
      0
    );
    const capacityUsage = Math.min(
      Math.round(((totalAssignedTickets / (totalAgents * 3)) || 0) * 100),
      100
    );

    res.status(200).json({
      success: true,
      data: {
        queue: {
          general: queueData['general'] || 0,
          technical: queueData['technical'] || 0,
          billing: queueData['billing'] || 0,
          total: totalQueued,
        },
        team: {
          available: statusCounts.available,
          on_break: statusCounts['on-break'],
          away: statusCounts.away,
          offline: statusCounts.offline,
          total: totalAgents,
          capacityUsage: capacityUsage,
          buffer: 100 - capacityUsage,
        },
      },
    });
  } catch (error) {
    console.error('Get Dashboard Data Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message,
    });
  }
};