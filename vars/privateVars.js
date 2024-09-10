require("dotenv").config()

const port = process.env.PORT
const mongoUri = process.env.MONGO_URI
const secretJWT = process.env.SECRET_JWT
const secretRT = process.env.SECRET_RT
const secretAT = process.env.SECRET_AT
const monoXSIGN = process.env.MONO_XSIGN

module.exports = {port, mongoUri, secretJWT, secretRT, secretAT, monoXSIGN}