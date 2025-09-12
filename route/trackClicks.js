const trackController = require("../controller/tracking");

// routes/track.js
const express = require("express");
const router = express.Router();

router.post("/click", trackController.trackClick); 

module.exports = router;
