
const Products = require('../../Models/product')
const Category = require('../../Models/category')


module.exports.index = async (req, res) => {

    const products = await Products.find()

    res.json(products)
}


module.exports.gender = async (req, res) => {

    const gender = req.query.gender

    const category = await Category.find({ gender: gender })

    res.json(category)

}

//TH: Hàm này dùng để phân loại Product
module.exports.category = async (req, res) => {
    const id_category = req.query.id_category;
    const gender = req.query.gender;
    
    let query = {};
    
    if (id_category !== 'all') {
        query.id_category = id_category;
    }
    
    if (gender) {
        if (gender.toLowerCase() === 'male' || gender.toLowerCase() === 'female' || gender.toLowerCase() === 'unisex') {
            query.gender = { $regex: new RegExp('^' + gender + '$', 'i') };
        }
    }
    
    const products_category = await Products.find(query);
    
    res.json(products_category);
}

//TH: Chi Tiết Product
module.exports.detail = async (req, res) => {

    const id = req.params.id

    const product = await Products.findOne({ _id: id })

    res.json(product)

}


// QT: Tìm kiếm phân loại và phân trang Product
module.exports.pagination = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const count = parseInt(req.query.count) || 9;
    const search = req.query.search || '';
    const category = req.query.category;
    const gender = req.query.gender;
    
    console.log("Received query params:", { page, count, search, category, gender });
    
    let query = {};
    
    if (category !== 'all') {
        query.id_category = category;
    }
    
    if (gender) {
        if (gender.toLowerCase() === 'male' || gender.toLowerCase() === 'female' || gender.toLowerCase() === 'unisex') {
            query.gender = { $regex: new RegExp('^' + gender + '$', 'i') };
        }
    }
    
    if (search) {
        query.name_product = { $regex: search, $options: 'i' };
    }
    
    console.log("Final query:", query);
    
    const products = await Products.find(query)
        .skip((page - 1) * count)
        .limit(count);
    
    console.log("Found products count:", products.length);
    
    res.json(products);
}

// Hàm này dùng để hiện những Product search theo scoll ở component tìm kiếm bên client
module.exports.scoll = async (req, res) => {

    const page = req.query.page
    
    const count = req.query.count

    const search = req.query.search

    //Lấy Product đầu và sẩn phẩm cuối
    const start = (page - 1) * count
    const end = page * count   

    const products = await Products.find()

    const newData = products.filter(value => {
        return value.name_product.toUpperCase().indexOf(search.toUpperCase()) !== -1
    })

    const paginationProducts = newData.slice(start, end)

    res.json(paginationProducts)

}
