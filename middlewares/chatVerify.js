const User = require("../models/Users");

async function chatVerify(req, res, next) {
  try {
    // Save where user wanted to go (so we can return them after OTP)
    req.session.redirectAfterAuth = req.originalUrl;

    const verifiedEmail = req.session.verifiedEmail;
    const verifiedCookie = req.cookies.wa_verified_email;

    if (verifiedEmail || verifiedCookie) {
      // Restore session from cookie if session missing
      if (!verifiedEmail && verifiedCookie) {
        req.session.verifiedEmail = verifiedCookie;
      }
      return next();
    }

    // If request is AJAX/fetch, respond with 401 JSON so frontend can redirect to chat-auth
    const acceptsJson = req.xhr || (req.headers.accept && req.headers.accept.indexOf("application/json") !== -1);
    if (acceptsJson) {
      return res.status(401).json({ success: false, message: "You must verify to contact agent." });
    }

    // Normal browser request -> redirect to OTP page
    return res.redirect("/lodges/chat-auth");
  } catch (err) {
    console.error("chatVerify error:", err.stack || err);
    return res.status(500).send("Server error during chat verification");
  }
}

module.exports = { chatVerify };

