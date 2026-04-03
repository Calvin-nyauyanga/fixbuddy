import prisma from '../config/database.js';

export const loadSystemSettings = async (req, res, next) => {
  try {
    const settings = await prisma.settings.findFirst();
    req.systemSettings = settings || {
      general: { systemName: 'FixBuddy', timezone: 'UTC' },
      security: { minPasswordLength: 8 },
      notifications: { digestFrequency: 'daily' },
      appearance: { itemsPerPage: 25 }
    };
    next();
  } catch (error) {
    console.error('Error loading settings:', error);
    req.systemSettings = {};
    next();
  }
};