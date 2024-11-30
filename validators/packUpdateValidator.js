const Pack = require("../models/packModel");
const {chooseSection} = require("../vars/functions")

const packUpdateValidator = async (req, res, next) => {
    const {id} = req.query
    const {image, photo, article, packName, price, sectionId, subSectionId, products, video, description, quantity} = req.body
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
        if (description && description !== pack.description) updatedFields.description = description
        if (image && image !== pack.image) updatedFields.quantity = quantity
        if (image && image !== pack.image) updatedFields.image = image

        req.updatedFields = updatedFields
        req.pack = pack
        next()
    } catch (e) {
        return res.status(400).json({error: e.message})
    }
}

module.exports = packUpdateValidator;
