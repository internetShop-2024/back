const multer = require("multer")

const storage = multer.memoryStorage()

const upload = multer({
    storage: storage,
    limits: {fileSize: 5 * 1024 * 1024},
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|pdf/
        const mimetype = filetypes.test(file.mimetype)
        if (mimetype) cb(null, true)
        else cb(null, false)
    },
});

module.exports = upload