import {io} from 'socket.io-client';
import React, {useEffect, useState} from 'react';
import axios from "axios";

const ChatComponent = () => {
    const [socket, setSocket] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [showModal, setShowModal] = useState(false)
    const [user, setUser] = useState(null);

    useEffect(() => {
        setToken(localStorage.getItem('token'))

        const newSocket = io('http://localhost:8080', {
            query: {token},
        });

        newSocket.on("connected", data => {
            setIsAuthenticated(true);
            if (data.chat) {
                setChat(data.chat)
                setMessages(data.chat.messages)
            }
            setUser(data.id)
        })

        newSocket.on('message', (msg) => {
            setMessages((prevMessages) => [...prevMessages, msg])
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsAuthenticated(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token]);

    const handleLogin = async (e) => {
        e.preventDefault();
        axios.post("http://localhost:8080/users/authorization", {
            email: username,
            password: password
        })
            .then(res => {
                localStorage.setItem("token", res.data.accessToken);
                setIsAuthenticated(true)
                setShowModal(false)
            })
            .catch(err => {
                console.log(err)
            })
    };

    const handleSendMessage = async () => {
        if (isAuthenticated) {
            if (!chat) {
                await axios.post("http://localhost:8080/chats",
                    {
                        text: message,
                    },
                    {
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    }
                ).then(res => {
                    setChat(res.data.chat)
                    setMessages(res.data.chat.messages)
                }).catch(err => {
                    console.error(err)
                })
            } else {
                console.log(user)
                socket.emit('message', message);
                setMessage('');
            }
        } else {
            setShowModal(true);
        }
    };

    return (
        <div>
            <h1>Chat Application</h1>

            {/* Блок чату */}
            <div>
                <h2>{chat ? chat?.chatName : "Chat"}</h2>
                <div>
                    {messages.map((msg, index) => (
                        <div key={index} style={{ color: msg.sender === user ? 'green' : 'red' }}>
                            {msg.image && <img src={msg.image} alt="" style={{maxWidth: '200px'}}/>}

                            {msg.text && <p>{msg.text}</p>}
                        </div>
                    ))}
                </div>

                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={!isAuthenticated}
                />
                <button onClick={handleSendMessage}>
                    Send
                </button>
                {!isAuthenticated && <p>Please log in to send messages.</p>}
            </div>

            {/* Модалка для логіна */}
            {showModal && (
                <div style={modalStyles}>
                    <div style={modalContentStyles}>
                        <h2>Login</h2>
                        <form onSubmit={handleLogin}>
                            <div>
                                <label>
                                    Username:
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </label>
                            </div>
                            <div>
                                <label>
                                    Password:
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </label>
                            </div>
                            <button type="submit">Login</button>
                            <button type="button" onClick={() => setShowModal(false)}>Close</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Стилі для модалки
const modalStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

const modalContentStyles = {
    background: 'white',
    padding: '20px',
    borderRadius: '5px',
    minWidth: '300px',
};

export default ChatComponent;
