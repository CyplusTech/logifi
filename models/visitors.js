const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema({
  ip: { type: String, required: true, index: true },
  userAgent: String,
  location: {
    country: String,
    city: String,
  },
  page: String,
  day: { type: String, index: true }, // YYYY-MM-DD
  firstVisit: { type: Date, default: Date.now },

  // Events captured
  actions: [
    {
      action: String, // e.g. "view_lodge_btn", "contact_agent_btn"
      lodgeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Lodge", 
        required: false, // make it optional
      },
      page: String,
      clickedAt: { type: Date, default: Date.now }
    },
  ],

  // Aggregates
  totalVisits: { type: Number, default: 0 },
  totalClicks: { type: Number, default: 0 },

  dailyStats: [
    {
      date: { type: String }, // YYYY-MM-DD
      visits: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 }
    }
  ]
});

// One doc per IP per day
visitorSchema.index({ ip: 1, day: 1 }, { unique: true });

// Helpful analytics indexes
visitorSchema.index({ day: 1, "actions.action": 1 });
visitorSchema.index({ day: 1, "actions.lodgeId": 1 });

module.exports = mongoose.model("Visitor", visitorSchema);
