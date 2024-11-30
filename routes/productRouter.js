const productRouter = require("express").Router()

const Product = require("../models/productModel")

const {productReviews, filterSystem, productCategory, modelsFilter, imageDownload} = require("../vars/functions")
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
            if (req.query.sectionId !== undefined && req.query.subSectionId !== undefined)
                return res.status(400).json({error: "Шось пішло не так"})

            const data = await filterSystem(newObject)
            await modelsFilter(data)
            data.payload["display"] = true
            const totalProducts = await Product.countDocuments()
            const products = await Product.find(data.payload)
                .select("-history")
                .skip((page - 1) * perPage)
                .limit(perPage)
                .sort(data.sortOptions)
                .lean()
            if (!products.length)
                return res.status(404).json({message: "Нема продуктів"})

            await productReviews(products)
            await productCategory(products)
            await imageDownload(products)

            return res.status(200).json({
                products: products, currentPage: page, totalPages: Math.ceil(totalProducts / perPage)
            })
        } else {
            const product = await Product.findOne({_id: id}).lean()
            if (!product) return res.status(404).json({error: "Нема продуктів"})
            await productReviews([product])
            await productCategory([product])
            await imageDownload([product])

            if (!product)
                return res.status(404).json({message: "Нема продуктів"})

            return res.status(200).json({product: product})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})


module.exports = productRouter