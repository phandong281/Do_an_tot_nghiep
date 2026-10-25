var mongoose = require('mongoose');

var schema = new mongoose.Schema(
    {
        id_category: {
            type: String,
            ref: 'Category'
        },
        name_product: String,
        price_product: String,
        image: String,
        describe: String,
        gender: String,
        // Thay đổi từ number thành inventory để quản lý số lượng theo size
        inventory: {
            S: { type: Number, default: 0 },
            M: { type: Number, default: 0 },
            L: { type: Number, default: 0 }
        },
        // Giữ lại trường number để tương thích ngược
        number: Number
    }
);

var Products = mongoose.model('Products', schema, 'product');

module.exports = Products;
