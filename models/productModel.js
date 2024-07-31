const mongoose = require("mongoose")
const productSchema = new mongoose.Schema({
    photo: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    price: {
        type: Number,
        required: true
    },
    article: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    reviews: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Review"
    },
    promotion: {
        type: Boolean,
        default: false
    },
    // promotion: {
    //     type: {
    //         isActive: {
    //             type: Boolean,
    //             default: false
    //         },
    //         newPrice: Number,
    //     }
    // },
    quantity: {
        type: Number,
        default: 0
    },
    history: {
        type: [{
            column: String,
            oldValue: mongoose.Schema.Types.Mixed,
            newValue: mongoose.Schema.Types.Mixed,
            editedAt: {type: Date, default: Date.now()}
        }],
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

const Product = mongoose.model("Product", productSchema)

module.exports = Product