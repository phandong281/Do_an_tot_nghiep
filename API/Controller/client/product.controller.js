module.exports.detail = async (req, res) => {
    try {
        const id = req.params.id;

        // Đảm bảo trả về tất cả các trường của Product, bao gồm mô tả
        const product = await Product.findById(id).select('name_product price_product image describe description detail');

        res.json(product);
    } catch (error) {
        res.json('Server Error');
    }
}