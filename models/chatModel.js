const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        admins: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'Admin',
            required: true,
        },
        messages: [{
            text: String,
            image: {
                imageName: String,
                imageUrl: String,
            },
            sender: mongoose.Schema.Types.ObjectId,
            sendAt: Date
        }],
        createdAt: {
            type: Date,
            default: Date.now(),
        }
    }, {
        versionKey: false
    }
)

chatSchema.path("messages").schema.set("_id", false)

const Chat = mongoose.model("Chat", chatSchema)

module.exports = Chat