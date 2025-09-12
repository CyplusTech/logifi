const mongoose = require("mongoose");

const clickSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  userAgent: String,
  location: {
    country: String,
    city: String,
  },
  day: { type: String, index: true }, // e.g. "2025-08-25"
  actions: [
    {
      action: String,  // e.g. "contact_agent"
      lodgeId: { type: mongoose.Schema.Types.ObjectId, ref: "Lodge" },
      page: String,    // which route/page the button was on
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// One doc per user/day
clickSchema.index({ ip: 1, day: 1 }, { unique: true });

module.exports = mongoose.model("Click", clickSchema);
