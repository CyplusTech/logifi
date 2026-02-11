const Lodge = require('../models/lodge');
const Agent = require('../models/Agents');
const User = require("../models/Users");
const ChatSession = require("../models/Chatsession");


const {sendMail} = require("../utilities/resendMailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const { generatePostLodgeOtpEmail, generateContactAgentOtpEmail, generatePotLodgeVerificationSuccessEmail, generateContactVerificationSuccessEmail} = require("../utilities/emailTemplates");



//// CHAT AGENT FLOW (Production-ready) ////

// ✅ Show OTP input page for chat verification
exports.chatAgentForm = (req, res) => {
  try {
    // Save lodgeId from query if present
    if (req.query.lodgeId) {
      req.session.pendingLodgeId = req.query.lodgeId;
    }

    // Render OTP form
    res.render("auth/chatAgent", {
      email: req.session.otpData?.email || "",
      phone: req.session.otpData?.phone || "",
      name: req.session.otpData?.name || "",
    });
  } catch (err) {
    console.error("chatAgentForm error:", err);
    res.status(500).send("Server error while loading chat auth page");
  }
};

// ✅ Send OTP
exports.chatAgentSendOtp = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const lodgeId = req.session.pendingLodgeId;

    // Validate name
    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    // Validate either email or phone
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: "Email or phone is required" });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    console.log("Generated OTP:", otp);

    // Save OTP in session
    req.session.otpData = {
      name,
      email: email || null,
      phone: phone || null,
      otp,
      otpExpires: Date.now() + 5 * 60 * 1000, // 5 mins
    };

    // Save redirect for after OTP verification
    if (lodgeId) {
      req.session.redirectAfterAuth = `/lodges/start-chat/${lodgeId}`;
    }

    // Send via email if available
    if (email) {
      await sendMail({
        to: email,
        subject: "📬 Verify Your Contact Request",
        text: `Hi ${name}, Your OTP is ${otp}. It expires in 5 minutes.`,
        html: generateContactAgentOtpEmail(name, otp),
      });
    }

    // Send via SMS if phone is available
    if (phone) {
      await sendSms({
        to: phone,
        message: `Your Logifi OTP is ${otp}. It expires in 5 minutes.`
      });
    }

    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Verify OTP
exports.chatAgentVerifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const sessionOtp = req.session.otpData;

    if (!sessionOtp) {
      return res.status(400).json({ success: false, message: "No OTP session found" });
    }

    // Check expiration
    if (Date.now() > sessionOtp.otpExpires) {
      req.session.otpData = null;
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // Check OTP match
    if (otp !== sessionOtp.otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // ✅ Upsert user
    let user;
    if (sessionOtp.email) {
      user = await User.findOne({ email: sessionOtp.email });
    } else {
      user = await User.findOne({ phone: sessionOtp.phone });
    }

    if (!user) {
      user = new User({
        name: sessionOtp.name,
        email: sessionOtp.email,
        phone: sessionOtp.phone,
        verified: true,
        verifiedAt: new Date(),
      });
    } else {
      user.verified = true;
      user.verifiedAt = new Date();
    }
    await user.save();

    // Send success email if email exists
    if (user.email) {
      await sendMail({
        to: user.email,
        subject: "✅ Contact Verification Successful",
        text: `Hi ${user.name}, your contact verification is complete.`,
        html: generateContactVerificationSuccessEmail(user.name),
      });
    }

    // ✅ Mark session verified
    req.session.chatVerified = true;
    req.session.verifiedContact = user.email || user.phone;
    req.session.otpData = null;

    // Set cookies
    res.cookie("wa_verified_user", "true", { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie("wa_verified_email", user.email || "", { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    // ✅ Build WhatsApp link if lodgeId exists
    const redirectUrl = req.session.redirectAfterAuth || null;
    req.session.redirectAfterAuth = null;

    if (redirectUrl && redirectUrl.startsWith("/lodges/start-chat/")) {
      const match = redirectUrl.match(/\/lodges\/start-chat\/([^\/\?]+)/);
      const lodgeId = match ? match[1] : null;

      if (lodgeId) {
        const lodge = await Lodge.findById(lodgeId);
        if (lodge) {
          const agentEmail = lodge.postedBy || null;
          const whatsappNumber = lodge.whatsappNumber || lodge.phone || "";
          const formattedPhone = whatsappNumber.replace(/\D/g, "").replace(/^0/, "234");
          const message = encodeURIComponent(
            `Hello, I found your lodge listing on Logifi.\n\nTitle: ${lodge.title}\nID: ${lodgeId}\n\nI would like to inquire about its current availability.`
          );
          const waLink = `https://wa.me/${formattedPhone}?text=${message}`;

          // Cache session for subsequent requests
          req.session.lastWaLink = waLink;
          req.session.lastLodgeId = lodgeId;
          req.session.lastAgentEmail = agentEmail;

          // Create ChatSession only once
          req.session.createdChatFor = req.session.createdChatFor || {};
          if (!req.session.createdChatFor[lodgeId]) {
            await ChatSession.findOneAndUpdate(
              { userEmail: user.email, agentEmail, lodgeId },
              { $setOnInsert: { lastStartedAt: new Date() } },
              { upsert: true, new: true }
            );
            req.session.createdChatFor[lodgeId] = true;
          }

          // Return waLink
          return res.json({
            success: true,
            message: "OTP verified successfully",
            waLink,
            lodge,
            redirectTo: "/lodges",
          });
        }
      }
    }

    // Default fallback
    return res.json({ success: true, message: "OTP verified successfully", redirectTo: null });
  } catch (err) {
    console.error("chatAgentVerifyOtp error:", err.stack || err);
    return res.status(500).json({ success: false, message: "Server error during OTP verification" });
  }
};


//////become an agent verification auth ////
exports.authForm = (req, res) => {
    const isVerified = !!req.session.verifiedEmail;

  // Render the page with a variable to decide which section to show
  res.render("auth/auth", {
    isVerified,
    Agent: isVerified
      ? {
          email: req.session.verifiedEmail,
          name: req.session.AgentName,
          role: req.session.AgentRole
        }
      : null
  });
}
//////become agent
// ✅ sendOtp fixed
exports.sendOtp = async (req, res) => {
  try {
    const { email, name, role, phone } = req.body;

    if (!email || !name || !role || !phone) {
      return res.status(400).json({ success: false, message: "Email, Name, Role, and Phone are required" });
    }

    // 🔑 rename to avoid shadowing
    let agentDoc = await Agent.findOne({ email });

    // If already verified, skip OTP
    if (agentDoc && agentDoc.isVerified) {
      req.session.verifiedEmail = agentDoc.email;
      req.session.AgentName = agentDoc.name;
      req.session.AgentRole = agentDoc.role;
      req.session.AgentPhone = agentDoc.phone;
      return res.json({ success: true, message: "Already verified", agent: agentDoc });
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000;
    console.log("Generated OTP:", otp);

    // Hash OTP before saving
    const hashedOtp = await bcrypt.hash(otp, 10);

    if (!agentDoc) {
      agentDoc = new Agent({ email, name, role, phone });
    } else {
      agentDoc.phone = phone; // ✅ update if changed
    }

    agentDoc.otp = hashedOtp;
    agentDoc.otpExpires = new Date(expiresAt);
    await agentDoc.save();

    // Send mail
     const mailResponse = await sendMail({
        to: email,
        subject: "🔐 Verify Your Lodge Posting",
        text: `Hi ${name},\n\nThank you for posting your lodge on Logifi.\nYour OTP is: ${otp}\nIt expires in 5 minutes.\n\n– Logifi Team`,
        html: generatePostLodgeOtpEmail(name, otp),
      });
      console.log("Mail API raw response:", mailResponse);


    // await sendMail({
    //  from: `"Logifi Support" <${process.env.EMAIL_USER}>`,
    //   to: email,
    //   subject: "🔐 Verify Your Lodge Posting",
    //   text: `Hi ${name},\n\nThank you for posting your lodge on Logifi.\nYour OTP is: ${otp}\nIt expires in 5 minutes.\n\n– Logifi Team`,
    //   html: generatePostLodgeOtpEmail(name, otp),
    // });

    const response = { success: true, message: "OTP sent to email" };
    if (process.env.NODE_ENV !== "production") {
      response.otp = otp; // only send OTP in dev
    }
    return res.json(response);

  } catch (err) {
    console.error("sendOtp error", err);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};


exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    // 🔑 Lookup agent
    const agentDoc = await Agent.findOne({ email });
    if (!agentDoc || !agentDoc.otp || !agentDoc.otpExpires) {
      return res
        .status(400)
        .json({ success: false, message: "No pending OTP. Please request a new OTP." });
    }

    // Check expiry
    if (Date.now() > agentDoc.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }

    // Compare OTP
    const isMatch = await bcrypt.compare(otp, agentDoc.otp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // ✅ OTP verified
    agentDoc.isVerified = true;
    agentDoc.verifiedAt = new Date();
    agentDoc.otp = undefined;
    agentDoc.otpExpires = undefined;
    agentDoc.deviceId = crypto.randomBytes(16).toString("hex");
    agentDoc.refreshToken = crypto.randomBytes(32).toString("hex");

    await agentDoc.save();

    // --- SEND SUCCESS EMAIL HERE ---
        await sendMail({
        to: agentDoc.email,          // verified user's email
        subject: "✅ Verification Successful",
        text: `Hi ${agentDoc.name},\n\nYour email/OTP has been successfully verified!\n\n– Logifi Team`,
        html: generatePotLodgeVerificationSuccessEmail(agentDoc.name),
      });


    // await sendMail({
    //   from: `"Logifi Support" <${process.env.EMAIL_USER}>`,
    //   to: agentDoc.email,          // verified user's email
    //   subject: "✅ Verification Successful",
    //   text: `Hi ${agentDoc.name},\n\nYour email/OTP has been successfully verified!\n\n– Logifi Team`,
    //   html: generatePotLodgeVerificationSuccessEmail(agentDoc.name),
    // });

    // Session
    req.session.verifiedEmail = agentDoc.email;
    req.session.agentName = agentDoc.name;
    req.session.agentRole = agentDoc.role;
    req.session.agentPhone = agentDoc.phone;

    // 👉 Use stored redirect OR default to /post-lodge
    const redirectUrl = req.session.redirectAfterAuth || "/post-lodge";
    delete req.session.redirectAfterAuth;

    return res.json({ success: true, redirectUrl, agent: agentDoc });
  } catch (err) {
    console.error("verifyOtp error", err);
    return res.status(500).json({ success: false, message: "Verification failed" });
  }
};
