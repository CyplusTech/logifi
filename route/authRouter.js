const controller = require("../controller/authController");
const { isVerified, notVerified } = require("../middlewares/AgentMiddleware");

const express = require("express");
const router = express.Router();

///// Chat agent verification (for WhatsApp chat) /////
// Show OTP input page
router.get("/lodges/chat-auth", controller.chatAgentForm);

// Send/Verify OTP for chat
router.post("/chat/otp/send", controller.chatAgentSendOtp);
router.post("/chat/otp/verify", controller.chatAgentVerifyOtp);

///// Become an agent verification /////
// Show OTP form for posting lodges
router.get("/post-lodge/auth", notVerified, controller.authForm);

// Send/Verify OTP for agent registration
router.post("/auth/otp/send", controller.sendOtp);
router.post("/auth/otp/verify", controller.verifyOtp);

module.exports = router;
