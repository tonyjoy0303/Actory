const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasGmailCredentials = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  const preferEthereal = process.env.USE_ETHEREAL === 'true';
  const forceGmail = process.env.FORCE_GMAIL === 'true';

  console.log('[Email] Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    EMAIL_USER: process.env.EMAIL_USER ? '***' : 'NOT SET',
    EMAIL_PASS: process.env.EMAIL_PASS ? '***' : 'NOT SET',
    hasGmailCredentials,
    isDevelopment
  });

  // In production, require Gmail credentials
  if (!isDevelopment && !hasGmailCredentials) {
    console.error('[Email] Production mode requires EMAIL_USER and EMAIL_PASS environment variables');
    throw new Error('Email service not configured. Please contact support.');
  }

  // Default to Ethereal only when running locally without Gmail creds unless explicitly requested.
  const useEthereal = !forceGmail && (preferEthereal || (!hasGmailCredentials && isDevelopment));

  let transporter;

  try {
    if (useEthereal) {
      console.log('[Email] Using Ethereal test SMTP account');
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
    } else {
      console.log('[Email] Configuring Gmail SMTP with user:', process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + '...' : 'undefined');
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
      });
      console.log('[Email] Gmail SMTP configured successfully');
    }

    const message = {
      from: `"Actory" <${useEthereal ? 'noreply@actory.test' : process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    console.log('[Email] Sending email to:', options.email);
    
    const info = await Promise.race([
      transporter.sendMail(message),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timeout after 15s')), 15000)
      )
    ]);

    console.log('[Email] Email sent successfully. Message ID:', info.messageId);
    
    if (useEthereal) {
      console.log('[Email] Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('[Email] Email service error:', error.message);
    console.error('[Email] Error details:', error);
    throw error;
  }
};

const sendPasswordResetEmail = async (user, resetToken, resetUrl) => {
  // Remove the line that was appending the token again
  const resetURL = resetUrl; // resetUrl already includes the token
  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetURL}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Password Reset Request</h2>
      <p>You are receiving this email because you (or someone else) has requested to reset the password for your Actory account.</p>
      <p>Please click the button below to reset your password. This link will expire in 10 minutes.</p>
      
      <a href="${resetURL}" 
         style="display: inline-block; background-color: #4f46e5; color: white; 
                text-decoration: none; padding: 10px 20px; border-radius: 4px; 
                margin: 20px 0;">
        Reset Password
      </a>
      
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <p style="color: #6b7280; font-size: 0.875rem; margin-top: 2rem;">
        If the button above doesn't work, copy and paste this link into your browser:<br>
        ${resetURL}
      </p>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
      html,
    });
  } catch (err) {
    console.error('Error sending email:', err);
    throw new Error('Email could not be sent');
  }
};

const sendVerificationEmail = async (user, otp) => {
  const message = `Your email verification code is: ${otp}. This code will expire in 5 minutes.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Welcome to Actory!</h2>
      <p>Thank you for registering. Please verify your email address to activate your account.</p>
      <p>Your email verification code is:</p>
      
      <div style="display: inline-block; background-color: #f3f4f6; border: 2px solid #4f46e5; 
                  padding: 20px 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h1 style="margin: 0; color: #4f46e5; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
      </div>
      
      <p style="color: #6b7280;">This code will expire in 5 minutes.</p>
      <p>If you did not create this account, please ignore this email.</p>
      <p style="color: #6b7280; font-size: 0.875rem; margin-top: 2rem;">
        Do not share this code with anyone. Actory will never ask for your code.
      </p>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Actory Email Verification Code',
      message,
      html,
    });
  } catch (err) {
    console.error('Error sending verification email:', err);
    throw new Error('Verification email could not be sent');
  }
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
};
