var mongoose = require('mongoose');

var schema = new mongoose.Schema(
    {
        id_product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products'
        },
        id_user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users'
        },
        content: String,
        star: Number,
        created_at: {
            type: Date,
            default: Date.now
        }
    }
);

var Comment = mongoose.model('Comment', schema, 'comment');

module.exports = Comment;
