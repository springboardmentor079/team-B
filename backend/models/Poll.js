const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  title: { type: String, required: true },
  options: [{
    label: String,
    votes: { type: Number, default: 0 }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema);
