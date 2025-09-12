const User = require("../models/Users");

async function chatVerify(req, res, next) {
  try {
    req.session.redirectAfterAuth = req.originalUrl;

    const verifiedEmail = req.session.verifiedEmail;
    const verifiedCookie = req.cookies.wa_verified_email; // store email in cookie

    if (verifiedEmail || verifiedCookie) {
      // Restore session from cookie if session missing
      if (!verifiedEmail && verifiedCookie) {
        req.session.verifiedEmail = verifiedCookie;
      }
      return next();
    }

    // Not verified → redirect to OTP page
    return res.redirect("/lodges/chat-auth");

  } catch (err) {
    console.error("chatVerify error:", err.stack || err);
    return res.status(500).send("Server error during chat verification");
  }
}

module.exports = { chatVerify };
