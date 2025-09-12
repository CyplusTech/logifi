const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  rating: { type: Number, required: true },
  reviews: [{ type: String, required: true }],
  sentiment: { type: String },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true }, // ObjectId ref
  agentEmail: { type: String, required: true }, // store email too
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
