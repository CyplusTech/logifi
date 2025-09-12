// middleware/verifyMiddleware.js
const Agent = require("../models/Agents");

async function isVerified(req, res, next) {
  try {
    if (!req.session || !req.session.verifiedEmail) {
      return res.redirect("/post-lodge/auth");
    }

    const agent = await Agent.findOne({ email: req.session.verifiedEmail }); // ✅ lowercase
    if (agent && agent.isVerified) {
      req.Agent = agent; // ✅ attach document
      return next();
    }

    return res.redirect("/post-lodge/auth");
  } catch (err) {
    console.error("isVerified middleware error:", err);
    return res.status(500).send("Server error");
  }
}

async function notVerified(req, res, next) {
  try {
    if (!req.session || !req.session.verifiedEmail) {
      return next();
    }

    const agent = await Agent.findOne({ email: req.session.verifiedEmail }); // ✅ lowercase
    if (agent && agent.isVerified) {
      return res.redirect("/post-lodge");
    }

    return next();
  } catch (err) {
    console.error("notVerified middleware error:", err);
    return res.status(500).send("Server error");
  }
}

module.exports = { isVerified, notVerified };
