// models/Lodge.js
const mongoose = require("mongoose");

const lodgeSchema = new mongoose.Schema({
  postedBy: { type: String, required: true },
  title: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  phone: { type: String, required: true },
  desc: String,
  media: [
    {
      url: String,
      type: { type: String, enum: ["image", "video"] }
    }
  ],
  status: { type: String, default: "available" },
  type: String
}, { timestamps: true });

module.exports = mongoose.model("Lodge", lodgeSchema);
