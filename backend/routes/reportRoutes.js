const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Validation middleware for creating reports
const validateReportCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('category')
    .isIn(['infrastructure', 'public-safety', 'environment', 'public-services', 'transportation', 'other'])
    .withMessage('Invalid category'),
  body('targetEntity')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Target entity must be between 2 and 100 characters'),
  body('location')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Location must be between 5 and 200 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority')
];

// Validation middleware for updating reports
const validateReportUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('category')
    .optional()
    .isIn(['infrastructure', 'public-safety', 'environment', 'public-services', 'transportation', 'other'])
    .withMessage('Invalid category'),
  body('targetEntity')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Target entity must be between 2 and 100 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Location must be between 5 and 200 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'resolved', 'closed'])
    .withMessage('Invalid status')
];

// Public routes (no authentication required)
router.get('/', reportController.getReports);

// Milestone 4 monthly civic engagement reports (officials only)
router.get('/monthly/export', authenticateToken, reportController.exportMonthlyReport);
router.get('/petitions/status-monthly', authenticateToken, reportController.getPetitionStatusMonthly);

router.get('/:id', reportController.getReportById);

// Protected routes (authentication required)
router.use(authenticateToken);

// Create a new report
router.post('/', validateReportCreation, reportController.createReport);

// Update a report (creator or admin only)
router.put('/:id', validateReportUpdate, reportController.updateReport);

// Delete a report (creator or admin only)
router.delete('/:id', reportController.deleteReport);

module.exports = router;
