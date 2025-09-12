// middleware/visitorTracker.js
const Visitor = require("../models/visitors");
const axios = require("axios");

module.exports = async function (req, res, next) {
  try {
    // Count ONLY when hitting "/"
    if (req.path !== "/") return next();

    let ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    if ((ip === "::1" || ip === "127.0.0.1") && process.env.FORCE_TEST_IP) {
      ip = process.env.FORCE_TEST_IP;
    }

    const userAgent = req.headers["user-agent"];
    const page = req.originalUrl; // "/"
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

      // first hit to "/" today
      await Visitor.create({
        ip,
        userAgent,
        page,
        location,
        day,
        actions: [{ action: "visit", page, clickedAt: new Date() }],
        totalVisits: 1,
        dailyStats: [{ date: day, visits: 1, clicks: 0 }],
      });
    } else {
      // increment visits
      visitor.totalVisits += 1;

      const stat = visitor.dailyStats.find(s => s.date === day);
      if (stat) stat.visits += 1;
      else visitor.dailyStats.push({ date: day, visits: 1, clicks: 0 });

      // only add "visit" once in actions
      const alreadyLogged = visitor.actions.some(a => a.action === "visit" && a.page === "/");
      if (!alreadyLogged) {
        visitor.actions.push({ action: "visit", page, clickedAt: new Date() });
      }

      await visitor.save();
    }
  } catch (err) {
    console.log("Visitor tracking failed:", err.message);
  }

  next();
};
