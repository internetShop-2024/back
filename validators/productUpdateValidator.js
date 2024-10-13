const Product = require("../models/productModel")
const {uploadMultipleFiles} = require("../vars/b2")

const productUpdateValidator = async (req, res, next) => {
    let editHistory = []
    const {id, modelId} = req.query
    const images = req.files

    try {
        const product = await Product.findById(id)
        if (!product) return res.status(404).json({error: "Product not found"})

        let isModified = false

        if (!modelId) {
            const fieldsToUpdate = ['article', 'video', 'section', 'rate']

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

        } else if (modelId === 'new') {
            const discount = req.body.promotion?.discount || 0
            const newPrice = req.body.price * (1 - discount / 100)

            const newModel = {
                name: req.body.name,
                price: req.body.price,
                quantity: req.body.quantity,
                promotion: {
                    isActive: req.body.promotion?.isActive || false,
                    discount: discount,
                    newPrice: newPrice
                },
                display: req.body.display !== undefined ? req.body.display : true,
                description: req.body.description,
                characteristics: req.body.characteristics,
                image: []
            }

            if (images?.length) {
                const urls = await uploadMultipleFiles(images)
                newModel.image.push(...urls)
            }

            product.models.push(newModel)
            editHistory.push({
                column: 'models',
                oldValue: null,
                newValue: newModel,
                editedAt: Date.now()
            })
            isModified = true

        } else {
            const model = product.models.id(modelId)
            if (!model) return res.status(404).json({error: "Model not found"})

            const discount = req.body.promotion?.discount || model.promotion?.discount || 0
            const newPrice = req.body.price ? req.body.price * (1 - discount / 100) : model.price * (1 - discount / 100)

            const modelFieldsToUpdate = ['name', 'price', 'quantity', 'display', 'description', 'characteristics']

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
                    column: `models.${modelId}.image`,
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
