const Lodge = require('../models/lodge');
const Agent = require('../models/Agents');
const User = require("../models/Users");


const {sendMail} = require("../utilities/mailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const { generatePostLodgeOtpEmail, generateContactAgentOtpEmail, generatePotLodgeVerificationSuccessEmail, generateContactVerificationSuccessEmail} = require("../utilities/emailTemplates");




////chat agent///

// ✅ Show OTP input page for chat verification
exports.chatAgentForm = (req, res) => {
  try {
    // If a redirect query param exists, save it for after OTP verification
    if (req.query.redirect) {
      req.session.redirectAfterAuth = req.query.redirect;
    }

    // Render your OTP form view (adjust filename if needed)
    res.render("auth/chatAgent", {
      email: req.session.otpData?.email || "",
      name: req.session.otpData?.name || "",
      phone: req.session.otpData?.phone || "",
    });
  } catch (err) {
    console.error("chatAgentForm error:", err);
    res.status(500).send("Server error while loading chat auth page");
  }
};

// ✅ Send OTP
exports.chatAgentSendOtp = async (req, res) => {
  try {
    const { name, email, phone, lodgeId } = req.body; // lodgeId passed from frontend
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    // console.log("Generated OTP:", otp);

    // Save OTP + redirect in session
    req.session.otpData = {
      name,
      email,
      phone,
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000 // 10 min
    };

    // 👇 Save where user wanted to go after auth
    if (lodgeId) {
      req.session.redirectAfterAuth = `/lodges/start-chat/${lodgeId}`;
    }

    // Send OTP via email
    await sendMail({
        from: `"Logifi Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "📬 Verify Your Contact Request",
      text: `Hi ${name},\n\nYou requested to contact an agent on Logifi.\nYour OTP is: ${otp}\nIt expires in 5 minutes.\n\n– Logifi Team`,
      html: generateContactAgentOtpEmail(name, otp),
    });

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Verify OTP
// ✅ OTP Verification
// exports.chatAgentVerifyOtp = async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     const sessionOtp = req.session.otpData;

//     if (!sessionOtp || sessionOtp.otp !== otp) {
//       return res.status(400).json({ success: false, message: "Invalid OTP" });
//     }

//     let user = await User.findOne({ email });
//     if (!user) {
//       user = new User({
//         name: sessionOtp.name,
//         email,
//         phone: sessionOtp.phone,
//         verified: true,
//         verifiedAt: new Date(),
//       });
//     } else {
//       user.verified = true;
//       user.verifiedAt = new Date();
//     }
//     await user.save();

//     // Send success email
//     await sendMail({
//       from: `"Logifi Support" <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject: "✅ Contact Verification Successful",
//       text: `Hi ${user.name}, your contact verification is complete.`,
//       html: generateContactVerificationSuccessEmail(user.name),
//     });

//     // Save session & cookies
//     req.session.verifiedEmail = email;
//     req.session.otpData = null;
//     res.cookie("wa_verified_user", "true", { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
//     res.cookie("wa_verified_email", email, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

//     const redirectUrl = req.session.redirectAfterAuth || null;
//     req.session.redirectAfterAuth = null;

//     return res.json({ success: true, message: "OTP verified successfully", redirectUrl });

//   } catch (err) {
//     console.error("chatAgentVerifyOtp error:", err.stack || err);
//     return res.status(500).json({ success: false, message: "Server error during OTP verification" });
//   }
// };


// --- chatAgentVerifyOtp (verify OTP and optionally return waLink to open immediately) ---
exports.chatAgentVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const sessionOtp = req.session.otpData;

    if (!sessionOtp || sessionOtp.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Upsert user and mark verified
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name: sessionOtp.name,
        email,
        phone: sessionOtp.phone,
        verified: true,
        verifiedAt: new Date(),
      });
    } else {
      user.verified = true;
      user.verifiedAt = new Date();
    }
    await user.save();

    // Send success email (existing helper)
    await sendMail({
      from: `"Logifi Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "✅ Contact Verification Successful",
      text: `Hi ${user.name}, your contact verification is complete.`,
      html: generateContactVerificationSuccessEmail(user.name),
    });

    // Save session & cookies
    req.session.verifiedEmail = email;
    req.session.otpData = null;
    res.cookie("wa_verified_user", "true", { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie("wa_verified_email", email, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    // If user was trying to open a specific lodge chat, build waLink now so client can open immediately
    const redirectUrl = req.session.redirectAfterAuth || null;
    req.session.redirectAfterAuth = null;

    if (redirectUrl && redirectUrl.startsWith("/lodges/start-chat/")) {
      // Extract lodgeId (robustly)
      const match = redirectUrl.match(/\/lodges\/start-chat\/([^\/\?]+)/);
      const lodgeId = match ? match[1] : null;

      if (lodgeId) {
        const lodge = await Lodge.findById(lodgeId);
        if (lodge) {
          const agentEmail = lodge.postedBy || null;
          const whatsappNumber = lodge.whatsappNumber || lodge.phone || "";
          const formattedPhone = whatsappNumber.replace(/\D/g, "").replace(/^0/, "234");
          const message = encodeURIComponent(`Hello, I found your lodge listing on Logifi (ID: ${lodgeId}).`);
          const waLink = `https://wa.me/${formattedPhone}?text=${message}`;

          // Cache session (so subsequent requests are fast and DB-free)
          req.session.lastWaLink = waLink;
          req.session.lastLodgeId = lodgeId;
          req.session.lastAgentEmail = agentEmail;

          // Create DB ChatSession only once per lodge per session
          req.session.createdChatFor = req.session.createdChatFor || {};
          if (!req.session.createdChatFor[lodgeId]) {
            await ChatSession.findOneAndUpdate(
              { userEmail: email, agentEmail, lodgeId },
              { $setOnInsert: { lastStartedAt: new Date() } },
              { upsert: true, new: true }
            );
            req.session.createdChatFor[lodgeId] = true;
          }

          // Return waLink so client can open it in a new tab and then redirect main tab to /lodges
          return res.json({
            success: true,
            message: "OTP verified successfully",
            waLink,
            redirectTo: "/lodges" // main tab destination after opening WA
          });
        }
      }
    }

    // Default fallback: no immediate waLink; return the original redirect target (if any)
    return res.json({ success: true, message: "OTP verified successfully", redirectUrl: null });

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
    // console.log("Generated OTP:", otp);

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
    await sendMail({
     from: `"Logifi Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Verify Your Lodge Posting",
      text: `Hi ${name},\n\nThank you for posting your lodge on Logifi.\nYour OTP is: ${otp}\nIt expires in 5 minutes.\n\n– Logifi Team`,
      html: generatePostLodgeOtpEmail(name, otp),
    });

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
      from: `"Logifi Support" <${process.env.EMAIL_USER}>`,
      to: agentDoc.email,          // verified user's email
      subject: "✅ Verification Successful",
      text: `Hi ${agentDoc.name},\n\nYour email/OTP has been successfully verified!\n\n– Logifi Team`,
      html: generatePotLodgeVerificationSuccessEmail(agentDoc.name),
    });

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
