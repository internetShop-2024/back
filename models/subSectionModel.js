const mongoose = require("mongoose")

const subSectionSchema = new mongoose.Schema({
    photo: String,
    name: {
        type: String,
        required: true,
        unique: true
    },
    products: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Product"
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

const SubSection = mongoose.model("SubSection", subSectionSchema)

module.exports = SubSection