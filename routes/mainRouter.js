const router = require("express").Router()
const productRouter = require("../routes/productRouter")

router.use("/products", productRouter)

module.exports = router