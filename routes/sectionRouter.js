const sectionRouter = require("express").Router()

const Section = require("../models/sectionModel")
const SubSection = require("../models/subSectionModel")
const Product = require("../models/productModel")

const {sectionProducts, sectionSubSections, productReviews} = require("../vars/functions");

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

module.exports = sectionRouter