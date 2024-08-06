const productRouter = require("express").Router()

const Product = require("../models/productModel")
const Section = require("../models/sectionModel")
const SubSection = require("../models/subSectionModel")

const {productReviews, convertToArray, filterSystem} = require("../vars/functions")

const productUpdateValidator = require("../validators/productUpdateValidator")
const adminValidator = require("../validators/adminValidator")

//GET
productRouter.get("/", adminValidator, async (req, res) => {
    const perPage = 18
    const page = parseInt(req.query.page) || 1
    const id = req.query.id

    try {
        if (!id) {
            const data = await filterSystem(req.query)
            const totalProducts = await Product.countDocuments()

            let products

            switch (true) {
                case data.payload.sectionId !== undefined && data.payload.subSectionId !== undefined:
                    throw new Error("You must provide only one of sectionId or subSectionId")

                case data.payload.sectionId !== undefined:
                    if (!data.payload.sectionId) {
                        throw new Error("Invalid sectionId")
                    }
                    const section = await Section.findById(data.payload.sectionId).select("products").lean()
                    if (!section || !section.products.length)
                        return res.status(404).json({message: "Products not found"})

                    data.payload._id = {$in: section.products}
                    const {sectionId, ...sectionPayload} = data.payload
                    products = await Product.find(sectionPayload)
                        .skip((page - 1) * perPage)
                        .limit(perPage)
                        .sort(data.sortOptions)
                        .lean()
                    break

                case data.payload.subSectionId !== undefined:
                    if (!data.payload.subSectionId) {
                        throw new Error("Invalid subSectionId")
                    }
                    const subSection = await SubSection.findById(data.payload.subSectionId).select("products").lean()
                    if (!subSection || !subSection.products.length)
                        return res.status(404).json({message: "Products not found"})

                    data.payload._id = {$in: subSection.products}
                    const {subSectionId, ...subSectionPayload} = data.payload
                    products = await Product.find(subSectionPayload)
                        .skip((page - 1) * perPage)
                        .limit(perPage)
                        .sort(data.sortOptions)
                        .lean()
                    break

                default:
                    products = await Product.find(data.payload)
                        .skip((page - 1) * perPage)
                        .limit(perPage)
                        .sort(data.sortOptions)
                        .lean()
                    break
            }

            if (!products.length)
                return res.status(404).json({message: "Not Found"})

            await productReviews(products)

            return res.status(200).json({
                products: products, currentPage: page, totalPages: Math.ceil(totalProducts / perPage)
            })
        } else {
            const product = await Product.findOne({_id: id})
            if (!product)
                return res.status(404).json({message: "Product not found"})

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
        if (!id) {
            await Product.deleteMany()
            await Section.updateMany({}, {$pull: {products: {$in: []}}})
            await SubSection.updateMany({}, {$pull: {products: {$in: []}}})
            return res.status(201).json({message: "All products deleted"})
        } else {
            const ids = await convertToArray(id)
            console.log(ids)
            await Section.updateMany({products: {$in: ids}}, {$pull: {products: {$in: ids}}})
            await SubSection.updateMany({products: {$in: ids}}, {$pull: {products: {$in: ids}}})
            await Product.deleteMany({_id: {$in: ids}})
            return res.status(201).json({message: "Product deleted"})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})


module.exports = productRouter