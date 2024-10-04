const userRouter = require("express").Router()

const User = require("../models/userModel")
const Order = require("../models/orderModel")
const Product = require("../models/productModel")
const Review = require("../models/reviewModel")

const {perPage} = require("../vars/publicVars")

const {passwordHash, tokenAssign, convertToArray, historyProducts} = require("../vars/functions");
const registerValidator = require("../validators/registerValidator")
const authValidator = require("../validators/authValidator")
const authorizationValidator = require("../validators/loginValidator")
const Chat = require("../models/chatModel");

userRouter.get("/profile", authValidator, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password -refreshToken").lean()
        if (!user) return res.status(401).json({error: "Unauthorized"})
        return res.status(200).json({user: user, accessToken: req.token})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

userRouter.get('/history', authValidator, async (req, res) => {
    const page = parseInt(req.query.page) || 1
    try {
        const user = await User
            .findById(req.userId)
            .select("phone")
            .lean()

        if (!user) return res.status(401).json({error: "Unauthorized"})

        const orders = await Order
            .find({phone: user.phone, deleted: false})
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean()

        const totalOrders = await Order.countDocuments({phone: user.phone, deleted: false})

        if (!orders.length) return res.status(404).json({error: "Ви ще не робили замовлення"})

        await historyProducts(orders, 'article name price image')

        return res.status(200).json({
            orders: orders, currentPage: page, totalPages: Math.ceil(totalOrders / perPage)
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

userRouter.get("/favorite", authValidator, async (req, res) => {
    const page = parseInt(req.query.page) || 1
    try {
        const user = await User
            .findById(req.userId)
            .select("favorite")
            .lean()

        if (!user) return res.status(401).json({error: "Unauthorized"})
        const favorite = await Product
            .find({_id: {$in: user.favorite}})
            .select("-history")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean()

        const totalFavorite = await Product.countDocuments({_id: {$in: user.favorite}})
        if (!favorite.length) return res.status(404).json({message: "У вас нема збережень"})

        return res.status(200).json({
            favorite: favorite, currentPage: page, totalPages: Math.ceil(totalFavorite / perPage)
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

userRouter.get("/chat", authValidator, async (req, res) => {
    try {
        const user = await User
            .findById(req.userId)
            .select()
            .lean()

        console.log(user)
        if (!user?.chat) return res.status(404).json({error: "Нема чату"})
        const chat = await Chat.findById(user.chat).lean()

        return res.status(200).json({chat: chat})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//POST
userRouter.post("/register", registerValidator, async (req, res) => {
    const {email, password, fullname, phone} = req.body
    try {
        if (!email || !password || !fullname || !phone)
            return res.status(400).json({error: "Заповніть потрібні поля"})

        if (await User.findOne({phone: phone}))
            return res.status(400).json({error: "Номер зайнято"})

        const orders = await Order
            .find({phone: phone})
            .select("_id")
            .lean()

        const ordersIds = orders.map(order => order._id)

        const user = new User({
            email: email,
            password: await passwordHash(password),
            fullname: fullname,
            phone: phone,
            history: ordersIds
        })

        const {JWT, RT} = tokenAssign(user._id)

        user.refreshToken = RT
        res.setHeader('refreshToken', RT)

        await user.save()

        const userObj = {
            email: user.email,
            fullname: user.fullname,
            phone: user.phone,
            city: user.city,
            address: user.address,
            history: user.history,
            favorite: user.favorite
        }

        return res.status(201).json({
            message: "Ви успішно зареєструвались",
            user: userObj,
            accessToken: JWT
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

userRouter.post("/authorization", authorizationValidator, async (req, res) => {
    try {
        const user = req.user

        const {JWT, RT: NRT} = tokenAssign(user._id)

        user.refreshToken = NRT
        res.setHeader('refreshToken', NRT)

        await user.save()

        const userObj = {
            email: user.email,
            fullname: user.fullname,
            phone: user.phone,
            city: user.city,
            address: user.address,
            history: user.history,
            favorite: user.favorite
        }

        return res.status(200).json({
            message: "Ви успішно авторизувались",
            user: userObj,
            accessToken: JWT,
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

userRouter.post("/favorite", authValidator, async (req, res) => {
    const {goods} = req.body
    try {
        if (!goods.length) return res.status(404).json({error: "Потрібно вказати продукти"})

        const products = await Product
            .find({_id: {$in: goods}})
            .select("_id")
            .lean()

        if (!products.length) return res.status(404).json({error: "Нема продуктів"})

        await User.updateOne(
            {_id: req.userId},
            {$push: {favorite: {$each: goods}}}
        )
        return res.status(201).json({message: "Успішно збережено"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

userRouter.post("/review", authValidator, async (req, res) => {
    const {text} = req.body
    const {id} = req.query
    try {
        const review = new Review({
            reviewSender: req.userId,
            product: id,
            content: {text: text}
        })

        const updated = await Product.updateOne(
            {_id: id},
            {$push: {reviews: review._id}}
        )

        if (updated.modifiedCount === 0)
            return res.status(400).json({error: "Відгук не вдалось залишити"})

        await review.save()
        return res.status(201).json({
            message: "Ви успішно залишили відгук", review: review
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//PUT
userRouter.put('/profile', authValidator, async (req, res) => {
    const {phone, city, address} = req.body
    try {
        const user = await User
            .findById(req.userId)
            .select("-password")

        const {JWT, RT} = tokenAssign(user._id)

        user.refreshToken = RT
        res.setHeader('refreshToken', RT)

        if (phone) user.phone = phone
        if (city) user.city = city
        if (address) user.address = address

        await user.save()

        return res.status(200).json({
            message: 'Ви успішно змінили профіль',
            user: user.toObject(),
            accessToken: JWT
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//DELETE
userRouter.delete("/favorite", authValidator, async (req, res) => {
    const {id} = req.query
    try {
        const ids = await convertToArray(id)
        await User.updateOne(
            {_id: req.userId},
            {$pull: {favorite: {$in: ids}}}
        )
        return res.status(201).json({message: "Виделано з збереженого"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

userRouter.delete("/orders", authValidator, async (req, res) => {
    const {id} = req.query
    try {
        const user = await User
            .findById(req.userId)
            .select("phone")
            .lean()

        if (!id) {
            await Order.updateMany({phone: user.phone}, {$set: {deleted: true}})
            await User.updateOne({_id: user._id}, {$set: {history: []}})
        } else {
            const ids = await convertToArray(id)
            await Order.updateMany({id: {$in: ids}, phone: user.phone}, {$set: {deleted: true}})
            await User.updateOne({_id: user._id}, {$pull: {history: {$in: ids}}})
        }
        return res.status(201).json({message: "Замовлення видалено"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})
module.exports = userRouter