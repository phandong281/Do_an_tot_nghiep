var express = require('express')
var router = express.Router()

const Comment = require('../../Controller/admin/comment.controller')

// Thêm route test
router.get('/test', (req, res) => {
  res.json({ message: 'Comment router is working!' })
})

// Thêm route test đơn giản cho index
router.get('/simple', (req, res) => {
  res.json({ comments: [], totalPage: 0 })
})

router.get('/', Comment.index)
router.get('/user/:id', Comment.getUserInfo)
router.get('/:id', Comment.detail)
router.delete('/:id', Comment.delete)

module.exports = router


