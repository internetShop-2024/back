const sectionRouter = require("express").Router()
const ObjectId = require("mongoose").Types.ObjectId

const Section = require("../models/sectionModel")
const SubSection = require("../models/subSectionModel")
const Product = require("../models/productModel")
const Review = require("../models/reviewModel")

sectionRouter.get("/", async (req, res) => {
    try {
        const sections = await Section.find()
        return res.status(200).json({sections: sections})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

sectionRouter.get("/subsections", async (req, res) => {
    try {
        const subSections = await SubSection.find()
        return res.status(200).json({subSection: subSections})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

sectionRouter.get("/:id", async (req, res) => {
        try {
            const sectionId = req.params.id
            const section = await Section.findById(sectionId).lean()
            if (!section) {
                return res.status(404).json({error: "Section not found"})
            }

            if (section.products?.length > 0) {
                const products = await Product.find({_id: {$in: section.products}}).lean()
                section.products = await Promise.all(products.map(async product => {
                    if (product.reviews && product.reviews.length > 0) {
                        product.reviews = await Review.find({_id: {$in: product.reviews}}).select("-product").lean()
                    }
                    return product
                }))
            }

            if (section.subSections?.length > 0) {
                const subSections = await SubSection.find({_id: {$in: section.subSections}}).lean()

                await Promise.all(subSections.map(async subSection => {
                    if (subSection.products.length > 0) {
                        const products = await Product.find({_id: {$in: subSection.products}}).lean()
                        subSection.products = await Promise.all(products.map(async product => {
                            if (product.reviews && product.reviews.length > 0) {
                                product.reviews = await Review.find({_id: {$in: product.reviews}}).select("-product").lean()
                            }
                            return product
                        }))
                    }
                }))
                section.subSections = subSections
            }
            return res.status(200).json({section: section})
        } catch (e) {
            return res.status(500).json({error: e.message})
        }
    }
)

sectionRouter.get("/subsection/:id", async (req, res) => {
    try {
        const subsectionId = req.params.id
        const subsection = await SubSection.findById(subsectionId).lean()
        if (!subsection) {
            return res.status(404).json({error: "SubSection not found"})
        }

        const products = await Product.find({_id: {$in: [subsection.products]}}).lean()
        subsection.products = await Promise.all(products.map(async product => {
            if (product.reviews && product.reviews.length > 0) {
                product.reviews = await Review.find({_id: {$in: product.reviews}}).select("-product").lean()
            }
            return product
        }))

        return res.status(200).json({subsection: subsection})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

sectionRouter.post("/", async (req, res) => {
    const {photo, name, subSections, products} = req.body
    try {
        if (subSections?.length > 0)
            subSections.forEach(subSection => new ObjectId(subSection))

        if (products?.length > 0)
            products.forEach(product => new ObjectId(product))

        const section = new Section({
            photo: photo,
            name: name,
            subSections: subSections,
            products: products
        })

        await section.save()

        return res.status(201).json({
            message: "Successfully created",
            section: section
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

sectionRouter.post("/:id/subsection", async (req, res) => {
    const {name, products} = req.body
    try {
        const section = await Section.findById(req.params.id)

        if (!section)
            return res.status(404).json({error: "Section not found"})

        if (products?.length > 0)
            products.forEach(product => new ObjectId(product))

        const subSection = new SubSection({
            name: name,
            products: products
        })

        section.subSections.push(subSection)

        await subSection.save()
        await section.save()

        return res.status(201).json({
            message: "Successfully created",
            subSection: subSection
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//PUT
sectionRouter.put("/promotion", async (req, res) => {
    const {discount, isActive} = req.body
    const {id} = req.query
    try {
        if (!id)
            return res.status(404).json({error: "Section not found"})

        const section = await Section.findById(id).select('products').lean()

        const products = await Product.find({_id: {$in: section.products}}).select('price promotion').lean()

        const bulkOperations = products.map(product => {
            const newPrice = discount ? product.price * discount : product.promotion.newPrice
            return {
                updateOne: {
                    filter: {_id: product._id},
                    update: {
                        $set: {
                            'promotion.isActive': isActive,
                            ...(discount && {'promotion.newPrice': newPrice})
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
})

sectionRouter.delete("/", async (req, res) => {
    await Section.deleteMany()
    await SubSection.deleteMany()
    return res.status(201).json({message: "Deleted"})
})

sectionRouter.delete("/:id", async (req, res) => {
    try {
        const sectionId = req.params.id
        if (!sectionId)
            return res.status(404).json({error: "Section not found"})

        await Section.deleteOne({_id: sectionId})
        return res.status(201).json({message: "Deleted"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

sectionRouter.delete("/subsection/:id", async (req, res) => {
    try {
        const subSectionId = req.params.id
        if (!subSectionId)
            return res.status(404).json({error: "SubSection not found"})

        await SubSection.deleteOne({_id: subSectionId})
        return res.status(201).json({message: "Deleted"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

module.exports = sectionRouter