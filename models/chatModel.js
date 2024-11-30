const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
        chatName: {
            type: String,
            required: true,
            unique: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            unique: true
        },
        messages: [{
            text: String,
            image: {
                type: [mongoose.Schema.Types.ObjectId],
                ref: 'Image',
            },
            sender: mongoose.Schema.Types.ObjectId,
            sendAt: Date
        }],
        createdAt: {
            type: Date,
            default: Date.now()
        }
    }, {
        versionKey: false
    }
)

chatSchema.path("messages").schema.set("_id", false)

const Chat = mongoose.model("Chat", chatSchema)

module.exports = Chat