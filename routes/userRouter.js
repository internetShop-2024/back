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
        const {password, refreshToken, ...payload} = req.user
        return res.status(200).json({user: payload, accessToken: req.token})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

userRouter.get('/history', authValidator, async (req, res) => {
    const user = req.user
    try {
        const orders = await Order.find({phone: user.phone, deleted: false}).lean()
        if (!orders.length)
            return res.status(404).json({error: "No orders found for this user"})

        return res.status(200).json({orders: orders})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

userRouter.get("/favorite", authValidator, async (req, res) => {
    try {
        const user = req.user
        const favorite = await Product.find({_id: {$in: user.favorite}}).lean()
        if (!favorite.length) {
            return res.status(404).json({message: "No favorite found"})
        }
        return res.status(200).json({favorite: favorite})
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

        const {JWT, RT} = tokenAssign(user)

        user.refreshToken = RT
        res.header('refreshToken', RT)

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

        const {JWT, RT: NRT} = tokenAssign(user)

        user.refreshToken = NRT
        res.header('refreshToken', NRT)

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
        if (goods.length > 0) {
            await User.updateOne(
                {_id: req.user._id},
                {$push: {favorite: {$each: goods}}}
            )
            return res.status(201).json({message: "Successfully added"})
        } else {
            return res.status(404).json({error: "Goods not found"})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

userRouter.post("/review", authValidator, async (req, res) => {
    const {text} = req.body
    const {id} = req.query
    try {
        const review = new Review({
            reviewSenderId: req.user._id,
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
    const userId = req.user._id
    try {
        const user = await User.findById(userId)
            .select("-__v -password")
            .lean()
        const {JWT, RT} = tokenAssign(user)
        user.refreshToken = RT
        res.header('refreshToken', RT)

        if (phone) user.phone = phone
        if (city) user.city = city
        if (address) user.address = address

        await user.save()

        return res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser,
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
            {_id: req.user._id},
            {$pull: {favorite: {$in: ids}}}
        )
        return res.status(201).json({message: "Deleted from favorite"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

userRouter.delete("/orders", authValidator, async (req, res) => {
    const user = req.user
    const id = req.params.id
    if (!id) {
        await Order.updateMany({phone: user.phone}, {$set: {deleted: true}})
        return res.status(201).json({message: "All Orders deleted"})
    } else {
        const ids = await convertToArray(id)
        await Order.updateMany({id: {$in: ids}, phone: user.phone}, {$set: {deleted: true}})
    }
})
module.exports = userRouter