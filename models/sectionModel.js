const mongoose = require("mongoose")

const sectionSchema = new mongoose.Schema({
        image: [{
            imageName: String,
            imageUrl: String,
        }],
        name: {
            type: String,
            required: true,
            unique: true
        },
        subSections: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "SubSection"
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

sectionSchema.path("image").schema.set('_id', false)

const Section = mongoose.model("Section", sectionSchema)

module.exports = Section