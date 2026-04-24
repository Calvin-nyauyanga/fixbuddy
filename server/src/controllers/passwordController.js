import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { sendResetEmail } from '../utils/emailService.js';

// ✅ REQUEST PASSWORD RESET
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent'
      });
    }

    // Generate reset token (32 bytes = 64 character hex string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before storing (security best practice)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token expires in 24 hours
    const resetTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update user with reset token
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        resetToken: hashedToken,
        resetTokenExpire
      }
    });

    // Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    try {
      await sendResetEmail(email, user.name, resetUrl);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Clear the reset token if email fails
      await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          resetToken: null,
          resetTokenExpire: null
        }
      });
      
      return res.status(500).json({
        success: false,
        message: 'Error sending reset email. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email'
    });

  } catch (error) {
    console.error('Request Password Reset Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ✅ VALIDATE RESET TOKEN
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    // Hash the token to match what's stored in DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpire: {
          gt: new Date() // Token must not be expired
        }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Validate Reset Token Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ✅ RESET PASSWORD WITH TOKEN
export const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validation
    const missing = [];
    if (!token) missing.push('token');
    if (!password) missing.push('password');
    if (!confirmPassword) missing.push('confirmPassword');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missing.join(', ')}`
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash the token to match what's stored in DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpire: {
          gt: new Date() // Token must not be expired
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpire: null,
        updatedAt: new Date()
      }
    });

    // Log activity
    try {
      await prisma.activity.create({
        data: {
          type: 'password_reset',
          userId: user.id,
          details: 'User reset their password'
        }
      });
    } catch (err) {
      console.warn('Could not log activity:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};