const express = require("express")
const {json} = require("express");
const logger = require("morgan")
const cors = require("cors")
const mongoose = require("mongoose")
const cookieParser = require("cookie-parser")

const {port, mongoUri} = require("./vars/privateVars")
const router = require("./routes/mainRouter")

const app = express()

app.use(logger("combined"))
app.use(json())
app.use(cors("*"))
app.use("/", router)
app.use(cookieParser())

mongoose.connect(mongoUri).then(() => {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`)
    })
}).catch(e => {
    console.error(e)
})


