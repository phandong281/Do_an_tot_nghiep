var express = require('express')
var router = express.Router()
const Comment = require('../Controller/comment.controller')

router.get('/:id', Comment.index)
router.post('/:id', Comment.post_comment)
router.get('/check/:id_product/:id_user', Comment.check_can_review)

module.exports = router
