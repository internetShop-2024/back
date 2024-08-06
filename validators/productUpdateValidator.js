const Product = require("../models/productModel");

const productUpdateValidator = async (req, res, next) => {
    let editHistory = []

    try {
        const product = await Product.findById(req.query.id)
        if (!product) {
            return res.status(404).json({error: "Product not found"})
        }

        const fieldsToUpdate = [
            'name', 'photo', 'price', 'article', 'description',
            'sectionId', 'subSectionId', , 'quantity', 'display'
        ]

        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined && req.body[field] !== product[field]) {
                editHistory.push({
                    column: field,
                    oldValue: product[field],
                    newValue: req.body[field],
                    editedAt: Date.now()
                })
                product[field] = req.body[field]
            }
        })


        if (editHistory.length > 0) {
            await Product.updateOne(
                {_id: id},
                {$push: {history: {$each: editHistory}}}
            )
        }

        await product.save()
        req.product = product.toObject()
        req.editHistory = editHistory
        next()
    } catch (e) {
        return res.status(400).json({error: e.message})
    }
}

module.exports = productUpdateValidator