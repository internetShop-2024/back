const crypto = require('crypto')
const {monoXSIGN} = require("../vars/privateVars")

const monobankValidator = async (req, res, next) => {
    const publicKeyBuf = Buffer.from(monoXSIGN, 'base64')

    const xSignBase64 = req.headers['x-sign']
    if (!xSignBase64) return res.status(403).json({message: "Invalid signature"})
    const signatureBuf = Buffer.from(xSignBase64, 'base64')
    console.log(publicKeyBuf)
    console.log(signatureBuf)

    const algorithm = 'SHA256'
    const message = JSON.stringify(req.body)

    const isValid =  crypto.verify(algorithm, message, publicKeyBuf, signatureBuf)

    if (!isValid) {
        return res.status(403).json({message: "Invalid signature"})
    }

    next()
}

module.exports = monobankValidator