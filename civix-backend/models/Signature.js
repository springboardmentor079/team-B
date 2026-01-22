const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
  petition: { type: mongoose.Schema.Types.ObjectId, ref: 'Petition', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Signature', signatureSchema);
