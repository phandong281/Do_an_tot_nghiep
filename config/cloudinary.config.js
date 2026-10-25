// const cloudinary = require('cloudinary').v2;
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const multer = require('multer');

// // Cấu hình Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dwmsfixy5',
//   api_key: process.env.CLOUDINARY_API_KEY || '716424388887474',
//   api_secret: process.env.CLOUDINARY_API_SECRET || 'Sf05WjEVfwFWFQnN1xWsfLHh0F0'
// });

// // Cấu hình storage
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'shop_products', // Thư mục lưu trữ trên Cloudinary
//     allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
//     transformation: [{ width: 800, height: 800, crop: 'limit' }] // Tối ưu kích thước ảnh
//   }
// });

// // Cấu hình multer
// const uploadCloud = multer({ storage: storage });

// module.exports = { cloudinary, uploadCloud };
const multer = require("multer");

// Cấu hình multer để lưu file vào bộ nhớ (memory storage)
const storage = multer.memoryStorage();

// Giới hạn kích thước file (ví dụ: tối đa 5MB) và lọc loại file
const fileFilter = (req, file, cb) => {
    // Chỉ chấp nhận các định dạng ảnh
    const allowedTypes = ["image/jpeg", "image/png","image/jpg", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)!"), false);
    }
};

// Cấu hình multer
const imageUpload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // Giới hạn 5MB
    },
    fileFilter: fileFilter,
});

module.exports = {imageUpload};
