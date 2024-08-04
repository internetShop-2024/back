const {validateToken, tokenAssign} = require("../vars/functions")
const User = require("../models/userModel")

const authValidator = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    if (!token) {
        return res.status(401).json({error: 'Unauthorized'})
    }

    const tokenMatch = req.headers.cookie?.match(/refreshToken=([^;]+)/)
    const refreshToken = tokenMatch ? tokenMatch[1] : null
    if (!refreshToken) {
        return res.status(401).json({error: 'Refresh token missing'})
    }

    try {
        let user = await validateToken(token, "JWT")
        if (!user) {
            const decoded = await validateToken(refreshToken, "RT")

            user = await User.findById(decoded._id)

            if (!user || user.refreshToken !== refreshToken) {
                return res.status(401).json({error: 'Invalid refresh token'})
            }

            const {JWT, RT: NRT} = await tokenAssign(user)

            user.refreshToken = NRT
            await user.save()

            res.cookie('refreshToken', NRT, {httpOnly: true, secure: true})
            req.token = JWT
            req.user = user.toObject()
            return next()
        }
        req.user = user
        return next()
    } catch (e) {
        return res.status(400).json({error: e.message})
    }
}

module.exports = authValidator
