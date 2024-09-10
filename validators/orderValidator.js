const {validateFullname, validatePhone} = require("../vars/functions");
const orderValidator = async (req, res, next) => {
    try {
        if (req.body.localStorage?.length === 0)
            return res.status(400).json({error: "Please select goods"})

        if (!validateFullname(req.body.fullname))
            return res.status(400).json({error: 'Invalid fullname'})

        if (!validatePhone(req.body.phone))
            return res.status(400).json({error: 'Invalid phone number'})

        if (req.body.cost < 400)
            return res.status(400).json({error: 'Minimum order amount is 400 UAH'})

        next()
    } catch (e) {
        return res.status(400).json({error: e.message})
    }
}

module.exports = orderValidator