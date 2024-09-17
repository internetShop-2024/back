const mongoose = require('mongoose')

const packSchema = new mongoose.Schema({
        packName: {
            type: String,
            required: true,
            unique: true
        },
        image: String,
        article: String,
        price: Number,
        section: mongoose.Schema.Types.ObjectId,
        products: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Product"
        },
        display: {
            type: Boolean,
            default: true
        },
        createdAt: {
            type: Date,
            default: Date.now()
        }
    }, {
        versionKey: false
    }
)

const Pack = mongoose.model("Pack", packSchema)

module.exports = Pack