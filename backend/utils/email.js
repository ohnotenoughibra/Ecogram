const nodemailer = require('nodemailer');

// Create transporter based on environment
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.EMAIL_HOST && !process.env.EMAIL_SERVICE) {
    console.log('Email service not configured. Set EMAIL_HOST/EMAIL_SERVICE and EMAIL_USER/EMAIL_PASS in .env');
    return null;
  }

  const config = {
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };

  // Support common services (Gmail, Outlook, etc.)
  if (process.env.EMAIL_SERVICE) {
    config.service = process.env.EMAIL_SERVICE;
  } else {
    config.host = process.env.EMAIL_HOST;
    config.port = parseInt(process.env.EMAIL_PORT || '587');
    config.secure = process.env.EMAIL_SECURE === 'true';
  }

  return nodemailer.createTransport(config);
};

let transporter = null;

// Initialize transporter
const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName = '') => {
  const transport = getTransporter();

  if (!transport) {
    console.log('=== PASSWORD RESET (Email not configured) ===');
    console.log('Email:', email);
    console.log('Reset Token:', resetToken);
    console.log('Reset URL:', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`);
    console.log('=============================================');
    return { sent: false, reason: 'email_not_configured' };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const mailOptions = {
    from: `"Ecogram" <${fromEmail}>`,
    to: email,
    subject: 'Reset Your Ecogram Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <tr>
              <td>
                <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Ecogram</h1>
                    <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 14px;">Training Game Library</p>
                  </div>

                  <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">Reset Your Password</h2>

                  ${userName ? `<p style="color: #374151; margin: 0 0 20px 0;">Hi ${userName},</p>` : ''}

                  <p style="color: #374151; margin: 0 0 20px 0; line-height: 1.6;">
                    We received a request to reset your password. Click the button below to create a new password:
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}"
                       style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Reset Password
                    </a>
                  </div>

                  <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
                    This link will expire in <strong>1 hour</strong> for security reasons.
                  </p>

                  <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
                    If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                  </p>

                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                  <p style="color: #9ca3af; margin: 0; font-size: 12px; line-height: 1.6;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
                  </p>
                </div>

                <p style="text-align: center; color: #9ca3af; margin: 20px 0 0 0; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} Ecogram. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
Reset Your Ecogram Password

${userName ? `Hi ${userName},\n\n` : ''}We received a request to reset your password.

Click the link below to create a new password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

Ecogram - Training Game Library
    `.trim()
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    // Still log the token for debugging
    console.log('=== PASSWORD RESET (Email failed) ===');
    console.log('Email:', email);
    console.log('Reset Token:', resetToken);
    console.log('Reset URL:', resetUrl);
    console.log('Error:', error.message);
    console.log('=====================================');
    return { sent: false, reason: 'email_failed', error: error.message };
  }
};

// Verify email configuration
const verifyEmailConfig = async () => {
  const transport = getTransporter();

  if (!transport) {
    return { configured: false, reason: 'no_config' };
  }

  try {
    await transport.verify();
    return { configured: true };
  } catch (error) {
    return { configured: false, reason: 'verification_failed', error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  verifyEmailConfig
};
