const {Server} = require('socket.io');
const {validateToken} = require("./vars/functions")

const Chat = require("./models/chatModel");
const User = require("./models/userModel");

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*'
        }
    })

    io.on('connection', async (socket) => {
        let {token, chat} = socket.handshake.query
        let decoded = await validateToken(token, "JWT")
        let chats
        if (!decoded) {
            const tokenMatch = socket.handshake.query.token.match(/accessToken=([^;]+)/)
            token = tokenMatch ? tokenMatch[1] : null
            decoded = await validateToken(token, "AT")
            if (!decoded) socket.disconnect()
            chats = await Chat.findById(chat)
        } else {
            chats = await Chat.findOne({user: decoded?.id})
        }
        socket.emit("connected", {chat: chats?.toObject(), id: decoded?.id})

        socket.join(chats?._id.toString())

        socket.on("message", (msg) => {
            const message = {
                text: msg,
                sender: decoded.id,
                sendAt: Date.now()
            }
            chats?.messages.push(message)
            chats?.save()
            io.to(chats?._id.toString()).emit("message", message)
        })
    });

    console.log(`Socket.IO started`)
};

module.exports = {initSocket}
