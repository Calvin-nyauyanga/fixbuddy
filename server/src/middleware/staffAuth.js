/**
 * Staff Authorization Middleware
 * Allows staff/agent/admin to access endpoints with different permission levels
 */

import jwt from 'jsonwebtoken';

export const staffAuthMiddleware = async (req, res, next) => {
  console.log('Staff auth middleware called for:', req.path);
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
    
    // Check if user has admin, staff, or agent role
    if (decoded.role !== 'admin' && decoded.role !== 'staff' && decoded.role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Staff, Agent, or Admin access required',
      });
    }

    req.user = decoded;
    req.isAdmin = decoded.role === 'admin';
    req.isStaff = decoded.role === 'staff' || decoded.role === 'agent';
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
};