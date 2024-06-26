const express = require("express")
const {json} = require("express");
const logger = require("morgan")
const cors = require("cors")
const router = require("./routes/mainRouter")

const {port} = require("./vars/privateVars")

const app = express()

app.use(logger("combined"))
app.use(json())
app.use(cors("*"))
app.use("/", router)
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})


