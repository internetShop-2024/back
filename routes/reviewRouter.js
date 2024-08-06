const reviewRouter = require("express").Router()

const Review = require("../models/reviewModel")
const Product = require("../models/productModel")

const authValidator = require("../validators/authValidator");
const adminValidator = require("../validators/adminValidator");

//POST
reviewRouter.post("/", authValidator, async (req, res) => {
    const {text} = req.body
    const {id} = req.query
    try {
        const review = new Review({
            reviewSenderId: req.user._id,
            product: id,
            content: {text: text}
        })

        const updated = await Product.updateOne(
            {_id: id},
            {$push: {reviews: review._id}}
        )

        if (updated.modifiedCount === 0)
            return res.status(400).json({error: "Review not created"})

        await review.save()
        return res.status(201).json({
            message: "Successfully created", review: review
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

//DELETE
reviewRouter.delete("/", adminValidator, async (req, res) => {
    const {id} = req.query
    try {
        if (!id) {
            await Review.deleteMany()
            await Product.updateMany({}, {$pull: {reviews: {$in: []}}})
        } else {
            await Review.deleteOne({_id: id})
            await Product.updateMany({_id: id}, {$pull: {reviews: id}})
        }
        return res.status(201).json({message: "Successfully deleted"})
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

module.exports = reviewRouter