const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const encryptionUtil = require('../utils/encryption');
const emailService = require('../services/emailService');

/**
 * Request OTP for registration
 */
exports.requestRegistrationOTP = async (req, res) => {
  try {
    const { name, email, password, role, location } = req.body;

    // Input validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        errors: {
          name: !name ? 'Name is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null,
          role: !role ? 'Role is required' : null
        }
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate OTP
    const SecurityUtil = require('../utils/security');
    const { otp, expires } = SecurityUtil.generatePasswordResetOTP();

    // Store registration data temporarily (you might want to use Redis for this in production)
    const tempRegistrationData = {
      name,
      email,
      password,
      role,
      location,
      otp,
      otpExpires: expires
    };

    // Store in a temporary collection or cache (for now, we'll use a simple in-memory store)
    // In production, use Redis or a temporary collection
    global.tempRegistrations = global.tempRegistrations || {};
    global.tempRegistrations[email] = tempRegistrationData;

    // Send OTP email
    try {
      await emailService.sendRegistrationOTP(email, otp);
    } catch (emailError) {
      console.error('Failed to send registration OTP:', emailError);
      return res.status(500).json({ message: 'Failed to send registration OTP' });
    }

    res.json({ message: 'OTP sent to your email address' });

  } catch (error) {
    console.error('Registration OTP request error:', error);
    res.status(500).json({ message: 'Failed to send registration OTP', error: error.message });
  }
};

/**
 * Verify OTP and complete registration
 */
exports.verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Get temporary registration data
    global.tempRegistrations = global.tempRegistrations || {};
    const tempData = global.tempRegistrations[email];

    if (!tempData) {
      return res.status(400).json({ message: 'Registration session expired. Please start again.' });
    }

    // Check OTP and expiration
    if (tempData.otp !== otp || tempData.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if user already exists (double check)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      delete global.tempRegistrations[email];
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(tempData.password, 12);

    // Create user object
    const userData = {
      name: tempData.name,
      email: tempData.email,
      password: hashedPassword,
      role: tempData.role,
      emailVerified: true, // Since they verified via OTP
      verificationStatus: tempData.role === 'official' ? 'unverified' : 'verified'
    };

    // Handle location data if provided
    if (tempData.location) {
      if (typeof tempData.location === 'string') {
        userData.location = { address: tempData.location };
      } else if (typeof tempData.location === 'object') {
        userData.location = tempData.location;
      }
    }

    const user = new User(userData);
    await user.save();

    // Clean up temporary data
    delete global.tempRegistrations[email];

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        verificationStatus: user.verificationStatus,
        emailVerified: user.emailVerified
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      message: 'Registration completed successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        emailVerified: user.emailVerified,
        location: user.location
      }
    });

  } catch (error) {
    console.error('Registration OTP verification error:', error);
    res.status(500).json({ message: 'Registration verification failed', error: error.message });
  }
};

/**
 * Register a new user (citizen or official)
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, location } = req.body;

    // Input validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        errors: {
          name: !name ? 'Name is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null,
          role: !role ? 'Role is required' : null
        }
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate email verification token
    const emailVerificationToken = encryptionUtil.generateToken();

    // Create user object
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      emailVerificationToken,
      verificationStatus: 'unverified'
    };

    // Handle location data if provided
    if (location) {
      if (typeof location === 'string') {
        userData.location = { address: location };
      } else if (typeof location === 'object') {
        userData.location = location;
      }
    }

    const user = new User(userData);
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, emailVerificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

/**
 * Login user with enhanced security
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        message: 'Account temporarily locked due to too many failed login attempts',
        lockUntil: user.lockUntil
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        verificationStatus: user.verificationStatus,
        emailVerified: user.emailVerified
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        emailVerified: user.emailVerified,
        location: user.location
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

/**
 * Verify email address
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Update user verification status
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Email verification failed', error: error.message });
  }
};

/**
 * Request password reset with reset link
 */
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({ message: 'If an account with that email exists, a reset link has been sent' });
    }

    // Generate reset token
    const SecurityUtil = require('../utils/security');
    const resetToken = SecurityUtil.generateSecureToken(32);
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send reset link email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset link:', emailError);
      return res.status(500).json({ message: 'Failed to send password reset link' });
    }

    res.json({ message: 'If an account with that email exists, a reset link has been sent' });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Password reset request failed', error: error.message });
  }
};

/**
 * Verify OTP for password reset
 */
exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({
      email: email,
      passwordResetOTP: otp,
      passwordResetOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Generate a temporary token for password reset
    const SecurityUtil = require('../utils/security');
    const resetToken = SecurityUtil.generateSecureToken(32);
    const resetExpires = new Date(Date.now() + 600000); // 10 minutes

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    res.json({ 
      message: 'OTP verified successfully',
      resetToken: resetToken
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'OTP verification failed', error: error.message });
  }
};

/**
 * Reset password with verified token
 */
exports.resetPasswordWithToken = async (req, res) => {
  try {
    // Handle GET request - validate token and show form
    if (req.method === 'GET') {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: 'Reset token is required' });
      }

      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Token is valid, frontend can show password reset form
      return res.json({ message: 'Token is valid', email: user.email });
    }

    // Handle POST request - reset password
    const { resetToken, newPassword } = req.body;
    const token = resetToken || req.params.token;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
};

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -passwordResetToken -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, location } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (location) updateData.location = location;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -emailVerificationToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Profile updated successfully',
      user 
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Profile update failed', error: error.message });
  }
};
