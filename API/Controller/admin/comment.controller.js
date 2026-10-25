const Comment = require('../../../Models/comment')
const Users = require('../../../Models/user')
const Product = require('../../../Models/product')
const mongoose = require('mongoose')

module.exports.index = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1
        const keyWordSearch = req.query.search
        const perPage = parseInt(req.query.limit) || 8
        
        // Lấy tổng số comment
        const totalComments = await Comment.countDocuments()
        const totalPage = Math.ceil(totalComments / perPage)
        
        let start = (page - 1) * perPage
        let end = page * perPage
        
        // Lấy danh sách comment với thông tin User và Product
        const comments = await Comment.find()
            .populate('id_user')
            .populate('id_product')
            .sort({ _id: -1 }) // Sắp xếp theo thời gian tạo giảm dần
       
        if (!keyWordSearch) {
            res.json({
                comments: comments.slice(start, end),
                totalPage: totalPage
            })
        } else {
            // Tìm kiếm theo Comment comment hoặc tên User
            const filteredComments = comments.filter(comment => {
                return (comment.content && comment.content.toLowerCase().includes(keyWordSearch.toLowerCase())) ||
                       (comment.id_user && comment.id_user.fullname && 
                        comment.id_user.fullname.toLowerCase().includes(keyWordSearch.toLowerCase())) ||
                       (comment.id_product && comment.id_product.name_product && 
                        comment.id_product.name_product.toLowerCase().includes(keyWordSearch.toLowerCase()))
            })
            
            res.json({
                comments: filteredComments.slice(start, end),
                totalPage: Math.ceil(filteredComments.length / perPage)
            })
        }
    } catch (error) {
        console.error('Error in admin comment index:', error)
        res.status(500).json({ 
            message: "Đã xảy ra lỗi khi lấy danh sách Rating" 
        })
    }
}

module.exports.detail = async (req, res) => {
    try {
        const id = req.params.id
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID không hợp lệ" })
        }
        
        const comment = await Comment.findById(id)
            .populate('id_user')
            .populate('id_product')
        
        if (!comment) {
            return res.status(404).json({ message: "Không tìm thấy Rating" })
        }
        
        res.json(comment)
    } catch (error) {
        console.error('Error in admin comment detail:', error)
        res.status(500).json({ 
            message: "Đã xảy ra lỗi khi lấy thông tin Rating" 
        })
    }
}

module.exports.delete = async (req, res) => {
    try {
        const id = req.params.id
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID không hợp lệ" })
        }
        
        const comment = await Comment.findByIdAndDelete(id)
        
        if (!comment) {
            return res.status(404).json({ message: "Không tìm thấy Rating" })
        }
        
        res.json({ 
            message: "Delete Rating thành công",
            success: true
        })
    } catch (error) {
        console.error('Error in admin comment delete:', error)
        res.status(500).json({ 
            message: "Đã xảy ra lỗi khi Delete Rating",
            success: false
        })
    }
}

module.exports.getUserInfo = async (req, res) => {
    try {
        const id = req.params.id
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID User không hợp lệ" })
        }
        
        const user = await Users.findById(id)
        
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy thông tin User" })
        }
        
        // Trả về thông tin User (bao gồm email, số điện thoại)
        res.json({
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
            address: user.address
        })
    } catch (error) {
        console.error('Error in admin get user info:', error)
        res.status(500).json({ 
            message: "Đã xảy ra lỗi khi lấy thông tin User" 
        })
    }
}