const express = require('express');
const router = express.Router();
const User = require('../../Controller/admin/user.controller');
const { adminLogin, verifyEnvAdmin } = require('../../Middleware/adminAuth.middleware');
const { verifyToken } = require('../../Middleware/auth.middleware');

// Thêm middleware adminLogin trước controller login thông thường
router.post('/login', adminLogin, User.login);

// Các route khác - bỏ verifyToken ở route get để admin có thể xem danh sách
router.get('/', User.index);
router.get('/:id', User.details);

// Giữ verifyToken cho các Action thay đổi dữ liệu
router.post('/create', verifyToken, User.create);
router.patch('/update', verifyToken, User.update);
router.delete('/delete', User.delete);

module.exports = router;
