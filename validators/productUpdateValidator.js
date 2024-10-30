const Product = require("../models/productModel")
const {uploadMultipleFiles} = require("../vars/b2")

const productUpdateValidator = async (req, res, next) => {
    let editHistory = []
    const {id, modelId} = req.query
    const images = req.files
    const {models} = req.body

    try {
        const product = await Product.findById(id)
        if (!product) return res.status(404).json({error: "Продукт не знайдено"})

        let isModified = false

        if (!modelId) {
            const fieldsToUpdate = ['article', 'video', 'section', 'rate', 'name', 'image', 'display']

            fieldsToUpdate.forEach(field => {
                if (req.body[field] !== undefined && req.body[field] !== product[field]) {
                    editHistory.push({
                        column: field,
                        oldValue: product[field],
                        newValue: req.body[field],
                        editedAt: Date.now()
                    })
                    product[field] = req.body[field]
                    isModified = true
                }
            })

        } else if (modelId === 'new' && product.isSingle === false) {

            if (!models?.length) return res.status(400).json({error: "Погано вказані модельки"})

            for (const model of models) {
                const discount = model.promotion?.discount || 0
                const newPrice = model.price * (1 - discount / 100)
                model.promotion = {
                    discount: discount,
                    newPrice: newPrice
                }
                product.models.push(model)

                if (images?.length) {
                    const urls = await uploadMultipleFiles(images)
                    model.image.push(...urls)
                }

                editHistory.push({
                    column: 'models',
                    oldValue: null,
                    newValue: model,
                    editedAt: Date.now()
                })
                isModified = true
            }
        } else {
            const model = product.models.id(modelId)
            if (!model) return res.status(404).json({error: "Неможливо"})

            const discount = req.body.promotion?.discount || model.promotion?.discount || 0
            const newPrice = req.body.price ? req.body.price * (1 - discount / 100) : model.price * (1 - discount / 100)

            const modelFieldsToUpdate = ['modelName', 'price', 'quantity', 'description', 'characteristics']

            modelFieldsToUpdate.forEach(field => {
                if (req.body[field] !== undefined && req.body[field] !== model[field]) {
                    editHistory.push({
                        column: `models.${modelId}.${field}`,
                        oldValue: model[field],
                        newValue: req.body[field],
                        editedAt: Date.now()
                    })
                    model[field] = req.body[field]
                    isModified = true
                }
            })

            if (req.body.promotion) {
                if (req.body.promotion.isActive !== undefined && req.body.promotion.isActive !== model.promotion.isActive) {
                    editHistory.push({
                        column: `models.${modelId}.promotion.isActive`,
                        oldValue: model.promotion.isActive,
                        newValue: req.body.promotion.isActive,
                        editedAt: Date.now()
                    })
                    model.promotion.isActive = req.body.promotion.isActive
                    isModified = true
                }

                if (req.body.promotion.discount !== undefined) {
                    if (req.body.promotion.discount !== model.promotion.discount) {
                        editHistory.push({
                            column: `models.${modelId}.promotion.discount`,
                            oldValue: model.promotion.discount,
                            newValue: req.body.promotion.discount,
                            editedAt: Date.now()
                        })
                        model.promotion.discount = req.body.promotion.discount
                        isModified = true
                    }
                }

                model.promotion.newPrice = newPrice
                editHistory.push({
                    column: `models.${modelId}.promotion.newPrice`,
                    oldValue: model.promotion.newPrice,
                    newValue: newPrice,
                    editedAt: Date.now()
                })
                isModified = true
            }

            if (images?.length) {
                const urls = await uploadMultipleFiles(images)
                model.image.push(...urls)
                editHistory.push({
                    column: `image`,
                    oldValue: null,
                    newValue: urls,
                    editedAt: Date.now()
                })
                isModified = true
            }

            if (model.quantity <= 0) {
                model.display = false
            }
        }

        if (isModified) {
            if (editHistory.length > 0) {
                await Product.updateOne(
                    {_id: id},
                    {$push: {history: {$each: editHistory}}}
                )
            }

            await product.save()
        }

        req.product = product.toObject()
        req.editHistory = editHistory
        next()

    } catch (e) {
        return res.status(400).json({error: e.message})
    }
}

module.exports = productUpdateValidator
