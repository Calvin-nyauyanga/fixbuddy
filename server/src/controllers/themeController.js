import prisma from '../config/prisma.js';

// ============================================
// GET USER DARK MODE PREFERENCE
// ============================================
export const getDarkModePreference = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        darkmode: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        darkmode: user.darkmode,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dark mode preference',
      error: error.message,
    });
  }
};

// ============================================
// UPDATE USER DARK MODE PREFERENCE
// ============================================
export const updateDarkModePreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const { darkmode } = req.body;

    // Validation
    if (typeof darkmode !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'darkmode must be a boolean value (true or false)',
      });
    }

    // Update user dark mode preference
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        darkmode: darkmode,
      },
      select: {
        id: true,
        darkmode: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Dark mode preference updated successfully',
      data: {
        darkmode: updatedUser.darkmode,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating dark mode preference',
      error: error.message,
    });
  }
};

// ============================================
// TOGGLE DARK MODE
// ============================================
export const toggleDarkMode = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { darkmode: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Toggle dark mode
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        darkmode: !user.darkmode,
      },
      select: {
        id: true,
        darkmode: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Dark mode toggled successfully',
      data: {
        darkmode: updatedUser.darkmode,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while toggling dark mode',
      error: error.message,
    });
  }
};