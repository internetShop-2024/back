const {validateToken, tokenAssign} = require("../vars/functions")

const User = require("../models/userModel")

const authValidator = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "")
        if (!token) return res.status(401).json({error: 'Unauthorized'})
        let user = await validateToken(token, "JWT")
        if (!user) {
            const refreshToken = req.headers.refreshtoken?.replace("Bearer ", "")
            const decoded = await validateToken(refreshToken, "RT")
            if (!decoded) return res.status(401).json({error: 'Unauthorized'})
            user = await User.findById(decoded.id).lean("refreshToken")

            if (!user || user.refreshToken !== refreshToken) return res.status(401).json({error: 'Unauthorized'})

            const {JWT} = await tokenAssign(user._id, false)

            req.token = JWT
            req.userId = user._id
            next()
        }
        req.userId = user.id
        next()
    } catch
        (e) {
        return res.status(400).json({error: e.message})
    }
}

module.exports = authValidator
