const mongoose = require("mongoose")
const productSchema = new mongoose.Schema({
        models: [{
            image: [{
                imageName: String,
                imageUrl: String,
            }],
            name: {
                type: String,
                required: true,
                unique: true
            },
            price: {
                type: Number,
                required: true
            },
            quantity: {
                type: Number,
                default: 0
            },
            promotion: {
                isActive: {
                    type: Boolean,
                    default: false
                },
                newPrice: Number,
            },
            display: {
                type: Boolean,
                default: true
            },
            description: {
                type: String,
                required: true
            },
            characteristics: String,
        }],
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

productSchema.pre('save', function (next) {
    if (this.quantity <= 0) {
        this.display = false;
    }
    next()
})
productSchema.path("history").schema.set('_id', false)
productSchema.path("models.image").schema.set('_id', false)
productSchema.path("models").schema.set('_id', true)

const Product = mongoose.model("Product", productSchema)

module.exports = Product