const Admin = require('../../models/admin/Admin');

exports.loginPage = (req, res) => {
  res.render('admin/login');
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'All fields are required');
      return res.redirect('/admin/login');
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/admin/login');
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/admin/login');
    }

    // save only needed data in session
    req.session.admin = {
      id: admin._id,
      email: admin.email,
      role: admin.role
    };

    req.flash('success', 'Welcome back Admin');
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong');
    res.redirect('/admin/login');
  }
};

exports.dashboard = (req, res) => {
  res.render('admin/dashboard', {
    admin: req.session.admin
  });
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
};
