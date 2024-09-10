const sectionRouter = require("express").Router()
const ObjectId = require("mongoose").Types.ObjectId

const Section = require("../models/sectionModel")
const SubSection = require("../models/subSectionModel")
const Product = require("../models/productModel")

const adminValidator = require("../validators/adminValidator")
const {sectionProducts, convertToArray, sectionSubSections, productReviews} = require("../vars/functions");

sectionRouter.get("/", async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            const sections = await Section.find()
            return res.status(200).json({sections: sections})
        } else {
            const section = await Section.findById(id).lean()
            if (!section) return res.status(404).json({error: "Section not found"})

            if (section.products?.length > 0) {
                await sectionProducts(section)
            }

            if (section.subSections?.length > 0) {
                await sectionSubSections(section)
            }
            return res.status(200).json({section: section})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})


sectionRouter.post("/", adminValidator, async (req, res) => {
    const {photo, name, subSections, products} = req.body
    try {
        if (subSections?.length > 0) subSections.forEach(subSection => new ObjectId(subSection))

        if (products?.length > 0) products.forEach(product => new ObjectId(product))

        const section = new Section({
            photo: photo, name: name, subSections: subSections, products: products
        })

        await section.save()

        return res.status(201).json({
            message: "Successfully created", section: section
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})


//PUT
sectionRouter.put("/promotion", adminValidator, async (req, res) => {
        const {discount, isActive} = req.body
        const {id} = req.query
        try {
            if (!id) return res.status(404).json({error: "Section not found"})

            const section = await Section.findById(id).select('products').lean()

            const products = await Product.find({_id: {$in: section.products}}).select('price promotion').lean()

            const bulkOperations = products.map(product => {
                const newPrice = discount ? product.price * discount : product.promotion.newPrice
                return {
                    updateOne: {
                        filter: {_id: product._id}, update: {
                            $set: {
                                'promotion.isActive': isActive, ...(discount && {'promotion.newPrice': newPrice})
                            }
                        }
                    }
                }
            })

            await Product.bulkWrite(bulkOperations)

            return res.status(200).json({message: "Products updated successfully"})
        } catch (e) {
            return res.status(500).json({error: e.message})
        }
    }
)

sectionRouter.delete("/", adminValidator, async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            await Section.deleteMany()
            return res.status(201).json({message: "Deleted"})
        } else {
            const ids = await convertToArray(id)
            await Section.deleteMany({_id: {$in: ids}})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//SUBSECTIONS
sectionRouter.get("/subsections", async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            const subSections = await SubSection.find()
            return res.status(200).json({subSection: subSections})
        } else {
            const subsection = await SubSection.findById(id).lean()
            if (!subsection) {
                return res.status(404).json({error: "SubSection not found"})
            }

            const products = await Product.find({_id: {$in: subsection.products}}).lean()
            subsection.products = await productReviews(products)

            return res.status(200).json({subsection: subsection})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

sectionRouter.post("/subsection", adminValidator, async (req, res) => {
    const {name, products} = req.body
    const {id} = req.query
    try {
        if (!id)
            return res.status(404).json({error: "Section not found"})

        const subSection = new SubSection({
            name: name, products: products
        })

        const updated = await Section.updateOne(
            {_id: id},
            {$push: {subSections: subSection._id}}
        )

        if (updated.modifiedCount === 0)
            return res.status(400).json({error: "SubSection not created"})

        await subSection.save()

        return res.status(201).json({
            message: "Successfully created", subSection: subSection
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

sectionRouter.delete("/subsections", adminValidator, async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            await SubSection.deleteMany()
            await Section.updateMany({}, {$set: {subSections: []}})
            return res.status(201).json({message: "Deleted"})
        } else {
            const ids = await convertToArray(id)
            await SubSection.deleteMany({_id: {$in: ids}})
            await Section.updateMany({subSections: {$in: ids}}, {$pull: {subSections: {$in: ids}}})
            return res.status(201).json({message: "Deleted"})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

module.exports = sectionRouter