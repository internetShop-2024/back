const Order = require("../models/orderModel");

const {validateFullname, validatePhone} = require("../vars/functions")

const orderUpdateValidator = async (req, res, next) => {
    try {
        const {id} = req.query
        const {fullname, phone, deliveryType, city, address, managerComment, status} = req.body

        const order = await Order.findById(id)
        if (!order) return res.status(404).json({error: "Order not found"})

        const updatedFields = {}
        if (fullname && fullname !== order.fullname) {
            if (!validateFullname(req.body.fullname)) return res.status(400).json({error: 'Invalid fullname'})
            updatedFields.fullname = fullname
        }
        if (phone && phone !== order.phone) {
            if (!validatePhone(req.body.phone)) return res.status(400).json({error: 'Invalid phone number'})
            updatedFields.phone = phone
        }
        if (deliveryType && deliveryType !== order.deliveryType) {
            updatedFields.deliveryType = deliveryType
        }
        if (city && city !== order.city) {
            updatedFields.city = city
        }
        if (address && address !== order.address) {
            updatedFields.address = address
        }
        if (managerComment && managerComment !== order.managerComment) {
            updatedFields.managerComment = managerComment
        }
        if (status && status !== order.status) {
            updatedFields.status = status
        }

        if (Object.keys(updatedFields).length === 0) {
            return res.status(400).json({error: "No changes detected"})
        }

        req.updatedFields = updatedFields
        req.order = order
        next()
    } catch (e) {
        return res.status(400).json({error: e.message})
    }
}

module.exports = orderUpdateValidator