const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema({
        filename: {
            type: String,
            required: true
        },
        fileUrl: {
            type: String,
            required: true
        },
        fileType: String,
        fileSize: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        versionKey: false
    }
)

const Image = mongoose.model("Image", imageSchema)

module.exports = Image