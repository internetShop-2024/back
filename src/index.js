import React from 'react';
import ReactDOM from 'react-dom/client';
import Chat from "./Chat";
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom"
import AdminChat from "./AdminChat";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Router>
        <Routes>
            <Route index path="/" element={<Chat/>}></Route>
            <Route path="/admin" element={<AdminChat/>}></Route>
        </Routes>
    </Router>
);
