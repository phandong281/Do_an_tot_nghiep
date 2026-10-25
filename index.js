require('dotenv').config();
const cloudinary = require("cloudinary").v2;
const express = require('express')
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bcrypt = require('bcrypt');
const cors = require("cors");
const mongoose = require("mongoose");
var paypal = require('paypal-rest-sdk');
var upload = require('express-fileupload');
var bodyParser = require("body-parser");

const port = 8000

// ===== Cloudinary =====
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ===== PayPal =====
paypal.configure({
  'mode': 'sandbox',
  'client_id': process.env.PAYPAL_CLIENT_ID,
  'client_secret': process.env.PAYPAL_CLIENT_SECRET
});

// ===== Routers =====
const ProductAPI = require('./API/Router/product.router')
const UserAPI = require('./API/Router/user.router')
const OrderAPI = require('./API/Router/order.router')
const Detail_OrderAPI = require('./API/Router/detail_order.router')
const CommentAPI = require('./API/Router/comment.router')
const CategoryAPI = require('./API/Router/category.router')
const NoteAPI = require('./API/Router/note.router')

const ProductAdmin = require('./API/Router/admin/product.router')
const CategoryAdmin = require('./API/Router/admin/category.router')
const Permission = require('./API/Router/admin/permission.router')
const UserAdmin = require('./API/Router/admin/user.router')
const Order = require('./API/Router/admin/order.router')
const Coupon = require('./API/Router/admin/coupon.router')
const Sale = require('./API/Router/admin/sale.router')
const CommentAdmin = require('./API/Router/admin/comment.router')

// ===== Kết nối database =====
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to database ');

  try {
    const PermissionModel = require('./Models/permission');
    const UserModel = require('./Models/user');

    // Tạo quyền Admin nếu chưa có
    let adminPermission = await PermissionModel.findOne({ permission: 'Admin' });
    if (!adminPermission) {
      adminPermission = await new PermissionModel({ permission: 'Admin' }).save();
      console.log('Created Admin permission');
    }

    // Tạo tài khoản admin nếu chưa có (mật khẩu được băm bằng bcrypt)
    const existed = await UserModel.findOne({ username: 'admin' });
    if (!existed) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await UserModel.create({
        id_permission: adminPermission._id.toString(),
        username: 'admin',
        password: hashedPassword,
        fullname: 'Admin',
        gender: 'Nam',
        email: 'admin@gmail.com',
        phone: '0123456789'
      });
      console.log('Created Admin user: admin / admin123');
    }
  } catch (error) {
    console.error('Error creating Admin:', error);
  }
}).catch((err) => {
  console.error(`Error connecting to the database. \n${err}`);
});

// ===== Middleware =====
app.use('/', express.static('public'))
app.use(upload());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// ===== Routes =====
app.use('/api/Product', ProductAPI)
app.use('/api/User', UserAPI)
app.use('/api/Payment', OrderAPI)
app.use('/api/Comment', CommentAPI)
app.use('/api/Note', NoteAPI)
app.use('/api/DetailOrder', Detail_OrderAPI)
app.use('/api/Category', CategoryAPI)

app.use('/api/admin/Product', ProductAdmin)
app.use('/api/admin/Category', CategoryAdmin)
app.use('/api/admin/Permission', Permission)
app.use('/api/admin/user', UserAdmin)
app.use('/api/admin/Order', Order)
app.use('/api/admin/Coupon', Coupon)
app.use('/api/admin/Sale', Sale)
app.use('/api/admin/comment', CommentAdmin)

// ===== Socket.io =====
io.on("connection", (socket) => {
  console.log(`Có người vừa kết nối, socketID: ${socket.id}`);

  socket.on('send_order', (data) => {
    console.log(data)
    socket.broadcast.emit("receive_order", data);
  })
})

http.listen(port, () => {
  console.log('listening on *: ' + port);
});