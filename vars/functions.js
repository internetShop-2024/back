const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const mongoose = require("mongoose")
const {Parser} = require("json2csv")

const {secretJWT, secretRT, secretAT} = require("./privateVars")

const Review = require("../models/reviewModel")
const Product = require("../models/productModel")
const SubSection = require("../models/subSectionModel")
const User = require("../models/userModel")
const Order = require("../models/orderModel")
const Section = require("../models/sectionModel")
const Pack = require("../models/packModel")

//ADMIN
const chooseSection = async (sectionId, subSectionId) => {
    return (sectionId !== undefined && subSectionId !== undefined)
        ? (() => {
            throw new Error('Both sectionId and subSectionId are defined');
        })()
        : (sectionId !== undefined ? sectionId : subSectionId);
}

const convertToArray = async (data) => {
    return data.split(',')
}

const convertToBool = async (value) => {
    return value === "1" ? true : value === '0' ? false : value
}

const filterSystem = async (data) => {
    let payload = {}
    let sortOptions = {}
    for (const item of Object.keys(data)) {
        if (['orderBy', 'page', 'sortBy'].includes(item)) continue
        if (['sectionId', 'subSectionId'].includes(item)) {
            payload['section'] = data[item]
        } else if (['createdAt'].includes(item)) {
            const items = await convertToArray(data[item])
            payload[item] = {}
            if (items.length > 1) {
                const from = new Date(items[0])
                const to = new Date(items[1])
                to.setDate(to.getDate() + 1)

                payload.createdAt.$gte = from
                payload.createdAt.$lt = to
            } else {
                const date = new Date(data.createdAt)
                const nextDay = new Date(date)
                nextDay.setDate(date.getDate() + 1)

                payload.createdAt.$gte = date
                payload.createdAt.$lt = nextDay
            }
        } else if (['article', 'price', 'quantity', 'rate'].includes(item)) {
            const items = await convertToArray(data[item])
            if (items.length > 1) {
                payload[item] = {
                    $gte: parseFloat(items[0]),
                    $lte: parseFloat(items[1])
                }
            } else {
                payload[item] = parseFloat(data[item])
            }
        } else if (['display', 'payment'].includes(item)) {
            payload[item] = await convertToBool(data[item])
        } else if (['name', 'fullname', 'customerComment', "managerComment"].includes(item)) {
            payload[item] = {$regex: data[item], $options: 'i'}
        } else if (['promotion'].includes(item)) {
            payload = {...payload, 'promotion.isActive': await convertToBool(data[item])}
        } else {
            const items = await convertToArray(data[item])
            if (items.length > 1) {
                payload[item] = {
                    $gte: items[0],
                    $lte: items[1]
                }
            } else {
                payload[item] = data[item]
            }
        }
    }
    if (data.orderBy && data.sortBy) {
        const orderData = await convertToArray(data.orderBy)
        const sortData = await convertToArray(data.sortBy)
        if (sortData.length !== orderData.length) {
            throw new Error("Sort fields and orders mismatch")
        }
        sortData.forEach((field, index) => {
            sortOptions[field] = parseInt(orderData[index]) || 1
        })
    }
    return {payload: payload, sortOptions: sortOptions}
}

const export2csvSystem = async (id, collection) => {
    let data
    let config = {}
    const parser = new Parser()
    if (id && id.length) {
        id = await convertToArray(id)
        config._id = {$in: id}
    }
    switch (collection) {
        case 'products':
            data = await Product.find(config).select("-__v").lean()
            await productReviews(data)
            break
        case 'orders':
            data = await Order.find(config).select("-__v").lean()
            break
        case 'users':
            data = await User.find(config).select("-__v -password -refreshToken").lean()
            break
        default:
            throw new Error("Can't find anything")
    }
    if (!data.length) throw new Error("Pls select objects correctly ")
    return parser.parse(data)
}

//PRODUCTS
const productReviews = async (products) => {
    return await Promise.all(products.map(async product => {
        if (product.reviews && product.reviews.length > 0) {
            const reviews = await Review.find({_id: {$in: product.reviews}}).select("-product").lean();
            product.reviews = await Promise.all(reviews.map(async (review) => {
                const user = await User.findOne({_id: review.reviewSenderId}).select('fullname').lean();
                return {
                    ...review,
                    fullname: user.fullname
                };
            }));
        }
        return product;
    }));
}

const productCategory = async (products) => {
    return await Promise.all(products.map(async (product) => {
        let category = await Section.findById(product.section).select('name photo').lean()
        if (!category) {
            category = await SubSection.findById(product.section).select('name').lean()
        }
        product.section = category
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
const tokenAssign = (data, generateRT = true) => {
    const JWT = jwt.sign({id: data}, secretJWT, {expiresIn: '24d'});
    let RT;
    if (generateRT) {
        RT = jwt.sign({id: data}, secretRT, {expiresIn: '7d'});
    }
    return generateRT ? {JWT, RT} : {JWT};
};

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

const quantityProducts = async (data) => {
    let ids = []
    let quantities = []
    data.forEach(item => {
        ids.push(item.goodsId)
        quantities.push(item.quantity)
    })

    for (let i = 0; i < ids.length; i++) {
        const product = await Product.findById(ids[i])
        if (!product) throw new Error("No Product Found")
        if (product.quantity < quantities[i]) throw new Error(`Not enough quantity for '${product.name}'`)
    }

    return ids.map((id, index) => ({
        updateOne: {
            filter: {_id: id},
            update: {$inc: {quantity: -quantities[index], rate: +quantities[index]}},
        }
    }))
}

//SECTIONS
const sectionProducts = async (section) => {
    const products = await Product.find({section: {$in: section._id}}).lean()
    section.products = await productReviews(products)
    return section
}

const sectionSubSections = async (section) => {
    const subSections = await SubSection.find({section: {$in: section._id}}).lean()

    await Promise.all(subSections.map(async subSection => {
        if (subSection.products.length > 0) {
            const products = await Product.find({section: {$in: subSection._id}}).lean()
            subSection.products = await productReviews(products)
        }
    }))
    section.subSections = subSections
    return section
}

const sectionPacks = async (section) => {
    const packs = await Pack.find({_id: {$in: section.packs}}).select("-__v").lean()
    if (!packs) throw new Error("Packs not found")
    section.packs = packs
    return section
}

module.exports = {
    //ADMINS
    convertToArray, filterSystem, export2csvSystem, chooseSection,
    //PRODUCTS
    productReviews, productCategory,
    //USERS
    passwordHash, passwordCompare, validateEmail, validatePassword, validateFullname, validatePhone,
    //TOKEN
    tokenAssign, validateToken, adminTokenAssign,
    //ORDERS
    generateOrderNumber, orderProducts, quantityProducts,
    //SECTIONS
    sectionProducts, sectionSubSections,
    //PACKS
    sectionPacks,
}