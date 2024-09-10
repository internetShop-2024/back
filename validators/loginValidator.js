const {validateEmail, passwordCompare} = require("../vars/functions");
const User = require("../models/userModel");
const loginValidator = async (req, res, next) => {
    try {
        const email = req.body.email
        if (!validateEmail(email))
            return res.status(400).json({error: "Invalid Email"})

        const user = await User.findOne({email: email})
        if (!user)
            return res.status(400).json({error: "Invalid Email or Password"})

        if (!await passwordCompare(user.password, req.body.password))
            return res.status(400).json({error: "Invalid Email or Password"})

        req.user = user
        next()
    } catch (e) {
        return res.status(400).json({error: e.message})
    }
}

module.exports = loginValidator