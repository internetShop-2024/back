const router = require("express").Router()
const productRouter = require("../routes/productRouter")
const sectionRouter = require("../routes/sectionRouter")
const userRouter = require("../routes/userRouter")
const orderRouter = require("../routes/orderRouter")
const blogRouter = require("../routes/blogRouter")
const adminRouter = require("../routes/adminRouter")
const packRouter = require("../routes/packRouter")
const docRouter = require("../docs/docRouter")

router.get("/", async (req, res) => {
    return res.send("Життя цікаве і мотивація то є сильна")
})

router.use("/products", productRouter)
router.use("/packs", packRouter)
router.use("/catalog", sectionRouter)
router.use("/users", userRouter)
router.use("/orders", orderRouter)
router.use("/posts", blogRouter)
router.use("/admin", adminRouter)
router.use("/", docRouter)

module.exports = router