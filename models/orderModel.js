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
    invoiceId: String,
    payment: {
        type: Boolean,
        default: false
    },
    customerComment: String,
    managerComment: String,
    status: {
        type: String,
        enum: ["wait", "inProcess", "sent", "delivered", 'cancelled'],
        default: "wait"
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