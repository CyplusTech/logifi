const express = require('express');
const router = express.Router();
const adminController = require('../../controller/admin/adminController');
const { isAdminLoggedIn, isAdminLoggedOut } = require('../../middlewares/adminAuth');

// auth
router.get('/login', isAdminLoggedOut, adminController.loginPage);
router.post('/login', isAdminLoggedOut, adminController.login);
router.get('/logout', isAdminLoggedIn, adminController.logout);

// dashboard
router.get('/', isAdminLoggedIn, adminController.dashboard);

module.exports = router;
