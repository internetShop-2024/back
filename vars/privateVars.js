require("dotenv").config()

const port = process.env.PORT
const mongoUri = process.env.MONGO_URI
const secretJWT = process.env.SECRET_JWT
const secretRT = process.env.SECRET_RT
const secretAT = process.env.SECRET_AT
const monoXSIGN = process.env.MONO_XSIGN
const monoPEM = process.env.MONO_PEM
const monoURL = process.env.MONO_URL
const monoWEBHOOK = process.env.MONO_WEBHOOK
const b2AppId = process.env.B2_APPID
const b2AppKey = process.env.B2_APPKEY
const b2BukId = process.env.B2_BUKID

module.exports = {
    port,
    mongoUri,
    secretJWT,
    secretRT,
    secretAT,
    monoXSIGN,
    monoPEM,
    monoURL,
    monoWEBHOOK,
    b2AppId,
    b2AppKey,
    b2BukId
}