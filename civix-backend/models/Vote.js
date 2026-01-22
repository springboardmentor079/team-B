const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  poll: { type: mongoose.Schema.Types.ObjectId, ref: 'Poll', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  choice: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Vote', voteSchema);
