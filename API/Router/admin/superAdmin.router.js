const express = require('express');
const router = express.Router();
const SuperAdmin = require('../../Controller/admin/superAdmin.controller');

// Route đăng nhập Super Admin
router.post('/login', SuperAdmin.login);

module.exports = router;