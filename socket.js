const {Server} = require('socket.io');
const {validateToken} = require("./vars/functions");
const Chat = require("./models/chatModel");
const User = require("./models/userModel");

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*'
        },
        transports: ['polling']
    });

    io.on('connection', async (socket) => {
        console.log(`Connected ${socket.id}`)
        let {token, chat} = socket.handshake.query
        let decoded = await validateToken(token, "JWT")
        let chats

        if (!decoded) {
            const tokenMatch = socket.handshake.query.token.match(/accessToken=([^;]+)/)
            token = tokenMatch ? tokenMatch[1] : null
            decoded = await validateToken(token, "AT")
            chats = await Chat.findById(chat)
        } else {
            chats = await Chat.findOne({user: decoded?.id})
        }

        if (!chats || !decoded) {
            socket.emit('error', 'Не вдалося знайти чат або користувача')
            socket.disconnect()
            return
        }

        socket.emit("connected", {chat: chats?.toObject(), id: decoded?.id})

        if (!socket.rooms.has(chats?._id.toString())) {
            socket.join(chats?._id.toString())
        }

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

        socket.on("disconnect", () => {
            console.log(`Disconnected ${socket.id}`)
        })
    })

    console.log(`Socket.IO started`)
};

module.exports = {initSocket}
