const router = require("express").Router()
const productRouter = require("../routes/productRouter")
const sectionRouter = require("../routes/sectionRouter")
const userRouter = require("../routes/userRouter")
const orderRouter = require("../routes/orderRouter")
const blogRouter = require("../routes/blogRouter")
const adminRouter = require("../routes/adminRouter")
const packRouter = require("../routes/packRouter")
const chatRouter = require("../routes/chatRouter")
const docRouter = require("../docs/docRouter")

router.get("/", async (req, res) => {
    return res.send("Дай боже")
})

router.use("/products", productRouter)
router.use("/packs", packRouter)
router.use("/catalog", sectionRouter)
router.use("/users", userRouter)
router.use("/orders", orderRouter)
router.use("/posts", blogRouter)
router.use("/admin", adminRouter)
router.use("/chats", chatRouter)
router.use("/", docRouter)

module.exports = router