const {Server} = require('socket.io');
const {validateToken} = require("./vars/functions");

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*'
        }
    })

    io.on('connection', async (socket) => {
        let token = socket.handshake.query.token
        let decoded = await validateToken(token, "JWT")
        if (!decoded) {
            const tokenMatch = socket.handshake.query.token.match(/accessToken=([^;]+)/)
            token = tokenMatch ? tokenMatch[1] : null
            decoded = await validateToken(token, "AT")
        }

        if (!decoded) {
            socket.disconnect()
        } else {
            socket.emit("connected")
            socket.on("message", (msg) => {

                io.emit("message", msg)
            })
        }
    });

    console.log(`Socket.IO started`)
};

module.exports = {initSocket}
