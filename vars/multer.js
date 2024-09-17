const multer = require("multer")

const storage = multer.memoryStorage()

const filter = (req, file, cb) => {
    try {
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg"]
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('Invalid file type. Only JPG and PNG are allowed.'), false)
        }
    } catch (e) {
        throw new Error(e)
    }
}

const upload = multer({
    storage: storage,
    fileFilter: filter,
    limit: {fileSize: 5 * 1024 * 1024},
})

module.exports = upload