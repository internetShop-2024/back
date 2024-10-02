const mongoose = require("mongoose")

const subSectionSchema = new mongoose.Schema({
        image: [{
            imageName: String,
            imageUrl: String,
        }],
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

subSectionSchema.path("image").schema.set('_id', false)

const SubSection = mongoose.model("SubSection", subSectionSchema)

module.exports = SubSection