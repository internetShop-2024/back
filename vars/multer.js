const multer = require("multer")
const fs = require("fs")

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
})

const upload = multer({storage: storage});

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

module.exports = upload