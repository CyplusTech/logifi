const controller = require("../controller/contactController");
// const { chatVerify } = require("../middlewares/chatVerify");

const express = require("express");
const router = express.Router();

// Contact form (site general)
router.post("/contact/send", controller.sendContactMessage);

// Start chat with an agent (no verification)
router.get("/lodges/start-chat/:id", controller.startChat);



// Start chat with an agent (requires verification)
// router.get("/lodges/get-wa-link", controller.getWaLink);
module.exports = router;
