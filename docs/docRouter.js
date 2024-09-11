const path = require("node:path");
const docRouter = require("express").Router()

docRouter.get("/api-docs", (req, res) => {
    return res.sendFile(path.join(__dirname, "./index.html"))
})

docRouter.get("/openapi.json", (req, res) => {
    return res.json(require('./openapi.json'))
})

module.exports = docRouter