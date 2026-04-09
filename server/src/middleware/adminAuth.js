/**
 * Admin Authorization Middleware
 * Checks if user is authenticated AND has admin role
 */

import jwt from 'jsonwebtoken';

export const adminAuthMiddleware = async (req, res, next) => {
  console.log('Admin auth middleware called for:', req.path);
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user has admin role (will be added to token payload)
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const userId = parseInt(decoded.id ?? decoded.userId, 10);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
      });
    }

    req.user = { ...decoded, id: userId };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
};