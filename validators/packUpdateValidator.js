const Pack = require("../models/packModel");
const {chooseSection} = require("../vars/functions")

const packUpdateValidator = async (req, res, next) => {
    const {id} = req.query
    const {photo, article, packName, price, sectionId, subSectionId, products, video, description} = req.body
    try {
        const pack = await Pack.findById(id)
        if (!pack) return res.status(404).json({error: "Pack not found"})

        const updatedFields = {}

        if (photo && photo !== pack.photo) updatedFields.photo = photo;
        if (article && article !== pack.article) updatedFields.article = article
        if (packName && packName !== pack.packName) updatedFields.packName = packName
        if (price && price !== pack.price) updatedFields.price = price
        if (sectionId && sectionId !== pack.section) updatedFields.section = await chooseSection(sectionId, subSectionId)
        if (products?.length) updatedFields.products = products
        if (video && video !== pack.video) updatedFields.video = video
        if (description && description !== pack.description) updatedFields.video = video
        if (quantity && quantity !== pack.quantity) updatedFields.quantity = quantityтз

        if (Object.keys(updatedFields).length === 0) return res.status(400).json({error: "Нічо не помінялось"})

        req.updatedFields = updatedFields
        req.pack = pack
        next()
    } catch (e) {
        return res.status(400).json({error: e.message})
    }
}

module.exports = packUpdateValidator;
