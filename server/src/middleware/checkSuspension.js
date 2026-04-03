// server/src/middleware/checkSuspension.js

import prisma from '../config/prisma.js';

export const checkSuspension = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};