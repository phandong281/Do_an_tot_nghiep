const User = require('../../../Models/user')
const Permission = require('../../../Models/permission')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");

module.exports.index = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        const keyWordSearch = req.query.search;
        const perPage = parseInt(req.query.limit) || 8;
        
        // Xác định điều kiện tìm kiếm
        let findCondition = {};
        if (req.query.permission) {
            findCondition.id_permission = req.query.permission;
        }
        
        // Đếm tổng số bản ghi
        const totalCount = await User.countDocuments(findCondition);
        const totalPage = Math.ceil(totalCount / perPage);
        
        // Tính toán phân trang
        let start = (page - 1) * perPage;
        let end = page * perPage;
        
        // Lấy danh sách User
        let users = await User.find(findCondition).populate('id_permission');
        
        // Xử lý tìm kiếm
        if (keyWordSearch) {
            users = users.filter(value => {
                return value.fullname && value.fullname.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1 ||
                    (value.id && value.id.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1);
            });
        }
        
        // Trả về kết quả
        res.json({
            users: users.slice(start, end),
            totalPage: totalPage
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách User:", error);
        res.status(500).json({ msg: "Lỗi server" });
    }
}

module.exports.create = async (req, res) => {
    try {
        const { email, password, fullname, username, permission } = req.body;

        // Kiểm tra xem email có đã tồn tại chưa
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.json({ msg: "Email đã tồn tại" });
        }

        // Kiểm tra quyền có tồn tại không
        const permissionExists = await mongoose.model('Permission').findById(permission);
        if (!permissionExists) {
            return res.json({ msg: "Quyền không tồn tại" });
        }

        // Mã hóa mật khẩu trước khi lưu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo mới User
        const newUser = new User({
            email,
            password: hashedPassword,
            fullname,
            username,
            id_permission: permission
        });

        // Lưu User vào cơ sở dữ liệu
        const savedUser = await newUser.save();

        // Tạo token JWT
        const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET || 'gfdgfd', { expiresIn: '1h' });

        // Trả về thông tin User và token
        res.json({
            msg: "Đăng ký thành công",
            user: savedUser,
            jwt: token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Lỗi server, không thể tạo tài khoản" });
    }
}

module.exports.delete = async (req, res) => {
    try {
        const id = req.query.id;
        
        if (!id) {
            return res.status(400).json({ msg: "Thiếu ID User" });
        }

        const result = await User.deleteOne({ _id: id });
        
        if (result.deletedCount > 0) {
            return res.json({ msg: "Thanh Cong" });
        } else {
            return res.status(404).json({ msg: "Không tìm thấy User" });
        }
    } catch (error) {
        console.error("Lỗi khi Delete User:", error);
        return res.status(500).json({ msg: "Lỗi server" });
    }
}

module.exports.details = async (req, res) => {
    const user = await User.findOne({ _id: req.params.id });

    res.json(user)
}

module.exports.update = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.query.id });
        if (req.query.email && req.query.email !== user.email) {
            req.query.email = user.email
        }
        if (req.query.username && req.query.username !== user.username) {
            req.query.username = user.username
        }
        
        let password = user.password;
        if (req.query.password) {
            const salt = await bcrypt.genSalt(10);
            password = await bcrypt.hash(req.query.password, salt);
        }

        req.query.name = req.query.name.toLowerCase().replace(/^.|\s\S/g, a => { return a.toUpperCase() })
        await User.updateOne({ _id: req.query.id }, {
            fullname: req.query.name,
            password: password,
            id_permission: req.query.permission
        }, function (err, res) {
            if (err) return res.json({ msg: err });
        });
        res.json({ msg: "Bạn đã update thành công" })
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Lỗi server" });
    }
}

module.exports.login = async (req, res) => {
  try {
    console.log("[LOGIN] Bắt đầu xử lý yêu cầu đăng nhập...");
    console.log("[LOGIN] Email:", req.body.email);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("[LOGIN] Thiếu email hoặc mật khẩu");
      return res.status(400).json({ msg: "Vui lòng nhập email và mật khẩu" });
    }

    // Tìm user theo email
    const user = await User.findOne({ email: email.trim() });

    if (!user) {
      console.log("[LOGIN] Không tìm thấy User với email:", email);
      return res.json({ msg: "Không tìm thấy User" });
    }

    // So sánh mật khẩu
    const auth = await bcrypt.compare(password, user.password);
    console.log("[LOGIN] Kết quả so sánh mật khẩu:", auth);

    if (!auth) {
      console.log("[LOGIN] Sai mật khẩu cho User:", email);
      return res.json({ msg: "Sai mật khẩu" });
    }

    // Tra quyền để trả về dạng { _id, permission }
    const perm = await Permission.findById(user.id_permission);

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'gfdgfd',
      { expiresIn: '1h' }
    );

    // Trả về response
    res.json({
      msg: "Đăng nhập thành công",
      user: {
        _id: user._id,
        email: user.email,
        fullname: user.fullname,
        username: user.username,
        id_permission: perm
          ? { _id: perm._id, permission: perm.permission }
          : null
      },
      jwt: token
    });

  } catch (error) {
    console.error("[LOGIN] Lỗi server:", error);
    res.status(500).json({ msg: "Lỗi server" });
  }
};