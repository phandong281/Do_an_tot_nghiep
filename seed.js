/**
 * Seed dữ liệu mẫu (permission, user, category, product, sale, coupon).
 * Ảnh lấy từ thư mục public/img (server phục vụ tại http://localhost:8000/img/...).
 *
 *   npm run seed          -> thêm dữ liệu còn thiếu (không xoá gì)
 *   npm run seed:reset    -> xoá sạch các collection mẫu rồi seed lại
 *
 * Lưu ý: dùng MONGO_URI trong .env (hiện đang trỏ tới MongoDB Atlas).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const Permission = require('./Models/permission');
const User = require('./Models/user');
const Category = require('./Models/category');
const Product = require('./Models/product');
const Sale = require('./Models/sale');
const Coupon = require('./Models/coupon');

const RESET = process.argv.includes('--reset');
const SERVER_URL = (process.env.SERVER_URL || 'http://localhost:8000').replace(/\/$/, '');
const IMG_DIR = path.join(__dirname, 'public', 'img');

// ---------- Ảnh ----------
const nfc = (s) => s.normalize('NFC');
const filesOnDisk = fs.existsSync(IMG_DIR) ? fs.readdirSync(IMG_DIR) : [];
const fileMap = new Map(filesOnDisk.map((f) => [nfc(f).toLowerCase(), f]));

function imageUrl(fileName) {
  const real = fileMap.get(nfc(fileName).toLowerCase());
  if (!real) {
    console.warn(`  ! Không thấy ảnh public/img/${fileName} -> dùng nophoto.jpg`);
    return `${SERVER_URL}/img/nophoto.jpg`;
  }
  return `${SERVER_URL}/img/${encodeURIComponent(real)}`;
}

// ---------- Dữ liệu mẫu ----------
const PERMISSIONS = ['Admin', 'Nhân Viên', 'Khách Hàng'];

const USERS = [
  { username: 'admin', password: 'admin123', fullname: 'Admin', gender: 'Nam', email: 'admin@gmail.com', phone: '0123456789', permission: 'Admin' },
  { username: 'nhanvien', password: 'nhanvien123', fullname: 'Nhân Viên Demo', gender: 'Nữ', email: 'nhanvien@gmail.com', phone: '0900000001', permission: 'Nhân Viên' },
  { username: 'khach', password: 'khach123', fullname: 'Khách Hàng Demo', gender: 'Nam', email: 'khach@gmail.com', phone: '0900000002', permission: 'Khách Hàng' },
];

// gender của category phải là 'male' | 'female' (client lọc theo 2 giá trị này)
const CATEGORIES = [
  { category: 'Áo Nam', gender: 'male' },
  { category: 'Quần Nam', gender: 'male' },
  { category: 'Giày Nam', gender: 'male' },
  { category: 'Phụ Kiện Nam', gender: 'male' },
  { category: 'Giày Nữ', gender: 'female' },
  { category: 'Áo Nữ', gender: 'female' },
];

const sizes = (S, M, L) => ({ S, M, L });

const PRODUCTS = [
  { cat: 'Áo Nam', gender: 'male', name: 'Áo sơ mi sọc đen', price: '350000', img: 'đen.jpeg', inv: sizes(10, 15, 8), desc: 'Áo sơ mi tay ngắn sọc đen, chất vải mềm, form rộng thoải mái.' },
  { cat: 'Áo Nam', gender: 'male', name: 'Áo thun trắng in chữ', price: '199000', img: 'nophoto.jpg', inv: sizes(20, 25, 15), desc: 'Áo thun cotton trắng, họa tiết in nhỏ, phù hợp mặc hằng ngày.' },
  { cat: 'Áo Nam', gender: 'male', name: 'Bộ quần áo bóng đá', price: '270000', img: '20241202_htiwrinf5y_6922_HasThumb.jpeg', inv: sizes(12, 20, 12), desc: 'Bộ đồ đá bóng thoáng mát, thấm hút mồ hôi tốt.' },
  { cat: 'Quần Nam', gender: 'male', name: 'Quần jean xanh nhạt', price: '420000', img: '14052021030557_dai_dien.jpg', inv: sizes(8, 12, 10), desc: 'Quần jean ống côn màu xanh nhạt, co giãn nhẹ.' },
  { cat: 'Quần Nam', gender: 'male', name: 'Quần dài trắng ống suông', price: '380000', img: 'quần dài trắng.jpeg', inv: sizes(9, 14, 9), desc: 'Quần dài trắng ống suông, dễ phối đồ.' },
  { cat: 'Quần Nam', gender: 'male', name: 'Quần kaki be', price: '360000', img: 'quần kaki.jpeg', inv: sizes(10, 10, 10), desc: 'Quần kaki màu be, vải dày dặn, đứng form.' },
  { cat: 'Quần Nam', gender: 'male', name: 'Quần âu công sở', price: '410000', img: 'tải xuống.jpg', inv: sizes(7, 11, 7), desc: 'Quần âu lịch sự, phù hợp đi làm và đi chơi.' },
  { cat: 'Giày Nam', gender: 'male', name: 'Giày bóng đá sân cỏ nhân tạo', price: '650000', img: 'anh_sp_add-01-01-5777873-2_5f8fe5a32f4e4930b47191564ba1fbad_1024x1024.jpg', inv: sizes(5, 8, 6), desc: 'Giày đá bóng đế TF bám sân tốt, màu xanh ngọc nổi bật.' },
  { cat: 'Phụ Kiện Nam', gender: 'male', name: 'Đồng hồ Citizen nam', price: '4500000', img: 'citizen-bi5127-51h-nam-thumb-638702014557219627-600x600.jpg', inv: sizes(3, 3, 3), desc: 'Đồng hồ quartz Citizen mặt đen, dây thép không gỉ.' },
  { cat: 'Phụ Kiện Nam', gender: 'male', name: 'iPhone 15 128GB', price: '19990000', img: 'iphone15.jpg', inv: sizes(5, 5, 5), desc: 'iPhone 15 màu hồng, chip A16 Bionic, camera 48MP.' },
  { cat: 'Giày Nữ', gender: 'female', name: 'Giày cao gót mũi nhọn trắng', price: '520000', img: 'download.jpg', inv: sizes(6, 9, 6), desc: 'Giày cao gót 8cm mũi nhọn màu trắng, sang trọng.' },
];

const SALES = [
  { productName: 'Quần jean xanh nhạt', promotion: 20, describe: 'Giảm 20% quần jean', status: true },
  { productName: 'Áo thun trắng in chữ', promotion: 10, describe: 'Giảm 10% áo thun', status: true },
];

const COUPONS = [
  { code: 'WELCOME10', count: 100, promotion: '10', describe: 'Giảm 10% cho khách mới' },
  { code: 'FREESHIP', count: 50, promotion: '5', describe: 'Giảm 5% đơn hàng' },
];

// ---------- Chạy ----------
async function main() {
  if (!process.env.MONGO_URI) throw new Error('Thiếu MONGO_URI trong .env');
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Đã kết nối MongoDB');

  if (RESET) {
    console.log('--reset: xoá dữ liệu cũ...');
    await Promise.all([
      Permission.deleteMany({}), User.deleteMany({}), Category.deleteMany({}),
      Product.deleteMany({}), Sale.deleteMany({}), Coupon.deleteMany({}),
    ]);
  }

  // Permission
  const permId = {};
  for (const name of PERMISSIONS) {
    const doc = (await Permission.findOne({ permission: name })) || (await Permission.create({ permission: name }));
    permId[name] = doc._id.toString();
  }
  console.log(`Permission: ${PERMISSIONS.length}`);

  // User
  for (const u of USERS) {
    if (await User.findOne({ username: u.username })) continue;
    const { permission, password, ...rest } = u;
    await User.create({ ...rest, password: await bcrypt.hash(password, 10), id_permission: permId[permission] });
  }
  console.log(`User: ${USERS.map((u) => `${u.username}/${u.password}`).join(', ')}`);

  // Category (insert qua collection để giữ field `gender` — schema Mongoose không khai báo field này)
  const catId = {};
  for (const c of CATEGORIES) {
    let doc = await Category.collection.findOne({ category: c.category });
    if (!doc) {
      const r = await Category.collection.insertOne({ category: c.category, gender: c.gender });
      doc = { _id: r.insertedId };
    } else if (doc.gender !== c.gender) {
      await Category.collection.updateOne({ _id: doc._id }, { $set: { gender: c.gender } });
    }
    catId[c.category] = doc._id.toString();
  }
  console.log(`Category: ${CATEGORIES.length}`);

  // Product
  const prodId = {};
  for (const p of PRODUCTS) {
    const data = {
      id_category: catId[p.cat],
      name_product: p.name,
      price_product: p.price,
      image: imageUrl(p.img),
      describe: p.desc,
      gender: p.gender,
      inventory: p.inv,
      number: p.inv.S + p.inv.M + p.inv.L,
    };
    let doc = await Product.findOne({ name_product: p.name });
    if (doc) await Product.updateOne({ _id: doc._id }, data);
    else doc = await Product.create(data);
    prodId[p.name] = doc._id.toString();
  }
  console.log(`Product: ${PRODUCTS.length}`);

  // Sale
  const start = new Date();
  const end = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  for (const s of SALES) {
    const id_product = prodId[s.productName];
    if (!id_product || (await Sale.findOne({ id_product }))) continue;
    await Sale.create({ promotion: s.promotion, describe: s.describe, status: s.status, start, end, id_product });
  }

  // Coupon
  for (const c of COUPONS) {
    if (!(await Coupon.findOne({ code: c.code }))) await Coupon.create(c);
  }
  console.log(`Sale: ${SALES.length}, Coupon: ${COUPONS.length}`);

  console.log('Seed xong.');
}

main()
  .catch((e) => { console.error('Seed lỗi:', e); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());