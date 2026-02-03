const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  register, 
  login, 
  verifyEmail, 
  requestPasswordReset, 
  verifyResetOTP,
  resetPasswordWithToken, 
  getProfile, 
  updateProfile,
  requestRegistrationOTP,
  verifyRegistrationOTP
} = require('../controllers/authController');
const { authenticateToken, rateLimitAuth, requireEmailVerification } = require('../middleware/authMiddleware');
const { requireOwnership } = require('../middleware/roleMiddleware');

// Configure multer for file uploads (in memory storage for security)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, and TIFF files are allowed.'));
    }
  }
});

// Public routes (no authentication required)
router.post('/register', rateLimitAuth(5, 300000), register); // 5 attempts per 5 minutes
router.post('/request-registration-otp', rateLimitAuth(5, 300000), requestRegistrationOTP); // 5 attempts per 5 minutes
router.post('/verify-registration-otp', rateLimitAuth(5, 300000), verifyRegistrationOTP); // 5 attempts per 5 minutes
router.post('/login', rateLimitAuth(5, 300000), login); // 5 attempts per 5 minutes
router.get('/verify-email/:token', verifyEmail);
router.post('/request-password-reset', rateLimitAuth(3, 300000), requestPasswordReset); // 3 attempts per 5 minutes
router.get('/reset-password/:token', resetPasswordWithToken); // Handle reset link
router.post('/reset-password', rateLimitAuth(3, 300000), resetPasswordWithToken); // 3 attempts per 5 minutes

// Protected routes (authentication required)
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;
