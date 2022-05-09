const express = require('express')
const router = express.Router();
const { Products } = require("../../models")

const productDataLayer = require('../../dal/products')

router.get('/', async (req,res) => {
    res.send(await productDataLayer.getAllProducts())
})

router.get("/search", async (req, res) => {
    let q = Products.collection();

    // search product name
    if (req.query.name) {
        q = q.where("essentialoil_id", "=", "%" + req.query.name + "%")
    }
    // filter by product type
    if (req.query.item_type_id) {
        q = q.where("item_type_id", "=", req.query.item_type_id)
    }
    // filter by usage
    if (req.query.usages) {
        q = q.query('join', 'products_usages', 'products.id', 'products_usages.product_id')
            .where('usage_id', 'in', req.query.usages.split(','))
    }
    // filter by scent profile
    if (req.query.scent) {
        q = q.query('join', 'products_scent', 'products.id', 'products_scent.product_id')
            .where('scent_id', 'in', req.query.scent.split(','))
    }
    // filter by benefits
    if (req.query.benefits) {
        q = q.query('join', 'benefits_products', 'products.id', 'benefits_products.product_id')
            .where('benefit_id', 'in', req.query.benefits.split(','))
    }
    let results = await q.fetch({
        withRelated: ['itemtype', 'essentialoil', 'scent', 'usage', 'benefit', 'size']
    })
    res.send(results)
})

module.exports = router;
