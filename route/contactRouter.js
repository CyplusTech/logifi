const controller = require("../controller/contactController");
const ChatSession = require("../models/ChatSession");
const { chatVerify } = require("../middlewares/chatVerify");

const express = require("express");
const router = express.Router();

// Contact form (site general)
router.post("/contact/send", controller.sendContactMessage);

// Start chat with an agent (requires verification)
router.get("/lodges/start-chat/:id", chatVerify, controller.chatPage);

router.get("/lodges/get-wa-link", chatVerify, controller.getWaLink);


module.exports = router;
