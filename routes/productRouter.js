const productRouter = require("express").Router()

const Product = require("../models/productModel")
const Section = require("../models/sectionModel")
const SubSection = require("../models/subSectionModel")

const {productReviews, convertToArray} = require("../vars/functions")

const productUpdateValidator = require("../validators/productUpdateValidator")
const adminValidator = require("../validators/adminValidator")

//GET
productRouter.get("/", adminValidator, async (req, res) => {
    const perPage = 18
    const page = parseInt(req.query.page) || 1
    const id = req.query.id

    try {
        if (!id) {
            const totalProducts = await Product.countDocuments()
            const products = await Product.find({display: true})
                .skip((page - 1) * perPage)
                .limit(perPage)
                .lean()

            const productsWithReviews = await productReviews(products)

            return res.status(200).json({
                products: productsWithReviews, currentPage: page, totalPages: Math.ceil(totalProducts / perPage)
            })
        } else {
            const product = await Product.findOne({_id: id})
            return res.status(200).json({product: product})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//POST
productRouter.post("/", adminValidator, async (req, res) => {
    const {
        photo, name, price, article, description, sectionId, subSectionId, promotion, quantity
    } = req.body
    try {
        const product = new Product({
            photo: photo,
            name: name,
            price: price,
            article: article,
            description: description,
            promotion: promotion,
            quantity: quantity
        })

        if (sectionId) {
            await Section.updateOne({_id: sectionId}, {$push: {products: product._id}})
        } else if (subSectionId) {
            await SubSection.updateOne({_id: subSectionId}, {$push: {products: product._id}})
        } else return res.status(400).json({error: "You can't assign product to Section and SubSection"})

        await product.save()
        return res.status(201).json({
            message: "Successfully created", product: product
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//PUT
productRouter.put("/", adminValidator, productUpdateValidator, async (req, res) => {
    try {
        const {history, ...payload} = req.product

        return res.status(200).json({
            message: "Product successfully updated", product: payload, changes: req.editHistory
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//DELETE
productRouter.delete("/", adminValidator, async (req, res) => {
    const {id} = req.query
    try {
        const ids = await convertToArray(id)
        if (!id) {
            await Product.deleteMany()
            await Section.updateMany({}, {$pull: {products: {$in: []}}})
            await SubSection.updateMany({}, {$pull: {products: {$in: []}}})
            return res.status(201).json({message: "All products deleted"})
        } else {
            await Section.updateMany({products: {$in: ids}}, {$pull: {products: {$in: ids}}})
            await SubSection.updateMany({products: {$in: ids}}, {$pull: {products: {$in: ids}}})
            await Product.deleteMany({_id: id})
            return res.status(201).json({message: "Product deleted"})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})


module.exports = productRouter