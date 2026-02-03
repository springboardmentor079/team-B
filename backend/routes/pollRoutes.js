const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const pollController = require('../controllers/pollController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Validation middleware for creating polls
const validatePollCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('options')
    .isArray({ min: 2, max: 10 })
    .withMessage('Must provide between 2 and 10 options'),
  body('options.*')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each option must be between 1 and 100 characters'),
  body('targetLocation')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Target location must be between 2 and 100 characters'),
  body('category')
    .isIn(['local-government', 'education', 'healthcare', 'environment', 'transportation', 'housing', 'public-safety', 'other'])
    .withMessage('Invalid category'),
  body('expiresAt')
    .isISO8601()
    .withMessage('Invalid expiration date format'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
  body('allowMultipleVotes')
    .optional()
    .isBoolean()
    .withMessage('allowMultipleVotes must be a boolean'),
  body('requireVerification')
    .optional()
    .isBoolean()
    .withMessage('requireVerification must be a boolean')
];

// Validation middleware for voting
const validateVote = [
  body('optionIndex')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Option index must be a non-negative integer'),
  body('optionIndexes')
    .optional()
    .isArray()
    .withMessage('Option indexes must be an array'),
  body('optionIndexes.*')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Each option index must be a non-negative integer')
];

// Validation middleware for updating polls
const validatePollUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('targetLocation')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Target location must be between 2 and 100 characters'),
  body('category')
    .optional()
    .isIn(['local-government', 'education', 'healthcare', 'environment', 'transportation', 'housing', 'public-safety', 'other'])
    .withMessage('Invalid category'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiration date format')
];

// Public routes (no authentication required)
router.get('/', pollController.getPolls);
router.get('/:id', pollController.getPollById);

// Protected routes (authentication required)
router.use(authenticateToken);

// Create a new poll
router.post('/', validatePollCreation, pollController.createPoll);

// Vote on a poll
router.post('/:id/vote', validateVote, pollController.voteOnPoll);

// Get user's vote on a specific poll
router.get('/:id/my-vote', pollController.getUserVote);

// Update a poll (creator or admin only)
router.put('/:id', validatePollUpdate, pollController.updatePoll);

// Delete a poll (creator or admin only)
router.delete('/:id', pollController.deletePoll);

// Get poll statistics (creator or admin only)
router.get('/:id/stats', pollController.getPollStats);

module.exports = router;