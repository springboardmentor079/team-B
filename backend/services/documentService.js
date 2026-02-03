const VerificationDocument = require('../models/VerificationDocument');
const encryptionUtil = require('../utils/encryption');
const path = require('path');

class DocumentService {
  /**
   * Upload and store verification document
   * @param {string} userId - User ID
   * @param {Object} file - Uploaded file object
   * @param {string} documentType - Type of document
   * @returns {Object} - Document record
   */
  async uploadDocument(userId, file, documentType) {
    try {
      // Validate file type and size
      this.validateFile(file);
      
      // Encrypt file data
      const encryptedFile = encryptionUtil.encrypt(file.buffer);
      
      // Create document record
      const document = new VerificationDocument({
        userId: userId,
        documentType: documentType,
        encryptedData: Buffer.concat([
          encryptedFile.iv,
          encryptedFile.authTag,
          encryptedFile.encryptedData
        ]),
        metadata: {
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadDate: new Date()
        },
        status: 'pending'
      });
      
      await document.save();
      
      // Return document info without sensitive data
      return {
        id: document._id,
        documentType: document.documentType,
        status: document.status,
        uploadDate: document.metadata.uploadDate,
        originalName: document.metadata.originalName
      };
    } catch (error) {
      throw new Error(`Document upload failed: ${error.message}`);
    }
  }

  /**
   * Retrieve and decrypt document
   * @param {string} documentId - Document ID
   * @param {string} requesterId - ID of user requesting document
   * @returns {Object} - Decrypted document data
   */
  async retrieveDocument(documentId, requesterId) {
    try {
      const document = await VerificationDocument.findById(documentId)
        .populate('userId', 'name email role')
        .populate('reviewedBy', 'name email');
      
      if (!document) {
        throw new Error('Document not found');
      }
      
      // Check permissions - only document owner or officials can access
      const requester = await require('../models/User').findById(requesterId);
      if (!requester) {
        throw new Error('Unauthorized access');
      }
      
      const canAccess = document.userId._id.toString() === requesterId || 
                       requester.role === 'official';
      
      if (!canAccess) {
        throw new Error('Insufficient permissions to access document');
      }
      
      // Decrypt document data
      const encryptedBuffer = document.encryptedData;
      const iv = encryptedBuffer.slice(0, 16);
      const authTag = encryptedBuffer.slice(16, 32);
      const encryptedData = encryptedBuffer.slice(32);
      
      const decryptedData = encryptionUtil.decrypt({
        encryptedData: encryptedData,
        iv: iv,
        authTag: authTag
      });
      
      return {
        id: document._id,
        documentType: document.documentType,
        status: document.status,
        metadata: document.metadata,
        data: decryptedData,
        owner: document.userId,
        reviewInfo: document.reviewedBy ? {
          reviewedBy: document.reviewedBy,
          reviewedAt: document.reviewedAt,
          reviewNotes: document.reviewNotes
        } : null
      };
    } catch (error) {
      throw new Error(`Document retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get user's documents (metadata only)
   * @param {string} userId - User ID
   * @returns {Array} - Array of document metadata
   */
  async getUserDocuments(userId) {
    try {
      const documents = await VerificationDocument.find({ userId })
        .select('-encryptedData')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 });
      
      return documents.map(doc => ({
        id: doc._id,
        documentType: doc.documentType,
        status: doc.status,
        metadata: doc.metadata,
        reviewInfo: doc.reviewedBy ? {
          reviewedBy: doc.reviewedBy,
          reviewedAt: doc.reviewedAt,
          reviewNotes: doc.reviewNotes
        } : null,
        createdAt: doc.createdAt
      }));
    } catch (error) {
      throw new Error(`Failed to retrieve user documents: ${error.message}`);
    }
  }

  /**
   * Update document status (for verification workflow)
   * @param {string} documentId - Document ID
   * @param {string} status - New status
   * @param {string} reviewerId - ID of reviewer
   * @param {string} reviewNotes - Optional review notes
   * @returns {Object} - Updated document
   */
  async updateDocumentStatus(documentId, status, reviewerId, reviewNotes = null) {
    try {
      const document = await VerificationDocument.findByIdAndUpdate(
        documentId,
        {
          status: status,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes
        },
        { new: true }
      ).populate('userId', 'name email');
      
      if (!document) {
        throw new Error('Document not found');
      }
      
      return {
        id: document._id,
        documentType: document.documentType,
        status: document.status,
        owner: document.userId,
        reviewedAt: document.reviewedAt,
        reviewNotes: document.reviewNotes
      };
    } catch (error) {
      throw new Error(`Failed to update document status: ${error.message}`);
    }
  }

  /**
   * Get pending documents for review
   * @returns {Array} - Array of pending documents
   */
  async getPendingDocuments() {
    try {
      const documents = await VerificationDocument.find({ status: 'pending' })
        .select('-encryptedData')
        .populate('userId', 'name email role')
        .sort({ createdAt: 1 });
      
      return documents.map(doc => ({
        id: doc._id,
        documentType: doc.documentType,
        status: doc.status,
        metadata: doc.metadata,
        owner: doc.userId,
        createdAt: doc.createdAt
      }));
    } catch (error) {
      throw new Error(`Failed to retrieve pending documents: ${error.message}`);
    }
  }

  /**
   * Validate uploaded file
   * @param {Object} file - File object
   */
  validateFile(file) {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'image/tiff'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, and TIFF files are allowed.');
    }
    
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }
    
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('File data is empty or corrupted.');
    }
  }

  /**
   * Delete document (for data cleanup)
   * @param {string} documentId - Document ID
   * @param {string} requesterId - ID of user requesting deletion
   */
  async deleteDocument(documentId, requesterId) {
    try {
      const document = await VerificationDocument.findById(documentId);
      
      if (!document) {
        throw new Error('Document not found');
      }
      
      // Only document owner or officials can delete
      const requester = await require('../models/User').findById(requesterId);
      const canDelete = document.userId.toString() === requesterId || 
                       requester.role === 'official';
      
      if (!canDelete) {
        throw new Error('Insufficient permissions to delete document');
      }
      
      await VerificationDocument.findByIdAndDelete(documentId);
      
      return { success: true, message: 'Document deleted successfully' };
    } catch (error) {
      throw new Error(`Document deletion failed: ${error.message}`);
    }
  }
}

module.exports = new DocumentService();