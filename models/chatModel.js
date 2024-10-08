const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
        chatName: {
            type: String,
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        messages: [{
            text: String,
            image: [{
                imageName: String,
                imageUrl: String,
            }],
            sender: mongoose.Schema.Types.ObjectId,
            sendAt: Date
        }],
        createdAt: {
            type: Date,
            default: Date.now(),
            expires: 10
        }
    }, {
        versionKey: false
    }
)

chatSchema.path("messages").schema.set("_id", false)
chatSchema.path("messages.image").schema.set("_id", false)

const Chat = mongoose.model("Chat", chatSchema)

module.exports = Chat