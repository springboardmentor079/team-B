const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const petitionController = require('../controllers/petitionController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');

// Validation middleware for creating petitions
const validatePetitionCreation = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Description must be between 50 and 2000 characters'),
  body('category')
    .isIn(['local-government', 'education', 'healthcare', 'environment', 'transportation', 'housing', 'public-safety', 'other'])
    .withMessage('Invalid category'),
  body('targetSignatures')
    .optional()
    .isInt({ min: 10, max: 100000 })
    .withMessage('Target signatures must be between 10 and 100,000'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('targetLocation')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Target location must be between 2 and 100 characters')
];

// Validation middleware for signing petitions
const validateSignature = [
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment must not exceed 500 characters')
];

const validateOfficialResponse = [
  body('comment')
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Comment must be between 5 and 1000 characters'),
  body('status')
    .optional()
    .isIn(['active', 'under_review', 'completed', 'closed'])
    .withMessage('Invalid status')
];

// Validation middleware for updating petitions
const validatePetitionUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Description must be between 50 and 2000 characters'),
  body('category')
    .optional()
    .isIn(['local-government', 'education', 'healthcare', 'environment', 'transportation', 'housing', 'public-safety', 'other'])
    .withMessage('Invalid category'),
  body('targetSignatures')
    .optional()
    .isInt({ min: 10, max: 100000 })
    .withMessage('Target signatures must be between 10 and 100,000'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('targetLocation')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Target location must be between 2 and 100 characters'),
  body('status')
    .optional()
    .isIn(['active', 'closed', 'successful'])
    .withMessage('Invalid status')
];


// Public but can read user if logged in
router.get('/', optionalAuth, petitionController.getPetitions);
router.get('/locality', authenticateToken, petitionController.getLocalityPetitions);
router.get('/locality-officials', authenticateToken, petitionController.getLocalityOfficialsWithRemarks);

router.get('/:id', petitionController.getPetitionById);

// Protected routes (authentication required)
router.use(authenticateToken);

// Create a new petition
router.post('/', validatePetitionCreation, petitionController.createPetition);

// Sign a petition
router.post('/:id/sign', validateSignature, petitionController.signPetition);

// Official response and status update
router.post('/:id/respond', validateOfficialResponse, petitionController.respondToPetition);

// Get user's signature on a specific petition
router.get('/:id/my-signature', petitionController.getUserSignature);

// Update a petition (creator or admin only)
router.put('/:id', validatePetitionUpdate, petitionController.updatePetition);

// Delete a petition (creator or admin only)
router.delete('/:id', petitionController.deletePetition);

// Get petition signatures (creator or admin only)
router.get('/:id/signatures', petitionController.getPetitionSignatures);

// Get petition statistics (creator or admin only)
router.get('/:id/stats', petitionController.getPetitionStats);

module.exports = router;
