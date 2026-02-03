const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');

class SecurityUtil {
  /**
   * Enhanced password hashing with configurable rounds
   * @param {string} password - Plain text password
   * @param {number} rounds - Salt rounds (default: 12)
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password, rounds = 12) {
    try {
      const salt = await bcrypt.genSalt(rounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error('Password hashing failed: ' + error.message);
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Verification result
   */
  static async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error('Password verification failed: ' + error.message);
    }
  }

  /**
   * Generate secure random token
   * @param {number} length - Token length in bytes (default: 32)
   * @returns {string} Hex encoded token
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate email verification token
   * @returns {string} Verification token
   */
  static generateEmailVerificationToken() {
    return this.generateSecureToken(32);
  }

  /**
   * Generate OTP (One Time Password)
   * @param {number} length - OTP length (default: 6)
   * @returns {string} Numeric OTP
   */
  static generateOTP(length = 6) {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    return otp;
  }

  /**
   * Generate password reset OTP with expiration
   * @returns {Object} OTP and expiration date
   */
  static generatePasswordResetOTP() {
    const otp = this.generateOTP(6);
    const expires = new Date(Date.now() + 600000); // 10 minutes from now
    return { otp, expires };
  }

  /**
   * Check if account should be locked based on failed attempts
   * @param {Object} user - User object
   * @returns {boolean} Whether account should be locked
   */
  static shouldLockAccount(user) {
    const maxAttempts = 5;
    return user.loginAttempts >= maxAttempts;
  }

  /**
   * Calculate account lock duration
   * @param {number} attempts - Number of failed attempts
   * @returns {Date} Lock until date
   */
  static calculateLockDuration(attempts) {
    const baseLockTime = 15 * 60 * 1000; // 15 minutes
    const multiplier = Math.min(attempts - 5, 5); // Max 5x multiplier
    const lockDuration = baseLockTime * Math.pow(2, multiplier);
    return new Date(Date.now() + lockDuration);
  }

  /**
   * Check if account is currently locked
   * @param {Object} user - User object
   * @returns {boolean} Whether account is locked
   */
  static isAccountLocked(user) {
    return user.lockUntil && user.lockUntil > new Date();
  }

  /**
   * Increment failed login attempts
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  static async incrementLoginAttempts(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.loginAttempts = (user.loginAttempts || 0) + 1;

    if (this.shouldLockAccount(user)) {
      user.lockUntil = this.calculateLockDuration(user.loginAttempts);
    }

    await user.save();
    return user;
  }

  /**
   * Reset login attempts on successful login
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  static async resetLoginAttempts(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();

    await user.save();
    return user;
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  static validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  /**
   * Calculate password strength score
   * @param {string} password - Password to evaluate
   * @returns {string} Strength level
   */
  static calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    if (password.length >= 16) score++;

    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    if (score <= 6) return 'strong';
    return 'very-strong';
  }

  /**
   * Sanitize user input to prevent XSS
   * @param {string} input - User input
   * @returns {string} Sanitized input
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Generate audit log entry
   * @param {string} action - Action performed
   * @param {string} userId - User ID
   * @param {string} ip - IP address
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Audit log entry
   */
  static createAuditLog(action, userId, ip, metadata = {}) {
    return {
      action,
      userId,
      ip,
      timestamp: new Date(),
      metadata,
      id: this.generateSecureToken(16)
    };
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Whether email is valid
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Rate limiting check
   * @param {string} key - Rate limit key (e.g., IP address)
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} Rate limit status
   */
  static checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
    // This is a simple in-memory implementation
    // In production, use Redis or similar
    if (!this.rateLimitStore) {
      this.rateLimitStore = new Map();
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.rateLimitStore.has(key)) {
      this.rateLimitStore.set(key, []);
    }

    const requests = this.rateLimitStore.get(key);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...validRequests) + windowMs
      };
    }

    validRequests.push(now);
    this.rateLimitStore.set(key, validRequests);

    return {
      allowed: true,
      remaining: maxRequests - validRequests.length,
      resetTime: now + windowMs
    };
  }
}

module.exports = SecurityUtil;