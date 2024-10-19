const express = require("express")
const {json} = require("express");
const logger = require("morgan")
const cors = require("cors")
const mongoose = require("mongoose")
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser")

const {port, mongoUri} = require("./vars/privateVars")
const {limiter} = require("./vars/publicVars");
const router = require("./routes/mainRouter")
const {initSocket} = require("./socket");

const app = express()

app.set('trust proxy', 'loopback, linklocal, uniquelocal')
app.use(bodyParser.json())
app.use(cookieParser())
app.use(limiter)
app.use(logger("combined"))
app.use(json())
app.use(cors("*"))
app.use("/", router)

mongoose.connect(mongoUri).then(() => {
    const server = app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`)
    })
    initSocket(server)
}).catch(e => {
    console.error(e)
})


