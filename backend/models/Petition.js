const mongoose = require('mongoose');

const petitionSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['Infrastructure', 'Environment', 'Education', 'Healthcare', 'Public Safety', 'Transportation', 'General'],
    default: 'General'
  },
  status: {
    type: String,
    enum: ['active', 'under_review', 'completed', 'closed'],
    default: 'active'
  },
  target_signatures: {
    type: Number,
    default: 100,
    min: 1
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  location: {
    jurisdiction: {
      city: String,
      state: String,
      district: String
    },
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  officialResponses: [{
    official: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    statusAfterUpdate: {
      type: String,
      enum: ['active', 'under_review', 'completed', 'closed'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for signature count
petitionSchema.virtual('signature_count', {
  ref: 'Signature',
  localField: '_id',
  foreignField: 'petition',
  count: true
});

// Index for better query performance
petitionSchema.index({ createdBy: 1 });
petitionSchema.index({ status: 1 });
petitionSchema.index({ category: 1 });
petitionSchema.index({ createdAt: -1 });
petitionSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Petition', petitionSchema);
