const Order = require('../../../Models/order')
const Detail_History = require('../../../Models/detail_order')
const Payment = require('../../../Models/payment')
const Delivery = require('../../../Models/delivery')
const Products = require("../../../Models/product")
const Detail_Order = require("../../../Models/detail_order")

module.exports.index = async (req, res) => {
    let page = parseInt(req.query.page) || 1;
    let money = 0;

    const status = req.query.status

    const perPage = parseInt(req.query.limit) || 8;

    let start = (page - 1) * perPage;
    let end = page * perPage;

    let orders
    if (status) {
        orders = await (await Order.find({ status: status }).populate('id_user').populate('id_payment').populate('id_note')).reverse();
    } else {
        orders = await (await Order.find().populate('id_user').populate('id_note').populate('id_payment')).reverse();
    }

    const totalPage = Math.ceil(orders.length / perPage);

    orders.map((value) => {
        money += Number(value.total);
    })

    res.json({
        orders: orders.slice(start, end),
        totalPage: totalPage,
        totalMoney: money
    })


}

module.exports.detailOrder = async (req, res) => {
    let page = parseInt(req.query.page) || 1;
    const keyWordSearch = req.query.search;

    const perPage = parseInt(req.query.limit) || 8;

    let start = (page - 1) * perPage;
    let end = page * perPage;

    const details = await Detail_History.find({ id_order: req.params.id }).populate('id_order').populate('id_product');

    const totalPage = Math.ceil(details.length / perPage);

    if (!keyWordSearch) {
        res.json({
            details: details.slice(start, end),
            totalPage: totalPage
        })
    } else {
        var newData = details.filter(value => {
            return value.name_product.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1 ||
                value.price_product.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1 ||
                value.count.toString().toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1 ||
                value.size.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1
        })

        res.json({
            details: newData.slice(start, end),
            totalPage: totalPage
        })
    }
}

module.exports.details = async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id }).populate('id_user').populate('id_payment').populate('id_note');

    res.json(order)

}

module.exports.confirmOrder = async (req, res) => {
    await Order.updateOne({ _id: req.query.id }, { status: "2" }, function (err, res) {
        if (err) return res.json({ msg: err });
    });
    res.json({ msg: "Thanh Cong" })
}

// module.exports.delivery = async (req, res) => {
//     await Order.updateOne({ _id: req.query.id }, { status: "3" },async function (err, res) {


//         const DetailOrder = await Detail_Order.findOne({id_order: req.query.id})
//         const  inventory= DetailOrder.inventory
//        console.log(inventory);


//         if (err) return res.json({ msg: err });
//     });

//     res.json({ msg: "Thanh Cong" })
// }
module.exports.delivery = async (req, res) => {
  try {
    // Cập nhật trạng thái đơn hàng
    await Order.updateOne({ _id: req.query.id }, { status: "3" });

    // Lấy chi tiết đơn hàng
    const detailOrder = await Detail_Order.findOne({ id_order: req.query.id });
    const detailInventory = detailOrder.inventory; // ví dụ: { S: 1 }
    const id_product = detailOrder.id_product;

    // Lấy sản phẩm tương ứng
    const product = await Products.findOne({ _id: id_product });
    if (!product) return res.status(404).json({ msg: "Không tìm thấy sản phẩm" });

    const productInventory = product.inventory; // ví dụ: { S: 1, M: 2, L: 1 }

    // Chỉ cập nhật size nào có trong detailOrder.inventory
    for (const size in detailInventory) {
      if (productInventory[size] !== undefined) {
        productInventory[size] -= detailInventory[size];
        if (productInventory[size] < 0) productInventory[size] = 0; // không để số âm
      }
    }

    // Cập nhật lại inventory
    await Products.updateOne(
      { _id: id_product },
      { inventory: productInventory }
    );

    res.json({ msg: "Thanh Cong" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Lỗi server" });
  }
};

module.exports.confirmDelivery = async (req, res) => {
    await Order.updateOne({ _id: req.query.id }, { status: "4", pay: true }, function (err, res) {
        if (err) return res.json({ msg: err });
    });
    res.json({ msg: "Thanh Cong" })
}

module.exports.cancelOrder = async (req, res) => {
    await Order.updateOne({ _id: req.query.id }, { status: "5" }, function (err, res) {
        if (err) return res.json({ msg: err });
    });
    res.json({ msg: "Thanh Cong" })
}


module.exports.completeOrder = async (req, res) => {

    let page = parseInt(req.query.page) || 1;
    let money = 0;

    const getDate = req.query.getDate
    const productId = req.query.productId

    const perPage = parseInt(req.query.limit) || 8;

    let start = (page - 1) * perPage;
    let end = page * perPage;

    // Lấy tất cả đơn hàng đã hoàn thành
    const orders = await (await Order.find({ status: '4' }).populate('id_user').populate('id_payment').populate('id_note')).reverse();

    // Lọc đơn hàng theo ngày nếu có
    let filteredOrders = orders;
    if (getDate) {
        filteredOrders = orders.filter(value => {
            return value.create_time.toString().indexOf(getDate.toString()) !== -1
        });
    }

    // Nếu có lọc theo sản phẩm
    if (productId) {
        // Lấy tất cả chi tiết đơn hàng có chứa sản phẩm được chọn
        const orderDetailsWithProduct = await Detail_Order.find({
            id_product: productId
        });

        // Lấy danh sách ID đơn hàng có chứa sản phẩm
        const orderIdsWithProduct = orderDetailsWithProduct.map(detail => detail.id_order);

        // Lọc đơn hàng theo ID
        filteredOrders = filteredOrders.filter(order =>
            orderIdsWithProduct.includes(order._id.toString())
        );
    }

    // Lấy thông tin chi tiết sản phẩm cho mỗi đơn hàng
    const ordersWithProductDetails = [];
    for (const order of filteredOrders) {
        // Lấy chi tiết đơn hàng
        const orderDetails = await Detail_Order.find({ id_order: order._id.toString() }).populate('id_product');

        // Tạo một bản sao của đơn hàng để thêm thông tin sản phẩm
        const orderWithProducts = order.toObject();

        // Thêm thông tin sản phẩm vào đơn hàng
        orderWithProducts.productDetails = orderDetails;

        ordersWithProductDetails.push(orderWithProducts);
    }

    // Tính tổng tiền
    ordersWithProductDetails.forEach(value => {
        money += Number(value.total);
    });

    const totalPage = Math.ceil(ordersWithProductDetails.length / perPage);

    res.json({
        orders: ordersWithProductDetails.slice(start, end),
        totalPage: totalPage,
        totalMoney: money
    });

}