const mongoose = require('mongoose');

const verificationDocumentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  documentType: { 
    type: String, 
    enum: ['government_id', 'passport', 'drivers_license', 'official_credentials'],
    required: true 
  },
  encryptedData: { type: Buffer, required: true },
  metadata: {
    originalName: String,
    mimeType: String,
    size: Number,
    uploadDate: { type: Date, default: Date.now }
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reviewedAt: Date,
  reviewNotes: String
}, { timestamps: true });

// Indexes for efficient queries
verificationDocumentSchema.index({ userId: 1, status: 1 });
verificationDocumentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('VerificationDocument', verificationDocumentSchema);