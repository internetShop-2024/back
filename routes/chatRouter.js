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
            chatName: user.fullname + "/" + user.phone,
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