const User = require("../models/Users");

async function chatVerify(req, res, next) {
  try {
    console.log("[chatVerify] Incoming request:", req.originalUrl);

    // Save intended redirect for OTP flow
    req.session.redirectAfterAuth = req.originalUrl;

    const verifiedEmail = req.session.verifiedEmail;
    const verifiedCookie = req.cookies.wa_verified_email;

    console.log("[chatVerify] verifiedEmail:", verifiedEmail);
    console.log("[chatVerify] verifiedCookie:", verifiedCookie);

    if (verifiedEmail || verifiedCookie) {
      // Restore session from cookie if missing
      if (!verifiedEmail && verifiedCookie) {
        req.session.verifiedEmail = verifiedCookie;
        console.log("[chatVerify] Restored verifiedEmail from cookie");
      }
      console.log("[chatVerify] ✅ User already verified, continuing...");
      return next();
    }

    // AJAX request → return JSON 401
    const acceptsJson = req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"));
    if (acceptsJson) {
      console.log("[chatVerify] ❌ Not verified (AJAX)");
      return res.status(401).json({ success: false, message: "You must verify to contact agent." });
    }

    // Browser request → redirect
    console.log("[chatVerify] ❌ Not verified (redirect to /lodges/chat-auth)");
    return res.redirect("/lodges/chat-auth");

  } catch (err) {
    console.error("chatVerify error:", err.stack || err);
    return res.status(500).send("Server error during chat verification");
  }
}

module.exports = { chatVerify };
