const mongoose = require('mongoose');

const petitionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Petition', petitionSchema);
