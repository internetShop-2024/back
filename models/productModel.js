const mongoose = require("mongoose")
const productSchema = new mongoose.Schema({
        image: {
            type: [String],
            required: true,
        },
        name: {
            type: String,
            required: true,
            unique: true
        },
        price: {
            type: Number,
            required: true
        },
        article: {
            type: Number,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        characteristics: String,
        video: String,
        reviews: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Review"
        },
        promotion: {
            isActive: {
                type: Boolean,
                default: false
            },
            newPrice: Number,
        },
        quantity: {
            type: Number,
            default: 0
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

productSchema.pre('save', function (next) {
    if (this.quantity === 0) {
        this.display = false;
    }
    next()
})
productSchema.path("history").schema.set('_id', false)

const Product = mongoose.model("Product", productSchema)

module.exports = Product