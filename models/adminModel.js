const mongoose = require("mongoose")

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    calls: [{
        callPhone: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        text: String
    }],
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

adminSchema.path("calls").schema.set("_id", false)

const Admin = mongoose.model("Admin", adminSchema)

module.exports = Admin