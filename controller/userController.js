const Lodge = require('../models/lodge');
const Agent = require('../models/Agents');
const Review = require('../models/Review');
const maskEmail = require("../utilities/maskEmail");

const mongoose = require("mongoose");

exports.homePage = async (req, res) => {
  try {
    // get only lodges with status = available
    const lodges = await Lodge.find({ status: "available" }).sort({ createdAt: -1 }).lean();

    const lodgesWithAgents = await Promise.all(
      lodges.map(async lodge => {
        const agent = await Agent.findOne({ email: lodge.postedBy }).lean();
        return {
          ...lodge,
          agent: agent ? {
            name: agent.name,
            email: maskEmail(agent.email),
            isVerified: agent.isVerified,
            kycCompleted: agent.kycCompleted,
          } : null
        };
      })
    );
    res.render("home", { lodges: lodgesWithAgents });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// exports.singlePage = async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!id) return res.status(400).send("Lodge ID is required");

//     // Fetch the lodge
//     const selectedLodge = await Lodge.findById(id);
//     if (!selectedLodge) return res.status(404).send("Lodge not found");

//     // Fetch reviews for this lodge
//     const lodgeReviews = await Review.find({ agentEmail: selectedLodge.postedBy });

//     // Fetch the agent by email
//     const agent = await Agent.findOne({ email: selectedLodge.postedBy });

//     // Calculate avg rating
//     let avgRating = 0;
//     if (lodgeReviews.length > 0) {
//       avgRating = lodgeReviews.reduce((sum, r) => sum + r.rating, 0) / lodgeReviews.length;
//     }

//     // Prepare lodge with review + agent info
//     const lodgeWithReviews = {
//       ...selectedLodge.toObject(),
//       avgRating: Math.round(avgRating), // 0-5
//       reviewCount: lodgeReviews.length,
//       reviews: lodgeReviews,
//       agent: agent
//         ? {
//             name: agent.name,
//              email: maskEmail(agent.email),
//             isVerified: agent.isVerified,
//             kycCompleted: agent.kycCompleted,
//           }
//         : null,
//     };

//     // Render lodge page
//     res.render("lodges", {
//       lodges: [lodgeWithReviews], // wrap in array for your EJS loop
//       selectedLodge: lodgeWithReviews,
//       search: "",
//       session: req.session,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error loading lodge");
//   }
// };

exports.singlePage = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Step 1: Validate the ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.warn("⚠️ Invalid lodge ID:", id);
      return res.redirect("/lodges"); // safely redirect instead of crashing
    }

    // ✅ Step 2: Fetch lodge
    const selectedLodge = await Lodge.findById(id);
    if (!selectedLodge) return res.status(404).send("Lodge not found");

    // ✅ Step 3: Fetch lodge reviews and agent
    const lodgeReviews = await Review.find({ agentEmail: selectedLodge.postedBy });
    const agent = await Agent.findOne({ email: selectedLodge.postedBy });

    // ✅ Step 4: Calculate average rating
    let avgRating = 0;
    if (lodgeReviews.length > 0) {
      avgRating =
        lodgeReviews.reduce((sum, r) => sum + r.rating, 0) / lodgeReviews.length;
    }

    // ✅ Step 5: Combine lodge info
    const lodgeWithReviews = {
      ...selectedLodge.toObject(),
      avgRating: Math.round(avgRating),
      reviewCount: lodgeReviews.length,
      reviews: lodgeReviews,
      agent: agent
        ? {
            name: agent.name,
            email: maskEmail(agent.email),
            isVerified: agent.isVerified,
            kycCompleted: agent.kycCompleted,
          }
        : null,
    };

    // ✅ Step 6: Render view
    res.render("lodges", {
      lodges: [lodgeWithReviews],
      selectedLodge: lodgeWithReviews,
      search: "",
      session: req.session,
    });
  } catch (err) {
    console.error("❌ Error in singlePage:", err);
    res.status(500).send("Error loading lodge");
  }
};


exports.lodgePage = async (req, res) => {
  try {
    const raw = req.query.search || "";
    const search = String(raw).trim();
    let lodges = [];

    if (search) {
      const or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
      ];
      const n = Number(search.replace(/,/g, ""));
      if (!Number.isNaN(n)) or.push({ price: n });

      lodges = await Lodge.find({ $or: or, status: { $in: ["available", "rented"] } }).sort({ createdAt: -1 });
    } else {
      lodges = await Lodge.find({ status: { $in: ["available", "rented"] } }).sort({ createdAt: -1 });
    }

    // For each lodge, calculate avg rating & total reviews
      // After getting lodges
      const lodgesWithReviews = await Promise.all(lodges.map(async lodge => {
        const lodgeReviews = await Review.find({ agentEmail: lodge.postedBy });

        // find agent by email (or whatever unique field you use)
        const agent = await Agent.findOne({ email: lodge.postedBy });

        let avgRating = 0;
        if (lodgeReviews.length > 0) {
          avgRating = lodgeReviews.reduce((sum, r) => sum + r.rating, 0) / lodgeReviews.length;
        }

        return {
          ...lodge.toObject(),
          avgRating: Math.round(avgRating),
          reviewCount: lodgeReviews.length,
          agent: agent ? {
            name: agent.name,
            email: maskEmail(agent.email),
            isVerified: agent.isVerified,
            kycCompleted: agent.kycCompleted,
          } : null
        };
      }));

    res.render("lodges", { lodges: lodgesWithReviews, search, selectedLodge: null , session: req.session});
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.postLodgePage = async (req, res) => {
  try {
    if (!req.Agent) {
      return res.redirect("/post-lodge/auth");
    }

    // Fetch lodges posted by this Agent
    const lodges = await Lodge.find({
      postedBy: req.Agent.email,
      status: { $in: ["available", "rented"] }
    }).sort({ createdAt: -1 }).lean(); // use lean so it's plain JS objects

    // Attach the logged-in agent info to each lodge
    const lodgesWithAgents = lodges.map(lodge => ({
      ...lodge,
      agent: {
        name: req.Agent.name,
        email: req.Agent.email,
        isVerified: req.Agent.isVerified,
        kycCompleted: req.Agent.kycCompleted,
      },
    }));

    res.render("postLodge", { lodges: lodgesWithAgents, agent: req.Agent });
  } catch (err) {
    console.error("Error in postLodgePage:", err);
    res.status(500).send("Server Error");
  }
};


// CREATE lodge
exports.postLodge = async (req, res) => {
  try {
    const { title, location, type, status, desc, price, phone, requestId } = req.body;

    if (!title || !location) {
      return res.status(400).json({
        message: "Title and location are required.",
        type: "error",
      });
    }

      // 🛡️ check if already processed
    const existing = await Lodge.findOne({ requestId });
    if (existing) {
      return res.json({ message: "Already processed", lodge: existing });
    }

    const media = req.files.map(file => ({
      url: file.path,
      type: file.mimetype.startsWith("video") ? "video" : "image"
    }));

    const lodge = new Lodge({
      title,
      location,
      type,
      status,
      price,
      phone,
      desc,
      media,
      Agent: req.Agent?._id,
      email: req.Agent?.email,
      postedBy: req.Agent?.email
    });

    const saved = await lodge.save();

    res.json({
      data: saved,
      message: "Lodge posted successfully!",
      type: "success",
    });
  } catch (err) {
    console.error("Error saving lodge:", err);
    res.status(500).json({
      message: "Server error. Could not save lodge.",
      type: "error",
    });
  }
};

// UPDATE lodge
exports.updateLodge = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, location, type, status, desc, price, phone, requestId } = req.body;
    // prepare update object
    let updateData = { title, location, type, status, price, phone, desc };


      // 🛡️ check if already processed
    const existing = await Lodge.findOne({ requestId });
    if (existing) {
      return res.json({ message: "Already processed", lodge: existing });
    }

    // if new files uploaded, replace media
    if (req.files && req.files.length > 0) {
      updateData.media = req.files.map(file => ({
        url: file.path,
        type: file.mimetype.startsWith("video") ? "video" : "image"
      }));
    }

    // update and return new doc
    const updated = await Lodge.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true } // return updated document
    );

    // const lodgesss = await Lodge.find()
    
    if (!updated) {
      return res.status(404).json({
        message: "Lodge not found.",
        type: "error",
      });
    }

    res.json({
      data: updated,
      message: "Lodge updated successfully!",
      type: "success",
    });
  } catch (err) {
    console.error("Error updating lodge:", err);
    res.status(500).json({
      message: "Server error. Could not update lodge.",
      type: "error",
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required", type: "error" });
    }

    const updated = await Lodge.findByIdAndUpdate(
      id,
      { $set: { status } }, // only update status
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Lodge not found", type: "error" });
    }

    res.json({ data: updated, message: "Status updated successfully", type: "success" });
  } catch (err) {
    console.error("Error updating lodge status:", err);
    res.status(500).json({ message: "Server error", type: "error" });
  }
};

// UPDATE lodge
exports.deleteLodge = async (req, res) => {
  try {
    await Lodge.findByIdAndUpdate(req.params.id, { status: "deleted" });
    res.json({ success: true, message: "Lodge marked as deleted (hidden from UI)" });
  } catch (err) {
    console.error("Error in deleteLodge:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.switchAccount = async (req, res) => {
  try {
    if (req.session.verifiedEmail) {
      await Agent.updateOne(
        { email: req.session.verifiedEmail },
        { $unset: { refreshToken: 1, deviceId: 1 } }
      );
    }

    req.session.destroy(err => {
      if (err) console.error("session destroy error", err);
      res.redirect("/post-lodge");
    });
  } catch (err) {
    console.error("switchAccount error", err);
    res.redirect("/post-lodge");
  }
};

////roommate page///
exports.roommatePage = (req, res) => {
    res.render("roommate")
}



// exports.switchAccount = (req, res) => {
//   // destroy session and redirect to verify form
//   req.session.destroy(err => {
//     if (err) console.error('session destroy error', err);
//     res.redirect('/post-lodge');
//   });
// };

