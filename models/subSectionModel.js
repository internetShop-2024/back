const mongoose = require("mongoose")

const subSectionSchema = new mongoose.Schema({
        image: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'Image',
        },
        name: {
            type: String,
            required: true,
            unique: true
        },
        products: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Product"
        },
        packs: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Pack"
        },
        createdAt: {
            type: Date,
            default: Date.now()
        }
    },
    {
        versionKey: false
    }
)

const SubSection = mongoose.model("SubSection", subSectionSchema)

module.exports = SubSection