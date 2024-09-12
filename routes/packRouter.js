const packRouter = require("express").Router()

const Pack = require("../models/packModel")

const {perPage} = require("../vars/publicVars")
const {filterSystem} = require("../vars/functions")

packRouter.get("/", async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const {id} = req.query

    const allowedParams = ['price', 'sectionId', 'subSectionId', 'sortBy', 'orderBy']
    const newObject = Object.fromEntries(
        Object.entries(req.query)
            .filter(([key, value]) => allowedParams.includes(key) && value !== undefined))

    try {
        if (req.query.sectionId !== undefined && req.query.subSectionId !== undefined) {
            throw new Error("You must provide only one of sectionId or subSectionId")
        }
        if (!id) {
            const data = await filterSystem(newObject)
            const totalPacks = await Pack.countDocuments()
            const packs = await Pack.find(data.payload)
                .select("-__v -createdAt")
                .skip((page - 1) * perPage)
                .limit(perPage)
                .sort(data.sortOptions)
                .lean()
            if (!packs.length) return res.status(404).json({error: "No Packs Found"})
            return res.status(200).json({
                packs: packs, currentPage: page, totalPages: Math.ceil(totalPacks / perPage)
            })
        } else {
            const pack = await Pack.findById(id)
            if (!pack) return res.status(404).json({error: "No Pack Found"})
            return res.status(200).json({pack: pack})
        }
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

module.exports = packRouter