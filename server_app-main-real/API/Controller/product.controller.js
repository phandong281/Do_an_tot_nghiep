
const Products = require('../../Models/product')
const Category = require('../../Models/category')
const Comment = require('../../Models/comment')
const Order = require('../../Models/order')
const DetailOrder = require('../../Models/detail_order')
const mongoose = require('mongoose')
const http = require('http')
const https = require('https')

const classifySentiments = (comments) => new Promise((resolve) => {
    if (!comments.length) return resolve([])

    let endpoint
    try {
        endpoint = new URL(process.env.SENTIMENT_API_URL || 'http://127.0.0.1:5000/api/predict-batch')
    } catch (error) {
        return resolve([])
    }

    const transport = endpoint.protocol === 'https:' ? https : http
    const body = JSON.stringify({ comments })
    const request = transport.request(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        },
        timeout: 1800
    }, (response) => {
        let responseBody = ''
        response.setEncoding('utf8')
        response.on('data', chunk => { responseBody += chunk })
        response.on('end', () => {
            try {
                const parsed = JSON.parse(responseBody)
                resolve(response.statusCode >= 200 && response.statusCode < 300 && Array.isArray(parsed.results)
                    ? parsed.results
                    : [])
            } catch (error) {
                resolve([])
            }
        })
    })

    request.on('timeout', () => request.destroy())
    request.on('error', () => resolve([]))
    request.write(body)
    request.end()
})


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

// Gợi ý sản phẩm từ danh mục khách đã xem/mua, doanh số và đánh giá.
// Nếu dịch vụ Python đang chạy, cảm xúc bình luận được dùng làm tín hiệu bổ sung.
module.exports.recommendations = async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 20)
        const userId = req.query.userId
        const productId = req.query.productId
        if (productId && !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Mã sản phẩm không hợp lệ' })
        }

        const [allProducts, anchorProduct] = await Promise.all([
            Products.find().lean(),
            productId ? Products.findById(productId).lean() : Promise.resolve(null)
        ])

        if (!allProducts.length) return res.json([])

        const purchasedDetails = []
        if (userId) {
            const userOrders = await Order.find({ id_user: userId, status: '4' }).select('_id').lean()
            if (userOrders.length) {
                const orderIds = userOrders.map(order => String(order._id))
                purchasedDetails.push(...await DetailOrder.find({ id_order: { $in: orderIds } }).lean())
            }
        }

        const purchasedIds = new Set(purchasedDetails.map(detail => String(detail.id_product)))
        const excludedIds = new Set(purchasedIds)
        if (productId) excludedIds.add(String(productId))

        const interestWeights = new Map()
        purchasedDetails.forEach(detail => {
            const purchasedProduct = allProducts.find(product => String(product._id) === String(detail.id_product))
            if (purchasedProduct && purchasedProduct.id_category) {
                const weight = Math.max(1, Number(detail.count) || 1)
                interestWeights.set(purchasedProduct.id_category,
                    (interestWeights.get(purchasedProduct.id_category) || 0) + weight)
            }
        })
        if (anchorProduct && anchorProduct.id_category) {
            interestWeights.set(anchorProduct.id_category,
                (interestWeights.get(anchorProduct.id_category) || 0) + 2)
        }

        const candidates = allProducts.filter(product => !excludedIds.has(String(product._id)))
        if (!candidates.length) return res.json([])

        const candidateIds = candidates.map(product => product._id)
        const comments = await Comment.find({ id_product: { $in: candidateIds } })
            .select('id_product content star').lean()
        const details = await DetailOrder.find({ id_product: { $in: candidateIds.map(String) } })
            .select('id_product count').lean()

        const sentimentRows = await classifySentiments(comments.map(comment => comment.content).filter(Boolean))
        const sentimentByText = new Map()
        sentimentRows.forEach(row => {
            if (row && row.Comment) sentimentByText.set(row.Comment, row.Label)
        })

        const commentsByProduct = new Map()
        comments.forEach(comment => {
            const id = String(comment.id_product)
            if (!commentsByProduct.has(id)) commentsByProduct.set(id, [])
            commentsByProduct.get(id).push(comment)
        })
        const salesByProduct = new Map()
        details.forEach(detail => {
            const id = String(detail.id_product)
            salesByProduct.set(id, (salesByProduct.get(id) || 0) + (Number(detail.count) || 0))
        })

        const maxSales = Math.max(1, ...candidates.map(product => salesByProduct.get(String(product._id)) || 0))
        const maxInterest = Math.max(1, ...interestWeights.values())
        const anchorGender = anchorProduct && (anchorProduct.gender || '').toLowerCase()

        const ranked = candidates.map(product => {
            const id = String(product._id)
            const productComments = commentsByProduct.get(id) || []
            const ratedComments = productComments.filter(comment => Number(comment.star) > 0)
            const averageRating = ratedComments.length
                ? ratedComments.reduce((sum, comment) => sum + Number(comment.star), 0) / ratedComments.length
                : 3
            const classified = productComments
                .map(comment => sentimentByText.get(comment.content))
                .filter(Boolean)
            const sentimentScore = classified.length
                ? classified.filter(label => label === 'Tích cực').length / classified.length
                : averageRating / 5
            const sales = salesByProduct.get(id) || 0
            const categoryAffinity = product.id_category
                ? (interestWeights.get(product.id_category) || 0) / maxInterest
                : 0
            const genderAffinity = anchorGender && (product.gender || '').toLowerCase() === anchorGender ? 1 : 0
            const score = (Math.log1p(sales) / Math.log1p(maxSales)) * 0.3
                + (averageRating / 5) * 0.25
                + sentimentScore * 0.25
                + categoryAffinity * 0.15
                + genderAffinity * 0.05

            let reason = 'Được khách hàng đánh giá tốt'
            if (categoryAffinity > 0) reason = 'Cùng danh mục bạn quan tâm'
            else if (sales > 0 && sales >= maxSales * 0.5) reason = 'Sản phẩm được mua nhiều'
            else if (classified.length && sentimentScore >= 0.7) reason = 'Phản hồi tích cực từ khách hàng'

            return { ...product, recommendationScore: Number(score.toFixed(4)), recommendationReason: reason }
        })

        ranked.sort((left, right) => right.recommendationScore - left.recommendationScore)
        res.json(ranked.slice(0, limit))
    } catch (error) {
        console.error('Recommendation error:', error)
        res.status(500).json({ message: 'Không thể tải gợi ý sản phẩm' })
    }
}
