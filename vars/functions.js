const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const mongoose = require("mongoose")

const {secretJWT, secretRT, secretAT} = require("./privateVars")
const Review = require("../models/reviewModel");
const Product = require("../models/productModel")
const SubSection = require("../models/subSectionModel");

const convertToArray = async (id) => {
    let ids = id
    if (typeof id === 'string') {
        ids = [id]
    }
    return ids
}

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
    const {password, refreshToken, exp, ...payload} = data
    const JWT = jwt.sign(payload, secretJWT, {expiresIn: '30s'})
    const RT = jwt.sign({_id: payload._id}, secretRT, {expiresIn: '1h'})
    return {JWT, RT}
}

const adminTokenAssign = (data) => {
    if (data instanceof mongoose.Document) {
        data = data.toObject()
    }
    const {password, createdAt, ...payload} = data
    return jwt.sign(payload, secretAT, {expiresIn: "24h"})
}

const validateToken = async (token, secret) => {
    try {
        const SecretEnum = {
            JWT: 'JWT', RT: 'RT', AT: 'AT',
        }
        switch (secret) {
            case SecretEnum.JWT:
                return await jwt.verify(token, secretJWT)
            case SecretEnum.RT:
                return await jwt.verify(token, secretRT)
            case SecretEnum.AT:
                return await jwt.verify(token, secretAT)
            default:
                return new Error('Invalid secret type')
        }
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
        let product = await Product.findById(item.goodsId)
        if (!product) product = "The product has been removed"
        return {product: product, quantity: item.quantity}
    }))
}

//SECTIONS
const sectionProducts = async (section) => {
    const products = await Product.find({_id: {$in: section.products}}).lean()
    section.products = await productReviews(products)
    return section
}

const sectionSubSections = async (section) => {
    const subSections = await SubSection.find({_id: {$in: section.subSections}}).lean()

    await Promise.all(subSections.map(async subSection => {
        if (subSection.products.length > 0) {
            const products = await Product.find({_id: {$in: subSection.products}}).lean()
            subSection.products = await productReviews(products)
        }
    }))
    section.subSections = subSections
    return section
}

module.exports = {
    convertToArray,
    //PRODUCTS
    productReviews,
    //USERS
    passwordHash, passwordCompare, validateEmail, validatePassword, validateFullname, validatePhone,
    //TOKEN
    tokenAssign, validateToken, adminTokenAssign,
    //ORDERS
    generateOrderNumber, orderProducts,
    //SECTIONS
    sectionProducts, sectionSubSections
}