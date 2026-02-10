const Admin = require('../models/admin/Admin');

exports.isAdminLoggedIn = async (req, res, next) => {
  try {
    if (!req.session.admin || !req.session.admin.id) {
      req.flash('error', 'Please login to continue');
      return res.redirect('/admin/login');
    }

    // 🔎 Check if admin still exists
    const admin = await Admin.findById(req.session.admin.id).select('_id email');

    if (!admin) {
      // Admin deleted → kill session
      req.session.destroy(() => {
        res.redirect('/admin/login');
      });
      return;
    }

    // attach fresh admin to request
    req.admin = admin;
    next();
  } catch (err) {
    console.error(err);
    req.session.destroy(() => {
      res.redirect('/admin/login');
    });
  }
};

exports.isAdminLoggedOut = (req, res, next) => {
  if (req.session.admin) {
    return res.redirect('/admin');
  }
  next();
};
