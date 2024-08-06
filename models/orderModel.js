const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true
    },
    localStorage: {
        type: [{
            goodsId: mongoose.Schema.Types.ObjectId,
            quantity: Number
        }],
        required: true
    },
    cost: {
        type: Number,
        required: true
    },
    fullname: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    deliveryType: {
        type: String,
        enum: ["NP", "UKRP"],
        required: true
    },
    city: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    paymentType: {
        type: String,
        enum: ["transfer", "acquiring"],
        required: true
    },
    payment: Boolean,
    customerComment: String,
    managerComment: String,
    agreement: Boolean,
    status: {
        type: String,
        enum: ["inProcess", "sent", "delivered", 'notDelivered'],
        default: "inProcess"
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    updatedAt: {
        type: Date,
        default: Date.now()
    },
})

orderSchema.path('localStorage').schema.set("_id", false)

const Order = mongoose.model("Order", orderSchema)

module.exports = Order