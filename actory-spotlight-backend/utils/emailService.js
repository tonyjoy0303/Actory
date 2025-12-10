const nodemailer = require('nodemailer');

// Brevo REST API endpoint
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL || process.env.EMAIL_USER;
const BREVO_FROM_NAME = process.env.BREVO_FROM_NAME || 'Actory Spotlight';

// Send email via Brevo REST API
const sendEmailViaBrevo = async (options) => {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  if (!BREVO_FROM_EMAIL) {
    throw new Error('BREVO_FROM_EMAIL is not configured');
  }

  const payload = {
    sender: {
      name: BREVO_FROM_NAME,
      email: BREVO_FROM_EMAIL
    },
    to: [
      {
        email: options.email,
        name: options.recipientName || 'User'
      }
    ],
    subject: options.subject,
    htmlContent: options.html,
    textContent: options.message,
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API Error:', errorData);
      throw new Error(`Brevo API failed: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Email sent via Brevo:', {
      messageId: result.messageId,
      to: options.email
    });

    return result;
  } catch (error) {
    console.error('❌ Brevo REST API error:', error.message);
    throw error;
  }
};

// Fallback to SMTP if Brevo REST API fails
const sendEmailViaSMTP = async (options) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasBrevoSMTP = Boolean(process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS);
  const hasGmailCredentials = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  const preferEthereal = process.env.USE_ETHEREAL === 'true';

  let transporter;

  try {
    // Use Brevo SMTP if available
    if (hasBrevoSMTP) {
      console.log('📧 Using Brevo SMTP');
      transporter = nodemailer.createTransport({
        host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
        secure: process.env.BREVO_SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_SMTP_PASS,
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      });
    } 
    // Fall back to Gmail SMTP
    else if (hasGmailCredentials && !preferEthereal) {
      console.log('📧 Using Gmail SMTP (Brevo not configured)');
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      });
    } 
    // Use Ethereal for testing
    else {
      console.log('🧪 Using Ethereal test SMTP account');
      const testAccount = await Promise.race([
        nodemailer.createTestAccount(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Ethereal timeout')), 5000)
        )
      ]);

      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
      });
    }

    const fromEmail = process.env.BREVO_SMTP_USER || process.env.EMAIL_USER || 'noreply@actory.test';
    const message = {
      from: `"${BREVO_FROM_NAME}" <${fromEmail}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    const info = await Promise.race([
      transporter.sendMail(message),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timeout')), 45000)
      )
    ]);

    console.log('✅ Email sent via SMTP:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ SMTP error:', error.message);
    throw error;
  }
};

const sendEmail = async (options) => {
  try {
    // Try Brevo REST API first (recommended)
    if (BREVO_API_KEY) {
      try {
        return await sendEmailViaBrevo(options);
      } catch (error) {
        console.warn('⚠️ Brevo REST API failed, trying SMTP fallback...');
        return await sendEmailViaSMTP(options);
      }
    } 
    // Fall back to SMTP only
    else {
      console.warn('⚠️ BREVO_API_KEY not set, using SMTP fallback');
      return await sendEmailViaSMTP(options);
    }
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    throw error;
  }
};

const sendPasswordResetEmail = async (user, resetToken, resetUrl) => {
  // Remove the line that was appending the token again
  const resetURL = resetUrl; // resetUrl already includes the token
  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetURL}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Actory Spotlight</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Password Reset Request</p>
      </div>

      <!-- Main Content -->
      <div style="background-color: white; padding: 40px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 22px;">Password Reset Request</h2>
        
        <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          You are receiving this email because you (or someone else) has requested to reset the password for your Actory account.
        </p>

        <p style="color: #555; font-size: 16px; margin-bottom: 10px;">Please click the button below to reset your password:</p>

        <!-- Reset Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetURL}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; 
                    text-decoration: none; padding: 14px 40px; border-radius: 6px; 
                    font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            Reset Password
          </a>
        </div>

        <p style="color: #999; font-size: 14px; margin: 20px 0;">This link will expire in 10 minutes.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
          If you did not request this, please ignore this email and your password will remain unchanged.
        </p>

        <p style="color: #999; font-size: 12px; line-height: 1.6;">
          If the button above doesn't work, copy and paste this link into your browser:<br>
          <code style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">${resetURL}</code>
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          🔒 <strong>Security Note:</strong> Never share this link with anyone.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #999; font-size: 12px;">
        <p style="margin: 0; margin-bottom: 10px;">© ${new Date().getFullYear()} Actory Spotlight. All rights reserved.</p>
        <p style="margin: 0;">
          <a href="https://actory.com/support" style="color: #667eea; text-decoration: none;">Need help?</a> | 
          <a href="https://actory.com/privacy" style="color: #667eea; text-decoration: none;">Privacy Policy</a>
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      recipientName: user.name,
      subject: '🔐 Password Reset Request - Actory',
      message,
      html,
    });
    console.log('✅ Password reset email sent to:', user.email);
  } catch (err) {
    console.error('❌ Error sending password reset email:', err.message);
    throw new Error('Email could not be sent');
  }
};

const sendVerificationEmail = async (user, otp) => {
  const message = `Your email verification code is: ${otp}. This code will expire in 10 minutes.`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Actory Spotlight</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Email Verification</p>
      </div>

      <!-- Main Content -->
      <div style="background-color: white; padding: 40px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 22px;">Welcome to Actory!</h2>
        
        <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Thank you for registering. Please verify your email address to activate your account.
        </p>

        <p style="color: #555; font-size: 16px; margin-bottom: 10px;">Your verification code is:</p>

        <!-- OTP Box -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <p style="margin: 0; color: white; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9;">Your Code</p>
          <h1 style="margin: 15px 0 0 0; color: white; letter-spacing: 8px; font-size: 40px; font-weight: bold; font-family: 'Courier New', monospace;">${otp}</h1>
        </div>

        <p style="color: #999; font-size: 14px; margin: 20px 0;">This code will expire in 10 minutes.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
          If you did not create this account, please ignore this email and your email will not be registered.
        </p>

        <p style="color: #999; font-size: 12px; line-height: 1.6;">
          🔒 <strong>Security Note:</strong> Never share this code with anyone. Actory will never ask for your verification code.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #999; font-size: 12px;">
        <p style="margin: 0; margin-bottom: 10px;">© ${new Date().getFullYear()} Actory Spotlight. All rights reserved.</p>
        <p style="margin: 0;">
          <a href="https://actory.com/support" style="color: #667eea; text-decoration: none;">Need help?</a> | 
          <a href="https://actory.com/privacy" style="color: #667eea; text-decoration: none;">Privacy Policy</a>
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      recipientName: user.name,
      subject: '✉️ Verify Your Actory Email Address',
      message,
      html,
    });
    console.log('✅ Verification email sent to:', user.email);
  } catch (err) {
    console.error('❌ Error sending verification email:', err.message);
    throw new Error('Verification email could not be sent');
  }
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
};
