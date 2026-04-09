import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// ========== GET ALL SETTINGS ==========
export const getSettings = async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // Create default settings
      settings = await prisma.settings.create({
        data: {
          general: {
            systemName: 'FixBuddy Helpdesk',
            systemDescription: 'Professional helpdesk system for ticket management',
            timezone: 'UTC',
            dateFormat: 'DD/MM/YYYY'
          },
          email: {
            smtpPort: '587',
            emailSubjectPrefix: '[FixBuddy]'
          },
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
};

// ========== UPDATE GENERAL SETTINGS ==========
export const updateGeneralSettings = async (req, res) => {
  try {
    const { systemName, systemDescription, timezone, dateFormat } = req.body;

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          general: { systemName, systemDescription, timezone, dateFormat }
        }
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          general: {
            ...settings.general,
            systemName: systemName || settings.general.systemName,
            systemDescription: systemDescription || settings.general.systemDescription,
            timezone: timezone || settings.general.timezone,
            dateFormat: dateFormat || settings.general.dateFormat
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'General settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update General Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating general settings',
      error: error.message
    });
  }
};

// ========== UPDATE EMAIL SETTINGS ==========
export const updateEmailSettings = async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPassword, emailFrom, emailSubjectPrefix } = req.body;

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          email: { smtpHost, smtpPort, smtpUser, emailFrom, emailSubjectPrefix }
        }
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          email: {
            ...settings.email,
            smtpHost: smtpHost || settings.email.smtpHost,
            smtpPort: smtpPort || settings.email.smtpPort,
            smtpUser: smtpUser || settings.email.smtpUser,
            smtpPassword: smtpPassword || settings.email.smtpPassword,
            emailFrom: emailFrom || settings.email.emailFrom,
            emailSubjectPrefix: emailSubjectPrefix || settings.email.emailSubjectPrefix
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update Email Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating email settings',
      error: error.message
    });
  }
};

// ========== UPDATE SECURITY SETTINGS ==========
export const updateSecuritySettings = async (req, res) => {
  try {
    const { minPasswordLength, requireUppercase, requireNumbers, requireSpecial, sessionTimeout, enableTwoFactor } = req.body;

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          security: { minPasswordLength, requireUppercase, requireNumbers, requireSpecial, sessionTimeout, enableTwoFactor }
        }
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          security: {
            ...settings.security,
            minPasswordLength: minPasswordLength !== undefined ? minPasswordLength : settings.security.minPasswordLength,
            requireUppercase: requireUppercase !== undefined ? requireUppercase : settings.security.requireUppercase,
            requireNumbers: requireNumbers !== undefined ? requireNumbers : settings.security.requireNumbers,
            requireSpecial: requireSpecial !== undefined ? requireSpecial : settings.security.requireSpecial,
            sessionTimeout: sessionTimeout !== undefined ? sessionTimeout : settings.security.sessionTimeout,
            enableTwoFactor: enableTwoFactor !== undefined ? enableTwoFactor : settings.security.enableTwoFactor
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Security settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update Security Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating security settings',
      error: error.message
    });
  }
};

// ========== UPDATE NOTIFICATION SETTINGS ==========
export const updateNotificationSettings = async (req, res) => {
  try {
    const { notifyNewTickets, notifyTicketUpdates, notifyNewUsers, notifyAlerts, digestFrequency } = req.body;

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          notifications: { notifyNewTickets, notifyTicketUpdates, notifyNewUsers, notifyAlerts, digestFrequency }
        }
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          notifications: {
            ...settings.notifications,
            notifyNewTickets: notifyNewTickets !== undefined ? notifyNewTickets : settings.notifications.notifyNewTickets,
            notifyTicketUpdates: notifyTicketUpdates !== undefined ? notifyTicketUpdates : settings.notifications.notifyTicketUpdates,
            notifyNewUsers: notifyNewUsers !== undefined ? notifyNewUsers : settings.notifications.notifyNewUsers,
            notifyAlerts: notifyAlerts !== undefined ? notifyAlerts : settings.notifications.notifyAlerts,
            digestFrequency: digestFrequency || settings.notifications.digestFrequency
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update Notification Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification settings',
      error: error.message
    });
  }
};

// ========== UPDATE APPEARANCE SETTINGS ==========
export const updateAppearanceSettings = async (req, res) => {
  try {
    const { darkMode, compactMenu, showAnimations, itemsPerPage } = req.body;

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          appearance: { darkMode, compactMenu, showAnimations, itemsPerPage }
        }
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          appearance: {
            ...settings.appearance,
            darkMode: darkMode !== undefined ? darkMode : settings.appearance.darkMode,
            compactMenu: compactMenu !== undefined ? compactMenu : settings.appearance.compactMenu,
            showAnimations: showAnimations !== undefined ? showAnimations : settings.appearance.showAnimations,
            itemsPerPage: itemsPerPage || settings.appearance.itemsPerPage
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appearance settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update Appearance Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appearance settings',
      error: error.message
    });
  }
};

// ========== TEST EMAIL CONFIGURATION ==========
export const testEmailSettings = async (req, res) => {
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
    const mailOptions = {
      from: settings.email.emailFrom || settings.email.smtpUser,
      to: req.user.email,
      subject: `${settings.email.emailSubjectPrefix || '[FixBuddy]'} Test Email Configuration`,
      html: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email to verify your SMTP settings are configured correctly.</p>
        <p><strong>Status:</strong> ✅ Email settings are working properly!</p>
        <hr>
        <p><small>Sent from FixBuddy Helpdesk System</small></p>
      `
    };

    await transporter.sendMail(mailOptions);

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
};

// ========== UPDATE ADMIN PROFILE ==========
export const updateAdminProfile = async (req, res) => {
  try {
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

    // Verify password if changing password
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

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters'
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
        status: true,
        createdAt: true
      }
    });

    // Log activity
    try {
      await prisma.activity.create({
        data: {
          type: 'admin_profile_updated',
          userId: adminId,
          details: `Admin profile updated: ${name ? 'name, ' : ''}${phone ? 'phone, ' : ''}${newPassword ? 'password' : ''}`,
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
};

// ========== DELETE ADMIN ACCOUNT ==========
export const deleteAdminAccount = async (req, res) => {
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
        message: 'Only admin accounts can be deleted this way'
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
};

// ========== GET SYSTEM INFO (For Dashboard Integration) ==========
export const getSystemInfo = async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst();
    const totalUsers = await prisma.user.count();
    const totalTickets = await prisma.ticket.count();
    const totalAdmins = await prisma.user.count({ where: { role: 'admin' } });
    const activeUsers = await prisma.user.count({ where: { status: 'active' } });

    const systemInfo = {
      settings: settings?.general || {},
      statistics: {
        totalUsers,
        totalTickets,
        totalAdmins,
        activeUsers
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
};