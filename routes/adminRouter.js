const adminRouter = require("express").Router()

const Admin = require("../models/adminModel")
const User = require("../models/userModel")
const Order = require("../models/orderModel")

const adminValidator = require("../validators/adminValidator")
const {passwordHash, adminTokenAssign, passwordCompare} = require("../vars/functions");

adminRouter.get("/users", adminValidator, async (req, res) => {
    try {
        const {id, orderId} = req.query
        if (id && !orderId) {
            const user = await User.findById(id).select('_id createdAt fullName phone email city history')
            if (!user)
                return res.status(404).json({error: "User not found"})
            return res.status(200).json({user: user})
        } else if (id && orderId) {
            const phone = await User.findById(id).select('phone').lean()
            const order = await Order.find({_id: orderId, phone: phone.phone})
            return res.status(200).json({order: order})
        } else {
            const users = await User.find().select('_id createdAt fullName phone email city history')
            return res.status(200).json({users: users})
        }
    } catch
        (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.post("/create", async (req, res) => {
    const {username, password} = req.body
    try {
        if (!username || !password)
            return res.status(400).json({error: "Fill all inputs"})

        const admin = await Admin.findOne({username: username})

        if (admin)
            return res.status(400).json({error: "Already exist"})

        const newAdmin = new Admin({
            username: username,
            password: await passwordHash(password)
        })

        const AT = adminTokenAssign(newAdmin)

        await newAdmin.save()

        res.cookie("accessToken", AT, {
            httpOnly: true,
            secure: true
        })
        return res.status(201).json({message: "Successfully created"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.post("/login", async (req, res) => {
    const {username, password} = req.body
    try {
        if (!username || !password)
            return res.status(400).json({error: "Fill all inputs"})

        const admin = await Admin.findOne({username: username})

        if (!admin)
            return res.status(400).json({error: "Invalid Username or Password"})

        if (!await passwordCompare(admin.password, password))
            return res.status(400).json({error: "Invalid Username or Password"})

        const AT = adminTokenAssign(admin)

        res.cookie("accessToken", AT, {
            httpOnly: true,
            secure: true
        })
        return res.status(201).json({message: "Successfully"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

module.exports = adminRouter