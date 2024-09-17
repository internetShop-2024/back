const orderRouter = require('express').Router()

const User = require("../models/userModel")
const Order = require("../models/orderModel")
const Product = require("../models/productModel")

const {generateOrderNumber, createInvoice, quantityProducts} = require("../vars/functions")

const orderValidator = require("../validators/orderValidator")
const monobankValidator = require("../validators/monobankValidator")

const {monoXSIGN, mongoUri, monoURL, monoWEBHOOK} = require("../vars/privateVars")
const axios = require("axios");

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
        managerComment
    } = req.body

    try {
        const bulkOps = await quantityProducts(localStorage)
        const {invoiceId, pageUrl} = await createInvoice(cost)
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

        await Product.bulkWrite(bulkOps)

        return res.status(201).json({
            message: "Order Successfully created",
            order: order,
            pageUrl: pageUrl
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

orderRouter.post("/pay-status", monobankValidator, async (req, res) => {
    const {invoiceId} = req.body;
    try {
        await axios.get(
            `${monoURL}/invoice/status`,
            {
                headers: {
                    "X-Token": monoXSIGN
                },
                params: {invoiceId}
            }
        ).then(async response => {
            if (response.data.status === "expired") {
                await Order.updateOne({invoiceId: invoiceId}, {status: "cancelled"})
                return res.status(200).header("X-Sign", monoXSIGN).json({message: "Updated"})
            } else if (response.data.status === "success") {
                await Order.updateOne({invoiceId: invoiceId}, {
                    payment: true,
                    status: "inProcess"
                })
                return res.status(200).header("X-Sign", monoXSIGN).json({message: "Updated"})
            }
        }).catch(e => {
            throw new Error(e)
        })
        return res.status(400)
    } catch (e) {
        return res.status(500)
    }
})


module.exports = orderRouter