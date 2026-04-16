// server/src/controllers/darkmodeController.js

import prisma from '../config/prisma.js';

/**
 * Get user's darkmode preference
 * GET /api/darkmode/preference
 */
export const getUserDarkmodePreference = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User not authenticated.'
      });
    }

    // Get user's darkmode preference from settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        darkMode: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        darkMode: user.darkMode ?? false,
        message: user.darkMode ? 'Dark mode is enabled' : 'Light mode is active'
      }
    });
  } catch (error) {
    console.error('Get Darkmode Preference Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching darkmode preference',
      error: error.message
    });
  }
};

/**
 * Update user's darkmode preference
 * PUT /api/darkmode/preference
 */
export const updateUserDarkmodePreference = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { darkMode } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User not authenticated.'
      });
    }

    // Validate input
    if (typeof darkMode !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input. darkMode must be a boolean value (true or false)'
      });
    }

    // Update user's darkmode preference
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { darkMode },
      select: {
        id: true,
        email: true,
        darkMode: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: darkMode ? 'Dark mode enabled' : 'Light mode enabled',
      data: {
        userId: updatedUser.id,
        email: updatedUser.email,
        darkMode: updatedUser.darkMode,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Update Darkmode Preference Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating darkmode preference',
      error: error.message
    });
  }
};

/**
 * Toggle user's darkmode preference
 * POST /api/darkmode/toggle
 */
export const toggleUserDarkmodePreference = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User not authenticated.'
      });
    }

    // Get current preference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { darkMode: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Toggle preference
    const newDarkMode = !user.darkMode;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { darkMode: newDarkMode },
      select: {
        id: true,
        email: true,
        darkMode: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: newDarkMode ? 'Dark mode enabled' : 'Light mode enabled',
      data: {
        userId: updatedUser.id,
        email: updatedUser.email,
        darkMode: updatedUser.darkMode,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Toggle Darkmode Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling darkmode',
      error: error.message
    });
  }
};

/**
 * Get all users' darkmode preferences (Admin only)
 * GET /api/darkmode/all
 */
export const getAllUsersDarkmodePreferences = async (req, res) => {
  try {
    const requestingUser = req.user;

    // Check if user is admin
    if (requestingUser?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only admins can view all preferences.'
      });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        darkMode: true,
        role: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const stats = {
      totalUsers: users.length,
      darkModeEnabled: users.filter(u => u.darkMode).length,
      lightModeEnabled: users.filter(u => !u.darkMode).length
    };

    res.status(200).json({
      success: true,
      data: {
        users,
        stats
      }
    });
  } catch (error) {
    console.error('Get All Darkmode Preferences Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching darkmode preferences',
      error: error.message
    });
  }
};