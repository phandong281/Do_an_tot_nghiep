var express = require('express')

var router = express.Router()

const Sale = require('../../Controller/admin/sale.controller')

router.get('/', Sale.index)

router.post('/', Sale.create)

router.get('/:id', Sale.detail)

router.patch('/:id', Sale.update)

router.delete('/:id', Sale.delete) // Thêm route Delete Sale

router.get('/list/product', Sale.list)

router.get('/list/:id', Sale.detailList)

module.exports = router
