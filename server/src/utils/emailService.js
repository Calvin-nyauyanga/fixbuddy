import nodemailer from 'nodemailer';

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Test email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service configuration error:');
    console.error('  Host:', process.env.EMAIL_HOST);
    console.error('  Port:', process.env.EMAIL_PORT);
    console.error('  User:', process.env.EMAIL_USER);
    console.error('  Error:', error.message);
  } else {
    console.log('✅ Email service is ready');
    console.log('  Host:', process.env.EMAIL_HOST);
    console.log('  User:', process.env.EMAIL_USER);
  }
});

// ✅ SEND PASSWORD RESET EMAIL
export const sendResetEmail = async (toEmail, userName, resetUrl) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: toEmail,
      subject: 'FixBuddy - Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; background: #f4f4f4; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: white; padding: 30px; }
            .btn { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #333; color: white; text-align: center; padding: 10px; font-size: 12px; border-radius: 0 0 5px 5px; }
            .warning { color: #d32f2f; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>FixBuddy</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName || 'User'},</h2>
              <p>We received a request to reset your password. Click the button below to create a new password.</p>
              
              <center>
                <a href="${resetUrl}" class="btn">Reset Password</a>
              </center>
              
              <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
              
              <p><strong>This link will expire in 24 hours.</strong></p>
              
              <p>If you didn't request a password reset, please ignore this email.</p>
              
              <div class="warning">
                <p>⚠️ Never share this link with anyone. Our support team will never ask for your password.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2026 FixBuddy. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log(`📧 Attempting to send reset email to ${toEmail}...`);
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${toEmail}`);
    return true;

  } catch (error) {
    console.error('❌ Error sending reset email:');
    console.error('  Error Code:', error.code);
    console.error('  Error Message:', error.message);
    if (error.response) {
      console.error('  SMTP Response:', error.response);
    }
    throw error;
  }
};