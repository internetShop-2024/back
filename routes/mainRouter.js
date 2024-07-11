const router = require("express").Router()
const productRouter = require("../routes/productRouter")
const catalogRouter = require("../routes/catalogRouter")

router.use("/products", productRouter)
router.use("/catalog", catalogRouter)

module.exports = router