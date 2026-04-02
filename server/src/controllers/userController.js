import prisma from '../config/prisma.js';
import bcryptjs from 'bcryptjs';
import { validationResult } from 'express-validator';

// Get all users (for admin dashboard)
export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.status(200).json({
            success: true,
            message: 'Users fetched successfully',
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// Get single user by ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
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
            message: 'User fetched successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// Search users by name or email
export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Search results',
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching users',
            error: error.message
        });
    }
};

// Update user (edit user details)
export const updateUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { name, email, role } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                name: name || user.name,
                email: email || user.email,
                role: role || user.role
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                updatedAt: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// Suspend/Lock user
export const suspendUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { isActive: false }
        });

        res.status(200).json({
            success: true,
            message: 'User suspended successfully',
            data: {
                id: updatedUser.id,
                name: updatedUser.name,
                status: 'Suspended'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error suspending user',
            error: error.message
        });
    }
};

// Activate/Unsuspend user
export const activateUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { isActive: true }
        });

        res.status(200).json({
            success: true,
            message: 'User activated successfully',
            data: {
                id: updatedUser.id,
                name: updatedUser.name,
                status: 'Active'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error activating user',
            error: error.message
        });
    }
};

// Delete user (soft delete or hard delete)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Hard delete - uncomment if needed
        await prisma.user.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: {
                id: parseInt(id),
                message: 'User account has been removed'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// Change user role
export const changeUserRole = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['user', 'staff', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be: user, staff, or admin'
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { role }
        });

        res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            data: {
                id: updatedUser.id,
                name: updatedUser.name,
                newRole: updatedUser.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error changing user role',
            error: error.message
        });
    }
};

// Get user statistics
export const getUserStats = async (req, res) => {
    try {
        const totalUsers = await prisma.user.count();
        const activeUsers = await prisma.user.count({
            where: { isActive: true }
        });
        const suspendedUsers = await prisma.user.count({
            where: { isActive: false }
        });

        const usersByRole = await prisma.user.groupBy({
            by: ['role'],
            _count: true
        });

        res.status(200).json({
            success: true,
            message: 'User statistics',
            data: {
                totalUsers,
                activeUsers,
                suspendedUsers,
                usersByRole
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user (in production, hash the password!)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: role || 'user'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};