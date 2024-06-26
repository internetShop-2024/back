const productRouter = require("express").Router()
const upload = require("../vars/multer")

const {Product, Review} = require("../models")

//GET
productRouter.get("/", async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1
    const limit = 18
    const offset = (page - 1) * limit

    try {
        const products = await Product.findAndCountAll({limit, offset})
        return res.status(200).json({
            totalPages: Math.ceil(products.count / limit),
            currentPage: page,
            products: products.rows
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

productRouter.get('/:id', async (req, res) => {
    const {id} = req.params

    try {
        const product = await Product.findByPk(id, {
            include: Review,
        })
        if (!product) {
            return res.status(404).json({error: 'Product not found'})
        }
        return res.status(200).json(product)
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//POST
productRouter.post("/", upload.single("photo"), async (req, res) => {
    const {name, price, article, description} = req.body
    const photo = req.file ? req.file.path : null
    const missingFields = []

    if (!name) missingFields.push("name");
    if (!price) missingFields.push("price");
    if (!article) missingFields.push("article");
    if (!description) missingFields.push("description");
    if (!photo) missingFields.push("photo");

    if (missingFields.length > 0) {
        return res.status(400).json({
            error: "Missing required fields",
            missingFields: missingFields
        });
    }
    try {
        const product = await Product.create({
            photo,
            name,
            price,
            article,
            description
        })

        if (!product)
            return res.status(400).status({error: "Product not created"})

        return res.status(201).json({message: "Product successfully created", "product": product})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

productRouter.post('/:productId/reviews', async (req, res) => {
    const {content} = req.body
    const {productId} = req.params

    if (!content) {
        return res.status(400).json({
            error: "Missing required fields",
            missingFields: "content"
        })
    }

    try {
        const review = await Review.create({
            content,
            productId,
        })
        if (!review)
            return res.status(400).json({error: "Review not created"})

        return res.status(201).json(review);
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
})

module.exports = productRouter