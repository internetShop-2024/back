const chatRouter = require("express").Router()

const Chat = require("../models/chatModel")
const User = require("../models/userModel")
const Admin = require("../models/adminModel")

const authValidator = require("../validators/authValidator")

const upload = require("../vars/multer")
const {uploadMultipleFiles} = require("../vars/b2")

chatRouter.post("/", authValidator, upload.single("image"), async (req, res) => {
    const {text} = req.body
    const image = req.file
    const userId = req.userId
    try {
        let message = {}
        if (text || image) {
            message = {
                text: text,
                sender: userId,
                sendAt: Date.now(),
            }
            if (image) {
                const urls = await uploadMultipleFiles([image])
                message.image = urls[0]
            }
        }

        const admins = await Admin.find({}, "_id").lean()
        const chat = new Chat({
            user: userId,
            admins: admins,
            messages: [message],
        })

        await chat.save()
        await Admin.updateMany({_id: {$in: admins}}, {$push: {chat: chat}})
        await User.updateOne({_id: userId}, {$set: {chat: chat}})
        return res.status(201).json({chat: chat})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

module.exports = chatRouter