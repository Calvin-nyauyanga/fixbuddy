import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { generateToken } from '../utils/jwt.js';

// SIGN UP
export const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    const missingSignup = [];
    if (!name) missingSignup.push('name');
    if (!email) missingSignup.push('email');
    if (!password) missingSignup.push('password');
    if (!confirmPassword) missingSignup.push('confirmPassword');

    if (missingSignup.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missingSignup.join(', ')}`,
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'user', // Default role
      },
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during signup',
      error: error.message,
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    const missingLogin = [];
    if (!email) missingLogin.push('email');
    if (!password) missingLogin.push('password');
    if (missingLogin.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missingLogin.join(', ')}`,
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// GET CURRENT USER PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
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
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: error.message,
    });
  }
  // ============================================
// ADMIN AUTHENTICATION FUNCTIONS
// ============================================

// ADMIN LOGIN WITH 2FA
export const adminLogin = async (req, res) => {
  try {
    const { email, password, adminCode } = req.body;

    // Validation
    const missingFields = [];
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');
    if (!adminCode) missingFields.push('adminCode');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missingFields.join(', ')}`,
      });
    }

    // Validate admin code (6 digits)
    if (!/^\d{6}$/.test(adminCode)) {
      return res.status(400).json({
        success: false,
        message: 'Admin code must be exactly 6 digits',
      });
    }

    // Find admin user
    const admin = await prisma.user.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin email or password',
      });
    }

    // Check if user has admin role
    if (admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin users can access this endpoint',
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin email or password',
      });
    }

    // TODO: Verify 2FA code (integrate with your 2FA service)
    // For now, we'll accept any 6-digit code
    // In production, verify against OTP stored in DB or 2FA service
    const isCodeValid = true; // Replace with actual 2FA verification

    if (!isCodeValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin code',
      });
    }

    // Generate token with admin role
    const token = generateToken(admin.id, admin.role);

    // Log admin login activity
    try {
      await prisma.activity.create({
        data: {
          type: 'admin_login',
          userId: admin.id,
          details: `Admin ${admin.name} logged in`,
          createdAt: new Date(),
        },
      });
    } catch (err) {
      console.warn('Could not log admin activity:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during admin login',
      error: error.message,
    });
  }
};

// GET ADMIN PROFILE
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    if (admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'User is not an admin',
      });
    }

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ADMIN LOGOUT
export const adminLogout = async (req, res) => {
  try {
    // Log admin logout activity
    try {
      const admin = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (admin) {
        await prisma.activity.create({
          data: {
            type: 'admin_logout',
            userId: req.user.id,
            details: `Admin ${admin.name} logged out`,
            createdAt: new Date(),
          },
        });
      }
    } catch (err) {
      console.warn('Could not log admin logout:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Admin logout successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: error.message,
    });
  }
};

// ============================================
// END OF ADMIN FUNCTIONS
// ============================================
};