const productRouter = require("express").Router()

const Product = require("../models/productModel")
const Review = require("../models/reviewModel")
const Section = require("../models/sectionModel")
const SubSection = require("../models/subSectionModel")
const {productReviews} = require("../vars/functions")

productRouter.get("/", async (req, res) => {
    const perPage = 18
    const page = parseInt(req.query.page) || 1

    try {
        const totalProducts = await Product.countDocuments()
        const products = await Product.find({display: true})
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean()

        const productsWithReviews = await productReviews(products)

        return res.status(200).json({
            products: productsWithReviews,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / perPage)
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})


productRouter.get("/:id", async (req, res) => {
    try {
        const productId = req.params.id
        if (!productId)
            return res.status(404).json({error: "Product not found"})

        const product = await Product.findOne({_id: productId})
        return res.status(201).json({product: product})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})


productRouter.post("/", async (req, res) => {
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

        if (sectionId && subSectionId)
            return res.status(400).json({error: "You can't assign product to Section and SubSection"})

        const section = await Section.findById(sectionId)
        const subSection = await SubSection.findById(subSectionId)

        if (section) {
            section.products.push(product._id)
            await section.save()
        }

        if (subSection) {
            subSection.products.push(product._id)
            await subSection.save()
        }

        await product.save()
        return res.status(201).json({
            message: "Successfully created",
            product: product
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})
productRouter.post("/:id/reviews", async (req, res) => {
    const {content} = req.body
    try {
        const productId = req.params.id
        const review = new Review({
            product: productId,
            content: content
        })

        const product = await Product.findById(productId)
        await product.reviews.push(review._id)


        await review.save()
        await product.save()
        return res.status(201).json({
            message: "Successfully created",
            review: review
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

productRouter.put("/:id", async (req, res) => {
        const {
            name, photo, price, article, description, sectionId, subSectionId, promotion, quantity, display
        } = req.body

        try {
            const product = await Product.findById(req.params.id)
            if (!product) {
                return res.status(404).json({error: "Product not found"})
            }

            const editHistory = []

            const addToHistory = (column, oldValue, newValue) => {
                if (oldValue !== newValue) {
                    editHistory.push({column, oldValue, newValue})
                }
            }

            addToHistory('name', product.name, name)
            addToHistory('photo', product.photo, photo)
            addToHistory('price', product.price, price)
            addToHistory('article', product.article, article)
            addToHistory('description', product.description, description)
            addToHistory('sectionId', product.sectionId, sectionId)
            addToHistory('subSectionId', product.subSectionId, subSectionId)
            addToHistory('promotion', product.promotion, promotion)
            addToHistory('quantity', product.quantity, quantity)
            // addToHistory('display', product.display, display)

            product.name = name || product.name
            product.photo = photo || product.photo
            product.price = price || product.price
            product.article = article || product.article
            product.description = description || product.description
            product.sectionId = sectionId || product.sectionId
            product.subSectionId = subSectionId || product.subSectionId
            product.promotion = promotion || product.promotion
            product.quantity = quantity || product.quantity
            product.display = display || product.display


            if (editHistory.length > 0) {
                product.history = [...product.history, ...editHistory]
            }


            await product.save()

            return res.status(200).json({message: "Product successfully updated", product})
        } catch
            (e) {
            return res.status(500).json({error: e.message})
        }
    }
)

productRouter.delete("/", async (req, res) => {
    await Product.deleteMany()
    return res.status(201).json({message: "Deleted"})
})
productRouter.delete("/:id", async (req, res) => {
    try {
        const productId = req.params.id
        if (!productId)
            return res.status(404).json({error: "Product not found"})

        const section = await Section.findOne({products: productId})
        if (section) {
            section.products.pop(productId)
            await section.save()
        }

        const subSection = await SubSection.findOne({products: productId})
        if (subSection) {
            subSection.products.pop(productId)
            await subSection.save()
        }

        await Product.deleteOne({_id: productId})
        return res.status(201).json({message: "Deleted"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

module.exports = productRouter