const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');

const router = express.Router();

router.post('/login', adminController.login);
router.get('/verification/pending', authenticateAdmin, adminController.getPendingVerifications);
router.post('/verification/review/:userId', authenticateAdmin, adminController.reviewVerification);
router.get('/verification/document/:documentId', authenticateAdmin, adminController.downloadVerificationDocument);
router.get('/users', authenticateAdmin, adminController.getManagedUsers);
router.delete('/users/:userId', authenticateAdmin, adminController.deleteManagedUser);

module.exports = router;
