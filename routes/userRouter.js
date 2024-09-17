const userRouter = require("express").Router()

const User = require("../models/userModel")
const Order = require("../models/orderModel")
const Product = require("../models/productModel")
const Review = require("../models/reviewModel")

const {perPage} = require("../vars/publicVars")

const {passwordHash, tokenAssign, convertToArray} = require("../vars/functions");
const registerValidator = require("../validators/registerValidator")
const authValidator = require("../validators/authValidator")
const authorizationValidator = require("../validators/loginValidator")

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
        const user = await User.findById(req.userId).select("phone").lean()
        if (!user) return res.status(401).json({error: "Unauthorized"})
        const orders = await Order.find({phone: user.phone, deleted: false})
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean()
        const totalOrders = await Order.countDocuments({phone: user.phone, deleted: false})

        if (!orders.length) return res.status(404).json({error: "No orders found for this user"})

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
        const user = await User.findById(req.userId).select("favorite").lean()
        if (!user) return res.status(401).json({error: "Unauthorized"})
        const favorite = await Product.find({_id: {$in: user.favorite}})
            .select("-history")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean()

        const totalFavorite = await Product.countDocuments({_id: {$in: user.favorite}})
        if (!favorite.length) return res.status(404).json({message: "No favorite found"})

        return res.status(200).json({
            favorite: favorite, currentPage: page, totalPages: Math.ceil(totalFavorite / perPage)
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//POST
userRouter.post("/register", registerValidator, async (req, res) => {
    const {email, password, fullname, phone} = req.body
    try {
        if (!email || !password || !fullname || !phone)
            return res.status(400).json({error: "Fill all inputs"})

        if (await User.findOne({phone: phone}))
            return res.status(400).json({error: "Phone number already in use"})

        const orders = await Order.find({phone: phone}).select("_id").lean()
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
            message: "Successfully created",
            user: userObj,
            accessToken: JWT
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

userRouter.post("/authorization", authorizationValidator, async (req, res) => {
    const {email, password} = req.body
    try {
        if (!email || !password)
            return res.status(400).json({error: "Fill all inputs"})

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
            message: "Successfully authorized",
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
        if (!goods.length) return res.status(404).json({error: "No Products Found"})

        const products = await Product.find({_id: {$in: goods}}).select("_id").lean()
        if (!products.length) return res.status(404).json({error: "No Products Found"})

        await User.updateOne(
            {_id: req.userId},
            {$push: {favorite: {$each: goods}}}
        )
        return res.status(201).json({message: "Successfully added"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

userRouter.post("/review", authValidator, async (req, res) => {
    const {text} = req.body
    const {id} = req.query
    try {
        const review = new Review({
            reviewSenderId: req.userId,
            product: id,
            content: {text: text}
        })

        const updated = await Product.updateOne(
            {_id: id},
            {$push: {reviews: review._id}}
        )

        if (updated.modifiedCount === 0)
            return res.status(400).json({error: "Review not created"})

        await review.save()
        return res.status(201).json({
            message: "Successfully created", review: review
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//PUT
userRouter.put('/profile', authValidator, async (req, res) => {
    const {phone, city, address} = req.body
    try {
        const user = await User.findById(req.userId)
            .select("-password")
        const {JWT, RT} = tokenAssign(user._id)

        user.refreshToken = RT
        res.setHeader('refreshToken', RT)

        if (phone) user.phone = phone
        if (city) user.city = city
        if (address) user.address = address

        await user.save()

        return res.status(200).json({
            message: 'Profile updated successfully',
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
        return res.status(201).json({message: "Deleted from favorite"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

userRouter.delete("/orders", authValidator, async (req, res) => {
    const {id} = req.query
    try {
        const user = await User.findById(req.userId).select("phone").lean()
        if (!id) {
            await Order.updateMany({phone: user.phone}, {$set: {deleted: true}})
            await User.updateOne({_id: user._id}, {$set: {history: []}})
            return res.status(201).json({message: "All Orders deleted"})
        } else {
            const ids = await convertToArray(id)
            await Order.updateMany({id: {$in: ids}, phone: user.phone}, {$set: {deleted: true}})
            await User.updateOne({_id: user._id}, {$pull: {history: {$in: ids}}})
            return res.status(201).json({message: "Orders deleted"})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})
module.exports = userRouter