const {csrfProtection} = require("../vars/publicVars")

const checkCsrfToken = (req, res, next) => {
    const csrfToken = req.headers['x-xsrf-token']
    if (!csrfToken)
        return res.status(403).json({error: 'CSRF токен не знайдено'});

    csrfProtection(req, res, (err) => {
        if (err) {
            return res.status(403).json({error: 'Невірний CSRF токен'})
        }
        next()
    })
}

module.exports = checkCsrfToken