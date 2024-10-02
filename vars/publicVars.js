const rateLimit = require("express-rate-limit")
const csurf = require("csurf")

const csrfProtection = csurf({cookie: true})

const perPage = 18

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 50,
    message: {error: "Пацики,не грузіть сервер.Трохи спокійніше)"}
})

module.exports = {csrfProtection, perPage, limiter}