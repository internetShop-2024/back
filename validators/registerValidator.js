const {validateEmail, validatePassword, validateFullname, validatePhone} = require("../vars/functions");
const registerValidator = async (req, res, next) => {
    if (!validateEmail(req.body.email))
        return res.status(400).json({error: "Invalid Email"})

    if (!validatePassword(req.body.password))
        return res.status(400).json({error: "Password is invalid"})

    if (!validateFullname(req.body.fullname))
        return res.status(400).json({error: "Invalid fullname"})

    if (!validatePhone(req.body.phone))
        return res.status(400).json({error: "Invalid phone"})

    next()
}

module.exports = registerValidator