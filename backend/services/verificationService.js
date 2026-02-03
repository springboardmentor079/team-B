const User = require('../models/User');
const VerificationDocument = require('../models/VerificationDocument');
const documentService = require('./documentService');

// Notification service (placeholder - would integrate with actual notification system)
const notificationService = {
  async sendVerificationStatusUpdate(userId, status, notes = null) {
    const user = await User.findById(userId);
    if (user) {
      console.log(`Verification status update sent to ${user.email}: ${status}`);
      if (notes) {
        console.log(`Notes: ${notes}`);
      }
    }
    return true;
  }
};

class VerificationService {
  /**
   * Submit verification request for official user
   * @param {string} userId - User ID
   * @param {Array} documents - Array of uploaded documents
   * @returns {Object} - Verification request result
   */
  async submitVerificationRequest(userId, documents) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.role !== 'official') {
        throw new Error('Only official users can submit verification requests');
      }

      if (user.verificationStatus === 'verified') {
        throw new Error('User is already verified');
      }

      // Upload documents
      const uploadedDocs = [];
      for (const doc of documents) {
        const uploadResult = await documentService.uploadDocument(
          userId,
          doc.file,
          doc.documentType
        );
        uploadedDocs.push(uploadResult);
      }

      // Update user verification status to pending
      user.verificationStatus = 'pending';
      await user.save();

      return {
        message: 'Verification request submitted successfully',
        verificationStatus: user.verificationStatus,
        documents: uploadedDocs
      };

    } catch (error) {
      throw new Error(`Verification request failed: ${error.message}`);
    }
  }

  /**
   * Review and approve/reject verification request
   * @param {string} userId - User ID being reviewed
   * @param {string} reviewerId - ID of reviewer (must be official)
   * @param {string} decision - 'approved' or 'rejected'
   * @param {string} notes - Review notes
   * @returns {Object} - Review result
   */
  async reviewVerificationRequest(userId, reviewerId, decision, notes = null) {
    try {
      // Validate reviewer permissions
      const reviewer = await User.findById(reviewerId);
      if (!reviewer || reviewer.role !== 'official' || reviewer.verificationStatus !== 'verified') {
        throw new Error('Only verified officials can review verification requests');
      }

      // Find user being reviewed
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.verificationStatus !== 'pending') {
        throw new Error('User verification is not in pending status');
      }

      // Validate decision
      if (!['approved', 'rejected'].includes(decision)) {
        throw new Error('Decision must be either "approved" or "rejected"');
      }

      // Update user verification status
      const newStatus = decision === 'approved' ? 'verified' : 'rejected';
      user.verificationStatus = newStatus;
      await user.save();

      // Update all user's documents with review decision
      const userDocuments = await VerificationDocument.find({ userId });
      for (const doc of userDocuments) {
        if (doc.status === 'pending') {
          await documentService.updateDocumentStatus(
            doc._id,
            decision,
            reviewerId,
            notes
          );
        }
      }

      // Send notification to user
      try {
        await notificationService.sendVerificationStatusUpdate(userId, newStatus, notes);
      } catch (notificationError) {
        console.error('Failed to send verification notification:', notificationError);
        // Don't fail the review process if notification fails
      }

      return {
        message: `Verification ${decision} successfully`,
        userId: userId,
        verificationStatus: newStatus,
        reviewedBy: reviewer.name,
        reviewedAt: new Date(),
        notes: notes
      };

    } catch (error) {
      throw new Error(`Verification review failed: ${error.message}`);
    }
  }

  /**
   * Get pending verification requests (for officials to review)
   * @param {string} reviewerId - ID of reviewer
   * @returns {Array} - Array of pending verification requests
   */
  async getPendingVerificationRequests(reviewerId) {
    try {
      // Validate reviewer permissions
      const reviewer = await User.findById(reviewerId);
      if (!reviewer || reviewer.role !== 'official' || reviewer.verificationStatus !== 'verified') {
        throw new Error('Only verified officials can view pending verification requests');
      }

      // Get users with pending verification
      const pendingUsers = await User.find({ 
        verificationStatus: 'pending',
        role: 'official'
      }).select('-password -passwordResetToken -emailVerificationToken');

      // Get their documents
      const requests = [];
      for (const user of pendingUsers) {
        const documents = await documentService.getUserDocuments(user._id);
        requests.push({
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            verificationStatus: user.verificationStatus,
            location: user.location,
            createdAt: user.createdAt
          },
          documents: documents.filter(doc => doc.status === 'pending')
        });
      }

      return requests;

    } catch (error) {
      throw new Error(`Failed to get pending verification requests: ${error.message}`);
    }
  }

  /**
   * Get verification status for a user
   * @param {string} userId - User ID
   * @returns {Object} - Verification status and details
   */
  async getVerificationStatus(userId) {
    try {
      const user = await User.findById(userId).select('-password -passwordResetToken -emailVerificationToken');
      if (!user) {
        throw new Error('User not found');
      }

      const documents = await documentService.getUserDocuments(userId);

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          verificationStatus: user.verificationStatus,
          emailVerified: user.emailVerified
        },
        documents: documents,
        canSubmitVerification: user.role === 'official' && 
                              user.verificationStatus !== 'verified' &&
                              user.verificationStatus !== 'pending'
      };

    } catch (error) {
      throw new Error(`Failed to get verification status: ${error.message}`);
    }
  }

  /**
   * Resubmit verification after rejection
   * @param {string} userId - User ID
   * @param {Array} newDocuments - Array of new documents
   * @returns {Object} - Resubmission result
   */
  async resubmitVerification(userId, newDocuments) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.role !== 'official') {
        throw new Error('Only official users can resubmit verification');
      }

      if (user.verificationStatus === 'verified') {
        throw new Error('User is already verified');
      }

      if (user.verificationStatus === 'pending') {
        throw new Error('Verification is already pending review');
      }

      // Upload new documents
      const uploadedDocs = [];
      for (const doc of newDocuments) {
        const uploadResult = await documentService.uploadDocument(
          userId,
          doc.file,
          doc.documentType
        );
        uploadedDocs.push(uploadResult);
      }

      // Update user verification status back to pending
      user.verificationStatus = 'pending';
      await user.save();

      return {
        message: 'Verification resubmitted successfully',
        verificationStatus: user.verificationStatus,
        documents: uploadedDocs
      };

    } catch (error) {
      throw new Error(`Verification resubmission failed: ${error.message}`);
    }
  }

  /**
   * Get verification statistics (for admin dashboard)
   * @returns {Object} - Verification statistics
   */
  async getVerificationStatistics() {
    try {
      const stats = await User.aggregate([
        {
          $match: { role: 'official' }
        },
        {
          $group: {
            _id: '$verificationStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        total: 0,
        unverified: 0,
        pending: 0,
        verified: 0,
        rejected: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
      });

      // Get pending documents count
      const pendingDocsCount = await VerificationDocument.countDocuments({ status: 'pending' });
      result.pendingDocuments = pendingDocsCount;

      return result;

    } catch (error) {
      throw new Error(`Failed to get verification statistics: ${error.message}`);
    }
  }
}

module.exports = new VerificationService();