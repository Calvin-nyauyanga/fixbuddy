import prisma from '../config/prisma.js';
import bcryptjs from 'bcryptjs';
import { validationResult } from 'express-validator';

// ✅ Get all users (for admin dashboard)
export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            message: 'Users fetched successfully',
            count: users.length,
            data: {
                users
            }
        });
    } catch (error) {
        console.error('Get All Users Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// ✅ Get single user by ID
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
                status: true,
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
        console.error('Get User By ID Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// ✅ Search users by name or email
export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query; // Changed from 'query' to 'q'

        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Search results',
            count: users.length,
            data: {
                users
            }
        });
    } catch (error) {
        console.error('Search Users Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching users',
            error: error.message
        });
    }
};

// ✅ Create user (new)
export const createUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, email, password, role } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'user'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
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
            message: 'Error creating user',
            error: error.message
        });
    }
};

// ✅ Update user (edit user details)
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

        // Check if email is already taken
        if (email && email !== user.email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email }
            });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
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
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// ✅ Suspend user (lock account)
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

        // Add a suspended_at timestamp in the future
        // Or you could add a status field to the schema
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                status: 'suspended',
                updatedAt: new Date()
                // You might want to add a 'status' or 'isActive' field to schema
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        // Ensure status is included in response
        const responseData = {
            ...updatedUser,
            status: 'suspended' // Explicitly set status
        };

        res.status(200).json({
            success: true,
            message: 'User suspended successfully',
            data: responseData
        });
    } catch (error) {
        console.error('Suspend User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error suspending user',
            error: error.message
        });
    }
};

// ✅ Activate user (unlock account)
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
            data: {
                status: 'active',
                updatedAt: new Date()
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        // Ensure status is included in response
        const responseData = {
            ...updatedUser,
            status: 'active' // Explicitly set status
        };

        res.status(200).json({
            success: true,
            message: 'User activated successfully',
            data: responseData
        });
    } catch (error) {
        console.error('Activate User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error activating user',
            error: error.message
        });
    }
};

// ✅ Delete user
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

        await prisma.user.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// ✅ Change user role
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
            data: { role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Change Role Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing user role',
            error: error.message
        });
    }
};

// ✅ Get user statistics
export const getUserStats = async (req, res) => {
    try {
        const stats = await prisma.user.groupBy({
            by: ['role'],
            _count: true
        });

        res.status(200).json({
            success: true,
            message: 'User statistics',
            data: stats
        });
    } catch (error) {
        console.error('Get Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

// ✅ Update user status (for team availability)
export const updateUserStatus = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { status, teamStatus } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Staff can only update their own status (unless admin)
        if (req.isStaff && !req.isAdmin && user.id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own status'
            });
        }

        // Build update object
        const updateData = { updatedAt: new Date() };
        
        // ✅ Account Status (only admin can change)
        if (status && req.isAdmin) {
            const validAccountStatuses = ['active', 'suspended'];
            if (!validAccountStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid account status. Valid values: ${validAccountStatuses.join(', ')}`
                });
            }
            updateData.status = status;
        }
        
        // ✅ Team Status (available, on-break, away, offline)
        if (teamStatus) {
            const validTeamStatuses = ['available', 'on-break', 'away', 'offline'];
            if (!validTeamStatuses.includes(teamStatus)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid team status. Valid values: ${validTeamStatuses.join(', ')}`
                });
            }
            updateData.teamStatus = teamStatus;
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                teamStatus: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'User status updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Update User Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user status',
            error: error.message
        });
    }
};

// ✅ Get users by status (for filtering on dashboard)
export const getUsersByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const validStatuses = ['available', 'on-break', 'away', 'offline', 'active', 'suspended'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
            });
        }

        const users = await prisma.user.findMany({
            where: { status: status },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            message: `Users with status: ${status}`,
            count: users.length,
            data: {
                users
            }
        });
    } catch (error) {
        console.error('Get Users By Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users by status',
            error: error.message
        });
    }
};

// ✅ Get team status summary (for Admin Dashboard Team Status widget)
export const getTeamStatus = async (req, res) => {
    try {
        // Count users by status (only staff/admin users)
        const teamMembers = await prisma.user.findMany({
            where: {
                role: { in: ['staff', 'admin'] }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true
            }
        });

        // Aggregate status counts
        const statusCounts = {
            available: 0,
            'on-break': 0,
            away: 0,
            offline: 0,
            suspended: 0
        };

        teamMembers.forEach(member => {
            if (statusCounts.hasOwnProperty(member.status)) {
                statusCounts[member.status]++;
            }
        });

        const totalCapacity = teamMembers.filter(m => m.status === 'available').length;
        const totalTeamMembers = teamMembers.length;
        const capacityPercentage = totalTeamMembers > 0 
            ? Math.round((totalCapacity / totalTeamMembers) * 100) 
            : 0;

        res.status(200).json({
            success: true,
            message: 'Team status summary',
            data: {
                agentsAvailable: statusCounts.available,
                agentsBreak: statusCounts['on-break'],
                agentsAway: statusCounts.away,
                agentsOffline: statusCounts.offline,
                agentsSuspended: statusCounts.suspended,
                totalTeamMembers: totalTeamMembers,
                capacityUsage: capacityPercentage,
                teamMembers: teamMembers
            }
        });
    } catch (error) {
        console.error('Get Team Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching team status',
            error: error.message
        });
    }
};