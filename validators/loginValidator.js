const {validateEmail, passwordCompare} = require("../vars/functions")
const User = require("../models/userModel")

const loginValidator = async (req, res, next) => {
    try {
        const {email, password} = req.body
        if (!email || !password)
            return res.status(400).json({error: "Заповніть всі поля"})

        if (!validateEmail(email))
            return res.status(400).json({error: "Неправильний формат електронної адреси"})

        const user = await User.findOne({email: email})
        if (!user)
            return res.status(400).json({error: "Недійсні дані"})

        if (!await passwordCompare(user.password, req.body.password))
            return res.status(400).json({error: "Недійсні дані"})

        res.setHeader('Access-Control-Expose-Headers', 'refreshToken')
        req.user = user
        next()
    } catch (e) {
        return res.status(400).json({error: e.message})
    }
}

module.exports = loginValidator