import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {io} from "socket.io-client";

const AdminChat = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [accToken, setAccToken] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setShowModal(true);
        } else {
            setAccToken(token)
            setShowModal(false);
            setIsLoggedIn(true);
            fetchChats(token).then();
        }

        socket?.on("message", (msg) => {
            console.log(msg)
            setMessages((prevMessages) => [...prevMessages, msg])
        })
        return () => {
            socket?.disconnect();
        };
    }, [socket]);

    const fetchChats = async (token) => {
        await axios.get('http://localhost:8080/admin/chats', {
            headers: {
                Authorization: token
            }
        }).then(res => {
            setChats(res.data.chats);
        }).catch(err => {
            console.error(err);
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        await axios.post('http://localhost:8080/admin/login', {
            username: username,
            password: password
        }).then(res => {
            const token = `accessToken=${res.data.accessToken}`
            localStorage.setItem('token', token);
            setAccToken(token)
            setIsLoggedIn(true);
            setShowModal(false);
            fetchChats(token)
        }).catch(err => {
            console.error(err);
        });
    };

    const handleChatSelect = (chat) => {
        const newSocket = io("http://localhost:8080", {
            query: {token: accToken, chat: chat._id},
        })
        newSocket.on("connected", data => {
            if (data.chat) {
                setSelectedChat(data.chat);
                setMessages(data.chat.messages)
            }
            setUser(data.id)
        })
        setSocket(newSocket);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        socket.emit("message", newMessage)
        setNewMessage("")
    };

    return (
        <div style={{display: 'flex'}}>
            {showModal && (
                <div className="modal">
                    <form onSubmit={handleLogin}>
                        <h2>Вхід як адміністратор</h2>
                        <input
                            type="text"
                            placeholder="Логін"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button type="submit">Увійти</button>
                    </form>
                </div>
            )}
            {isLoggedIn && (
                <>
                    <div style={{width: '30%', borderRight: '1px solid #ccc', padding: '10px'}}>
                        <h2>Чати</h2>
                        <ul>
                            {chats.map((chat, index) => (
                                <li key={index} onClick={() => handleChatSelect(chat)} style={{cursor: 'pointer'}}>
                                    {chat.chatName}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div style={{padding: '10px', width: '70%'}}>
                        {selectedChat ? (
                            <>
                                <h3>{selectedChat.chatName}</h3>
                                <div>
                                    {messages.map((msg, index) => (
                                        <div key={index} style={{ color: msg.sender === user ? 'green' : 'red' }}>
                                            {msg.image ? (
                                                <div>
                                                    <img src={msg.image} alt="" style={{maxWidth: '200px'}}/>
                                                    <p>{msg.text}</p>
                                                </div>
                                            ) : (
                                                <p>{msg.text}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleSendMessage} style={{marginTop: '20px'}}>
                                    <input
                                        type="text"
                                        placeholder="Ваше повідомлення"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        style={{width: '80%'}}
                                    />
                                    <button type="submit">Відправити</button>
                                </form>
                            </>
                        ) : (
                            <p>Оберіть чат для перегляду.</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminChat;
