const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

// Quick stats endpoint
router.get('/quick', authenticateToken, dashboardController.quickStats);

// Recent activity endpoint
router.get('/recent-activity', authenticateToken, dashboardController.recentActivity);

// Featured content endpoint
router.get('/featured', authenticateToken, dashboardController.featuredContent);

module.exports = router;
