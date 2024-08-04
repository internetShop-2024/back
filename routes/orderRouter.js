const orderRouter = require('express').Router()
const User = require("../models/userModel")
const Order = require("../models/orderModel")
const orderValidator = require("../validators/orderValidator")
const {generateOrderNumber, orderProducts} = require("../vars/functions")

//GET
orderRouter.get('/order/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
        if (!order)
            return res.status(404).json({error: 'Order not found'})

        const orderWithProducts = await orderProducts(order)
        let orderObj = order.toObject()
        orderObj.localStorage = orderWithProducts

        return res.status(200).json({order: orderObj})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

orderRouter.get('/', async (req, res) => {
    try {
        const orders = await Order.find()
        return res.status(200).json(orders)
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


module.exports = orderRouter