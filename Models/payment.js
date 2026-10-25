var mongoose = require('mongoose');

var schema = new mongoose.Schema(
    {
        _id: { type: String }, // <-- define _id là String
        pay_name: String
    }
);

var Payment = mongoose.model('Payment', schema, 'payment');

module.exports = Payment;
