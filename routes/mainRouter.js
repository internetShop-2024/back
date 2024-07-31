const router = require("express").Router()
const productRouter = require("../routes/productRouter")
const sectionRouter = require("../routes/sectionRouter")
const userRouter = require("../routes/userRouter")
const orderRouter = require("../routes/orderRouter")
const blogRouter = require("../routes/blogRouter")

router.use("/products", productRouter)
router.use("/catalog", sectionRouter)
router.use("/users", userRouter)
router.use("/orders", orderRouter)
router.use("/posts", blogRouter)

module.exports = router