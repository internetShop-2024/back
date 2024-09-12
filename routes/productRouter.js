const productRouter = require("express").Router()

const Product = require("../models/productModel")

const {productReviews, filterSystem, productCategory} = require("../vars/functions")
const {perPage} = require("../vars/publicVars")

//GET
productRouter.get("/", async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const id = req.query.id

    const allowedParams = ['price', 'rate', 'promotion', 'sectionId', 'subSectionId', 'sortBy', 'orderBy']
    const newObject = Object.fromEntries(
        Object.entries(req.query)
            .filter(([key, value]) => allowedParams.includes(key) && value !== undefined))
    try {
        if (!id) {
            if (req.query.sectionId !== undefined && req.query.subSectionId !== undefined) {
                throw new Error("You must provide only one of sectionId or subSectionId")
            }
            const data = await filterSystem(newObject)
            const totalProducts = await Product.countDocuments()
            const products = await Product.find(data.payload)
                .select("-__v -createdAt -history")
                .skip((page - 1) * perPage)
                .limit(perPage)
                .sort(data.sortOptions)
                .lean()
            if (!products.length)
                return res.status(404).json({message: "Products Not Found"})

            await productReviews(products)
            await productCategory(products)

            return res.status(200).json({
                products: products, currentPage: page, totalPages: Math.ceil(totalProducts / perPage)
            })
        } else {
            const product = await Product.findOne({_id: id}).lean()
            if (!product) return res.status(404).json({error: "Product not found"})
            await productReviews([product])
            await productCategory([product])
            if (!product)
                return res.status(404).json({message: "Product not found"})

            return res.status(200).json({product: product})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})


module.exports = productRouter