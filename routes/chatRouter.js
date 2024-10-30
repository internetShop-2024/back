const chatRouter = require("express").Router()

const Chat = require("../models/chatModel")
const User = require("../models/userModel")
const Admin = require("../models/adminModel")
const Order = require("../models/orderModel")

const authValidator = require("../validators/authValidator")

const upload = require("../vars/multer")
const {uploadMultipleFiles, deleteMultipleFiles} = require("../vars/b2")
const {imageNames, validatePhone} = require("../vars/functions");

chatRouter.get("/expires", async (req, res) => {
    try {
        // const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const oneWeekAgo = new Date(Date.now() - 60 * 1000)
        const chats = await Chat.find({createdAt: {$lt: oneWeekAgo}}, "messages.image").lean()
        const allMessages = chats.map(chat => chat.messages).flat()
        const urls = await imageNames(allMessages)

        await Chat.deleteMany({createdAt: {$lt: oneWeekAgo}})
        await deleteMultipleFiles(urls)
        return res.status(200).json({message: "Successfully expired"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

chatRouter.get("/orders", async (req, res) => {
    const {phone} = req.query
    try {
        await validatePhone(phone)
        const orders = await Order
            .find({phone: phone, status: {$ne: "delivered"}})
            .lean()
        if (!orders) return res.status(404).json({error: "У вас ще нема замовлень"})
        return res.status(200).json({orders: orders})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

chatRouter.post("/payment", upload.single("payment"), async (req, res) => {
    const payment = req.file
    const {orderId} = req.query
    try {
        if (payment?.mimetype !== "application/pdf")
            return res.status(400).json({error: "Надішліть квитанцію в форматі pdf"})

        const order = await Order.findById(orderId)
        if (!order) return res.status(404).json({error: "Замовлення не знайдено"})
        const message = {
            sender: order._id,
            image: await uploadMultipleFiles([payment]),
            sendAt: Date.now()
        }
        const chat = new Chat({
            chatName: order.fullname + " | " + order.phone,
            messages: [message]
        })
        await chat.save()

        return res.status(201).json({message: "Квитанцію надіслано успішно"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

chatRouter.post("/", authValidator, upload.single("image"), async (req, res) => {
    const {text} = req.body
    const image = req.file
    const userId = req.userId
    try {
        let message = {}
        const user = await User.findById(userId, 'fullname phone').lean()
        if (!user) return res.status(404).json({error: "Нема такого користувача"})
        if (text || image) {
            message = {
                text: text,
                sender: userId,
                sendAt: Date.now(),
            }
            if (image) {
                message.image = await uploadMultipleFiles([image])
            }
        }

        const chat = new Chat({
            chatName: user.fullname + " | " + user.phone,
            user: user._id,
            messages: [message],
        })

        await chat.save()
        await Admin.updateMany({}, {$push: {chat: chat}})
        await User.updateOne({_id: userId}, {$set: {chat: chat}})
        return res.status(201).json({chat: chat})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})
module.exports = chatRouter