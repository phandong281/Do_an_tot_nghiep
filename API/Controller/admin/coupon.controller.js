const Coupon = require('../../../Models/coupon');
const Order = require('../../../Models/order');

module.exports.index = async (req, res) => {

    let page = parseInt(req.query.page) || 1;
    const keyWordSearch = req.query.search;

    const perPage = parseInt(req.query.limit) || 8;
    const totalPage = Math.ceil(await Coupon.countDocuments() / perPage);

    let start = (page - 1) * perPage;
    let end = page * perPage;

    const coupon = await Coupon.find();

    if (!keyWordSearch) {
        res.json({
            coupons: coupon.slice(start, end),
            totalPage: totalPage
        })

    } else {
        var newData = coupon.filter(value => {
            return value.code.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1 ||
                value.promotion.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1
        })

        res.json({
            coupons: newData.slice(start, end),
            totalPage: totalPage
        })
    }

}

module.exports.create = async (req, res) => {
    try {
        // Kiểm tra xem mã giảm giá đã tồn tại chưa
        const existingCoupon = await Coupon.findOne({ code: req.body.code });

        if (existingCoupon) {
            return res.status(400).json({ msg: "Mã giảm giá này đã tồn tại, vui lòng chọn mã khác" });
        }

        // Nếu không trùng, tạo mã giảm giá mới
        await Coupon.create(req.body);

        res.json({ msg: "Bạn đã thêm thành công" });
    } catch (error) {
        console.error("Error creating coupon:", error);
        res.status(500).json({ msg: "Đã xảy ra lỗi khi tạo mã giảm giá" });
    }
}

module.exports.update = async (req, res) => {
    try {
        const id = req.params.id;

        // Kiểm tra xem mã giảm giá đã tồn tại chưa (trừ mã hiện tại)
        const existingCoupon = await Coupon.findOne({
            code: req.body.code,
            _id: { $ne: id } // Không tính mã hiện tại
        });

        if (existingCoupon) {
            return res.status(400).json({ msg: "Mã giảm giá này đã tồn tại, vui lòng chọn mã khác" });
        }

        const coupon = await Coupon.findOne({ _id: id });

        if (!coupon) {
            return res.status(404).json({ msg: "Không tìm thấy mã giảm giá" });
        }

        coupon.code = req.body.code;
        coupon.count = req.body.count;
        coupon.promotion = req.body.promotion;
        coupon.describe = req.body.describe;

        await coupon.save();

        res.json({ msg: "Bạn đã cập nhật thành công" });
    } catch (error) {
        console.error("Error updating coupon:", error);
        res.status(500).json({ msg: "Đã xảy ra lỗi khi cập nhật mã giảm giá" });
    }
}

module.exports.delete = async (req, res) => {

    const id = req.params.id

    await Coupon.deleteOne({ _id: id })

    res.json("Thanh Cong")

}

module.exports.detail = async (req, res) => {

    const id = req.params.id

    const coupon = await Coupon.findOne({ _id: id })

    res.json(coupon)

}

module.exports.checking = async (req, res) => {
    try {
        const code = req.query.code;
        const id_user = req.query.id_user;

        // Kiểm tra xem mã giảm giá có tồn tại không
        const coupon = await Coupon.findOne({ code });

        if (!coupon) {
            return res.json({ msg: "Không tìm thấy" });
        }

        // Kiểm tra xem số lượng mã giảm giá còn không
        if (coupon.count <= 0) {
            return res.json({ msg: "Mã giảm giá đã hết lượt sử dụng" });
        }

        // Kiểm tra xem người dùng đã sử dụng mã này chưa
        const checkCoupon = await Order.findOne({ id_user: id_user, id_coupon: coupon._id });

        if (checkCoupon) {
            return res.json({ msg: "Bạn đã sử dụng mã này rồi" });
        }

        // Trả về thông tin mã giảm giá nếu hợp lệ
        return res.json({ msg: "Thành công", coupon: coupon });
    } catch (error) {
        console.error("Error checking coupon:", error);
        return res.status(500).json({ msg: "Đã xảy ra lỗi khi kiểm tra mã giảm giá" });
    }
}

module.exports.createCoupon = async (req, res) => {
    try {
        const id = req.params.id;

        const coupon = await Coupon.findOne({ _id: id });

        if (!coupon) {
            return res.status(404).json({ msg: "Không tìm thấy mã giảm giá" });
        }

        // Kiểm tra xem số lượng mã giảm giá còn không
        if (coupon.count <= 0) {
            return res.status(400).json({ msg: "Mã giảm giá đã hết lượt sử dụng" });
        }

        coupon.count = parseInt(coupon.count) - 1;

        await coupon.save();

        return res.json({ msg: "Thanh Cong" });
    } catch (error) {
        console.error("Error updating coupon count:", error);
        return res.status(500).json({ msg: "Đã xảy ra lỗi khi cập nhật số lượng mã giảm giá" });
    }
}