const crypto = require('crypto')
const {monoXSIGN, monoPEM} = require("../vars/privateVars")

const monobankValidator = async (req, res, next) => {
    try {
        let publicKeyBuf = Buffer.from(monoPEM, 'base64')

        let xSignBase64 = req.headers['x-sign']
        if (!xSignBase64) return res.status(403).json({message: "Invalid signature"})

        let signatureBuf = Buffer.from(xSignBase64, 'base64')

        let verify = crypto.createVerify("SHA256")

        const bodyData = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body

        verify.write(bodyData)
        verify.end()

        let result = verify.verify(publicKeyBuf, signatureBuf)

        if (!result) return res.status(403).json({message: "Invalid signature"})

        next()
    } catch (e) {
        return res.status(400).json({error: e.message})
    }
}

module.exports = monobankValidator
