const Lodge = require('../models/lodge');


const ChatSession = require("../models/Chatsession");


const { sendMail, transporter } = require("../utilities/mailer");
const { contactEmail } = require("../utilities/emailTemplates");

// GET /lodges/get-wa-link
exports.getWaLink = async (req, res) => {
  try {
    if (!req.session.chatVerified) {
      return res.json({ success: false });
    }

    const lodgeId = req.query.lodgeId;

    if (!lodgeId) {
      return res.json({ success: false });
    }

    const lodge = await Lodge.findById(lodgeId);

    if (!lodge) {
      return res.json({ success: false });
    }

    const whatsappNumber = lodge.whatsappNumber || lodge.phone || "";
    const formattedPhone = whatsappNumber.replace(/\D/g, "").replace(/^0/, "234");

    const message = encodeURIComponent(
      `Hello, I found your lodge listing on Logifi.\n\nTitle: ${lodge.title}\nID: ${lodgeId}\n\nI would like to inquire about its current availability.`
    );

    const waLink = `https://wa.me/${formattedPhone}?text=${message}`;

    return res.json({
      success: true,
      waLink
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false });
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
