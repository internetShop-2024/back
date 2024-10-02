const {Server} = require('socket.io');
const {validateToken} = require("./vars/functions");

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*'
        }
    })

    io.on('connection', async (socket) => {
        const token = socket.handshake.query.token
        const decoded = await validateToken(token, "JWT")
        if (!decoded) {
            console.log('Unauthorized access')
            socket.disconnect()
        } else {
            console.log("connected")
            socket.on("message", (msg) => {
                io.emit("message", msg)
            })
        }
    });

    console.log(`Socket.IO started`)
};

module.exports = {initSocket}
