const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema({
        reviewSenderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        content: {
            text: {
                type: String,
                required: true,
            },
            reply: {
                replySenderId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Admin",
                },
                replyText: String,
                repliedAt: Date
            }
        },
        createdAt: {
            type: Date,
            default: Date.now()
        }
    },
    {
        versionKey: false
    }
)

const Review = mongoose.model("Review", reviewSchema)

module.exports = Review