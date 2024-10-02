const mongoose = require("mongoose")

const blogSchema = new mongoose.Schema({
        publicationDate: {
            type: Date,
            default: Date.now
        },
        title: {
            type: String,
            required: true
        },
        text: {
            type: String,
            required: true
        },
        image: [{
            imageName: String,
            imageUrl: String,
        }],
        video: String,
        sections: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Section"
        },
        subSections: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "SubSection"
        },
        display: {
            type: Boolean,
            default: true
        }
    },
    {
        versionKey: false
    }
)

blogSchema.path("image").schema.set('_id', false)

const Blog = mongoose.model("Blog", blogSchema)

module.exports = Blog
