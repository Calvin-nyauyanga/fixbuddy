/**
 * Permission-based Authorization Middleware
 * Controls what staff vs admin can access
 */

// Staff can perform limited actions
export const staffPermissions = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // Staff restrictions - they can only:
  // - View users
  // - Update their own status
  // - Cannot delete users, change roles, or modify system settings

  const isReadOnly = req.method === 'GET';
  const isStatusUpdate = req.path.includes('/status') && req.method === 'PATCH';
  
  if (req.user.role === 'staff' && !isReadOnly && !isStatusUpdate) {
    return res.status(403).json({
      success: false,
      message: 'Staff members can only view data and update their own status'
    });
  }

  next();
};

// Admin has full access
export const adminPermissions = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};