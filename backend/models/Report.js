const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
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
    required: true,
    enum: ['infrastructure', 'public-safety', 'environment', 'public-services', 'transportation', 'other']
  },
  targetEntity: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { 
  timestamps: true 
});

// Indexes for efficient querying
reportSchema.index({ category: 1, status: 1 });
reportSchema.index({ priority: 1, status: 1 });
reportSchema.index({ createdBy: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Report', reportSchema);