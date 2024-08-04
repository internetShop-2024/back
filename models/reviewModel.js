const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema({
    reviewSenderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true
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
            type: {
                replySenderId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Admin",
                },
                replyText: String
            }
        }
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

const Review = mongoose.model("Review", reviewSchema)

module.exports = Review