const SecurityUtil = require('../utils/security');

/**
 * Require specific role
 * @param {string|Array} allowedRoles - Role(s) that are allowed
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.user.role)) {
      // Log unauthorized access attempt
      const auditLog = SecurityUtil.createAuditLog(
        'UNAUTHORIZED_ACCESS',
        req.user.id,
        req.ip,
        { 
          endpoint: req.path,
          method: req.method,
          userRole: req.user.role,
          requiredRoles: roles
        }
      );
      console.log('Unauthorized Access:', auditLog);

      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Require citizen role
 */
const requireCitizen = requireRole('citizen');

/**
 * Require official role
 */
const requireOfficial = requireRole('official');

/**
 * Require verified official role
 */
const requireVerifiedOfficial = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'official') {
    const auditLog = SecurityUtil.createAuditLog(
      'UNAUTHORIZED_ACCESS',
      req.user.id,
      req.ip,
      { 
        endpoint: req.path,
        method: req.method,
        userRole: req.user.role,
        requiredRole: 'official'
      }
    );
    console.log('Unauthorized Access:', auditLog);

    return res.status(403).json({ 
      message: 'Official role required',
      code: 'OFFICIAL_ROLE_REQUIRED'
    });
  }

  if (req.user.verificationStatus !== 'verified') {
    const auditLog = SecurityUtil.createAuditLog(
      'UNVERIFIED_ACCESS_ATTEMPT',
      req.user.id,
      req.ip,
      { 
        endpoint: req.path,
        method: req.method,
        verificationStatus: req.user.verificationStatus
      }
    );
    console.log('Unverified Access Attempt:', auditLog);

    return res.status(403).json({ 
      message: 'Official verification required',
      code: 'VERIFICATION_REQUIRED',
      verificationStatus: req.user.verificationStatus
    });
  }

  next();
};

/**
 * Require verification status
 * @param {string|Array} allowedStatuses - Verification status(es) that are allowed
 */
const requireVerificationStatus = (allowedStatuses) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const statuses = Array.isArray(allowedStatuses) ? allowedStatuses : [allowedStatuses];
    
    if (!statuses.includes(req.user.verificationStatus)) {
      const auditLog = SecurityUtil.createAuditLog(
        'VERIFICATION_STATUS_DENIED',
        req.user.id,
        req.ip,
        { 
          endpoint: req.path,
          method: req.method,
          userStatus: req.user.verificationStatus,
          requiredStatuses: statuses
        }
      );
      console.log('Verification Status Denied:', auditLog);

      return res.status(403).json({ 
        message: 'Verification status not sufficient',
        code: 'VERIFICATION_STATUS_INSUFFICIENT',
        required: statuses,
        current: req.user.verificationStatus
      });
    }

    next();
  };
};

/**
 * Allow resource owner or officials
 * @param {string} resourceUserIdField - Field name in req.params that contains the user ID of the resource owner
 */
const allowOwnerOrOfficial = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    const isOwner = req.user.id === resourceUserId;
    const isOfficial = req.user.role === 'official';

    if (!isOwner && !isOfficial) {
      const auditLog = SecurityUtil.createAuditLog(
        'RESOURCE_ACCESS_DENIED',
        req.user.id,
        req.ip,
        { 
          endpoint: req.path,
          method: req.method,
          resourceUserId: resourceUserId,
          userRole: req.user.role
        }
      );
      console.log('Resource Access Denied:', auditLog);

      return res.status(403).json({ 
        message: 'Access denied - not resource owner or official',
        code: 'RESOURCE_ACCESS_DENIED'
      });
    }

    // Add permission context to request
    req.permission = {
      isOwner: isOwner,
      isOfficial: isOfficial,
      resourceUserId: resourceUserId
    };

    next();
  };
};

/**
 * Require resource ownership
 * @param {string} resourceUserIdField - Field name that contains the user ID of the resource owner
 */
const requireOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (req.user.id !== resourceUserId) {
      const auditLog = SecurityUtil.createAuditLog(
        'OWNERSHIP_DENIED',
        req.user.id,
        req.ip,
        { 
          endpoint: req.path,
          method: req.method,
          resourceUserId: resourceUserId
        }
      );
      console.log('Ownership Denied:', auditLog);

      return res.status(403).json({ 
        message: 'Access denied - not resource owner',
        code: 'OWNERSHIP_REQUIRED'
      });
    }

    next();
  };
};

/**
 * Check location-based permissions
 * @param {boolean} requireSameJurisdiction - Whether users must be in same jurisdiction
 */
const checkLocationPermissions = (requireSameJurisdiction = false) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (requireSameJurisdiction) {
      if (!req.user.location || !req.user.location.jurisdiction) {
        return res.status(403).json({ 
          message: 'Location information required',
          code: 'LOCATION_REQUIRED'
        });
      }

      // Add jurisdiction info to request for further processing
      req.jurisdiction = req.user.location.jurisdiction;
    }

    next();
  };
};

/**
 * Dynamic permission checker
 * @param {Function} permissionCheck - Custom permission check function
 */
const checkPermission = (permissionCheck) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    try {
      const hasPermission = await permissionCheck(req.user, req);
      
      if (!hasPermission) {
        const auditLog = SecurityUtil.createAuditLog(
          'CUSTOM_PERMISSION_DENIED',
          req.user.id,
          req.ip,
          { 
            endpoint: req.path,
            method: req.method,
            permissionCheck: permissionCheck.name || 'anonymous'
          }
        );
        console.log('Custom Permission Denied:', auditLog);

        return res.status(403).json({ 
          message: 'Permission denied',
          code: 'PERMISSION_DENIED'
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        message: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Log access attempts for audit purposes
 */
const logAccess = (req, res, next) => {
  const auditLog = SecurityUtil.createAuditLog(
    'ENDPOINT_ACCESS',
    req.user ? req.user.id : null,
    req.ip,
    { 
      endpoint: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    }
  );
  console.log('Endpoint Access:', auditLog);

  next();
};

module.exports = {
  requireRole,
  requireCitizen,
  requireOfficial,
  requireVerifiedOfficial,
  requireVerificationStatus,
  allowOwnerOrOfficial,
  requireOwnership,
  checkLocationPermissions,
  checkPermission,
  logAccess
};