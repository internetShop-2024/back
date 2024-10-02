const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
        email: {
            type: String,
            unique: true,
            required: true
        },
        password: {
            type: String,
            required: true,
        },
        fullname: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            unique: true,
            required: true,
        },
        deliveryType: {
            type: String,
            enum: ["NP", "UKRP"],
        },
        city: {
            type: String,
        },
        address: {
            type: String,
        },
        history: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Order"
        },
        favorite: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Product"
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        refreshToken: String,
        deleted: {
            type: Boolean,
            default: false
        }
    },
    {
        versionKey: false
    }
)

const User = mongoose.model("User", userSchema)

module.exports = User