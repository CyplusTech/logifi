const Lodge = require('../models/lodge');


const ChatSession = require("../models/Chatsession");


const { sendMail, transporter } = require("../utilities/mailer");
const { contactEmail } = require("../utilities/emailTemplates");


// // ✅ chatPage.js
// exports.chatPage = async (req, res) => {
//   try {
//     const lodgeId = req.params.id;
//     const userEmail = req.session.verifiedEmail;

//     if (!userEmail) return res.status(401).json({ success: false, message: "You must verify first." });

//     // Session cache
//     if (req.session.lastWaLink && req.session.lastLodgeId === lodgeId && req.session.lastAgentEmail) {
//       return res.json({ success: true, waLink: req.session.lastWaLink });
//     }

//     // Fetch lodge
//     const lodge = await Lodge.findById(lodgeId);
//     if (!lodge) return res.status(404).json({ success: false, message: "Lodge not found" });

//     const agentEmail = lodge.postedBy;
//     const whatsappNumber = lodge.whatsappNumber || lodge.phone;
//     const formattedPhone = whatsappNumber.startsWith("0") ? "234" + whatsappNumber.slice(1) : whatsappNumber;

//     const message = encodeURIComponent(`Hello, I found your lodge listing on Logifi (ID: ${lodgeId}).`);
//     const waLink = `https://wa.me/${formattedPhone}?text=${message}`;

//     // Cache session
//     req.session.lastWaLink = waLink;
//     req.session.lastLodgeId = lodgeId;
//     req.session.lastAgentEmail = agentEmail;

//     // Track chat session
//     await ChatSession.findOneAndUpdate(
//       { userEmail, agentEmail, lodgeId },
//       { $setOnInsert: { lastStartedAt: new Date() } },
//       { upsert: true, new: true }
//     );

//     return res.json({ success: true, waLink });

//   } catch (err) {
//     console.error("chatPage error:", err.stack || err);
//     return res.status(500).json({ success: false, message: "Server error while loading chat page" });
//   }
// };


// // ✅ Fetch WhatsApp link safely
// // ✅ Get last WhatsApp link (used by front-end cache)
// exports.getWaLink = async (req, res) => {
//   try {
//     const verifiedEmail = req.session.verifiedEmail;
//     if (!verifiedEmail) {
//       res.clearCookie("wa_verified_user");
//       res.clearCookie("wa_verified_email");
//       return res.status(401).json({ success: false, message: "You must verify first." });
//     }

//     if (req.session.lastWaLink && req.session.lastLodgeId && req.session.lastAgentEmail) {
//       return res.json({ success: true, waLink: req.session.lastWaLink });
//     }

//     const lastChat = await ChatSession.findOne({ userEmail: verifiedEmail }).sort({ lastStartedAt: -1 });
//     if (!lastChat) return res.status(404).json({ success: false, message: "No previous chats found." });

//     const lodge = await Lodge.findById(lastChat.lodgeId);
//     if (!lodge) return res.status(404).json({ success: false, message: "Lodge not found" });

//     const whatsappNumber = lodge.whatsappNumber || lodge.phone;
//     const formattedPhone = whatsappNumber.startsWith("0") ? "234" + whatsappNumber.slice(1) : whatsappNumber;
//     const message = encodeURIComponent(`Hello, I found your lodge listing on Logifi (ID: ${lastChat.lodgeId}).`);
//     const waLink = `https://wa.me/${formattedPhone}?text=${message}`;

//     req.session.lastWaLink = waLink;
//     req.session.lastLodgeId = lastChat.lodgeId;
//     req.session.lastAgentEmail = lastChat.agentEmail;

//     return res.json({ success: true, waLink });

//   } catch (err) {
//     console.error("getWaLink error:", err.stack || err);
//     return res.status(500).json({ success: false, message: "Server error fetching WhatsApp link." });
//   }
// };

// --- chatPage (start-chat/:id) ---
// --- chatPage (start-chat/:id) ---
exports.chatPage = async (req, res) => {
  try {
    const lodgeId = req.params.id;
    const userEmail = req.session.verifiedEmail;

    console.log("[chatPage] lodgeId:", lodgeId);
    console.log("[chatPage] userEmail:", userEmail);

    if (!userEmail) {
      console.log("[chatPage] ❌ No verified email in session");
      return res.status(401).json({ success: false, message: "You must verify first." });
    }

    // ✅ Use session cache first
    if (req.session.lastWaLink && req.session.lastLodgeId === lodgeId) {
      console.log("[chatPage] ✅ Returning cached waLink:", req.session.lastWaLink);
      return res.json({ success: true, waLink: req.session.lastWaLink });
    }

    console.log("[chatPage] ⏳ Fetching lodge from DB...");
    const lodge = await Lodge.findById(lodgeId);
    if (!lodge) {
      console.log("[chatPage] ❌ Lodge not found:", lodgeId);
      return res.status(404).json({ success: false, message: "Lodge not found" });
    }

    const agentEmail = lodge.postedBy || null;
    const whatsappNumber = lodge.whatsappNumber || lodge.phone || "";
    const formattedPhone = whatsappNumber.replace(/\D/g, "").replace(/^0/, "234");
    const message = encodeURIComponent(`Hello, I found your lodge listing on Logifi.\n\nTitle: ${lodge.title}\nID: ${lodgeId}\n\nI would like to inquire about its current availability.`);
    const waLink = `https://wa.me/${formattedPhone}?text=${message}`;

    // ✅ Cache result
    req.session.lastWaLink = waLink;
    req.session.lastLodgeId = lodgeId;
    req.session.lastAgentEmail = agentEmail;
    console.log("[chatPage] ✅ Cached waLink:", waLink);

    // ✅ Write to DB only once
    req.session.createdChatFor = req.session.createdChatFor || {};
    if (!req.session.createdChatFor[lodgeId]) {
      console.log("[chatPage] ⏳ Creating ChatSession in DB...");
      await ChatSession.findOneAndUpdate(
        { userEmail, agentEmail, lodgeId },
        { $setOnInsert: { lastStartedAt: new Date() } },
        { upsert: true, new: true }
      );
      req.session.createdChatFor[lodgeId] = true;
      console.log("[chatPage] ✅ ChatSession created for lodge:", lodgeId);
    }

    return res.json({ success: true, lodge, waLink });

  } catch (err) {
    console.error("chatPage error:", err.stack || err);
    return res.status(500).json({ success: false, message: "Server error while loading chat page" });
  }
};


// --- getWaLink (cached fetch) ---
exports.getWaLink = async (req, res) => {
  try {
    const verifiedEmail = req.session.verifiedEmail;
    console.log("[getWaLink] verifiedEmail:", verifiedEmail);

    if (!verifiedEmail) {
      console.log("[getWaLink] ❌ No verified email, clearing cookies...");
      res.clearCookie("wa_verified_user");
      res.clearCookie("wa_verified_email");
      return res.status(401).json({ success: false, message: "You must verify first." });
    }

    // ✅ Prefer session cache
    if (req.session.lastWaLink) {
      console.log("[getWaLink] ✅ Returning cached waLink:", req.session.lastWaLink);
      return res.json({ success: true, waLink: req.session.lastWaLink });
    }

    console.log("[getWaLink] ⏳ No cache, hitting DB...");
    const lastChat = await ChatSession.findOne({ userEmail: verifiedEmail }).sort({ lastStartedAt: -1 });
    if (!lastChat) {
      console.log("[getWaLink] ❌ No previous chats found for:", verifiedEmail);
      return res.status(404).json({ success: false, message: "No previous chats found." });
    }

    const lodge = await Lodge.findById(lastChat.lodgeId);
    if (!lodge) {
      console.log("[getWaLink] ❌ Lodge not found for:", lastChat.lodgeId);
      return res.status(404).json({ success: false, message: "Lodge not found" });
    }

    const whatsappNumber = lodge.whatsappNumber || lodge.phone || "";
    const formattedPhone = whatsappNumber.replace(/\D/g, "").replace(/^0/, "234");
    const message = encodeURIComponent(`Hello, I found your lodge listing on Logifi.\n\nTitle: ${lodge.title}\nID: ${lodgeId}\n\nI would like to inquire about its current availability.`);
    const waLink = `https://wa.me/${formattedPhone}?text=${message}`;

    // ✅ Save to session
    req.session.lastWaLink = waLink;
    req.session.lastLodgeId = lastChat.lodgeId;
    req.session.lastAgentEmail = lastChat.agentEmail;
    console.log("[getWaLink] ✅ Cached waLink:", waLink);

    return res.json({ success: true, lodge, waLink });

  } catch (err) {
    console.error("getWaLink error:", err.stack || err);
    return res.status(500).json({ success: false, message: "Server error fetching WhatsApp link." });
  }
};




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
