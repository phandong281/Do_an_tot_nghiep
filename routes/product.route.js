const express = require('express');
const router = express.Router();
const controller = require('../API/Controller/admin/product.controller');
const { imageUpload } = require('../config/cloudinary.config');

// Sử dụng middleware imageUpload cho các route cần upload ảnh
router.post('/create', imageUpload.single('image'), controller.create);
router.post('/update', imageUpload.single('image'), controller.update);

// Các route khác giữ nguyên
router.get('/get', controller.index);
router.get('/get/:id', controller.details);
router.delete('/delete', controller.delete);

module.exports = router;