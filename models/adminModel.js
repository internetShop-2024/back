const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

const adminSchema = new mongoose.Schema({
        username: {
            type: String,
            required: [true, 'Username потрібно вказати'],
            unique: true
        },
        password: {
            type: String,
            required: [true, 'Password потрібно вказати'],
        },
        calls: [{
            callPhone: {
                type: String,
                required: [true, 'Phone потрібно вказати'],
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
    },
    {
        versionKey: false
    }
)

adminSchema.path("calls").schema.set("_id", false)
adminSchema.plugin(uniqueValidator, {message: '{PATH} повторяється'})

const Admin = mongoose.model("Admin", adminSchema)

module.exports = Admin