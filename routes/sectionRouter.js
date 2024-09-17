const sectionRouter = require("express").Router()

const Section = require("../models/sectionModel")
const SubSection = require("../models/subSectionModel")
const Product = require("../models/productModel")

const {sectionProducts, sectionSubSections, productReviews, sectionPacks, convertToArray} = require("../vars/functions");

const {perPage} = require("../vars/publicVars");

sectionRouter.get("/", async (req, res) => {
    const {id} = req.query
    const page = parseInt(req.query.page) || 1
    const totalSections = await Section.countDocuments()
    try {
        if (!id) {
            const sections = await Section.find()
                .select("-__v -createdAt")
                .skip((page - 1) * perPage)
                .limit(perPage)
                .lean()
            await sectionSubSections(sections)
            return res.status(200).json({
                sections: sections, currentPage: page, totalPages: Math.ceil(totalSections / perPage)
            })
        } else {
            const section = await Section.findById(id).lean()
            if (!section) return res.status(404).json({error: "Section not found"})
            if (section.products?.length > 0) {
                await sectionProducts(section)
            }
            if (section.subSections?.length > 0) {
                await sectionSubSections(section)
            }
            if (section.packs?.length > 0) {
                await sectionPacks(section)
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
    const page = parseInt(req.query.page) || 1
    try {
        if (!id) {
            const totalSubSections = await SubSection.countDocuments()
            const subSections = await SubSection.find()
                .select("-__v -createdAt")
                .skip((page - 1) * perPage)
                .limit(perPage)
                .lean()
            return res.status(200).json({
                subSection: subSections, currentPage: page, totalPages: Math.ceil(totalSubSections / perPage)
            })
        } else {
            const subsection = await SubSection.findById(id).lean()
            if (!subsection) {
                return res.status(404).json({error: "SubSection not found"})
            }

            const products = await Product.find({section: {$in: subsection._id}}).lean()
            subsection.products = await productReviews(products)

            return res.status(200).json({subsection: subsection})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

module.exports = sectionRouter