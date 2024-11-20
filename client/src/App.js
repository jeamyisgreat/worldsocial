// This file handles requests to the ATProto API and serves as a gateway for the frontend.

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// ** Route: User Login to Get Access Token **
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const response = await axios.post(
            `${config.atprotoApiUrl}/auth/login`,
            { username, password }
        );
        const accessToken = response.data.access_token;
        res.json({ accessToken });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Error during login.');
    }
});

// ** Route: Fetch Global Feed **
app.get('/api/global-feed', async (req, res) => {
    const { accessToken } = req.headers;
    try {
        const response = await axios.get(
            `${config.atprotoApiUrl}/feed/global`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching global feed:', error);
        res.status(500).send('Error fetching global feed.');
    }
});

// ** Route: Post Emoji Status **
app.post('/api/post-status', async (req, res) => {
    const { emoji } = req.body;
    const { accessToken } = req.headers;
    try {
        const response = await axios.post(
            `${config.atprotoApiUrl}/status/update`,
            { status: emoji },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        res.json({ success: true, response: response.data });
    } catch (error) {
        console.error('Error posting emoji status:', error);
        res.status(500).send('Error posting emoji status.');
    }
});

// The "catchall" handler: for any request that doesn't match an API route, send back React's index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// ** config.js - Configuration File **
// You need to update these values before running the server.

module.exports = {
    atprotoApiUrl: 'https://bsky.social/xrpc', // Example ATProto API base URL
};

// ** Frontend: React Application (client/src/App.js) **
// This frontend connects to the backend and renders the global feed.

import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';

function App() {
    const [feed, setFeed] = useState([]);
    const [emoji, setEmoji] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [accessToken, setAccessToken] = useState('');

    const login = async () => {
        try {
            const response = await axios.post('/api/login', { username, password });
            setAccessToken(response.data.accessToken);
            alert('Login successful!');
            fetchGlobalFeed(response.data.accessToken);
        } catch (error) {
            console.error('Error during login:', error);
            alert('Login failed. Please check your credentials.');
        }
    };

    const fetchGlobalFeed = async (token) => {
        try {
            const response = await axios.get('/api/global-feed', {
                headers: {
                    accessToken: token,
                },
            });
            setFeed(response.data);
        } catch (error) {
            console.error('Error fetching global feed:', error);
        }
    };

    const postStatus = async () => {
        try {
            await axios.post('/api/post-status', { emoji }, {
                headers: {
                    accessToken: accessToken,
                },
            });
            alert('Emoji status posted!');
            fetchGlobalFeed(accessToken);
        } catch (error) {
            console.error('Error posting emoji status:', error);
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Bluesky Global Feed</h1>
                {!accessToken ? (
                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button onClick={login}>Login</button>
                    </div>
                ) : (
                    <div>
                        <input
                            type="text"
                            placeholder="Enter Emoji"
                            value={emoji}
                            onChange={(e) => setEmoji(e.target.value)}
                        />
                        <button onClick={postStatus}>Post Status</button>
                    </div>
                )}
                <div className="feed">
                    {feed.length > 0 ? (
                        feed.map((item, index) => (
                            <div key={index} className="feed-item">
                                <p><strong>{item.username}</strong>: {item.content}</p>
                            </div>
                        ))
                    ) : (
                        <p>Loading feed...</p>
                    )}
                </div>
            </header>
        </div>
    );
}
