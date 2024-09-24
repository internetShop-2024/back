const mongoose = require('mongoose')

const packSchema = new mongoose.Schema({
        packName: {
            type: String,
            required: true,
            unique: true
        },
        image: String,
        video: String,
        description: String,
        quantity: Number,
        article: String,
        price: Number,
        section: mongoose.Schema.Types.ObjectId,
        products: [{
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: [true, "Продукт потрібно добавити до паку"]
            },
            quantity: {
                type: Number,
                required: [true, "Вкажіть кількість продукту"]
            }
        }],
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

packSchema.path("products").schema.set('_id', false)

const Pack = mongoose.model("Pack", packSchema)

module.exports = Pack