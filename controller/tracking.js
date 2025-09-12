const mongoose = require("mongoose");
const Visitor = require("../models/visitors");
const axios = require("axios");

const TRACKED_ACTIONS = new Set([
  "list_lodges",
  "become-an-agent",
  "start_chat",
  "contact_via_whatsapp",
  "apply_btn",
  "view_more_lodges",
]);

const MAX_ACTIONS_PER_DAY = 5;

exports.trackClick = async (req, res) => {
  try {
    let { action, lodgeId, page } = req.body;

    // validate
    if (!action || !TRACKED_ACTIONS.has(action)) {
      return res.json({ success: true, ignored: true, reason: "untracked_action" });
    }

    // ensure lodgeId is either valid ObjectId or null
    if (!lodgeId || !mongoose.Types.ObjectId.isValid(lodgeId)) {
      lodgeId = null;
    }

    let ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    if ((ip === "::1" || ip === "127.0.0.1") && process.env.FORCE_TEST_IP) {
      ip = process.env.FORCE_TEST_IP;
    }

    const userAgent = req.headers["user-agent"];
    const day = new Date().toISOString().slice(0, 10);

    let visitor = await Visitor.findOne({ ip, day });

    if (!visitor) {
      let location = { country: "Unknown", city: "Unknown" };
      try {
        const { data } = await axios.get(`http://ip-api.com/json/${ip}`);
        if (data.status === "success") {
          location.country = data.country;
          location.city = data.city;
        }
      } catch (err) {
        console.log("Location fetch failed:", err.message);
      }

      visitor = await Visitor.create({
        ip,
        userAgent,
        page: page || "/",
        location,
        day,
        actions: [{ action, lodgeId, page, clickedAt: new Date() }],
        totalClicks: 1,
        dailyStats: [{ date: day, visits: 0, clicks: 1 }],
      });

      return res.json({ success: true, visitor, added: true });
    }

    visitor.totalClicks += 1;

    const stat = visitor.dailyStats.find(s => s.date === day);
    if (stat) stat.clicks += 1;
    else visitor.dailyStats.push({ date: day, visits: 0, clicks: 1 });

    const exists = visitor.actions.some(
      a => a.action === action && String(a.lodgeId || "") === String(lodgeId || "")
    );

    if (!exists) {
      const trackedUniqueToday = visitor.actions.filter(a => TRACKED_ACTIONS.has(a.action)).length;
      if (trackedUniqueToday < MAX_ACTIONS_PER_DAY) {
        visitor.actions.push({ action, lodgeId, page, clickedAt: new Date() });
      }
    }

    await visitor.save();

    res.json({ success: true, visitor });
  } catch (err) {
    console.error("Click tracking error:", err.message);
    res.status(500).json({ success: false });
  }
};
