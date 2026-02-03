const nodemailer = require('nodemailer');

/**
 * Email Service for Civix
 * Supports SMTP (Gmail, Outlook, etc.)
 * Gracefully falls back to console logging if credentials are invalid
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on environment variables
   */
  initializeTransporter() {
    // Check if email is enabled
    if (process.env.EMAIL_ENABLED !== 'true') {
      console.log('Email service is disabled. Set EMAIL_ENABLED=true to enable.');
      return;
    }

    // SMTP Configuration
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD || process.env.SMTP_APP_PASSWORD // For Gmail, use App Password
      }
    };

    // Validate required fields
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      console.warn('SMTP credentials not configured. Email sending will be disabled.');
      console.warn('Please set SMTP_USER and SMTP_PASSWORD (or SMTP_APP_PASSWORD) environment variables.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(smtpConfig);
      console.log('SMTP email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SMTP transporter:', error.message);
    }
  }

  /**
   * Verify email transporter connection
   */
  async verifyConnection() {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error.message);
      return false;
    }
  }

  /**
   * Send registration OTP email
   * Falls back to console logging if email fails
   */
  async sendRegistrationOTP(email, otp) {
    const appName = process.env.APP_NAME || 'Civix';

    const mailOptions = {
      from: `"${appName}" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Registration Verification OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration OTP</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">${appName}</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #667eea; margin-top: 0;">Welcome to ${appName}!</h2>
            <p>Hello,</p>
            <p>Thank you for signing up for ${appName}! To complete your registration, please verify your email address with the OTP below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #fff; 
                          border: 2px solid #667eea; 
                          color: #667eea; 
                          padding: 20px; 
                          font-size: 32px; 
                          font-weight: bold; 
                          letter-spacing: 8px; 
                          border-radius: 10px; 
                          display: inline-block; 
                          font-family: monospace;">
                ${otp}
              </div>
            </div>
            <p>Enter this OTP in the registration form to complete your account setup.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              <strong>Important:</strong> This OTP will expire in 10 minutes. If you didn't sign up for ${appName}, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to ${appName}!
        
        Thank you for signing up! To complete your registration, please verify your email address with this OTP:
        
        ${otp}
        
        Enter this OTP in the registration form to complete your account setup.
        
        This OTP will expire in 10 minutes. If you didn't sign up for ${appName}, please ignore this email.
        
        This is an automated message. Please do not reply to this email.
      `
    };

    // If email is disabled or transporter not initialized, log to console
    if (!this.transporter || process.env.EMAIL_ENABLED !== 'true') {
      console.log('\n=== Registration OTP Email (Console Mode) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: Registration Verification OTP`);
      console.log(`OTP: ${otp}`);
      console.log('============================================\n');
      return true;
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Registration OTP email sent successfully!');
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Sent to: ${email}`);
      console.log(`   OTP: ${otp}`);
      console.log(`   Check your inbox (and spam folder) for the OTP.\n`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send registration OTP email:', error.message);
      console.error('   Error code:', error.code || 'Unknown error');
      
      // Provide helpful error messages
      if (error.code === 'EAUTH') {
        console.error('\n   ⚠️  Authentication failed. Your SMTP credentials may be incorrect.');
        console.error('   For Gmail: Make sure you\'re using an App Password (not your regular password).');
        console.error('   You can create an App Password at: https://myaccount.google.com/apppasswords');
      } else if (error.code === 'ECONNECTION') {
        console.error('\n   ⚠️  Connection failed. Check your SMTP_HOST and SMTP_PORT.');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('\n   ⚠️  Connection timeout. Check your internet connection and SMTP settings.');
      }
      
      // Fallback to console logging if email fails
      console.log('\n=== Registration OTP Email (Fallback - Email Failed) ===');
      console.log(`To: ${email}`);
      console.log(`OTP: ${otp}`);
      console.log('===================================================\n');
      
      return true; // Return true so registration still works (user can use console OTP)
    }
  }

  /**
   * Send password reset OTP email
   * Falls back to console logging if email fails
   */
  async sendPasswordResetOTP(email, otp) {
    const appName = process.env.APP_NAME || 'Civix';

    const mailOptions = {
      from: `"${appName}" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">${appName}</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #667eea; margin-top: 0;">Password Reset OTP</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password for your ${appName} account.</p>
            <p>Your One-Time Password (OTP) is:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #fff; 
                          border: 2px solid #667eea; 
                          color: #667eea; 
                          padding: 20px; 
                          font-size: 32px; 
                          font-weight: bold; 
                          letter-spacing: 8px; 
                          border-radius: 10px; 
                          display: inline-block; 
                          font-family: monospace;">
                ${otp}
              </div>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              <strong>Important:</strong> This OTP will expire in 10 minutes. If you didn't request a password reset, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset OTP
        
        We received a request to reset your password for your ${appName} account.
        
        Your One-Time Password (OTP) is: ${otp}
        
        This OTP will expire in 10 minutes. If you didn't request a password reset, please ignore this email.
        
        This is an automated message. Please do not reply to this email.
      `
    };

    // If email is disabled or transporter not initialized, log to console
    if (!this.transporter || process.env.EMAIL_ENABLED !== 'true') {
      console.log('\n=== Password Reset OTP Email (Console Mode) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: Password Reset OTP`);
      console.log(`OTP: ${otp}`);
      console.log('===============================================\n');
      return true;
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset OTP email sent successfully!');
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Sent to: ${email}`);
      console.log(`   OTP: ${otp}`);
      console.log(`   Check your inbox (and spam folder) for the OTP.\n`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset OTP email:', error.message);
      console.error('   Error code:', error.code || 'Unknown error');
      
      // Provide helpful error messages
      if (error.code === 'EAUTH') {
        console.error('\n   ⚠️  Authentication failed. Your SMTP credentials may be incorrect.');
        console.error('   For Gmail: Make sure you\'re using an App Password (not your regular password).');
        console.error('   You can create an App Password at: https://myaccount.google.com/apppasswords');
      } else if (error.code === 'ECONNECTION') {
        console.error('\n   ⚠️  Connection failed. Check your SMTP_HOST and SMTP_PORT.');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('\n   ⚠️  Connection timeout. Check your internet connection and SMTP settings.');
      }
      
      // Fallback to console logging if email fails
      console.log('\n=== Password Reset OTP Email (Fallback - Email Failed) ===');
      console.log(`To: ${email}`);
      console.log(`OTP: ${otp}`);
      console.log('======================================================\n');
      
      return true; // Return true so reset still works (user can use console OTP)
    }
  }

  /**
   * Send password reset email
   * Falls back to console logging if email fails
   */
  async sendPasswordResetEmail(email, token) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password/${token}`;

    const appName = process.env.APP_NAME || 'Civix';

    const mailOptions = {
      from: `"${appName}" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">${appName}</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #667eea; margin-top: 0;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password for your ${appName} account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        display: inline-block; 
                        font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #666;">
              ${resetLink}
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              <strong>Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        We received a request to reset your password for your ${appName} account.
        
        Click this link to reset your password:
        ${resetLink}
        
        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
        
        This is an automated message. Please do not reply to this email.
      `
    };

    // If email is disabled or transporter not initialized, log to console
    if (!this.transporter || process.env.EMAIL_ENABLED !== 'true') {
      console.log('\n=== Password Reset Email (Console Mode) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: Password Reset Request`);
      console.log(`Reset Link: ${resetLink}`);
      console.log(`Token: ${token}`);
      console.log('==========================================\n');
      return true;
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent successfully!');
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Sent to: ${email}`);
      console.log(`   Check your inbox (and spam folder) for the reset link.\n`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error.message);
      console.error('   Error code:', error.code || 'Unknown error');
      
      // Provide helpful error messages
      if (error.code === 'EAUTH') {
        console.error('\n   ⚠️  Authentication failed. Your SMTP credentials may be incorrect.');
        console.error('   For Gmail: Make sure you\'re using an App Password (not your regular password).');
        console.error('   You can create an App Password at: https://myaccount.google.com/apppasswords');
      } else if (error.code === 'ECONNECTION') {
        console.error('\n   ⚠️  Connection failed. Check your SMTP_HOST and SMTP_PORT.');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('\n   ⚠️  Connection timeout. Check your internet connection and SMTP settings.');
      }
      
      // Fallback to console logging if email fails
      console.log('\n=== Password Reset Email (Fallback - Email Failed) ===');
      console.log(`To: ${email}`);
      console.log(`Reset Link: ${resetLink}`);
      console.log(`Token: ${token}`);
      console.log('====================================================\n');
      
      return true; // Return true so reset still works (user can use console link)
    }
  }

  /**
   * Send email verification email
   * Falls back to console logging if email fails
   */
  async sendVerificationEmail(email, token) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email/${token}`;
    const appName = process.env.APP_NAME || 'Civix';

    const mailOptions = {
      from: `"${appName}" <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">${appName}</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #667eea; margin-top: 0;">Verify Your Email</h2>
            <p>Hello,</p>
            <p>Thank you for signing up for ${appName}! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        display: inline-block; 
                        font-weight: bold;">
                Verify Email
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #666;">
              ${verificationLink}
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Verify Your Email Address
        
        Thank you for signing up for ${appName}! Please verify your email address by clicking this link:
        ${verificationLink}
        
        This is an automated message. Please do not reply to this email.
      `
    };

    // If email is disabled or transporter not initialized, log to console
    if (!this.transporter || process.env.EMAIL_ENABLED !== 'true') {
      console.log(`\n=== Verification Email (Console Mode) ===`);
      console.log(`To: ${email}`);
      console.log(`Verification Link: ${verificationLink}`);
      console.log(`Token: ${token}`);
      console.log('==========================================\n');
      return true;
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error.message);
      // Fallback to console logging
      console.log(`\n=== Verification Email (Fallback) ===`);
      console.log(`To: ${email}`);
      console.log(`Verification Link: ${verificationLink}`);
      console.log(`Token: ${token}`);
      console.log('====================================\n');
      
      return true; // Return true so signup still works (user can use console link)
    }
  }
}

module.exports = new EmailService();
