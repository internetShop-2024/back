const {Sequelize} = require("sequelize");
const {psql} = require("./privateVars")

const [dialect, database, username, password, host] = psql.split(":")

const sequelize = new Sequelize({
    dialect: dialect,
    database: database,
    user: username,
    password: password,
    host: host,
    ssl: true,
})

module.exports = sequelize