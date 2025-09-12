const mongoose = require("mongoose");

const chatSessionSchema = new mongoose.Schema({
  lodgeId: { type: mongoose.Schema.Types.ObjectId, ref: "Lodge", required: true },
  agentEmail: { type: String, required: true }, // landlord/agent
  userEmail: { type: String, required: true },  // person starting chat
  lastStartedAt: { type: Date, default: Date.now }, // update every time user clicks
}, { timestamps: true });

// 🔑 prevent duplicates — one record per (lodgeId + agentEmail + userEmail)
chatSessionSchema.index({ lodgeId: 1, agentEmail: 1, userEmail: 1 }, { unique: true });

module.exports = mongoose.model("ChatSession", chatSessionSchema);
