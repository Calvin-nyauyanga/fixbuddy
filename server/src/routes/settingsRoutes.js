import express from 'express';
import { body, validationResult } from 'express-validator';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';
import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const router = express.Router();

// ========== HELPER FUNCTION: Get or Create Default Settings ==========
async function getOrCreateSettings() {
  let settings = await prisma.settings.findFirst();

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        general: {
          systemName: 'FixBuddy Helpdesk',
          systemDescription: 'Professional helpdesk system',
          timezone: 'UTC',
          dateFormat: 'DD/MM/YYYY'
        },
        email: { smtpPort: '587', emailSubjectPrefix: '[FixBuddy]' },
        security: {
          minPasswordLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecial: false,
          sessionTimeout: 30,
          enableTwoFactor: true
        },
        notifications: {
          notifyNewTickets: true,
          notifyTicketUpdates: true,
          notifyNewUsers: false,
          notifyAlerts: true,
          digestFrequency: 'daily'
        },
        appearance: {
          darkMode: false,
          compactMenu: false,
          showAnimations: true,
          itemsPerPage: 25
        }
      }
    });
  }

  return settings;
}

// ========== GET ALL SETTINGS ==========
router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
});

// ========== UPDATE GENERAL SETTINGS ==========
router.put('/general', adminAuthMiddleware, [
  body('systemName').optional().notEmpty().withMessage('System name cannot be empty'),
  body('timezone').optional().isIn(['UTC', 'EST', 'CST', 'MST', 'PST']).withMessage('Invalid timezone')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { systemName, systemDescription, timezone, dateFormat } = req.body;
    const settings = await getOrCreateSettings();

    const updatedSettings = await prisma.settings.update({
      where: { id: settings.id },
      data: {
        general: {
          systemName: systemName || settings.general.systemName,
          systemDescription: systemDescription || settings.general.systemDescription,
          timezone: timezone || settings.general.timezone,
          dateFormat: dateFormat || settings.general.dateFormat
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'General settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Update General Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating general settings',
      error: error.message
    });
  }
});

// ========== UPDATE EMAIL SETTINGS ==========
router.put('/email', adminAuthMiddleware, [
  body('smtpHost').optional().notEmpty().withMessage('SMTP host cannot be empty'),
  body('smtpPort').optional().isInt({ min: 1, max: 65535 }).withMessage('Invalid port'),
  body('smtpUser').optional().isEmail().withMessage('Invalid email address')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { smtpHost, smtpPort, smtpUser, smtpPassword, emailFrom, emailSubjectPrefix } = req.body;
    const settings = await getOrCreateSettings();

    const updatedSettings = await prisma.settings.update({
      where: { id: settings.id },
      data: {
        email: {
          smtpHost: smtpHost || settings.email.smtpHost,
          smtpPort: smtpPort || settings.email.smtpPort,
          smtpUser: smtpUser || settings.email.smtpUser,
          smtpPassword: smtpPassword || settings.email.smtpPassword,
          emailFrom: emailFrom || settings.email.emailFrom,
          emailSubjectPrefix: emailSubjectPrefix || settings.email.emailSubjectPrefix
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Email settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Update Email Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating email settings',
      error: error.message
    });
  }
});

// ========== UPDATE SECURITY SETTINGS ==========
router.put('/security', adminAuthMiddleware, [
  body('minPasswordLength').optional().isInt({ min: 6, max: 20 }).withMessage('Password length must be between 6-20'),
  body('sessionTimeout').optional().isInt({ min: 5, max: 1440 }).withMessage('Session timeout must be between 5-1440 minutes')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { minPasswordLength, requireUppercase, requireNumbers, requireSpecial, sessionTimeout, enableTwoFactor } = req.body;
    const settings = await getOrCreateSettings();

    const updatedSettings = await prisma.settings.update({
      where: { id: settings.id },
      data: {
        security: {
          minPasswordLength: minPasswordLength !== undefined ? minPasswordLength : settings.security.minPasswordLength,
          requireUppercase: requireUppercase !== undefined ? requireUppercase : settings.security.requireUppercase,
          requireNumbers: requireNumbers !== undefined ? requireNumbers : settings.security.requireNumbers,
          requireSpecial: requireSpecial !== undefined ? requireSpecial : settings.security.requireSpecial,
          sessionTimeout: sessionTimeout !== undefined ? sessionTimeout : settings.security.sessionTimeout,
          enableTwoFactor: enableTwoFactor !== undefined ? enableTwoFactor : settings.security.enableTwoFactor
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Security settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Update Security Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating security settings',
      error: error.message
    });
  }
});

// ========== UPDATE NOTIFICATION SETTINGS ==========
router.put('/notifications', adminAuthMiddleware, [
  body('digestFrequency').optional().isIn(['immediate', 'hourly', 'daily', 'weekly', 'disabled']).withMessage('Invalid frequency')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { notifyNewTickets, notifyTicketUpdates, notifyNewUsers, notifyAlerts, digestFrequency } = req.body;
    const settings = await getOrCreateSettings();

    const updatedSettings = await prisma.settings.update({
      where: { id: settings.id },
      data: {
        notifications: {
          notifyNewTickets: notifyNewTickets !== undefined ? notifyNewTickets : settings.notifications.notifyNewTickets,
          notifyTicketUpdates: notifyTicketUpdates !== undefined ? notifyTicketUpdates : settings.notifications.notifyTicketUpdates,
          notifyNewUsers: notifyNewUsers !== undefined ? notifyNewUsers : settings.notifications.notifyNewUsers,
          notifyAlerts: notifyAlerts !== undefined ? notifyAlerts : settings.notifications.notifyAlerts,
          digestFrequency: digestFrequency || settings.notifications.digestFrequency
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Update Notification Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification settings',
      error: error.message
    });
  }
});

// ========== UPDATE APPEARANCE SETTINGS ==========
router.put('/appearance', adminAuthMiddleware, [
  body('itemsPerPage').optional().isInt({ min: 10, max: 100 }).withMessage('Items per page must be between 10-100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { darkMode, compactMenu, showAnimations, itemsPerPage } = req.body;
    const settings = await getOrCreateSettings();

    const updatedSettings = await prisma.settings.update({
      where: { id: settings.id },
      data: {
        appearance: {
          darkMode: darkMode !== undefined ? darkMode : settings.appearance.darkMode,
          compactMenu: compactMenu !== undefined ? compactMenu : settings.appearance.compactMenu,
          showAnimations: showAnimations !== undefined ? showAnimations : settings.appearance.showAnimations,
          itemsPerPage: itemsPerPage || settings.appearance.itemsPerPage
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Appearance settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Update Appearance Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appearance settings',
      error: error.message
    });
  }
});

// ========== TEST EMAIL CONFIGURATION ==========
router.post('/test-email', adminAuthMiddleware, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    if (!settings.email.smtpHost) {
      return res.status(400).json({
        success: false,
        message: 'Email settings not configured. Please configure SMTP settings first.'
      });
    }

    const transporter = nodemailer.createTransport({
      host: settings.email.smtpHost,
      port: parseInt(settings.email.smtpPort),
      secure: settings.email.smtpPort === '465',
      auth: {
        user: settings.email.smtpUser,
        pass: settings.email.smtpPassword
      }
    });

    // Verify connection
    await transporter.verify();

    // Send test email
    await transporter.sendMail({
      from: settings.email.emailFrom || settings.email.smtpUser,
      to: req.user.email,
      subject: `${settings.email.emailSubjectPrefix || '[FixBuddy]'} Test Email`,
      html: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email to verify your SMTP settings are configured correctly.</p>
        <p><strong>Status:</strong> ✅ Email settings are working properly!</p>
        <hr>
        <p><small>Sent from FixBuddy Helpdesk System</small></p>
      `
    });

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully to ' + req.user.email
    });
  } catch (error) {
    console.error('Test Email Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing email configuration',
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
        status: true,
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
    console.error('Get Admin Profile Error:', error);
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

    // Verify current password if changing password
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
        role: true,
        status: true
      }
    });

    // Log activity
    try {
      await prisma.activity.create({
        data: {
          type: 'admin_profile_updated',
          userId: adminId,
          details: `Admin updated profile`,
          createdAt: new Date()
        }
      });
    } catch (err) {
      console.warn('Could not log activity:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error('Update Admin Profile Error:', error);
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

    if (admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin accounts can be deleted'
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
    console.error('Delete Admin Account Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
});

// ========== GET SYSTEM INFO (For Dashboard Integration) ==========
router.get('/system-info', adminAuthMiddleware, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const totalUsers = await prisma.user.count();
    const totalTickets = await prisma.ticket.count();
    const totalAdmins = await prisma.user.count({ where: { role: 'admin' } });
    const activeUsers = await prisma.user.count({ where: { status: 'active' } });
    const openTickets = await prisma.ticket.count({ where: { status: 'open' } });

    const systemInfo = {
      settings: settings.general,
      statistics: {
        totalUsers,
        totalTickets,
        totalAdmins,
        activeUsers,
        openTickets
      }
    };

    res.status(200).json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    console.error('Get System Info Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system info',
      error: error.message
    });
  }
});

export default router;