const adminRouter = require("express").Router()

const Admin = require("../models/adminModel")
const User = require("../models/userModel")
const Order = require("../models/orderModel")
const Review = require("../models/reviewModel")

const adminValidator = require("../validators/adminValidator")
const {
    passwordHash,
    adminTokenAssign,
    passwordCompare,
    convertToArray,
    filterSystem,
    export2csvSystem, validatePhone
} = require("../vars/functions")

//GET
adminRouter.get("/users", adminValidator, async (req, res) => {
        let {id, orderId} = req.query
        try {
            let users
            if (id && !orderId) {
                const user = await User.find({_id: id}).select('_id createdAt fullName phone email city history')
                if (!user)
                    return res.status(404).json({error: "User not found"})
                return res.status(200).json({user: user})
            } else if (id && orderId) {
                const user = await User.findById(id).select('phone').lean()
                const order = await Order.find({_id: orderId, phone: user.phone})
                return res.status(200).json({order: order})
            } else {
                const data = await filterSystem(req.query)
                const payload = data.payload
                users = await User.find(payload).select("-password -refreshToken -__v").sort(data.sortOptions)
                if (!users.length)
                    return res.status(404).json({message: "Not Found"})
                return res.status(200).json(users)
            }
        } catch (e) {
            return res.status(500).json({error: e.message})
        }
    }
)

adminRouter.get("/reviews", adminValidator, async (req, res) => {
    const id = req.query.id
    try {
        if (!id) {
            const reviews = await Review.find().lean()
            return res.status(200).json({reviews: reviews})
        } else {
            const review = await Review.findById(id).lean()
            if (!review)
                return res.status(404).json({error: "Review not found"})

            return res.status(201).json({review: review})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.get("/export", adminValidator, async (req, res) => {
    let {id, collection} = req.query
    try {
        if (!collection)
            return res.status(400).json({error: 'Collection name is required'})

        const csv = await export2csvSystem(id, collection)
        res.header('Content-Type', 'text/csv')
        res.attachment(`${collection}.csv`)
        return res.send(csv)
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//POST
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
            secure: false
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

//PUT
adminRouter.put("/review", adminValidator, async (req, res) => {
    const id = req.query.id
    const {replyText} = req.body
    try {
        if (!id) {
            return res.status(404).json({error: "Review not found"})
        } else if (!replyText) {
            return res.status(400).json({error: "Fill the inputs"})
        } else {
            const updated = await Review.updateOne(
                {_id: id},
                {
                    $set: {
                        'content.reply': {
                            replySenderId: req.adminId,
                            replyText: replyText,
                            repliedAt: Date.now()

                        }
                    }
                }
            )

            if (updated.modifiedCount < 1)
                return res.status(400).json({error: "Not Replied"})

            return res.status(201).json({message: "Answered"})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

adminRouter.put("/calls", async (req, res) => {
    const {phone, text} = req.body
    try {
        const validatedPhone = await validatePhone(phone)
        if (!validatedPhone)
            return res.status(400).json({error: "Send correct phone number"})

        const call = {
            phone: phone,
            text: text
        }

        await Admin.updateOne({}, {$push: {calls: call}})
        return res.status(201).json({message: "We will call you"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//DELETE
adminRouter.delete("/users", adminValidator, async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            await User.deleteMany()
            return res.status(201).json({message: "Deleted"})
        } else {
            const ids = await convertToArray(id)
            await User.deleteMany({_id: {$in: ids}})
            return res.status(201).json({message: "Deleted"})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

module.exports = adminRouter