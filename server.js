require("dotenv").config();

const express = require("express");
const connectDB = require('./config/db');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const cookieParser = require("cookie-parser");

/////middile ware..///
const Router = require("./route/userRouter");
const trackClicksRouter = require("./route/trackClicks");
const contactRouter = require("./route/contactRouter");
const authRouter = require("./route/authRouter");
const reviewRoutes = require("./route/reviewRoutes");

const adminRouter = require("./route/admin/adminRouter");
const Admin = require('./models/admin/Admin');

const visitorTracker = require("./middlewares/visitorTracker");

const app = express();
const PORT = process.env.PORT || 5000;

// View engine setup
app.set("view engine", "ejs");
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

/// Static files (optional if you serve CSS/JS/images)
app.use(express.static("public"));

// Connect to MongoDB
connectDB();

app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboardcat',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
     maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: false, // must be false if not HTTPS
      sameSite: "lax" // allows sending cookie on navigation
    } // 7 days
}));

/////flash massage initailizatation////
app.use(flash());
app.use(cookieParser());

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});



// async function createAdmin() {
//   await Admin.create({
//     email: 'admin@logifi.com',
//     password: 'Admin@123$$$',
//     role: 'admin'
//   });

//   console.log('Admin created');
//   process.exit();
// }

// createAdmin();

// tracking visitors and clicks/////
app.use(visitorTracker);

///route///
app.use("/", Router);
app.use("/track", trackClicksRouter);
app.use("/", authRouter);
app.use("/", contactRouter);
app.use('/', reviewRoutes);

// Admin (isolated & protected)
app.use('/admin', adminRouter);

// app.get('/kill-session', (req, res) => {
//     req.session.destroy(() => {
//         res.clearCookie('connect.sid');
//         res.send('Session destroyed');
//     });
// });

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
