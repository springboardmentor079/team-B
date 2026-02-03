const express = require('express');
const router = express.Router();
const multer = require('multer');
const verificationService = require('../services/verificationService');
const documentService = require('../services/documentService');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireOfficial, requireVerifiedOfficial, allowOwnerOrOfficial } = require('../middleware/roleMiddleware');

// Configure multer for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
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

/**
 * Submit verification request (for officials)
 */
router.post('/submit', authenticateToken, requireOfficial, upload.array('documents', 5), async (req, res) => {
  try {
    const { documentTypes } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one document is required' });
    }

    // Parse document types (should be JSON string or array)
    let types;
    try {
      types = typeof documentTypes === 'string' ? JSON.parse(documentTypes) : documentTypes;
    } catch (error) {
      return res.status(400).json({ message: 'Invalid document types format' });
    }

    if (!Array.isArray(types) || types.length !== req.files.length) {
      return res.status(400).json({ message: 'Document types must match number of uploaded files' });
    }

    // Prepare documents array
    const documents = req.files.map((file, index) => ({
      file: file,
      documentType: types[index]
    }));

    const result = await verificationService.submitVerificationRequest(req.user.id, documents);
    res.json(result);

  } catch (error) {
    console.error('Verification submission error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Resubmit verification after rejection
 */
router.post('/resubmit', authenticateToken, requireOfficial, upload.array('documents', 5), async (req, res) => {
  try {
    const { documentTypes } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one document is required' });
    }

    let types;
    try {
      types = typeof documentTypes === 'string' ? JSON.parse(documentTypes) : documentTypes;
    } catch (error) {
      return res.status(400).json({ message: 'Invalid document types format' });
    }

    if (!Array.isArray(types) || types.length !== req.files.length) {
      return res.status(400).json({ message: 'Document types must match number of uploaded files' });
    }

    const documents = req.files.map((file, index) => ({
      file: file,
      documentType: types[index]
    }));

    const result = await verificationService.resubmitVerification(req.user.id, documents);
    res.json(result);

  } catch (error) {
    console.error('Verification resubmission error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get verification status for current user
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const result = await verificationService.getVerificationStatus(req.user.id);
    res.json(result);

  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get verification status for specific user (officials only)
 */
router.get('/status/:userId', authenticateToken, requireVerifiedOfficial, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await verificationService.getVerificationStatus(userId);
    res.json(result);

  } catch (error) {
    console.error('Get user verification status error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get pending verification requests (for verified officials to review)
 */
router.get('/pending', authenticateToken, requireVerifiedOfficial, async (req, res) => {
  try {
    const result = await verificationService.getPendingVerificationRequests(req.user.id);
    res.json(result);

  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Review verification request (approve/reject)
 */
router.post('/review/:userId', authenticateToken, requireVerifiedOfficial, async (req, res) => {
  try {
    const { userId } = req.params;
    const { decision, notes } = req.body;

    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be either "approved" or "rejected"' });
    }

    const result = await verificationService.reviewVerificationRequest(
      userId, 
      req.user.id, 
      decision, 
      notes
    );
    res.json(result);

  } catch (error) {
    console.error('Verification review error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get verification statistics (for admin dashboard)
 */
router.get('/statistics', authenticateToken, requireVerifiedOfficial, async (req, res) => {
  try {
    const result = await verificationService.getVerificationStatistics();
    res.json(result);

  } catch (error) {
    console.error('Get verification statistics error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Document management routes

/**
 * Get user's documents
 */
router.get('/documents', authenticateToken, async (req, res) => {
  try {
    const result = await documentService.getUserDocuments(req.user.id);
    res.json(result);

  } catch (error) {
    console.error('Get user documents error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get specific document (owner or officials only)
 */
router.get('/documents/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await documentService.retrieveDocument(documentId, req.user.id);
    
    // Set appropriate headers for file download
    res.set({
      'Content-Type': result.metadata.mimeType,
      'Content-Disposition': `attachment; filename="${result.metadata.originalName}"`
    });
    
    res.send(result.data);

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Delete document (owner or officials only)
 */
router.delete('/documents/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await documentService.deleteDocument(documentId, req.user.id);
    res.json(result);

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get pending documents for review (verified officials only)
 */
router.get('/documents/pending/review', authenticateToken, requireVerifiedOfficial, async (req, res) => {
  try {
    const result = await documentService.getPendingDocuments();
    res.json(result);

  } catch (error) {
    console.error('Get pending documents error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;