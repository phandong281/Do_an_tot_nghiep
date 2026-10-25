const Category = require('../../../Models/category')
const Product = require('../../../Models/product')

module.exports.index = async (req, res) => {
    let page = parseInt(req.query.page) || 1;
    const keyWordSearch = req.query.search;

    const perPage = parseInt(req.query.limit) || 8;
    const totalPage = Math.ceil(await Category.countDocuments() / perPage);

    let start = (page - 1) * perPage;
    let end = page * perPage;

    const categories = await Category.find();


    if (!keyWordSearch) {
        res.json({
            categories: categories.slice(start, end),
            totalPage: totalPage
        })

    } else {
        var newData = categories.filter(value => {
            return value.category.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1 ||
                value.id.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1
        })

        res.json({
            categories: newData.slice(start, end),
            totalPage: totalPage
        })
    }
}

module.exports.create = async (req, res) => {
    try {
        // Kiểm tra nếu không có tên danh mục
        if (!req.body.name) {
            return res.status(400).json({ msg: 'Vui lòng nhập tên danh mục' });
        }

        // Chuẩn hóa tên danh mục
        const categoryName = req.body.name.trim().toLowerCase().replace(/^.|\s\S/g, a => a.toUpperCase());

        // Kiểm tra danh mục đã tồn tại chưa
        const categoryExists = await Category.findOne({ category: categoryName });

        if (categoryExists) {
            return res.status(400).json({ msg: 'Loại đã tồn tại' });
        }

        // Tạo danh mục mới
        const newCategory = new Category({ category: categoryName });
        await newCategory.save();

        return res.status(201).json({ msg: "Bạn đã thêm thành công", category: newCategory });
    } catch (error) {
        return res.status(500).json({ msg: "Lỗi server", error: error.message });
    }
};


module.exports.delete = async (req, res) => {
    console.log(req.query)
    const id = req.query.id;

    await Category.deleteOne({ _id: id }, (err) => {
        if (err) {
            res.json({ msg: err })
            return;
        }
        res.json({ msg: "Thanh Cong" })
    })

}


module.exports.detailProduct = async (req, res) => {
    let page = parseInt(req.query.page) || 1;
    const keyWordSearch = req.query.search;

    const perPage = parseInt(req.query.limit) || 8;


    let start = (page - 1) * perPage;
    let end = page * perPage;

    const category = await Category.findOne({ category: req.params.id });


    let products = await Product.find({ id_category: category._id }).populate('id_category');
    const totalPage = Math.ceil(products.length / perPage);

    if (!keyWordSearch) {
        res.json({
            products: products.slice(start, end),
            totalPage: totalPage
        })

    } else {
        var newData = products.filter(value => {
            return value.name_product.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1 ||
                value.price_product.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1 ||
                value.id.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1
            // value.id_category.category.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1
        })

        res.json({
            products: newData.slice(start, end),
            totalPage: totalPage
        })
    }
}

module.exports.update = async (req, res) => {
    const category = await Category.find();

    const categoryFilter = category.filter((c) => {
        return c.category.toUpperCase() === req.query.name.toUpperCase().trim() && c.id !== req.query.id
    });

    if (categoryFilter.length > 0) {
        res.json({ msg: 'Loại đã tồn tại' })
    } else {
        req.query.name = req.query.name.toLowerCase().replace(/^.|\s\S/g, a => { return a.toUpperCase() })
        await Category.updateOne({ _id: req.query.id }, { category: req.query.name }, function (err, res) {
            if (err) return res.json({ msg: err });
        });
        res.json({ msg: "Bạn đã update thành công" })
    }
}

module.exports.detail = async (req, res) => {
    const category = await Category.findOne({ _id: req.params.id });

    res.json(category)
}