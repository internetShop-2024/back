const orderRouter = require('express').Router()
const User = require("../models/userModel")
const Order = require("../models/orderModel")
const Product = require("../models/productModel")

const {generateOrderNumber, convertToArray, quantityProducts} = require("../vars/functions")

const orderValidator = require("../validators/orderValidator")

const {monoXSIGN} = require("../vars/privateVars")

//POST
orderRouter.post("/order", orderValidator, async (req, res) => {
    const {
        localStorage,
        cost,
        fullname,
        phone,
        deliveryType,
        city,
        address,
        customerComment,
        managerComment,
        invoiceId
    } = req.body

    try {
        const orderNumber = generateOrderNumber()
        const order = new Order({
            orderNumber: orderNumber,
            localStorage: localStorage,
            cost: cost,
            fullname: fullname,
            phone: phone,
            deliveryType: deliveryType,
            city: city,
            address: address,
            customerComment: customerComment,
            managerComment: managerComment,
            invoiceId: invoiceId,
        })

        await User.updateOne(
            {phone: phone},
            {$push: {history: order._id}}
        )

        const bulkOps = await quantityProducts(localStorage)

        await order.save()
        await Product.bulkWrite(bulkOps)

        return res.status(201).json({
            message: "Order Successfully created",
            order: order
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

orderRouter.post("/pay-status", async (req, res) => {
    const {invoiceId, status} = req.body;
    try {
        if (status === "success") await Order.updateOne({invoiceId: invoiceId}, {payment: true, status: "inProcess"})
        return res.status(200).header("X-Sign", monoXSIGN)
    } catch (e) {
        return res.status(500)
    }
})


module.exports = orderRouter