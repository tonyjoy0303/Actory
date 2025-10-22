const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a test account if in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  let transporter;

  if (isDevelopment) {
    // Use ethereal.email for testing in development
    const testAccount = await nodemailer.createTestAccount();
    
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
      }
    });
  } else {
    // Use Gmail in production
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Send mail with defined transport object
  const message = {
    from: `"Actory" <${isDevelopment ? 'noreply@actory.com' : process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);

  if (isDevelopment) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
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

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
};
