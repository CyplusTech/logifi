const ReviewController = require('../controller/ReviewController');

// app/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();

router.post('/submit-review', ReviewController.submitReview);

module.exports = router;
