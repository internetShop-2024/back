const express = require("express")
const {json} = require("express");
const logger = require("morgan")
const cors = require("cors")
const mongoose = require("mongoose")
const cookieParser = require("cookie-parser")
const rateLimit = require("express-rate-limit")
const bodyParser = require("body-parser")

const {port, mongoUri} = require("./vars/privateVars")
const router = require("./routes/mainRouter")

const app = express()
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 50,
    message: {error: "Пацики,не грузіть сервер.Трохи спокійніше)"}
})

app.set('trust proxy', 'loopback, linklocal, uniquelocal')
app.use(bodyParser.json())
app.use(limiter)
app.use(logger("combined"))
app.use(json())
app.use(cors("*"))
app.use("/", router)
app.use(cookieParser)

mongoose.connect(mongoUri).then(() => {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`)
    })
}).catch(e => {
    console.error(e)
})


