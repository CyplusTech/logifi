const mongoose = require("mongoose");

const userAuthSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  phone: { type: String},
  verified: { type: Boolean, default: false },
  deviceFingerprint: String,
  location: String,
  verifiedAt: Date,
  verifiedUntil: { type: Date },
});

module.exports = mongoose.model("User", userAuthSchema);
