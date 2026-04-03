import express from 'express';
import { body, validationResult } from 'express-validator';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';
import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const router = express.Router();

// ========== SETTINGS MODEL (Store in database) ==========
// Ensure you have a Settings model in your Prisma schema

// ========== GET SETTINGS ==========
router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = {
        general: { systemName: 'FixBuddy', timezone: 'UTC', dateFormat: 'DD/MM/YYYY' },
        email: { smtpPort: '587' },
        security: { minPasswordLength: 8, sessionTimeout: 30 },
        notifications: { digestFrequency: 'daily' },
        appearance: { itemsPerPage: 25 }
      };
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
});

// ========== UPDATE SETTINGS ==========
router.put('/', adminAuthMiddleware, async (req, res) => {
  try {
    const { general, email, security, notifications, appearance } = req.body;

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          general: general || {},
          email: email || {},
          security: security || {},
          notifications: notifications || {},
          appearance: appearance || {}
        }
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          general: general || settings.general,
          email: email || settings.email,
          security: security || settings.security,
          notifications: notifications || settings.notifications,
          appearance: appearance || settings.appearance
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating settings',
      error: error.message
    });
  }
});

// ========== TEST EMAIL ==========
router.post('/test-email', adminAuthMiddleware, async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();

    if (!settings || !settings.email.smtpHost) {
      return res.status(400).json({
        success: false,
        message: 'Email settings not configured'
      });
    }

    const transporter = nodemailer.createTransport({
      host: settings.email.smtpHost,
      port: settings.email.smtpPort,
      secure: settings.email.smtpPort === '465',
      auth: {
        user: settings.email.smtpUser,
        pass: settings.email.smtpPassword
      }
    });

    await transporter.sendMail({
      from: settings.email.emailFrom || settings.email.smtpUser,
      to: req.user.email,
      subject: `${settings.email.emailSubjectPrefix || '[FixBuddy]'} Test Email`,
      html: '<h1>Test Email</h1><p>This is a test email from FixBuddy. Your email settings are configured correctly!</p>'
    });

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: error.message
    });
  }
});

// ========== GET ADMIN PROFILE ==========
router.get('/admin/profile/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

// ========== UPDATE ADMIN PROFILE ==========
router.put('/admin/profile/:id', adminAuthMiddleware, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().isLength({ min: 10 }).withMessage('Phone must be at least 10 characters'),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, phone, currentPassword, newPassword } = req.body;
    const adminId = parseInt(req.params.id);

    const admin = await prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check password if updating password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password'
        });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedAdmin = await prisma.user.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// ========== DELETE ADMIN ACCOUNT ==========
router.delete('/admin/profile/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);

    const admin = await prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    await prisma.user.delete({
      where: { id: adminId }
    });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
});

export default router;