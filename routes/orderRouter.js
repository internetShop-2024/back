const orderRouter = require('express').Router()
const User = require("../models/userModel")
const Order = require("../models/orderModel")
const orderValidator = require("../validators/orderValidator")
const {generateOrderNumber, orderProducts, convertToArray} = require("../vars/functions")
const adminValidator = require("../validators/adminValidator");

//GET
orderRouter.get('/', adminValidator, async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            const orders = await Order.find()
            return res.status(200).json({orders: orders})
        } else {
            const order = await Order.findById(id).lean()
            if (!order)
                return res.status(404).json({error: 'Order not found'})

            order.localStorage = await orderProducts(order)

            return res.status(200).json({order: order})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

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
        paymentType,
        payment,
        customerComment,
        managerComment,
        agreement
    } = req.body

    try {
        const orderNumber = generateOrderNumber()
        const paymentIdentifier = paymentType === 'acquiring'

        const order = new Order({
            orderNumber: orderNumber,
            localStorage: localStorage,
            cost: cost,
            fullname: fullname,
            phone: phone,
            deliveryType: deliveryType,
            city: city,
            address: address,
            paymentType: paymentType,
            payment: paymentIdentifier,
            customerComment: customerComment,
            managerComment: managerComment,
            agreement: agreement
        })

        await order.save()

        await User.updateOne(
            {phone: phone},
            {$push: {history: order._id}}
        )

        return res.status(201).json({
            message: "Order Successfully created",
            order: order
        })

    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

orderRouter.delete("/", adminValidator, async (req, res) => {
    const {id} = req.body
    try {
        if (!id) {
            await Order.deleteMany()
            await User.updateMany({}, {$pull: {history: {$in: []}}})
            return res.status(201).json({message: "All orders deleted"})
        } else {
            const ids = await convertToArray(id)
            await Order.deleteMany({_id: {$in: ids}})
            await User.updateMany({}, {$pull: {history: {$in: ids}}})
            return res.status(201).json({message: "Order deleted"})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

module.exports = orderRouter