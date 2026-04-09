import prisma from '../config/prisma.js';

export const getDarkModePreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { darkMode: true }
    });

    return res.json({ darkMode: user?.darkMode ?? false });
  } catch (error) {
    console.error('Dark mode preference error:', error);
    return res.status(500).json({ error: 'Could not retrieve dark mode preference.' });
  }
};

export const setDarkModePreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean value.' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { darkMode: enabled },
      select: { darkMode: true }
    });

    return res.json({ darkMode: user.darkMode });
  } catch (error) {
    console.error('Dark mode update error:', error);
    return res.status(500).json({ error: 'Could not update dark mode preference.' });
  }
};