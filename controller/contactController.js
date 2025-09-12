const Lodge = require('../models/lodge');


const ChatSession = require("../models/ChatSession");


const { sendMail, transporter } = require("../utilities/mailer");
const { contactEmail } = require("../utilities/emailTemplates");


// ✅ chatPage.js
exports.chatPage = async (req, res) => {
  try {
    const lodgeId = req.params.id;
    const userEmail = req.session.verifiedEmail;

    if (!userEmail) return res.status(401).json({ success: false, message: "You must verify first." });

    // Session cache
    if (req.session.lastWaLink && req.session.lastLodgeId === lodgeId && req.session.lastAgentEmail) {
      return res.json({ success: true, waLink: req.session.lastWaLink });
    }

    // Fetch lodge
    const lodge = await Lodge.findById(lodgeId);
    if (!lodge) return res.status(404).json({ success: false, message: "Lodge not found" });

    const agentEmail = lodge.postedBy;
    const whatsappNumber = lodge.whatsappNumber || lodge.phone;
    const formattedPhone = whatsappNumber.startsWith("0") ? "234" + whatsappNumber.slice(1) : whatsappNumber;

    const message = encodeURIComponent(`Hello, I found your lodge listing on Logifi (ID: ${lodgeId}).`);
    const waLink = `https://wa.me/${formattedPhone}?text=${message}`;

    // Cache session
    req.session.lastWaLink = waLink;
    req.session.lastLodgeId = lodgeId;
    req.session.lastAgentEmail = agentEmail;

    // Track chat session
    await ChatSession.findOneAndUpdate(
      { userEmail, agentEmail, lodgeId },
      { $setOnInsert: { lastStartedAt: new Date() } },
      { upsert: true, new: true }
    );

    return res.json({ success: true, waLink });

  } catch (err) {
    console.error("chatPage error:", err.stack || err);
    return res.status(500).json({ success: false, message: "Server error while loading chat page" });
  }
};


// ✅ Fetch WhatsApp link safely
// ✅ Get last WhatsApp link (used by front-end cache)
exports.getWaLink = async (req, res) => {
  try {
    const verifiedEmail = req.session.verifiedEmail;
    if (!verifiedEmail) {
      res.clearCookie("wa_verified_user");
      res.clearCookie("wa_verified_email");
      return res.status(401).json({ success: false, message: "You must verify first." });
    }

    if (req.session.lastWaLink && req.session.lastLodgeId && req.session.lastAgentEmail) {
      return res.json({ success: true, waLink: req.session.lastWaLink });
    }

    const lastChat = await ChatSession.findOne({ userEmail: verifiedEmail }).sort({ lastStartedAt: -1 });
    if (!lastChat) return res.status(404).json({ success: false, message: "No previous chats found." });

    const lodge = await Lodge.findById(lastChat.lodgeId);
    if (!lodge) return res.status(404).json({ success: false, message: "Lodge not found" });

    const whatsappNumber = lodge.whatsappNumber || lodge.phone;
    const formattedPhone = whatsappNumber.startsWith("0") ? "234" + whatsappNumber.slice(1) : whatsappNumber;
    const message = encodeURIComponent(`Hello, I found your lodge listing on Logifi (ID: ${lastChat.lodgeId}).`);
    const waLink = `https://wa.me/${formattedPhone}?text=${message}`;

    req.session.lastWaLink = waLink;
    req.session.lastLodgeId = lastChat.lodgeId;
    req.session.lastAgentEmail = lastChat.agentEmail;

    return res.json({ success: true, waLink });

  } catch (err) {
    console.error("getWaLink error:", err.stack || err);
    return res.status(500).json({ success: false, message: "Server error fetching WhatsApp link." });
  }
};

// exports.getWaLink = async (req, res) => {
//   try {
//     // 🔹 Use cache if available
//     if (req.session.lastWaLink && req.session.lastLodgeId && req.session.lastAgentEmail) {
//       return res.json({
//         success: true,
//         waLink: req.session.lastWaLink,
//         lodgeId: req.session.lastLodgeId,
//         agentEmail: req.session.lastAgentEmail,
//         cached: true,
//       });
//     }

//     // 🔹 If no cache but cookie says verified, fallback to DB
//     const verifiedCookie = req.cookies.wa_verified_user;
//     const verifiedEmail = req.session.verifiedEmail;

//     if (!verifiedCookie || !verifiedEmail) {
//       return res.status(401).json({ success: false, message: "Not verified" });
//     }

//     // Find most recent chat session
//     const lastChat = await ChatSession.findOne({ userEmail: verifiedEmail })
//       .sort({ lastStartedAt: -1 });

//     if (!lastChat) {
//       return res.status(404).json({ success: false, message: "No previous chats found" });
//     }

//     const lodge = await Lodge.findById(lastChat.lodgeId);
//     if (!lodge) {
//       return res.status(404).json({ success: false, message: "Lodge not found" });
//     }

//     const whatsappNumber = lodge.whatsappNumber || lodge.phone;
//     let formattedPhone = whatsappNumber;
//     if (formattedPhone.startsWith("0")) {
//       formattedPhone = "234" + formattedPhone.slice(1);
//     }

//     const waLink = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
//       `Hello, I found your lodge listing on Logifi and would like to inquire about its availability (Lodge ID: ${lastChat.lodgeId}).`
//     )}`;

//     // ✅ Re-cache into session (auto-refresh)
//     req.session.lastWaLink = waLink;
//     req.session.lastLodgeId = lastChat.lodgeId;
//     req.session.lastAgentEmail = lastChat.agentEmail;

//     return res.json({
//       success: true,
//       waLink,
//       lodgeId: lastChat.lodgeId,
//       agentEmail: lastChat.agentEmail,
//       cached: false, // means came from DB this time
//     });

//   } catch (err) {
//     console.error("getWaLink error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };



exports.sendContactMessage = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    // Verify SMTP connection first
    await transporter.verify();

    // Send email
 await sendMail({
  from: `"Logifi Contact Form" <${process.env.EMAIL_USER}>`,
  to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
  subject: `📩 New Contact Message from ${name}`,
  text: `You have received a new message via Logifi contact form.\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`,
  html: contactEmail(name, email, message),
});


    // Respond success
    res.json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.error("Error sending contact message:", err);
    res.status(500).json({ success: false, message: "Failed to send message. Please check SMTP settings." });
  }
};
