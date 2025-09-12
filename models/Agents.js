const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ["Landlord", "Agent"], required: true },

  phone: { type: String, required: true }, 

  // OTP
  otp: { type: String },          
  otpExpires: { type: Date },

  // Verification
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },

  // ✅ KYC status
  kycCompleted: { type: Boolean, default: false },
  kycData: { 
    idType: { type: String },    // "NIN", "Passport", etc.
    idNumber: { type: String },
    idImage: { type: String },   // store file path or URL if uploaded
  },

  // Persistent login
  deviceId: { type: String },
  refreshToken: { type: String }, 
}, { timestamps: true });

module.exports = mongoose.model("Agent", agentSchema);
