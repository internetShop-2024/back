const mongoose = require("mongoose")
const productSchema = new mongoose.Schema({
        name: {
            type: String,
            unique: true,
            required: true,
        },
        models: [{
            modelName: String,
            image: [{
                imageName: String,
                imageUrl: String,
            }],
            price: Number,
            quantity: {
                type: Number,
                default: 0
            },
            promotion: {
                isActive: {
                    type: Boolean,
                    default: false
                },
                newPrice: {
                    type: Number,
                    default: null
                },
            },
            description: {
                type: String,
            },
            characteristics: String,
        }],
        isSingle: Boolean,
        display: {
            type: Boolean,
            default: true
        },
        article: {
            type: Number,
            required: true
        },
        video: String,
        reviews: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Review"
        },
        rate: {
            type: Number,
            default: 0
        },
        section: mongoose.Schema.Types.ObjectId,
        history: [{
            column: String,
            oldValue: mongoose.Schema.Types.Mixed,
            newValue: mongoose.Schema.Types.Mixed,
            editedAt: Date
        }],
        createdAt: {
            type: Date,
            default: Date.now()
        }
    }, {
        versionKey: false
    }
)

productSchema.path("history").schema.set('_id', false)
productSchema.path("models.image").schema.set('_id', false)
productSchema.path("models").schema.set('_id', true)

const Product = mongoose.model("Product", productSchema)

module.exports = Product