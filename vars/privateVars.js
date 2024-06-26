require("dotenv").config()

const port = process.env.PORT
const psql = process.env.PSQL

module.exports = {port, psql}