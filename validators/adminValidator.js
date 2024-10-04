const {validateToken} = require("../vars/functions")

const adminValidator = async (req, res, next) => {
    try {
        const tokenMatch = req.headers.authorization?.match(/accessToken=([^;]+)/)
        const token = tokenMatch ? tokenMatch[1] : null
        if (!token)
            return res.status(401).json({error: 'Unauthorized'})

        const admin = await validateToken(token, 'AT')
        if (!admin)
            return res.status(401).json({error: 'Unauthorized'})

        req.adminId = admin.id
        next()
    } catch (e) {
        return res.status(400).json({error: e.message})
    }
}

module.exports = adminValidator