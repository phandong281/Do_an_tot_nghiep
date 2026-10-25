const fs = require('fs');
const path = require('path');
const { cloudinary } = require('../config/cloudinary.config');
const Product = require('../API/Models/product.model');
const mongoose = require('mongoose');

// Kết nối database
mongoose.connect('mongodb://localhost:27017/your_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const migrateImages = async () => {
  try {
    // Lấy tất cả sản phẩm
    const products = await Product.find({});
    console.log(`Tìm thấy ${products.length} sản phẩm cần di chuyển ảnh`);

    for (const product of products) {
      // Kiểm tra nếu ảnh là local URL
      if (product.image && product.image.includes('localhost')) {
        // Lấy tên file từ URL
        const fileName = product.image.split('/').pop();
        const localPath = path.join(__dirname, '../public/img', fileName);

        // Kiểm tra file có tồn tại không
        if (fs.existsSync(localPath)) {
          console.log(`Đang upload ảnh: ${fileName}`);
          
          // Upload lên Cloudinary
          const result = await cloudinary.uploader.upload(localPath, {
            folder: 'shop_products',
            public_id: path.parse(fileName).name
          });

          // Cập nhật URL trong database
          await Product.updateOne(
            { _id: product._id },
            { image: result.secure_url }
          );

          console.log(`Đã di chuyển thành công: ${fileName} -> ${result.secure_url}`);
        } else {
          console.log(`Không tìm thấy file: ${localPath}`);
        }
      }
    }

    console.log('Hoàn tất di chuyển ảnh');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi di chuyển ảnh:', error);
    process.exit(1);
  }
};

migrateImages();