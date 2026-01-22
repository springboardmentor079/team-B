const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SecurityUtil = require('../utils/security');

/**
 * Verify JWT token and authenticate user
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and account is active
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if account is locked
    if (SecurityUtil.isAccountLocked(user)) {
      return res.status(423).json({ 
        message: 'Account is temporarily locked',
        code: 'ACCOUNT_LOCKED',
        lockUntil: user.lockUntil
      });
    }

    // Attach user to request object
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      emailVerified: user.emailVerified,
      location: user.location
    };

    // Log successful authentication for audit
    const auditLog = SecurityUtil.createAuditLog(
      'AUTH_SUCCESS',
      user._id,
      req.ip,
      { endpoint: req.path, method: req.method }
    );
    console.log('Auth Success:', auditLog);

    next();

  } catch (error) {
    // Log failed authentication attempt
    const auditLog = SecurityUtil.createAuditLog(
      'AUTH_FAILED',
      null,
      req.ip,
      { 
        endpoint: req.path, 
        method: req.method,
        error: error.message,
        token: req.headers['authorization'] ? 'present' : 'missing'
      }
    );
    console.log('Auth Failed:', auditLog);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({ 
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && !SecurityUtil.isAccountLocked(user)) {
      req.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        emailVerified: user.emailVerified,
        location: user.location
      };
    } else {
      req.user = null;
    }

    next();

  } catch (error) {
    // For optional auth, we don't fail on token errors
    req.user = null;
    next();
  }
};

/**
 * Rate limiting middleware
 */
const rateLimitAuth = (maxRequests = 5, windowMs = 60000) => {
  return (req, res, next) => {
    // Use a composite key including endpoint so limits apply per endpoint per IP
    const key = `${req.ip}:${req.path}`;
    const rateLimit = SecurityUtil.checkRateLimit(key, maxRequests, windowMs);
    
    if (!rateLimit.allowed) {
      const auditLog = SecurityUtil.createAuditLog(
        'RATE_LIMIT_EXCEEDED',
        null,
        req.ip,
        { 
          endpoint: req.path,
          method: req.method,
          resetTime: rateLimit.resetTime
        }
      );
      console.log('Rate Limit Exceeded:', auditLog);

      return res.status(429).json({
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        resetTime: rateLimit.resetTime,
        remaining: rateLimit.remaining
      });
    }

    // Add rate limit info to response headers
    // Expose remaining and reset time (ms since epoch)
    res.set({
      'X-RateLimit-Remaining': rateLimit.remaining,
      'X-RateLimit-Reset': rateLimit.resetTime
    });

    next();
  };
};

/**
 * Require email verification
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({ 
      message: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Set security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });

  next();
};

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = SecurityUtil.sanitizeInput(req.body[key]);
      }
    }
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = SecurityUtil.sanitizeInput(req.query[key]);
      }
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  rateLimitAuth,
  requireEmailVerification,
  securityHeaders,
  sanitizeInput
};