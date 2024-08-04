const router = require("express").Router()
const productRouter = require("../routes/productRouter")
const reviewRouter = require("../routes/reviewRouter")
const sectionRouter = require("../routes/sectionRouter")
const userRouter = require("../routes/userRouter")
const orderRouter = require("../routes/orderRouter")
const blogRouter = require("../routes/blogRouter")
const adminRouter = require("../routes/adminRouter")

router.use("/products", productRouter)
router.use("/reviews", reviewRouter)
router.use("/catalog", sectionRouter)
router.use("/users", userRouter)
router.use("/orders", orderRouter)
router.use("/posts", blogRouter)
router.use("/admin", adminRouter)

module.exports = router