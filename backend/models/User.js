const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, index: true },
  password: { type: String, required: true },
  
  // Role and Verification
  role: { type: String, enum: ['citizen', 'official'], required: true },
  verificationStatus: { 
    type: String, 
    enum: ['unverified', 'pending', 'verified', 'rejected'], 
    default: 'unverified' 
  },
  verificationDocuments: [{
    type: { type: String },
    filename: String,
    uploadDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  }],
  
  // Location Data
  location: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    jurisdiction: {
      city: String,
      state: String,
      district: String
    }
  },
  
  // Security and Audit
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordResetOTP: String,
  passwordResetOTPExpires: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  lastLogin: Date
}, { timestamps: true });

// Indexes for performance
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ verificationStatus: 1 });
userSchema.index({ role: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 minutes
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: Date.now() }
  });
};

module.exports = mongoose.model('User', userSchema);
