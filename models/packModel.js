const mongoose = require('mongoose')

const packSchema = new mongoose.Schema({
    packName: {
        type: String,
        required: true,
        unique: true
    },
    photo: String,
    article: String,
    price: Number,
    section: mongoose.Schema.Types.ObjectId,
    products: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Product"
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

const Pack = mongoose.model("Pack", packSchema)

module.exports = Pack