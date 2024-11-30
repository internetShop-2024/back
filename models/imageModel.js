const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    imageId: {
        type: String,
        required: true,
    },
    imageName: {
        type: String,
        required: true,
    },
}, {
    versionKey: false
})

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;