const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const mongoose = require("mongoose")

const {secretJWT, secretRT} = require("./privateVars")
const Review = require("../models/reviewModel");
// const User = require("../models/userModel")
const Product = require("../models/productModel")


//PRODUCTS
const productReviews = async (products) => {
    return await Promise.all(products.map(async product => {
        if (product.reviews && product.reviews.length > 0) {
            product.reviews = await Review.find({_id: {$in: product.reviews}}).select("-product")
        }
        return product
    }))
}

//USERS
const passwordHash = async (password) => {
    return await bcrypt.hash(password, 10)
}

const passwordCompare = async (password, bodyPassword) => {
    return await bcrypt.compare(bodyPassword, password)
}

const validateEmail = (email) => {
    const emailRegex = /^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i
    return emailRegex.test(email)
}

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/
    return passwordRegex.test(password)
}

const validateFullname = (fullname) => {
    const fullnameRegex = /^[А-ЯІЇЄҐ][а-яіїєґ]+\s[А-ЯІЇЄҐ][а-яіїєґ]+\s[А-ЯІЇЄҐ][а-яіїєґ]+$/
    return fullnameRegex.test(fullname)
}

const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phone)
}

//TOKEN
const tokenAssign = (data) => {
    if (data instanceof mongoose.Document) {
        data = data.toObject()
    }
    const {password, refreshToken, exp,...payload} = data
    const JWT = jwt.sign(payload, secretJWT, {expiresIn: '30s'})
    const RT = jwt.sign({_id: payload._id}, secretRT, {expiresIn: '1h'})
    return {JWT, RT}
}

const validateToken = async (token, secret) => {
    try {
        const secretKey = secret ? secretJWT : secretRT
        return await jwt.verify(token, secretKey)
    } catch (e) {
        return null
    }
}

//ORDERS
const generateOrderNumber = () => {
    return 'ORDER-' + Date.now()
}

const orderProducts = async (order) => {
    return await Promise.all(order.localStorage.map(async item => {
        const product = await Product.findById(item.goodsId)
        return {product: product, quantity: item.quantity}
    }))
}

module.exports = {
    //PRODUCTS
    productReviews,
    //USERS
    passwordHash,
    passwordCompare,
    validateEmail,
    validatePassword,
    validateFullname,
    validatePhone,
    //TOKEN
    tokenAssign,
    validateToken,
    //ORDERS
    generateOrderNumber,
    orderProducts
}