const orderRouter = require('express').Router()
const User = require("../models/userModel")
const Order = require("../models/orderModel")
const orderValidator = require("../validators/orderValidator")
const {generateOrderNumber, orderProducts, convertToArray, filterSystem} = require("../vars/functions")
const adminValidator = require("../validators/adminValidator");
const Product = require("../models/productModel");
const {monoXSIGN} = require("../vars/privateVars");

//GET
orderRouter.get('/', async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            const data = await filterSystem(req.query)
            const orders = await Order.find(data.payload).sort(data.sortOptions).lean()
            if (!orders.length)
                return res.status(404).json({message: "Not Found"})

            return res.status(200).json({orders: orders})
        } else {
            const order = await Order.findById(id).lean()
            if (!order)
                return res.status(404).json({error: 'Order not found'})

            await orderProducts(order)

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
        customerComment,
        managerComment,
        invoiceId
    } = req.body

    let ids = []
    let quantities = []

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

        await order.save()

        await User.updateOne(
            {phone: phone},
            {$push: {history: order._id}}
        )

        localStorage.forEach(item => {
            ids.push(item.goodsId)
            quantities.push(item.quantity)
        })

        for (let i = 0; i < ids.length; i++) {
            const product = await Product.findById(ids[i])
            if (!product) return res.status(404).json({error: "Product not found"})
            if (product.quantity < quantities[i]) return res.status(400).json({error: `Not enough quantity for '${product.name}'`})
        }

        const bulkOps = ids.map((id, index) => ({
            updateOne: {
                filter: {_id: id},
                update: {$inc: {quantity: -quantities[index], rate: +quantities[index]}},
            }
        }))

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