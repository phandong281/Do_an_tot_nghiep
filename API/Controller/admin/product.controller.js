const Product = require('../../../Models/product');
// const { cloudinary, uploadCloud } = require('../../../config/cloudinary.config');
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

module.exports.index = async (req, res) => {
    let page = parseInt(req.query.page) || 1;
    const keyWordSearch = req.query.search;

    const perPage = parseInt(req.query.limit) || 8;
    const totalPage = Math.ceil(await Product.countDocuments() / perPage);

    let start = (page - 1) * perPage;
    let end = page * perPage;

    const products = await Product.find().populate('id_category');


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

module.exports.create = async (req, res) => {
    try {
        const newProduct = new Product({
            name_product: req.body.name,
            price_product: req.body.price,
            id_category: req.body.category,
            inventory: {
                S: parseInt(req.body.inventoryS) || 0,
                M: parseInt(req.body.inventoryM) || 0,
                L: parseInt(req.body.inventoryL) || 0
            },
         
            describe: req.body.description,
            gender: req.body.gender
        });

        if (req.files) {
            const file = req.files;
            const originalName = req.body.fileName;
            const streamUpload = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({public_id: `${originalName}`,folder:"products"}, (error, result) => {
                    if (result) resolve(result);
                    else reject(error);
                });
                streamifier.createReadStream(buffer).pipe(stream);
            });
        };

        const result = await streamUpload(file.image.data);
            // Ảnh đã được upload lên Cloudinary bởi middleware
            newProduct.image = result.secure_url; // Cloudinary URL
        } else {
            // Sử dụng ảnh mặc định từ Cloudinary
            newProduct.image = 'https://res.cloudinary.com/dwmsfixy5/image/upload/v1747509541/samples/cloudinary-icon.png';
        }

        await newProduct.save();
        res.json({ msg: "Bạn đã thêm thành công" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}
    
module.exports.delete = async (req, res) => {
    const id = req.query.id;

    await Product.deleteOne({ _id: id }, (err) => {
        if (err) {
            res.json({ msg: err })
            return;
        }
        res.json({ msg: "Thanh Cong" })
    })
    
}

module.exports.details = async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id });

    res.json(product)
}

module.exports.update = async (req, res) => {
    try {
        const updateData = {
            name_product: req.body.name,
            price_product: req.body.price,
            id_category: req.body.category,
            inventory: {
                S: parseInt(req.body.inventoryS) || 0,
                M: parseInt(req.body.inventoryM) || 0,
                L: parseInt(req.body.inventoryL) || 0
            },
           
            describe: req.body.description,
            gender: req.body.gender
        };

        if (req.files) {
             const file = req.files;
            const originalName = req.body.fileName;
            const streamUpload = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({public_id: `${originalName}`,folder:"products"}, (error, result) => {
                    if (result) resolve(result);
                    else reject(error);
                });
                streamifier.createReadStream(buffer).pipe(stream);
            });
        };

        const result = await streamUpload(file.image.data);
            // Ảnh đã được upload lên Cloudinary bởi middleware
            updateData.image = result.secure_url;
            
            // Xóa ảnh cũ trên Cloudinary nếu có
            const oldProduct = await Product.findById(req.body.id);
            if (oldProduct && oldProduct.image) {
                const publicId = oldProduct.image.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`products/${publicId}`);
            }
        }
// https://res.cloudinary.com/dwmsfixy5/image/upload/v1747515875/products/quan.jpg.jpg
        await Product.updateOne({ _id: req.body.id }, updateData);
        res.json({ msg: "Bạn đã update thành công" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}
